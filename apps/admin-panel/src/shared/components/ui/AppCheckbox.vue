<script setup lang="ts">
import { Check } from 'lucide-vue-next';

interface Props {
  modelValue?: boolean;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
  id?: string;
  error?: string;
}

withDefaults(defineProps<Props>(), {
  modelValue: false,
  label: '',
  sublabel: '',
  disabled: false,
  id: () => `cb-${Math.random().toString(36).substring(2, 9)}`,
  error: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'change', value: boolean): void;
}>();

const toggle = () => {
  // handled by input
};
</script>

<template>
  <div class="flex flex-col gap-1">
    <label
      :for="id"
      :class="[
        'inline-flex items-start gap-2.5 select-none transition-opacity',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ]"
    >
      <div class="relative flex items-center justify-center mt-0.5">
        <input
          :id="id"
          type="checkbox"
          :checked="modelValue"
          :disabled="disabled"
          class="peer sr-only"
          @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked); emit('change', ($event.target as HTMLInputElement).checked)"
        />
        <div
          :class="[
            'w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all',
            'border-slate-300 bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500/30',
            error ? 'border-red-500' : 'hover:border-slate-400',
          ]"
        >
          <Check
            v-if="modelValue"
            class="w-3.5 h-3.5 text-white stroke-[3]"
          />
        </div>
      </div>

      <div v-if="label || sublabel" class="flex flex-col">
        <span v-if="label" class="text-xs font-semibold text-slate-800 leading-tight">
          {{ label }}
        </span>
        <span v-if="sublabel" class="text-xs text-slate-500 mt-0.5">
          {{ sublabel }}
        </span>
      </div>
    </label>

    <p v-if="error" class="text-xs font-semibold text-red-600 animate-fade-in pl-7">
      {{ error }}
    </p>
  </div>
</template>
