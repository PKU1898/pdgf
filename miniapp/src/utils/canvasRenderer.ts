/**
 * 离屏 Canvas 渲染：将网格数据绘制为带网格线和色号的 PNG 图片
 *
 * 红线：这是整个项目中唯一允许使用 Canvas 的地方！
 * 仅在"导出图片"时使用，编辑渲染必须用 CSS Grid。
 */

const CELL_SIZE = 20;
const FONT_SIZE = 10;
const MAX_GRID_SIZE = 200;
const LINE_COLOR = "#E0E0E0";
const TEXT_COLOR = "#333333";
const EMPTY_COLOR = "#FFFFFF";

export interface RenderOptions {
  gridData: string[][];
  colorMap: Record<string, string>;
  colorCodes: Record<string, string>;
}

export function renderToImage(options: RenderOptions): string {
  const { gridData, colorMap, colorCodes } = options;

  const height = gridData.length;
  if (height === 0) throw new Error("gridData 为空");
  const width = gridData[0]?.length ?? 0;
  if (width === 0) throw new Error("gridData 列数为 0");

  if (width > MAX_GRID_SIZE || height > MAX_GRID_SIZE) {
    throw new Error(
      `图纸尺寸 ${width}x${height} 超过限制 ${MAX_GRID_SIZE}x${MAX_GRID_SIZE}`
    );
  }

  const canvasWidth = width * CELL_SIZE;
  const canvasHeight = height * CELL_SIZE;

  const canvas = uni.createOffscreenCanvas({
    type: "2d",
    width: canvasWidth,
    height: canvasHeight,
  });
  const ctx = canvas.getContext("2d");

  // 填充白色背景
  ctx.fillStyle = EMPTY_COLOR;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 绘制每个格子
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const colorId = gridData[r][c];
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;

      // 背景色
      ctx.fillStyle = colorId ? (colorMap[colorId] ?? EMPTY_COLOR) : EMPTY_COLOR;
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

      // 网格线
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

      // 色号文字
      if (colorId) {
        const code = colorCodes[colorId] ?? colorId.split("_").pop() ?? "";
        if (code) {
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = `${FONT_SIZE}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(code, x + CELL_SIZE / 2, y + CELL_SIZE / 2);
        }
      }
    }
  }

  return canvas.toTempFilePathSync({
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
    destWidth: canvasWidth,
    destHeight: canvasHeight,
    fileType: "png",
  });
}
