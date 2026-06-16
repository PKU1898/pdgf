import { describe, it, expect } from "vitest";
import { mapColors, type BeadColorInput } from "./colorMapper.js";

describe("mapColors", () => {
  const brandColors: BeadColorInput[] = [
    { id: "red_01", rgb: "255,0,0" },
    { id: "green_02", rgb: "0,255,0" },
    { id: "blue_03", rgb: "0,0,255" },
    { id: "white_04", rgb: "255,255,255" },
    { id: "black_05", rgb: "0,0,0" },
  ];

  it("纯红绿蓝像素精确匹配对应色号", () => {
    const pixelArray = [
      [[255, 0, 0], [0, 255, 0]],
      [[0, 0, 255], [0, 0, 0]],
    ];

    const result = mapColors(pixelArray, brandColors);

    expect(result).toEqual([
      ["red_01", "green_02"],
      ["blue_03", "black_05"],
    ]);
  });

  it("相近颜色匹配欧氏距离最小的色号", () => {
    const pixelArray = [
      [[240, 10, 10], [10, 240, 10]],
    ];

    const result = mapColors(pixelArray, brandColors);

    expect(result[0][0]).toBe("red_01");
    expect(result[0][1]).toBe("green_02");
  });

  it("空色卡数组抛出异常", () => {
    const pixelArray = [[[128, 128, 128]]];

    expect(() => mapColors(pixelArray, [])).toThrow("色卡数据为空");
  });

  it("空像素数组返回空二维数组", () => {
    const result = mapColors([], brandColors);
    expect(result).toEqual([]);
  });

  it("灰色像素匹配最近的黑或白", () => {
    const pixelArray = [
      [[100, 100, 100], [200, 200, 200]],
    ];

    const result = mapColors(pixelArray, brandColors);

    expect(result[0][0]).toBe("black_05");
    expect(result[0][1]).toBe("white_04");
  });
});
