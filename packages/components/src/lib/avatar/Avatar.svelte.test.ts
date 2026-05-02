import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Avatar from './Avatar.svelte';

describe('Avatar', () => {
  it('renders fallback initials when no image is provided', () => {
    render(Avatar, {
      props: {
        name: 'Design Kit',
        size: 'lg',
        shape: 'rounded'
      }
    });

    expect(screen.getByText('DK')).toBeTruthy();
  });
});
