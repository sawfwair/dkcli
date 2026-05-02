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
});
