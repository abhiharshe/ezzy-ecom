<script setup lang="ts">
import { ref } from 'vue';
import { Eye, EyeOff } from 'lucide-vue-next';

interface Props {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '••••••••',
  error: '',
  hint: '',
  disabled: false,
  required: false,
  id: () => `pwd-${Math.random().toString(36).substring(2, 9)}`,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
}>();

const showPassword = ref(false);

const toggleShow = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="app-input-group" :class="{ 'has-error': !!error, 'is-disabled': disabled }">
    <div class="label-row">
      <label v-if="label" :for="id" class="input-label">
        {{ label }}
        <span v-if="required" class="required-mark">*</span>
      </label>
      <slot name="label-action" />
    </div>

    <div class="input-container">
      <input
        :id="id"
        :type="showPassword ? 'text' : 'password'"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        class="input-control"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="emit('blur', $event)"
      />

      <button
        type="button"
        class="toggle-btn"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
        @click="toggleShow"
      >
        <EyeOff v-if="showPassword" class="icon" />
        <Eye v-else class="icon" />
      </button>
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>
    <p v-else-if="hint" class="hint-text">{{ hint }}</p>
  </div>
</template>

<style scoped>
.app-input-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 3px;
}

.required-mark {
  color: var(--danger-text);
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-control {
  width: 100%;
  height: 40px;
  padding: 0 40px 0 13px;
  background-color: #ffffff;
  border: 1px solid var(--border-card);
  border-radius: var(--radius-md);
  color: var(--text-main);
  font-size: 13.5px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input-control::placeholder {
  color: var(--text-subtle);
}

.input-control:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.toggle-btn {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}
.toggle-btn:hover {
  color: var(--text-main);
  background-color: var(--bg-surface-subtle);
}

.icon {
  width: 16px;
  height: 16px;
}

.has-error .input-control {
  border-color: var(--danger-text);
  background-color: #fffbfa;
}

.error-text {
  font-size: 12px;
  color: var(--danger-text);
  font-weight: 500;
}

.hint-text {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
