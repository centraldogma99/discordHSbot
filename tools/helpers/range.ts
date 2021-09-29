export function range(size: number, startAt = 0): number[] {
  return [...Array(size).keys()].map((i) => i + startAt);
}
