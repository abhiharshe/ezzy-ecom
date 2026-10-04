<script setup lang="ts">
import AppTrendPill from './AppTrendPill.vue';

interface Props {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral' | 'warning';
}

withDefaults(defineProps<Props>(), {
  subValue: '',
  trend: '',
  trendType: 'neutral',
});
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-xl p-4.5 flex flex-col gap-3 shadow-xs hover:border-slate-300 transition-all">
    <!-- Header: Title & Icon -->
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
        {{ title }}
      </span>
      <div v-if="$slots.icon" class="shrink-0">
        <slot name="icon" />
      </div>
    </div>

    <!-- Value Row -->
    <div class="flex items-baseline justify-between gap-2">
      <div class="flex items-baseline gap-2">
        <span class="text-2xl font-extrabold text-slate-900 tracking-tight">
          {{ value }}
        </span>
        <span v-if="subValue" class="text-xs font-medium text-slate-500">
          {{ subValue }}
        </span>
      </div>

      <!-- Trend Pill -->
      <AppTrendPill
        v-if="trend"
        :value="trend"
        :trend="trendType"
      />
    </div>
  </div>
</template>
