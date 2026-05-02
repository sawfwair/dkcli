import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import FileUpload from './FileUpload.svelte';

describe('FileUpload', () => {
  it('lists selected files and reports the change', async () => {
    const onChange = vi.fn();
    const { container } = render(FileUpload, {
      props: {
        label: 'Upload assets',
        onChange
      }
    });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'brief.pdf', { type: 'application/pdf' });

    await fireEvent.change(input, {
      target: {
        files: [file]
      }
    });

    expect(screen.getByText('brief.pdf')).toBeTruthy();
    expect(onChange).toHaveBeenCalledWith({ files: [file] });
  });
});
