import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { request } from "../api/request";

const STORAGE_KEY = "inventory_quantities";
const MAX_QUANTITY = 9999;

interface InventoryRecord {
  id: string;
  userId: string;
  colorId: string;
  quantity: number;
}

export const useInventoryStore = defineStore("inventory", () => {
  const quantities = ref<Record<string, number>>(loadFromStorage());
  const syncing = ref(false);

  const selectedCount = computed(() => {
    return Object.values(quantities.value).filter((q) => q > 0).length;
  });

  const totalCount = computed(() => {
    return Object.values(quantities.value).reduce((sum, q) => sum + q, 0);
  });

  function loadFromStorage(): Record<string, number> {
    try {
      const raw = uni.getStorageSync(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveToStorage() {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(quantities.value));
  }

  async function loadFromCloud() {
    try {
      const res = await request<InventoryRecord[]>({ url: "/inventory" });
      const cloudMap: Record<string, number> = {};
      for (const record of res.data) {
        cloudMap[record.colorId] = record.quantity;
      }
      // 合并：云端数据覆盖本地同 key，本地独有保留
      quantities.value = { ...quantities.value, ...cloudMap };
      saveToStorage();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "加载库存失败";
      console.error("[inventory/loadFromCloud]", message);
    }
  }

  function updateQuantity(colorId: string, value: number) {
    let val = Math.floor(value);
    if (isNaN(val) || val < 0) val = 0;
    if (val > MAX_QUANTITY) val = MAX_QUANTITY;
    quantities.value = { ...quantities.value, [colorId]: val };
    saveToStorage();
  }

  async function syncToCloud(): Promise<boolean> {
    const items = Object.entries(quantities.value)
      .filter(([, qty]) => qty > 0)
      .map(([colorId, quantity]) => ({ colorId, quantity }));

    syncing.value = true;
    try {
      await request({ url: "/inventory/sync", method: "POST", data: { items } });
      uni.showToast({ title: "同步成功", icon: "success" });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "同步失败，请重试";
      console.error("[inventory/sync]", message);
      uni.showToast({ title: message, icon: "none" });
      return false;
    } finally {
      syncing.value = false;
    }
  }

  return {
    quantities,
    syncing,
    selectedCount,
    totalCount,
    loadFromCloud,
    updateQuantity,
    syncToCloud,
  };
});
