import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import TextFieldHarness from './TextFieldHarness.svelte';

const theme = createTheme({
  name: 'text-field-test',
  seed: {
    color: '#295dff',
    ratio: 'perfect-fourth',
    mode: 'light',
    density: 'comfortable',
    motion: 'snappy'
  }
});

describe('TextField', () => {
  it('renders the field shell and optional leading and trailing slots', () => {
    const { container } = render(TextFieldHarness, {
      props: { theme, showLeading: true, showTrailing: true }
    });

    expect(screen.getByLabelText('Project name')).toBeTruthy();
    expect(screen.getByTestId('leading-slot')).toBeTruthy();
    expect(screen.getByTestId('trailing-slot')).toBeTruthy();
    expect(container.querySelector('.field-shell')).toBeTruthy();
  });

  it('links helper and error text through aria-describedby and invalid state', () => {
    render(TextFieldHarness, {
      props: { theme, error: 'Required field' }
    });

    const input = screen.getByLabelText('Project name');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain('-error');
    expect(screen.getByText('Required field')).toBeTruthy();
  });

  it('supports interactive typing', async () => {
    const onChange = vi.fn();
    render(TextFieldHarness, {
      props: {
        theme,
        onChange
      }
    });

    const input = screen.getByLabelText('Project name') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'Apollo' } });
    expect(input.value).toBe('Apollo');
    expect(onChange).toHaveBeenCalledWith({ value: 'Apollo' });
  });
});
