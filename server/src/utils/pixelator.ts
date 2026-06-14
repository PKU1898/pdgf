import sharp from "sharp";

const MAX_DIMENSION = 200;

export async function pixelateImage(
  buffer: Buffer,
  width: number,
  height: number
): Promise<number[][][]> {
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new Error(`图片尺寸不能超过 ${MAX_DIMENSION}x${MAX_DIMENSION}`);
  }

  if (width <= 0 || height <= 0) {
    throw new Error("宽高必须为正整数");
  }

  const rawBuffer = await sharp(buffer)
    .resize(width, height, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: false });

  const pixels: number[][][] = [];
  let offset = 0;

  for (let y = 0; y < height; y++) {
    const row: number[][] = [];
    for (let x = 0; x < width; x++) {
      const r = rawBuffer[offset];
      const g = rawBuffer[offset + 1];
      const b = rawBuffer[offset + 2];
      row.push([r, g, b]);
      offset += 3;
    }
    pixels.push(row);
  }

  return pixels;
}
