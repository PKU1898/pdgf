const DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

export function denoiseGrid(
  gridData: string[][],
  strength: number
): { grid: string[][]; count: number } | null {
  const height = gridData.length;
  if (height === 0) return null;
  const width = gridData[0].length;
  if (width === 0) return null;

  const clamped = Math.max(1, Math.min(100, Math.round(strength)));
  const threshold = 5 - Math.ceil(clamped / 25);

  const newGrid: string[][] = gridData.map((row) => [...row]);
  let count = 0;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const current = gridData[r][c];
      if (!current) continue;

      const neighborColors: string[] = [];
      let diffCount = 0;

      for (const [dr, dc] of DIRECTIONS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;
        const neighbor = gridData[nr][nc];
        if (!neighbor) continue;
        neighborColors.push(neighbor);
        if (neighbor !== current) diffCount++;
      }

      if (diffCount >= threshold && neighborColors.length > 0) {
        const freq = new Map<string, number>();
        for (const color of neighborColors) {
          freq.set(color, (freq.get(color) ?? 0) + 1);
        }
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
