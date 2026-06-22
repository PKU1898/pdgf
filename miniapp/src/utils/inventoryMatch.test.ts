import { describe, it, expect } from "vitest";
import { matchInventoryColors } from "./inventoryMatch";
import type { ColorInfo } from "./inventoryMatch";

const COLORS: ColorInfo[] = [
  { id: "red", rgb: "255,0,0" },
  { id: "green", rgb: "0,255,0" },
  { id: "blue", rgb: "0,0,255" },
  { id: "yellow", rgb: "255,255,0" },
  { id: "orange", rgb: "255,165,0" },
];

describe("matchInventoryColors", () => {
  it("returns null for empty grid", () => {
    const result = matchInventoryColors([], COLORS, { red: 10 });
    expect(result).toBeNull();
  });

  it("returns null when no inventory", () => {
    const grid = [["red", "blue"]];
    const result = matchInventoryColors(grid, COLORS, {});
    expect(result).toBeNull();
  });

  it("returns null when all inventory quantities are 0", () => {
    const grid = [["red", "blue"]];
    const result = matchInventoryColors(grid, COLORS, { red: 0, blue: 0 });
    expect(result).toBeNull();
  });

  it("keeps same color when it exists in inventory", () => {
    const grid = [["red", "blue"]];
    const inventory = { red: 100, blue: 100 };
    const result = matchInventoryColors(grid, COLORS, inventory);
    expect(result).not.toBeNull();
    expect(result!.grid).toEqual([["red", "blue"]]);
  });

  it("replaces color with nearest inventory color", () => {
    const grid = [["green"]];
    const inventory = { red: 100, blue: 100 };
    const result = matchInventoryColors(grid, COLORS, inventory);
    expect(result).not.toBeNull();
    // green(0,255,0) to red(255,0,0) dist=360.6
    // green(0,255,0) to blue(0,0,255) dist=360.6
    expect(["red", "blue"]).toContain(result!.grid[0][0]);
  });

  it("replaces all colors when only red/yellow/blue inventory", () => {
    const grid = [
      ["red", "green", "orange"],
      ["blue", "yellow", "green"],
    ];
    const inventory = { red: 100, yellow: 100, blue: 100 };
    const result = matchInventoryColors(grid, COLORS, inventory);
    expect(result).not.toBeNull();

    for (const row of result!.grid) {
      for (const cell of row) {
        expect(["red", "yellow", "blue"]).toContain(cell);
      }
    }
  });

  it("calculates shortages when needed > have", () => {
    const grid = [
      ["red", "red"],
      ["red", "red"],
    ];
    const inventory = { red: 2 };
    const result = matchInventoryColors(grid, COLORS, inventory);
    expect(result).not.toBeNull();
    expect(result!.shortages).toHaveLength(1);
    expect(result!.shortages[0]).toEqual({
      colorId: "red",
      needed: 4,
      have: 2,
      gap: 2,
    });
  });

  it("no shortage when inventory is sufficient", () => {
    const grid = [["red", "blue"]];
    const inventory = { red: 10, blue: 10 };
    const result = matchInventoryColors(grid, COLORS, inventory);
    expect(result).not.toBeNull();
    expect(result!.shortages).toHaveLength(0);
  });

  it("preserves empty cells", () => {
    const grid = [["red", "", "blue"]];
    const inventory = { red: 10, blue: 10 };
    const result = matchInventoryColors(grid, COLORS, inventory);
    expect(result).not.toBeNull();
    expect(result!.grid[0][1]).toBe("");
  });

  it("does not mutate original grid", () => {
    const grid = [["green"]];
    const original = [["green"]];
    const inventory = { red: 10 };
    matchInventoryColors(grid, COLORS, inventory);
    expect(grid).toEqual(original);
  });

  it("uses match cache for repeated colors", () => {
    const grid = [
      ["green", "green", "green"],
      ["green", "green", "green"],
    ];
    const inventory = { red: 100 };
    const result = matchInventoryColors(grid, COLORS, inventory);
    expect(result).not.toBeNull();
    const allSame = result!.grid.flat().every((c) => c === "red");
    expect(allSame).toBe(true);
  });
});
