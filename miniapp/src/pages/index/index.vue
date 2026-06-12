<script setup lang="ts">
import { ref } from "vue";

interface RecentProject {
  id: string;
  name: string;
  updatedAt: string;
}

const recentProjects = ref<RecentProject[]>([]);

function onCreateProject() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const tempPath = res.tempFilePaths[0];
      uni.navigateTo({
        url: `/pages/editor/index?image=${encodeURIComponent(tempPath)}`,
      });
    },
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}天前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
</script>

<template>
  <view class="min-h-screen bg-bg font-sans text-text-main">
    <!-- 顶部栏 -->
    <view class="flex justify-between items-center px-page-x py-4 bg-card">
      <text class="text-xl font-bold">拼豆工坊</text>
      <text class="text-text-sub text-lg">⚙</text>
    </view>

    <!-- 核心创建区 -->
    <view class="px-page-x pt-block-y">
      <view
        class="w-full bg-card rounded-card shadow-sm border-2 border-dashed border-border-light flex flex-col items-center justify-center py-12 active:border-primary"
        @tap="onCreateProject"
      >
        <text class="text-5xl text-primary mb-2">+</text>
        <text class="text-primary font-medium">一键生成图纸</text>
      </view>
    </view>

    <!-- 最近编辑 -->
    <view class="px-page-x pt-block-y">
      <text class="text-lg font-bold mb-3 block">继续编辑</text>

      <!-- 有最近项目：横向滑动卡片 -->
      <scroll-view
        v-if="recentProjects.length > 0"
        scroll-x
        class="whitespace-nowrap"
      >
        <view
          v-for="project in recentProjects"
          :key="project.id"
          class="inline-block mr-4 w-40"
        >
          <view class="h-32 bg-card rounded-card shadow-sm mb-2" />
          <text class="font-medium text-sm truncate block">{{ project.name }}</text>
          <text class="text-xs text-text-sub">{{ formatTime(project.updatedAt) }}</text>
        </view>
      </scroll-view>

      <!-- 空状态 -->
      <view
        v-else
        class="flex flex-col items-center justify-center py-16"
      >
        <text class="text-6xl mb-4">🎨</text>
        <text class="text-text-sub text-sm">快来创建你的第一个作品吧</text>
      </view>
    </view>
  </view>
</template>
