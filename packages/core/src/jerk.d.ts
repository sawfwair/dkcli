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
export declare function minimumJerkPosition(t: number): number;
/** Generates a positive-duration curve with 1 to 10,000 sample intervals. */
export declare function generateMinimumJerk(duration?: number, sampleCount?: number): MinimumJerkResult;
