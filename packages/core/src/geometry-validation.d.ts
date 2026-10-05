import type { DesignDocument } from './design.ts';
export declare function assertFrame(frame: {
    width: number;
    height: number;
}): void;
export declare function assertRectangles(items: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}>): void;
export declare function assertDesignDocument(document: DesignDocument): void;
