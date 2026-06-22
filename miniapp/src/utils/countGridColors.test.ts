import { describe, it, expect } from "vitest";
import { countGridColors } from "./countGridColors";

describe("countGridColors", () => {
  it("returns empty array for empty grid", () => {
    const result = countGridColors([]);
    expect(result).toEqual([]);
  });

  it("returns empty array for grid with only empty cells", () => {
    const grid = [["", ""], ["", ""]];
    const result = countGridColors(grid);
    expect(result).toEqual([]);
  });

  it("counts single color correctly", () => {
    const grid = [["red", "red"], ["red", ""]];
    const result = countGridColors(grid);
    expect(result).toEqual([{ colorId: "red", count: 3 }]);
  });

  it("counts multiple colors correctly and sorts descending", () => {
    const grid = [
      ["red", "red", "red", "red", "red", "red", "red", "red", "red", "red"],
      ["blue", "blue", "blue", "blue", "blue"],
    ];
    const result = countGridColors(grid);
    expect(result).toEqual([
      { colorId: "red", count: 10 },
      { colorId: "blue", count: 5 },
    ]);
  });

  it("sorts by count descending", () => {
    const grid = [["blue", "blue", "red", "red", "red"]];
    const result = countGridColors(grid);
    expect(result[0].colorId).toBe("red");
    expect(result[0].count).toBe(3);
    expect(result[1].colorId).toBe("blue");
    expect(result[1].count).toBe(2);
  });

  it("ignores empty cells", () => {
    const grid = [["red", "", "blue", ""]];
    const result = countGridColors(grid);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.colorId === "red")?.count).toBe(1);
    expect(result.find((r) => r.colorId === "blue")?.count).toBe(1);
  });

  it("handles complex colorId format", () => {
    const grid = [["MARD_S01", "MARD_S01", "COCO_A03"]];
    const result = countGridColors(grid);
    expect(result).toEqual([
      { colorId: "MARD_S01", count: 2 },
      { colorId: "COCO_A03", count: 1 },
    ]);
  });

  it("does not mutate input grid", () => {
    const grid = [["red", "blue"]];
    const copy = [["red", "blue"]];
    countGridColors(grid);
    expect(grid).toEqual(copy);
  });
});
