import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import App from './App.svelte';

describe('release planner consumer', () => {
  it('uses independent field labels, scoped keyboard selection, and a working save action', async () => {
    render(App);
    const project = screen.getByRole('textbox', { name: 'Project name' });
    const owner = screen.getByRole('textbox', { name: 'Release owner' });
    const save = screen.getByRole('button', { name: 'Save release' });
    expect(project.id).not.toBe(owner.id);
    expect(save.disabled).toBe(true);
    await fireEvent.input(project, { target: { value: 'Atlas' } });
    await fireEvent.input(owner, { target: { value: 'Casey' } });
    await fireEvent.keyDown(owner, { key: 'Enter' });
    expect(screen.queryByRole('listbox')).toBeNull();

    const environment = screen.getByRole('button', { name: /Environment/ });
    environment.focus();
    await fireEvent.keyDown(environment, { key: 'ArrowDown' });
    await fireEvent.keyDown(screen.getByRole('option', { name: 'Staging' }), { key: 'ArrowDown' });
    await fireEvent.keyDown(screen.getByRole('option', { name: 'Production' }), { key: 'Enter' });
    expect(screen.queryByRole('listbox')).toBeNull();

    const reviewer = screen.getByRole('combobox', { name: 'Reviewer' });
    reviewer.focus();
    await fireEvent.focus(reviewer);
    await waitFor(() => expect(document.activeElement).toBe(reviewer));
    await fireEvent.input(reviewer, { target: { value: 'Ra' } });
    await fireEvent.keyDown(reviewer, { key: 'ArrowDown' });
    await fireEvent.keyDown(reviewer, { key: 'Enter' });
    await waitFor(() => expect(save.disabled).toBe(false));
    await fireEvent.click(save);
    expect(screen.getByRole('status').textContent).toBe('Saved Atlas.');
    const summary = screen.getByRole('heading', { name: 'Release summary' }).parentElement;
    expect(summary.textContent).toContain('Casey');
    expect(summary.textContent).toContain('Production');
    expect(summary.textContent).toContain('Rafi');
    expect(document.head.querySelector('[data-designkit-theme="starter"]').textContent).toContain('--floating-bg: var(--overlay-bg);');
  });

  it('delivers menu actions and clears controlled component values', async () => {
    render(App);
    await fireEvent.input(screen.getByRole('textbox', { name: 'Project name' }), { target: { value: 'Atlas' } });
    await fireEvent.input(screen.getByRole('textbox', { name: 'Release owner' }), { target: { value: 'Casey' } });
    await fireEvent.focus(screen.getByRole('combobox', { name: 'Reviewer' }));
    await fireEvent.click(screen.getByRole('option', { name: 'Nina' }));
    await fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    await fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Preview release' }));
    expect(screen.getByRole('status').textContent).toBe('Preview: Atlas.');
    await fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    await fireEvent.click(screen.getByRole('menuitem', { name: 'Clear form' }));
    expect(screen.getByRole('textbox', { name: 'Project name' }).value).toBe('');
    expect(screen.getByRole('textbox', { name: 'Release owner' }).value).toBe('');
    expect(screen.getByRole('combobox', { name: 'Reviewer' }).value).toBe('');
    expect(screen.getByRole('button', { name: 'Save release' }).disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toBe('Form cleared.');
  });
});
