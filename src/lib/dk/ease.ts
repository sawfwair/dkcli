// Ease — Spring physics and easing curve generation

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

export function generateSpring(params: SpringParams, sampleCount: number = 50): SpringResult {
  const { mass, stiffness, damping } = params;
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const omegaD = omega * Math.sqrt(Math.abs(1 - zeta * zeta));

  // Duration estimation: time for the dominant decay mode to reach < 0.1% of its amplitude.
  // For underdamped/critically damped (zeta <= 1), the envelope is exp(-zeta*omega*t).
  // For overdamped (zeta > 1), the slower eigenmode decays as exp(s2*t) where
  // s2 = -omega*(zeta - sqrt(zeta^2 - 1)), so the time constant is 1/|s2|.
  let decayRate: number;
  if (zeta > 1) {
    decayRate = omega * (zeta - Math.sqrt(zeta * zeta - 1));
  } else {
    decayRate = zeta * omega;
  }
  // exp(-decayRate * t) < 0.001 => t > -ln(0.001) / decayRate
  const duration = decayRate > 0 ? -Math.log(0.001) / decayRate : 1;

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
      const s1 = -omega * (zeta + Math.sqrt(zeta * zeta - 1));
      const s2 = -omega * (zeta - Math.sqrt(zeta * zeta - 1));
      x = 1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
    }
    samples.push(parseFloat(x.toFixed(3)));
  }
  samples[samples.length - 1] = 1;

  const linearValues = samples.map(v => v.toFixed(3)).join(',\n  ');
  const linear = `linear(\n  ${linearValues}\n)`;
  const css = `/* spring(mass: ${mass}, stiffness: ${stiffness}, damping: ${damping}) */\n/* Duration: ${duration.toFixed(3)}s */\ntransition-timing-function: ${linear};`;

  return { params, duration: parseFloat(duration.toFixed(3)), samples, linear, css };
}

export function cubicBezierToLinear(
  x1: number, y1: number, x2: number, y2: number, sampleCount: number = 50
): { samples: number[]; linear: string } {
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
    samples.push(parseFloat(by.toFixed(3)));
  }
  const linearValues = samples.map(v => v.toFixed(3)).join(',\n  ');
  const linear = `linear(\n  ${linearValues}\n)`;
  return { samples, linear };
}
