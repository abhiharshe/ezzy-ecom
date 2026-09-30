<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
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

const classes = computed(() => {
  return [
    'app-btn',
    `app-btn--${props.variant}`,
    `app-btn--${props.size}`,
    {
      'app-btn--loading': props.loading,
      'app-btn--disabled': props.disabled || props.loading,
      'app-btn--full': props.fullWidth,
    },
  ];
});
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    @click="emit('click', $event)"
  >
    <span v-if="loading" class="spinner" aria-hidden="true"></span>
    <span v-if="$slots.icon && !loading" class="icon-slot">
      <slot name="icon" />
    </span>
    <span class="label">
      <slot />
    </span>
    <span v-if="$slots['icon-right'] && !loading" class="icon-slot-right">
      <slot name="icon-right" />
    </span>
  </button>
</template>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 13.5px;
  line-height: 1;
  white-space: nowrap;
  user-select: none;
  border: 1px solid transparent;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.app-btn--full {
  width: 100%;
}

/* Sizes */
.app-btn--sm {
  padding: 7px 12px;
  font-size: 12.5px;
  border-radius: var(--radius-sm);
}

.app-btn--md {
  padding: 9px 16px;
  font-size: 13.5px;
}

.app-btn--lg {
  padding: 12px 20px;
  font-size: 14.5px;
  border-radius: var(--radius-lg);
}

/* Variants */
.app-btn--primary {
  background: var(--primary-gradient);
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(99, 102, 241, 0.2);
}
.app-btn--primary:hover:not(:disabled) {
  opacity: 0.94;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
  transform: translateY(-1px);
}

.app-btn--secondary {
  background-color: var(--primary-50);
  color: var(--primary-600);
}
.app-btn--secondary:hover:not(:disabled) {
  background-color: var(--primary-100);
}

.app-btn--outline {
  background-color: #ffffff;
  border-color: var(--border-card);
  color: var(--text-main);
  box-shadow: var(--shadow-sm);
}
.app-btn--outline:hover:not(:disabled) {
  background-color: var(--bg-surface-subtle);
  border-color: #cbd5e1;
}

.app-btn--ghost {
  background-color: transparent;
  color: var(--text-muted);
}
.app-btn--ghost:hover:not(:disabled) {
  background-color: var(--bg-surface-subtle);
  color: var(--text-main);
}

.app-btn--danger {
  background-color: var(--danger-bg);
  color: var(--danger-text);
  border-color: var(--danger-border);
}
.app-btn--danger:hover:not(:disabled) {
  background-color: #fee2e2;
}

.app-btn--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.icon-slot, .icon-slot-right {
  display: inline-flex;
  align-items: center;
}
</style>
