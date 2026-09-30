<script setup lang="ts">
import { computed } from 'vue';
import AppTrendPill from './AppTrendPill.vue';

interface Props {
  title: string;
  value: string | number;
  trendValue?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  trendContext?: string;
  customSubtitle?: string;
  iconBgColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  trendValue: '',
  trendDirection: 'up',
  trendContext: '',
  customSubtitle: '',
  iconBgColor: '#f1f5f9',
});

const hasTrend = computed(() => !!props.trendValue);
</script>

<template>
  <div class="stat-card">
    <div class="stat-header">
      <div class="icon-box" :style="{ backgroundColor: iconBgColor }">
        <slot name="icon" />
      </div>
      <span class="stat-title">{{ title }}</span>
    </div>

    <div class="stat-body">
      <span class="stat-value">{{ value }}</span>
    </div>

    <div class="stat-footer">
      <AppTrendPill
        v-if="hasTrend"
        :value="trendValue"
        :direction="trendDirection"
        :context="trendContext"
        size="sm"
      />
      <span v-else-if="customSubtitle" class="custom-subtitle">
        {{ customSubtitle }}
      </span>
      <slot name="footer-extra" />
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background-color: #ffffff;
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  box-shadow: var(--shadow-card);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--text-main);
}

.stat-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.stat-body {
  display: flex;
  align-items: baseline;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.stat-footer {
  display: flex;
  align-items: center;
}

.custom-subtitle {
  font-size: 12px;
  color: var(--text-subtle);
  font-weight: 500;
}
</style>
