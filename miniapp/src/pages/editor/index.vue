<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useProjectStore } from "../../store/project";
import CanvasViewport from "../../components/CanvasViewport.vue";
import BeadGrid from "../../components/BeadGrid.vue";
import MiniColorPalette from "../../components/MiniColorPalette.vue";
import ToolBar from "../../components/ToolBar.vue";

const store = useProjectStore();

const showPalette = ref(false);
const selectedRow = ref(0);
const selectedCol = ref(0);
const currentColorId = ref("");
const activeTool = ref("");
const lastDrawKey = ref("");

let loadLock = false;

const DRAW_THROTTLE_MS = 16;
let lastDrawTime = 0;

onLoad((options) => {
  const projectId = options?.projectId;
  if (projectId) {
    store.loadProject(projectId);
  }
});

function onCellClick(row: number, col: number): void {
  if (loadLock) return;
  if (activeTool.value) return;
  selectedRow.value = row;
  selectedCol.value = col;
  currentColorId.value = store.gridData[row]?.[col] ?? "";
  showPalette.value = true;
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
  loadLock = true;
  currentColorId.value = colorId;
  if (activeTool.value === "brush") {
    store.updateCell(selectedRow.value, selectedCol.value, colorId);
  }
  showPalette.value = false;
  setTimeout(() => { loadLock = false; }, 100);
}

function onClosePalette(): void {
  showPalette.value = false;
}

function onToolChange(tool: string): void {
  activeTool.value = activeTool.value === tool ? "" : tool;
  lastDrawKey.value = "";
}
</script>

<template>
  <view class="min-h-screen bg-bg flex flex-col">
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

    <ToolBar :active-tool="activeTool" @tool-change="onToolChange" />

    <MiniColorPalette
      v-if="showPalette"
      :recent-colors="store.recentColors"
      :colors="store.colors"
      :color-map="store.colorMap"
      :selected-color-id="currentColorId"
      @select="onColorSelect"
      @close="onClosePalette"
    />
  </view>
</template>
