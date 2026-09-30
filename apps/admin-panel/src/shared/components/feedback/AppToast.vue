<script setup lang="ts">
import { useToast } from '../../composables/useToast';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-vue-next';

const { toasts, remove } = useToast();
</script>

<template>
  <div class="toast-container" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-card"
        :class="`toast-card--${toast.type}`"
      >
        <div class="toast-icon">
          <CheckCircle2 v-if="toast.type === 'success'" class="icon icon-success" />
          <AlertCircle v-else-if="toast.type === 'error'" class="icon icon-error" />
          <AlertTriangle v-else-if="toast.type === 'warning'" class="icon icon-warning" />
          <Info v-else class="icon icon-info" />
        </div>

        <div class="toast-content">
          <h4 v-if="toast.title" class="toast-title">{{ toast.title }}</h4>
          <p class="toast-message">{{ toast.message }}</p>
        </div>

        <button type="button" class="toast-close" @click="remove(toast.id)">
          <X class="close-icon" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 380px;
  width: calc(100% - 48px);
  pointer-events: none;
}

.toast-card {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background-color: #ffffff;
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-card);
}

.toast-card--success { border-left: 4px solid #10b981; }
.toast-card--error { border-left: 4px solid #ef4444; }
.toast-card--warning { border-left: 4px solid #f59e0b; }
.toast-card--info { border-left: 4px solid #6366f1; }

.toast-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.icon { width: 18px; height: 18px; }
.icon-success { color: #10b981; }
.icon-error { color: #ef4444; }
.icon-warning { color: #f59e0b; }
.icon-info { color: #6366f1; }

.toast-content {
  flex: 1;
}

.toast-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 2px;
}

.toast-message {
  font-size: 12.5px;
  color: var(--text-muted);
  line-height: 1.4;
}

.toast-close {
  padding: 2px;
  color: var(--text-subtle);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.toast-close:hover {
  color: var(--text-main);
  background-color: #f1f5f9;
}
.close-icon { width: 14px; height: 14px; }

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
