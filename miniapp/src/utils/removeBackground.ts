import { floodFill } from "./fillBucket";

export function removeBackground(
  gridData: string[][],
  colorMap: Record<string, string>
): { grid: string[][]; count: number } | null {
  const height = gridData.length;
  if (height === 0) return null;
  const width = gridData[0].length;
  if (width === 0) return null;

  const corners = [
    gridData[0][0],
    gridData[0][width - 1],
    gridData[height - 1][0],
    gridData[height - 1][width - 1],
  ];

  if (corners.some((c) => !c)) return null;

  const cornerColors = corners.map((id) => colorMap[id] ?? "");
  if (cornerColors.some((hex) => !hex)) return null;

  const rgbValues = cornerColors.map((hex) => hexToRgb(hex));
  const tolerance = 10;

  for (let i = 1; i < rgbValues.length; i++) {
    if (rgbDistance(rgbValues[0], rgbValues[i]) > tolerance) return null;
  }

  return floodFill(gridData, 0, 0, "");
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}
