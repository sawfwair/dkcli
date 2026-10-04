// Optical correction presets for UI elements.

export type Correction = {
  property: string;
  value: string;
  reason: string;
};

export type CorrectionResult = {
  type: string;
  size: number;
  description: string;
  corrections: Correction[];
};

function fmtPx(px: number): number {
  return parseFloat(px.toFixed(1));
}

type OpticalEntry = {
  description: string;
  corrections: (size: number) => Correction[];
};

export const OPTICAL = {
  icon: {
    description: 'Directional icon centering, such as a play triangle',
    corrections: (size: number): Correction[] => [
      {
        property: 'transform',
        value: `translateX(${fmtPx(size * 0.05)}px)`,
        reason: 'Shifts the icon horizontally by 5% to center its visual mass',
      },
      {
        property: 'transform',
        value: `translateY(${fmtPx(size * -0.02)}px)`,
        reason: 'Shifts the icon vertically by -2% to adjust baseline alignment',
      },
    ],
  },
  text: {
    description: 'Text block optical alignment',
    corrections: (size: number): Correction[] => [
      {
        property: 'margin-left',
        value: '-0.05em',
        reason: 'Offsets whitespace at the start of the text',
      },
      {
        property: 'padding-top',
        value: `calc(var(--padding) - ${fmtPx(size * 0.15)}px)`,
        reason: 'Reduces top padding to align the capital letters',
      },
    ],
  },
  circle: {
    description: 'Circle size correction',
    corrections: (size: number): Correction[] => [
      {
        property: 'width',
        value: `${fmtPx(size * 1.12)}px`,
        reason: `Circle size after correction from ${size} px`,
      },
      {
        property: 'height',
        value: `${fmtPx(size * 1.12)}px`,
        reason: `Circle size after correction from ${size} px`,
      },
    ],
  },
  button: {
    description: 'Button text vertical centering',
    corrections: (size: number): Correction[] => {
      const comp = fmtPx(size * 0.03);
      return [
        {
          property: 'padding-bottom',
          value: `calc(var(--padding) + ${comp}px)`,
          reason: `Adds ${comp} px to bottom padding, or 3% of the ${size} px font size`,
        },
        {
          property: 'margin-left',
          value: '-0.05em',
          reason: 'Offsets whitespace before the first letter',
        },
      ];
    },
  },
  card: {
    description: 'Card padding optical correction',
    corrections: (size: number): Correction[] => [
      {
        property: 'padding-left',
        value: `calc(var(--padding) - ${fmtPx(size * 0.05)}px)`,
        reason: 'Reduces left padding to account for letter spacing',
      },
      {
        property: 'padding-bottom',
        value: `calc(var(--padding) + ${fmtPx(size * 0.04)}px)`,
        reason: 'Increases bottom padding by 4% of the element size',
      },
    ],
  },
} satisfies Record<string, OpticalEntry>;

export function getCorrections(type: string, size: number = 48): CorrectionResult {
  if (!Object.hasOwn(OPTICAL, type)) {
    throw new Error(
      `Unknown optical type: ${type}. Available types: ${Object.keys(OPTICAL).join(', ')}`
    );
  }
  const entry = OPTICAL[type as keyof typeof OPTICAL];
  return {
    type,
    size,
    description: entry.description,
    corrections: entry.corrections(size),
  };
}

/** Combines transform corrections into one CSS declaration in their original order. */
export function joinOpticalTransforms(corrections: ReadonlyArray<Pick<Correction, 'property' | 'value'>>): string {
  return corrections.filter((correction) => correction.property === 'transform').map((correction) => correction.value).join(' ');
}
