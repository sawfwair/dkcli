import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Dialog from './Dialog.svelte';

describe('Dialog', () => {
  it('closes on outside press and restores focus to the trigger', async () => {
    render(Dialog, {
      props: {
        title: 'Release dialog'
      }
    });

    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    await fireEvent.click(trigger);

    const backdrop = document.querySelector('.dialog-backdrop') as HTMLDivElement;
    expect(backdrop).toBeTruthy();
    await fireEvent.click(backdrop);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('stays open when outside press dismissal is disabled', async () => {
    render(Dialog, {
      props: {
        title: 'Release dialog',
        closeOnOutsidePress: false
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    const backdrop = document.querySelector('.dialog-backdrop') as HTMLDivElement;
    await fireEvent.click(backdrop);

    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
