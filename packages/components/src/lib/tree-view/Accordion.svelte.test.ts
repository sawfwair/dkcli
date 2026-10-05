import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import TreeView from './TreeView.svelte';

describe('TreeView', () => {
  it('has one tree tab stop and keeps focus navigation separate from selection', async () => {
    const onChange = vi.fn();
    render(TreeView, { props: { items: [{ id: 'workspace', label: 'Workspace', children: [{ id: 'ready', label: 'Ready' }] }], expandedIds: ['workspace'], onChange } });
    const buttons = screen.getAllByRole('button');
    expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1);
    const parent = screen.getByRole('button', { name: 'Workspace' });
    parent.focus();
    await fireEvent.keyDown(parent, { key: 'ArrowDown' });
    const child = screen.getByRole('button', { name: 'Ready' });
    expect(document.activeElement).toBe(child);
    expect(child.tabIndex).toBe(0);
    expect(parent.tabIndex).toBe(-1);
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent.keyDown(child, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(parent);
  });

  it('skips a disabled child during tree keyboard navigation', async () => {
    const onChange = vi.fn();
    render(TreeView, { props: { items: [{ id: 'workspace', label: 'Workspace', children: [{ id: 'blocked', label: 'Blocked', disabled: true }, { id: 'ready', label: 'Ready' }] }], expandedIds: ['workspace'], onChange } });
    const parent = screen.getByRole('button', { name: 'Workspace' });
    parent.focus();
    await fireEvent.keyDown(parent, { key: 'ArrowDown' });
    const ready = screen.getByRole('button', { name: 'Ready' });
    expect(document.activeElement).toBe(ready);
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent.keyDown(ready, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ value: 'ready' });
  });

  it('enters an expanded branch through its first enabled child', async () => {
    render(TreeView, { props: { items: [{ id: 'workspace', label: 'Workspace', children: [{ id: 'blocked', label: 'Blocked', disabled: true }, { id: 'ready', label: 'Ready' }] }], expandedIds: ['workspace'] } });
    const parent = screen.getByRole('button', { name: 'Workspace' });
    parent.focus();
    await fireEvent.keyDown(parent, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Ready' }));
  });

  it('expands branches and emits selection changes', async () => {
    const onChange = vi.fn();

    render(TreeView, {
      props: {
        items: [
          {
            id: 'workspace',
            label: 'Workspace',
            children: [
              { id: 'overview', label: 'Overview', description: 'Landing page' },
              { id: 'activity', label: 'Activity', description: 'Recent events' }
            ]
          }
        ],
        expandedIds: ['workspace'],
        onChange
      }
    });

    const activity = screen.getByRole('button', { name: /activity/i });
    await fireEvent.click(activity);

    expect(onChange).toHaveBeenCalledWith({ value: 'activity' });
  });
});
