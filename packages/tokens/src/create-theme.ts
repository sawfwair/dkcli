import {
  STOPS,
  generateFluidScale,
  optimizePalette,
  resolveRatio,
  type FluidScaleStep,
  type ThemeContract,
  type ThemeFamily,
  type ThemeSeed
} from '@dkcli/core';

export type CreateThemeOptions = {
  name: string;
  seed: ThemeSeed;
};

function colorHex(value: string | { hex: string }): string {
  return typeof value === 'string' ? value : value.hex;
}

function familyFromScale(scale: FluidScaleStep[]): ThemeFamily {
  return Object.fromEntries(scale.map((step) => [step.name, step.value]));
}

function scaleValue(scale: FluidScaleStep[], name: string, fallback: string): string {
  return String(scale.find((step) => step.name === name)?.value ?? fallback);
}

export function createTheme({ name, seed }: CreateThemeOptions): ThemeContract {
  const optimized = optimizePalette(seed.color, {
    engine: 'advanced',
    goal: 'ui',
    gamut: 'srgb',
    space: 'oklch',
    cvdModel: 'machado',
    optimize: true
  });
  const semantic = (seed.mode === 'dark' ? optimized.dark : optimized.light) ?? optimized.light ?? optimized.dark;
  const ratioInput = typeof seed.ratio === 'number' ? String(seed.ratio) : seed.ratio;
  const ratioMeta = resolveRatio(ratioInput);
  const density = seed.density;
  const spacing = generateFluidScale({
    baseMin: density === 'compact' ? 14 : 16,
    baseMax: density === 'compact' ? 18 : 20,
    ratio: ratioInput,
    steps: 5,
    down: 4,
    prefix: 'space',
    naming: 'natural',
    vwMin: 360,
    vwMax: 1440
  });
  const typography = generateFluidScale({
    baseMin: density === 'compact' ? 15 : 16,
    baseMax: density === 'compact' ? 18 : 20,
    ratio: ratioInput,
    steps: 4,
    down: 1,
    prefix: 'type',
    naming: 'natural',
    vwMin: 360,
    vwMax: 1440
  });

  const color: ThemeFamily = Object.fromEntries([
    ...STOPS.flatMap((stop) => [
      [`primary-${stop}`, optimized.tonal[stop].hex],
      [`neutral-${stop}`, optimized.neutral[stop].hex]
    ]),
    ...Object.entries(optimized.states).map(([token, value]) => [token, colorHex(value)]),
    ...Object.entries(semantic ?? {}).map(([token, value]) => [token, colorHex(value)])
  ]);

  return {
    name,
    seed,
    meta: {
      optimizedSeed: optimized.seedHex,
      paletteScore: optimized.scores.total,
      mode: seed.mode,
      density: seed.density,
      ratioName: ratioMeta.name,
      ratioValue: ratioMeta.value
    },
    families: {
      color,
      space: familyFromScale(spacing.scale),
      type: familyFromScale(typography.scale),
      radius: {
        sm: scaleValue(spacing.scale, '2xs', '0.5rem'),
        md: scaleValue(spacing.scale, 'xs', '0.75rem'),
        lg: scaleValue(spacing.scale, 'sm', '1rem'),
        pill: '999px'
      },
      elevation: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
        md: '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.04)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.06), 0 4px 6px rgba(0, 0, 0, 0.04)'
      },
      motion: {
        preset: seed.motion,
        fast: '120ms',
        normal: '200ms',
        slow: '320ms'
      },
      state: {
        mode: seed.mode,
        density: seed.density,
        contrastProfile: seed.contrastProfile ?? 'default'
      }
    },
    aliases: {
      primary: 'color.primary',
      'on-primary': 'color.on-primary',
      surface: 'color.surface',
      'on-surface': 'color.on-surface',
      outline: 'color.outline',
      'action-bg': 'color.primary',
      'action-fg': 'color.on-primary',
      'surface-bg': 'color.surface',
      'surface-fg': 'color.on-surface',
      'field-bg': 'color.surface',
      'field-fg': 'color.on-surface',
      'field-border': 'color.outline',
      'field-placeholder': seed.mode === 'dark' ? 'color.on-surface' : 'color.outline',
      'field-helper': 'color.on-surface',
      'field-error': 'color.error',
      'field-focus-ring': 'color.primary',
      'choice-bg': 'color.surface',
      'choice-fg': 'color.on-surface',
      'choice-border': 'color.outline',
      'choice-track': 'color.outline',
      'choice-thumb': seed.mode === 'dark' ? 'color.neutral-200' : 'color.surface',
      'choice-selected-bg': 'color.primary',
      'choice-selected-fg': 'color.on-primary',
      'choice-selected-border': 'color.primary',
      'overlay-bg': 'color.surface-bright',
      'overlay-fg': 'color.on-surface',
      'overlay-border': 'color.outline',
      'overlay-backdrop': 'color.surface-dim',
      'overlay-shadow': 'elevation.lg',
      'tab-indicator': 'color.primary',
      'tab-active-fg': 'color.primary',
      'tab-inactive-fg': 'color.on-surface',
      'list-row-bg': 'color.surface-bright',
      'list-row-fg': 'color.on-surface',
      'list-row-highlight-bg': 'color.primary-container',
      'list-row-highlight-fg': 'color.on-primary-container',
      'list-row-selected-bg': 'color.primary-container',
      'list-row-selected-fg': 'color.on-primary-container',
      'status-neutral-bg': 'color.surface-dim',
      'status-neutral-fg': 'color.on-surface',
      'status-neutral-border': 'color.outline',
      'status-brand-bg': 'color.primary-container',
      'status-brand-fg': 'color.on-primary-container',
      'status-brand-border': 'color.primary',
      'status-success-bg': 'color.success',
      'status-success-fg': 'color.on-success',
      'status-success-border': 'color.success',
      'status-warning-bg': 'color.warning',
      'status-warning-fg': 'color.on-warning',
      'status-warning-border': 'color.warning',
      'status-danger-bg': 'color.error',
      'status-danger-fg': 'color.on-error',
      'status-danger-border': 'color.error',
      'display-card-bg': 'color.surface-bright',
      'display-card-fg': 'color.on-surface',
      'display-card-border': 'color.outline',
      'display-card-muted': 'color.on-surface',
      'display-avatar-bg': 'color.primary-container',
      'display-avatar-fg': 'color.on-primary-container',
      'display-avatar-ring': 'color.outline',
      'nav-item-fg': 'color.on-surface',
      'nav-current-fg': 'color.primary',
      'nav-current-bg': 'color.primary-container',
      'nav-disabled-fg': 'color.outline',
      'nav-separator-fg': 'color.outline',
      'floating-bg': 'overlay-bg',
      'floating-fg': 'overlay-fg',
      'floating-border': 'overlay-border',
      'floating-shadow': 'overlay-shadow',
      'table-shell-bg': 'color.surface-bright',
      'table-shell-fg': 'color.on-surface',
      'table-divider': 'color.outline',
      'table-header-bg': seed.mode === 'dark' ? 'color.surface-dim' : 'color.neutral-50',
      'table-header-fg': 'color.on-surface',
      'table-cell-fg': 'color.on-surface',
      'table-row-hover-bg': 'color.surface-dim',
      'table-row-selected-bg': 'color.primary-container',
      'table-row-selected-fg': 'color.on-primary-container',
      'table-sort-affordance': 'color.primary',
      'table-sticky-header-shadow': 'elevation.sm',
      'calendar-trigger-bg': 'field-bg',
      'calendar-trigger-fg': 'field-fg',
      'calendar-trigger-border': 'field-border',
      'calendar-surface-bg': 'overlay-bg',
      'calendar-surface-fg': 'overlay-fg',
      'calendar-surface-border': 'overlay-border',
      'calendar-surface-shadow': 'overlay-shadow',
      'calendar-caption-fg': 'color.on-surface',
      'calendar-nav-bg': 'color.surface-dim',
      'calendar-nav-fg': 'color.on-surface',
      'calendar-weekday-fg': 'field-helper',
      'calendar-day-bg': 'color.surface',
      'calendar-day-fg': 'color.on-surface',
      'calendar-day-selected-bg': 'color.primary',
      'calendar-day-selected-fg': 'color.on-primary',
      'calendar-day-disabled-fg': 'field-helper',
      'calendar-day-outside-fg': 'color.outline',
      'calendar-day-today-ring': 'color.primary',
      'command-shell-bg': 'overlay-bg',
      'command-shell-fg': 'overlay-fg',
      'command-shell-border': 'overlay-border',
      'command-shell-shadow': 'overlay-shadow',
      'command-query-bg': 'field-bg',
      'command-query-fg': 'field-fg',
      'command-query-border': 'field-border',
      'command-item-bg': 'list-row-bg',
      'command-item-fg': 'list-row-fg',
      'command-item-highlight-bg': 'list-row-highlight-bg',
      'command-item-highlight-fg': 'list-row-highlight-fg',
      'range-day-bg': 'calendar-day-bg',
      'range-day-fg': 'calendar-day-fg',
      'range-day-selected-bg': 'calendar-day-selected-bg',
      'range-day-selected-fg': 'calendar-day-selected-fg',
      'range-day-between-bg': 'color.primary-container',
      'range-day-between-fg': 'color.on-primary-container',
      'shell-nav-bg': 'color.surface-dim',
      'shell-nav-fg': 'nav-item-fg',
      'shell-nav-active-bg': 'nav-current-bg',
      'shell-nav-active-fg': 'nav-current-fg',
      'shell-nav-border': 'color.outline',
      'stepper-track': 'color.outline',
      'stepper-complete': 'color.success',
      'stepper-current': 'color.primary',
      'stepper-upcoming': 'color.surface-dim',
      'stepper-error': 'color.error',
      'tree-item-bg': 'list-row-bg',
      'tree-item-fg': 'list-row-fg',
      'tree-item-selected-bg': 'list-row-selected-bg',
      'tree-item-selected-fg': 'list-row-selected-fg',
      'chart-grid': 'color.outline',
      'chart-axis': 'field-helper',
      'chart-brand': 'color.primary',
      'chart-success': 'color.success',
      'chart-warning': 'color.warning',
      'chart-danger': 'color.error',
      'chart-neutral': 'color.outline',
      'chart-surface-bg': 'display-card-bg',
      'chart-surface-fg': 'display-card-fg',
      'grid-shell-bg': 'table-shell-bg',
      'grid-shell-fg': 'table-shell-fg',
      'grid-shell-border': 'table-divider',
      'grid-header-bg': 'table-header-bg',
      'grid-header-fg': 'table-header-fg',
      'grid-cell-bg': 'table-shell-bg',
      'grid-cell-fg': 'table-cell-fg',
      'grid-cell-active-bg': 'color.primary-container',
      'grid-cell-active-fg': 'color.on-primary-container',
      'grid-pinned-shadow': 'table-sticky-header-shadow',
      'control-radius': 'radius.md',
      'control-height': 'space.sm',
      'overlay-radius': 'radius.lg'
    }
  };
}
