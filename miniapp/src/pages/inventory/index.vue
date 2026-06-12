<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { request } from "../../api/request";

interface BeadColor {
  id: string;
  brand: string;
  code: string;
  hexCode: string;
  rgb: string;
  name: string | null;
}

interface GroupedColors {
  [brand: string]: BeadColor[];
}

const brands = ref<string[]>([]);
const activeBrand = ref("mard");
const colors = ref<BeadColor[]>([]);
const quantities = ref<Record<string, number>>({});
const loading = ref(true);
const loadError = ref(false);

const brandLabels: Record<string, string> = {
  mard: "MARD",
  coco: "COCO",
};

function getBrandLabel(brand: string): string {
  if (brandLabels[brand]) return brandLabels[brand];
  if (brand.startsWith("custom_")) {
    const parts = brand.split("_");
    return parts.length >= 3 ? parts[2] : brand;
  }
  return brand;
}

const selectedCount = computed(() => {
  return Object.values(quantities.value).filter((q) => q > 0).length;
});

const totalCount = computed(() => {
  return Object.values(quantities.value).reduce((sum, q) => sum + q, 0);
});

async function loadColors() {
  loading.value = true;
  loadError.value = false;

  try {
    const res = await request<GroupedColors>({ url: "/bead/colors" });
    const grouped = res.data;

    const brandList = Object.keys(grouped);
    brands.value = brandList;

    if (brandList.length > 0 && !brandList.includes(activeBrand.value)) {
      activeBrand.value = brandList[0];
    }

    switchBrand(activeBrand.value, grouped);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "加载色卡失败";
    console.error("[inventory/load]", message);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

function switchBrand(brand: string, grouped?: GroupedColors) {
  activeBrand.value = brand;

  if (grouped) {
    colors.value = grouped[brand] || [];
  }

  const newQuantities: Record<string, number> = {};
  for (const color of colors.value) {
    newQuantities[color.id] = quantities.value[color.id] || 0;
  }
  quantities.value = newQuantities;
}

function onQuantityInput(colorId: string, event: unknown) {
  const detail = (event as { detail?: { value?: string } }).detail;
  const raw = detail?.value ?? "";
  let val = parseInt(raw, 10);
  if (isNaN(val) || val < 0) val = 0;
  if (val > 9999) val = 9999;
  quantities.value = { ...quantities.value, [colorId]: val };
}

function showToast(msg: string) {
  uni.showToast({ title: msg, icon: "none" });
}

function handleSync() {
  // task-014 实现同步逻辑
  uni.showToast({ title: "同步功能开发中", icon: "none" });
}

onMounted(() => {
  loadColors();
});
</script>

<template>
  <view class="min-h-screen bg-bg pb-[120rpx]">
    <!-- 品牌 Tab -->
    <scroll-view scroll-x class="bg-card whitespace-nowrap border-b border-border-light" :show-scrollbar="false">
      <view class="flex items-center px-page-x py-3 gap-3">
        <view
          v-for="brand in brands"
          :key="brand"
          class="inline-flex items-center px-4 py-2 rounded-btn text-sm shrink-0"
          :class="activeBrand === brand ? 'bg-primary text-white' : 'bg-bg text-text-main'"
          @tap="switchBrand(brand)"
        >
          {{ getBrandLabel(brand) }}
        </view>
        <view
          class="inline-flex items-center px-4 py-2 rounded-btn text-sm text-text-sub bg-bg shrink-0"
          @tap="showToast('管理色板开发中')"
        >
          + 管理色板
        </view>
      </view>
    </scroll-view>

    <!-- 加载状态 -->
    <view v-if="loading" class="flex flex-col items-center justify-center py-20">
      <text class="text-text-sub text-sm">加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="loadError" class="flex flex-col items-center justify-center py-20">
      <text class="text-text-sub text-sm mb-4">加载色卡失败</text>
      <view class="px-6 py-2 bg-primary text-white rounded-btn text-sm" @tap="loadColors">重试</view>
    </view>

    <!-- 色卡网格 -->
    <view v-else class="px-page-x pt-4">
      <view class="grid grid-cols-5 gap-2">
        <view
          v-for="color in colors"
          :key="color.id"
          class="flex flex-col items-center"
        >
          <view
            class="w-full aspect-square rounded-card"
            :style="{ backgroundColor: color.hexCode }"
          />
          <text class="font-mono text-xs text-text-sub mt-1">{{ color.code }}</text>
          <input
            type="number"
            :value="quantities[color.id] ?? ''"
            class="w-full h-8 text-center text-xs bg-bg rounded mt-1 border border-border-light"
            placeholder="0"
            @input="onQuantityInput(color.id, $event)"
          />
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="colors.length === 0" class="flex flex-col items-center justify-center py-20">
        <text class="text-text-sub text-sm">暂无色卡数据</text>
      </view>
    </view>

    <!-- 底部悬浮统计栏 -->
    <view class="fixed bottom-0 left-0 right-0 bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-page-x py-3 flex items-center justify-between z-50">
      <text class="text-text-main text-sm">已选{{ selectedCount }}种，共{{ totalCount }}颗</text>
      <view class="px-6 py-2 bg-primary text-white rounded-btn text-sm" @tap="handleSync">一键同步</view>
    </view>
  </view>
</template>
