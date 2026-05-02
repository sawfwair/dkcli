import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import InlineEdit from './InlineEdit.svelte';

describe('InlineEdit', () => {
  it('enters edit mode and commits a changed value', async () => {
    const onCommit = vi.fn();
    render(InlineEdit, {
      props: {
        value: 'Launch roadmap',
        onCommit
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Launch roadmap' }));
    const input = screen.getByDisplayValue('Launch roadmap');
    await fireEvent.input(input, { target: { value: 'Atlas release' } });
    await fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledWith({ value: 'Atlas release' });
  });
});
