export type AnchorRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type SurfaceSize = {
  width: number;
  height: number;
};

export type Placement = 'top' | 'right' | 'bottom' | 'left';

export type AnchoredPosition = {
  left: number;
  top: number;
  placement: Placement;
};

function fitsVertically(top: number, height: number, viewportHeight: number): boolean {
  return top >= 0 && top + height <= viewportHeight;
}

function fitsHorizontally(left: number, width: number, viewportWidth: number): boolean {
  return left >= 0 && left + width <= viewportWidth;
}

export function computeAnchoredPosition(input: {
  anchor: AnchorRect;
  surface: SurfaceSize;
  placement: Placement;
  offset: number;
  viewportWidth: number;
  viewportHeight: number;
}): AnchoredPosition {
  const { anchor, surface, offset, viewportWidth, viewportHeight } = input;
  const positions: Record<Placement, AnchoredPosition> = {
    bottom: {
      left: anchor.left,
      top: anchor.top + anchor.height + offset,
      placement: 'bottom'
    },
    top: {
      left: anchor.left,
      top: anchor.top - surface.height - offset,
      placement: 'top'
    },
    right: {
      left: anchor.left + anchor.width + offset,
      top: anchor.top,
      placement: 'right'
    },
    left: {
      left: anchor.left - surface.width - offset,
      top: anchor.top,
      placement: 'left'
    }
  };

  const preferred = positions[input.placement];
  const fitsPreferred =
    (preferred.placement === 'top' || preferred.placement === 'bottom'
      ? fitsVertically(preferred.top, surface.height, viewportHeight)
      : fitsHorizontally(preferred.left, surface.width, viewportWidth));

  if (fitsPreferred) {
    return preferred;
  }

  const fallbacks: Placement[] = input.placement === 'bottom' ? ['top', 'right', 'left'] : ['bottom', 'right', 'left'];
  for (const placement of fallbacks) {
    const candidate = positions[placement];
    const fits =
      (placement === 'top' || placement === 'bottom'
        ? fitsVertically(candidate.top, surface.height, viewportHeight)
        : fitsHorizontally(candidate.left, surface.width, viewportWidth));
    if (fits) {
      return candidate;
    }
  }

  return {
    left: Math.max(8, Math.min(preferred.left, viewportWidth - surface.width - 8)),
    top: Math.max(8, Math.min(preferred.top, viewportHeight - surface.height - 8)),
    placement: preferred.placement
  };
}
