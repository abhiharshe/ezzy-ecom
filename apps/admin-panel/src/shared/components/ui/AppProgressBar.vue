<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  value: number; // 0 to 100
  showLabel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  showLabel: true,
});

const progressColor = computed(() => {
  if (props.value >= 70) return '#059669'; // Emerald
  if (props.value >= 50) return '#d97706'; // Amber
  return '#dc2626'; // Red
});

const clampedWidth = computed(() => `${Math.min(100, Math.max(0, props.value))}%`);
</script>

<template>
  <div class="progress-wrapper">
    <div class="progress-track">
      <div
        class="progress-fill"
        :style="{ width: clampedWidth, backgroundColor: progressColor }"
      ></div>
    </div>
    <span v-if="showLabel" class="progress-label">{{ value }}%</span>
  </div>
</template>

<style scoped>
.progress-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 120px;
}

.progress-track {
  flex: 1;
  height: 6px;
  background-color: #f1f5f9;
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.progress-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-main);
  min-width: 32px;
  text-align: right;
}
</style>
