export type JsonGuard<T> = (value: unknown) => value is T;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export async function readJsonResponse<T>(
  response: Response,
  label: string,
  guard: JsonGuard<T>
): Promise<T> {
  const payload: unknown = await response.json();
  if (!guard(payload)) {
    throw new Error(`${label} returned an unexpected JSON shape.`);
  }
  return payload;
}

export async function readOptionalJsonResponse<T>(
  response: Response,
  label: string,
  guard: JsonGuard<T>
): Promise<T | null> {
  try {
    return await readJsonResponse(response, label, guard);
  } catch {
    return null;
  }
}

export async function readJsonRequest<T>(
  request: Request,
  guard: JsonGuard<T>
): Promise<T | null> {
  try {
    const payload: unknown = await request.json();
    return guard(payload) ? payload : null;
  } catch {
    return null;
  }
}

export function isErrorPayload(value: unknown): value is { error?: string } {
  return isRecord(value) && (value.error === undefined || typeof value.error === 'string');
}
