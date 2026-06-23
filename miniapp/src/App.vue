<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { silentLogin } from "./api/request";
import { initRewardAd } from "./utils/rewardAd";
import LoginModal from "./components/LoginModal/LoginModal.vue";

onLaunch(() => {
  silentLogin().catch((err) => {
    console.error("[onLaunch] silent login failed:", err);
  });
  initRewardAd();
});

onShow(() => {
  console.log("App Show");
});

onHide(() => {
  console.log("App Hide");
});
</script>

<template>
  <LoginModal />
</template>

<style></style>
