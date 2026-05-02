import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import Alert from './Alert.svelte';

describe('Alert', () => {
  it('renders title and description and dismisses when enabled', async () => {
    const onDismiss = vi.fn();
    render(Alert, {
      props: {
        tone: 'warning',
        title: 'Review required',
        description: 'Content approval is still pending.',
        dismissible: true,
        onDismiss
      }
    });

    expect(screen.getByText('Review required')).toBeTruthy();
    expect(screen.getByText('Content approval is still pending.')).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss alert' }));
    expect(screen.queryByText('Review required')).toBeNull();
    expect(onDismiss).toHaveBeenCalled();
  });
});
