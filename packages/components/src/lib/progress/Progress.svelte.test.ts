import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Progress from './Progress.svelte';

describe('Progress', () => {
  it('renders a labelled progress bar with aria values', () => {
    render(Progress, {
      props: {
        label: 'Upload',
        value: 72
      }
    });

    const progressbar = screen.getByRole('progressbar', { name: 'Upload' });
    expect(progressbar.getAttribute('aria-valuenow')).toBe('72');
    expect(screen.getByText('72%')).toBeTruthy();
  });
});
