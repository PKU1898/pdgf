<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useProjectStore } from "../../store/project";
import CanvasViewport from "../../components/CanvasViewport.vue";
import BeadGrid from "../../components/BeadGrid.vue";
import ToolDrawer from "../../components/ToolDrawer.vue";

const store = useProjectStore();

const currentColorId = ref("");
const activeTool = ref("");
const lastDrawKey = ref("");
const pendingCell = ref<{ row: number; col: number } | null>(null);

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
  </view>
</template>
