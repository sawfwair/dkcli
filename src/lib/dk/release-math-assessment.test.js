// @vitest-environment node
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assertReviewedMatrix, assertReviewedProjectMath } from '../../../scripts/assess-release-math.mjs';

const policy = JSON.parse(readFileSync(new URL('../../../qualification/reviewed-math-policy.json', import.meta.url), 'utf8'));

// A producer claim, not a mathematical implementation: mutations below must be
// rejected even when its totals still claim the exact reviewed passing count.
function claimedProjectReport() {
  const fixtures = policy.project.fixtureInventory.map((item) => {
    const { declared, proofCounts, layout, ...identity } = item;
    return {
      ...identity,
      ...Object.fromEntries(Object.entries(proofCounts).map(([kind, count]) => [kind, kind === 'layout' ? structuredClone(layout) : Array.from({ length: count }, () => ({ pass: true }))])),
      evidence: 'mathematical', resolved: true,
      coverage: { declared: [...declared], evaluated: [...declared], unsupported: [], complete: true },
      pass: true
    };
  });
  return {
    ...structuredClone(policy.project), evidence: structuredClone(policy.evidence), fixtures
  };
}

function accordionFixture(report) {
  const fixture = report.fixtures.find((fixture) => fixture.componentId === 'accordion' && fixture.id === 'size=sm__rest');
  if (!fixture || fixture.pass !== true) throw new Error('Expected the reviewed passing Accordion small fixture.');
  return fixture;
}

function cobaltAccordionRun(report) {
  const run = report.runs.find((run) => run.themeId === 'cobalt' && run.slug === 'accordion');
  if (!run || run.pass !== true) throw new Error('Expected the reviewed passing Cobalt Accordion run.');
  return run;
}

describe('reviewed mathematical release evidence', () => {
  it('accepts the sealed review while preserving current mathematical verdicts', () => {
    const report = claimedProjectReport();
    expect(assertReviewedProjectMath(report, policy)).toEqual({ fixtureCount: 180, reviewedFailureCount: 0, mathematicalPass: true });
    expect(assertReviewedMatrix(policy.matrix, policy)).toEqual({ fixtureCount: 720, reviewedFailureCount: 0, mathematicalPass: true });
    expect(report.fixtures.filter((fixture) => !fixture.pass)).toHaveLength(0);
  });

  it('rejects a changed case identity at the same claimed count', () => {
    const report = claimedProjectReport();
    accordionFixture(report).id += '-unexpected';
    expect(() => assertReviewedProjectMath(report, policy)).toThrow('Unexpected or duplicate fixture');
  });

  it('rejects changed sample inputs and failed widths for an otherwise reviewed case', () => {
    const changedText = claimedProjectReport();
    accordionFixture(changedText).sampleText = 'Different authored content';
    expect(() => assertReviewedProjectMath(changedText, policy)).toThrow('case inputs changed');
    const changedWidth = claimedProjectReport();
    accordionFixture(changedWidth).layout[0].widthChecks[0].width = 240;
    expect(() => assertReviewedProjectMath(changedWidth, policy)).toThrow('layout checks changed');
  });

  it('rejects a new failure category, unsupported proof, and removed contrast evidence even at the same count', () => {
    const contrast = claimedProjectReport();
    accordionFixture(contrast).contrast[0].pass = false;
    expect(() => assertReviewedProjectMath(contrast, policy)).toThrow('Unreviewed contrast failure');
    const unsupported = claimedProjectReport();
    accordionFixture(unsupported).coverage.unsupported.push('screenshot');
    expect(() => assertReviewedProjectMath(unsupported, policy)).toThrow('Unsupported proof');
    const missingCheck = claimedProjectReport();
    accordionFixture(missingCheck).contrast.pop();
    expect(() => assertReviewedProjectMath(missingCheck, policy)).toThrow('Proof count changed');
  });

  it('rejects a claimed pass with a failed proof and different project content', () => {
    const falsePass = claimedProjectReport();
    const fixture = accordionFixture(falsePass);
    fixture.layout[0].widthChecks[0].fitsWidth = false;
    fixture.layout[0].widthChecks[0].pass = false;
    fixture.layout[0].pass = false;
    expect(fixture.pass).toBe(true);
    expect(() => assertReviewedProjectMath(falsePass, policy)).toThrow('Unreviewed layout failure');
    const otherProject = claimedProjectReport();
    otherProject.projectIdentity = '0'.repeat(64);
    expect(() => assertReviewedProjectMath(otherProject, policy)).toThrow('projectIdentity changed');
  });

  it('rejects changed matrix inventory and new check reasons at the same claimed totals', () => {
    const swapped = structuredClone(policy.matrix);
    cobaltAccordionRun(swapped).slug = 'unexpected-component';
    expect(() => assertReviewedMatrix(swapped, policy)).toThrow('Unexpected or duplicate matrix run');
    const newCheck = structuredClone(policy.matrix);
    cobaltAccordionRun(newCheck).failures.push({ caseKey: 'size=sm', reasons: ['contrast failed'] });
    expect(() => assertReviewedMatrix(newCheck, policy)).toThrow('matrix verdicts changed');
  });
});
