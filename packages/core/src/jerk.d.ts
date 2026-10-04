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
export declare function generateMinimumJerk(duration?: number, sampleCount?: number): MinimumJerkResult;
