/** Bounds generated arrays while retaining substantially more precision than tool defaults. */
const MAX_GENERATED_INTERVALS = 10_000;

export function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be a positive finite number.`);
}

export function assertNonnegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a nonnegative finite number.`);
}

export function assertGeneratedCount(value: number, label: string, minimum = 0): void {
  if (!Number.isInteger(value) || value < minimum || value > MAX_GENERATED_INTERVALS) {
    throw new Error(`${label} must be an integer from ${minimum} to ${MAX_GENERATED_INTERVALS}.`);
  }
}

export function assertIntegerCount(value: number, label: string, minimum = 0): void {
  if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`${label} must be a safe integer no less than ${minimum}.`);
}

export function assertFiniteOutput(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} exceeds finite numeric bounds.`);
}
