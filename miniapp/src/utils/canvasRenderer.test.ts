import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFillText = vi.fn();
const mockFillRect = vi.fn();
const mockStrokeRect = vi.fn();
const mockToTempFilePathSync = vi.fn(() => "/tmp/export.png");

function createMockCtx() {
  return {
    fillText: mockFillText,
    fillRect: mockFillRect,
    strokeRect: mockStrokeRect,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    textAlign: "",
    textBaseline: "",
  };
}

let mockCtx: ReturnType<typeof createMockCtx>;

const createOffscreenCanvas = vi.fn(() => ({
  getContext: () => mockCtx,
  toTempFilePathSync: mockToTempFilePathSync,
}));

vi.stubGlobal("uni", { createOffscreenCanvas });

import { renderToImage } from "./canvasRenderer";

beforeEach(() => {
  vi.clearAllMocks();
  mockCtx = createMockCtx();
  createOffscreenCanvas.mockReturnValue({
    getContext: () => mockCtx,
    toTempFilePathSync: mockToTempFilePathSync,
  });
});

const COLOR_MAP: Record<string, string> = {
  red: "#FF0000",
  blue: "#0000FF",
};

const COLOR_CODES: Record<string, string> = {
  red: "S01",
  blue: "A03",
};

describe("renderToImage", () => {
  it("throws on empty gridData", () => {
    expect(() =>
      renderToImage({ gridData: [], colorMap: COLOR_MAP, colorCodes: COLOR_CODES })
    ).toThrow("gridData 为空");
  });

  it("throws on zero-width grid", () => {
    expect(() =>
      renderToImage({ gridData: [[]], colorMap: COLOR_MAP, colorCodes: COLOR_CODES })
    ).toThrow("gridData 列数为 0");
  });

  it("throws when grid exceeds 200x200", () => {
    const bigGrid = Array.from({ length: 201 }, () => Array(201).fill(""));
    expect(() =>
      renderToImage({ gridData: bigGrid, colorMap: COLOR_MAP, colorCodes: COLOR_CODES })
    ).toThrow("超过限制");
  });

  it("creates offscreen canvas with correct dimensions for 10x10 grid", () => {
    const grid = Array.from({ length: 10 }, () => Array(10).fill(""));
    renderToImage({ gridData: grid, colorMap: COLOR_MAP, colorCodes: COLOR_CODES });

    expect(uni.createOffscreenCanvas).toHaveBeenCalledWith({
      type: "2d",
      width: 200,
      height: 200,
    });
  });

  it("calls toTempFilePathSync and returns path", () => {
    const grid = [["red"]];
    const result = renderToImage({ gridData: grid, colorMap: COLOR_MAP, colorCodes: COLOR_CODES });

    expect(mockToTempFilePathSync).toHaveBeenCalledWith({
      x: 0,
      y: 0,
      width: 20,
      height: 20,
      destWidth: 20,
      destHeight: 20,
      fileType: "png",
    });
    expect(result).toBe("/tmp/export.png");
  });

  it("draws background color for filled cells", () => {
    const grid = [["red"]];
    renderToImage({ gridData: grid, colorMap: COLOR_MAP, colorCodes: COLOR_CODES });

    const calls = mockFillRect.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  it("draws text for filled cells", () => {
    const grid = [["red"]];
    renderToImage({ gridData: grid, colorMap: COLOR_MAP, colorCodes: COLOR_CODES });

    expect(mockFillText).toHaveBeenCalledWith("S01", 10, 10);
  });

  it("skips text for empty cells", () => {
    const grid = [[""]];
    renderToImage({ gridData: grid, colorMap: COLOR_MAP, colorCodes: COLOR_CODES });

    expect(mockFillText).not.toHaveBeenCalled();
  });

  it("draws grid lines via strokeRect for each cell", () => {
    const grid = [
      ["red", "blue"],
      ["", "red"],
    ];
    renderToImage({ gridData: grid, colorMap: COLOR_MAP, colorCodes: COLOR_CODES });

    expect(mockStrokeRect).toHaveBeenCalledTimes(4);
  });

  it("handles 200x200 grid at max boundary", () => {
    const grid = Array.from({ length: 200 }, () => Array(200).fill("red"));
    renderToImage({ gridData: grid, colorMap: COLOR_MAP, colorCodes: COLOR_CODES });

    expect(uni.createOffscreenCanvas).toHaveBeenCalledWith({
      type: "2d",
      width: 4000,
      height: 4000,
    });
  });
});
