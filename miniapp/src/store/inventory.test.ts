import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

vi.mock("../api/request", () => ({
  request: vi.fn().mockResolvedValue({ data: [] }),
}));

const storage: Record<string, string> = {};
const uniMock = {
  getStorageSync: vi.fn((key: string) => storage[key] ?? ""),
  setStorageSync: vi.fn((key: string, value: string) => { storage[key] = value; }),
  showToast: vi.fn(),
};
vi.stubGlobal("uni", uniMock);

import { useInventoryStore } from "./inventory";

describe("inventory store", () => {
  beforeEach(() => {
    for (const key of Object.keys(storage)) delete storage[key];
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it("初始状态为空", () => {
    const store = useInventoryStore();
    expect(store.quantities).toEqual({});
    expect(store.selectedCount).toBe(0);
    expect(store.totalCount).toBe(0);
  });

  it("updateQuantity 正常设置数量", () => {
    const store = useInventoryStore();
    store.updateQuantity("red_01", 50);
    expect(store.quantities["red_01"]).toBe(50);
  });

  it("updateQuantity 超过 MAX_QUANTITY(9999) 自动 clamp", () => {
    const store = useInventoryStore();
    store.updateQuantity("red_01", 15000);
    expect(store.quantities["red_01"]).toBe(9999);
  });

  it("updateQuantity 负数自动归零", () => {
    const store = useInventoryStore();
    store.updateQuantity("red_01", -5);
    expect(store.quantities["red_01"]).toBe(0);
  });

  it("updateQuantity NaN 自动归零", () => {
    const store = useInventoryStore();
    store.updateQuantity("red_01", NaN);
    expect(store.quantities["red_01"]).toBe(0);
  });

  it("updateQuantity 小数向下取整", () => {
    const store = useInventoryStore();
    store.updateQuantity("red_01", 3.7);
    expect(store.quantities["red_01"]).toBe(3);
  });

  it("selectedCount 只统计 qty > 0", () => {
    const store = useInventoryStore();
    store.updateQuantity("a", 10);
    store.updateQuantity("b", 0);
    store.updateQuantity("c", 5);
    expect(store.selectedCount).toBe(2);
  });

  it("totalCount 计算所有数量之和", () => {
    const store = useInventoryStore();
    store.updateQuantity("a", 100);
    store.updateQuantity("b", 200);
    expect(store.totalCount).toBe(300);
  });
});
