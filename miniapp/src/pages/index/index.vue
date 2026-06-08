<script setup lang="ts">
</script>

<template>
  <view class="min-h-screen bg-bg font-sans text-text-main flex flex-col">
    <!-- 顶部栏 -->
    <view class="flex justify-between items-center px-page-x py-4 bg-card">
      <text class="text-xl font-bold">拼豆工坊</text>
      <text class="text-text-sub">⚙️</text>
    </view>

    <!-- 核心创建区 -->
    <view class="flex-1 px-page-x pt-block-y">
      <view
        class="w-full bg-card rounded-card shadow-sm border-2 border-dashed border-border-light flex flex-col items-center justify-center py-12 text-primary"
      >
        <text class="text-4xl mb-2">+</text>
        <text class="font-medium">一键生成图纸</text>
      </view>

      <!-- 最近编辑 -->
      <view class="mt-block-y">
        <text class="text-lg font-bold mb-3">继续编辑</text>
        <text class="text-xs text-text-sub">快来创建你的第一个作品吧</text>
      </view>
    </view>
  </view>
</template>
