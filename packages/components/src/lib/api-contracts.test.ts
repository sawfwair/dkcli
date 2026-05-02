// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import Alert from './alert/Alert.svelte';
import Checkbox from './checkbox/Checkbox.svelte';
import Chip from './chip/Chip.svelte';
import Combobox from './combobox/Combobox.svelte';
import DataGridLite from './data-grid-lite/DataGridLite.svelte';
import DatePicker from './date-picker/DatePicker.svelte';
import Dialog from './dialog/Dialog.svelte';
import Drawer from './drawer/Drawer.svelte';
import FileUpload from './file-upload/FileUpload.svelte';
import Menu from './menu/Menu.svelte';
import Pagination from './pagination/Pagination.svelte';
import Popover from './popover/Popover.svelte';
import RadioGroup from './radio-group/RadioGroup.svelte';
import RangeDatePicker from './range-date-picker/RangeDatePicker.svelte';
import SegmentedControl from './segmented-control/SegmentedControl.svelte';
import Select from './select/Select.svelte';
import Switch from './switch/Switch.svelte';
import Table from './table/Table.svelte';
import Tabs from './tabs/Tabs.svelte';
import ComponentEventHarness from './test-utils/ComponentEventHarness.svelte';
import TextField from './text-field/TextField.svelte';
import Textarea from './textarea/Textarea.svelte';
import Toast from './toast/Toast.svelte';
import Tooltip from './tooltip/Tooltip.svelte';

const tableColumns = [
  { key: 'release', header: 'Release', sortable: true },
  { key: 'status', header: 'Status' }
];

const tableRows = [
  { id: 'row-b', release: 'Zephyr', status: 'Queued' },
  { id: 'row-a', release: 'Apollo', status: 'Ready' }
];

const gridColumns = [
  { key: 'team', header: 'Team', sortable: true },
  { key: 'arr', header: 'ARR', sortable: true }
];

const gridRows = [
  { id: 'atlas', team: 'Atlas', arr: '$1.2M' },
  { id: 'quartz', team: 'Quartz', arr: '$640k' }
];

describe('component event contracts', () => {
  it('dispatches change for TextField', async () => {
    const onChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: TextField,
        componentProps: { label: 'Project name' },
        onChangeEvent
      }
    });

    await fireEvent.input(screen.getByLabelText('Project name'), { target: { value: 'Apollo' } });
    expect(onChangeEvent).toHaveBeenCalledWith({ value: 'Apollo' });
  });

  it('dispatches change for Textarea', async () => {
    const onChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Textarea,
        componentProps: { label: 'Notes' },
        onChangeEvent
      }
    });

    await fireEvent.input(screen.getByLabelText('Notes'), { target: { value: 'Hello world' } });
    expect(onChangeEvent).toHaveBeenCalledWith({ value: 'Hello world' });
  });

  it('dispatches change for Checkbox', async () => {
    const onChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Checkbox,
        componentProps: { label: 'Send release notes' },
        onChangeEvent
      }
    });

    await fireEvent.click(screen.getByLabelText('Send release notes'));
    expect(onChangeEvent).toHaveBeenCalledWith({ checked: true, indeterminate: false });
  });

  it('dispatches change for Switch', async () => {
    const onChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Switch,
        componentProps: { label: 'Auto publish' },
        onChangeEvent
      }
    });

    await fireEvent.click(screen.getByLabelText('Auto publish'));
    expect(onChangeEvent).toHaveBeenCalledWith({ checked: true });
  });

  it('dispatches change for RadioGroup', async () => {
    const onChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: RadioGroup,
        componentProps: {
          label: 'Digest cadence',
          items: [
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' }
          ]
        },
        onChangeEvent
      }
    });

    await fireEvent.click(screen.getByLabelText('Weekly'));
    expect(onChangeEvent).toHaveBeenCalledWith({ value: 'weekly' });
  });

  it('dispatches change for Tabs', async () => {
    const onChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Tabs,
        componentProps: {
          items: [
            { value: 'overview', label: 'Overview' },
            { value: 'details', label: 'Details' }
          ],
          panels: {
            overview: 'Overview panel',
            details: 'Details panel'
          }
        },
        onChangeEvent
      }
    });

    await fireEvent.click(screen.getByRole('tab', { name: 'Details' }));
    expect(onChangeEvent).toHaveBeenCalledWith({ value: 'details' });
  });

  it('dispatches change for Pagination', async () => {
    const onChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Pagination,
        componentProps: {
          page: 2,
          pageCount: 8
        },
        onChangeEvent
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onChangeEvent).toHaveBeenCalledWith({ page: 3 });
  });

  it('dispatches change for SegmentedControl', async () => {
    const onChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: SegmentedControl,
        componentProps: {
          items: [
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' }
          ],
          value: 'week'
        },
        onChangeEvent
      }
    });

    await fireEvent.click(screen.getByRole('radio', { name: 'Month' }));
    expect(onChangeEvent).toHaveBeenCalledWith({ value: 'month' });
  });

  it('dispatches change for Select', async () => {
    const onChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Select,
        componentProps: {
          label: 'Environment',
          items: [
            { value: 'staging', label: 'Staging' },
            { value: 'prod', label: 'Production' }
          ]
        },
        onChangeEvent
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: /select an option/i }));
    await fireEvent.click(screen.getByRole('option', { name: 'Production' }));
    expect(onChangeEvent).toHaveBeenCalledWith({ value: 'prod' });
  });

  it('dispatches change for Combobox', async () => {
    const onChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Combobox,
        componentProps: {
          label: 'Environment',
          items: [
            { value: 'staging', label: 'Staging' },
            { value: 'production', label: 'Production' }
          ]
        },
        onChangeEvent
      }
    });

    const input = screen.getByRole('combobox', { name: 'Environment' });
    await fireEvent.focus(input);
    await fireEvent.input(input, { target: { value: 'prod' } });
    await fireEvent.click(screen.getByRole('option', { name: 'Production' }));
    expect(onChangeEvent).toHaveBeenCalledWith({ value: 'production' });
  });

  it('dispatches change for FileUpload', async () => {
    const onChangeEvent = vi.fn();
    const { container } = render(ComponentEventHarness, {
      props: {
        component: FileUpload,
        componentProps: { label: 'Upload assets' },
        onChangeEvent
      }
    });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'brief.pdf', { type: 'application/pdf' });
    await fireEvent.change(input, { target: { files: [file] } });
    expect(onChangeEvent).toHaveBeenCalledWith({ files: [file] });
  });

  it('dispatches change for Chip', async () => {
    const onChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Chip,
        componentProps: { label: 'Priority' },
        onChangeEvent
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: /Priority/ }));
    expect(onChangeEvent).toHaveBeenCalledWith({ selected: true });
  });

  it('dispatches dismiss for Chip', async () => {
    const onDismissEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Chip,
        componentProps: { label: 'Filter', dismissible: true },
        onDismissEvent
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss Filter' }));
    expect(onDismissEvent).toHaveBeenCalled();
  });

  it('dispatches dismiss for Alert', async () => {
    const onDismissEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Alert,
        componentProps: {
          title: 'Review required',
          description: 'Content approval is still pending.',
          dismissible: true
        },
        onDismissEvent
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss alert' }));
    expect(onDismissEvent).toHaveBeenCalled();
  });

  it('dispatches dismiss for Toast', async () => {
    const onDismissEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Toast,
        componentProps: {
          items: [{ id: 'deploy', tone: 'brand', title: 'Deployment queued' }]
        },
        onDismissEvent
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: /dismiss deployment queued/i }));
    expect(onDismissEvent).toHaveBeenCalledWith({ id: 'deploy' });
  });

  it('dispatches openchange for Dialog', async () => {
    const onOpenChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Dialog,
        componentProps: {
          title: 'Release notes'
        },
        onOpenChangeEvent
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChangeEvent).toHaveBeenNthCalledWith(1, { open: true });
    expect(onOpenChangeEvent).toHaveBeenNthCalledWith(2, { open: false });
  });

  it('dispatches openchange for Drawer', async () => {
    const onOpenChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Drawer,
        componentProps: {
          title: 'Release drawer'
        },
        onOpenChangeEvent
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Open drawer' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChangeEvent).toHaveBeenNthCalledWith(1, { open: true });
    expect(onOpenChangeEvent).toHaveBeenNthCalledWith(2, { open: false });
  });

  it('dispatches openchange for Popover', async () => {
    const onOpenChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Popover,
        onOpenChangeEvent
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Open popover' }));
    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChangeEvent).toHaveBeenNthCalledWith(1, { open: true });
    expect(onOpenChangeEvent).toHaveBeenNthCalledWith(2, { open: false });
  });

  it('dispatches openchange for Menu', async () => {
    const onOpenChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Menu,
        componentProps: {
          items: [
            { value: 'edit', label: 'Edit' },
            { value: 'delete', label: 'Delete' }
          ]
        },
        onOpenChangeEvent
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onOpenChangeEvent).toHaveBeenNthCalledWith(1, { open: true });
    expect(onOpenChangeEvent).toHaveBeenNthCalledWith(2, { open: false });
  });

  it('dispatches openchange for Tooltip', async () => {
    vi.useFakeTimers();
    const onOpenChangeEvent = vi.fn();
    const { container } = render(ComponentEventHarness, {
      props: {
        component: Tooltip,
        componentProps: {
          content: 'Tooltip body'
        },
        onOpenChangeEvent
      }
    });

    await fireEvent.mouseOver(container.querySelector('.tooltip-trigger') as Element);
    await vi.advanceTimersByTimeAsync(320);
    expect(onOpenChangeEvent).toHaveBeenCalledWith({ open: true });
    vi.useRealTimers();
  });

  it('dispatches change for DatePicker', async () => {
    const onChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: DatePicker,
        componentProps: {
          label: 'Launch date',
          value: '2026-04-15'
        },
        onChangeEvent
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: /Apr 15, 2026/i }));
    await fireEvent.click(screen.getByRole('button', { name: /Apr 16, 2026/i }));
    expect(onChangeEvent).toHaveBeenCalledWith({ value: '2026-04-16' });
  });

  it('dispatches change and openchange for RangeDatePicker', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-01T12:00:00Z'));

    const onChangeEvent = vi.fn();
    const onOpenChangeEvent = vi.fn();
    try {
      render(ComponentEventHarness, {
        props: {
          component: RangeDatePicker,
          componentProps: {
            label: 'Launch window'
          },
          onChangeEvent,
          onOpenChangeEvent
        },
      });

      await fireEvent.click(screen.getByRole('button', { name: /select a date range/i }));
      await fireEvent.click(screen.getByRole('button', { name: /Apr 9, 2026/i }));
      await fireEvent.click(screen.getByRole('button', { name: /Apr 12, 2026/i }));

      expect(onOpenChangeEvent).toHaveBeenNthCalledWith(1, { open: true });
      expect(onOpenChangeEvent).toHaveBeenLastCalledWith({ open: false });
      expect(onChangeEvent).toHaveBeenLastCalledWith({
        value: { start: '2026-04-09', end: '2026-04-12' }
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('dispatches sortchange for Table', async () => {
    const onSortChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Table,
        componentProps: {
          caption: 'Release table',
          columns: tableColumns,
          rows: tableRows,
          sortable: true
        },
        onSortChangeEvent
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: /Release/i }));
    expect(onSortChangeEvent).toHaveBeenCalledWith({ sortBy: 'release', sortDirection: 'asc' });
  });

  it('dispatches selectionchange for Table', async () => {
    const onSelectionChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: Table,
        componentProps: {
          caption: 'People',
          columns: tableColumns,
          rows: tableRows,
          selectable: true
        },
        onSelectionChangeEvent
      }
    });

    await fireEvent.click(screen.getByRole('checkbox', { name: /Select all rows/i }));
    expect(onSelectionChangeEvent).toHaveBeenCalledWith({ ids: ['row-b', 'row-a'] });
  });

  it('dispatches activecellchange for DataGridLite', async () => {
    const onActiveCellChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: DataGridLite,
        componentProps: {
          caption: 'Portfolio grid',
          columns: gridColumns,
          rows: gridRows,
          selectable: true
        },
        onActiveCellChangeEvent
      }
    });

    const firstDataCell = screen
      .getAllByRole('gridcell')
      .find((cell) => cell.textContent?.includes('Atlas'));

    expect(firstDataCell).toBeTruthy();
    await fireEvent.focus(firstDataCell!);
    await fireEvent.keyDown(firstDataCell!, { key: 'ArrowRight' });

    expect(onActiveCellChangeEvent).toHaveBeenCalledWith({ activeCell: { row: 0, col: 2 } });
  });

  it('dispatches selectionchange for DataGridLite', async () => {
    const onSelectionChangeEvent = vi.fn();
    render(ComponentEventHarness, {
      props: {
        component: DataGridLite,
        componentProps: {
          caption: 'Portfolio grid',
          columns: gridColumns,
          rows: gridRows,
          selectable: true
        },
        onSelectionChangeEvent
      }
    });

    await fireEvent.click(screen.getByRole('checkbox', { name: /Select all rows/i }));
    expect(onSelectionChangeEvent).toHaveBeenCalledWith({ ids: ['atlas', 'quartz'] });
  });
});
