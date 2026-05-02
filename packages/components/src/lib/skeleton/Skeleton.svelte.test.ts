import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Skeleton from './Skeleton.svelte';

describe('Skeleton', () => {
  it('renders multiple lines for text skeletons', () => {
    const { container } = render(Skeleton, {
      props: {
        variant: 'text',
        lines: 3
      }
    });

    expect(container.querySelectorAll('.skeleton-line')).toHaveLength(3);
  });

  it('renders a single block for avatar skeletons', () => {
    const { container } = render(Skeleton, {
      props: {
        variant: 'avatar',
        size: 'lg'
      }
    });

    expect(container.querySelectorAll('.skeleton-block')).toHaveLength(1);
  });
});
