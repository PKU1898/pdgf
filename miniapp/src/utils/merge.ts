/**
 * 色块融合：平滑锯齿边缘的过渡色块
 *
 * 检查 3x3 区域，如果中心点颜色在邻居中出现次数低于阈值，
 * 则替换为区域内出现次数最多的颜色。
 */

export function mergeGrid(
  gridData: string[][],
  strength: number
): { grid: string[][]; count: number } | null {
  const height = gridData.length;
  if (height === 0) return null;
  const width = gridData[0].length;
  if (width === 0) return null;

  const clamped = Math.max(0, Math.min(100, Math.round(strength)));
  if (clamped === 0) return null;

  // strength=1 → threshold=2（仅孤立点），strength=100 → threshold=10（最激进）
  const threshold = 1 + Math.ceil(clamped / (100 / 9));

  // threshold > 10 时不做处理（安全守卫）
  if (threshold > 10) return null;

  const newGrid: string[][] = gridData.map((row) => [...row]);
  let count = 0;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const current = gridData[r][c];
      if (!current) continue;

      // 统计 3x3 区域内各颜色出现次数
      const freq = new Map<string, number>();
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;
          const color = gridData[nr][nc];
          if (!color) continue;
          freq.set(color, (freq.get(color) ?? 0) + 1);
        }
      }

      const centerCount = freq.get(current) ?? 0;

      // 中心色出现次数不超过阈值时，替换为区域内最高频颜色
      if (centerCount <= threshold) {
        let maxColor = "";
        let maxCount = 0;
        for (const [color, cnt] of freq) {
          if (cnt > maxCount) {
            maxCount = cnt;
            maxColor = color;
          }
        }
        if (maxColor && maxColor !== current) {
          newGrid[r][c] = maxColor;
          count++;
        }
      }
    }
  }

  if (count === 0) return null;
  return { grid: newGrid, count };
}
