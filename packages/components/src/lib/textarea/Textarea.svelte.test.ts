import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import Textarea from './Textarea.svelte';

const theme = createTheme({
  name: 'textarea-test',
  seed: {
    color: '#295dff',
    ratio: 'perfect-fourth',
    mode: 'light',
    density: 'comfortable',
    motion: 'snappy'
  }
});

describe('Textarea', () => {
  it('renders label, helper text, and binds the textarea value', async () => {
    const onChange = vi.fn();
    render(Textarea, {
      props: {
        theme,
        label: 'Notes',
        description: 'Share the context.',
        placeholder: 'Type here',
        onChange
      }
    });

    const textarea = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    expect(screen.getByText('Share the context.')).toBeTruthy();
    await fireEvent.input(textarea, { target: { value: 'Hello world' } });
    expect(textarea.value).toBe('Hello world');
    expect(onChange).toHaveBeenCalledWith({ value: 'Hello world' });
  });

  it('marks the textarea invalid when error text is present', () => {
    render(Textarea, {
      props: {
        theme,
        label: 'Notes',
        error: 'Please add more detail.'
      }
    });

    expect(screen.getByText('Please add more detail.')).toBeTruthy();
    expect(screen.getByLabelText('Notes').getAttribute('aria-invalid')).toBe('true');
  });
});
