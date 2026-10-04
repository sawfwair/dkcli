// @vitest-environment node
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assertReviewedMatrix, assertReviewedProjectMath } from '../../../scripts/assess-release-math.mjs';

const policy = JSON.parse(readFileSync(new URL('../../../qualification/reviewed-math-policy.json', import.meta.url), 'utf8'));

// A producer claim, not a mathematical implementation: mutations below must be
// rejected even when its totals still claim the exact reviewed failure count.
function claimedProjectReport() {
  const fixtures = policy.project.fixtureInventory.map((item) => {
    const { declared, proofCounts, ...identity } = item;
    const reviewed = policy.project.reviewedFailures.find((failure) => failure.componentId === item.componentId && failure.id === item.id);
    return {
      ...identity,
      ...Object.fromEntries(Object.entries(proofCounts).map(([kind, count]) => [kind, kind === 'layout' && reviewed ? structuredClone(reviewed.layout) : Array.from({ length: count }, () => ({ pass: true }))])),
      evidence: 'mathematical', resolved: true,
      coverage: { declared: [...declared], evaluated: [...declared], unsupported: [], complete: true },
      pass: !reviewed
    };
  });
  return {
    ...structuredClone(policy.project), evidence: structuredClone(policy.evidence), fixtures
  };
}

describe('reviewed mathematical release findings', () => {
  it('accepts the sealed review while preserving failed mathematical verdicts', () => {
    const report = claimedProjectReport();
    expect(assertReviewedProjectMath(report, policy)).toEqual({ fixtureCount: 180, reviewedFailureCount: 17, mathematicalPass: false });
    expect(assertReviewedMatrix(policy.matrix, policy)).toEqual({ fixtureCount: 720, reviewedFailureCount: 45, mathematicalPass: false });
    expect(report.fixtures.filter((fixture) => !fixture.pass)).toHaveLength(17);
  });

  it('rejects a changed case identity at the same claimed count', () => {
    const report = claimedProjectReport();
    report.fixtures.find((fixture) => !fixture.pass).id += '-unexpected';
    expect(() => assertReviewedProjectMath(report, policy)).toThrow('Unexpected or duplicate fixture');
  });

  it('rejects changed sample inputs and failed widths for an otherwise reviewed case', () => {
    const changedText = claimedProjectReport();
    changedText.fixtures.find((fixture) => !fixture.pass).sampleText = 'Different authored content';
    expect(() => assertReviewedProjectMath(changedText, policy)).toThrow('case inputs changed');
    const changedWidth = claimedProjectReport();
    changedWidth.fixtures.find((fixture) => !fixture.pass).layout[0].widthChecks[0].width = 240;
    expect(() => assertReviewedProjectMath(changedWidth, policy)).toThrow('layout checks changed');
  });

  it('rejects a new failure category, unsupported proof, and removed contrast evidence even at the same count', () => {
    const contrast = claimedProjectReport();
    contrast.fixtures.find((fixture) => !fixture.pass).contrast[0].pass = false;
    expect(() => assertReviewedProjectMath(contrast, policy)).toThrow('Unreviewed contrast failure');
    const unsupported = claimedProjectReport();
    unsupported.fixtures[0].coverage.unsupported.push('screenshot');
    expect(() => assertReviewedProjectMath(unsupported, policy)).toThrow('Unsupported proof');
    const missingCheck = claimedProjectReport();
    missingCheck.fixtures[0].contrast.pop();
    expect(() => assertReviewedProjectMath(missingCheck, policy)).toThrow('Proof count changed');
  });

  it('rejects falsely passing reviewed findings and different project content', () => {
    const falsePass = claimedProjectReport();
    falsePass.fixtures.find((fixture) => !fixture.pass).pass = true;
    expect(() => assertReviewedProjectMath(falsePass, policy)).toThrow('must remain a mathematical failure');
    const otherProject = claimedProjectReport();
    otherProject.projectIdentity = '0'.repeat(64);
    expect(() => assertReviewedProjectMath(otherProject, policy)).toThrow('projectIdentity changed');
  });

  it('rejects swapped matrix findings and new check reasons at the same 720/45 totals', () => {
    const swapped = structuredClone(policy.matrix);
    swapped.runs.find((run) => !run.pass).failures[0].caseKey = 'size=unexpected';
    expect(() => assertReviewedMatrix(swapped, policy)).toThrow('matrix verdicts changed');
    const newCheck = structuredClone(policy.matrix);
    newCheck.runs.find((run) => !run.pass).failures[0].reasons.push('contrast failed');
    expect(() => assertReviewedMatrix(newCheck, policy)).toThrow('matrix verdicts changed');
  });
});
