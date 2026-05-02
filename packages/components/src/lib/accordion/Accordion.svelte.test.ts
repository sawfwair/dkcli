import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Accordion from './Accordion.svelte';

describe('Accordion', () => {
  it('opens items from click and keyboard', async () => {
    render(Accordion, {
      props: {
        items: [
          { value: 'overview', label: 'Overview', content: 'Overview content.' },
          { value: 'details', label: 'Details', content: 'Detailed content.' }
        ]
      }
    });

    const overview = screen.getByRole('button', { name: /overview/i });
    await fireEvent.click(overview);
    expect(screen.getByText('Overview content.')).toBeTruthy();

    const details = screen.getByRole('button', { name: /details/i });
    await fireEvent.keyDown(details, { key: 'Enter' });
    expect(screen.getByText('Detailed content.')).toBeTruthy();
  });
});
