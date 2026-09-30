<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'purple' | 'blue' | 'yellow' | 'coral' | 'green' | 'red' | 'neutral';
  size?: 'sm' | 'md';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'md',
});

const classes = computed(() => {
  return ['app-badge', `app-badge--${props.variant}`, `app-badge--${props.size}`];
});
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>

<style scoped>
.app-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: var(--radius-full);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.app-badge--sm {
  padding: 3px 8px;
  font-size: 11px;
}

.app-badge--md {
  padding: 4px 10px;
  font-size: 11.5px;
}

/* Color Variants */
.app-badge--purple {
  background-color: #f3e8ff;
  color: #7e22ce;
}

.app-badge--blue {
  background-color: #eff6ff;
  color: #2563eb;
}

.app-badge--yellow {
  background-color: #fef3c7;
  color: #d97706;
}

.app-badge--coral {
  background-color: #ffe4e6;
  color: #e11d48;
}

.app-badge--green {
  background-color: #ecfdf5;
  color: #059669;
}

.app-badge--red {
  background-color: #fef2f2;
  color: #dc2626;
}

.app-badge--neutral {
  background-color: #f1f5f9;
  color: #475569;
}
</style>
