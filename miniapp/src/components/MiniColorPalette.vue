<script setup lang="ts">
import { computed } from "vue";

interface BeadColor {
  id: string;
  hexCode: string;
  code: string;
  name: string | null;
}

const props = defineProps<{
  recentColors: string[];
  colors: BeadColor[];
  colorMap: Record<string, string>;
  selectedColorId: string;
}>();

const emit = defineEmits<{
  (e: "select", colorId: string): void;
  (e: "close"): void;
}>();

const recentList = computed<BeadColor[]>(() =>
  props.recentColors
    .map((id) => {
      const hex = props.colorMap[id];
      if (!hex) return null;
      return { id, hexCode: hex, code: id.split("_").pop() ?? id, name: null };
    })
    .filter((c): c is BeadColor => c !== null)
);

const brandList = computed<BeadColor[]>(() => props.colors.slice(0, 20));

function onSelect(colorId: string): void {
  emit("select", colorId);
}
</script>

<template>
  <view class="fixed inset-0 z-40 flex flex-col justify-end">
    <view class="absolute inset-0 bg-black/20" @tap="emit('close')" />
    <view class="relative bg-card rounded-t-panel px-page-x py-4 pb-6 shadow-lg">
      <view class="flex justify-between items-center mb-3">
        <text class="text-sm font-bold text-text-main">选择颜色</text>
        <text class="text-text-sub text-lg" @tap="emit('close')">✕</text>
      </view>

      <view v-if="recentList.length > 0" class="mb-3">
        <text class="text-xs text-text-sub mb-2 block">最近使用</text>
        <view class="flex gap-3">
          <view
            v-for="c in recentList"
            :key="'r-' + c.id"
            class="w-8 h-8 rounded-full border-2 shrink-0"
            :style="{ backgroundColor: c.hexCode, borderColor: selectedColorId === c.id ? '#07C160' : '#ECECEC' }"
            @tap="onSelect(c.id)"
          />
        </view>
      </view>

      <text class="text-xs text-text-sub mb-2 block">色卡</text>
      <view class="grid grid-cols-8 gap-3">
        <view
          v-for="c in brandList"
          :key="c.id"
          class="w-8 h-8 rounded-full border-2 mx-auto"
          :style="{ backgroundColor: c.hexCode, borderColor: selectedColorId === c.id ? '#07C160' : '#ECECEC' }"
          @tap="onSelect(c.id)"
        />
      </view>
    </view>
  </view>
</template>
