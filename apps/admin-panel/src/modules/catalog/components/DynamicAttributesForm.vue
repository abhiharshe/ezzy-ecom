<script setup lang="ts">
import { computed } from 'vue';
import type { AttributeSchemaItem } from '../types/category.types';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import AppMultiSelect from '@/shared/components/ui/AppMultiSelect.vue';
import AppSwitch from '@/shared/components/ui/AppSwitch.vue';

interface Props {
  schema?: AttributeSchemaItem[];
  modelValue: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  schema: () => [],
  modelValue: () => ({}),
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: Record<string, any>): void;
}>();

// Filter non-variant attributes (attributes stored in Product.attributes)
const nonVariantAttributes = computed(() => {
  return props.schema.filter((item) => !item.isVariant);
});

const updateField = (key: string, value: any) => {
  const updated = { ...props.modelValue, [key]: value };
  emit('update:modelValue', updated);
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="nonVariantAttributes.length === 0" class="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
      <p class="text-xs text-slate-500 font-medium">No category-specific specifications configured for this category.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="attr in nonVariantAttributes"
        :key="attr.name"
        class="flex flex-col"
      >
        <!-- Text Input -->
        <AppInput
          v-if="attr.type === 'text'"
          :label="attr.name"
          :placeholder="`Enter ${attr.name.toLowerCase()}...`"
          :model-value="modelValue[attr.name] ?? ''"
          :required="attr.isRequired"
          @update:model-value="updateField(attr.name, $event)"
        />

        <!-- Number Input -->
        <AppInput
          v-else-if="attr.type === 'number'"
          type="number"
          :label="attr.name"
          :placeholder="`Enter ${attr.name.toLowerCase()}...`"
          :model-value="modelValue[attr.name] ?? ''"
          :required="attr.isRequired"
          @update:model-value="updateField(attr.name, $event === '' ? undefined : Number($event))"
        />

        <!-- Select Dropdown -->
        <AppSelect
          v-else-if="attr.type === 'select'"
          :label="attr.name"
          :placeholder="`Select ${attr.name.toLowerCase()}...`"
          :options="(attr.options || []).map(opt => ({ label: opt, value: opt }))"
          :model-value="modelValue[attr.name] ?? ''"
          :required="attr.isRequired"
          @update:model-value="updateField(attr.name, $event)"
        />

        <!-- Multi-Select Dropdown -->
        <AppMultiSelect
          v-else-if="attr.type === 'multi-select'"
          :label="attr.name"
          :placeholder="`Select ${attr.name.toLowerCase()}(s)...`"
          :options="(attr.options || []).map(opt => ({ label: opt, value: opt }))"
          :model-value="modelValue[attr.name] || []"
          :required="attr.isRequired"
          @update:model-value="updateField(attr.name, $event)"
        />

        <!-- Boolean Switch -->
        <div v-else-if="attr.type === 'boolean'" class="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-xl border border-slate-200">
          <div>
            <span class="text-xs font-semibold text-slate-700">{{ attr.name }}</span>
            <span v-if="attr.isRequired" class="text-rose-500 ml-0.5">*</span>
          </div>
          <AppSwitch
            :model-value="!!modelValue[attr.name]"
            @update:model-value="updateField(attr.name, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
