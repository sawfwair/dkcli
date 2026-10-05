import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import InlineEdit from './InlineEdit.svelte';

describe('InlineEdit', () => {
  it('disables editing actions when a multiline edit becomes disabled', async () => {
    const onCommit = vi.fn();
    const onCancel = vi.fn();
    const { rerender } = render(InlineEdit, { props: { value: 'Original', multiline: true, onCommit, onCancel } });
    await fireEvent.click(screen.getByRole('button', { name: 'Original' }));
    await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'Draft' } });
    await rerender({ disabled: true });
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true);
    await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onCommit).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Draft');
    await rerender({ disabled: false });
    await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onCommit).toHaveBeenCalledExactlyOnceWith({ value: 'Draft' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Draft' }));
  });

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
