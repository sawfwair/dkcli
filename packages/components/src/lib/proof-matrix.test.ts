import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { COMPONENT_VERIFICATION_REGISTRY, DK_COMPONENT_THEME_PRESETS } from './verification.js';

describe('component proof matrix', () => {
	for (const themeDef of DK_COMPONENT_THEME_PRESETS) {
		const theme = createTheme(themeDef);

		describe(`theme: ${themeDef.name}`, () => {
			for (const comp of COMPONENT_VERIFICATION_REGISTRY) {
				it(`${comp.name} — all proofs pass`, () => {
					const registration = comp.createRegistration(theme);
					const fixtures = registration.recipe.proofFixtures;

					expect(fixtures.length).toBeGreaterThan(0);

					for (const fixture of fixtures) {
						if (!fixture.pass) {
							const failedContrast = fixture.contrast.filter((p) => !p.pass);
							const failedTarget = fixture.target.filter((p) => !p.pass);
							const failedLayout = fixture.layout.filter((p) => !p.pass);
							const failedMotion = fixture.motion.filter((p) => !p.pass);

							const failures = [
								...failedContrast.map(
									(p) => `contrast: ${p.lc.toFixed(1)} Lc < ${p.minLc} Lc`
								),
								...failedTarget.map(
									(p) => `target: ${p.actualSizePx}px < ${p.minSizePx}px`
								),
								...failedLayout.map((p) => `layout: overflow at ${p.widths}px`),
								...failedMotion.map((p) => `motion: ${p.durationMs}ms`)
							];

							throw new Error(
								`${comp.name} / ${themeDef.name} / ${fixture.name} (${fixture.caseKey}) failed:\n  ${failures.join('\n  ')}`
							);
						}
					}
				});
			}
		});
	}
});
