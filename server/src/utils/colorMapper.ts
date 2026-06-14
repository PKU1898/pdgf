export interface BeadColorInput {
  id: string;
  rgb: string;
}

export function mapColors(
  pixelArray: number[][][],
  brandColors: BeadColorInput[]
): string[][] {
  if (brandColors.length === 0) {
    throw new Error("色卡数据为空，无法进行颜色映射");
  }

  // 预解析色卡 RGB，避免重复 split
  const parsedColors = brandColors.map((color) => {
    const [r, g, b] = color.rgb.split(",").map(Number);
    return { id: color.id, r, g, b };
  });

  const result: string[][] = [];

  for (const row of pixelArray) {
    const mappedRow: string[] = [];
    for (const pixel of row) {
      const [pr, pg, pb] = pixel;
      let minDist = Infinity;
      let closestId = parsedColors[0].id;

      for (const color of parsedColors) {
        const dist = Math.sqrt(
          (pr - color.r) ** 2 + (pg - color.g) ** 2 + (pb - color.b) ** 2
        );
        if (dist < minDist) {
          minDist = dist;
          closestId = color.id;
        }
      }

      mappedRow.push(closestId);
    }
    result.push(mappedRow);
  }

  return result;
}
