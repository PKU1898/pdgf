/**
 * 仅用自有库存配色：将图纸中所有颜色替换为用户库存中色差最小的颜色
 *
 * 使用欧氏距离在 RGB 空间中匹配最近似库存色。
 */

export interface ColorInfo {
  id: string;
  rgb: string;
}

export interface Shortage {
  colorId: string;
  needed: number;
  have: number;
  gap: number;
}

export interface MatchResult {
  grid: string[][];
  shortages: Shortage[];
}

function parseRgb(rgb: string): [number, number, number] {
  const parts = rgb.split(",").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid RGB string: "${rgb}"`);
  }
  return [parts[0], parts[1], parts[2]];
}

function euclideanDist(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export function matchInventoryColors(
  gridData: string[][],
  allColors: ColorInfo[],
  inventory: Record<string, number>
): MatchResult | null {
  if (gridData.length === 0) return null;

  // 过滤出库存 > 0 的颜色
  const inventoryIds = Object.entries(inventory)
    .filter(([, qty]) => qty > 0)
    .map(([id]) => id);

  if (inventoryIds.length === 0) return null;

  // 构建库存色 RGB 查找表
  const colorRgbMap = new Map<string, [number, number, number]>();
  for (const c of allColors) {
    colorRgbMap.set(c.id, parseRgb(c.rgb));
  }

  const inventoryColors: { id: string; rgb: [number, number, number] }[] = [];
  for (const id of inventoryIds) {
    const rgb = colorRgbMap.get(id);
    if (rgb) {
      inventoryColors.push({ id, rgb });
    }
  }

  if (inventoryColors.length === 0) return null;

  // 匹配缓存：相同原始色号 -> 替换色号
  const matchCache = new Map<string, string>();

  // 需求统计：替换后色号 -> 需要数量
  const needMap = new Map<string, number>();

  const height = gridData.length;
  const width = gridData[0]?.length ?? 0;

  const newGrid: string[][] = [];

  for (let r = 0; r < height; r++) {
    const newRow: string[] = [];
    for (let c = 0; c < width; c++) {
      const originalId = gridData[r][c];

      // 空格子不处理
      if (!originalId) {
        newRow.push("");
        continue;
      }

      // 检查缓存
      if (matchCache.has(originalId)) {
        const matchedId = matchCache.get(originalId)!;
        newRow.push(matchedId);
        needMap.set(matchedId, (needMap.get(matchedId) ?? 0) + 1);
        continue;
      }

      // 获取原始色 RGB
      const originalRgb = colorRgbMap.get(originalId);
      if (!originalRgb) {
        // 找不到色号信息，保留原色
        newRow.push(originalId);
        needMap.set(originalId, (needMap.get(originalId) ?? 0) + 1);
        continue;
      }

      // 欧氏距离匹配最近库存色
      let minDist = Infinity;
      let closestId = inventoryColors[0].id;

      for (const ic of inventoryColors) {
        const dist = euclideanDist(
          originalRgb[0],
          originalRgb[1],
          originalRgb[2],
          ic.rgb[0],
          ic.rgb[1],
          ic.rgb[2]
        );
        if (dist < minDist) {
          minDist = dist;
          closestId = ic.id;
        }
      }

      matchCache.set(originalId, closestId);
      newRow.push(closestId);
      needMap.set(closestId, (needMap.get(closestId) ?? 0) + 1);
    }
    newGrid.push(newRow);
  }

  // 计算缺口
  const shortages: Shortage[] = [];
  for (const [colorId, needed] of needMap) {
    const have = inventory[colorId] ?? 0;
    if (needed > have) {
      shortages.push({ colorId, needed, have, gap: needed - have });
    }
  }

  return { grid: newGrid, shortages };
}
