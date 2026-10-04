<script setup lang="ts">
import { ref } from 'vue';
import type { AttributeSchemaItem, AttributeType } from '../types/category.types';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppSwitch from '@/shared/components/ui/AppSwitch.vue';
import { Plus, Trash2, Tag, Layers, CheckSquare, Sparkles } from 'lucide-vue-next';

interface Props {
  modelValue: AttributeSchemaItem[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: AttributeSchemaItem[]): void;
}>();

const newOptionInput = ref<Record<number, string>>({});

const attributeTypes: { value: AttributeType; label: string; desc: string }[] = [
  { value: 'select', label: 'Single Select', desc: 'Dropdown choice (e.g., Size, Color)' },
  { value: 'multi-select', label: 'Multi-Select', desc: 'Multiple tag selections' },
  { value: 'text', label: 'Text', desc: 'Free-form string (e.g., Material, Pattern)' },
  { value: 'number', label: 'Number', desc: 'Numeric value (e.g., Wattage, RAM GB)' },
  { value: 'boolean', label: 'Boolean', desc: 'Yes/No switch (e.g., Water Resistant)' },
];

const addAttribute = () => {
  const updated = [
    ...props.modelValue,
    {
      name: '',
      type: 'select' as AttributeType,
      options: [],
      isVariant: false,
      isRequired: false,
    },
  ];
  emit('update:modelValue', updated);
};

const removeAttribute = (index: number) => {
  const updated = props.modelValue.filter((_, i) => i !== index);
  emit('update:modelValue', updated);
};

const updateAttribute = <K extends keyof AttributeSchemaItem>(
  index: number,
  field: K,
  value: AttributeSchemaItem[K]
) => {
  const updated = props.modelValue.map((attr, i) => {
    if (i !== index) return attr;
    const next = { ...attr, [field]: value };
    // Clear options if switching away from select/multi-select
    if (field === 'type' && value !== 'select' && value !== 'multi-select') {
      next.options = [];
    }
    return next;
  });
  emit('update:modelValue', updated);
};

const addOption = (index: number) => {
  const input = (newOptionInput.value[index] || '').trim();
  if (!input) return;

  const attr = props.modelValue[index];
  const existingOptions = attr.options || [];
  if (!existingOptions.includes(input)) {
    updateAttribute(index, 'options', [...existingOptions, input]);
  }
  newOptionInput.value[index] = '';
};

const removeOption = (attrIndex: number, optionIndex: number) => {
  const attr = props.modelValue[attrIndex];
  const currentOptions = attr.options || [];
  const nextOptions = currentOptions.filter((_, i) => i !== optionIndex);
  updateAttribute(attrIndex, 'options', nextOptions);
};
</script>

<template>
  <div class="schema-builder">
    <div class="builder-header">
      <div>
        <h4 class="builder-title">Attribute Blueprint</h4>
        <p class="builder-desc">
          Attributes dictate product specs and determine whether an attribute creates separate purchasable inventory SKUs.
        </p>
      </div>
      <AppButton
        type="button"
        variant="secondary"
        size="sm"
        @click="addAttribute"
      >
        <template #icon>
          <Plus :size="16" />
        </template>
        Add Attribute
      </AppButton>
    </div>

    <!-- Empty State -->
    <div v-if="!modelValue || modelValue.length === 0" class="empty-schema">
      <Sparkles :size="24" class="empty-icon" />
      <p class="empty-title">No attributes configured yet</p>
      <p class="empty-sub">
        Add attributes like <strong>Size</strong>, <strong>Color</strong>, or <strong>Material</strong> to enforce structured specs for this category.
      </p>
      <AppButton
        type="button"
        variant="outline"
        size="sm"
        @click="addAttribute"
      >
        <template #icon>
          <Plus :size="14" />
        </template>
        Add First Attribute
      </AppButton>
    </div>

    <!-- Attribute Cards -->
    <div v-else class="attributes-list">
      <div
        v-for="(attr, index) in modelValue"
        :key="index"
        class="attribute-card"
        :class="{ 'is-variant': attr.isVariant }"
      >
        <div class="card-top">
          <div class="field-name">
            <label class="field-label">Attribute Name</label>
            <input
              type="text"
              class="input-clean"
              placeholder="e.g. Size, Color, Fabric"
              :value="attr.name"
              @input="updateAttribute(index, 'name', ($event.target as HTMLInputElement).value)"
            />
          </div>

          <div class="field-type">
            <label class="field-label">Type</label>
            <select
              class="select-clean"
              :value="attr.type"
              @change="updateAttribute(index, 'type', ($event.target as HTMLSelectElement).value as AttributeType)"
            >
              <option
                v-for="t in attributeTypes"
                :key="t.value"
                :value="t.value"
              >
                {{ t.label }}
              </option>
            </select>
          </div>

          <button
            type="button"
            class="btn-delete"
            title="Remove Attribute"
            @click="removeAttribute(index)"
          >
            <Trash2 :size="16" />
          </button>
        </div>

        <!-- Options Manager (for select / multi-select) -->
        <div
          v-if="attr.type === 'select' || attr.type === 'multi-select'"
          class="options-section"
        >
          <label class="field-label">Predefined Options</label>
          <div class="chips-container">
            <span
              v-for="(opt, optIdx) in attr.options || []"
              :key="optIdx"
              class="chip"
            >
              {{ opt }}
              <button
                type="button"
                class="chip-remove"
                @click="removeOption(index, optIdx)"
              >
                ×
              </button>
            </span>

            <div class="chip-input-wrap">
              <input
                v-model="newOptionInput[index]"
                type="text"
                class="chip-input"
                placeholder="Type option & press Enter"
                @keydown.enter.prevent="addOption(index)"
                @blur="addOption(index)"
              />
            </div>
          </div>
        </div>

        <!-- Attribute Toggles -->
        <div class="card-bottom">
          <div class="toggle-group">
            <AppSwitch
              :model-value="attr.isVariant"
              label="Splits Inventory (Variant)"
              @update:model-value="updateAttribute(index, 'isVariant', $event)"
            />
            <span class="toggle-hint">
              <Layers :size="13" />
              {{ attr.isVariant ? 'Generates unique purchasable SKUs (e.g. Size/Color)' : 'Shared marketing spec across all variants' }}
            </span>
          </div>

          <div class="toggle-group">
            <AppSwitch
              :model-value="attr.isRequired ?? false"
              label="Required"
              @update:model-value="updateAttribute(index, 'isRequired', $event)"
            />
            <span class="toggle-hint">
              <CheckSquare :size="13" />
              {{ attr.isRequired ? 'Mandatory for vendors' : 'Optional specification' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schema-builder {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.builder-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.builder-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 2px 0;
}

.builder-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.empty-schema {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background-color: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  text-align: center;
}

.empty-icon {
  color: #94a3b8;
  margin-bottom: 8px;
}

.empty-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #334155;
  margin: 0 0 4px 0;
}

.empty-sub {
  font-size: 12px;
  color: #64748b;
  max-width: 380px;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.attributes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attribute-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.attribute-card:hover {
  border-color: #cbd5e1;
}

.attribute-card.is-variant {
  border-left: 3px solid #7c3aed;
  background: linear-gradient(to right, #faf5ff, #ffffff 15%);
}

.card-top {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.field-name {
  flex: 1;
}

.field-type {
  width: 170px;
}

.field-label {
  display: block;
  font-size: 11.5px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.input-clean,
.select-clean {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  font-size: 13px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background-color: #ffffff;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s ease;
}

.input-clean:focus,
.select-clean:focus {
  border-color: #7c3aed;
}

.btn-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #fecdd3;
  border-radius: 6px;
  background-color: #fff1f2;
  color: #e11d48;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-delete:hover {
  background-color: #ffe4e6;
  border-color: #fda4af;
}

.options-section {
  padding: 10px;
  background-color: #f8fafc;
  border-radius: 6px;
  border: 1px solid #f1f5f9;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-top: 4px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 500;
  background-color: #ede9fe;
  color: #6d28d9;
  border-radius: 4px;
}

.chip-remove {
  background: none;
  border: none;
  color: #7c3aed;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.chip-remove:hover {
  color: #5b21b6;
}

.chip-input-wrap {
  flex: 1;
  min-width: 140px;
}

.chip-input {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 4px;
  outline: none;
  background-color: #ffffff;
}

.chip-input:focus {
  border-color: #7c3aed;
  border-style: solid;
}

.card-bottom {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding-top: 6px;
  border-top: 1px solid #f1f5f9;
}

.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toggle-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #64748b;
}
</style>
