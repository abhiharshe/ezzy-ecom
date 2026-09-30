<script setup lang="ts">
interface Props {
  modelValue?: boolean;
  disabled?: boolean;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  label: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const toggle = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue);
  }
};
</script>

<template>
  <label class="switch-container" :class="{ 'is-disabled': disabled }">
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      class="switch-track"
      :class="{ 'is-active': modelValue }"
      @click="toggle"
    >
      <span class="switch-thumb" :class="{ 'is-active': modelValue }"></span>
    </button>
    <span v-if="label" class="switch-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.switch-container {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.switch-track {
  position: relative;
  width: 36px;
  height: 20px;
  background-color: #e2e8f0;
  border-radius: var(--radius-full);
  transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  padding: 2px;
}

.switch-track.is-active {
  background-color: var(--primary-600);
}

.switch-thumb {
  width: 16px;
  height: 16px;
  background-color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateX(0);
}

.switch-thumb.is-active {
  transform: translateX(16px);
}

.switch-label {
  font-size: 13px;
  color: var(--text-main);
  font-weight: 500;
}

.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.is-disabled .switch-track {
  cursor: not-allowed;
}
</style>
