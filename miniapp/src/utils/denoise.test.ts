import { describe, it, expect } from "vitest";
import { denoiseGrid } from "./denoise";

describe("denoiseGrid", () => {
  const grid3x3 = [
    ["A", "B", "A"],
    ["B", "A", "B"],
    ["A", "B", "A"],
  ];

  it("空网格返回 null", () => {
    expect(denoiseGrid([], 50)).toBeNull();
    expect(denoiseGrid([[]], 50)).toBeNull();
  });

  it("全部相同颜色无噪声可去，返回 null", () => {
    const uniform = [
      ["A", "A", "A"],
      ["A", "A", "A"],
      ["A", "A", "A"],
    ];
    expect(denoiseGrid(uniform, 50)).toBeNull();
  });

  it("strength=1（最弱）threshold=4，仅去噪被4个不同邻居包围的点", () => {
    const result = denoiseGrid(grid3x3, 1);
    // strength=1 → threshold=4，棋盘中心 [1][1]="A" 四邻都是 "B" → diffCount=4 >= 4
    expect(result).not.toBeNull();
    expect(result!.count).toBe(1);
    expect(result!.grid[1][1]).toBe("B");
  });

  it("strength=100（最强）threshold=1，去噪最激进", () => {
    const result = denoiseGrid(grid3x3, 100);
    expect(result).not.toBeNull();
    expect(result!.count).toBeGreaterThan(0);
  });

  it("噪声点被替换为周围多数颜色", () => {
    const grid = [
      ["A", "A", "A"],
      ["A", "B", "A"],
      ["A", "A", "A"],
    ];
    const result = denoiseGrid(grid, 50);
    expect(result).not.toBeNull();
    expect(result!.grid[1][1]).toBe("A");
    expect(result!.count).toBe(1);
  });

  it("strength 超出范围自动 clamp", () => {
    const result1 = denoiseGrid(grid3x3, 0);
    const result2 = denoiseGrid(grid3x3, 150);
    // strength=0 → clamped to 1 → threshold=4 → 棋盘中心被替换
    expect(result1).not.toBeNull();
    expect(result1!.count).toBe(1);
    // strength=150 → clamped to 100 → threshold=1 → 更多噪点被替换
    expect(result2).not.toBeNull();
    expect(result2!.count).toBeGreaterThanOrEqual(result1!.count);
  });

  it("不修改原始网格（不可变性）", () => {
    const grid = [
      ["A", "A", "A"],
      ["A", "B", "A"],
      ["A", "A", "A"],
    ];
    const copy = grid.map((r) => [...r]);
    denoiseGrid(grid, 50);
    expect(grid).toEqual(copy);
  });
});
