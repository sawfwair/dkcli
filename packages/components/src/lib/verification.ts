import type { ThemeContract, ThemeSeed } from '@dkcli/core';

import type { ComponentRegistration } from './contracts.js';
import { createAccordionRegistration } from './accordion/accordion.recipe.js';
import { createAlertRegistration } from './alert/alert.recipe.js';
import { createAvatarRegistration } from './avatar/avatar.recipe.js';
import { createBadgeRegistration } from './badge/badge.recipe.js';
import { createBreadcrumbsRegistration } from './breadcrumbs/breadcrumbs.recipe.js';
import { createButtonRegistration } from './button/button.recipe.js';
import { createCardRegistration } from './card/card.recipe.js';
import { createCheckboxRegistration } from './checkbox/checkbox.recipe.js';
import { createChipRegistration } from './chip/chip.recipe.js';
import { createComboboxRegistration } from './combobox/combobox.recipe.js';
import { createCommandPaletteRegistration } from './command-palette/command-palette.recipe.js';
import { createDataChartRegistration } from './data-chart/data-chart.recipe.js';
import { createDataGridLiteRegistration } from './data-grid-lite/data-grid-lite.recipe.js';
import { createDatePickerRegistration } from './date-picker/date-picker.recipe.js';
import { createDialogRegistration } from './dialog/dialog.recipe.js';
import { createDrawerRegistration } from './drawer/drawer.recipe.js';
import { createEmptyStateRegistration } from './empty-state/empty-state.recipe.js';
import { createFileUploadRegistration } from './file-upload/file-upload.recipe.js';
import { createInlineEditRegistration } from './inline-edit/inline-edit.recipe.js';
import { createMenuRegistration } from './menu/menu.recipe.js';
import { createPaginationRegistration } from './pagination/pagination.recipe.js';
import { createPopoverRegistration } from './popover/popover.recipe.js';
import { createProgressRegistration } from './progress/progress.recipe.js';
import { createRadioGroupRegistration } from './radio-group/radio-group.recipe.js';
import { createRangeDatePickerRegistration } from './range-date-picker/range-date-picker.recipe.js';
import { createSegmentedControlRegistration } from './segmented-control/segmented-control.recipe.js';
import { createSelectRegistration } from './select/select.recipe.js';
import { createSideNavRegistration } from './side-nav/side-nav.recipe.js';
import { createSkeletonRegistration } from './skeleton/skeleton.recipe.js';
import { createStepperRegistration } from './stepper/stepper.recipe.js';
import { createSwitchRegistration } from './switch/switch.recipe.js';
import { createTableRegistration } from './table/table.recipe.js';
import { createTabsRegistration } from './tabs/tabs.recipe.js';
import { createTextFieldRegistration } from './text-field/text-field.recipe.js';
import { createTextareaRegistration } from './textarea/textarea.recipe.js';
import { createToastRegistration } from './toast/toast.recipe.js';
import { createTooltipRegistration } from './tooltip/tooltip.recipe.js';
import { createTreeViewRegistration } from './tree-view/tree-view.recipe.js';

export type ComponentThemePreset = {
  id: string;
  name: string;
  seed: ThemeSeed;
};

export type ComponentVerificationEntry = {
  slug: string;
  name: string;
  createRegistration: (theme: ThemeContract) => ComponentRegistration;
};

export const DK_COMPONENT_THEME_PRESETS: readonly ComponentThemePreset[] = [
  {
    id: 'cobalt',
    name: 'Cobalt',
    seed: {
      color: '#295dff',
      ratio: 'perfect-fourth',
      mode: 'light',
      density: 'comfortable',
      motion: 'snappy'
    }
  },
  {
    id: 'sage',
    name: 'Sage',
    seed: {
      color: '#1f8a70',
      ratio: 'major-third',
      mode: 'light',
      density: 'compact',
      motion: 'smooth'
    }
  },
  {
    id: 'ember',
    name: 'Ember',
    seed: {
      color: '#ff6b3d',
      ratio: 'perfect-fourth',
      mode: 'dark',
      density: 'comfortable',
      motion: 'snappy'
    }
  },
  {
    id: 'linen',
    name: 'Linen',
    seed: {
      color: '#8a6f47',
      ratio: 'major-second',
      mode: 'light',
      density: 'comfortable',
      motion: 'calm'
    }
  }
] as const;

export const COMPONENT_VERIFICATION_REGISTRY: readonly ComponentVerificationEntry[] = [
  { slug: 'accordion', name: 'Accordion', createRegistration: createAccordionRegistration },
  { slug: 'alert', name: 'Alert', createRegistration: createAlertRegistration },
  { slug: 'avatar', name: 'Avatar', createRegistration: createAvatarRegistration },
  { slug: 'badge', name: 'Badge', createRegistration: createBadgeRegistration },
  { slug: 'breadcrumbs', name: 'Breadcrumbs', createRegistration: createBreadcrumbsRegistration },
  { slug: 'button', name: 'Button', createRegistration: createButtonRegistration },
  { slug: 'card', name: 'Card', createRegistration: createCardRegistration },
  { slug: 'checkbox', name: 'Checkbox', createRegistration: createCheckboxRegistration },
  { slug: 'chip', name: 'Chip', createRegistration: createChipRegistration },
  { slug: 'combobox', name: 'Combobox', createRegistration: createComboboxRegistration },
  { slug: 'command-palette', name: 'CommandPalette', createRegistration: createCommandPaletteRegistration },
  { slug: 'data-chart', name: 'DataChart', createRegistration: createDataChartRegistration },
  { slug: 'data-grid-lite', name: 'DataGridLite', createRegistration: createDataGridLiteRegistration },
  { slug: 'date-picker', name: 'DatePicker', createRegistration: createDatePickerRegistration },
  { slug: 'dialog', name: 'Dialog', createRegistration: createDialogRegistration },
  { slug: 'drawer', name: 'Drawer', createRegistration: createDrawerRegistration },
  { slug: 'empty-state', name: 'EmptyState', createRegistration: createEmptyStateRegistration },
  { slug: 'file-upload', name: 'FileUpload', createRegistration: createFileUploadRegistration },
  { slug: 'inline-edit', name: 'InlineEdit', createRegistration: createInlineEditRegistration },
  { slug: 'menu', name: 'Menu', createRegistration: createMenuRegistration },
  { slug: 'pagination', name: 'Pagination', createRegistration: createPaginationRegistration },
  { slug: 'popover', name: 'Popover', createRegistration: createPopoverRegistration },
  { slug: 'progress', name: 'Progress', createRegistration: createProgressRegistration },
  { slug: 'radio-group', name: 'RadioGroup', createRegistration: createRadioGroupRegistration },
  { slug: 'range-date-picker', name: 'RangeDatePicker', createRegistration: createRangeDatePickerRegistration },
  { slug: 'segmented-control', name: 'SegmentedControl', createRegistration: createSegmentedControlRegistration },
  { slug: 'select', name: 'Select', createRegistration: createSelectRegistration },
  { slug: 'side-nav', name: 'SideNav', createRegistration: createSideNavRegistration },
  { slug: 'skeleton', name: 'Skeleton', createRegistration: createSkeletonRegistration },
  { slug: 'stepper', name: 'Stepper', createRegistration: createStepperRegistration },
  { slug: 'switch', name: 'Switch', createRegistration: createSwitchRegistration },
  { slug: 'table', name: 'Table', createRegistration: createTableRegistration },
  { slug: 'tabs', name: 'Tabs', createRegistration: createTabsRegistration },
  { slug: 'text-field', name: 'TextField', createRegistration: createTextFieldRegistration },
  { slug: 'textarea', name: 'Textarea', createRegistration: createTextareaRegistration },
  { slug: 'toast', name: 'Toast', createRegistration: createToastRegistration },
  { slug: 'tooltip', name: 'Tooltip', createRegistration: createTooltipRegistration },
  { slug: 'tree-view', name: 'TreeView', createRegistration: createTreeViewRegistration }
] as const;

export function getComponentThemePreset(themeId: string): ComponentThemePreset | undefined {
  return DK_COMPONENT_THEME_PRESETS.find((preset) => preset.id === themeId);
}

export function findComponentVerificationEntry(nameOrSlug: string): ComponentVerificationEntry | undefined {
  const normalized = nameOrSlug.trim().toLowerCase();
  return COMPONENT_VERIFICATION_REGISTRY.find(
    (entry) => entry.slug === normalized || entry.name.toLowerCase() === normalized
  );
}
