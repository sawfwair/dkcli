import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';

import Checkbox from './checkbox/Checkbox.svelte';
import FileUpload from './file-upload/FileUpload.svelte';
import RadioGroup from './radio-group/RadioGroup.svelte';
import Select from './select/Select.svelte';
import Combobox from './combobox/Combobox.svelte';
import DatePicker from './date-picker/DatePicker.svelte';
import RangeDatePicker from './range-date-picker/RangeDatePicker.svelte';
import TextField from './text-field/TextField.svelte';
import Textarea from './textarea/Textarea.svelte';

function form(): HTMLFormElement {
  const element = document.createElement('form');
  element.dataset.nativeFormTest = 'true';
  document.body.append(element);
  return element;
}

afterEach(() => document.querySelectorAll('[data-native-form-test]').forEach((element) => element.remove()));

describe('native required field behavior', () => {
  it('requires a Select value and forwards invalid focus to its trigger', async () => {
    const target = form();
    const { rerender } = render(Select, { target, props: { label: 'Environment', name: 'environment', required: true, items: [{ value: 'production', label: 'Production' }] } });
    expect(target.checkValidity()).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Environment' }));
    expect(screen.queryByRole('textbox')).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Environment' }));
    await fireEvent.click(screen.getByRole('option', { name: 'Production' }));
    expect(target.checkValidity()).toBe(true);
    expect(new FormData(target).getAll('environment')).toEqual(['production']);
    await rerender({ value: undefined, disabled: true });
    expect(target.checkValidity()).toBe(true);
    expect(new FormData(target).has('environment')).toBe(false);
  });

  it('requires a committed Combobox selection rather than uncommitted search text', async () => {
    const target = form();
    const { rerender } = render(Combobox, { target, props: { label: 'Reviewer', name: 'reviewer', required: true, items: [{ value: 'ada', label: 'Ada' }] } });
    expect(target.checkValidity()).toBe(false);
    const input = screen.getByRole('combobox', { name: 'Reviewer' }) as HTMLInputElement;
    input.focus();
    await fireEvent.input(input, { target: { value: 'Ada' } });
    expect(target.checkValidity()).toBe(false);
    await fireEvent.keyDown(input, { key: 'Enter' });
    expect(target.checkValidity()).toBe(true);
    expect(new FormData(target).getAll('reviewer')).toEqual(['ada']);
    await rerender({ value: undefined, required: false });
    expect(input.validationMessage).toBe('');
    expect(target.checkValidity()).toBe(true);
    await rerender({ required: true, disabled: true });
    expect(input.validationMessage).toBe('');
    expect(target.checkValidity()).toBe(true);
  });

  it('requires a date and forwards invalid focus to the calendar trigger', async () => {
    const target = form();
    const { rerender } = render(DatePicker, { target, props: { label: 'Launch date', name: 'launch', required: true } });
    expect(target.checkValidity()).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Launch date' }));
    await rerender({ value: '2026-04-16' });
    expect(target.checkValidity()).toBe(true);
    expect(new FormData(target).getAll('launch')).toEqual(['2026-04-16']);
    await rerender({ value: undefined, disabled: true });
    expect(target.checkValidity()).toBe(true);
    expect(new FormData(target).has('launch')).toBe(false);
  });

  it('requires both range endpoints without adding submitted proxy fields', async () => {
    const target = form();
    const { rerender } = render(RangeDatePicker, { target, props: { label: 'Release window', name: 'window', required: true, value: { start: '2026-04-16' } } });
    expect(target.checkValidity()).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Release window' }));
    await rerender({ value: { start: '2026-04-16', end: '2026-04-20' } });
    expect(target.checkValidity()).toBe(true);
    expect(Array.from(new FormData(target).entries())).toEqual([['window[start]', '2026-04-16'], ['window[end]', '2026-04-20']]);
    await rerender({ disabled: true });
    expect(target.checkValidity()).toBe(true);
    expect(Array.from(new FormData(target).entries())).toEqual([]);
  });

  it('blocks an empty required TextField and submits its edited value', async () => {
    const target = form();
    const { rerender } = render(TextField, { target, props: { label: 'Name', name: 'name', required: true } });
    expect(target.checkValidity()).toBe(false);
    await fireEvent.input(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Release' } });
    expect(target.checkValidity()).toBe(true);
    expect(new FormData(target).get('name')).toBe('Release');
    await rerender({ disabled: true });
    expect(new FormData(target).has('name')).toBe(false);
  });

  it('blocks an empty required Textarea and submits its edited value', async () => {
    const target = form();
    render(Textarea, { target, props: { label: 'Notes', name: 'notes', required: true } });
    expect(target.checkValidity()).toBe(false);
    await fireEvent.input(screen.getByRole('textbox', { name: 'Notes' }), { target: { value: 'Ready' } });
    expect(target.checkValidity()).toBe(true);
    expect(new FormData(target).get('notes')).toBe('Ready');
  });

  it('requires consent until the Checkbox is checked', async () => {
    const target = form();
    render(Checkbox, { target, props: { label: 'Consent', name: 'consent', required: true } });
    expect(target.checkValidity()).toBe(false);
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Consent' }));
    expect(target.checkValidity()).toBe(true);
    expect(new FormData(target).get('consent')).toBe('on');
  });

  it('requires a RadioGroup selection and submits only the selected option', async () => {
    const target = form();
    render(RadioGroup, { target, props: { label: 'Plan', name: 'plan', value: '', required: true, items: [{ value: 'basic', label: 'Basic' }, { value: 'pro', label: 'Pro' }] } });
    expect(target.checkValidity()).toBe(false);
    await fireEvent.click(screen.getByRole('radio', { name: 'Pro' }));
    expect(target.checkValidity()).toBe(true);
    expect(new FormData(target).getAll('plan')).toEqual(['pro']);
  });

  it('blocks an empty required file chooser unless it is disabled', async () => {
    const target = form();
    const { rerender } = render(FileUpload, { target, props: { label: 'Attachment', name: 'attachment', required: true } });
    expect(target.checkValidity()).toBe(false);
    await rerender({ disabled: true });
    expect(target.checkValidity()).toBe(true);
    expect(new FormData(target).has('attachment')).toBe(false);
  });
});
