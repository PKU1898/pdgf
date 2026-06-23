<script setup lang="ts">
defineProps<{
  activeTool: string;
}>();

const emit = defineEmits<{
  (e: "tool-change", tool: string): void;
}>();

const tools = [
  { id: "brush", icon: "🖌️", label: "画笔" },
  { id: "eraser", icon: "🧹", label: "橡皮" },
] as const;
</script>

<template>
  <view class="fixed bottom-0 left-0 right-0 bg-card z-30" style="box-shadow: 0 -2px 10px rgba(0,0,0,0.05)">
    <view class="flex items-center justify-around py-3 px-page-x">
      <view
        v-for="tool in tools"
        :key="tool.id"
        class="flex flex-col items-center gap-1 px-4 py-1 rounded-btn"
        :class="activeTool === tool.id ? 'text-primary' : 'text-text-sub'"
        @tap="emit('tool-change', tool.id)"
      >
        <text class="text-xl">{{ tool.icon }}</text>
        <text class="text-xs">{{ tool.label }}</text>
      </view>
    </view>
  </view>
</template>
