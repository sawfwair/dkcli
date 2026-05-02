import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import BadgeHarness from './BadgeHarness.svelte';

describe('Badge', () => {
  it('renders the label and optional leading slot', () => {
    render(BadgeHarness);

    expect(screen.getByText('Launch')).toBeTruthy();
    expect(screen.getByText('+')).toBeTruthy();
  });
});
