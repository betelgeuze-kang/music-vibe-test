#!/usr/bin/env python3
"""Human-gated free-music candidate queue for My Music Vibe.

This tool never publishes audio. It validates provenance, creates pending entries,
and requires an explicit reviewer identity before state transitions.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_QUEUE = ROOT / "data/free-music/review-queue.json"
LICENSES_PATH = ROOT / "data/free-music/licenses.json"
ALLOWED_STATUSES = {"pending", "approved", "published", "rejected"}
ALLOWED_SCENES = {"focus", "lift", "night", "reset", "explore", "together"}
TRANSITIONS = {
    "pending": {"approved", "rejected"},
    "approved": {"published", "rejected", "pending"},
    "published": {"rejected"},
    "rejected": {"pending"},
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def https_url(value: str, label: str) -> str:
    parsed = urlparse(str(value or ""))
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValueError(f"{label} must be an absolute HTTPS URL")
    return value


def slug(value: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    if len(text) < 3:
        raise ValueError("candidate id must contain at least three ASCII letters or digits")
    return text[:80]


def licenses_by_id() -> dict[str, dict[str, Any]]:
    policy = load_json(LICENSES_PATH)
    return {item["id"]: item for item in policy["allow"]}


def validate_item(item: dict[str, Any], licenses: dict[str, dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    required = [
        "id", "title", "creator", "sourceUrl", "licenseId", "licenseUrl",
        "commercialUseAllowed", "modificationAllowed", "reviewStatus",
        "sourceSnapshotHash", "audioChecksum",
    ]
    for key in required:
        if key not in item or item[key] in (None, ""):
            errors.append(f"missing {key}")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{2,79}", str(item.get("id", ""))):
        errors.append("invalid id")
    for key in ("sourceUrl", "licenseUrl"):
        try:
            https_url(str(item.get(key, "")), key)
        except ValueError as exc:
            errors.append(str(exc))
    license_id = str(item.get("licenseId", ""))
    license_record = licenses.get(license_id)
    if not license_record:
        errors.append(f"licenseId is not allowlisted: {license_id}")
    else:
        if license_record.get("commercialUseAllowed") is not True:
            errors.append("license does not allow commercial use")
        if license_record.get("modificationAllowed") is not True:
            errors.append("license does not allow modification")
        expected = license_record.get("licenseUrl")
        if expected and item.get("licenseUrl") != expected:
            errors.append("licenseUrl does not match the allowlist record")
        if license_record.get("attributionRequired") is True and not str(item.get("attributionText", "")).strip():
            errors.append("attributionText is required")
    if item.get("commercialUseAllowed") is not True:
        errors.append("commercialUseAllowed must be true")
    if item.get("modificationAllowed") is not True:
        errors.append("modificationAllowed must be true")
    for key in ("sourceSnapshotHash", "audioChecksum"):
        if not re.fullmatch(r"[a-f0-9]{64}", str(item.get(key, ""))):
            errors.append(f"{key} must be a SHA-256 hex digest")
    status = str(item.get("reviewStatus", ""))
    if status not in ALLOWED_STATUSES:
        errors.append(f"invalid reviewStatus: {status}")
    if status in {"approved", "published"} and not item.get("reviewedBy"):
        errors.append(f"{status} items require reviewedBy")
    if status in {"approved", "published"} and not item.get("reviewedAt"):
        errors.append(f"{status} items require reviewedAt")
    if status == "published" and not item.get("publishedAt"):
        errors.append("published items require publishedAt")
    analysis = item.get("analysis") or {}
    scenes = analysis.get("candidateScenes") or []
    unknown = sorted(set(scenes) - ALLOWED_SCENES)
    if unknown:
        errors.append(f"unknown candidateScenes: {', '.join(unknown)}")
    return errors


def validate_queue(queue: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if queue.get("schema") != 1:
        errors.append("queue.schema must be 1")
    if queue.get("release") != "cat1":
        errors.append("queue.release must be cat1")
    items = queue.get("items")
    if not isinstance(items, list):
        return errors + ["queue.items must be a list"]
    licenses = licenses_by_id()
    seen: set[str] = set()
    checksums: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            errors.append(f"items[{index}] must be an object")
            continue
        item_id = str(item.get("id", ""))
        checksum = str(item.get("audioChecksum", ""))
        if item_id in seen:
            errors.append(f"duplicate id: {item_id}")
        if checksum and checksum in checksums:
            errors.append(f"duplicate audioChecksum: {checksum}")
        seen.add(item_id)
        checksums.add(checksum)
        errors.extend(f"{item_id or index}: {message}" for message in validate_item(item, licenses))
    return errors


def command_validate(args: argparse.Namespace) -> int:
    queue = load_json(Path(args.queue))
    errors = validate_queue(queue)
    if errors:
        print("\n".join(f"ERROR: {message}" for message in errors), file=sys.stderr)
        return 1
    counts = {status: sum(1 for item in queue["items"] if item["reviewStatus"] == status) for status in ALLOWED_STATUSES}
    print(json.dumps({"ok": True, "items": len(queue["items"]), "counts": counts}, ensure_ascii=False, indent=2))
    return 0


def command_ingest(args: argparse.Namespace) -> int:
    queue_path = Path(args.queue)
    queue = load_json(queue_path)
    candidate = load_json(Path(args.candidate))
    licenses = licenses_by_id()
    license_id = str(candidate.get("licenseId", ""))
    license_record = licenses.get(license_id)
    if not license_record:
        raise ValueError(f"license is not allowlisted: {license_id}")
    audio_path = Path(args.audio).resolve()
    if not audio_path.is_file():
        raise ValueError(f"audio file not found: {audio_path}")
    source_url = https_url(str(candidate.get("sourceUrl", "")), "sourceUrl")
    source_snapshot = str(candidate.get("sourceSnapshot", "")).strip()
    if not source_snapshot:
        raise ValueError("candidate.sourceSnapshot is required; save the source-page text or evidence")
    item_id = slug(str(candidate.get("id") or f"{candidate.get('creator', '')}-{candidate.get('title', '')}"))
    if any(item.get("id") == item_id for item in queue.get("items", [])):
        raise ValueError(f"candidate already exists: {item_id}")
    item = {
        "id": item_id,
        "title": str(candidate.get("title", "")).strip(),
        "creator": str(candidate.get("creator", "")).strip(),
        "sourceUrl": source_url,
        "licenseId": license_id,
        "licenseUrl": https_url(str(candidate.get("licenseUrl") or license_record.get("licenseUrl") or ""), "licenseUrl"),
        "commercialUseAllowed": True,
        "modificationAllowed": True,
        "attributionRequired": license_record.get("attributionRequired", False),
        "attributionText": str(candidate.get("attributionText", "")).strip(),
        "sourceSnapshotHash": sha256_text(source_snapshot),
        "audioChecksum": sha256_file(audio_path),
        "reviewStatus": "pending",
        "reviewedBy": None,
        "reviewedAt": None,
        "publishedAt": None,
        "analysis": {
            "bpm": candidate.get("analysis", {}).get("bpm"),
            "rmsDb": candidate.get("analysis", {}).get("rmsDb"),
            "spectralCentroid": candidate.get("analysis", {}).get("spectralCentroid"),
            "dynamicRangeDb": candidate.get("analysis", {}).get("dynamicRangeDb"),
            "vocalLikelihood": candidate.get("analysis", {}).get("vocalLikelihood"),
            "candidateScenes": candidate.get("analysis", {}).get("candidateScenes", []),
        },
    }
    errors = validate_item(item, licenses)
    if errors:
        raise ValueError("; ".join(errors))
    queue.setdefault("items", []).append(item)
    write_json(queue_path, queue)
    print(json.dumps({"ingested": item_id, "status": "pending", "queue": str(queue_path)}, ensure_ascii=False, indent=2))
    return 0


def command_transition(args: argparse.Namespace) -> int:
    if not args.reviewer.strip():
        raise ValueError("--reviewer is required for every transition")
    queue_path = Path(args.queue)
    queue = load_json(queue_path)
    item = next((entry for entry in queue.get("items", []) if entry.get("id") == args.id), None)
    if not item:
        raise ValueError(f"candidate not found: {args.id}")
    current = str(item.get("reviewStatus"))
    target = args.status
    if target not in TRANSITIONS.get(current, set()):
        raise ValueError(f"invalid transition: {current} -> {target}")
    if target == "published" and current != "approved":
        raise ValueError("only an approved candidate may become published")
    item["reviewStatus"] = target
    item["reviewedBy"] = args.reviewer.strip()
    item["reviewedAt"] = iso_now()
    item["publishedAt"] = iso_now() if target == "published" else None
    errors = validate_item(item, licenses_by_id())
    if errors:
        raise ValueError("; ".join(errors))
    write_json(queue_path, queue)
    print(json.dumps({"id": args.id, "from": current, "to": target, "reviewer": args.reviewer}, ensure_ascii=False, indent=2))
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description="Human-gated free-music review queue")
    root.add_argument("--queue", default=str(DEFAULT_QUEUE))
    commands = root.add_subparsers(dest="command", required=True)
    validate = commands.add_parser("validate")
    validate.set_defaults(func=command_validate)
    ingest = commands.add_parser("ingest")
    ingest.add_argument("--candidate", required=True)
    ingest.add_argument("--audio", required=True)
    ingest.set_defaults(func=command_ingest)
    transition = commands.add_parser("transition")
    transition.add_argument("--id", required=True)
    transition.add_argument("--status", required=True, choices=sorted(ALLOWED_STATUSES))
    transition.add_argument("--reviewer", required=True)
    transition.set_defaults(func=command_transition)
    return root


def main() -> int:
    args = parser().parse_args()
    try:
        return int(args.func(args))
    except (ValueError, json.JSONDecodeError, OSError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
