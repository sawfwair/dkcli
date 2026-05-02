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
export declare function computeAnchoredPosition(input: {
    anchor: AnchorRect;
    surface: SurfaceSize;
    placement: Placement;
    offset: number;
    viewportWidth: number;
    viewportHeight: number;
}): AnchoredPosition;
