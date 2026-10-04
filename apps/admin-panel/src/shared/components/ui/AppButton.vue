<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
  fullWidth: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-xs hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md active:scale-[0.99] border border-transparent';
    case 'secondary':
      return 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 active:bg-indigo-200 border border-indigo-100';
    case 'outline':
      return 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-xs active:bg-slate-100';
    case 'ghost':
      return 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent';
    case 'danger':
      return 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 active:bg-red-200';
    case 'subtle':
      return 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-transparent';
    default:
      return 'bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent';
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'h-7 px-2.5 text-xs gap-1.5 rounded-md';
    case 'sm':
      return 'h-8.5 px-3 text-xs gap-2 rounded-lg';
    case 'md':
      return 'h-10 px-4 text-sm gap-2 rounded-lg';
    case 'lg':
      return 'h-11.5 px-5 text-base gap-2.5 rounded-xl';
    default:
      return 'h-10 px-4 text-sm gap-2 rounded-lg';
  }
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex flex-row items-center justify-center font-semibold select-none transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 whitespace-nowrap',
      variantClasses,
      sizeClasses,
      fullWidth ? 'w-full' : '',
    ]"
    @click="emit('click', $event)"
  >
    <!-- Loading Spinner -->
    <svg
      v-if="loading"
      class="animate-spin -ml-0.5 h-4 w-4 text-current shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>

    <!-- Leading Icon -->
    <span v-if="$slots.icon && !loading" class="inline-flex shrink-0 items-center justify-center">
      <slot name="icon" />
    </span>

    <!-- Button Text / Default Slot Content -->
    <span class="inline-flex flex-row items-center justify-center gap-1.5 shrink-0">
      <slot />
    </span>

    <!-- Trailing Icon -->
    <span v-if="$slots['icon-right'] && !loading" class="inline-flex shrink-0 items-center justify-center">
      <slot name="icon-right" />
    </span>
  </button>
</template>
