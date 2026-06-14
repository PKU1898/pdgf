import { useAuthStore } from "../store/auth";

const BASE_URL = "https://pdgf-server.onrender.com/api";

interface RequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: Record<string, unknown>;
  header?: Record<string, string>;
}

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export function request<T = unknown>(options: RequestOptions): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    const authStore = useAuthStore();
    const header: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.header,
    };

    if (authStore.token) {
      header["Authorization"] = `Bearer ${authStore.token}`;
    }

    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || "GET",
      data: options.data,
      header,
      success: (res) => {
        const data = res.data as ApiResponse<T>;

        if (res.statusCode === 401) {
          authStore.clearAuth();
          silentLogin();
          reject(new Error("登录已过期，请重新登录"));
          return;
        }

        if (res.statusCode === 403 && data.code === 4031) {
          authStore.openLoginModal();
          reject(new Error("请先绑定手机号"));
          return;
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(data.message || "请求失败"));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || "网络错误"));
      },
    });
  });
}

export function silentLogin(): Promise<void> {
  return new Promise((resolve, reject) => {
    const authStore = useAuthStore();

    uni.login({
      provider: "weixin",
      success: (loginRes) => {
        request<{ token: string; isPhoneVerified: boolean; user: unknown }>({
          url: "/auth/silent-login",
          method: "POST",
          data: { code: loginRes.code },
        })
          .then((res) => {
            authStore.setToken(res.data.token, res.data.isPhoneVerified);
            if (res.data.user) {
              authStore.setUser(res.data.user as Parameters<typeof authStore.setUser>[0]);
            }
            if (!res.data.isPhoneVerified) {
              authStore.openLoginModal();
            }
            resolve();
          })
          .catch((err) => {
            console.error("[silent-login]", err);
            reject(err);
          });
      },
      fail: (err) => {
        console.error("[wx.login]", err);
        reject(new Error("微信登录失败"));
      },
    });
  });
}

export function uploadFile<T = unknown>(options: {
  url: string;
  filePath: string;
  name?: string;
  formData?: Record<string, string>;
}): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    const authStore = useAuthStore();

    uni.uploadFile({
      url: `${BASE_URL}${options.url}`,
      filePath: options.filePath,
      name: options.name || "file",
      formData: options.formData,
      header: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
      success: (res) => {
        if (res.statusCode === 401) {
          authStore.clearAuth();
          silentLogin();
          reject(new Error("登录已过期，请重新登录"));
          return;
        }

        const data = JSON.parse(res.data) as ApiResponse<T>;

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(data.message || "上传失败"));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || "网络错误"));
      },
    });
  });
}

export function bindPhone(phoneCode: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const authStore = useAuthStore();

    request<{ token: string; isPhoneVerified: boolean; user: unknown }>({
      url: "/auth/bind-phone",
      method: "POST",
      data: { phoneCode },
    })
      .then((res) => {
        authStore.setToken(res.data.token, res.data.isPhoneVerified);
        if (res.data.user) {
          authStore.setUser(res.data.user as Parameters<typeof authStore.setUser>[0]);
        }
        authStore.closeLoginModal();
        resolve();
      })
      .catch((err) => {
        console.error("[bind-phone]", err);
        reject(err);
      });
  });
}
