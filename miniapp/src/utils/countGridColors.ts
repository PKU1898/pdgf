/**
 * 统计图纸中每种颜色的数量
 *
 * 遍历 gridData，使用 Map 统计每种 colorId 出现的次数。
 * 返回按数量降序排列的数组。
 */

export interface ColorCount {
  colorId: string;
  count: number;
}

export function countGridColors(gridData: string[][]): ColorCount[] {
  const counts = new Map<string, number>();

  for (const row of gridData) {
    for (const cell of row) {
      if (cell) {
        counts.set(cell, (counts.get(cell) ?? 0) + 1);
      }
    }
  }

  const result: ColorCount[] = [];
  for (const [colorId, count] of counts) {
    result.push({ colorId, count });
  }

  result.sort((a, b) => b.count - a.count);
  return result;
}
