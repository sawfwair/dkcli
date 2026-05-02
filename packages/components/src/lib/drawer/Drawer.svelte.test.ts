import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Drawer from './Drawer.svelte';

describe('Drawer', () => {
  it('closes on outside press and restores focus to the trigger', async () => {
    render(Drawer, {
      props: {
        title: 'Release drawer'
      }
    });

    const trigger = screen.getByRole('button', { name: 'Open drawer' });
    await fireEvent.click(trigger);

    const backdrop = document.querySelector('.drawer-backdrop') as HTMLDivElement;
    expect(backdrop).toBeTruthy();
    await fireEvent.click(backdrop);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('stays open when outside press dismissal is disabled', async () => {
    render(Drawer, {
      props: {
        title: 'Release drawer',
        closeOnOutsidePress: false
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Open drawer' }));
    const backdrop = document.querySelector('.drawer-backdrop') as HTMLDivElement;
    await fireEvent.click(backdrop);

    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
