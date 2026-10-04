<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  value?: number;
  percentage?: number;
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'auto';
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  max: 100,
  variant: 'auto',
  size: 'sm',
  showLabel: false,
});

const calculatedPercent = computed(() => {
  const current = props.percentage !== undefined ? props.percentage : props.value;
  return Math.min(100, Math.max(0, (current / props.max) * 100));
});

const barColor = computed(() => {
  if (props.variant === 'auto') {
    if (calculatedPercent.value >= 70) return 'bg-emerald-500';
    if (calculatedPercent.value >= 50) return 'bg-indigo-600';
    if (calculatedPercent.value >= 30) return 'bg-amber-500';
    return 'bg-red-500';
  }
  switch (props.variant) {
    case 'success':
      return 'bg-emerald-500';
    case 'warning':
      return 'bg-amber-500';
    case 'danger':
      return 'bg-red-500';
    case 'primary':
    default:
      return 'bg-indigo-600';
  }
});

const heightClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'h-1.5';
    case 'md':
      return 'h-3';
    case 'sm':
    default:
      return 'h-2';
  }
});
</script>

<template>
  <div class="flex items-center gap-2 w-full">
    <div
      :class="[
        'flex-1 bg-slate-100 rounded-full overflow-hidden',
        heightClass,
      ]"
    >
      <div
        :class="[
          'h-full rounded-full transition-all duration-300 ease-out',
          barColor,
        ]"
        :style="{ width: `${calculatedPercent}%` }"
      ></div>
    </div>
    <span
      v-if="showLabel"
      class="text-xs font-bold text-slate-700 min-w-8 text-right"
    >
      {{ Math.round(calculatedPercent) }}%
    </span>
  </div>
</template>
