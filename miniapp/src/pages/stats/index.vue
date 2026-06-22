<script setup lang="ts">
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useProjectStore } from "../../store/project";
import { useInventoryStore } from "../../store/inventory";
import type { Shortage } from "../../utils/inventoryMatch";

const projectStore = useProjectStore();
const inventoryStore = useInventoryStore();

const useInventory = ref(false);
const shortages = ref<Shortage[]>([]);
let originalGridSnapshot: string[][] | null = null;

interface ColorStat {
  colorId: string;
  hexCode: string;
  code: string;
  count: number;
  inventoryQty: number;
  gap: number;
}

const colorStats = computed<ColorStat[]>(() => {
  const counts = new Map<string, number>();
  for (const row of projectStore.gridData) {
    for (const cell of row) {
      if (cell) {
        counts.set(cell, (counts.get(cell) ?? 0) + 1);
      }
    }
  }

  const stats: ColorStat[] = [];
  for (const [colorId, count] of counts) {
    const hexCode = projectStore.colorMap[colorId] ?? "#CCCCCC";
    const code = colorId.split("_").pop() ?? colorId;
    const inventoryQty = inventoryStore.quantities[colorId] ?? 0;
    const shortage = shortages.value.find((s) => s.colorId === colorId);
    const gap = shortage?.gap ?? 0;

    stats.push({ colorId, hexCode, code, count, inventoryQty, gap });
  }

  stats.sort((a, b) => b.count - a.count);
  return stats;
});

const totalBeads = computed(() =>
  colorStats.value.reduce((sum, s) => sum + s.count, 0)
);

const hasShortage = computed(() => shortages.value.length > 0);

function onToggleChange(e: { detail: { value: boolean } }): void {
  useInventory.value = e.detail.value;

  if (e.detail.value) {
    if (inventoryStore.selectedCount === 0) {
      useInventory.value = false;
      uni.showToast({ title: "请先添加豆库", icon: "none" });
      return;
    }

    originalGridSnapshot = projectStore.gridData.map((row) => [...row]);
    const result = projectStore.matchInventory(inventoryStore.quantities);
    if (result) {
      shortages.value = result;
      uni.showToast({
        title: `已替换为库存色，${result.length} 种缺口`,
        icon: "none",
      });
    } else {
      useInventory.value = false;
      originalGridSnapshot = null;
      uni.showToast({ title: "配色替换失败", icon: "none" });
    }
  } else {
    shortages.value = [];
    if (originalGridSnapshot) {
      projectStore.gridData = originalGridSnapshot;
      originalGridSnapshot = null;
    }
  }
}

onLoad(() => {
  inventoryStore.loadFromCloud();
});
</script>

<template>
  <view class="min-h-screen bg-bg">
    <!-- 开关区域 -->
    <view class="bg-card mx-page-x mt-3 rounded-panel p-4">
      <view class="flex items-center justify-between">
        <view>
          <text class="text-sm font-bold text-text-main block">仅用自有库存配色</text>
          <text class="text-xs text-text-sub mt-1 block">将图纸颜色替换为库存中最接近的颜色</text>
        </view>
        <switch
          :checked="useInventory"
          color="#07C160"
          @change="onToggleChange"
        />
      </view>
    </view>

    <!-- 缺口提醒 -->
    <view v-if="useInventory && hasShortage" class="bg-error/10 mx-page-x mt-3 rounded-panel p-4">
      <text class="text-sm text-error font-bold block">库存缺口提醒</text>
      <view v-for="s in shortages" :key="s.colorId" class="mt-2">
        <text class="text-xs text-error">
          {{ s.colorId.split("_").pop() }}: 缺口 {{ s.gap }} 颗（需 {{ s.needed }}，有 {{ s.have }}）
        </text>
      </view>
    </view>

    <!-- 统计列表 -->
    <view class="bg-card mx-page-x mt-3 rounded-panel p-4">
      <view class="flex justify-between items-center mb-3">
        <text class="text-sm font-bold text-text-main">色号统计</text>
        <text class="text-xs text-text-sub">共 {{ totalBeads }} 颗</text>
      </view>

      <view v-if="colorStats.length === 0" class="py-8 text-center">
        <text class="text-sm text-text-sub">暂无数据</text>
      </view>

      <view v-else>
        <view
          v-for="stat in colorStats"
          :key="stat.colorId"
          class="flex items-center py-2 border-b border-border-light last:border-b-0"
        >
          <view
            class="w-8 h-8 rounded-full shrink-0 mr-3"
            :style="{ backgroundColor: stat.hexCode }"
          />
          <view class="flex-1 min-w-0">
            <text class="text-sm text-text-main font-mono block">{{ stat.code }}</text>
            <text v-if="useInventory" class="text-xs text-text-sub block">
              库存: {{ stat.inventoryQty }}
            </text>
          </view>
          <view class="text-right">
            <text class="text-sm text-text-main font-bold block">{{ stat.count }}</text>
            <text
              v-if="useInventory && stat.gap > 0"
              class="text-xs text-error block"
            >
              缺口: {{ stat.gap }}颗
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
