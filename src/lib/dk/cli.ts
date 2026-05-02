import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { renderCmsCommand } from './cms-cli.ts';
import { isRecord, readJsonResponse } from '../json-boundary.ts';
import {
  audit,
  formatAuditCss,
  formatAuditJson,
  scoreComposition,
  scoreDesignComposition,
  solveDesignLayout,
  solveStackLayout,
  analyzeTargetAcquisition,
  analyzeImportance,
  type DesignDocument,
  type Frame,
  type LayoutItem,
  type Rect
} from '@dkcli/core';
import {
  apcaCheck,
  apcaContrast,
  autoContrastAPCA,
  parseCssColor,
  type ColorResult
} from './color.ts';
import { generateSpring, SPRING_PRESETS } from './ease.ts';
import { generateGlassCss } from './glass.ts';
import { generateMinimumJerk } from './jerk.ts';
import { balanceLines, balanceLinesByWidth, flowLinesByWidth, greedyBreak } from './linebreak.ts';
import { getCorrections } from './optical.ts';
import {
  HARMONIES,
  STOPS,
  generateHarmony,
  generateNeutral,
  optimizePalette,
  semanticDark,
  semanticLight,
  type HarmonyType,
  type PaletteOptimizeOptions,
  type SemanticTokens
} from './palette.ts';
import { analyzeDistinctness, simulateCvd, type CvdType } from './perception.ts';
import {
  RATIOS,
  generateFibonacciScale,
  generateFluidScale,
  generateScale,
  type FluidScaleStep,
  type ScaleStep
} from './scale.ts';
import {
  analyzeEmbeddingTopologyHeuristic,
  diagnoseFutureTopology,
  generateLayoutCss,
  refineFutureItems,
  type FutureDiagnosis,
  type FutureTopologyItem,
  type FutureTopologyReport
} from './future.ts';
import { recommendTypography, type TypographyProfile } from './typography.ts';
import { typesetParagraph } from './typeset.ts';
import type {
  ColorSpace,
  CvdModel,
  EngineMode,
  Gamut,
  ImportanceMode,
  TargetModality,
  WhiteSpaceMode
} from './types.ts';
import { createTheme, type CreateThemeOptions } from '@dkcli/tokens';

type OutputFormat = 'css' | 'json' | 'tailwind' | 'text';
type FlagValue = string | boolean;
export type FlagMap = Record<string, FlagValue>;

type ParsedArgs = {
  command: string | null;
  flags: FlagMap;
  positional: string[];
};

export type CliIO = {
  cwd: string;
  executableName: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  readFile: (filePath: string) => Promise<string>;
  readStdin: () => Promise<string>;
  fetch?: typeof fetch;
  getEnv?: (name: string) => string | undefined;
};

type RuntimeDescriptor = {
  source: 'local' | 'remote';
  baseUrl?: string;
  reason?: string;
};

export const CLI_COMMANDS = [
  'cms',
  'components',
  'perfect',
  'palette',
  'distinct',
  'contrast',
  'glass',
  'layout',
  'compose',
  'scale',
  'optical',
  'ease',
  'jerk',
  'typeset',
  'text',
  'linebreak',
  'audit',
  'target',
  'saliency',
  'future'
] as const;

const COMMAND_SUMMARIES: Record<(typeof CLI_COMMANDS)[number], string> = {
  cms: 'Authenticate and manage dkcms sites, pages, builds, and email exports',
  components: 'Verify shipped component proofs and report the component matrix',
  perfect: 'Compose palette, scale, contrast, motion, and layout into one proof state',
  palette: 'Generate OKLCH color palette from a seed hex',
  distinct: 'Measure perceptual distinctness and stress palettes under CVD simulation',
  contrast: 'Check APCA perceptual contrast',
  glass: 'Generate layered glass material CSS',
  layout: 'Solve stack layout constraints into stable rails',
  compose: 'Score compositional order from rectangles',
  scale: 'Generate spacing and sizing scales',
  optical: 'Return optical correction values',
  ease: 'Convert spring physics into CSS linear() easing',
  jerk: 'Generate minimum-jerk timing curves',
  typeset: 'Shape, hyphenate, and balance text with width-based layout',
  text: 'Recommend readable text spacing and measure',
  linebreak: 'Compare balanced and greedy line breaking',
  audit: 'Score CSS against DesignKit heuristics',
  target: 'Estimate interaction burden with Fitts, Hick, and steering',
  saliency: 'Score visual importance from a JSON design document',
  future: 'Analyze content topology and generate layout CSS from the slot plan'
};

const BOOLEAN_FLAGS = new Set(['help', 'h', 'json', 'tailwind', 'stdin', 'fluid', 'audit', 'refine', 'publish', 'all']);
const OPTICAL_TYPES = ['icon', 'text', 'circle', 'button', 'card'] as const;
const DEFAULT_LINEBREAK_TEXT =
  'Mathematical interfaces deserve line breaks that feel intentional, even under pressure.';
const DEFAULT_PERFECT_LINEBREAK =
  'A proof solver should resolve layout, distinction, movement, and reading comfort together.';
const CLI_MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_COMPONENTS_DIR = path.resolve(CLI_MODULE_DIR, '../../../packages/components');
const WORKSPACE_COMPONENTS_PACKAGE_JSON = path.join(WORKSPACE_COMPONENTS_DIR, 'package.json');
const WORKSPACE_COMPONENTS_VERIFICATION_BUNDLE_DIR = path.join(WORKSPACE_COMPONENTS_DIR, '.dk-cli-cache');
const WORKSPACE_COMPONENTS_VERIFICATION_BUNDLE = path.join(
  WORKSPACE_COMPONENTS_VERIFICATION_BUNDLE_DIR,
  'verification.js'
);
const WORKSPACE_COMPONENTS_VERIFICATION_ENTRY = path.join(WORKSPACE_COMPONENTS_DIR, 'src/lib/verification.ts');
const WORKSPACE_TSUP_BIN = path.resolve(CLI_MODULE_DIR, '../../../node_modules/.bin/tsup');

const LAYOUT_SCENARIOS: Record<string, LayoutItem[]> = {
  dashboard: [
    { id: 'nav', min: 120, preferred: 160, max: 220, grow: 0.6, shrink: 0.6 },
    { id: 'main', min: 280, preferred: 420, grow: 2.4, shrink: 2.4 },
    { id: 'aside', min: 140, preferred: 180, max: 240, grow: 0.8, shrink: 0.8 }
  ],
  console: [
    { id: 'log', min: 220, preferred: 360, grow: 2, shrink: 2 },
    { id: 'inspector', min: 160, preferred: 220, max: 300, grow: 1, shrink: 1 },
    { id: 'controls', min: 120, preferred: 160, max: 220, grow: 0.7, shrink: 0.7 }
  ],
  dense: [
    { id: 'A', min: 72, preferred: 92, max: 120, grow: 1, shrink: 1.5 },
    { id: 'B', min: 84, preferred: 110, max: 150, grow: 1.1, shrink: 1.2 },
    { id: 'C', min: 96, preferred: 132, max: 180, grow: 1.25, shrink: 1.1 },
    { id: 'D', min: 88, preferred: 124, max: 170, grow: 0.95, shrink: 1 }
  ]
};

const COMPOSE_VARIANTS: Record<string, Rect[]> = {
  balanced: [
    { id: 'hero', x: 36, y: 30, width: 150, height: 72 },
    { id: 'body', x: 36, y: 124, width: 150, height: 126 },
    { id: 'aside', x: 214, y: 54, width: 124, height: 168 }
  ],
  poster: [
    { id: 'hero', x: 24, y: 24, width: 180, height: 180 },
    { id: 'caption', x: 230, y: 42, width: 96, height: 54 },
    { id: 'note', x: 222, y: 126, width: 110, height: 96 }
  ],
  'left-heavy': [
    { id: 'hero', x: 18, y: 30, width: 208, height: 210 },
    { id: 'support', x: 26, y: 254, width: 150, height: 42 },
    { id: 'chip', x: 248, y: 258, width: 64, height: 34 }
  ]
};

class CliError extends Error {
  helpCommand?: string;

  constructor(message: string, helpCommand?: string) {
    super(message);
    this.name = 'CliError';
    this.helpCommand = helpCommand;
  }
}

function fail(message: string, helpCommand?: string): never {
  throw new CliError(message, helpCommand);
}

function writeLine(write: (text: string) => void, text: string): void {
  write(text.endsWith('\n') ? text : `${text}\n`);
}

async function readAllStdin(): Promise<string> {
  let content = '';
  for await (const chunk of process.stdin) {
    content += String(chunk);
  }
  return content;
}

function createNodeIO(): CliIO {
  const scriptPath = process.argv[1] ?? 'dk';
  const executableName = path.parse(scriptPath).name || 'dk';

  return {
    cwd: process.cwd(),
    executableName,
    stdout: (text) => {
      writeLine((value) => {
        process.stdout.write(value);
      }, text);
    },
    stderr: (text) => {
      writeLine((value) => {
        process.stderr.write(value);
      }, text);
    },
    readFile: (filePath) => readFile(filePath, 'utf8'),
    readStdin: readAllStdin,
    fetch: (input, init) => fetch(input, init),
    getEnv: (name) => process.env[name]
  };
}

export function parseArgs(argv: string[]): ParsedArgs {
  const flags: FlagMap = {};
  const positional: string[] = [];
  let command: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') {
      positional.push(...argv.slice(index + 1));
      break;
    }

    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq > 0) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
        continue;
      }

      const key = arg.slice(2);
      const next = argv.at(index + 1);
      if (!BOOLEAN_FLAGS.has(key) && next !== undefined && !next.startsWith('-')) {
        flags[key] = next;
        index += 1;
      } else {
        flags[key] = true;
      }
      continue;
    }

    if (arg === '-h') {
      flags.h = true;
      continue;
    }

    if (!command) {
      command = arg;
    } else {
      positional.push(arg);
    }
  }

  if (flags.json) {
    flags.format = 'json';
  }
  if (flags.tailwind) {
    flags.format = 'tailwind';
  }

  return { command, flags, positional };
}

function getStringFlag(flags: FlagMap, name: string): string | undefined {
  const value = flags[name] as FlagValue | undefined;
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    fail(`Flag --${name} requires a value.`, name);
  }
  return value;
}

function getNumberFlag(flags: FlagMap, name: string, fallback: number, helpCommand: string): number {
  const value = getStringFlag(flags, name);
  if (value === undefined) {
    return fallback;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    fail(`Flag --${name} must be a number. Received "${value}".`, helpCommand);
  }
  return number;
}

function getIntegerFlag(flags: FlagMap, name: string, fallback: number, helpCommand: string): number {
  return Math.round(getNumberFlag(flags, name, fallback, helpCommand));
}

function resolveFormat(
  flags: FlagMap,
  defaultFormat: OutputFormat,
  supported: OutputFormat[],
  helpCommand: string
): OutputFormat {
  const format = (getStringFlag(flags, 'format') as OutputFormat | undefined) ?? defaultFormat;
  if (!supported.includes(format)) {
    fail(
      `Unsupported format "${format}" for dk ${helpCommand}. Supported formats: ${supported.join(', ')}.`,
      helpCommand
    );
  }
  return format;
}

function normalizeHex(value: string, label: string, helpCommand: string): string {
  const normalized = value.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(normalized)) {
    fail(`${label} must be a 3- or 6-digit hex color. Received "${value}".`, helpCommand);
  }
  return `#${normalized.length === 3 ? normalized.replace(/(.)/g, '$1$1') : normalized}`.toLowerCase();
}

function parseDimension(value: string, helpCommand: string): Frame {
  const match = value.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/i);
  if (!match) {
    fail(`Frame must use WIDTHxHEIGHT syntax. Received "${value}".`, helpCommand);
  }
  return { width: Number(match[1]), height: Number(match[2]) };
}

function safePad(value: string, width: number): string {
  return value.padEnd(width, ' ');
}

function renderPaletteLine(name: string, value: string | ColorResult, prefix: string): string {
  if (typeof value === 'string') {
    return `  --${prefix}-${name}: ${value};`;
  }
  return `  --${prefix}-${name}: ${value.oklch}; /* ${value.hex} */`;
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

async function readTextFile(io: CliIO, filePath: string): Promise<string> {
  return io.readFile(path.resolve(io.cwd, filePath));
}

async function readJsonFile(io: CliIO, filePath: string, helpCommand: string): Promise<unknown> {
  const raw = await readTextFile(io, filePath);
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(
      `Could not parse JSON from ${filePath}: ${error instanceof Error ? error.message : 'unknown error'}.`,
      helpCommand
    );
  }
}

function resolveRuntimeBaseUrl(flags: FlagMap, io: CliIO): string | undefined {
  return (
    getStringFlag(flags, 'runtime-url') ??
    io.getEnv?.('DK_RUNTIME_URL') ??
    process.env.DK_RUNTIME_URL
  );
}

function describeRuntime(runtime: RuntimeDescriptor): string {
  if (runtime.source === 'remote') {
    return `runtime remote ${runtime.baseUrl ?? ''}`.trimEnd();
  }
  return runtime.reason ? `runtime local (${runtime.reason})` : 'runtime local';
}

function localRuntime(mode: ImportanceMode): RuntimeDescriptor {
  if (mode === 'heuristic') {
    return { source: 'local' };
  }
  return {
    source: 'local',
    reason: 'No runtime URL configured; fell back to local heuristic analysis.'
  };
}

async function postRuntimeJson<T>(
  io: CliIO,
  baseUrl: string,
  endpoint: string,
  payload: unknown,
  helpCommand: string
): Promise<T> {
  const fetchImpl = io.fetch ?? fetch;

  let url: string;
  try {
    url = new URL(endpoint, baseUrl).toString();
  } catch {
    fail(`Invalid runtime URL "${baseUrl}".`, helpCommand);
  }

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    fail(
      `Runtime request to ${url} failed with ${response.status}${message ? `: ${message}` : '.'}`,
      helpCommand
    );
  }

  return readJsonResponse(response, `Runtime response from ${url}`, (value): value is T => isRecord(value));
}

function parseRects(input: unknown, helpCommand: string): Rect[] {
  const candidate =
    Array.isArray(input) ? input : input && typeof input === 'object' && 'rects' in input ? input.rects : undefined;
  if (!Array.isArray(candidate)) {
    fail('Rect input must be a JSON array or an object with a "rects" array.', helpCommand);
  }
  return candidate.map((item, index) => {
    if (!item || typeof item !== 'object') {
      fail(`Rect ${index + 1} must be an object.`, helpCommand);
    }
    const rect = item as Record<string, unknown>;
    const values = ['x', 'y', 'width', 'height'].map((key) => Number(rect[key]));
    if (values.some((value) => !Number.isFinite(value))) {
      fail(`Rect ${index + 1} must include numeric x, y, width, and height fields.`, helpCommand);
    }
    return {
      id: typeof rect.id === 'string' ? rect.id : `rect-${index + 1}`,
      x: values[0],
      y: values[1],
      width: values[2],
      height: values[3]
    };
  });
}

function parseEngineMode(flags: FlagMap, helpCommand: string): EngineMode {
  const engine = (getStringFlag(flags, 'engine') ?? 'auto') as EngineMode;
  if (!['basic', 'advanced', 'auto'].includes(engine)) {
    fail(`Unknown engine "${engine}".`, helpCommand);
  }
  return engine;
}

function parseWhiteSpaceMode(flags: FlagMap, helpCommand: string): WhiteSpaceMode {
  const whiteSpace = (getStringFlag(flags, 'white-space') ?? 'normal') as WhiteSpaceMode;
  if (!['normal', 'pre-wrap'].includes(whiteSpace)) {
    fail(`Unknown white-space mode "${whiteSpace}".`, helpCommand);
  }
  return whiteSpace;
}

type FlowSpec = {
  leadWidthPx: number;
  leadLines: number;
  bodyWidthPx: number;
};

function parseFlowSpec(flags: FlagMap, helpCommand: string): FlowSpec | undefined {
  const value = getStringFlag(flags, 'flow');
  if (value === undefined) {
    return undefined;
  }

  const match = value.match(/^(\d+(?:\.\d+)?)x(\d+)x(\d+(?:\.\d+)?)$/i);
  if (!match) {
    fail(`Flag --flow must use LEAD_WIDTHxLEAD_LINESxBODY_WIDTH syntax. Received "${value}".`, helpCommand);
  }

  const leadWidthPx = Number(match[1]);
  const leadLines = Number(match[2]);
  const bodyWidthPx = Number(match[3]);
  if (!Number.isFinite(leadWidthPx) || !Number.isFinite(bodyWidthPx) || !Number.isFinite(leadLines)) {
    fail(`Flag --flow must contain numeric values. Received "${value}".`, helpCommand);
  }
  if (leadWidthPx <= 0 || bodyWidthPx <= 0 || leadLines < 1) {
    fail(`Flag --flow requires positive widths and at least one lead line. Received "${value}".`, helpCommand);
  }

  return {
    leadWidthPx,
    leadLines: Math.round(leadLines),
    bodyWidthPx
  };
}

function parseGamut(flags: FlagMap, helpCommand: string): Gamut {
  const gamut = (getStringFlag(flags, 'gamut') ?? 'srgb') as Gamut;
  if (!['srgb', 'p3', 'hdr'].includes(gamut)) {
    fail(`Unknown gamut "${gamut}".`, helpCommand);
  }
  return gamut;
}

function parseColorSpaceFlag(flags: FlagMap, helpCommand: string): ColorSpace {
  const space = (getStringFlag(flags, 'space') ?? 'oklch') as ColorSpace;
  if (!['oklch', 'cam16-ucs', 'jzazbz'].includes(space)) {
    fail(`Unknown color space "${space}".`, helpCommand);
  }
  return space;
}

function parseCvdModel(flags: FlagMap, helpCommand: string): CvdModel {
  const model = (getStringFlag(flags, 'cvd-model') ?? 'simple') as CvdModel;
  if (!['simple', 'machado'].includes(model)) {
    fail(`Unknown CVD model "${model}".`, helpCommand);
  }
  return model;
}

function parseDesignDocument(input: unknown, helpCommand: string): DesignDocument {
  if (!input || typeof input !== 'object') {
    fail('Design input must be an object.', helpCommand);
  }
  const candidate = input as Record<string, unknown>;
  if (!candidate.frame || typeof candidate.frame !== 'object' || !Array.isArray(candidate.elements)) {
    fail('Design input must include "frame" and "elements".', helpCommand);
  }
  return candidate as unknown as DesignDocument;
}

function parseLayoutItems(input: unknown, helpCommand: string): LayoutItem[] {
  const candidate =
    Array.isArray(input) ? input : input && typeof input === 'object' && 'items' in input ? input.items : undefined;
  if (!Array.isArray(candidate)) {
    fail('Layout input must be a JSON array or an object with an "items" array.', helpCommand);
  }
  return candidate.map((item, index) => {
    if (!item || typeof item !== 'object') {
      fail(`Layout item ${index + 1} must be an object.`, helpCommand);
    }
    const layoutItem = item as Record<string, unknown>;
    const min = Number(layoutItem.min);
    const preferred = Number(layoutItem.preferred);
    const max = layoutItem.max === undefined ? undefined : Number(layoutItem.max);
    const grow = layoutItem.grow === undefined ? undefined : Number(layoutItem.grow);
    const shrink = layoutItem.shrink === undefined ? undefined : Number(layoutItem.shrink);
    if (!Number.isFinite(min) || !Number.isFinite(preferred)) {
      fail(`Layout item ${index + 1} must include numeric min and preferred values.`, helpCommand);
    }
    if (max !== undefined && !Number.isFinite(max)) {
      fail(`Layout item ${index + 1} has an invalid max value.`, helpCommand);
    }
    return {
      id: typeof layoutItem.id === 'string' ? layoutItem.id : `item-${index + 1}`,
      min,
      preferred,
      ...(max !== undefined ? { max } : {}),
      ...(grow !== undefined ? { grow } : {}),
      ...(shrink !== undefined ? { shrink } : {})
    };
  });
}

function parseColorList(raw: string): string[] {
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function describeCollisions(collisions: Array<{ left: string; right: string; deltaE: number }>): string[] {
  if (collisions.length === 0) {
    return ['none'];
  }
  return collisions.map((collision) => `${collision.left} vs ${collision.right} (ΔE ${collision.deltaE})`);
}

function describeScaleRows(scale: ScaleStep[] | FluidScaleStep[], fluid: boolean): string[] {
  const maxToken = Math.max(...scale.map((step) => step.token.length));
  return scale.map((step) => {
    if (fluid && 'pxMin' in step) {
      return `  ${safePad(step.token, maxToken)}: ${step.value}; /* ${step.pxMin}–${step.pxMax}px */`;
    }
    return `  ${safePad(step.token, maxToken)}: ${step.value.padStart(10)}; /* ${step.px}px */`;
  });
}

function describeSemanticHex(value: string | ColorResult): string {
  return typeof value === 'string' ? value : value.hex;
}

function perfectProofCard(
  label: string,
  fg: string,
  bg: string,
  size: number,
  weight: number
): {
  label: string;
  fg: string;
  bg: string;
  lc: number;
  minLc: number;
  recommendation: string;
  pass: boolean;
} {
  const contrast = apcaContrast(fg, bg);
  const verdict = apcaCheck(contrast.Lc, size, weight);
  return {
    label,
    fg,
    bg,
    lc: contrast.abs,
    minLc: verdict.minLc,
    recommendation: verdict.recommendation,
    pass: verdict.pass
  };
}

function perfectPxStep(scale: FluidScaleStep[], name: string, fallback: number): number {
  return scale.find((step) => step.name === name)?.pxMax ?? fallback;
}

function joinTransforms(values: Array<{ property: string; value: string }>): string {
  return values
    .filter((item) => item.property === 'transform')
    .map((item) => item.value)
    .join(' ');
}

function renderScale(flags: FlagMap): string {
  const helpCommand = 'scale';
  const format = resolveFormat(flags, 'css', ['css', 'json', 'tailwind'], helpCommand);
  const base = getNumberFlag(flags, 'base', 16, helpCommand);
  const steps = getIntegerFlag(flags, 'steps', 6, helpCommand);
  const down = getIntegerFlag(flags, 'down', 2, helpCommand);
  const prefix = getStringFlag(flags, 'prefix') ?? 'space';
  const naming = getStringFlag(flags, 'naming') ?? 'natural';
  const unit = getStringFlag(flags, 'unit') ?? 'rem';
  const ratio = getStringFlag(flags, 'ratio');

  if (flags.fluid) {
    const result = generateFluidScale({
      baseMin: getNumberFlag(flags, 'base-min', base * 0.875, helpCommand),
      baseMax: getNumberFlag(flags, 'base-max', base, helpCommand),
      ratio,
      steps,
      down,
      prefix,
      naming,
      vwMin: getNumberFlag(flags, 'vw-min', 320, helpCommand),
      vwMax: getNumberFlag(flags, 'vw-max', 1440, helpCommand)
    });

    if (format === 'json') {
      return formatJson(result);
    }
    if (format === 'tailwind') {
      return formatJson(Object.fromEntries(result.scale.map((step) => [step.name, step.value])));
    }

    return [
      `/* dk scale --fluid --ratio=${result.meta.ratioName} --base-min=${result.meta.baseMin} --base-max=${result.meta.baseMax} */`,
      ':root {',
      ...describeScaleRows(result.scale, true),
      '}'
    ].join('\n');
  }

  const result =
    ratio === 'fibonacci'
      ? generateFibonacciScale({ base, steps, down, unit, prefix, naming })
      : generateScale({ base, ratio, steps, down, unit, prefix, naming });

  if (format === 'json') {
    return formatJson(result);
  }
  if (format === 'tailwind') {
    return formatJson(Object.fromEntries(result.scale.map((step) => [step.name, step.value])));
  }

  return [
    `/* dk scale --ratio=${result.meta.ratioName} --base=${result.meta.base} */`,
    ':root {',
    ...describeScaleRows(result.scale, false),
    '}'
  ].join('\n');
}

function renderPalette(flags: FlagMap, positional: string[]): string {
  const helpCommand = 'palette';
  const format = resolveFormat(flags, 'css', ['css', 'json', 'tailwind'], helpCommand);
  const hexInput = positional[0];
  if (!hexInput) {
    fail('Usage: dk palette <hex>', helpCommand);
  }
  const hex = normalizeHex(hexInput, 'Palette seed', helpCommand);
  const engine = parseEngineMode(flags, helpCommand);
  const gamut = parseGamut(flags, helpCommand);
  const space = parseColorSpaceFlag(flags, helpCommand);
  const cvdModel = parseCvdModel(flags, helpCommand);
  const mode = getStringFlag(flags, 'mode') ?? 'both';
  const prefix = getStringFlag(flags, 'prefix') ?? 'color';
  const harmony = getStringFlag(flags, 'harmony');
  const goal = (getStringFlag(flags, 'goal') ?? 'ui') as PaletteOptimizeOptions['goal'];
  const optimize = Object.hasOwn(flags, 'optimize') ? flags.optimize === true : engine !== 'basic';

  if (harmony) {
    if (!Object.hasOwn(HARMONIES, harmony)) {
      fail(`Unknown harmony "${harmony}".`, helpCommand);
    }
    const result = generateHarmony(hex, harmony as HarmonyType, gamut);
    if (format === 'json') {
      return formatJson(result);
    }
    if (format === 'tailwind') {
      return formatJson(
        Object.fromEntries(
          result.colors.map((color) => [
            color.label,
            Object.fromEntries(STOPS.map((stop) => [String(stop), color.tonal[stop].oklch]))
          ])
        )
      );
    }

    const lines = [`/* dk palette ${hex} --harmony=${result.type} */`];
    for (const color of result.colors) {
      lines.push('');
      lines.push(`/* ${color.label} (${color.hex}, hue +${color.hueOffset}) */`);
      lines.push(':root {');
      for (const stop of STOPS) {
        lines.push(`  --${prefix}-${color.label}-${stop}: ${color.tonal[stop].oklch}; /* ${color.tonal[stop].hex} */`);
      }
      lines.push('}');
    }
    return lines.join('\n');
  }

  const optimized = optimizePalette(hex, {
    engine,
    goal,
    gamut,
    space,
    cvdModel,
    optimize
  });
  const tonal = optimized.tonal;
  const neutral = optimized.neutral;
  const states = optimized.states;
  const light = mode === 'dark' ? null : semanticLight(tonal, neutral);
  const dark = mode === 'light' ? null : semanticDark(tonal, neutral);

  if (format === 'json') {
    return formatJson({ ...optimized, light, dark });
  }

  if (format === 'tailwind') {
    const primary: Record<string, string> = {};
    const neutralTailwind: Record<string, string> = {};
    for (const stop of STOPS) {
      primary[String(stop)] = tonal[stop].oklch;
      neutralTailwind[String(stop)] = neutral[stop].oklch;
    }
    primary.DEFAULT = tonal[500].oklch;
    neutralTailwind.DEFAULT = neutral[500].oklch;

    return formatJson({
      primary,
      neutral: neutralTailwind
    });
  }

  const semantic = (mode === 'dark' ? dark : light) ?? light ?? dark;
  const lines = [
    `/* dk palette ${hex} --engine=${engine} --goal=${goal} --space=${space} --gamut=${gamut} --cvd-model=${cvdModel} */`,
    `/* optimized seed ${optimized.seedHex} score ${optimized.scores.total} */`,
    ':root {',
    '  /* Primary tonal scale */'
  ];
  for (const stop of STOPS) {
    lines.push(`  --${prefix}-primary-${stop}: ${tonal[stop].oklch}; /* ${tonal[stop].hex} */`);
  }
  lines.push('', '  /* Neutral tonal scale (tinted) */');
  for (const stop of STOPS) {
    lines.push(`  --${prefix}-neutral-${stop}: ${neutral[stop].oklch}; /* ${neutral[stop].hex} */`);
  }
  lines.push('', `  /* Semantic tokens (${mode === 'dark' ? 'dark' : 'light'}) */`);
  for (const [name, value] of Object.entries(semantic ?? {})) {
    lines.push(renderPaletteLine(name, value, prefix));
  }
  lines.push('', '  /* State colors */');
  for (const [name, value] of Object.entries(states)) {
    lines.push(renderPaletteLine(name, value, prefix));
  }
  lines.push('}');

  if (mode === 'both' && dark) {
    lines.push('', '@media (prefers-color-scheme: dark) {', '  :root {');
    for (const [name, value] of Object.entries(dark)) {
      lines.push(`  ${renderPaletteLine(name, value, prefix).trim()}`);
    }
    lines.push('  }', '}');
  }

  return lines.join('\n');
}

function renderGlass(flags: FlagMap): string {
  const helpCommand = 'glass';
  const format = resolveFormat(flags, 'css', ['css', 'json'], helpCommand);
  const mode = (getStringFlag(flags, 'mode') ?? 'light') as 'light' | 'dark';
  const params = {
    blur: getNumberFlag(flags, 'blur', 12, helpCommand),
    opacity: getNumberFlag(flags, 'opacity', 0.08, helpCommand),
    tint: getStringFlag(flags, 'tint') ?? (mode === 'light' ? '#ffffff' : '#000000'),
    mode,
    layers: getIntegerFlag(flags, 'layers', 1, helpCommand),
    borderOpacity: getNumberFlag(flags, 'border-opacity', 0.15, helpCommand),
    saturation: getNumberFlag(flags, 'saturation', 120, helpCommand),
    noise: getNumberFlag(flags, 'noise', 0, helpCommand),
    selector: getStringFlag(flags, 'selector') ?? '.glass',
    radius: getNumberFlag(flags, 'radius', 16, helpCommand)
  };
  const css = generateGlassCss(params);
  return format === 'json' ? formatJson({ params, css }) : css;
}

function renderOptical(flags: FlagMap, positional: string[]): string {
  const helpCommand = 'optical';
  const format = resolveFormat(flags, 'css', ['css', 'json', 'text'], helpCommand);
  const type = positional[0];
  if (!type) {
    fail('Usage: dk optical <type>', helpCommand);
  }
  const result = getCorrections(type, getNumberFlag(flags, 'size', 48, helpCommand));
  if (format === 'json') {
    return formatJson(result);
  }
  const lines = [`/* Optical correction: ${result.description} (${result.size}px) */`];
  for (const correction of result.corrections) {
    lines.push(`/* ${correction.reason} */`);
    lines.push(`${correction.property}: ${correction.value};`);
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

function renderContrast(flags: FlagMap, positional: string[]): string {
  const helpCommand = 'contrast';
  const format = resolveFormat(flags, 'css', ['css', 'json', 'text'], helpCommand);
  if (positional.length < 2) {
    fail('Usage: dk contrast <fg-hex> <bg-hex>', helpCommand);
  }
  const fg = normalizeHex(positional[0], 'Foreground color', helpCommand);
  const bg = normalizeHex(positional[1], 'Background color', helpCommand);
  const size = getNumberFlag(flags, 'size', 16, helpCommand);
  const weight = getNumberFlag(flags, 'weight', 400, helpCommand);
  const result = apcaContrast(fg, bg);
  const check = apcaCheck(result.Lc, size, weight);
  if (format === 'json') {
    return formatJson({ fg, bg, size, weight, ...result, ...check });
  }
  return [
    `/* dk contrast ${fg} ${bg} --size=${size} --weight=${weight} */`,
    `/* APCA Lc: ${result.Lc} (${result.polarity}) */`,
    `/* At ${size}px/${weight}: ${check.recommendation} */`
  ].join('\n');
}

function renderEase(flags: FlagMap): string {
  const helpCommand = 'ease';
  const format = resolveFormat(flags, 'css', ['css', 'json', 'text'], helpCommand);
  const preset = getStringFlag(flags, 'preset');
  const params =
    preset && Object.hasOwn(SPRING_PRESETS, preset)
      ? SPRING_PRESETS[preset]
      : {
          mass: getNumberFlag(flags, 'mass', 1, helpCommand),
          stiffness: getNumberFlag(flags, 'stiffness', 180, helpCommand),
          damping: getNumberFlag(flags, 'damping', 12, helpCommand)
        };
  const sampleCount = getIntegerFlag(flags, 'samples', 50, helpCommand);
  const result = generateSpring(params, sampleCount);
  return format === 'json' ? formatJson(result) : result.css;
}

async function renderAudit(flags: FlagMap, io: CliIO): Promise<string> {
  const helpCommand = 'audit';
  const format = resolveFormat(flags, 'css', ['css', 'json', 'text'], helpCommand);
  const mode = (getStringFlag(flags, 'mode') ?? 'source') as 'source' | 'rendered';
  if (mode === 'rendered') {
    fail('Rendered audits require the private dkweb runtime. Use source mode in dkcli.', helpCommand);
  }
  let css: string | undefined;
  const cssFile = getStringFlag(flags, 'css');
  if (cssFile) {
    css = await readTextFile(io, cssFile);
  } else if (flags.stdin) {
    css = await io.readStdin();
  }
  if (!css) {
    fail('Usage: dk audit --css=<file> or dk audit --stdin', helpCommand);
  }
  const report = audit(css);
  if (format === 'json') {
    return formatAuditJson(report);
  }
  return formatAuditCss(report);
}

async function renderLayout(flags: FlagMap, io: CliIO): Promise<string> {
  const helpCommand = 'layout';
  const format = resolveFormat(flags, 'text', ['text', 'json'], helpCommand);
  const engine = parseEngineMode(flags, helpCommand);
  const designInput = getStringFlag(flags, 'input');
  if (designInput) {
    const document = parseDesignDocument(await readJsonFile(io, designInput, helpCommand), helpCommand);
    const importanceMode = (getStringFlag(flags, 'importance') ?? 'heuristic') as ImportanceMode;
    const runtimeBaseUrl = resolveRuntimeBaseUrl(flags, io);
    const runtime = runtimeBaseUrl ? { source: 'remote' as const, baseUrl: runtimeBaseUrl } : localRuntime(importanceMode);
    const response = runtimeBaseUrl
      ? await postRuntimeJson<{
          importance: ReturnType<typeof analyzeImportance>;
          layout: ReturnType<typeof solveDesignLayout>;
          composition: ReturnType<typeof scoreDesignComposition>;
        }>(io, runtimeBaseUrl, '/api/dk/layout', { document, mode: importanceMode }, helpCommand)
      : null;
    const importance = response?.importance ?? analyzeImportance(document, 'heuristic');
    const result = response?.layout ?? solveDesignLayout(document, { importanceReport: importance });
    const composition =
      response?.composition ??
      scoreDesignComposition(
        {
          ...document,
          elements: result.elements
        },
        importance
      );
    if (format === 'json') {
      return formatJson({ engine, document, importance, result, composition, runtime });
    }
    return [
      `dk layout — advanced (${composition.total})`,
      `frame ${document.frame.width}x${document.frame.height}  engine ${engine}  importance ${importanceMode} / resolved ${importance.mode}`,
      describeRuntime(runtime),
      `overlap ${result.metrics.overlapPenalty}  safe ${result.metrics.safeRegionPenalty}  alignment ${result.metrics.alignment}`,
      ''
    ]
      .concat(
        result.elements.map(
          (item) =>
            `${safePad(item.id, 10)} ${safePad(`${item.x},${item.y}`, 14)} ${safePad(`${item.width}x${item.height}`, 12)} importance ${item.importance}`
        )
      )
      .join('\n');
  }
  const scenario = getStringFlag(flags, 'scenario') ?? 'dashboard';
  const itemsFlag = getStringFlag(flags, 'items');
  const presetItems = Object.hasOwn(LAYOUT_SCENARIOS, scenario) ? LAYOUT_SCENARIOS[scenario] : undefined;
  const items = itemsFlag
    ? parseLayoutItems(await readJsonFile(io, itemsFlag, helpCommand), helpCommand)
    : flags.stdin
      ? parseLayoutItems(JSON.parse(await io.readStdin()), helpCommand)
      : presetItems;

  if (!items) {
    fail(`Unknown layout scenario "${scenario}".`, helpCommand);
  }

  const options = {
    container: getNumberFlag(flags, 'container', 860, helpCommand),
    gap: getNumberFlag(flags, 'gap', 24, helpCommand),
    padding: getNumberFlag(flags, 'padding', 28, helpCommand),
    align: (getStringFlag(flags, 'align') ?? 'start') as 'start' | 'center' | 'end'
  };
  const result = solveStackLayout(items, options);
  if (format === 'json') {
    return formatJson({ scenario, options, items, result });
  }

  const lines = [
    `dk layout — ${itemsFlag || flags.stdin ? 'custom' : scenario}`,
    `container ${options.container}px  gap ${options.gap}px  padding ${options.padding}px  align ${options.align}`,
    `used ${result.metrics.used}px  free ${result.metrics.free}px  overflow ${result.metrics.overflow}px  compression ${result.metrics.compression}`,
    ''
  ];
  for (const item of result.items) {
    lines.push(
      `${safePad(item.id, 10)} size ${safePad(`${item.size}px`, 9)} range ${safePad(`${item.min}/${item.preferred}/${item.max ?? 'inf'}`, 18)} position ${safePad(`${item.start}→${item.end}px`, 16)} delta ${item.delta >= 0 ? '+' : ''}${item.delta}px`
    );
  }
  return lines.join('\n');
}

async function renderCompose(flags: FlagMap, io: CliIO): Promise<string> {
  const helpCommand = 'compose';
  const format = resolveFormat(flags, 'text', ['text', 'json'], helpCommand);
  const designInput = getStringFlag(flags, 'input');
  if (designInput) {
    const document = parseDesignDocument(await readJsonFile(io, designInput, helpCommand), helpCommand);
    const importanceMode = (getStringFlag(flags, 'importance') ?? 'heuristic') as ImportanceMode;
    const runtimeBaseUrl = resolveRuntimeBaseUrl(flags, io);
    const runtime = runtimeBaseUrl ? { source: 'remote' as const, baseUrl: runtimeBaseUrl } : localRuntime(importanceMode);
    const response = runtimeBaseUrl
      ? await postRuntimeJson<{
          importance: ReturnType<typeof analyzeImportance>;
          composition: ReturnType<typeof scoreDesignComposition>;
        }>(io, runtimeBaseUrl, '/api/dk/compose', { document, mode: importanceMode }, helpCommand)
      : null;
    const importance = response?.importance ?? analyzeImportance(document, 'heuristic');
    const result = response?.composition ?? scoreDesignComposition(document, importance);
    if (format === 'json') {
      return formatJson({ document, importance, result, runtime });
    }
    return [
      `dk compose — advanced total ${result.total}`,
      `requested ${importanceMode} / resolved ${importance.mode}`,
      describeRuntime(runtime),
      `weighted balance ${result.metrics.weightedBalance}  hierarchy ${result.metrics.hierarchy}  saliency ${result.metrics.saliencyRespect}`,
      ''
    ]
      .concat(
        Object.entries(result.metrics).map(
          ([name, value]) => `${safePad(name, 16)} ${typeof value === 'number' ? Math.round(value * 100) / 100 : value}`
        )
      )
      .join('\n');
  }
  const frame = parseDimension(getStringFlag(flags, 'frame') ?? '360x320', helpCommand);
  const rectsFlag = getStringFlag(flags, 'rects');
  const variant = getStringFlag(flags, 'variant') ?? 'balanced';
  const presetRects = Object.hasOwn(COMPOSE_VARIANTS, variant) ? COMPOSE_VARIANTS[variant] : undefined;
  const rects = rectsFlag
    ? parseRects(await readJsonFile(io, rectsFlag, helpCommand), helpCommand)
    : flags.stdin
      ? parseRects(JSON.parse(await io.readStdin()), helpCommand)
      : presetRects;

  if (!rects) {
    fail(`Unknown composition variant "${variant}".`, helpCommand);
  }

  const result = scoreComposition(rects, frame);
  if (format === 'json') {
    return formatJson({ frame, rects, result });
  }

  const lines = [
    `dk compose — total ${result.total}`,
    `frame ${frame.width}x${frame.height}`,
    ''
  ];
  for (const [name, value] of Object.entries(result.metrics)) {
    lines.push(`${safePad(name, 10)} ${Math.round(value * 100)}/100`);
  }
  return lines.join('\n');
}

async function renderDistinct(flags: FlagMap, positional: string[], io: CliIO): Promise<string> {
  const helpCommand = 'distinct';
  const format = resolveFormat(flags, 'text', ['text', 'json'], helpCommand);
  const threshold = getNumberFlag(flags, 'threshold', 12, helpCommand);
  const harmony = (getStringFlag(flags, 'harmony') ?? 'split-complementary') as HarmonyType;
  const vision = (getStringFlag(flags, 'vision') ?? 'none') as 'none' | CvdType;
  const gamut = parseGamut(flags, helpCommand);
  const space = parseColorSpaceFlag(flags, helpCommand);
  const cvdModel = parseCvdModel(flags, helpCommand);
  const severity = getNumberFlag(flags, 'severity', 1, helpCommand);
  const colorsFlag = getStringFlag(flags, 'colors');

  let colors: string[];
  let seed: string | undefined;
  if (colorsFlag) {
    colors = colorsFlag.includes('#') || colorsFlag.includes(',') ? parseColorList(colorsFlag) : parseColorList(String((await readJsonFile(io, colorsFlag, helpCommand)) as string[]));
  } else if (flags.stdin) {
    const raw = JSON.parse(await io.readStdin()) as string[] | { colors: string[] };
    colors = Array.isArray(raw) ? raw : raw.colors;
  } else {
    seed = normalizeHex(positional[0] ?? '#295dff', 'Distinct seed', helpCommand);
    if (!Object.hasOwn(HARMONIES, harmony)) {
      fail(`Unknown harmony "${harmony}".`, helpCommand);
    }
    colors = generateHarmony(seed, harmony).colors.map((color) => color.hex);
  }

  const normalizedColors = colors.map((color, index) =>
    parseCssColor(normalizeHex(color, `Color ${index + 1}`, helpCommand), gamut).hex
  );
  const previewColors =
    vision === 'none'
      ? normalizedColors
      : normalizedColors.map((color) => simulateCvd(color, vision, severity, cvdModel));
  const report = analyzeDistinctness(normalizedColors, threshold, { space, gamut, cvdModel, severity });

  if (format === 'json') {
    return formatJson({
      seed,
      harmony,
      threshold,
      vision,
      space,
      gamut,
      cvdModel,
      severity,
      colors: normalizedColors,
      previewColors,
      report
    });
  }

  const lines = [
    `dk distinct — min ΔE ${report.minDeltaE} (${report.collisions.length} collisions under ${threshold})`,
    `space ${space}  gamut ${gamut}  cvd ${cvdModel} severity ${severity}`,
    `colors: ${normalizedColors.join(', ')}`
  ];
  if (vision !== 'none') {
    lines.push(`${vision} preview: ${previewColors.join(', ')}`);
  }
  for (const [name, value] of Object.entries(report.cvd)) {
    lines.push(`${name}: min ΔE00 ${value.minDeltaE} (${value.collisions.length} collisions)`);
  }
  if (report.collisions.length > 0) {
    lines.push(`collisions: ${describeCollisions(report.collisions).join('; ')}`);
  }
  return lines.join('\n');
}

async function renderSaliency(flags: FlagMap, io: CliIO): Promise<string> {
  const helpCommand = 'saliency';
  const format = resolveFormat(flags, 'text', ['text', 'json'], helpCommand);
  const inputPath = getStringFlag(flags, 'input');
  const document = inputPath
    ? parseDesignDocument(await readJsonFile(io, inputPath, helpCommand), helpCommand)
    : flags.stdin
      ? parseDesignDocument(JSON.parse(await io.readStdin()), helpCommand)
      : fail('Usage: dk saliency --input=<file> or --stdin', helpCommand);
  const mode = (getStringFlag(flags, 'importance') ?? 'heuristic') as ImportanceMode;
  const runtimeBaseUrl = resolveRuntimeBaseUrl(flags, io);
  const runtime = runtimeBaseUrl ? { source: 'remote' as const, baseUrl: runtimeBaseUrl } : localRuntime(mode);
  const report = runtimeBaseUrl
    ? await postRuntimeJson<ReturnType<typeof analyzeImportance>>(
        io,
        runtimeBaseUrl,
        '/api/dk/saliency',
        { document, mode },
        helpCommand
      )
    : analyzeImportance(document, 'heuristic');
  if (format === 'json') {
    return formatJson({ document, report, runtime });
  }
  return [
    `dk saliency — requested ${mode} / resolved ${report.mode}`,
    describeRuntime(runtime),
    ...report.elements.map(
      (item) =>
        `${safePad(item.id, 12)} score ${safePad(String(item.score), 8)} normalized ${safePad(String(item.normalized), 8)} ${item.reasons.join(', ')}`
    )
  ].join('\n');
}

function renderTarget(flags: FlagMap): string {
  const helpCommand = 'target';
  const format = resolveFormat(flags, 'text', ['text', 'json'], helpCommand);
  const modality = (getStringFlag(flags, 'modality') ?? 'mouse') as TargetModality;
  const pathLength = getStringFlag(flags, 'path-length');
  const pathWidth = getStringFlag(flags, 'path-width');
  if ((pathLength && !pathWidth) || (!pathLength && pathWidth)) {
    fail('Provide both --path-length and --path-width together.', helpCommand);
  }
  const input = {
    distance: getNumberFlag(flags, 'distance', 320, helpCommand),
    width: getNumberFlag(flags, 'width', 44, helpCommand),
    choices: getIntegerFlag(flags, 'choices', 9, helpCommand),
    modality,
    ...(pathLength && pathWidth
      ? {
          pathLength: Number(pathLength),
          pathWidth: Number(pathWidth)
        }
      : {
          pathLength: 180,
          pathWidth: 28
        })
  };
  const report = analyzeTargetAcquisition(input);
  if (format === 'json') {
    return formatJson({ input, report });
  }
  return [
    'dk target',
    `distance ${input.distance}px  width ${input.width}px  choices ${input.choices}  modality ${modality}`,
    `movement ${report.movementMs}ms  choice ${report.choiceMs}ms  steering ${report.steeringMs}ms  occlusion ${report.occlusionPenaltyMs}ms  total ${report.totalMs}ms`,
    `difficulty ${report.difficultyBits} bits  effective width ${report.effectiveWidth}px`
  ].join('\n');
}

function renderText(flags: FlagMap): string {
  const helpCommand = 'text';
  const format = resolveFormat(flags, 'css', ['css', 'json', 'text'], helpCommand);
  const engine = parseEngineMode(flags, helpCommand);
  const whiteSpace = parseWhiteSpaceMode(flags, helpCommand);
  const sampleText =
    getStringFlag(flags, 'text') ??
    'Mathematical typography is not sterile. It is the disciplined shaping of measure, contrast, spacing, and rhythm until reading feels effortless.';
  const input = {
    fontSize: getNumberFlag(flags, 'font', 18, helpCommand),
    containerWidth: getNumberFlag(flags, 'width-px', getNumberFlag(flags, 'measure', 620, helpCommand), helpCommand),
    contrastLc: getNumberFlag(flags, 'contrast', 72, helpCommand),
    profile: (getStringFlag(flags, 'profile') ?? 'default') as TypographyProfile,
    engine,
    sampleText,
    language: getStringFlag(flags, 'language') ?? 'en',
    hyphenate: Object.hasOwn(flags, 'hyphenate'),
    whiteSpace
  };
  const recommendation = recommendTypography(input);
  const typeset =
    engine === 'basic'
      ? undefined
      : typesetParagraph({
          text: sampleText,
          widthPx: input.containerWidth,
          fontSize: input.fontSize,
          lineHeight: recommendation.lineHeight,
          language: input.language,
          hyphenate: input.hyphenate,
          opticalSizing: getStringFlag(flags, 'opsz') !== 'off',
          whiteSpace,
          engine: 'advanced'
        });
  const css = [
    `/* dk text --engine=${engine} --font=${input.fontSize} --measure=${input.containerWidth} --contrast=${input.contrastLc} --profile=${input.profile} --white-space=${whiteSpace} */`,
    `/* ${recommendation.charactersPerLine} chars/line, crowding ${recommendation.crowdingRisk} */`,
    ...recommendation.warnings.map((warning) => `/* ${warning} */`),
    `max-width: ${input.containerWidth}px;`,
    `font-size: ${input.fontSize}px;`,
    `line-height: ${recommendation.lineHeight};`,
    `letter-spacing: ${recommendation.letterSpacingEm}em;`,
    `word-spacing: ${recommendation.wordSpacingEm}em;`,
    `margin-bottom: ${recommendation.paragraphSpacingPx}px;`,
    ...(whiteSpace === 'pre-wrap' ? ['white-space: pre-wrap;'] : []),
    ...(typeset
      ? [
          `/* advanced badness ${typeset.badness}  hyphenation ${typeset.usedHyphenation} */`,
          `/* prepared ${typeset.segmentCount} segments ${typeset.chunkCount} chunks */`
        ]
      : [])
  ].join('\n');

  if (format === 'json') {
    return formatJson({ input, recommendation, typeset, css });
  }
  if (format === 'text') {
    return [
      'dk typeset',
      `chars/line ${recommendation.charactersPerLine}  line-height ${recommendation.lineHeight}  crowding ${recommendation.crowdingRisk}`,
      `letter-spacing ${recommendation.letterSpacingEm}em  word-spacing ${recommendation.wordSpacingEm}em  paragraph ${recommendation.paragraphSpacingPx}px`,
      ...(typeset
        ? [
            `advanced badness ${typeset.badness}  avg width ${typeset.averageWidth}px  lines ${typeset.lineCount}  height ${typeset.heightPx}px  tight ${typeset.maxLineWidth}px`,
            `prepared ${typeset.segmentCount} segments  ${typeset.chunkCount} chunks`,
            ...typeset.lines.map((line, index) => `${index + 1}. ${line.text}`)
          ]
        : []),
      ...recommendation.warnings
    ].join('\n');
  }
  return css;
}

async function renderLinebreak(flags: FlagMap, positional: string[], io: CliIO): Promise<string> {
  const helpCommand = 'linebreak';
  const format = resolveFormat(flags, 'text', ['text', 'json'], helpCommand);
  const engine = parseEngineMode(flags, helpCommand);
  const whiteSpace = parseWhiteSpaceMode(flags, helpCommand);
  const flowSpec = parseFlowSpec(flags, helpCommand);
  const chars = getIntegerFlag(flags, 'chars', 22, helpCommand);
  const linesTarget = getIntegerFlag(flags, 'lines', 3, helpCommand);
  const file = getStringFlag(flags, 'file');
  const flagText = getStringFlag(flags, 'text');
  const text =
    file
      ? await readTextFile(io, file)
      : flags.stdin
        ? await io.readStdin()
        : flagText ?? (positional.length > 0 ? positional.join(' ') : DEFAULT_LINEBREAK_TEXT);
  const balanced = balanceLines(text, chars, linesTarget);
  const greedy = greedyBreak(text, chars);
  const advanced =
    engine === 'basic'
      ? undefined
      : balanceLinesByWidth({
          text,
          widthPx: getNumberFlag(flags, 'width-px', chars * 10, helpCommand),
          fontSize: getNumberFlag(flags, 'font', 18, helpCommand),
          language: getStringFlag(flags, 'language') ?? 'en',
          hyphenate: Object.hasOwn(flags, 'hyphenate'),
          opticalSizing: getStringFlag(flags, 'opsz') !== 'off',
          whiteSpace,
          targetLines: linesTarget,
          engine: 'advanced'
        });
  const flow =
    flowSpec === undefined
      ? undefined
      : flowLinesByWidth(
          {
            text,
            fontSize: getNumberFlag(flags, 'font', 18, helpCommand),
            language: getStringFlag(flags, 'language') ?? 'en',
            hyphenate: Object.hasOwn(flags, 'hyphenate'),
            opticalSizing: getStringFlag(flags, 'opsz') !== 'off',
            whiteSpace,
            engine: 'advanced'
          },
          [
            { label: 'lead', widthPx: flowSpec.leadWidthPx, maxLines: flowSpec.leadLines },
            { label: 'body', widthPx: flowSpec.bodyWidthPx }
          ]
        );

  if (format === 'json') {
    return formatJson({ text, maxChars: chars, targetLines: linesTarget, whiteSpace, flowSpec, balanced, greedy, advanced, flow });
  }

  return [
    `dk linebreak — ${chars} chars, target ${linesTarget} lines`,
    '',
    `Balanced (${balanced.badness})`,
    ...balanced.lines.map((line, index) => `${index + 1}. ${line}`),
    '',
    `Greedy (${greedy.badness})`,
    ...greedy.lines.map((line, index) => `${index + 1}. ${line}`),
    ...(advanced
      ? [
          '',
          `Advanced (${advanced.badness})`,
          `lines ${advanced.lineCount}  height ${advanced.heightPx}px  tight ${advanced.maxLineWidth}px`,
          `prepared ${advanced.segmentCount} segments  ${advanced.chunkCount} chunks`,
          ...advanced.lines.map((line, index) => `${index + 1}. ${line.text}`)
        ]
      : []),
    ...(flow
      ? [
          '',
          `Flow (${flow.tightWidth}px tight)`,
          `prepared ${flow.segmentCount} segments  ${flow.chunkCount} chunks  used all text ${flow.usedAllText ? 'yes' : 'no'}`,
          ...flow.slots.flatMap((slot) => [
            `${slot.label} ${slot.widthPx}px${slot.maxLines !== undefined ? ` / ${slot.maxLines} lines` : ''}`,
            ...slot.lines.map((line) => `${line.ordinal}. ${line.text}`)
          ])
        ]
      : [])
  ].join('\n');
}

function renderJerk(flags: FlagMap): string {
  const helpCommand = 'jerk';
  const format = resolveFormat(flags, 'css', ['css', 'json', 'text'], helpCommand);
  const result = generateMinimumJerk(
    getNumberFlag(flags, 'duration', 0.6, helpCommand),
    getIntegerFlag(flags, 'samples', 32, helpCommand)
  );
  if (format === 'json') {
    return formatJson(result);
  }
  if (format === 'text') {
    return [
      `dk jerk — duration ${result.duration}s`,
      `samples ${result.samples.length}`,
      `endpoint ${result.samples.at(-1)?.x ?? 1}`,
      result.linear
    ].join('\n');
  }
  return result.css;
}

function renderPerfect(flags: FlagMap): string {
  const helpCommand = 'perfect';
  const format = resolveFormat(flags, 'css', ['css', 'json', 'text'], helpCommand);
  const engine = parseEngineMode(flags, helpCommand);
  const baseColor = normalizeHex(getStringFlag(flags, 'seed') ?? '#295dff', 'Perfect seed', helpCommand);
  const ratioName = getStringFlag(flags, 'ratio') ?? 'perfect-fourth';
  const mode = (getStringFlag(flags, 'mode') ?? 'light') as 'light' | 'dark';
  const motionPreset = getStringFlag(flags, 'motion') ?? 'snappy';
  if (!Object.hasOwn(SPRING_PRESETS, motionPreset)) {
    fail(`Unknown motion preset "${motionPreset}".`, helpCommand);
  }
  if (!Object.hasOwn(RATIOS, ratioName)) {
    fail(`Unknown ratio "${ratioName}".`, helpCommand);
  }

  const optimized = optimizePalette(baseColor, {
    engine,
    goal: 'ui',
    gamut: 'srgb',
    space: 'oklch',
    cvdModel: 'machado',
    optimize: engine !== 'basic'
  });
  const tonal = optimized.tonal;
  const neutral = generateNeutral(optimized.seedHex, 0.016);
  const semantic: SemanticTokens = mode === 'light' ? semanticLight(tonal, neutral) : semanticDark(tonal, neutral);
  const harmony = generateHarmony(baseColor, 'split-complementary');
  const fluid = generateFluidScale({
    baseMin: 15,
    baseMax: 20,
    ratio: ratioName,
    steps: 5,
    down: 1,
    prefix: 'proof',
    naming: 'natural',
    vwMin: 360,
    vwMax: 1440
  });
  const motion = generateSpring(SPRING_PRESETS[motionPreset], 32);
  const motionCurve = motion.linear.replace(/\s+/g, ' ');
  const circleCorrections = getCorrections('circle', 72);
  const iconCorrections = getCorrections('icon', 72);
  const surfaceHex = describeSemanticHex(semantic.surface);
  const surfaceInk = describeSemanticHex(semantic['on-surface']);
  const primaryHex = describeSemanticHex(semantic.primary);
  const onPrimaryHex = describeSemanticHex(semantic['on-primary']);
  const outlineHex = describeSemanticHex(semantic.outline);
  const glassCss = generateGlassCss({
    selector: '.perfect-glass',
    blur: 22,
    opacity: mode === 'light' ? 0.48 : 0.24,
    tint: surfaceHex,
    mode,
    layers: 2,
    borderOpacity: mode === 'light' ? 0.62 : 0.24,
    saturation: 145,
    noise: 0.012,
    radius: 30
  });

  const proofCards = [
    perfectProofCard('Body on surface', surfaceInk, surfaceHex, 18, 400),
    perfectProofCard('Primary action', onPrimaryHex, primaryHex, 16, 700),
    perfectProofCard(
      'Signal accent',
      autoContrastAPCA(harmony.colors[1].tonal[500].hex),
      harmony.colors[1].tonal[500].hex,
      16,
      700
    )
  ];

  const proofMeasure = Math.round(perfectPxStep(fluid.scale, '2xl', 110) * 6.8);
  const layoutGap = Math.round(perfectPxStep(fluid.scale, 'xs', 24) * 0.9);
  const layoutPadding = Math.round(perfectPxStep(fluid.scale, 'sm', 32) * 0.85);
  const proofLayoutPlan: LayoutItem[] = [
    {
      id: 'signal',
      min: Math.round(perfectPxStep(fluid.scale, 'md', 52) * 1.9),
      preferred: Math.round(perfectPxStep(fluid.scale, 'lg', 72) * 2.1),
      max: Math.round(perfectPxStep(fluid.scale, 'xl', 90) * 2.4),
      grow: 1.1,
      shrink: 1
    },
    {
      id: 'body',
      min: Math.round(perfectPxStep(fluid.scale, 'xl', 90) * 2.45),
      preferred: Math.round(perfectPxStep(fluid.scale, '2xl', 110) * 2.75),
      max: Math.round(perfectPxStep(fluid.scale, '2xl', 110) * 3.15),
      grow: 1.8,
      shrink: 1.8
    },
    {
      id: 'assist',
      min: Math.round(perfectPxStep(fluid.scale, 'md', 52) * 2),
      preferred: Math.round(perfectPxStep(fluid.scale, 'lg', 72) * 2.15),
      max: Math.round(perfectPxStep(fluid.scale, 'xl', 90) * 2.05),
      grow: 0.8,
      shrink: 0.9
    }
  ];
  const layout = solveStackLayout(proofLayoutPlan, {
    container: proofMeasure,
    gap: layoutGap,
    padding: layoutPadding,
    align: 'start'
  });
  const layoutRects: Rect[] = [
    { id: 'signal', x: layout.items[0]?.start ?? 28, y: 26, width: layout.items[0]?.size ?? 170, height: 82 },
    { id: 'body', x: layout.items[1]?.start ?? 224, y: 118, width: layout.items[1]?.size ?? 320, height: 142 },
    { id: 'assist', x: layout.items[2]?.start ?? 520, y: 58, width: layout.items[2]?.size ?? 160, height: 104 }
  ];
  const composition = scoreComposition(layoutRects, { width: proofMeasure, height: 300 });
  const designDocument: DesignDocument = {
    frame: { width: proofMeasure, height: 300, padding: layoutPadding, gap: layoutGap, columns: 12 },
    background: {
      dominantColor: surfaceHex,
      subjectRegion: { x: proofMeasure * 0.36, y: 82, width: proofMeasure * 0.18, height: 104 }
    },
    elements: layoutRects.map((rect, index) => ({
      ...rect,
      kind: index === 0 ? 'shape' : 'text',
      role: index === 0 ? 'cta' : index === 1 ? 'body' : 'support',
      color: surfaceInk,
      background: index === 0 ? primaryHex : surfaceHex,
      fontSize: index === 1 ? 22 : 16,
      fontWeight: index === 0 ? 700 : 500
    }))
  };
  const saliency = analyzeImportance(designDocument, 'heuristic');
  const advancedLayout = solveDesignLayout(designDocument, { importanceReport: saliency });
  const advancedComposition = scoreDesignComposition(
    {
      ...designDocument,
      elements: advancedLayout.elements
    },
    saliency
  );
  const distinctness = analyzeDistinctness(
    [primaryHex, harmony.colors[1].hex, harmony.colors[2].hex, tonal[300].hex],
    10,
    { space: 'oklch', gamut: 'srgb', cvdModel: 'machado' }
  );
  const target = analyzeTargetAcquisition({
    distance: Math.round((layout.items[1]?.start ?? 220) + perfectPxStep(fluid.scale, 'xl', 90) * 0.8),
    width: Math.round(perfectPxStep(fluid.scale, 'sm', 32) * 1.5),
    choices: harmony.colors.length + 6,
    pathLength: Math.round(perfectPxStep(fluid.scale, '2xl', 110) * 1.8),
    pathWidth: Math.round(perfectPxStep(fluid.scale, 'sm', 32) * 0.92),
    modality: 'touch'
  });
  const typography = recommendTypography({
    fontSize: Math.round(perfectPxStep(fluid.scale, 'sm', 32) * 0.56),
    containerWidth: Math.round(perfectPxStep(fluid.scale, '2xl', 110) * 5.1),
    contrastLc: proofCards[0].lc,
    profile: proofCards[0].lc < 70 ? 'low-vision' : 'default',
    engine,
    sampleText: DEFAULT_PERFECT_LINEBREAK,
    language: 'en',
    hyphenate: true
  });
  const linebreak = {
    text: DEFAULT_PERFECT_LINEBREAK,
    balanced: balanceLines(DEFAULT_PERFECT_LINEBREAK, 24, 4),
    greedy: greedyBreak(DEFAULT_PERFECT_LINEBREAK, 24),
    advanced: balanceLinesByWidth({
      text: DEFAULT_PERFECT_LINEBREAK,
      widthPx: 420,
      fontSize: 18,
      language: 'en',
      hyphenate: true,
      opticalSizing: true,
      targetLines: 4,
      engine: 'advanced'
    })
  };
  const jerk = generateMinimumJerk(Math.max(0.34, motion.duration), 24);
  const optics = {
    circle: circleCorrections,
    icon: iconCorrections,
    iconTransform: joinTransforms(iconCorrections.corrections)
  };

  const summary = {
    input: { seed: baseColor, ratio: ratioName, mode, motion: motionPreset, engine },
    tokens: {
      baseColor,
      optimizedSeed: optimized.seedHex,
      primaryHex,
      onPrimaryHex,
      surfaceHex,
      surfaceInk,
      outlineHex,
      accentA: harmony.colors[1].hex,
      accentB: harmony.colors[2].hex,
      motionCurve
    },
    fluid,
    proofCards,
    harmony,
    glassCss,
    layout: {
      measure: proofMeasure,
      gap: layoutGap,
      padding: layoutPadding,
      result: layout,
      composition,
      advancedLayout,
      advancedComposition,
      saliency
    },
    distinctness,
    target,
    typography,
    linebreak,
    jerk,
    optics
  };

  if (format === 'json') {
    return formatJson(summary);
  }

  const rootLines = [
      `/* dk perfect --seed=${baseColor} --ratio=${ratioName} --motion=${motionPreset} --mode=${mode} */`,
      `/* engine ${engine} optimized seed ${optimized.seedHex} score ${optimized.scores.total} */`,
      `/* primary APCA ${proofCards[1].lc} (min ${proofCards[1].minLc}) */`,
      `/* distinct min ΔE00 ${distinctness.minDeltaE} */`,
      `/* composition total ${composition.total} */`,
      `/* advanced composition ${advancedComposition.total} saliency ${saliency.elements[0]?.id ?? 'n/a'} */`,
      `/* target total ${target.totalMs}ms */`,
      `/* text crowding ${typography.crowdingRisk} */`,
    ':root {',
    `  --perfect-base-color: ${baseColor};`,
    `  --perfect-primary: ${primaryHex};`,
    `  --perfect-surface: ${surfaceHex};`,
    `  --perfect-ink: ${surfaceInk};`,
    `  --perfect-outline: ${outlineHex};`,
    `  --perfect-accent-a: ${harmony.colors[1].hex};`,
    `  --perfect-accent-b: ${harmony.colors[2].hex};`,
    `  --perfect-ratio: ${fluid.meta.ratio};`,
    `  --perfect-curve: ${motionCurve};`,
    ...fluid.scale.map((step) => `  ${step.token}: ${step.value};`),
    '}'
  ];

  if (format === 'text') {
    return [
      'dk perfect',
      `primary ${primaryHex}  surface ${surfaceHex}  ratio ${fluid.meta.ratioName} (${fluid.meta.ratio})`,
      `motion ${motionPreset} settles in ${Math.round(motion.duration * 1000)}ms`,
      `distinctness ${distinctness.minDeltaE}  composition ${composition.total}  target ${target.totalMs}ms`,
      `typography crowding ${typography.crowdingRisk}  balanced break ${linebreak.balanced.badness}`,
      '',
      ...rootLines,
      '',
      glassCss
    ].join('\n');
  }

  return [...rootLines, '', glassCss].join('\n');
}

function renderMainHelp(): string {
  const lines = ['dk — Design Kit CLI', '', 'Usage: dk <command> [options]', '', 'Commands:'];
  for (const command of CLI_COMMANDS) {
    lines.push(`  ${safePad(command, 10)} ${COMMAND_SUMMARIES[command]}`);
  }
  lines.push(
    '',
    'Global options:',
    '  --format=<text|json|css|tailwind>  Output format (command support varies)',
    '  --json                             Shorthand for --format=json',
    '  --tailwind                         Shorthand for --format=tailwind',
    '  -h, --help                         Show help',
    '',
    'Examples:',
    '  dk cms login',
    '  dk components verify --all',
    '  dk cms pages create --site spring-launch --slug launch-01 --file campaign.json',
    '  dk perfect --seed "#295dff" --ratio perfect-fourth --motion snappy',
    '  dk layout --container 960 --gap 24',
    '  dk compose --frame 1440x900 --rects layout.json'
  );
  return lines.join('\n');
}

export const HELP: Record<string, string> = {
  main: renderMainHelp(),
  cms: `dk cms — Manage the DkCms typed publishing engine

Usage: dk cms login [options]
       dk cms sites <list|create|update> [options]
  dk cms pages <list|create|update|build|publish|submit|export-email> [options]

Login:
  dk cms login [--base-url=<url>] [--scope="openid profile email dkcms:read dkcms:write"]
  dk cms login --legacy-auth [--callback-port=<port>]

Sites:
  dk cms sites list [--json]
  dk cms sites create --slug=<slug> --name=<name> --query="..." [--base-color=<hex>] [--ratio=<name>] [--motion=<preset>] [--mode=<light|dark>]
  dk cms sites update <site-id|slug> [--slug=<slug>] [--name=<name>] [--query="..."]

Pages:
  dk cms pages list <site-id|slug> [--json]
  dk cms pages create <site-id|slug> --slug=<slug> --file=<campaign.json> [--title=<title>] [--summary="..."]
  dk cms pages update <site-id|slug> <page-id|slug> --slug=<slug> --file=<campaign.json> [--title=<title>] [--summary="..."]
  dk cms pages build <site-id|slug> <page-id|slug> [--iterations=<n>] [--embedding-mode=<heuristic|auto|ml>] [--embedding-model=<model>] [--refinement-mode=<heuristic|auto|runtime>]
  dk cms pages publish <site-id|slug> <page-id|slug> --build=<build-id>
  dk cms pages submit <site-id|slug> --slug=<slug> --file=<campaign.json> [--title=<title>] [--summary="..."] [--publish] [--iterations=<n>] [--embedding-mode=<heuristic|auto|ml>] [--embedding-model=<model>] [--refinement-mode=<heuristic|auto|runtime>]
  dk cms pages export-email --build=<build-id> --format=<html|text|json>
  dk cms pages export-email <site-id|slug> <page-id|slug> --format=<html|text|json>

Notes:
  Page create/update expects --file to point to an EmailCampaignContent JSON file.
  Email export reads either the chosen build (--build) or the page's published build.
  Login uses OAuth/OIDC device flow when discovery metadata is available and falls back to the legacy browser-code flow only for older deployments.`,
  components: `dk components — Verify proof-backed component recipes

Usage: dk components verify [options]
       dk components matrix [options]

Options:
  --all                      Verify every shipped component (default if --name is omitted)
  --name=<slug[,slug]>       Verify one or more component slugs or names
  --theme=<id[,id]|all>      Theme preset ids: cobalt, sage, ember, linen (default: all)

Formats:
  text (default), json

Examples:
  dk components verify --all
  dk components verify --name=table --theme=ember --json
  dk components matrix --theme=cobalt`,
  perfect: `dk perfect — Compose the full proof state

Usage: dk perfect [options]

Options:
  --seed=<hex>               Base seed color (default: #295dff)
  --ratio=<name>             Ratio name from dk scale (default: perfect-fourth)
  --motion=<preset>          Spring preset: ${Object.keys(SPRING_PRESETS).join(', ')}
  --mode=<light|dark>        Surface mode (default: light)
  --engine=<basic|advanced|auto>

Formats:
  css (default), text, json`,
  palette: `dk palette — Generate and optimize OKLCH color palettes

Usage: dk palette <hex> [options]

Options:
  --mode=<light|dark|both>   Theme mode (default: both)
  --prefix=<string>          CSS variable prefix (default: color)
  --harmony=<type>           Harmony: ${Object.keys(HARMONIES).join(', ')}
  --engine=<basic|advanced|auto>
  --goal=<ui|viz>
  --space=<oklch|cam16-ucs|jzazbz>
  --gamut=<srgb|p3|hdr>
  --cvd-model=<simple|machado>
  --optimize                 Force optimization mode

Formats:
  css (default), json, tailwind`,
  distinct: `dk distinct — Measure perceptual distinctness

Usage: dk distinct [seed-hex] [options]

Options:
  --harmony=<type>           Harmony used when seed is provided (default: split-complementary)
  --colors=<list|file>       Comma-separated color list or JSON file path
  --threshold=<n>            Minimum acceptable ΔE00 (default: 12)
  --space=<oklch|cam16-ucs|jzazbz>
  --gamut=<srgb|p3|hdr>
  --cvd-model=<simple|machado>
  --severity=<0-1>
  --vision=<none|protan|deutan|tritan>
  --stdin                    Read a JSON color list from stdin

Formats:
  text (default), json`,
  contrast: `dk contrast — APCA contrast checker

Usage: dk contrast <fg-hex> <bg-hex> [options]

Options:
  --size=<px>                Font size in px (default: 16)
  --weight=<n>               Font weight (default: 400)

Formats:
  css (default), text, json`,
  glass: `dk glass — Generate layered glass material CSS

Usage: dk glass [options]

Options:
  --blur=<px>                Backdrop blur radius (default: 12)
  --opacity=<0-1>            Background opacity (default: 0.08)
  --tint=<hex>               Fill color (default: mode-dependent)
  --mode=<light|dark>        Glass mode (default: light)
  --layers=<1-3>             Glass layers for depth (default: 1)
  --border-opacity=<0-1>     Border opacity (default: 0.15)
  --saturation=<percent>     Backdrop saturation (default: 120)
  --noise=<0-1>              Noise intensity (default: 0)
  --radius=<px>              Border radius (default: 16)
  --selector=<string>        CSS selector (default: .glass)

Formats:
  css (default), json`,
  layout: `dk layout — Solve stack layout constraints

Usage: dk layout [options]

Options:
  --scenario=<name>          Scenario: ${Object.keys(LAYOUT_SCENARIOS).join(', ')}
  --items=<file>             JSON file containing layout items
  --input=<file>             JSON design document for advanced layout
  --engine=<basic|advanced|auto>
  --importance=<heuristic|ml|auto>
  --runtime-url=<url>        Runtime base URL for server-backed importance (required for remote ml/auto)
  --stdin                    Read layout items JSON from stdin
  --container=<px>           Container width (default: 860)
  --gap=<px>                 Gap between items (default: 24)
  --padding=<px>             Rail padding (default: 28)
  --align=<start|center|end> Alignment (default: start)

Formats:
  text (default), json`,
  compose: `dk compose — Score compositional order

Usage: dk compose [options]

Options:
  --variant=<name>           Variant: ${Object.keys(COMPOSE_VARIANTS).join(', ')}
  --rects=<file>             JSON file containing rects
  --input=<file>             JSON design document for advanced composition
  --importance=<heuristic|ml|auto>
  --runtime-url=<url>        Runtime base URL for server-backed importance (required for remote ml/auto)
  --stdin                    Read rects JSON from stdin
  --frame=<width>x<height>   Frame size (default: 360x320)

Formats:
  text (default), json`,
  scale: `dk scale — Generate spacing and sizing scales

Usage: dk scale [options]

Options:
  --base=<px>                Base size in px (default: 16)
  --ratio=<name|number>      Ratio name or custom number (default: golden)
  --steps=<n>                Steps above base (default: 6)
  --down=<n>                 Steps below base (default: 2)
  --unit=<px|rem>            Output unit (default: rem)
  --prefix=<string>          CSS variable prefix (default: space)
  --naming=<natural|signed>  Step naming (default: natural)
  --fluid                    Generate fluid clamp() scale
  --base-min=<px>            Fluid minimum base size
  --base-max=<px>            Fluid maximum base size
  --vw-min=<px>              Fluid minimum viewport width
  --vw-max=<px>              Fluid maximum viewport width

Formats:
  css (default), json, tailwind`,
  optical: `dk optical — Optical correction values

Usage: dk optical <type> [options]

Types:
  ${OPTICAL_TYPES.join(', ')}

Options:
  --size=<px>                Element or font size in px (default: 48)

Formats:
  css (default), text, json`,
  ease: `dk ease — Spring physics easing

Usage: dk ease [options]

Options:
  --preset=<name>            Preset: ${Object.keys(SPRING_PRESETS).join(', ')}
  --mass=<n>                 Spring mass (default: 1)
  --stiffness=<n>            Spring stiffness (default: 180)
  --damping=<n>              Spring damping (default: 12)
  --samples=<n>              Sample count (default: 50)

Formats:
  css (default), text, json`,
  jerk: `dk jerk — Minimum-jerk motion

Usage: dk jerk [options]

Options:
  --duration=<s>             Motion duration (default: 0.6)
  --samples=<n>              Sample count (default: 32)

Formats:
  css (default), text, json`,
  typeset: `dk typeset — Advanced text shaping and balancing

Usage: dk typeset [options]

Options:
  --engine=<basic|advanced|auto>
  --font=<px>                Font size in px (default: 18)
  --width-px=<px>            Container width in px (default: 620)
  --text=<string>            Input text
  --language=<code>          Language code (default: en)
  --white-space=<normal|pre-wrap>
  --hyphenate                Enable hyphenation
  --opsz=<auto|off>          Optical sizing mode (default: auto)

Formats:
  css (default), text, json`,
  text: `dk text — Text spacing recommendations

Usage: dk text [options]

Options:
  --engine=<basic|advanced|auto>
  --font=<px>                Font size in px (default: 18)
  --measure=<px>             Container width in px (default: 620)
  --width-px=<px>            Alias for --measure
  --text=<string>            Input text
  --language=<code>          Language code (default: en)
  --white-space=<normal|pre-wrap>
  --hyphenate                Enable hyphenation
  --opsz=<auto|off>          Optical sizing mode (default: auto)
  --contrast=<Lc>            Contrast in APCA Lc (default: 72)
  --profile=<default|low-vision>

Formats:
  css (default), text, json`,
  linebreak: `dk linebreak — Compare balanced and greedy wrapping

Usage: dk linebreak [text] [options]

Options:
  --text=<string>            Input text
  --file=<path>              Read text from file
  --stdin                    Read text from stdin
  --engine=<basic|advanced|auto>
  --width-px=<px>            Width-aware balancing target
  --flow=<lead>x<lines>x<body>
  --font=<px>                Font size in px (default: 18)
  --language=<code>          Language code (default: en)
  --white-space=<normal|pre-wrap>
  --hyphenate                Enable hyphenation
  --opsz=<auto|off>          Optical sizing mode (default: auto)
  --chars=<n>                Maximum characters per line (default: 22)
  --lines=<n>                Target line count (default: 3)

Formats:
  text (default), json`,
  audit: `dk audit — Score CSS against DesignKit heuristics

Usage: dk audit (--css=<file> | --stdin) [options]

Options:
  --mode=<source>            Source CSS audit mode (default: source)

Formats:
  css (default), text, json`,
  target: `dk target — Estimate interaction burden

Usage: dk target [options]

Options:
  --distance=<px>            Pointer travel distance (default: 320)
  --width=<px>               Target width (default: 44)
  --choices=<n>              Number of choices (default: 9)
  --modality=<mouse|touch>
  --path-length=<px>         Steering path length (default: 180)
  --path-width=<px>          Steering path width (default: 28)

Formats:
  text (default), json`,
  saliency: `dk saliency — Score visual importance from a design document

Usage: dk saliency (--input=<file> | --stdin) [options]

Options:
  --importance=<heuristic|ml|auto>
  --runtime-url=<url>        Runtime base URL for server-backed importance (required for remote ml/auto)

Formats:
  text (default), json`,
  future: `dk future — Analyze content topology and generate layout CSS

Usage: dk future --items=<file> [--query="..."] [options]
       cat items.json | dk future --stdin --query="..."

Options:
  --items=<file>             JSON array of {id, role, label, text} items
  --query=<string>           Semantic query describing the layout goal
  --audit                    Run dk audit on the generated layout CSS
  --refine                   Auto-iterate until topology stabilizes
  --iterations=<n>           Max refinement passes (default: 3)
  --runtime-url=<url>        Server URL for LLM-driven refinement (uses kimi-k2.5 via Workers AI)
  --stdin                    Read items JSON from stdin

Formats:
  css (default), json, text

Refinement modes:
  --refine                   Local heuristic (role demotion/promotion based on anchor scores)
  --refine --runtime-url=<url>  LLM-driven (kimi-k2.5 analyzes topology and suggests rewrites)`
};

async function renderFuture(flags: FlagMap, positional: string[], io: CliIO): Promise<string> {
  const helpCommand = 'future';
  const format = resolveFormat(flags, 'css', ['css', 'json', 'text'], helpCommand);
  const doAudit = flags.audit === true;
  const doRefine = flags.refine === true;
  const iterations = getIntegerFlag(flags, 'iterations', 3, helpCommand);
  const queryFlag = getStringFlag(flags, 'query') ?? (positional.length > 0 ? positional.join(' ') : '');
  const file = getStringFlag(flags, 'items');

  let itemsJson: string;
  if (file) {
    itemsJson = await readTextFile(io, file);
  } else if (flags.stdin) {
    itemsJson = await io.readStdin();
  } else {
    fail('Provide --items=path.json or pipe JSON with --stdin', helpCommand);
  }

  let items: FutureTopologyItem[];
  try {
    const parsed = JSON.parse(itemsJson) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      fail('Items must be a non-empty JSON array', helpCommand);
    }
    items = parsed as FutureTopologyItem[];
  } catch {
    fail('Items file is not valid JSON', helpCommand);
  }

  const query = queryFlag || 'Arrange these content items into a coherent layout.';
  const runtimeUrl = getStringFlag(flags, 'runtime-url') ?? io.getEnv?.('DK_RUNTIME_URL') ?? process.env.DK_RUNTIME_URL;

  type Pass = { iteration: number; report: FutureTopologyReport; layoutCss: string; auditScore: number | null; diagnosis: FutureDiagnosis };
  const passes: Pass[] = [];

  // If --refine with a runtime URL, delegate the full loop to the server
  if (doRefine && runtimeUrl) {
    const result = await postRuntimeJson<{
      passes: Array<{
        iteration: number;
        report: FutureTopologyReport;
        layoutCss: string;
        auditReport?: {
          overall: number;
        };
        diagnosis: FutureDiagnosis;
        items: FutureTopologyItem[];
      }>;
      finalItems: FutureTopologyItem[];
      converged: boolean;
    }>(io, runtimeUrl, '/api/dk/future/refine', { items, query, iterations }, helpCommand);

    for (const pass of result.passes) {
      passes.push({
        iteration: pass.iteration,
        report: pass.report,
        layoutCss: pass.layoutCss,
        auditScore: pass.auditReport?.overall ?? (doAudit ? audit(pass.layoutCss).overall : null),
        diagnosis: pass.diagnosis
      });
    }
  } else {
    // Local: heuristic topology + heuristic refinement
    let currentItems = items;
    let report = analyzeEmbeddingTopologyHeuristic(currentItems, query);
    let layoutCss = generateLayoutCss(report);
    const auditResult = doAudit ? audit(layoutCss) : null;
    let diagnosis = diagnoseFutureTopology(report, auditResult ?? undefined);
    passes.push({ iteration: 1, report, layoutCss, auditScore: auditResult?.overall ?? null, diagnosis });

    if (doRefine) {
      for (let i = 2; i <= iterations; i += 1) {
        if (diagnosis.stable) break;
        currentItems = refineFutureItems(currentItems, diagnosis.refinements);
        report = analyzeEmbeddingTopologyHeuristic(currentItems, query);
        layoutCss = generateLayoutCss(report);
        const iterAudit = doAudit ? audit(layoutCss) : null;
        diagnosis = diagnoseFutureTopology(report, iterAudit ?? undefined);
        passes.push({
          iteration: i,
          report,
          layoutCss,
          auditScore: iterAudit?.overall ?? null,
          diagnosis
        });
      }
    }
  }

  const latest = passes[passes.length - 1];

  if (format === 'json') {
    return formatJson(passes.map(p => ({
      iteration: p.iteration,
      verdict: p.report.evaluation.verdict,
      metrics: p.report.metrics,
      clusters: p.report.clusters.length,
      anchor: p.report.recommendation.anchorId,
      bridge: p.report.recommendation.bridgeId,
      slotPlan: p.report.recommendation.slotPlan,
      readingOrder: p.report.recommendation.readingOrder,
      auditScore: p.auditScore,
      stable: p.diagnosis.stable,
      notes: p.diagnosis.notes,
      layoutCss: p.layoutCss
    })));
  }

  if (format === 'text') {
    const lines: string[] = [];
    for (const pass of passes) {
      const r = pass.report;
      if (passes.length > 1) lines.push(`── Pass ${pass.iteration} ──`);
      lines.push(`dk future — ${r.evaluation.verdict} (${r.clusters.length} clusters)`);
      lines.push(`  separation: ${r.metrics.clusterSeparation}  adjacency: ${r.metrics.adjacencyConfidence}  query-align: ${r.metrics.queryAlignment}`);
      lines.push(`  anchor: ${r.recommendation.anchorId}  bridge: ${r.recommendation.bridgeId}`);
      lines.push(`  reading order: ${r.recommendation.readingOrder.join(' → ')}`);
      for (const slot of r.recommendation.slotPlan) {
        lines.push(`  ${slot.slot}: ${slot.itemIds.join(', ')}`);
      }
      if (pass.auditScore !== null) {
        lines.push(`  audit score: ${pass.auditScore}/100`);
      }
      if (pass.diagnosis.notes.length > 0) {
        lines.push('');
        for (const note of pass.diagnosis.notes) {
          lines.push(`  ⚠ ${note}`);
        }
      }
      if (pass.diagnosis.stable) {
        lines.push('');
        lines.push('  ✓ Topology is stable.');
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  return latest.layoutCss;
}

type ComponentProofFailure = {
  fixtureName: string;
  caseKey: string;
  reasons: string[];
};

type ComponentVerificationRun = {
  slug: string;
  name: string;
  themeId: string;
  themeName: string;
  caseCount: number;
  fixtureCount: number;
  pass: boolean;
  failures: ComponentProofFailure[];
};

type ComponentVerificationSummary = {
  componentCount: number;
  themeCount: number;
  runCount: number;
  passedRuns: number;
  fixtureCount: number;
  failedFixtureCount: number;
  pass: boolean;
};

type ComponentsCommandReport = {
  mode: 'verify' | 'matrix';
  components: string[];
  themes: string[];
  summary: ComponentVerificationSummary;
  runs: ComponentVerificationRun[];
};

type ComponentThemePreset = CreateThemeOptions & { id: string };

type ComponentVerificationEntry = {
  slug: string;
  name: string;
  createRegistration: (theme: ReturnType<typeof createTheme>) => {
    recipe: {
      cases: Record<string, unknown>;
      proofFixtures: Array<{
        name: string;
        caseKey: string;
        contrast: Array<{ pass: boolean; lc: number; minLc: number }>;
        target: Array<{ pass: boolean; actualSizePx: number; minSizePx: number }>;
        layout: Array<{ pass: boolean; widths: number[] }>;
        helperText: Array<{ pass: boolean; estimatedLines: number[]; maxLines: number }>;
        optionRow: Array<{ pass: boolean; actualSizePx: number; minSizePx: number }>;
        anchoredSurface: Array<{
          pass: boolean;
          viewportWidth: number;
          viewportHeight: number;
          surfaceWidthPx: number;
          surfaceHeightPx: number;
        }>;
        motion: Array<{ pass: boolean; durationMs: number; durationMaxMs: number }>;
      }>;
    };
  };
};

type ComponentsVerificationModule = {
  COMPONENT_VERIFICATION_REGISTRY: readonly ComponentVerificationEntry[];
  DK_COMPONENT_THEME_PRESETS: readonly ComponentThemePreset[];
  findComponentVerificationEntry: (nameOrSlug: string) => ComponentVerificationEntry | undefined;
  getComponentThemePreset: (themeId: string) => ComponentThemePreset | undefined;
};

let componentsVerificationPromise: Promise<ComponentsVerificationModule> | undefined;
const PUBLISHED_COMPONENTS_VERIFICATION_SPECIFIER = '@dkcli/components/verification';

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function buildWorkspaceComponentsVerificationBundle(): void {
  const hasLocalTsup = existsSync(WORKSPACE_TSUP_BIN);
  const result = spawnSync(
    hasLocalTsup ? WORKSPACE_TSUP_BIN : 'pnpm',
    [
      ...(hasLocalTsup ? [] : ['exec', 'tsup']),
      WORKSPACE_COMPONENTS_VERIFICATION_ENTRY,
      '--format',
      'esm',
      '--platform',
      'node',
      '--target',
      'node20',
      '--out-dir',
      WORKSPACE_COMPONENTS_VERIFICATION_BUNDLE_DIR,
      '--silent',
      '--clean'
    ],
    {
      cwd: WORKSPACE_COMPONENTS_DIR,
      encoding: 'utf8'
    }
  );

  if (result.status === 0) {
    return;
  }

  const details = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join('\n');
  fail(`Failed to prepare the component verification bundle for dk components.\n${details}`, 'components');
}

async function loadComponentsVerificationModule(): Promise<ComponentsVerificationModule> {
  componentsVerificationPromise ??= (async () => {
    const hasWorkspacePackage = await fileExists(WORKSPACE_COMPONENTS_PACKAGE_JSON);

    if (hasWorkspacePackage) {
      buildWorkspaceComponentsVerificationBundle();
      return (await import(
        `${pathToFileURL(WORKSPACE_COMPONENTS_VERIFICATION_BUNDLE).href}?t=${Date.now()}`
      )) as ComponentsVerificationModule;
    }

    try {
      return (await import(
        PUBLISHED_COMPONENTS_VERIFICATION_SPECIFIER
      )) as unknown as ComponentsVerificationModule;
    } catch (initialError) {
      const reason = initialError instanceof Error ? initialError.message : String(initialError);
      fail(`Unable to load @dkcli/components/verification for dk components.\n${reason}`, 'components');
    }
  })();

  return componentsVerificationPromise;
}

function parseCommaList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function resolveComponentEntries(
  flags: FlagMap,
  helpCommand: string,
  verification: ComponentsVerificationModule
): ComponentVerificationEntry[] {
  const names = parseCommaList(getStringFlag(flags, 'name'));
  if (flags.all === true && names.length > 0) {
    fail('Use either --all or --name, not both.', helpCommand);
  }

  if (flags.all === true || names.length === 0) {
    return [...verification.COMPONENT_VERIFICATION_REGISTRY];
  }

  return names.map((name) => {
    const entry = verification.findComponentVerificationEntry(name);
    if (!entry) {
      fail(
        `Unknown component "${name}". Known components: ${verification.COMPONENT_VERIFICATION_REGISTRY.map((item) => item.slug).join(', ')}.`,
        helpCommand
      );
    }
    return entry;
  });
}

function resolveThemePresets(
  flags: FlagMap,
  helpCommand: string,
  verification: ComponentsVerificationModule
): ComponentThemePreset[] {
  const requested = parseCommaList(getStringFlag(flags, 'theme'));
  if (requested.length === 0 || requested.includes('all')) {
    return [...verification.DK_COMPONENT_THEME_PRESETS];
  }

  return requested.map((themeId) => {
    const preset = verification.getComponentThemePreset(themeId.toLowerCase());
    if (!preset) {
      fail(
        `Unknown theme "${themeId}". Known themes: ${verification.DK_COMPONENT_THEME_PRESETS.map((theme) => theme.id).join(', ')}.`,
        helpCommand
      );
    }
    return preset;
  });
}

function collectFixtureFailures(
  runName: string,
  fixture: {
    name: string;
    caseKey: string;
    contrast: Array<{ pass: boolean; lc: number; minLc: number }>;
    target: Array<{ pass: boolean; actualSizePx: number; minSizePx: number }>;
    layout: Array<{ pass: boolean; widths: number[] }>;
    helperText: Array<{ pass: boolean; estimatedLines: number[]; maxLines: number }>;
    optionRow: Array<{ pass: boolean; actualSizePx: number; minSizePx: number }>;
    anchoredSurface: Array<{ pass: boolean; viewportWidth: number; viewportHeight: number; surfaceWidthPx: number; surfaceHeightPx: number }>;
    motion: Array<{ pass: boolean; durationMs: number; durationMaxMs: number }>;
  }
): ComponentProofFailure | null {
  const reasons = [
    ...fixture.contrast
      .filter((proof) => !proof.pass)
      .map((proof) => `contrast ${proof.lc.toFixed(1)}Lc < ${proof.minLc}Lc`),
    ...fixture.target
      .filter((proof) => !proof.pass)
      .map((proof) => `target ${proof.actualSizePx}px < ${proof.minSizePx}px`),
    ...fixture.layout
      .filter((proof) => !proof.pass)
      .map((proof) => `layout overflow at ${proof.widths.join(', ')}px`),
    ...fixture.helperText
      .filter((proof) => !proof.pass)
      .map((proof) => `helper text ${proof.estimatedLines.join(', ')} lines > ${proof.maxLines}`),
    ...fixture.optionRow
      .filter((proof) => !proof.pass)
      .map((proof) => `option row ${proof.actualSizePx}px < ${proof.minSizePx}px`),
    ...fixture.anchoredSurface
      .filter((proof) => !proof.pass)
      .map((proof) => `surface ${proof.surfaceWidthPx}x${proof.surfaceHeightPx}px exceeds ${proof.viewportWidth}x${proof.viewportHeight}px viewport`),
    ...fixture.motion
      .filter((proof) => !proof.pass)
      .map((proof) => `motion ${proof.durationMs}ms > ${proof.durationMaxMs}ms`)
  ];

  if (reasons.length === 0) {
    return null;
  }

  return {
    fixtureName: `${runName} / ${fixture.name}`,
    caseKey: fixture.caseKey,
    reasons
  };
}

function buildComponentsReport(
  mode: 'verify' | 'matrix',
  componentEntries: ComponentVerificationEntry[],
  themes: ComponentThemePreset[]
): ComponentsCommandReport {
  const runs: ComponentVerificationRun[] = [];

  for (const themePreset of themes) {
    const theme = createTheme(themePreset);
    for (const componentEntry of componentEntries) {
      const registration = componentEntry.createRegistration(theme);
      const failures = registration.recipe.proofFixtures
        .map((fixture) => collectFixtureFailures(`${themePreset.name} / ${componentEntry.name}`, fixture))
        .filter((failure): failure is ComponentProofFailure => failure !== null);

      runs.push({
        slug: componentEntry.slug,
        name: componentEntry.name,
        themeId: themePreset.id,
        themeName: themePreset.name,
        caseCount: Object.keys(registration.recipe.cases).length,
        fixtureCount: registration.recipe.proofFixtures.length,
        pass: failures.length === 0,
        failures
      });
    }
  }

  const fixtureCount = runs.reduce((total, run) => total + run.fixtureCount, 0);
  const failedFixtureCount = runs.reduce((total, run) => total + run.failures.length, 0);
  const passedRuns = runs.filter((run) => run.pass).length;

  return {
    mode,
    components: componentEntries.map((entry) => entry.slug),
    themes: themes.map((theme) => theme.id),
    summary: {
      componentCount: componentEntries.length,
      themeCount: themes.length,
      runCount: runs.length,
      passedRuns,
      fixtureCount,
      failedFixtureCount,
      pass: failedFixtureCount === 0
    },
    runs
  };
}

function renderComponentsVerifyText(report: ComponentsCommandReport): string {
  const lines = ['dk components verify'];
  lines.push(`  components: ${report.summary.componentCount}`);
  lines.push(
    `  themes: ${report.runs
      .map((run) => run.themeName)
      .filter((value, index, array) => array.indexOf(value) === index)
      .join(', ')}`
  );
  lines.push(`  runs: ${report.summary.runCount}`);
  lines.push(`  proof fixtures: ${report.summary.fixtureCount}`);

  if (report.summary.pass) {
    lines.push('  result: all component proofs passed');
  } else {
    lines.push(
      `  result: ${report.summary.passedRuns}/${report.summary.runCount} runs passed, ${report.summary.failedFixtureCount} fixtures failed`
    );
  }

  const fewRuns = report.runs.length <= 12;
  if (fewRuns || !report.summary.pass) {
    lines.push('');
    for (const run of report.runs) {
      lines.push(
        `${run.pass ? '✓' : '✗'} ${run.themeName} / ${run.name} — ${run.fixtureCount} fixtures across ${run.caseCount} cases`
      );
      if (!run.pass) {
        for (const failure of run.failures) {
          lines.push(`    ${failure.fixtureName} (${failure.caseKey})`);
          for (const reason of failure.reasons) {
            lines.push(`      - ${reason}`);
          }
        }
      }
    }
  } else {
    const themeSummaries = report.runs.reduce<Record<string, { total: number; passed: number; fixtures: number }>>(
      (accumulator, run) => {
        const bucket = (accumulator[run.themeName] ??= { total: 0, passed: 0, fixtures: 0 });
        bucket.total += 1;
        bucket.fixtures += run.fixtureCount;
        if (run.pass) {
          bucket.passed += 1;
        }
        return accumulator;
      },
      {}
    );

    lines.push('', 'By theme:');
    for (const [themeName, summary] of Object.entries(themeSummaries)) {
      lines.push(`  ${themeName}: ${summary.passed}/${summary.total} runs passed, ${summary.fixtures} fixtures`);
    }
  }

  return lines.join('\n');
}

function renderComponentsMatrixText(report: ComponentsCommandReport, themes: ComponentThemePreset[]): string {
  const themeOrder = report.themes
    .map((themeId) => themes.find((theme) => theme.id === themeId))
    .filter((theme): theme is ComponentThemePreset => Boolean(theme));
  const header = ['Component', ...themeOrder.map((theme) => theme.name)];
  const nameWidth = Math.max(header[0].length, ...report.runs.map((run) => run.name.length));
  const cellWidth = Math.max(...header.slice(1).map((label) => label.length), 7);
  const lines = ['dk components matrix', ''];

  lines.push(
    `${safePad(header[0], nameWidth)}  ${header
      .slice(1)
      .map((label) => safePad(label, cellWidth))
      .join('  ')}`
  );

  for (const slug of report.components) {
    const rowRuns = report.runs.filter((run) => run.slug === slug);
    const name = rowRuns[0]?.name ?? slug;
    const cells = themeOrder.map((theme) => {
      const run = rowRuns.find((candidate) => candidate.themeId === theme.id);
      if (!run) {
        return safePad('-', cellWidth);
      }
      return safePad(`${run.pass ? '✓' : '✗'}${run.fixtureCount}`, cellWidth);
    });
    lines.push(`${safePad(name, nameWidth)}  ${cells.join('  ')}`);
  }

  lines.push(
    '',
    `Summary: ${report.summary.passedRuns}/${report.summary.runCount} runs passed across ${report.summary.fixtureCount} fixtures`
  );
  return lines.join('\n');
}

async function renderComponents(flags: FlagMap, positional: string[]): Promise<string> {
  const helpCommand = 'components';
  const subcommand = (positional[0] ?? 'verify').toLowerCase();
  const format = resolveFormat(flags, 'text', ['text', 'json'], helpCommand);

  if (!['verify', 'matrix'].includes(subcommand)) {
    fail(`Unknown dk components subcommand "${subcommand}". Supported: verify, matrix.`, helpCommand);
  }

  const verification = await loadComponentsVerificationModule();
  const componentEntries = resolveComponentEntries(flags, helpCommand, verification);
  const themes = resolveThemePresets(flags, helpCommand, verification);
  const report = buildComponentsReport(subcommand as 'verify' | 'matrix', componentEntries, themes);

  if (format === 'json') {
    return formatJson(report);
  }

  return subcommand === 'matrix' ? renderComponentsMatrixText(report, themes) : renderComponentsVerifyText(report);
}

function renderHelp(command: string | undefined, executableName: string): string {
  const template = HELP[command ?? ''] ?? HELP.main;
  return template.replace(/\bdk\b/g, executableName);
}

export async function runCli(argv: string[], io: CliIO = createNodeIO()): Promise<number> {
  const { command, flags, positional } = parseArgs(argv);

  if (flags.help || flags.h || !command) {
    io.stdout(renderHelp(command ?? undefined, io.executableName));
    return 0;
  }

  try {
    let output: string;
    switch (command) {
      case 'components':
        output = await renderComponents(flags, positional);
        break;
      case 'perfect':
        output = renderPerfect(flags);
        break;
      case 'palette':
        output = renderPalette(flags, positional);
        break;
      case 'distinct':
        output = await renderDistinct(flags, positional, io);
        break;
      case 'contrast':
        output = renderContrast(flags, positional);
        break;
      case 'glass':
        output = renderGlass(flags);
        break;
      case 'layout':
        output = await renderLayout(flags, io);
        break;
      case 'compose':
        output = await renderCompose(flags, io);
        break;
      case 'scale':
        output = renderScale(flags);
        break;
      case 'optical':
        output = renderOptical(flags, positional);
        break;
      case 'ease':
        output = renderEase(flags);
        break;
      case 'jerk':
        output = renderJerk(flags);
        break;
      case 'typeset':
        output = renderText(flags);
        break;
      case 'text':
        output = renderText(flags);
        break;
      case 'linebreak':
        output = await renderLinebreak(flags, positional, io);
        break;
      case 'audit':
        output = await renderAudit(flags, io);
        break;
      case 'target':
        output = renderTarget(flags);
        break;
      case 'saliency':
        output = await renderSaliency(flags, io);
        break;
      case 'future':
        output = await renderFuture(flags, positional, io);
        break;
      case 'cms':
        output = await renderCmsCommand(flags, positional, io);
        break;
      default:
        throw new CliError(`Unknown command: ${command}`, 'main');
    }

    io.stdout(output);
    return 0;
  } catch (error) {
    const cliLikeError =
      error instanceof CliError ||
      (error &&
        typeof error === 'object' &&
        'message' in error &&
        'helpCommand' in error &&
        typeof (error as { message?: unknown }).message === 'string');

    if (cliLikeError) {
      const message = (error as { message: string }).message;
      const helpCommand = (error as { helpCommand?: string }).helpCommand;
      io.stderr(message);
      const help = renderHelp(helpCommand, io.executableName);
      io.stderr(help);
      return 1;
    }

    io.stderr(error instanceof Error ? error.message : 'Unknown CLI failure');
    return 1;
  }
}
