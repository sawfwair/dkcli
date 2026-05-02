// Perception — Color difference, deficiency simulation, and distinctness analysis.

import Color from 'colorjs.io';

import { hexToCam16Ucs, parseCssColor, srgbToHex } from './color.ts';
import type { ColorSpace, CvdModel, Gamut } from './types.ts';

export type LabColor = {
  l: number;
  a: number;
  b: number;
};

export type CvdType = 'protan' | 'deutan' | 'tritan';

export type DistinctPair = {
  left: string;
  right: string;
  deltaE: number;
};

export type DistinctnessReport = {
  minDeltaE: number;
  collisions: DistinctPair[];
  cvd: Record<CvdType, { minDeltaE: number; collisions: DistinctPair[] }>;
  space: ColorSpace;
  gamut: Gamut;
};

// ── Machado et al. (2009) CVD simulation matrices ──────────────────────────
// 11 pre-computed matrices per CVD type (severity 0.0 through 1.0 in 0.1 steps).
// Source: https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html
//
// At severity 0.0 the matrix is identity (normal vision).
// At severity 1.0 the matrix represents full dichromacy, matching Vienot et al. (1999).

type Matrix3x3 = [number[], number[], number[]];

const MACHADO_PROTAN: Matrix3x3[] = [
  // 0.0
  [[1.000000, 0.000000, -0.000000], [0.000000, 1.000000, 0.000000], [-0.000000, -0.000000, 1.000000]],
  // 0.1
  [[0.856167, 0.182038, -0.038205], [0.029342, 0.955115, 0.015544], [-0.002880, -0.001563, 1.004443]],
  // 0.2
  [[0.734766, 0.334872, -0.069637], [0.051840, 0.919198, 0.028963], [-0.004928, -0.004209, 1.009137]],
  // 0.3
  [[0.630323, 0.465641, -0.095964], [0.069181, 0.890046, 0.040773], [-0.006308, -0.007724, 1.014032]],
  // 0.4
  [[0.539009, 0.579343, -0.118352], [0.082546, 0.866121, 0.051332], [-0.007136, -0.011959, 1.019095]],
  // 0.5
  [[0.458064, 0.679578, -0.137642], [0.092785, 0.846313, 0.060902], [-0.007494, -0.016807, 1.024301]],
  // 0.6
  [[0.385450, 0.769005, -0.154455], [0.100526, 0.829802, 0.069673], [-0.007442, -0.022190, 1.029632]],
  // 0.7
  [[0.319627, 0.849633, -0.169261], [0.106241, 0.815969, 0.077790], [-0.007025, -0.028051, 1.035076]],
  // 0.8
  [[0.259411, 0.923008, -0.182420], [0.110296, 0.804340, 0.085364], [-0.006276, -0.034346, 1.040622]],
  // 0.9
  [[0.203876, 0.990338, -0.194214], [0.112975, 0.794542, 0.092483], [-0.005222, -0.041043, 1.046265]],
  // 1.0
  [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
];

const MACHADO_DEUTAN: Matrix3x3[] = [
  // 0.0
  [[1.000000, 0.000000, -0.000000], [0.000000, 1.000000, 0.000000], [-0.000000, -0.000000, 1.000000]],
  // 0.1
  [[0.866435, 0.177704, -0.044139], [0.049567, 0.939063, 0.011370], [-0.003453, 0.007233, 0.996220]],
  // 0.2
  [[0.760729, 0.319078, -0.079807], [0.090568, 0.889315, 0.020117], [-0.006027, 0.013325, 0.992702]],
  // 0.3
  [[0.675425, 0.433850, -0.109275], [0.125303, 0.847755, 0.026942], [-0.007950, 0.018572, 0.989378]],
  // 0.4
  [[0.605511, 0.528560, -0.134071], [0.155318, 0.812366, 0.032316], [-0.009376, 0.023176, 0.986200]],
  // 0.5
  [[0.547494, 0.607765, -0.155259], [0.181692, 0.781742, 0.036566], [-0.010410, 0.027275, 0.983136]],
  // 0.6
  [[0.498864, 0.674741, -0.173604], [0.205199, 0.754872, 0.039929], [-0.011131, 0.030969, 0.980162]],
  // 0.7
  [[0.457771, 0.731899, -0.189670], [0.226409, 0.731012, 0.042579], [-0.011595, 0.034333, 0.977261]],
  // 0.8
  [[0.422823, 0.781057, -0.203881], [0.245752, 0.709602, 0.044646], [-0.011843, 0.037423, 0.974421]],
  // 0.9
  [[0.392952, 0.823610, -0.216562], [0.263559, 0.690210, 0.046232], [-0.011910, 0.040281, 0.971630]],
  // 1.0
  [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
];

const MACHADO_TRITAN: Matrix3x3[] = [
  // 0.0
  [[1.000000, 0.000000, -0.000000], [0.000000, 1.000000, 0.000000], [-0.000000, -0.000000, 1.000000]],
  // 0.1
  [[0.926670, 0.092514, -0.019184], [0.021191, 0.964503, 0.014306], [0.008437, 0.054813, 0.936750]],
  // 0.2
  [[0.895720, 0.133330, -0.029050], [0.029997, 0.945400, 0.024603], [0.013027, 0.104707, 0.882266]],
  // 0.3
  [[0.905871, 0.127791, -0.033662], [0.026856, 0.941251, 0.031893], [0.013410, 0.148296, 0.838294]],
  // 0.4
  [[0.948035, 0.089490, -0.037526], [0.014364, 0.946792, 0.038844], [0.010853, 0.193991, 0.795156]],
  // 0.5
  [[1.017277, 0.027029, -0.044306], [-0.006113, 0.958479, 0.047634], [0.006379, 0.248708, 0.744913]],
  // 0.6
  [[1.104996, -0.046633, -0.058363], [-0.032137, 0.971635, 0.060503], [0.001336, 0.317922, 0.680742]],
  // 0.7
  [[1.193214, -0.109812, -0.083402], [-0.058496, 0.979410, 0.079086], [-0.002346, 0.403492, 0.598854]],
  // 0.8
  [[1.257728, -0.139648, -0.118081], [-0.078003, 0.975409, 0.102594], [-0.003316, 0.501214, 0.502102]],
  // 0.9
  [[1.278864, -0.125333, -0.153531], [-0.084748, 0.957674, 0.127074], [-0.000989, 0.601151, 0.399838]],
  // 1.0
  [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
];

const MACHADO_TABLES: Record<CvdType, Matrix3x3[]> = {
  protan: MACHADO_PROTAN,
  deutan: MACHADO_DEUTAN,
  tritan: MACHADO_TRITAN,
};

/** Interpolate a CVD matrix from the Machado lookup table at a given severity. */
function machadoMatrix(type: CvdType, severity: number): Matrix3x3 {
  const table = MACHADO_TABLES[type];
  const s = Math.min(Math.max(severity, 0), 1);
  const idx = s * 10;
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, 10);
  const t = idx - lo;

  if (t === 0) return table[lo];

  const mLo = table[lo];
  const mHi = table[hi];
  return [
    [mLo[0][0] + t * (mHi[0][0] - mLo[0][0]), mLo[0][1] + t * (mHi[0][1] - mLo[0][1]), mLo[0][2] + t * (mHi[0][2] - mLo[0][2])],
    [mLo[1][0] + t * (mHi[1][0] - mLo[1][0]), mLo[1][1] + t * (mHi[1][1] - mLo[1][1]), mLo[1][2] + t * (mHi[1][2] - mLo[1][2])],
    [mLo[2][0] + t * (mHi[2][0] - mLo[2][0]), mLo[2][1] + t * (mHi[2][1] - mLo[2][1]), mLo[2][2] + t * (mHi[2][2] - mLo[2][2])],
  ] as Matrix3x3;
}

function round(value: number, digits: number = 4): number {
  return parseFloat(value.toFixed(digits));
}

function clamp(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export function hexToLab(hex: string): LabColor {
  const color = new Color(hex).to('lab');
  const [l, a, b] = color.coords;
  return { l: l ?? 0, a: a ?? 0, b: b ?? 0 };
}

export function deltaE00Lab(left: LabColor, right: LabColor): number {
  const leftColor = new Color('lab', [left.l, left.a, left.b]);
  const rightColor = new Color('lab', [right.l, right.a, right.b]);
  return round(leftColor.deltaE2000(rightColor));
}

export function deltaE00(leftHex: string, rightHex: string): number {
  return round(new Color(leftHex).deltaE2000(new Color(rightHex)));
}

export function deltaEColorSpace(
  leftHex: string,
  rightHex: string,
  space: ColorSpace = 'oklch'
): number {
  const left = new Color(leftHex);
  const right = new Color(rightHex);
  if (space === 'jzazbz') {
    return round(left.deltaEJz(right));
  }
  if (space === 'cam16-ucs') {
    const a = hexToCam16Ucs(leftHex);
    const b = hexToCam16Ucs(rightHex);
    return round(Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2));
  }
  return round(left.deltaE2000(right));
}

export function simulateCvd(
  hex: string,
  type: CvdType,
  severity: number = 1,
  model: CvdModel = 'simple'
): string {
  const factor = Math.min(Math.max(severity, 0), 1);
  const color = new Color(hex).to('srgb');
  const [r, g, b] = color.coords as [number, number, number];
  const rgb = [r, g, b];

  if (model === 'machado') {
    // Machado model: interpolate between the 11 pre-computed matrices directly.
    // The nonlinear severity-to-matrix relationship is captured by the published tables.
    const matrix = machadoMatrix(type, factor);
    const transformed = matrix.map((row) =>
      clamp(row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])
    );
    return srgbToHex(transformed[0], transformed[1], transformed[2]);
  }

  // Simple model: uses the Machado severity=1.0 (full dichromacy) matrix,
  // linearly blended with identity by the severity factor.
  const matrix = MACHADO_TABLES[type][10];
  const transformed = matrix.map((row, rowIndex) => {
    const mixed = row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2];
    return clamp(rgb[rowIndex] * (1 - factor) + mixed * factor);
  });

  return srgbToHex(transformed[0], transformed[1], transformed[2]);
}

function pairwiseDistances(
  colors: string[],
  threshold: number,
  space: ColorSpace
): { minDeltaE: number; collisions: DistinctPair[] } {
  const collisions: DistinctPair[] = [];
  let minDeltaE = Number.POSITIVE_INFINITY;

  for (let index = 0; index < colors.length; index += 1) {
    for (let inner = index + 1; inner < colors.length; inner += 1) {
      const deltaE = deltaEColorSpace(colors[index], colors[inner], space);
      minDeltaE = Math.min(minDeltaE, deltaE);
      if (deltaE < threshold) {
        collisions.push({
          left: colors[index],
          right: colors[inner],
          deltaE: round(deltaE, 2)
        });
      }
    }
  }

  return {
    minDeltaE: Number.isFinite(minDeltaE) ? round(minDeltaE, 2) : 0,
    collisions
  };
}

export function analyzeDistinctness(
  colors: string[],
  threshold: number = 12,
  options: {
    space?: ColorSpace;
    gamut?: Gamut;
    cvdModel?: CvdModel;
    severity?: number;
  } = {}
): DistinctnessReport {
  const space = options.space ?? 'oklch';
  const gamut = options.gamut ?? 'srgb';
  const cvdModel = options.cvdModel ?? 'simple';
  const severity = options.severity ?? 1;
  const normalized = colors.map((color) => parseCssColor(color, gamut).hex);
  const normal = pairwiseDistances(normalized, threshold, space);
  const cvd = {
    protan: pairwiseDistances(
      normalized.map((color) => simulateCvd(color, 'protan', severity, cvdModel)),
      threshold,
      space
    ),
    deutan: pairwiseDistances(
      normalized.map((color) => simulateCvd(color, 'deutan', severity, cvdModel)),
      threshold,
      space
    ),
    tritan: pairwiseDistances(
      normalized.map((color) => simulateCvd(color, 'tritan', severity, cvdModel)),
      threshold,
      space
    )
  };

  return {
    minDeltaE: normal.minDeltaE,
    collisions: normal.collisions,
    cvd,
    space,
    gamut
  };
}
