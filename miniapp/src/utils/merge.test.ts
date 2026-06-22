import { describe, it, expect } from "vitest";
import { mergeGrid } from "./merge";

describe("mergeGrid", () => {
  it("空网格返回 null", () => {
    expect(mergeGrid([], 50)).toBeNull();
    expect(mergeGrid([[]], 50)).toBeNull();
  });

  it("全部相同颜色无需融合，返回 null", () => {
    const uniform = [
      ["A", "A", "A"],
      ["A", "A", "A"],
      ["A", "A", "A"],
    ];
    expect(mergeGrid(uniform, 50)).toBeNull();
  });

  it("strength=0 不做任何处理，返回 null", () => {
    const grid = [
      ["A", "B", "A"],
      ["B", "A", "B"],
      ["A", "B", "A"],
    ];
    expect(mergeGrid(grid, 0)).toBeNull();
  });

  it("孤立单像素被周围色融合（strength=1）", () => {
    const grid = [
      ["B", "B", "B"],
      ["B", "A", "B"],
      ["B", "B", "B"],
    ];
    const result = mergeGrid(grid, 1);
    expect(result).not.toBeNull();
    expect(result!.count).toBe(1);
    expect(result!.grid[1][1]).toBe("B");
  });

  it("锯齿边缘被平滑（strength=50）", () => {
    const grid = [
      ["A", "A", "B", "B"],
      ["A", "A", "A", "B"],
      ["A", "A", "B", "B"],
      ["A", "A", "A", "B"],
    ];
    const result = mergeGrid(grid, 50);
    expect(result).not.toBeNull();
    expect(result!.grid[0][2]).toBe("A");
    expect(result!.grid[2][2]).toBe("A");
  });

  it("strength=100 时替换更激进", () => {
    const grid = [
      ["A", "B", "A"],
      ["B", "A", "B"],
      ["A", "B", "A"],
    ];
    const result = mergeGrid(grid, 100);
    expect(result).not.toBeNull();
    expect(result!.count).toBeGreaterThan(0);
  });

  it("strength 超出范围自动 clamp", () => {
    const grid = [
      ["B", "B", "B"],
      ["B", "A", "B"],
      ["B", "B", "B"],
    ];
    const result1 = mergeGrid(grid, -10);
    const result2 = mergeGrid(grid, 150);
    expect(result1).toBeNull();
    expect(result2).not.toBeNull();
    expect(result2!.count).toBeGreaterThan(0);
  });

  it("主体轮廓保留，不替换占主导的色块", () => {
    const grid = [
      ["A", "A", "A", "A"],
      ["A", "A", "B", "A"],
      ["A", "A", "A", "A"],
      ["A", "A", "A", "A"],
    ];
    const result = mergeGrid(grid, 50);
    expect(result).not.toBeNull();
    expect(result!.grid[1][2]).toBe("A");
    expect(result!.grid[0][0]).toBe("A");
    expect(result!.grid[2][2]).toBe("A");
  });

  it("不修改原始网格（不可变性）", () => {
    const grid = [
      ["B", "B", "B"],
      ["B", "A", "B"],
      ["B", "B", "B"],
    ];
    const copy = grid.map((r) => [...r]);
    mergeGrid(grid, 50);
    expect(grid).toEqual(copy);
  });
});
