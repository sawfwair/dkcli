// Jerk — Minimum-jerk trajectory generation for smooth motion

export type MinimumJerkSample = {
  t: number;
  x: number;
  velocity: number;
  acceleration: number;
  jerk: number;
};

export type MinimumJerkResult = {
  duration: number;
  samples: MinimumJerkSample[];
  linear: string;
  css: string;
};

function fmt(value: number, precision: number = 3): number {
  return parseFloat(value.toFixed(precision));
}

export function minimumJerkPosition(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  return 10 * clamped ** 3 - 15 * clamped ** 4 + 6 * clamped ** 5;
}

export function generateMinimumJerk(duration: number = 0.6, sampleCount: number = 40): MinimumJerkResult {
  const samples: MinimumJerkSample[] = [];

  for (let index = 0; index <= sampleCount; index += 1) {
    const t = index / sampleCount;
    const x = minimumJerkPosition(t);
    const velocity = 30 * t ** 2 - 60 * t ** 3 + 30 * t ** 4;
    const acceleration = 60 * t - 180 * t ** 2 + 120 * t ** 3;
    const jerk = 60 - 360 * t + 360 * t ** 2;
    samples.push({
      t: fmt(t),
      x: fmt(x),
      velocity: fmt(velocity),
      acceleration: fmt(acceleration),
      jerk: fmt(jerk)
    });
  }

  const linear = `linear(\n  ${samples.map((sample) => sample.x.toFixed(3)).join(',\n  ')}\n)`;
  return {
    duration: fmt(duration),
    samples,
    linear,
    css: `/* minimum-jerk */\ntransition-duration: ${fmt(duration)}s;\ntransition-timing-function: ${linear};`
  };
}
