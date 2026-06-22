import { describe, it, expect, vi, beforeEach } from "vitest";

const mockShow = vi.fn(() => Promise.resolve());
const mockOnClose = vi.fn();
const mockOffClose = vi.fn();
const mockOnError = vi.fn();
const mockOffError = vi.fn();

const storage: Record<string, unknown> = {};

vi.stubGlobal("wx", {
  createRewardedVideoAd: vi.fn(() => ({
    show: mockShow,
    onClose: mockOnClose,
    offClose: mockOffClose,
    onError: mockOnError,
    offError: mockOffError,
  })),
});

vi.stubGlobal("uni", {
  getStorageSync: vi.fn((key: string) => storage[key]),
  setStorageSync: vi.fn((key: string, value: unknown) => {
    storage[key] = value;
  }),
  showToast: vi.fn(),
  showModal: vi.fn(),
});

import {
  initRewardAd,
  isMattingUnlocked,
  showRewardAd,
  confirmAndUnlock,
} from "./rewardAd";

beforeEach(() => {
  vi.clearAllMocks();
  delete storage["ad_matting_unlocked"];
});

describe("initRewardAd", () => {
  it("creates rewarded video ad on init", () => {
    initRewardAd();
    expect(wx.createRewardedVideoAd).toHaveBeenCalledWith({
      adUnitId: "adunit_matting",
    });
  });
});

describe("isMattingUnlocked", () => {
  it("returns false when not unlocked", () => {
    expect(isMattingUnlocked()).toBe(false);
  });

  it("returns true when unlocked", () => {
    storage["ad_matting_unlocked"] = true;
    expect(isMattingUnlocked()).toBe(true);
  });
});

describe("showRewardAd", () => {
  it("shows ad and resolves true when watched completely", async () => {
    initRewardAd();

    mockOnClose.mockImplementation((cb) => {
      cb({ isEnded: true });
    });

    const result = await showRewardAd();
    expect(result).toBe(true);
    expect(isMattingUnlocked()).toBe(true);
  });

  it("resolves false when ad closed early", async () => {
    initRewardAd();

    mockOnClose.mockImplementation((cb) => {
      cb({ isEnded: false });
    });

    const result = await showRewardAd();
    expect(result).toBe(false);
    expect(isMattingUnlocked()).toBe(false);
  });

  it("resolves false when ad not initialized", async () => {
    const result = await showRewardAd();
    expect(result).toBe(false);
  });
});

describe("confirmAndUnlock", () => {
  it("returns true immediately if already unlocked", async () => {
    storage["ad_matting_unlocked"] = true;
    const result = await confirmAndUnlock();
    expect(result).toBe(true);
  });
});
