import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import EmptyStateHarness from './EmptyStateHarness.svelte';

describe('EmptyState', () => {
  it('renders title, description, and action slot content', () => {
    render(EmptyStateHarness, {
      props: {
        props: {
          title: 'No projects yet',
          description: 'Create a project to start tracking work.'
        }
      }
    });

    expect(screen.getByText('No projects yet')).toBeTruthy();
    expect(screen.getByText('Create a project to start tracking work.')).toBeTruthy();
    expect(screen.getByTestId('empty-action')).toBeTruthy();
  });
});
