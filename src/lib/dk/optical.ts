// Optical — Optical correction values for UI elements

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
    description: 'Directional icon centering (e.g., play triangle)',
    corrections: (size: number): Correction[] => [
      {
        property: 'transform',
        value: `translateX(${fmtPx(size * 0.05)}px)`,
        reason: 'Shift directional icon right by 5% to center visual mass',
      },
      {
        property: 'transform',
        value: `translateY(${fmtPx(size * -0.02)}px)`,
        reason: 'Shift icon up by 2% to compensate for baseline alignment',
      },
    ],
  },
  text: {
    description: 'Text block optical alignment',
    corrections: (size: number): Correction[] => [
      {
        property: 'margin-left',
        value: '-0.05em',
        reason: 'Negative margin compensates for letterform whitespace at container edge',
      },
      {
        property: 'padding-top',
        value: `calc(var(--padding) - ${fmtPx(size * 0.15)}px)`,
        reason: 'Reduce top padding to align with cap height instead of bounding box',
      },
    ],
  },
  circle: {
    description: 'Circle inside rectangle perceived size',
    corrections: (size: number): Correction[] => [
      {
        property: 'transform',
        value: 'scale(1.12)',
        reason: 'Circles appear ~12% smaller than same-dimension squares -- scale to match',
      },
      {
        property: 'width',
        value: `${fmtPx(size * 1.12)}px`,
        reason: `Optically corrected circle size (geometric: ${size}px)`,
      },
      {
        property: 'height',
        value: `${fmtPx(size * 1.12)}px`,
        reason: `Optically corrected circle size (geometric: ${size}px)`,
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
          reason: `Add ${comp}px to bottom padding to compensate for absent descenders (3% of ${size}px font)`,
        },
        {
          property: 'margin-left',
          value: '-0.05em',
          reason: 'Compensate for first letterform whitespace',
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
        reason: 'Left padding reduced -- text letterforms create visual padding',
      },
      {
        property: 'padding-bottom',
        value: `calc(var(--padding) + ${fmtPx(size * 0.04)}px)`,
        reason: 'Bottom padding increased -- content feels bottom-heavy without it',
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
