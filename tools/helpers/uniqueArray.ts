"use strict";

export default function uniqueArray<T>(array: T[], element?: string): T[] {
  let filter: (value: T, index: number, self: T[]) => boolean;

  if (!element) {
    filter = (value: T, index: number, self: T[]) => {
      return self.indexOf(value) === index;
    };
    return array.filter(filter);
  }
  else {
    const seen: any[] = [];
    const res: T[] = [];
    for (const item of array) {
      if (item[element] && seen.indexOf(item[element]) === -1) {
        seen.push(item[element]);
        res.push(item);
      }
    }
    return res;
  }
}
