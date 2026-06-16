const MAX_FILL_RATIO = 0.8;

export function floodFill(
  gridData: string[][],
  startRow: number,
  startCol: number,
  fillColor: string
): { grid: string[][]; count: number } | null {
  const height = gridData.length;
  if (height === 0) return null;
  const width = gridData[0].length;
  if (startRow < 0 || startRow >= height || startCol < 0 || startCol >= width) return null;

  const targetColor = gridData[startRow][startCol];
  if (targetColor === fillColor) return null;

  const maxCount = Math.floor(height * width * MAX_FILL_RATIO);
  const queue: [number, number][] = [[startRow, startCol]];
  const positions: [number, number][] = [];
  const visited = new Set<string>();
  visited.add(`${startRow},${startCol}`);

  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let head = 0;

  while (head < queue.length) {
    const [r, c] = queue[head++];
    positions.push([r, c]);

    if (positions.length > maxCount) return null;

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (gridData[nr][nc] === targetColor) {
        queue.push([nr, nc]);
      }
    }
  }

  const newData = gridData.map((row) => [...row]);
  for (const [r, c] of positions) {
    newData[r][c] = fillColor;
  }
  return { grid: newData, count: positions.length };
}
