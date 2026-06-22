/**
 * 导出工具：PNG 图片保存到相册 / CSV 用量清单分享
 */

import { renderToImage, type RenderOptions } from "./canvasRenderer";
import { countGridColors } from "./countGridColors";

const CSV_HEADER = "色号,颜色名,所需数量";

function getTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `${y}${m}${d}_${h}${min}${s}`;
}

function requestAlbumPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    uni.authorize({
      scope: "scope.writePhotosAlbum",
      success: () => resolve(true),
      fail: () => {
        uni.showModal({
          title: "需要相册权限",
          content: "请在设置中允许保存到相册",
          confirmText: "去设置",
          success: (res) => {
            if (res.confirm) {
              uni.openSetting({});
            }
          },
        });
        resolve(false);
      },
    });
  });
}

export async function exportPng(
  renderOptions: RenderOptions,
  projectName: string
): Promise<boolean> {
  const hasPermission = await requestAlbumPermission();
  if (!hasPermission) return false;

  try {
    const tempPath = renderToImage(renderOptions);

    await new Promise<void>((resolve, reject) => {
      uni.saveImageToPhotosAlbum({
        filePath: tempPath,
        success: () => resolve(),
        fail: (err) => reject(err),
      });
    });

    const filename = `${projectName}_${getTimestamp()}.png`;
    uni.showToast({ title: `已保存: ${filename}`, icon: "success" });
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "保存失败";
    console.error("[exportPng]", message);
    uni.showToast({ title: "保存失败", icon: "none" });
    return false;
  }
}

export interface CsvRow {
  code: string;
  name: string;
  count: number;
}

export function buildCsvString(rows: CsvRow[]): string {
  const lines = [CSV_HEADER];
  for (const row of rows) {
    const escapedName = row.name.includes(",") ? `"${row.name}"` : row.name;
    lines.push(`${row.code},${escapedName},${row.count}`);
  }
  return lines.join("\n");
}

export function exportCsv(
  projectName: string,
  gridData: string[][],
  colorCodes: Record<string, string>,
  colorNames: Record<string, string>
): boolean {
  try {
    const counts = countGridColors(gridData);
    const rows: CsvRow[] = counts.map((item) => ({
      code: colorCodes[item.colorId] ?? item.colorId.split("_").pop() ?? item.colorId,
      name: colorNames[item.colorId] ?? "",
      count: item.count,
    }));

    const csvContent = buildCsvString(rows);
    const filename = `${projectName}_${getTimestamp()}.csv`;
    const filePath = `${wx.env.USER_DATA_PATH}/${filename}`;

    const fs = uni.getFileSystemManager();
    fs.writeFileSync(filePath, csvContent, "utf8");

    uni.shareFileMessage({
      filePath,
      success: () => {
        uni.showToast({ title: "导出成功", icon: "success" });
      },
      fail: () => {
        uni.showToast({ title: "已保存到本地", icon: "success" });
      },
    });

    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "导出失败";
    console.error("[exportCsv]", message);
    uni.showToast({ title: "导出失败", icon: "none" });
    return false;
  }
}
