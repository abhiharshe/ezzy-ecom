<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue?: string | number;
  label?: string;
  placeholder?: string;
  type?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  labelClassName?: string;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '',
  type: 'text',
  error: '',
  hint: '',
  disabled: false,
  readonly: false,
  required: false,
  id: () => `input-${Math.random().toString(36).substring(2, 9)}`,
  size: 'md',
  labelClassName: '',
  className: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
}>();

const inputHeight = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8.5 text-xs px-3';
    case 'md':
      return 'h-10 text-sm px-3.5';
    case 'lg':
      return 'h-11.5 text-base px-4';
    default:
      return 'h-10 text-sm px-3.5';
  }
});
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <!-- Optional Label -->
    <div v-if="label || $slots['label-action']" class="flex items-center justify-between">
      <label
        v-if="label"
        :for="id"
        :class="['text-xs font-bold text-slate-800 flex items-center gap-1 select-none', labelClassName]"
      >
        {{ label }}
        <span v-if="required" class="text-red-500 font-bold">*</span>
      </label>
      <slot name="label-action" />
    </div>

    <!-- Input Box Container -->
    <div class="relative flex items-center w-full">
      <!-- Leading Icon -->
      <div
        v-if="$slots.leading"
        class="absolute left-3 flex items-center pointer-events-none text-slate-400 z-10"
      >
        <slot name="leading" />
      </div>

      <!-- Native Input -->
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :class="[
          'w-full bg-white border rounded-lg font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-none',
          'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
          error
            ? 'border-red-500 bg-red-50/20 focus:ring-red-500/20 focus:border-red-500'
            : 'border-slate-200 hover:border-slate-300',
          disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200 select-none' : '',
          $slots.leading ? 'pl-9.5' : '',
          $slots.trailing ? 'pr-9.5' : '',
          inputHeight,
          className,
        ]"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="emit('blur', $event)"
      />

      <!-- Trailing Icon -->
      <div
        v-if="$slots.trailing"
        class="absolute right-3 flex items-center text-slate-400"
      >
        <slot name="trailing" />
      </div>
    </div>

    <!-- Error or Hint Message -->
    <p v-if="error" class="text-xs font-semibold text-red-600 animate-fade-in">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-xs text-slate-500">
      {{ hint }}
    </p>
  </div>
</template>
