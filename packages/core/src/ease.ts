// Spring physics and easing curve generation.

import { assertFiniteOutput, assertGeneratedCount, assertPositiveFinite } from './numeric-validation.ts';

export type SpringParams = { mass: number; stiffness: number; damping: number };

export type SpringResult = {
  params: SpringParams;
  duration: number;
  samples: number[];
  linear: string;
  css: string;
};

export const SPRING_PRESETS: Record<string, SpringParams> = {
  bounce: { mass: 1, stiffness: 300, damping: 10 },
  gentle: { mass: 1, stiffness: 120, damping: 14 },
  snappy: { mass: 1, stiffness: 400, damping: 28 },
  wobbly: { mass: 1, stiffness: 180, damping: 12 },
};

/** Samples a positive, settling spring with 1 to 10,000 intervals. */
export function generateSpring(params: SpringParams, sampleCount: number = 50): SpringResult {
  const { mass, stiffness, damping } = params;
  assertPositiveFinite(mass, 'Spring mass');
  assertPositiveFinite(stiffness, 'Spring stiffness');
  assertPositiveFinite(damping, 'Spring damping');
  assertGeneratedCount(sampleCount, 'Spring samples', 1);
  const omega = Math.sqrt(stiffness) / Math.sqrt(mass);
  const zeta = damping / (2 * Math.sqrt(stiffness) * Math.sqrt(mass));
  assertPositiveFinite(omega, 'Spring frequency');
  assertPositiveFinite(zeta, 'Spring damping ratio');
  const omegaD = omega * Math.sqrt(Math.abs(1 - zeta * zeta));
  const overdampedRoot = zeta > 1 ? Math.sqrt(zeta - 1) * Math.sqrt(zeta + 1) : 0;

  // Duration estimation: time for the dominant decay mode to reach < 0.1% of its amplitude.
  // For underdamped/critically damped (zeta <= 1), the envelope is exp(-zeta*omega*t).
  // For overdamped (zeta > 1), the slower eigenmode decays as exp(s2*t) where
  // s2 = -omega*(zeta - sqrt(zeta^2 - 1)), so the time constant is 1/|s2|.
  let decayRate: number;
  if (zeta > 1) {
    decayRate = omega / (zeta + overdampedRoot);
  } else {
    decayRate = zeta * omega;
  }
  // exp(-decayRate * t) < 0.001 => t > -ln(0.001) / decayRate
  assertPositiveFinite(decayRate, 'Spring decay rate');
  const duration = -Math.log(0.001) / decayRate;
  assertPositiveFinite(duration, 'Spring settling duration');
  const reportedDuration = duration < 0.001 ? duration : parseFloat(duration.toFixed(3));

  const samples: number[] = [];
  for (let i = 0; i <= sampleCount; i++) {
    const t = (i / sampleCount) * duration;
    let x: number;
    if (zeta < 1) {
      x = 1 - Math.exp(-zeta * omega * t) * (
        Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t)
      );
    } else if (zeta === 1) {
      x = 1 - Math.exp(-omega * t) * (1 + omega * t);
    } else {
      const s1 = -omega * (zeta + overdampedRoot);
      const s2 = -decayRate;
      assertFiniteOutput(s1, 'Spring fast eigenmode');
      x = 1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
    }
    assertFiniteOutput(x, 'Spring sample');
    samples.push(parseFloat(x.toFixed(3)));
  }
  samples[samples.length - 1] = 1;

  const linearValues = samples.map(v => v.toFixed(3)).join(',\n  ');
  const linear = `linear(\n  ${linearValues}\n)`;
  const css = `/* spring(mass: ${mass}, stiffness: ${stiffness}, damping: ${damping}) */\n/* Duration: ${duration < 0.001 ? String(duration) : duration.toFixed(3)}s */\ntransition-timing-function: ${linear};`;

  return { params, duration: reportedDuration, samples, linear, css };
}

export function cubicBezierToLinear(
  x1: number, y1: number, x2: number, y2: number, sampleCount: number = 50
): { samples: number[]; linear: string } {
  assertGeneratedCount(sampleCount, 'Bezier samples', 1);
  if (![x1, y1, x2, y2].every(Number.isFinite) || x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    throw new Error('Bezier coordinates must be finite, with x coordinates from 0 to 1.');
  }
  const samples: number[] = [];
  for (let i = 0; i <= sampleCount; i++) {
    const x = i / sampleCount;
    let t = x;
    for (let iter = 0; iter < 8; iter++) {
      const bx = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
      const dbx = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
      if (Math.abs(dbx) < 1e-10) break;
      t -= (bx - x) / dbx;
      t = Math.max(0, Math.min(1, t));
    }
    const by = 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
    assertFiniteOutput(by, 'Bezier sample');
    samples.push(parseFloat(by.toFixed(3)));
  }
  const linearValues = samples.map(v => v.toFixed(3)).join(',\n  ');
  const linear = `linear(\n  ${linearValues}\n)`;
  return { samples, linear };
}
