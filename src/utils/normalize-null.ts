export default function normalizeNullIntoUndefined<T>(
  obj: Record<string, any>,
): T {
  const normalizedObj = {} as T;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key] as unknown;
      normalizedObj[key] = value === null ? undefined : value;
    }
  }

  return normalizedObj;
}
