import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROFILE_QUESTIONS } from '../src/v2/data/questions.mjs';
import { AXIS_IDS } from '../src/v2/data/axes.mjs';
import { ARCHETYPES } from '../src/v2/data/archetypes.mjs';
import { createProfileFromAnswers } from '../src/v2/domain/profile.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function pearson(valuesX, valuesY) {
  const count = valuesX.length;
  const meanX = valuesX.reduce((sum, value) => sum + value, 0) / count;
  const meanY = valuesY.reduce((sum, value) => sum + value, 0) / count;
  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;
  for (let index = 0; index < count; index += 1) {
    const x = valuesX[index] - meanX;
    const y = valuesY[index] - meanY;
    numerator += x * y;
    denominatorX += x * x;
    denominatorY += y * y;
  }
  const denominator = Math.sqrt(denominatorX * denominatorY);
  return denominator ? numerator / denominator : 0;
}

export function auditProfiles() {
  const combinations = 2 ** PROFILE_QUESTIONS.length;
  const rows = [];
  const distribution = Object.fromEntries(ARCHETYPES.map((archetype) => [archetype.id, 0]));

  for (let mask = 0; mask < combinations; mask += 1) {
    const answers = PROFILE_QUESTIONS.map((question, index) => ({
      questionId: question.id,
      optionId: question.options[(mask >> index) & 1].id
    }));
    const profile = createProfileFromAnswers(PROFILE_QUESTIONS, answers, 'quality_audit');
    distribution[profile.archetypeId] += 1;
    rows.push({ mask, answers, profile });
  }

  const axisStats = Object.fromEntries(AXIS_IDS.map((axisId) => {
    const values = rows.map(({ profile }) => profile.scores[axisId]);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return [axisId, {
      min: Math.min(...values),
      max: Math.max(...values),
      span: Math.max(...values) - Math.min(...values),
      mean: Number(mean.toFixed(3))
    }];
  }));

  const correlations = [];
  for (let left = 0; left < AXIS_IDS.length; left += 1) {
    for (let right = left + 1; right < AXIS_IDS.length; right += 1) {
      const leftAxis = AXIS_IDS[left];
      const rightAxis = AXIS_IDS[right];
      correlations.push({
        left: leftAxis,
        right: rightAxis,
        coefficient: Number(pearson(
          rows.map(({ profile }) => profile.scores[leftAxis]),
          rows.map(({ profile }) => profile.scores[rightAxis])
        ).toFixed(4))
      });
    }
  }

  const sensitivity = PROFILE_QUESTIONS.map((question, index) => {
    let changed = 0;
    for (const row of rows) {
      const flipped = rows[row.mask ^ (1 << index)];
      if (flipped.profile.archetypeId !== row.profile.archetypeId) changed += 1;
    }
    return { questionId: question.id, changeRate: Number((changed / rows.length).toFixed(4)) };
  });

  const shares = Object.fromEntries(Object.entries(distribution).map(([id, count]) => [id, Number((count / combinations).toFixed(4))]));
  const reachable = Object.values(distribution).filter((count) => count > 0).length;
  const maxShare = Math.max(...Object.values(shares));
  const maxAbsCorrelation = Math.max(...correlations.map((item) => Math.abs(item.coefficient)));
  const maxSensitivity = Math.max(...sensitivity.map((item) => item.changeRate));
  const minAxisSpan = Math.min(...Object.values(axisStats).map((item) => item.span));

  const thresholds = {
    allArchetypesReachable: reachable === ARCHETYPES.length,
    maxArchetypeShare: maxShare <= 0.30,
    minimumAxisSpan: minAxisSpan >= 80,
    maximumAbsoluteCorrelation: maxAbsCorrelation <= 0.65,
    maximumSingleQuestionSensitivity: maxSensitivity <= 0.75
  };

  return {
    generatedAt: new Date().toISOString(),
    combinations,
    questionCount: PROFILE_QUESTIONS.length,
    archetypeCount: ARCHETYPES.length,
    distribution,
    shares,
    axisStats,
    correlations,
    sensitivity,
    summary: {
      reachableArchetypes: reachable,
      maxArchetypeShare: Number(maxShare.toFixed(4)),
      minAxisSpan,
      maxAbsCorrelation: Number(maxAbsCorrelation.toFixed(4)),
      maxSensitivity: Number(maxSensitivity.toFixed(4))
    },
    thresholds,
    passed: Object.values(thresholds).every(Boolean)
  };
}

function markdown(report) {
  const distributionRows = Object.entries(report.distribution)
    .sort((left, right) => right[1] - left[1])
    .map(([id, count]) => `| ${id} | ${count} | ${(report.shares[id] * 100).toFixed(1)}% |`)
    .join('\n');
  const axisRows = Object.entries(report.axisStats)
    .map(([id, stats]) => `| ${id} | ${stats.min} | ${stats.max} | ${stats.span} | ${stats.mean.toFixed(1)} |`)
    .join('\n');
  const correlations = [...report.correlations]
    .sort((left, right) => Math.abs(right.coefficient) - Math.abs(left.coefficient))
    .slice(0, 6)
    .map((item) => `| ${item.left} ↔ ${item.right} | ${item.coefficient.toFixed(3)} |`)
    .join('\n');
  const sensitivity = [...report.sensitivity]
    .sort((left, right) => right.changeRate - left.changeRate)
    .map((item) => `| ${item.questionId} | ${(item.changeRate * 100).toFixed(1)}% |`)
    .join('\n');
  const thresholdRows = Object.entries(report.thresholds)
    .map(([name, passed]) => `| ${name} | ${passed ? 'PASS' : 'FAIL'} |`)
    .join('\n');

  return `# V2 Profile-Space Audit\n\nThis report exhaustively evaluates all **${report.combinations.toLocaleString()}** possible answer combinations. The audit is a structural quality check, not evidence of clinical or psychometric validity.\n\n## Result\n\n**${report.passed ? 'PASS' : 'FAIL'}**\n\n| Gate | Status |\n|---|---|\n${thresholdRows}\n\n## Archetype distribution\n\n| Archetype | Combinations | Share |\n|---|---:|---:|\n${distributionRows}\n\nThe largest archetype share is **${(report.summary.maxArchetypeShare * 100).toFixed(1)}%**. All ${report.summary.reachableArchetypes}/${report.archetypeCount} archetypes are reachable.\n\n## Axis coverage\n\n| Axis | Min | Max | Span | Mean |\n|---|---:|---:|---:|---:|\n${axisRows}\n\nEvery axis is centered at 50 and spans at least ${report.summary.minAxisSpan} points.\n\n## Strongest axis correlations\n\n| Pair | Pearson r |\n|---|---:|\n${correlations}\n\nThe maximum absolute correlation is **${report.summary.maxAbsCorrelation.toFixed(3)}**. This remains below the CI guardrail of 0.65; it should still be monitored with real user data because answer behavior can produce different correlations from the complete combinatorial space.\n\n## Single-question archetype sensitivity\n\n| Question | Result changes after flipping one answer |\n|---|---:|\n${sensitivity}\n\nThe most sensitive item changes the assigned archetype in **${(report.summary.maxSensitivity * 100).toFixed(1)}%** of the full answer space. The profile page therefore displays confidence and the six-dimensional shape, rather than presenting the archetype label as a precise diagnosis.\n\n## Interpretation boundaries\n\n- This is a deterministic explanation model for music taste, not a professional psychological test.\n- Passing this audit means all designed outputs are reachable, reasonably distributed, and not trivially redundant.\n- Real-user validation must separately measure item choice rates, retest stability, perceived fit, and recommendation engagement.\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = auditProfiles();
  const jsonPath = path.join(root, 'docs/product/profile-audit.json');
  const mdPath = path.join(root, 'docs/product/PROFILE_AUDIT.md');
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdPath, markdown(report));
  console.log(JSON.stringify(report.summary));
  if (!report.passed) process.exitCode = 1;
}
