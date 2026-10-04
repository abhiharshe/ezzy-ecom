<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away' | null;
}

const props = withDefaults(defineProps<Props>(), {
  name: 'Admin',
  src: '',
  size: 'md',
  status: null,
});

const initials = computed(() => {
  if (!props.name) return 'A';
  const parts = props.name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'w-6 h-6 text-[10px]';
    case 'sm':
      return 'w-8 h-8 text-xs';
    case 'md':
      return 'w-9.5 h-9.5 text-xs';
    case 'lg':
      return 'w-12 h-12 text-sm';
    case 'xl':
      return 'w-16 h-16 text-lg';
    default:
      return 'w-9.5 h-9.5 text-xs';
  }
});

const statusColor = computed(() => {
  switch (props.status) {
    case 'online':
      return 'bg-emerald-500';
    case 'busy':
      return 'bg-red-500';
    case 'away':
      return 'bg-amber-500';
    case 'offline':
    default:
      return 'bg-slate-400';
  }
});
</script>

<template>
  <div class="relative inline-flex shrink-0 select-none">
    <!-- Image Avatar -->
    <img
      v-if="src"
      :src="src"
      :alt="name"
      :class="['rounded-full object-cover border border-slate-200', sizeClasses]"
    />

    <!-- Initials Avatar -->
    <div
      v-else
      :class="[
        'rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold flex items-center justify-center tracking-wider shadow-xs',
        sizeClasses,
      ]"
    >
      {{ initials }}
    </div>

    <!-- Status Indicator Dot -->
    <span
      v-if="status"
      :class="[
        'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
        statusColor,
        size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
      ]"
    ></span>
  </div>
</template>
