import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildCsvString, exportPng, exportCsv } from "./exportFile";
import type { CsvRow } from "./exportFile";

vi.mock("./canvasRenderer", () => ({
  renderToImage: vi.fn(() => "/tmp/test.png"),
}));

vi.stubGlobal("wx", { env: { USER_DATA_PATH: "/wx/user" } });

const mockShowToast = vi.fn();
const mockSaveImageToPhotosAlbum = vi.fn((opts) => opts.success());
const mockAuthorize = vi.fn((opts) => opts.success());
const mockOpenSetting = vi.fn();
const mockShowModal = vi.fn();
const mockWriteFileSync = vi.fn();
const mockShareFileMessage = vi.fn((opts) => opts.success());

const uniMock = {
  showToast: mockShowToast,
  saveImageToPhotosAlbum: mockSaveImageToPhotosAlbum,
  authorize: mockAuthorize,
  openSetting: mockOpenSetting,
  showModal: mockShowModal,
  getFileSystemManager: () => ({
    writeFileSync: mockWriteFileSync,
  }),
  shareFileMessage: mockShareFileMessage,
};

vi.stubGlobal("uni", uniMock);

describe("buildCsvString", () => {
  it("generates CSV with header and rows", () => {
    const rows: CsvRow[] = [
      { code: "S01", name: "红色", count: 10 },
      { code: "A03", name: "蓝色", count: 5 },
    ];
    const result = buildCsvString(rows);
    expect(result).toBe("色号,颜色名,所需数量\nS01,红色,10\nA03,蓝色,5");
  });

  it("handles empty rows", () => {
    const result = buildCsvString([]);
    expect(result).toBe("色号,颜色名,所需数量");
  });

  it("escapes names containing commas", () => {
    const rows: CsvRow[] = [{ code: "S01", name: "红,色", count: 10 }];
    const result = buildCsvString(rows);
    expect(result).toContain('"红,色"');
  });

  it("handles empty name", () => {
    const rows: CsvRow[] = [{ code: "S01", name: "", count: 10 }];
    const result = buildCsvString(rows);
    expect(result).toBe("色号,颜色名,所需数量\nS01,,10");
  });
});

describe("exportPng", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves image to album when authorized", async () => {
    const result = await exportPng(
      {
        gridData: [["red"]],
        colorMap: { red: "#FF0000" },
        colorCodes: { red: "S01" },
      },
      "test"
    );
    expect(result).toBe(true);
    expect(mockSaveImageToPhotosAlbum).toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ icon: "success" })
    );
  });

  it("returns false when permission denied", async () => {
    mockAuthorize.mockImplementationOnce((opts) => opts.fail());
    const result = await exportPng(
      {
        gridData: [["red"]],
        colorMap: { red: "#FF0000" },
        colorCodes: { red: "S01" },
      },
      "test"
    );
    expect(result).toBe(false);
    expect(mockShowModal).toHaveBeenCalled();
  });

  it("returns false when save fails", async () => {
    mockSaveImageToPhotosAlbum.mockImplementationOnce((opts) =>
      opts.fail(new Error("save error"))
    );
    const result = await exportPng(
      {
        gridData: [["red"]],
        colorMap: { red: "#FF0000" },
        colorCodes: { red: "S01" },
      },
      "test"
    );
    expect(result).toBe(false);
  });
});

describe("exportCsv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes CSV file and shares", () => {
    const result = exportCsv(
      "test",
      [["red", "blue"]],
      { red: "S01", blue: "A03" },
      { red: "红色", blue: "蓝色" }
    );
    expect(result).toBe(true);
    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(mockShareFileMessage).toHaveBeenCalled();
  });

  it("returns false when write fails", () => {
    mockWriteFileSync.mockImplementationOnce(() => {
      throw new Error("write error");
    });
    const result = exportCsv("test", [["red"]], { red: "S01" }, { red: "红色" });
    expect(result).toBe(false);
  });
});
