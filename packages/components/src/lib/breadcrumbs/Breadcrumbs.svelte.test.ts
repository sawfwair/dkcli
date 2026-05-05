import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Breadcrumbs from './Breadcrumbs.svelte';

describe('Breadcrumbs', () => {
  it('renders breadcrumb links and a current item', () => {
    render(Breadcrumbs, {
      props: {
        items: [
          { label: 'Workspace', href: '/workspace' },
          { label: 'Release', href: '/release' },
          { label: 'Production', current: true }
        ]
      }
    });

    expect(screen.getByRole('link', { name: 'Workspace' })).toBeTruthy();
    expect(screen.getByText('Production').getAttribute('aria-current')).toBe('page');
  });

  it('renders unsafe href schemes as non-links', () => {
    render(Breadcrumbs, {
      props: {
        items: [
          { label: 'Workspace', href: 'javascript:alert(1)' },
          { label: 'Production', current: true }
        ]
      }
    });

    expect(screen.queryByRole('link', { name: 'Workspace' })).toBeNull();
    expect(screen.getByText('Workspace').tagName).toBe('SPAN');
  });
});
