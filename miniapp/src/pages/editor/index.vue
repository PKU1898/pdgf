<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useProjectStore } from "../../store/project";
import { confirmAndUnlock } from "../../utils/rewardAd";
import CanvasViewport from "../../components/CanvasViewport.vue";
import BeadGrid from "../../components/BeadGrid.vue";
import ToolDrawer from "../../components/ToolDrawer.vue";

const store = useProjectStore();

const currentColorId = ref("");
const activeTool = ref("");
const lastDrawKey = ref("");
const pendingCell = ref<{ row: number; col: number } | null>(null);
const showSettings = ref(false);
const settingsWidth = ref(0);
const settingsHeight = ref(0);
const showDenoise = ref(false);
const denoiseStrength = ref(50);
const showMerge = ref(false);
const mergeStrength = ref(50);

const drawerRef = ref<InstanceType<typeof ToolDrawer> | null>(null);

const DRAW_THROTTLE_MS = 16;
let lastDrawTime = 0;

onLoad((options) => {
  const projectId = options?.projectId;
  if (projectId) {
    store.loadProject(projectId);
  }
});

function onCellClick(row: number, col: number): void {
  if (activeTool.value === "brush") {
    if (currentColorId.value) {
      store.updateCell(row, col, currentColorId.value);
    }
    return;
  }
  if (activeTool.value === "eraser") {
    store.updateCell(row, col, "");
    return;
  }
  if (activeTool.value === "fill") {
    if (!currentColorId.value) {
      uni.showToast({ title: "请先选择颜色", icon: "none" });
      return;
    }
    const count = store.fillArea(row, col, currentColorId.value);
    if (count > 0) {
      uni.showToast({ title: `已填充 ${count} 颗`, icon: "none" });
    } else {
      uni.showToast({ title: "区域过大或颜色相同", icon: "none" });
    }
    return;
  }
  pendingCell.value = { row, col };
  drawerRef.value?.openPalette();
}

function onCellDraw(row: number, col: number): void {
  const now = Date.now();
  if (now - lastDrawTime < DRAW_THROTTLE_MS) return;

  const key = `${row},${col}`;
  if (key === lastDrawKey.value) return;

  const colorId = activeTool.value === "eraser" ? "" : currentColorId.value;
  if (activeTool.value === "brush" && !currentColorId.value) return;

  const current = store.gridData[row]?.[col];
  if (current === colorId) return;

  lastDrawTime = now;
  lastDrawKey.value = key;
  store.updateCell(row, col, colorId);
}

function onColorSelect(colorId: string): void {
  currentColorId.value = colorId;
  if (pendingCell.value) {
    store.updateCell(pendingCell.value.row, pendingCell.value.col, colorId);
    pendingCell.value = null;
  }
  drawerRef.value?.closePalette();
}

function onToolChange(tool: string): void {
  if (tool === "removeBg") {
    const count = store.removeBg();
    if (count > 0) {
      uni.showToast({ title: `已清除 ${count} 颗背景`, icon: "none" });
    } else {
      uni.showToast({ title: "未检测到纯色背景", icon: "none" });
    }
    return;
  }
  if (tool === "denoise") {
    denoiseStrength.value = 50;
    showDenoise.value = true;
    return;
  }
  if (tool === "merge") {
    mergeStrength.value = 50;
    showMerge.value = true;
    return;
  }
  if (tool === "matting") {
    confirmAndUnlock().then((unlocked) => {
      if (unlocked) {
        uni.showToast({ title: "AI 抠图功能即将上线", icon: "none" });
      }
    });
    return;
  }
  activeTool.value = activeTool.value === tool ? "" : tool;
  lastDrawKey.value = "";
}

function onPaletteOpen(): void {
  // drawer opened
}

function onPaletteClose(): void {
  pendingCell.value = null;
}

function onSave(): void {
  store.saveProject(true);
}

function openSettings(): void {
  settingsWidth.value = store.width;
  settingsHeight.value = store.height;
  showSettings.value = true;
}

function closeSettings(): void {
  showSettings.value = false;
}

function onSettingsConfirm(): void {
  const w = Math.max(10, Math.min(200, Math.round(settingsWidth.value)));
  const h = Math.max(10, Math.min(200, Math.round(settingsHeight.value)));

  if (w < store.width || h < store.height) {
    uni.showModal({
      title: "缩小画布",
      content: "边缘内容可能丢失，是否继续？",
      success: (res) => {
        if (res.confirm) {
          store.resizeGrid(w, h);
          showSettings.value = false;
        }
      },
    });
  } else {
    store.resizeGrid(w, h);
    showSettings.value = false;
  }
}

function onDenoiseConfirm(): void {
  const count = store.denoise(denoiseStrength.value);
  if (count > 0) {
    uni.showToast({ title: `已清理 ${count} 颗噪点`, icon: "none" });
  } else {
    uni.showToast({ title: "未检测到噪点", icon: "none" });
  }
  showDenoise.value = false;
}

function closeDenoise(): void {
  showDenoise.value = false;
}

function onDenoiseSliderChange(e: { detail: { value: number } }): void {
  denoiseStrength.value = e.detail.value;
}

function onMergeConfirm(): void {
  const count = store.merge(mergeStrength.value);
  if (count > 0) {
    uni.showToast({ title: `已融合 ${count} 颗色块`, icon: "none" });
  } else {
    uni.showToast({ title: "未检测到需要融合的色块", icon: "none" });
  }
  showMerge.value = false;
}

function closeMerge(): void {
  showMerge.value = false;
}

function onMergeSliderChange(e: { detail: { value: number } }): void {
  mergeStrength.value = e.detail.value;
}
</script>

<template>
  <view class="min-h-screen bg-bg flex flex-col">
    <view class="flex items-center justify-between px-page-x py-2 bg-card border-b border-border-light">
      <text class="text-base font-bold text-text-main truncate flex-1 mr-4">{{ store.name || "图纸" }}</text>
      <view class="flex gap-3 items-center">
        <view
          class="px-4 py-1.5 rounded-btn text-sm"
          :class="store.canUndo ? 'bg-bg text-text-main' : 'bg-bg/50 text-text-sub/50'"
          @tap="store.canUndo && store.undo()"
        >
          <text>撤销</text>
        </view>
        <view
          class="px-4 py-1.5 rounded-btn text-sm"
          :class="store.canRedo ? 'bg-bg text-text-main' : 'bg-bg/50 text-text-sub/50'"
          @tap="store.canRedo && store.redo()"
        >
          <text>重做</text>
        </view>
        <view
          class="px-4 py-1.5 rounded-btn text-sm"
          :class="store.saving ? 'bg-primary/50 text-white' : 'bg-primary text-white'"
          @tap="onSave"
        >
          <text>{{ store.saving ? "保存中..." : "保存" }}</text>
        </view>
        <view class="px-3 py-1.5 rounded-btn text-sm bg-bg text-text-main" @tap="openSettings">
          <text>⚙️</text>
        </view>
      </view>
    </view>

    <view class="flex-1 overflow-hidden">
      <CanvasViewport>
        <BeadGrid
          :grid-data="store.gridData"
          :color-map="store.colorMap"
          :drawing="!!activeTool"
          @cell-click="onCellClick"
          @cell-draw="onCellDraw"
        />
      </CanvasViewport>
    </view>

    <view v-if="store.loading" class="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
      <text class="text-white text-sm">加载中...</text>
    </view>

    <ToolDrawer
      ref="drawerRef"
      :active-tool="activeTool"
      :current-color-id="currentColorId"
      :recent-colors="store.recentColors"
      :colors="store.colors"
      :color-map="store.colorMap"
      @tool-change="onToolChange"
      @color-select="onColorSelect"
      @palette-open="onPaletteOpen"
      @palette-close="onPaletteClose"
    />

    <view v-if="showSettings" class="fixed inset-0 z-50 flex items-center justify-center">
      <view class="absolute inset-0 bg-black/40" @tap="closeSettings" />
      <view class="relative bg-card rounded-panel p-5 mx-8 w-full max-w-sm shadow-lg">
        <text class="text-lg font-bold text-text-main mb-4 block">画板设置</text>

        <view class="mb-3">
          <text class="text-sm text-text-sub mb-1 block">宽度（10-200）</text>
          <input
            v-model="settingsWidth"
            type="number"
            class="bg-bg rounded-btn px-3 py-2 text-sm text-text-main w-full"
            :maxlength="3"
          />
        </view>

        <view class="mb-4">
          <text class="text-sm text-text-sub mb-1 block">高度（10-200）</text>
          <input
            v-model="settingsHeight"
            type="number"
            class="bg-bg rounded-btn px-3 py-2 text-sm text-text-main w-full"
            :maxlength="3"
          />
        </view>

        <view class="flex gap-3">
          <view class="flex-1 py-2 rounded-btn bg-bg text-center" @tap="closeSettings">
            <text class="text-sm text-text-sub">取消</text>
          </view>
          <view class="flex-1 py-2 rounded-btn bg-primary text-center" @tap="onSettingsConfirm">
            <text class="text-sm text-white">确认</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showDenoise" class="fixed inset-0 z-50 flex items-center justify-center">
      <view class="absolute inset-0 bg-black/40" @tap="closeDenoise" />
      <view class="relative bg-card rounded-panel p-5 mx-8 w-full max-w-sm shadow-lg">
        <text class="text-lg font-bold text-text-main mb-4 block">像素去噪</text>

        <view class="mb-4">
          <view class="flex justify-between items-center mb-2">
            <text class="text-sm text-text-sub">强度</text>
            <text class="text-sm text-text-main font-mono">{{ denoiseStrength }}</text>
          </view>
          <slider
            :value="denoiseStrength"
            :min="1"
            :max="100"
            :step="1"
            activeColor="#07C160"
            @change="onDenoiseSliderChange"
          />
        </view>

        <view class="flex gap-3">
          <view class="flex-1 py-2 rounded-btn bg-bg text-center" @tap="closeDenoise">
            <text class="text-sm text-text-sub">取消</text>
          </view>
          <view class="flex-1 py-2 rounded-btn bg-primary text-center" @tap="onDenoiseConfirm">
            <text class="text-sm text-white">确认</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showMerge" class="fixed inset-0 z-50 flex items-center justify-center">
      <view class="absolute inset-0 bg-black/40" @tap="closeMerge" />
      <view class="relative bg-card rounded-panel p-5 mx-8 w-full max-w-sm shadow-lg">
        <text class="text-lg font-bold text-text-main mb-4 block">色块融合</text>

        <view class="mb-4">
          <view class="flex justify-between items-center mb-2">
            <text class="text-sm text-text-sub">强度</text>
            <text class="text-sm text-text-main font-mono">{{ mergeStrength }}</text>
          </view>
          <slider
            :value="mergeStrength"
            :min="1"
            :max="100"
            :step="1"
            activeColor="#07C160"
            @change="onMergeSliderChange"
          />
        </view>

        <view class="flex gap-3">
          <view class="flex-1 py-2 rounded-btn bg-bg text-center" @tap="closeMerge">
            <text class="text-sm text-text-sub">取消</text>
          </view>
          <view class="flex-1 py-2 rounded-btn bg-primary text-center" @tap="onMergeConfirm">
            <text class="text-sm text-white">确认</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
