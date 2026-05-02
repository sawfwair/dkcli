import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import Menu from './Menu.svelte';

describe('Menu', () => {
  it('focuses the first enabled item on open and skips disabled items', async () => {
    render(Menu, {
      props: {
        items: [
          { value: 'archive', label: 'Archive', disabled: true },
          { value: 'rename', label: 'Rename' },
          { value: 'delete', label: 'Delete' }
        ]
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await tick();

    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Rename' }));
  });

  it('closes on outside click and restores focus to the trigger', async () => {
    render(Menu, {
      props: {
        items: [
          { value: 'rename', label: 'Rename' },
          { value: 'delete', label: 'Delete' }
        ]
      }
    });

    const trigger = screen.getByRole('button', { name: 'Open menu' });
    await fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeTruthy();

    await fireEvent.click(document.body);
    await tick();

    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
