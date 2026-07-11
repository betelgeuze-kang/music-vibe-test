# F1 Frontend Consolidation

F1 promotes the tested BD1/SR1 interface from runtime mutation layers to the canonical application.

## Canonical runtime

The HTML loads one application entry and one stylesheet entry:

```text
/src/v2/main.mjs?ui=f1
/v2-app.css?ui=f1
```

The former brand installer, interaction bridge, and quality installer remain only as historical rollback files. They are not loaded by the public application.

## Route modules

```text
ui/screens/home.mjs       static, lightweight
ui/screens/discover.mjs   static, lightweight
ui/screens/profile.mjs    lazy
ui/screens/now.mjs        lazy
ui/screens/match.mjs      lazy
```

The home boot graph contains the first listening question and the fixed E1 showcase. It does not statically import the 160-track catalog, recommendation domain, or match domain.

## Single action layer

`ui/actions.mjs` owns:

- delegated click handling,
- route controls,
- keyboard onboarding,
- home and onboarding audio,
- profile creation,
- recommendation generation,
- sharing and card export,
- invite parsing,
- privacy controls.

The capture-phase brand interaction bridge is not part of the runtime.

## CSS entry

`v2-app.css` is the only stylesheet linked from HTML. It uses CSS Cascade Layers (캐스케이드 레이어, 스타일 우선순위를 명시적으로 구분하는 기능) to preserve auditable source files while making the deployed ordering explicit:

```text
core
features
responsive
quality
editorial
stability
accessibility
```

## Release contract

`build-info.json` declares:

```json
{
  "uiRelease": "f1",
  "entry": "/src/v2/main.mjs?ui=f1",
  "styleEntry": "/v2-app.css?ui=f1",
  "runtimeOverrides": false
}
```

Static tests reject the return of runtime installers, multiple HTML stylesheet links, duplicate delegated action layers, or eager catalog imports.
