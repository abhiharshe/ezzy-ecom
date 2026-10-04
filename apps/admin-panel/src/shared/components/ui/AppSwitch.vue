<script setup lang="ts">
interface Props {
  modelValue?: boolean;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
}

withDefaults(defineProps<Props>(), {
  modelValue: false,
  label: '',
  sublabel: '',
  disabled: false,
  size: 'md',
  id: () => `switch-${Math.random().toString(36).substring(2, 9)}`,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'change', value: boolean): void;
}>();

const toggle = () => {
  // input native change handles it
};
</script>

<template>
  <label
    :for="id"
    :class="[
      'inline-flex items-center gap-3 select-none',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    ]"
  >
    <div class="relative inline-flex items-center">
      <input
        :id="id"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        class="sr-only peer"
        @change="
          emit('update:modelValue', ($event.target as HTMLInputElement).checked);
          emit('change', ($event.target as HTMLInputElement).checked);
        "
      />
      <!-- Track -->
      <div
        :class="[
          'rounded-full transition-colors duration-200 ease-in-out bg-slate-200 peer-checked:bg-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500/30',
          size === 'sm' ? 'w-8 h-4.5' : size === 'lg' ? 'w-12 h-7' : 'w-10 h-5.5',
        ]"
      ></div>

      <!-- Thumb -->
      <div
        :class="[
          'absolute left-0.5 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out',
          size === 'sm'
            ? 'w-3.5 h-3.5 peer-checked:translate-x-3.5'
            : size === 'lg'
            ? 'w-6 h-6 peer-checked:translate-x-5'
            : 'w-4.5 h-4.5 peer-checked:translate-x-4.5',
        ]"
      ></div>
    </div>

    <div v-if="label || sublabel" class="flex flex-col">
      <span v-if="label" class="text-xs font-semibold text-slate-800">
        {{ label }}
      </span>
      <span v-if="sublabel" class="text-xs text-slate-500">
        {{ sublabel }}
      </span>
    </div>
  </label>
</template>
