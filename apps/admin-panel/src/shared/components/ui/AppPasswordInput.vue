<script setup lang="ts">
import { ref } from 'vue';
import { Eye, EyeOff, Lock } from 'lucide-vue-next';

interface Props {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: 'Password',
  placeholder: '••••••••',
  error: '',
  hint: '',
  disabled: false,
  required: false,
  id: () => `pwd-${Math.random().toString(36).substring(2, 9)}`,
  size: 'md',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
}>();

const showPassword = ref(false);

const toggleVisibility = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <!-- Header with optional label-action -->
    <div class="flex items-center justify-between">
      <label
        v-if="label"
        :for="id"
        class="text-xs font-bold text-slate-800 flex items-center gap-1 select-none"
      >
        {{ label }}
        <span v-if="required" class="text-red-500 font-bold">*</span>
      </label>
      <slot name="label-action" />
    </div>

    <!-- Input Box -->
    <div class="relative flex items-center w-full">
      <div class="absolute left-3 flex items-center pointer-events-none text-slate-400">
        <Lock class="w-4 h-4" />
      </div>

      <input
        :id="id"
        :type="showPassword ? 'text' : 'password'"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :class="[
          'w-full bg-white border rounded-lg font-medium text-slate-900 placeholder:text-slate-400 pl-9.5 pr-10 transition-all outline-none',
          'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
          size === 'sm' ? 'h-8.5 text-xs' : size === 'lg' ? 'h-11.5 text-base' : 'h-10 text-sm',
          error
            ? 'border-red-500 bg-red-50/20 focus:ring-red-500/20 focus:border-red-500'
            : 'border-slate-200 hover:border-slate-300',
          disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed select-none' : '',
        ]"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="emit('blur', $event)"
      />

      <!-- Show / Hide Button -->
      <button
        type="button"
        tabindex="-1"
        class="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
        :title="showPassword ? 'Hide password' : 'Show password'"
        @click="toggleVisibility"
      >
        <EyeOff v-if="showPassword" class="w-4 h-4" />
        <Eye v-else class="w-4 h-4" />
      </button>
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
