<script setup lang="ts">
import { computed } from 'vue';
import { ArrowUpRight, ArrowDownRight, Minus, AlertTriangle } from 'lucide-vue-next';

interface Props {
  value: string;
  trend?: 'positive' | 'negative' | 'neutral' | 'warning';
}

const props = withDefaults(defineProps<Props>(), {
  trend: 'neutral',
});

const pillClasses = computed(() => {
  switch (props.trend) {
    case 'positive':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    case 'negative':
      return 'bg-red-50 text-red-700 border-red-200/80';
    case 'warning':
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    case 'neutral':
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border select-none leading-none',
      pillClasses,
    ]"
  >
    <ArrowUpRight v-if="trend === 'positive'" class="w-3 h-3 stroke-[2.5]" />
    <ArrowDownRight v-else-if="trend === 'negative'" class="w-3 h-3 stroke-[2.5]" />
    <AlertTriangle v-else-if="trend === 'warning'" class="w-3 h-3 stroke-[2.5]" />
    <Minus v-else class="w-3 h-3 stroke-[2.5]" />
    <span>{{ value }}</span>
  </span>
</template>
