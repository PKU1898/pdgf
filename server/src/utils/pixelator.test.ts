import { describe, it, expect, vi } from "vitest";

vi.mock("sharp", () => {
  const rawBuffer = Buffer.from([255, 0, 0, 0, 255, 0, 0, 0, 255, 128, 128, 128]);
  const instance = {
    resize: vi.fn().mockReturnThis(),
    removeAlpha: vi.fn().mockReturnThis(),
    raw: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(rawBuffer),
  };
  const sharp = vi.fn().mockReturnValue(instance);
  return { default: sharp };
});

import { pixelateImage } from "./pixelator.js";

describe("pixelateImage", () => {
  it("将 buffer 像素化为指定宽高的 RGB 数组", async () => {
    const buffer = Buffer.from("fake-image");
    const result = await pixelateImage(buffer, 2, 2);

    expect(result).toEqual([
      [[255, 0, 0], [0, 255, 0]],
      [[0, 0, 255], [128, 128, 128]],
    ]);
  });

  it("宽高超过 200 抛出异常", async () => {
    const buffer = Buffer.from("fake-image");
    await expect(pixelateImage(buffer, 201, 100)).rejects.toThrow("不能超过");
  });

  it("宽高为 0 或负数抛出异常", async () => {
    const buffer = Buffer.from("fake-image");
    await expect(pixelateImage(buffer, 0, 10)).rejects.toThrow("正整数");
    await expect(pixelateImage(buffer, 10, -1)).rejects.toThrow("正整数");
  });
});
