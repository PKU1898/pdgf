<script setup lang="ts">
import { ref, computed } from "vue";

interface BeadColor {
  id: string;
  hexCode: string;
  code: string;
  name: string | null;
}

const props = defineProps<{
  activeTool: string;
  currentColorId: string;
  recentColors: string[];
  colors: BeadColor[];
  colorMap: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "tool-change", tool: string): void;
  (e: "color-select", colorId: string): void;
  (e: "palette-open"): void;
  (e: "palette-close"): void;
}>();

const expanded = ref(false);

const tools = [
  { id: "brush", icon: "🖌️", label: "画笔" },
  { id: "eraser", icon: "🧹", label: "橡皮" },
  { id: "fill", icon: "💧", label: "填充" },
  { id: "removeBg", icon: "🖼️", label: "去背景" },
  { id: "denoise", icon: "✨", label: "去噪" },
  { id: "palette", icon: "🎨", label: "色板" },
] as const;

const recentList = computed<BeadColor[]>(() =>
  props.recentColors
    .map((id) => {
      const hex = props.colorMap[id];
      if (!hex) return null;
      return { id, hexCode: hex, code: id.split("_").pop() ?? id, name: null };
    })
    .filter((c): c is BeadColor => c !== null)
);

const brandList = computed<BeadColor[]>(() => props.colors.slice(0, 40));

function onToolTap(toolId: string): void {
  if (toolId === "palette") {
    expanded.value = !expanded.value;
    emit(expanded.value ? "palette-open" : "palette-close");
    return;
  }
  emit("tool-change", toolId);
}

function onSelectColor(colorId: string): void {
  emit("color-select", colorId);
}

function openPalette(): void {
  if (!expanded.value) {
    expanded.value = true;
    emit("palette-open");
  }
}

function closePalette(): void {
  if (expanded.value) {
    expanded.value = false;
    emit("palette-close");
  }
}

defineExpose({ openPalette, closePalette });
</script>

<template>
  <view class="fixed bottom-0 left-0 right-0 z-30">
    <view v-if="expanded" class="absolute bottom-full left-0 right-0 bg-black/20" style="height: 100vh;" @tap="closePalette" />

    <view class="relative bg-card rounded-t-panel shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <view v-if="expanded" class="px-page-x pt-4 pb-2 max-h-[40vh] overflow-y-auto">
        <view class="flex justify-between items-center mb-3">
          <text class="text-sm font-bold text-text-main">选择颜色</text>
          <text class="text-text-sub text-lg" @tap="closePalette">✕</text>
        </view>

        <view v-if="recentList.length > 0" class="mb-3">
          <text class="text-xs text-text-sub mb-2 block">最近使用</text>
          <view class="flex gap-3">
            <view
              v-for="c in recentList"
              :key="'r-' + c.id"
              class="w-8 h-8 rounded-full border-2 shrink-0"
              :style="{ backgroundColor: c.hexCode, borderColor: currentColorId === c.id ? '#07C160' : '#ECECEC' }"
              @tap="onSelectColor(c.id)"
            />
          </view>
        </view>

        <text class="text-xs text-text-sub mb-2 block">色卡</text>
        <view class="grid grid-cols-8 gap-3">
          <view
            v-for="c in brandList"
            :key="c.id"
            class="w-8 h-8 rounded-full border-2 mx-auto"
            :style="{ backgroundColor: c.hexCode, borderColor: currentColorId === c.id ? '#07C160' : '#ECECEC' }"
            @tap="onSelectColor(c.id)"
          />
        </view>
      </view>

      <view class="flex items-center justify-around py-3 px-page-x border-t border-border-light">
        <view
          v-for="tool in tools"
          :key="tool.id"
          class="flex flex-col items-center gap-1 px-4 py-1 rounded-btn"
          :class="activeTool === tool.id || (tool.id === 'palette' && expanded) ? 'text-primary' : 'text-text-sub'"
          @tap="onToolTap(tool.id)"
        >
          <text class="text-xl">{{ tool.icon }}</text>
          <text class="text-xs">{{ tool.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>
