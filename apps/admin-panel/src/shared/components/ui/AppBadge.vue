<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?:
    | 'purple'
    | 'blue'
    | 'green'
    | 'amber'
    | 'red'
    | 'neutral'
    | 'coral'
    | 'yellow'
    | 'cyan'
    | 'pink';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'sm',
  dot: false,
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'purple':
      return 'bg-purple-50 text-purple-700 border-purple-200/80';
    case 'blue':
      return 'bg-blue-50 text-blue-700 border-blue-200/80';
    case 'green':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    case 'amber':
    case 'yellow':
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    case 'red':
      return 'bg-red-50 text-red-700 border-red-200/80';
    case 'coral':
      return 'bg-orange-50 text-orange-700 border-orange-200/80';
    case 'cyan':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200/80';
    case 'pink':
      return 'bg-pink-50 text-pink-700 border-pink-200/80';
    case 'neutral':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
});

const dotColor = computed(() => {
  switch (props.variant) {
    case 'purple':
      return 'bg-purple-500';
    case 'blue':
      return 'bg-blue-500';
    case 'green':
      return 'bg-emerald-500';
    case 'amber':
    case 'yellow':
      return 'bg-amber-500';
    case 'red':
      return 'bg-red-500';
    case 'coral':
      return 'bg-orange-500';
    case 'cyan':
      return 'bg-cyan-500';
    case 'pink':
      return 'bg-pink-500';
    default:
      return 'bg-slate-500';
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'px-1.5 py-0.2 text-[10px] gap-1 rounded-md';
    case 'sm':
      return 'px-2 py-0.5 text-xs gap-1.5 rounded-md';
    case 'md':
      return 'px-2.5 py-1 text-xs gap-1.5 rounded-lg font-bold';
    default:
      return 'px-2 py-0.5 text-xs gap-1.5 rounded-md';
  }
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center font-bold tracking-tight border select-none leading-none',
      variantClasses,
      sizeClasses,
    ]"
  >
    <span
      v-if="dot"
      :class="['w-1.5 h-1.5 rounded-full shrink-0', dotColor]"
    ></span>
    <slot />
  </span>
</template>
