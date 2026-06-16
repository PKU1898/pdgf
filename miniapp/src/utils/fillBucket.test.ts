import { describe, it, expect } from "vitest";
import { floodFill } from "./fillBucket";

describe("floodFill", () => {
  const grid3x3 = [
    ["A", "A", "B"],
    ["A", "A", "B"],
    ["B", "B", "B"],
  ];

  it("空网格返回 null", () => {
    expect(floodFill([], 0, 0, "X")).toBeNull();
  });

  it("起点越界返回 null", () => {
    expect(floodFill(grid3x3, -1, 0, "X")).toBeNull();
    expect(floodFill(grid3x3, 0, 5, "X")).toBeNull();
  });

  it("填充颜色与目标相同返回 null", () => {
    expect(floodFill(grid3x3, 0, 0, "A")).toBeNull();
  });

  it("填充连通的 A 区域", () => {
    const result = floodFill(grid3x3, 0, 0, "X");
    expect(result).not.toBeNull();
    expect(result!.count).toBe(4);
    expect(result!.grid[0][0]).toBe("X");
    expect(result!.grid[0][1]).toBe("X");
    expect(result!.grid[1][0]).toBe("X");
    expect(result!.grid[1][1]).toBe("X");
    expect(result!.grid[0][2]).toBe("B");
  });

  it("不修改原始网格（不可变性）", () => {
    const copy = grid3x3.map((r) => [...r]);
    floodFill(grid3x3, 0, 0, "X");
    expect(grid3x3).toEqual(copy);
  });

  it("超过 80% 面积上限返回 null", () => {
    const bigGrid = Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => "A")
    );
    const result = floodFill(bigGrid, 0, 0, "X");
    expect(result).toBeNull();
  });
});
