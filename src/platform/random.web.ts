export function randomBelow(limit: number): number {
  const range = 2 ** 32;
  const cutoff = range - (range % limit);
  const value = new Uint32Array(1);
  do {
    crypto.getRandomValues(value);
  } while (value[0] >= cutoff);
  return value[0] % limit;
}
