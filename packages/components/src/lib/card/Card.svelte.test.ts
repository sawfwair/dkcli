import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import CardHarness from './CardHarness.svelte';

describe('Card', () => {
  it('renders media, header, body, and footer slots', () => {
    render(CardHarness);

    expect(screen.getByText('Media')).toBeTruthy();
    expect(screen.getByText('Release summary')).toBeTruthy();
    expect(screen.getByText('Launch copy and rollout checklist.')).toBeTruthy();
    expect(screen.getByText('Review')).toBeTruthy();
  });
});
