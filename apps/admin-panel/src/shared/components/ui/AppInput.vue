<script setup lang="ts">
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
}

withDefaults(defineProps<Props>(), {
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
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
}>();
</script>

<template>
  <div class="app-input-group" :class="{ 'has-error': !!error, 'is-disabled': disabled }">
    <label v-if="label" :for="id" class="input-label">
      {{ label }}
      <span v-if="required" class="required-mark">*</span>
    </label>

    <div class="input-container">
      <span v-if="$slots.leading" class="leading-icon">
        <slot name="leading" />
      </span>

      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        class="input-control"
        :class="{ 'has-leading': $slots.leading, 'has-trailing': $slots.trailing }"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="emit('blur', $event)"
      />

      <span v-if="$slots.trailing" class="trailing-icon">
        <slot name="trailing" />
      </span>
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
  padding: 0 13px;
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
  font-weight: 400;
}

.input-control:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  background-color: #ffffff;
}

.input-control.has-leading {
  padding-left: 38px;
}

.input-control.has-trailing {
  padding-right: 38px;
}

.leading-icon {
  position: absolute;
  left: 12px;
  display: flex;
  align-items: center;
  color: var(--text-muted);
  pointer-events: none;
}

.trailing-icon {
  position: absolute;
  right: 12px;
  display: flex;
  align-items: center;
  color: var(--text-muted);
}

.has-error .input-control {
  border-color: var(--danger-text);
  background-color: #fffbfa;
}
.has-error .input-control:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
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

.is-disabled .input-control {
  background-color: var(--bg-surface-subtle);
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
