import assert from 'node:assert/strict';
import { auditProfiles } from '../scripts/profile-audit.mjs';

const report = auditProfiles();
assert.equal(report.combinations, 1024, 'all ten-question combinations must be audited');
assert.equal(report.summary.reachableArchetypes, 8, 'every archetype must be reachable');
assert(report.summary.maxArchetypeShare <= 0.30, 'no archetype may dominate more than 30% of the answer space');
assert(report.summary.minAxisSpan >= 80, 'every axis needs substantial coverage');
assert(report.summary.maxAbsCorrelation <= 0.65, 'designed axes must not become near-duplicates');
assert(report.summary.maxSensitivity <= 0.75, 'one question must not control most archetype assignments');
assert(report.passed, 'profile-space quality gate must pass');
console.log('Profile-space audit checks passed.');
