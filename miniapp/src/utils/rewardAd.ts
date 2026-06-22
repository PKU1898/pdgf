/**
 * 微信激励视频广告工具
 *
 * 管理广告初始化、展示和解锁状态。
 */

const MATTING_UNLOCK_KEY = "ad_matting_unlocked";

let rewardedVideoAd: WechatMiniprogram.RewardedVideoAd | null = null;

export function initRewardAd(): void {
  try {
    rewardedVideoAd = wx.createRewardedVideoAd({
      adUnitId: "adunit_matting",
    });

    rewardedVideoAd.onError((err) => {
      console.error("[rewardAd] load error:", err);
    });
  } catch (err: unknown) {
    console.error("[rewardAd] init failed:", err);
  }
}

export function isMattingUnlocked(): boolean {
  try {
    return uni.getStorageSync(MATTING_UNLOCK_KEY) === true;
  } catch {
    return false;
  }
}

function setMattingUnlocked(): void {
  try {
    uni.setStorageSync(MATTING_UNLOCK_KEY, true);
  } catch {
    // ignore
  }
}

export function showRewardAd(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!rewardedVideoAd) {
      uni.showToast({ title: "广告加载失败", icon: "none" });
      resolve(false);
      return;
    }

    const onClose = (res: { isEnded: boolean }) => {
      rewardedVideoAd?.offClose(onClose);
      if (res && res.isEnded) {
        setMattingUnlocked();
        uni.showToast({ title: "解锁成功", icon: "success" });
        resolve(true);
      } else {
        uni.showToast({ title: "需看完广告才能解锁", icon: "none" });
        resolve(false);
      }
    };

    const onError = (err: unknown) => {
      rewardedVideoAd?.offError(onError);
      console.error("[rewardAd] show error:", err);
      uni.showToast({ title: "广告加载失败", icon: "none" });
      resolve(false);
    };

    rewardedVideoAd.onClose(onClose);
    rewardedVideoAd.onError(onError);

    rewardedVideoAd.show().catch(() => {
      rewardedVideoAd?.offClose(onClose);
      rewardedVideoAd?.offError(onError);
      uni.showToast({ title: "广告加载失败", icon: "none" });
      resolve(false);
    });
  });
}

export function confirmAndUnlock(): Promise<boolean> {
  if (isMattingUnlocked()) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    uni.showModal({
      title: "解锁 AI 抠图",
      content: "观看广告解锁抠图功能",
      confirmText: "观看",
      success: (res) => {
        if (res.confirm) {
          showRewardAd().then(resolve);
        } else {
          resolve(false);
        }
      },
    });
  });
}
