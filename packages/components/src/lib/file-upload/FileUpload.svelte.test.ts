import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import FileUpload from './FileUpload.svelte';

describe('FileUpload', () => {
  it('retains files with the same basename from different folders', async () => {
    const onChange = vi.fn();
    const { container } = render(FileUpload, { props: { multiple: true, onChange } });
    const files = [new File(['first'], 'brief.pdf'), new File(['second'], 'brief.pdf')];
    await fireEvent.change(container.querySelector('input')!, { target: { files } });
    expect(screen.getAllByText('brief.pdf')).toHaveLength(2);
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ files });
  });

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
