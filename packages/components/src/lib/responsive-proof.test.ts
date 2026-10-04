import { describe, expect, it } from 'vitest';
import { compileProjectComponentFixtures } from '@dkcli/core';
import { createProjectTheme } from '@dkcli/tokens';
import { COMPONENT_VERIFICATION_REGISTRY } from './verification.js';

const capped = ['select', 'combobox', 'command-palette', 'date-picker', 'range-date-picker', 'popover', 'toast'];
const theme = createProjectTheme({
  name: 'Northstar',
  seed: { color: '#295dff', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion: 'snappy' },
  fonts: { body: 'system-ui, sans-serif', display: 'Georgia, serif', mono: 'monospace' }
});

describe('authored responsive surface proofs', () => {
  it.each(capped)('%s applies its declared CSS viewport cap to recorded 320px widths', (slug) => {
    const entry = COMPONENT_VERIFICATION_REGISTRY.find((entry) => entry.slug === slug);
    if (!entry) throw new Error(`Missing ${slug} registration.`);
    const registration = entry.createRegistration(theme);
    const fixtures = compileProjectComponentFixtures(registration.spec, registration.recipe, theme, [320, 768, 1280]);
    const checks = fixtures.flatMap((fixture) => fixture.anchoredSurface).filter((check) => check.viewportWidth === 320);
    expect(checks.length).toBeGreaterThan(0);
    expect(checks.every((check) => check.pass)).toBe(true);
  });
});
