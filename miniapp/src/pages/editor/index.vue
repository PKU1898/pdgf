<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useProjectStore } from "../../store/project";
import CanvasViewport from "../../components/CanvasViewport.vue";
import BeadGrid from "../../components/BeadGrid.vue";
import MiniColorPalette from "../../components/MiniColorPalette.vue";

const store = useProjectStore();

const showPalette = ref(false);
const selectedRow = ref(0);
const selectedCol = ref(0);
const currentColorId = ref("");

let loadLock = false;

onLoad((options) => {
  const projectId = options?.projectId;
  if (projectId) {
    store.loadProject(projectId);
  }
});

function onCellClick(row: number, col: number): void {
  if (loadLock) return;
  selectedRow.value = row;
  selectedCol.value = col;
  currentColorId.value = store.gridData[row]?.[col] ?? "";
  showPalette.value = true;
}

function onColorSelect(colorId: string): void {
  loadLock = true;
  store.updateCell(selectedRow.value, selectedCol.value, colorId);
  currentColorId.value = colorId;
  showPalette.value = false;
  setTimeout(() => { loadLock = false; }, 100);
}

function onClosePalette(): void {
  showPalette.value = false;
}
</script>

<template>
  <view class="min-h-screen bg-bg flex flex-col">
    <view class="flex-1 overflow-hidden">
      <CanvasViewport>
        <BeadGrid
          :grid-data="store.gridData"
          :color-map="store.colorMap"
          @cell-click="onCellClick"
        />
      </CanvasViewport>
    </view>

    <view v-if="store.loading" class="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
      <text class="text-white text-sm">加载中...</text>
    </view>

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
