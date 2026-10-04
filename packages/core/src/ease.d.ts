export type SpringParams = {
    mass: number;
    stiffness: number;
    damping: number;
};
export type SpringResult = {
    params: SpringParams;
    duration: number;
    samples: number[];
    linear: string;
    css: string;
};
export declare const SPRING_PRESETS: Record<string, SpringParams>;
export declare function generateSpring(params: SpringParams, sampleCount?: number): SpringResult;
export declare function cubicBezierToLinear(x1: number, y1: number, x2: number, y2: number, sampleCount?: number): {
    samples: number[];
    linear: string;
};
