<script setup lang="ts">
import { ref, onMounted } from "vue";
import { onPullDownRefresh } from "@dcloudio/uni-app";
import { request, uploadFile } from "../../api/request";

interface RecentProject {
  id: string;
  name: string;
  width: number;
  height: number;
  brand: string;
  updatedAt: string;
}

interface ProjectListData {
  list: RecentProject[];
  total: number;
  page: number;
  pageSize: number;
}

interface GroupedColors {
  [brand: string]: unknown[];
}

interface GenerateResult {
  projectId: string;
  gridData: string[][];
  imageUrl: string;
}

const recentProjects = ref<RecentProject[]>([]);
const showModal = ref(false);
const selectedImage = ref("");
const projName = ref("");
const projWidth = ref("29");
const projHeight = ref("29");
const selectedBrand = ref("mard");
const brandOptions = ref<{ value: string; label: string }[]>([]);
const generating = ref(false);

const brandLabels: Record<string, string> = {
  mard: "MARD",
  coco: "COCO",
};

function getBrandLabel(brand: string): string {
  if (brandLabels[brand]) return brandLabels[brand];
  if (brand.startsWith("custom_")) {
    const parts = brand.split("_");
    return parts.length >= 3 ? parts[2] : brand;
  }
  return brand;
}

async function loadRecentProjects() {
  try {
    const res = await request<ProjectListData>({ url: "/project/list?page=1" });
    recentProjects.value = res.data.list;
  } catch (err: unknown) {
    console.error("[home/loadProjects]", err);
  }
}

async function loadBrands() {
  try {
    const res = await request<GroupedColors>({ url: "/bead/colors" });
    brandOptions.value = Object.keys(res.data).map((brand) => ({
      value: brand,
      label: getBrandLabel(brand),
    }));
  } catch (err: unknown) {
    console.error("[home/loadBrands]", err);
  }
}

function openCreateModal() {
  showModal.value = true;
  projName.value = "";
  projWidth.value = "29";
  projHeight.value = "29";
  selectedBrand.value = "mard";
  selectedImage.value = "";
  loadBrands();
}

function closeCreateModal() {
  showModal.value = false;
}

function onPickImage() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      selectedImage.value = res.tempFilePaths[0];
    },
    fail: (err) => {
      if (err.errMsg?.includes("deny") || err.errMsg?.includes("auth")) {
        uni.showModal({
          title: "提示",
          content: "需要访问相册权限，请在设置中开启",
          confirmText: "去设置",
          success: (modalRes) => {
            if (modalRes.confirm) uni.openSetting({});
          },
        });
      }
    },
  });
}

function clampDimension(val: string): string {
  let num = parseInt(val, 10);
  if (isNaN(num) || num < 10) num = 10;
  if (num > 200) num = 200;
  return String(num);
}

async function onGenerate() {
  if (!selectedImage.value) {
    uni.showToast({ title: "请先选择图片", icon: "none" });
    return;
  }

  const width = clampDimension(projWidth.value);
  const height = clampDimension(projHeight.value);
  projWidth.value = width;
  projHeight.value = height;

  generating.value = true;
  try {
    const res = await uploadFile<GenerateResult>({
      url: "/project/generate",
      filePath: selectedImage.value,
      formData: {
        name: projName.value || "未命名图纸",
        width,
        height,
        brand: selectedBrand.value,
      },
    });

    closeCreateModal();
    uni.navigateTo({
      url: `/pages/editor/index?projectId=${res.data.projectId}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "生成失败，请重试";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    generating.value = false;
  }
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

onMounted(() => {
  loadRecentProjects();
});

onPullDownRefresh(async () => {
  await loadRecentProjects();
  uni.stopPullDownRefresh();
});

function openProject(projectId: string) {
  uni.navigateTo({
    url: `/pages/editor/index?projectId=${projectId}`,
  });
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
        @tap="openCreateModal"
      >
        <text class="text-5xl text-primary mb-2">+</text>
        <text class="text-primary font-medium">一键生成图纸</text>
      </view>
    </view>

    <!-- 最近编辑 -->
    <view class="px-page-x pt-block-y">
      <text class="text-lg font-bold mb-3 block">继续编辑</text>

      <scroll-view
        v-if="recentProjects.length > 0"
        scroll-x
        class="whitespace-nowrap"
      >
        <view
          v-for="project in recentProjects"
          :key="project.id"
          class="inline-block mr-4 w-40"
          @tap="openProject(project.id)"
        >
          <view class="h-32 bg-card rounded-card shadow-sm mb-2 flex items-center justify-center">
            <text class="text-4xl">🧩</text>
          </view>
          <text class="font-medium text-sm truncate block">{{ project.name }}</text>
          <text class="text-xs text-text-sub">{{ formatTime(project.updatedAt) }}</text>
        </view>
      </scroll-view>

      <view
        v-else
        class="flex flex-col items-center justify-center py-16"
      >
        <text class="text-6xl mb-4">🎨</text>
        <text class="text-text-sub text-sm">快来创建你的第一个作品吧</text>
      </view>
    </view>

    <!-- 创建图纸弹窗 -->
    <view v-if="showModal" class="fixed inset-0 z-50 flex flex-col justify-end">
      <!-- 遮罩 -->
      <view class="absolute inset-0 bg-black/40" @tap="closeCreateModal" />
      <!-- 弹窗内容 -->
      <view class="relative bg-card rounded-t-panel px-page-x py-6 pb-8 animate-slide-up">
        <!-- 标题栏 -->
        <view class="flex justify-between items-center mb-6">
          <text class="text-lg font-bold">创建图纸</text>
          <text class="text-text-sub text-xl" @tap="closeCreateModal">✕</text>
        </view>

        <!-- 选择图片 -->
        <view class="mb-5">
          <text class="text-sm text-text-sub mb-2 block">图片</text>
          <view
            v-if="!selectedImage"
            class="w-full h-32 bg-bg rounded-card border border-dashed border-border-light flex flex-col items-center justify-center active:border-primary"
            @tap="onPickImage"
          >
            <text class="text-3xl text-text-sub mb-1">+</text>
            <text class="text-xs text-text-sub">选择图片</text>
          </view>
          <view v-else class="relative">
            <image :src="selectedImage" mode="aspectFit" class="w-full h-32 rounded-card bg-bg" />
            <view class="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center" @tap="selectedImage = ''">
              <text class="text-white text-xs">✕</text>
            </view>
          </view>
        </view>

        <!-- 图纸名称 -->
        <view class="mb-5">
          <text class="text-sm text-text-sub mb-2 block">名称</text>
          <input
            v-model="projName"
            class="w-full h-10 px-3 bg-bg rounded-btn text-sm border border-border-light"
            placeholder="未命名图纸"
            :maxlength="30"
          />
        </view>

        <!-- 宽高 -->
        <view class="flex gap-3 mb-5">
          <view class="flex-1">
            <text class="text-sm text-text-sub mb-2 block">宽度</text>
            <input
              v-model="projWidth"
              type="number"
              class="w-full h-10 px-3 bg-bg rounded-btn text-sm border border-border-light text-center"
              placeholder="29"
              @blur="projWidth = clampDimension(projWidth)"
            />
          </view>
          <view class="flex items-end pb-2">
            <text class="text-text-sub">×</text>
          </view>
          <view class="flex-1">
            <text class="text-sm text-text-sub mb-2 block">高度</text>
            <input
              v-model="projHeight"
              type="number"
              class="w-full h-10 px-3 bg-bg rounded-btn text-sm border border-border-light text-center"
              placeholder="29"
              @blur="projHeight = clampDimension(projHeight)"
            />
          </view>
        </view>

        <!-- 品牌选择 -->
        <view class="mb-6">
          <text class="text-sm text-text-sub mb-2 block">品牌色卡</text>
          <scroll-view scroll-x class="whitespace-nowrap" :show-scrollbar="false">
            <view class="flex gap-2">
              <view
                v-for="option in brandOptions"
                :key="option.value"
                class="inline-flex items-center px-4 py-2 rounded-btn text-sm shrink-0"
                :class="selectedBrand === option.value ? 'bg-primary text-white' : 'bg-bg text-text-main'"
                @tap="selectedBrand = option.value"
              >
                {{ option.label }}
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 生成按钮 -->
        <view
          class="w-full h-11 bg-primary text-white rounded-btn flex items-center justify-center"
          :class="generating ? 'opacity-60' : 'active:opacity-80'"
          @tap="onGenerate"
        >
          <text class="text-white font-medium">{{ generating ? "生成中..." : "生成图纸" }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slide-up 300ms ease-out;
}
</style>
