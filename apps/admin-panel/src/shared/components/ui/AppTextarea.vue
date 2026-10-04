<script setup lang="ts">
interface Props {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  error?: string;
  hint?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  id?: string;
  labelClassName?: string;
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '',
  rows: 3,
  error: '',
  hint: '',
  disabled: false,
  readonly: false,
  required: false,
  id: () => `textarea-${Math.random().toString(36).substring(2, 9)}`,
  labelClassName: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
}>();
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <div v-if="label" class="flex items-center justify-between">
      <label :for="id" :class="['text-xs font-bold text-slate-800 flex items-center gap-1 select-none', labelClassName]">
        {{ label }}
        <span v-if="required" class="text-red-500 font-bold">*</span>
      </label>
    </div>

    <textarea
      :id="id"
      :rows="rows"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :class="[
        'w-full bg-white border rounded-lg p-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-none resize-y',
        'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
        error
          ? 'border-red-500 bg-red-50/20 focus:ring-red-500/20 focus:border-red-500'
          : 'border-slate-200 hover:border-slate-300',
        disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : '',
      ]"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @blur="emit('blur', $event)"
    />

    <p v-if="error" class="text-xs font-semibold text-red-600 animate-fade-in">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-xs text-slate-500">
      {{ hint }}
    </p>
  </div>
</template>
