<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  gridData: string[][];
  colorMap: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "cell-click", row: number, col: number): void;
}>();

const width = computed(() => {
  if (props.gridData.length === 0) return 0;
  return props.gridData[0].length;
});

const gridStyle = computed(() => ({
  display: "grid",
  gap: "1px",
  backgroundColor: "#ECECEC",
  gridTemplateColumns: `repeat(${width.value}, 1fr)`,
}));

function getCellColor(colorId: string): string {
  return props.colorMap[colorId] || "#F6F6F6";
}
</script>

<template>
  <view v-if="gridData.length > 0" :style="gridStyle">
    <view
      v-for="(row, rowIdx) in gridData"
      :key="rowIdx"
      class="contents"
    >
      <view
        v-for="(colorId, colIdx) in row"
        :key="`${rowIdx}-${colIdx}`"
        class="aspect-square"
        :style="{ backgroundColor: getCellColor(colorId) }"
        @tap="emit('cell-click', rowIdx, colIdx)"
      />
    </view>
  </view>
  <view v-else class="flex items-center justify-center py-10">
    <text class="text-text-sub text-sm">暂无数据</text>
  </view>
</template>
