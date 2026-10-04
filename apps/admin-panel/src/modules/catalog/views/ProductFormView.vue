<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { productsApi } from '../api/products.api';
import { categoriesApi } from '../api/categories.api';
import type { Category } from '../types/category.types';
import type {
  ProductStatus,
  ProductImage,
  CreateAdminProductInput,
  UpdateAdminProductInput,
} from '../types/product.types';
import type { VariantRow } from '../components/VariantMatrixGenerator.vue';
import { useToast } from '@/shared/composables/useToast';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import AppTextarea from '@/shared/components/ui/AppTextarea.vue';
import AppSwitch from '@/shared/components/ui/AppSwitch.vue';
import DynamicAttributesForm from '../components/DynamicAttributesForm.vue';
import VariantMatrixGenerator from '../components/VariantMatrixGenerator.vue';
import ProductMediaUploader from '../components/ProductMediaUploader.vue';
import {
  ArrowLeft,
  Save,
  Package,
  Sparkles,
  Layers,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  Sliders,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const isEditMode = computed(() => !!route.params.id);
const productId = computed(() => route.params.id as string);

const loading = ref(false);
const saving = ref(false);
const categories = ref<Category[]>([]);

// Form State
const form = reactive({
  name: '',
  slug: '',
  category_id: '',
  description: '',
  base_price_in_rupees: 0,
  compare_at_price_in_rupees: undefined as number | undefined,
  cost_price_in_rupees: undefined as number | undefined,
  status: 'ACTIVE' as ProductStatus,
  is_featured: false,
  tagsInput: '',
  attributes: {} as Record<string, any>,
  variants: [] as VariantRow[],
  images: [] as ProductImage[],
});

// Currently selected category object (to obtain attribute_schema)
const selectedCategory = computed(() => {
  return categories.value.find((c) => c.id === form.category_id);
});

// Auto-generate slug from name in create mode
watch(
  () => form.name,
  (name) => {
    if (!isEditMode.value && name) {
      form.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
  }
);

// Calculate Gross Margin %
const grossMargin = computed(() => {
  if (!form.base_price_in_rupees || !form.cost_price_in_rupees) return null;
  const profit = form.base_price_in_rupees - form.cost_price_in_rupees;
  const margin = (profit / form.base_price_in_rupees) * 100;
  return Math.round(margin * 10) / 10;
});

const fetchCategories = async () => {
  try {
    categories.value = await categoriesApi.getCategories(true);
  } catch (err: any) {
    toast.error('Error', 'Failed to load categories list');
  }
};

const fetchProductData = async () => {
  if (!isEditMode.value) return;
  loading.value = true;
  try {
    const product = await productsApi.getProductById(productId.value);
    form.name = product.name;
    form.slug = product.slug;
    form.category_id = product.category_id;
    form.description = product.description || '';
    form.base_price_in_rupees = product.base_price_in_paise / 100;
    form.compare_at_price_in_rupees = product.compare_at_price_in_paise
      ? product.compare_at_price_in_paise / 100
      : undefined;
    form.cost_price_in_rupees = product.cost_price_in_paise
      ? product.cost_price_in_paise / 100
      : undefined;
    form.status = product.status;
    form.is_featured = product.is_featured;
    form.tagsInput = (product.tags || []).join(', ');
    form.attributes = product.attributes || {};
    form.images = product.images || [];

    // Map variants
    if (product.variants && product.variants.length > 0) {
      form.variants = product.variants.map((v) => {
        const defaultStock = v.stock_levels?.reduce(
          (sum, sl) => sum + sl.quantity_on_hand,
          0
        );
        return {
          sku: v.sku,
          barcode: v.barcode || '',
          weight_in_grams: v.weight_in_grams || undefined,
          price_in_rupees: v.price_in_paise / 100,
          compare_at_price_in_rupees: v.compare_at_price_in_paise
            ? v.compare_at_price_in_paise / 100
            : undefined,
          variant_attributes: (v.variant_attributes as Record<string, string>) || {},
          is_active: v.is_active,
          initial_stock: defaultStock ?? 10,
        };
      });
    }
  } catch (err: any) {
    toast.error('Load Error', err.message || 'Failed to fetch product details');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchCategories();
  if (isEditMode.value) {
    await fetchProductData();
  }
});

const handleSubmit = async () => {
  if (!form.name.trim()) {
    toast.warning('Validation', 'Product name is required');
    return;
  }
  if (!form.category_id) {
    toast.warning('Validation', 'Please select a product category');
    return;
  }
  if (form.base_price_in_rupees <= 0) {
    toast.warning('Validation', 'Base price must be greater than 0');
    return;
  }

  saving.value = true;
  try {
    const tags = form.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const variantsPayload = form.variants.map((v) => ({
      sku: v.sku,
      barcode: v.barcode || undefined,
      weight_in_grams: v.weight_in_grams || undefined,
      price_in_paise: Math.round(v.price_in_rupees * 100),
      compare_at_price_in_paise: v.compare_at_price_in_rupees
        ? Math.round(v.compare_at_price_in_rupees * 100)
        : undefined,
      variant_attributes: v.variant_attributes,
      is_active: v.is_active,
      initial_stock: v.initial_stock,
    }));

    const payload: CreateAdminProductInput = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      category_id: form.category_id,
      description: form.description.trim() || undefined,
      base_price_in_paise: Math.round(form.base_price_in_rupees * 100),
      compare_at_price_in_paise: form.compare_at_price_in_rupees
        ? Math.round(form.compare_at_price_in_rupees * 100)
        : undefined,
      cost_price_in_paise: form.cost_price_in_rupees
        ? Math.round(form.cost_price_in_rupees * 100)
        : undefined,
      status: form.status,
      is_featured: form.is_featured,
      tags,
      attributes: form.attributes,
      variants: variantsPayload.length > 0 ? variantsPayload : undefined,
      images: form.images.map((img, idx) => ({
        url: img.url,
        alt_text: img.alt_text || undefined,
        sort_order: idx,
        is_primary: img.is_primary,
      })),
    };

    if (isEditMode.value) {
      await productsApi.updateProduct(productId.value, payload);
      toast.success('Updated', `Product "${form.name}" has been updated successfully.`);
    } else {
      await productsApi.createProduct(payload);
      toast.success('Created', `Product "${form.name}" has been created successfully.`);
    }

    router.push('/catalog/products');
  } catch (err: any) {
    toast.error('Save Failed', err.message || 'Could not save product');
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="p-6 md:p-8 space-y-6 mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-xs cursor-pointer"
          @click="router.push('/catalog/products')"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">
            {{ isEditMode ? 'Edit Product' : 'Create New Product' }}
          </h1>
          <p class="text-xs text-slate-500 font-medium">
            {{ isEditMode ? 'Update product specifications, variants, and pricing' : 'Publish a new physical SKU to the global catalog' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <AppButton variant="secondary" size="md" @click="router.push('/catalog/products')">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="md" :loading="saving" @click="handleSubmit">
          <Save class="w-4 h-4" />
          <span>{{ isEditMode ? 'Save Changes' : 'Publish Product' }}</span>
        </AppButton>
      </div>
    </div>

    <!-- Form Body (Multi-Card Layout) -->
    <div v-if="loading" class="py-20 text-center text-slate-400">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3"></div>
      <p class="text-xs font-semibold">Loading product data...</p>
    </div>

    <form v-else class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Section 1: Basic Information -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Package class="w-4 h-4 text-indigo-600" />
          <h3 class="text-sm font-bold text-slate-900">General Information</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Product Name -->
          <AppInput
            v-model="form.name"
            label="Product Title"
            placeholder="e.g. Ultra Comfort Running Shoes"
            required
          />

          <!-- Category Selection -->
          <AppSelect
            v-model="form.category_id"
            label="Category"
            placeholder="Select a category"
            required
            :options="categories.map(c => ({ label: c.name, value: c.id }))"
          />

          <!-- Slug -->
          <AppInput
            v-model="form.slug"
            label="URL Handle (Slug)"
            placeholder="e.g. ultra-comfort-running-shoes"
          />

          <!-- Status -->
          <AppSelect
            v-model="form.status"
            label="Publication Status"
            :options="[
              { label: 'Active (Visible on Storefront)', value: 'ACTIVE' },
              { label: 'Draft (Hidden)', value: 'DRAFT' },
              { label: 'Archived', value: 'ARCHIVED' },
              { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
            ]"
          />
        </div>

        <!-- Description -->
        <AppTextarea
          v-model="form.description"
          label="Product Description"
          placeholder="Detailed marketing description, feature highlights, and care instructions..."
          :rows="4"
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 items-center pt-2">
          <!-- Tags Input -->
          <AppInput
            v-model="form.tagsInput"
            label="Tags (Comma separated)"
            placeholder="e.g. summer, shoes, athletic, running"
          />

          <!-- Featured Switch -->
          <div class="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-xl border border-slate-200">
            <div>
              <span class="text-xs font-semibold text-slate-800">Featured Product</span>
              <p class="text-[11px] text-slate-500">Showcase this item in featured collections and homepage carousels</p>
            </div>
            <AppSwitch v-model="form.is_featured" />
          </div>
        </div>
      </div>

      <!-- Section 2: Pricing Engine -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <DollarSign class="w-4 h-4 text-emerald-600" />
            <h3 class="text-sm font-bold text-slate-900">Pricing & Margins</h3>
          </div>

          <!-- Profit Margin Pill -->
          <div
            v-if="grossMargin !== null"
            :class="[
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
              grossMargin >= 40
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : grossMargin > 0
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            ]"
          >
            <TrendingUp class="w-3.5 h-3.5" />
            Gross Margin: {{ grossMargin }}%
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <!-- Base Price -->
          <AppInput
            v-model="form.base_price_in_rupees"
            type="number"
            step="0.01"
            min="0"
            label="Selling Price (₹)"
            placeholder="0.00"
            required
          />

          <!-- Compare At Price -->
          <AppInput
            v-model="form.compare_at_price_in_rupees"
            type="number"
            step="0.01"
            min="0"
            label="Original / MRP (₹)"
            placeholder="0.00"
          />

          <!-- Cost Price -->
          <AppInput
            v-model="form.cost_price_in_rupees"
            type="number"
            step="0.01"
            min="0"
            label="Cost / Procurement Price (₹)"
            placeholder="0.00"
          />
        </div>
      </div>

      <!-- Section 3: Dynamic Category Specifications (Attributes Schema) -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sliders class="w-4 h-4 text-indigo-600" />
          <div>
            <h3 class="text-sm font-bold text-slate-900">Category Specifications</h3>
            <p class="text-[11px] text-slate-500">
              Dynamic attributes derived from <span class="font-semibold">{{ selectedCategory?.name || 'Selected Category' }}</span>
            </p>
          </div>
        </div>

        <DynamicAttributesForm
          :schema="selectedCategory?.attribute_schema"
          v-model="form.attributes"
        />
      </div>

      <!-- Section 4: Product Media Gallery -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
          <ImageIcon class="w-4 h-4 text-indigo-600" />
          <h3 class="text-sm font-bold text-slate-900">Media Gallery</h3>
        </div>

        <ProductMediaUploader v-model="form.images" />
      </div>

      <!-- Section 5: Variants & Inventory Matrix -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Layers class="w-4 h-4 text-indigo-600" />
          <div>
            <h3 class="text-sm font-bold text-slate-900">Variants & Warehouse Inventory</h3>
            <p class="text-[11px] text-slate-500">
              Manage purchasable SKU variants, barcodes, and single-warehouse initial stock
            </p>
          </div>
        </div>

        <VariantMatrixGenerator
          :schema="selectedCategory?.attribute_schema"
          v-model="form.variants"
          :base-price-in-rupees="form.base_price_in_rupees"
          :product-slug="form.slug || form.name"
        />
      </div>

      <!-- Bottom Save Action Bar -->
      <div class="flex items-center justify-end gap-3 pt-4">
        <AppButton variant="secondary" size="md" @click="router.push('/catalog/products')">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="md" :loading="saving" type="submit">
          <Save class="w-4 h-4" />
          <span>{{ isEditMode ? 'Save Product Changes' : 'Publish Product' }}</span>
        </AppButton>
      </div>
    </form>
  </div>
</template>
