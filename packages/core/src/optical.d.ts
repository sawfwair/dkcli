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
export declare const OPTICAL: {
    icon: {
        description: string;
        corrections: (size: number) => Correction[];
    };
    text: {
        description: string;
        corrections: (size: number) => Correction[];
    };
    circle: {
        description: string;
        corrections: (size: number) => Correction[];
    };
    button: {
        description: string;
        corrections: (size: number) => Correction[];
    };
    card: {
        description: string;
        corrections: (size: number) => Correction[];
    };
};
export declare function getCorrections(type: string, size?: number): CorrectionResult;
/** Combines transform corrections into one CSS declaration in their original order. */
export declare function joinOpticalTransforms(corrections: ReadonlyArray<Pick<Correction, 'property' | 'value'>>): string;
