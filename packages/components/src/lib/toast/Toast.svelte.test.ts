import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import Toast from './Toast.svelte';

describe('Toast', () => {
  it('auto dismisses after the duration', async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(Toast, {
      props: {
        durationMs: 50,
        onDismiss,
        items: [{ id: 'deploy', tone: 'brand', title: 'Deployment queued' }]
      }
    });

    expect(screen.getByText('Deployment queued')).toBeTruthy();
    await vi.advanceTimersByTimeAsync(60);
    expect(onDismiss).toHaveBeenCalledWith({ id: 'deploy' });
    vi.useRealTimers();
  });

  it('dismisses when the close button is clicked', async () => {
    const onDismiss = vi.fn();

    render(Toast, {
      props: {
        onDismiss,
        items: [{ id: 'deploy', tone: 'brand', title: 'Deployment queued' }]
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: /dismiss deployment queued/i }));
    expect(onDismiss).toHaveBeenCalledWith({ id: 'deploy' });
  });

  it('renders unsafe action href schemes as buttons', async () => {
    const onAction = vi.fn();

    render(Toast, {
      props: {
        onAction,
        items: [
          {
            id: 'deploy',
            tone: 'brand',
            title: 'Deployment queued',
            actionLabel: 'Open',
            actionHref: 'javascript:alert(1)'
          }
        ]
      }
    });

    expect(screen.queryByRole('link', { name: 'Open' })).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(onAction).toHaveBeenCalledWith({ id: 'deploy' });
  });
});
