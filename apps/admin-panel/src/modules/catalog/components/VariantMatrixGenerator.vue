<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { AttributeSchemaItem } from '../types/category.types';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppSwitch from '@/shared/components/ui/AppSwitch.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import { Plus, Trash2, RefreshCw, Layers } from 'lucide-vue-next';

export interface VariantRow {
  sku: string;
  barcode?: string;
  weight_in_grams?: number;
  price_in_rupees: number;
  compare_at_price_in_rupees?: number;
  variant_attributes: Record<string, string>;
  is_active: boolean;
  initial_stock: number;
}

interface Props {
  schema?: AttributeSchemaItem[];
  modelValue: VariantRow[];
  basePriceInRupees?: number;
  productSlug?: string;
}

const props = withDefaults(defineProps<Props>(), {
  schema: () => [],
  modelValue: () => [],
  basePriceInRupees: 0,
  productSlug: 'SKU',
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: VariantRow[]): void;
}>();

// Extract attributes that split inventory (isVariant: true)
const variantAttributes = computed(() => {
  return props.schema.filter((item) => item.isVariant);
});

// Selected options per variant attribute to generate matrix
const selectedOptions = ref<Record<string, string[]>>({});
const customOptionInputs = ref<Record<string, string>>({});

// Initialize selected options from schema
watch(
  () => props.schema,
  (newSchema) => {
    newSchema.filter(s => s.isVariant).forEach(attr => {
      if (!selectedOptions.value[attr.name]) {
        selectedOptions.value[attr.name] = attr.options ? [...attr.options] : [];
      }
    });
  },
  { immediate: true }
);

const addCustomOption = (attrName: string) => {
  const val = (customOptionInputs.value[attrName] || '').trim();
  if (!val) return;
  if (!selectedOptions.value[attrName]) {
    selectedOptions.value[attrName] = [];
  }
  if (!selectedOptions.value[attrName].includes(val)) {
    selectedOptions.value[attrName].push(val);
  }
  customOptionInputs.value[attrName] = '';
};

const removeOption = (attrName: string, opt: string) => {
  if (selectedOptions.value[attrName]) {
    selectedOptions.value[attrName] = selectedOptions.value[attrName].filter(o => o !== opt);
  }
};

const toggleOptionSelection = (attrName: string, opt: string) => {
  if (!selectedOptions.value[attrName]) {
    selectedOptions.value[attrName] = [];
  }
  const idx = selectedOptions.value[attrName].indexOf(opt);
  if (idx > -1) {
    selectedOptions.value[attrName].splice(idx, 1);
  } else {
    selectedOptions.value[attrName].push(opt);
  }
};

// Generate Cartesian Product matrix
const generateMatrix = () => {
  const activeVariantDefs = variantAttributes.value.filter(
    (attr) => (selectedOptions.value[attr.name] || []).length > 0
  );

  if (activeVariantDefs.length === 0) {
    // If no variant options selected, emit single standard row
    emit('update:modelValue', [
      {
        sku: `${props.productSlug.toUpperCase().slice(0, 8) || 'PROD'}-STD`,
        price_in_rupees: props.basePriceInRupees || 0,
        variant_attributes: {},
        is_active: true,
        initial_stock: 10,
      },
    ]);
    return;
  }

  // Cartesian product algorithm
  const keys = activeVariantDefs.map((v) => v.name);
  const arrays = keys.map((k) => selectedOptions.value[k] || []);

  const cartesian = (...a: string[][]): string[][] =>
    a.reduce((acc, curr) => acc.flatMap((d) => curr.map((e) => [...d, e])), [[]] as string[][]);

  const combinations = cartesian(...arrays);

  const prefix = props.productSlug
    ? props.productSlug.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)
    : 'SKU';

  const rows: VariantRow[] = combinations.map((combo, idx) => {
    const varAttrs: Record<string, string> = {};
    keys.forEach((key, kIdx) => {
      varAttrs[key] = combo[kIdx];
    });

    const skuSuffix = combo
      .map((c) => c.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4))
      .join('-');

    return {
      sku: `${prefix}-${skuSuffix || idx + 1}`,
      price_in_rupees: props.basePriceInRupees || 0,
      compare_at_price_in_rupees: undefined,
      barcode: '',
      weight_in_grams: undefined,
      variant_attributes: varAttrs,
      is_active: true,
      initial_stock: 10,
    };
  });

  emit('update:modelValue', rows);
};

const addManualRow = () => {
  const current = [...props.modelValue];
  current.push({
    sku: `${props.productSlug.toUpperCase().slice(0, 6) || 'PROD'}-${current.length + 1}`,
    price_in_rupees: props.basePriceInRupees || 0,
    variant_attributes: {},
    is_active: true,
    initial_stock: 10,
  });
  emit('update:modelValue', current);
};

const removeRow = (index: number) => {
  const current = [...props.modelValue];
  current.splice(index, 1);
  emit('update:modelValue', current);
};

const updateRowField = (index: number, field: keyof VariantRow, value: any) => {
  const current = [...props.modelValue];
  current[index] = { ...current[index], [field]: value };
  emit('update:modelValue', current);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Variant Attributes Configurator (if category has variant schemas) -->
    <div v-if="variantAttributes.length > 0" class="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers class="w-3.5 h-3.5 text-indigo-600" />
            Variant Option Attributes
          </h4>
          <p class="text-xs text-slate-500 mt-0.5">Select or enter available options for each variant dimension</p>
        </div>
        <AppButton size="md" variant="primary" @click="generateMatrix">
          <RefreshCw class="w-4 h-4" />
          <span>Generate Matrix</span>
        </AppButton>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="attr in variantAttributes"
          :key="attr.name"
          class="p-3 bg-white rounded-lg border border-slate-200/60 shadow-xs"
        >
          <span class="text-xs font-bold text-slate-700 block mb-2">{{ attr.name }}</span>
          
          <!-- Selected Option Pills -->
          <div class="flex flex-wrap gap-1.5 mb-2.5">
            <span
              v-for="opt in (selectedOptions[attr.name] || [])"
              :key="opt"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60"
            >
              {{ opt }}
              <button
                type="button"
                class="hover:text-rose-600 ml-0.5 font-bold cursor-pointer"
                @click="removeOption(attr.name, opt)"
              >
                ×
              </button>
            </span>
          </div>

          <!-- Add new option input -->
          <div class="flex gap-1.5">
            <input
              v-model="customOptionInputs[attr.name]"
              type="text"
              :placeholder="`Add option (e.g. ${attr.options?.[0] || 'XL'})...`"
              class="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              @keydown.enter.prevent="addCustomOption(attr.name)"
            />
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              @click="addCustomOption(attr.name)"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Variant Matrix Table -->
    <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
      <div class="px-4 py-3 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Generated Variants & Stock ({{ modelValue.length }})
          </h4>
          <p class="text-[11px] text-slate-500">Configure SKU, price, and initial stock for each purchasable variant</p>
        </div>
        <AppButton size="md" variant="secondary" @click="addManualRow">
          <Plus class="w-4 h-4" />
          <span>Add Variant</span>
        </AppButton>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/30 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th class="px-3.5 py-2.5">Variant Specs</th>
              <th class="px-3.5 py-2.5 w-36">SKU *</th>
              <th class="px-3.5 py-2.5 w-28">Price (₹) *</th>
              <th class="px-3.5 py-2.5 w-28">Compare At (₹)</th>
              <th class="px-3.5 py-2.5 w-24">Initial Stock</th>
              <th class="px-3.5 py-2.5 w-28">Barcode</th>
              <th class="px-3.5 py-2.5 w-20 text-center">Active</th>
              <th class="px-3.5 py-2.5 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            <tr v-if="modelValue.length === 0">
              <td colspan="8" class="py-8 text-center text-slate-400 font-medium">
                No variants generated yet. Click "Generate Matrix" or "Add Variant" to create variants.
              </td>
            </tr>
            <tr
              v-for="(row, idx) in modelValue"
              :key="idx"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <!-- Specs Badges -->
              <td class="px-3.5 py-2.5">
                <div v-if="Object.keys(row.variant_attributes).length > 0" class="flex flex-wrap gap-1">
                  <span
                    v-for="(val, key) in row.variant_attributes"
                    :key="key"
                    class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200"
                  >
                    {{ key }}: {{ val }}
                  </span>
                </div>
                <span v-else class="text-slate-400 italic text-[11px]">Standard (Default)</span>
              </td>

              <!-- SKU -->
              <td class="px-3.5 py-2">
                <input
                  :value="row.sku"
                  type="text"
                  required
                  placeholder="SKU"
                  class="w-full px-2 py-1 text-xs font-mono font-medium border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  @input="updateRowField(idx, 'sku', ($event.target as HTMLInputElement).value)"
                />
              </td>

              <!-- Price (₹) -->
              <td class="px-3.5 py-2">
                <input
                  :value="row.price_in_rupees"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  class="w-full px-2 py-1 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  @input="updateRowField(idx, 'price_in_rupees', Number(($event.target as HTMLInputElement).value))"
                />
              </td>

              <!-- Compare At (₹) -->
              <td class="px-3.5 py-2">
                <input
                  :value="row.compare_at_price_in_rupees ?? ''"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  class="w-full px-2 py-1 text-xs text-slate-600 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  @input="updateRowField(idx, 'compare_at_price_in_rupees', ($event.target as HTMLInputElement).value === '' ? undefined : Number(($event.target as HTMLInputElement).value))"
                />
              </td>

              <!-- Initial Stock -->
              <td class="px-3.5 py-2">
                <input
                  :value="row.initial_stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="w-full px-2 py-1 text-xs font-semibold text-emerald-700 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-center"
                  @input="updateRowField(idx, 'initial_stock', Number(($event.target as HTMLInputElement).value))"
                />
              </td>

              <!-- Barcode -->
              <td class="px-3.5 py-2">
                <input
                  :value="row.barcode ?? ''"
                  type="text"
                  placeholder="Barcode"
                  class="w-full px-2 py-1 text-xs font-mono text-slate-600 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  @input="updateRowField(idx, 'barcode', ($event.target as HTMLInputElement).value)"
                />
              </td>

              <!-- Active Switch -->
              <td class="px-3.5 py-2 text-center">
                <AppSwitch
                  :model-value="row.is_active"
                  @update:model-value="updateRowField(idx, 'is_active', $event)"
                />
              </td>

              <!-- Delete Action -->
              <td class="px-3.5 py-2 text-center">
                <button
                  type="button"
                  class="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                  title="Remove variant"
                  @click="removeRow(idx)"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
