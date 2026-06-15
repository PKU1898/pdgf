<script setup lang="ts">
import { ref } from "vue";

const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;

let startDistance = 0;
let startScale = 1;
let startX = 0;
let startY = 0;
let startTranslateX = 0;
let startTranslateY = 0;
let isPinching = false;

function getDistance(t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }): number {
  const dx = t2.clientX - t1.clientX;
  const dy = t2.clientY - t1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function clampScale(val: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, val));
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    isPinching = true;
    startDistance = getDistance(e.touches[0], e.touches[1]);
    startScale = scale.value;
  } else if (e.touches.length === 1) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTranslateX = translateX.value;
    startTranslateY = translateY.value;
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2 && isPinching) {
    const currentDistance = getDistance(e.touches[0], e.touches[1]);
    const ratio = currentDistance / startDistance;
    scale.value = clampScale(startScale * ratio);
  } else if (e.touches.length === 1 && !isPinching) {
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    translateX.value = startTranslateX + dx;
    translateY.value = startTranslateY + dy;
  }
}

function onTouchEnd(e: TouchEvent) {
  if (e.touches.length < 2) {
    isPinching = false;
  }
}
</script>

<template>
  <view
    class="overflow-hidden w-full h-full"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <view
      class="origin-center"
      :style="{
        transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        transition: isPinching ? 'none' : 'transform 0.1s ease-out',
      }"
    >
      <slot />
    </view>
  </view>
</template>
