import { describe, it, expect } from "vitest";
import { removeBackground } from "./removeBackground";

describe("removeBackground", () => {
  const colorMap: Record<string, string> = {
    W: "#FFFFFF",
    B: "#000000",
    R: "#FF0000",
    G: "#00FF00",
  };

  it("空网格返回 null", () => {
    expect(removeBackground([], colorMap)).toBeNull();
  });

  it("四角颜色不一致返回 null", () => {
    const grid = [
      ["R", "W"],
      ["W", "B"],
    ];
    expect(removeBackground(grid, colorMap)).toBeNull();
  });

  it("四角颜色一致时执行 floodFill 清除背景", () => {
    const grid = [
      ["W", "B", "W"],
      ["B", "B", "B"],
      ["W", "B", "W"],
    ];
    const result = removeBackground(grid, colorMap);
    expect(result).not.toBeNull();
    expect(result!.grid[0][0]).toBe("");
    expect(result!.grid[0][1]).toBe("B");
    expect(result!.count).toBe(1);
  });

  it("四角有空字符串返回 null", () => {
    const grid = [
      ["", "W"],
      ["W", "W"],
    ];
    expect(removeBackground(grid, colorMap)).toBeNull();
  });

  it("colorMap 缺少色号返回 null", () => {
    const grid = [
      ["X", "W"],
      ["W", "X"],
    ];
    expect(removeBackground(grid, colorMap)).toBeNull();
  });

  it("不修改原始网格（不可变性）", () => {
    const grid = [
      ["W", "B", "W"],
      ["B", "B", "B"],
      ["W", "B", "W"],
    ];
    const copy = grid.map((r) => [...r]);
    removeBackground(grid, colorMap);
    expect(grid).toEqual(copy);
  });
});
