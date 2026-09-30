<script setup lang="ts">
import { computed } from 'vue';
import { ArrowUp, ArrowDown } from 'lucide-vue-next';

interface Props {
  value: string;
  direction?: 'up' | 'down' | 'neutral';
  context?: string;
  size?: 'sm' | 'md';
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'up',
  context: '',
  size: 'md',
});

const isUp = computed(() => props.direction === 'up');
const isDown = computed(() => props.direction === 'down');
</script>

<template>
  <div
    class="trend-pill"
    :class="[
      `trend-pill--${direction}`,
      `trend-pill--${size}`,
    ]"
  >
    <span class="icon-circle" :class="`icon-circle--${direction}`">
      <ArrowUp v-if="isUp" class="trend-icon" />
      <ArrowDown v-else-if="isDown" class="trend-icon" />
    </span>
    <span class="trend-value">{{ value }}</span>
    <span v-if="context" class="trend-context">{{ context }}</span>
  </div>
</template>

<style scoped>
.trend-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--radius-full);
  font-weight: 600;
  line-height: 1;
  width: fit-content;
}

.trend-pill--sm {
  padding: 2px 7px;
  font-size: 11px;
}

.trend-pill--md {
  padding: 4px 9px;
  font-size: 12px;
}

/* Up (Green) */
.trend-pill--up {
  background-color: #ecfdf5;
  color: #059669;
}
.icon-circle--up {
  background-color: #10b981;
  color: #ffffff;
}

/* Down (Red) */
.trend-pill--down {
  background-color: #fef2f2;
  color: #dc2626;
}
.icon-circle--down {
  background-color: #ef4444;
  color: #ffffff;
}

/* Neutral */
.trend-pill--neutral {
  background-color: #f1f5f9;
  color: #64748b;
}

.icon-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.trend-icon {
  width: 10px;
  height: 10px;
  stroke-width: 3;
}

.trend-value {
  font-weight: 700;
}

.trend-context {
  color: var(--text-muted);
  font-weight: 500;
  font-size: 11px;
  margin-left: 2px;
}
</style>
