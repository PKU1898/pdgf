<script setup lang="ts">
import { useAuthStore } from "../../store/auth";
import { bindPhone } from "../../api/request";

interface PhoneNumberEvent {
  detail: {
    code?: string;
    errMsg: string;
  };
}

const authStore = useAuthStore();

function onGetPhoneNumber(e: PhoneNumberEvent) {
  const phoneCode = e.detail.code;
  if (!phoneCode) {
    uni.showToast({ title: "需要授权手机号才能保存数据", icon: "none" });
    return;
  }
  bindPhone(phoneCode).catch((err: Error) => {
    uni.showToast({ title: err.message || "绑定失败，请重试", icon: "none" });
  });
}

function onClose() {
  authStore.closeLoginModal();
}
</script>

<template>
  <view v-if="authStore.showLoginModal" class="modal-mask" @tap="onClose">
    <view class="modal-content" @tap.stop>
      <view class="modal-header">
        <text class="modal-title">绑定手机号</text>
        <text class="modal-close" @tap="onClose">×</text>
      </view>
      <view class="modal-body">
        <text class="modal-desc">绑定手机号后可保存和同步您的作品数据</text>
        <button
          class="phone-btn"
          open-type="getPhoneNumber"
          @getphonenumber="onGetPhoneNumber"
        >
          微信一键登录
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.modal-content {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 40rpx;
  animation: slideUp 300ms ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
}

.modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32rpx;
}

.modal-desc {
  font-size: 28rpx;
  color: #666;
  text-align: center;
}

.phone-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #07c160;
  color: #fff;
  font-size: 32rpx;
  border-radius: 44rpx;
  border: none;
}

.phone-btn::after {
  border: none;
}
</style>
