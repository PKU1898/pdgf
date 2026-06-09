import { defineStore } from "pinia";
import { ref, computed } from "vue";

const TOKEN_KEY = "token";
const USER_KEY = "user";

interface UserInfo {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  phone: string | null;
  vipStatus: number;
  currentBrand: string;
}

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string>(uni.getStorageSync(TOKEN_KEY) || "");
  const user = ref<UserInfo | null>(
    (() => {
      try {
        const raw = uni.getStorageSync(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })()
  );
  const isPhoneVerified = ref<boolean>(!!user.value?.phone);
  const showLoginModal = ref<boolean>(false);

  const isLoggedIn = computed(() => !!token.value);

  function setToken(newToken: string, phoneVerified: boolean) {
    token.value = newToken;
    isPhoneVerified.value = phoneVerified;
    uni.setStorageSync(TOKEN_KEY, newToken);
  }

  function setUser(info: UserInfo) {
    user.value = info;
    uni.setStorageSync(USER_KEY, JSON.stringify(info));
  }

  function clearAuth() {
    token.value = "";
    user.value = null;
    isPhoneVerified.value = false;
    uni.removeStorageSync(TOKEN_KEY);
    uni.removeStorageSync(USER_KEY);
  }

  function openLoginModal() {
    showLoginModal.value = true;
  }

  function closeLoginModal() {
    showLoginModal.value = false;
  }

  return {
    token,
    user,
    isPhoneVerified,
    showLoginModal,
    isLoggedIn,
    setToken,
    setUser,
    clearAuth,
    openLoginModal,
    closeLoginModal,
  };
});
