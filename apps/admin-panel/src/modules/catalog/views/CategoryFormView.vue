<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type {
  Category,
  AttributeSchemaItem,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types/category.types';
import { categoriesApi } from '../api/categories.api';
import { useToast } from '@/shared/composables/useToast';
import {
  AppButton,
  AppInput,
  AppSelect,
  AppTextarea,
  AppSwitch,
} from '@/shared/components/ui';
import AttributeSchemaBuilder from '../components/AttributeSchemaBuilder.vue';
import {
  ArrowLeft,
  FolderPlus,
  Edit3,
  Save,
  CheckCircle2,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const categoryId = computed(() => route.params.id as string | undefined);
const isEditing = computed(() => !!categoryId.value);

const loading = ref(false);
const initialLoading = ref(false);
const allCategories = ref<Category[]>([]);
const existingCategory = ref<Category | null>(null);

// Form Fields
const name = ref('');
const slug = ref('');
const parentId = ref<string | null>(null);
const description = ref('');
const imageUrl = ref('');
const returnWindowDays = ref<number>(7);
const sortOrder = ref<number>(0);
const isActive = ref(true);
const attributeSchema = ref<AttributeSchemaItem[]>([]);
const isSlugManuallyEdited = ref(false);

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const handleNameChange = (val: string) => {
  name.value = val;
  if (!isSlugManuallyEdited.value) {
    slug.value = slugify(val);
  }
};

const handleSlugChange = (val: string) => {
  isSlugManuallyEdited.value = true;
  slug.value = slugify(val);
};

// Return Window Presets
const returnWindowOptions = [
  { value: 7, label: '7 Days (Standard Goods)' },
  { value: 10, label: '10 Days (Electronics / Apparel)' },
  { value: 30, label: '30 Days (High-Value / Luxury)' },
];

// Eligible Parent Categories (excluding self and children if editing)
const eligibleParents = computed(() => {
  if (!categoryId.value) {
    return allCategories.value;
  }
  const currentId = categoryId.value;
  return allCategories.value.filter(
    (c) => c.id !== currentId && c.parent_id !== currentId
  );
});

const parentCategoryOptions = computed(() => [
  { label: 'None (Top-Level Root Category)', value: null },
  ...eligibleParents.value.map((cat) => ({
    label: `${cat.name} (${cat.slug})`,
    value: cat.id,
  })),
]);

// Initialize page data
const initPage = async () => {
  initialLoading.value = true;
  try {
    const list = await categoriesApi.getCategories(true);
    allCategories.value = list;

    if (isEditing.value && categoryId.value) {
      const cat = await categoriesApi.getCategoryBySlug(categoryId.value).catch(async () => {
        // If not found by slug, find from list by ID
        return list.find((c) => c.id === categoryId.value) || null;
      });

      if (!cat) {
        toast.error('Category not found');
        router.push('/catalog/categories');
        return;
      }

      existingCategory.value = cat;
      name.value = cat.name;
      slug.value = cat.slug;
      parentId.value = cat.parent_id;
      description.value = cat.description || '';
      imageUrl.value = cat.image_url || '';
      returnWindowDays.value = cat.return_window_days ?? 7;
      sortOrder.value = cat.sort_order ?? 0;
      isActive.value = cat.is_active ?? true;
      attributeSchema.value = JSON.parse(
        JSON.stringify(cat.attribute_schema || [])
      );
      isSlugManuallyEdited.value = true;
    } else {
      // Query param support for parentId preselection: ?parentId=...
      const queryParentId = route.query.parentId as string | undefined;
      if (queryParentId) {
        parentId.value = queryParentId;
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load category data';
    toast.error(message);
  } finally {
    initialLoading.value = false;
  }
};

onMounted(() => {
  initPage();
});

const handleSave = async () => {
  if (!name.value.trim()) {
    toast.error('Category name is required');
    return;
  }

  // Validate attribute names
  for (const attr of attributeSchema.value) {
    if (!attr.name.trim()) {
      toast.error('All attributes must have a name');
      return;
    }
    if (
      (attr.type === 'select' || attr.type === 'multi-select') &&
      (!attr.options || attr.options.length === 0)
    ) {
      toast.error(`Attribute "${attr.name}" requires at least one option`);
      return;
    }
  }

  loading.value = true;
  try {
    if (isEditing.value && categoryId.value) {
      const payload: UpdateCategoryInput = {
        name: name.value.trim(),
        slug: slug.value.trim() || undefined,
        parent_id: parentId.value,
        description: description.value.trim() || undefined,
        image_url: imageUrl.value.trim() || undefined,
        return_window_days: Number(returnWindowDays.value),
        sort_order: Number(sortOrder.value),
        is_active: isActive.value,
        attribute_schema: attributeSchema.value,
      };

      const updated = await categoriesApi.updateCategory(categoryId.value, payload);
      toast.success(`Category "${updated.name}" updated successfully`);
    } else {
      const payload: CreateCategoryInput = {
        name: name.value.trim(),
        slug: slug.value.trim() || undefined,
        parent_id: parentId.value,
        description: description.value.trim() || undefined,
        image_url: imageUrl.value.trim() || undefined,
        return_window_days: Number(returnWindowDays.value),
        sort_order: Number(sortOrder.value),
        is_active: isActive.value,
        attribute_schema: attributeSchema.value,
      };

      const created = await categoriesApi.createCategory(payload);
      toast.success(`Category "${created.name}" created successfully`);
    }

    router.push('/catalog/categories');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save category';
    toast.error(message);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="p-6 md:p-8 max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in">
    <!-- Top Breadcrumb & Navigation -->
    <div class="flex flex-col gap-2">
      <nav class="flex items-center gap-2 text-xs text-slate-500">
        <router-link to="/catalog/categories" class="hover:text-slate-800 transition-colors">
          Catalog
        </router-link>
        <span class="text-slate-300">/</span>
        <router-link to="/catalog/categories" class="hover:text-slate-800 transition-colors">
          Categories
        </router-link>
        <span class="text-slate-300">/</span>
        <span class="text-indigo-600 font-semibold">
          {{ isEditing ? `Edit: ${name || 'Category'}` : 'New Category' }}
        </span>
      </nav>

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div class="flex items-center gap-3">
          <router-link
            to="/catalog/categories"
            class="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all shadow-xs"
            title="Back to Categories"
          >
            <ArrowLeft class="w-4 h-4" />
          </router-link>

          <div class="flex items-center gap-3">
            <div
              :class="[
                'w-10 h-10 rounded-xl flex items-center justify-center font-bold',
                isEditing
                  ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-200/60',
              ]"
            >
              <Edit3 v-if="isEditing" class="w-5 h-5" />
              <FolderPlus v-else class="w-5 h-5" />
            </div>
            <div>
              <h1 class="text-xl font-extrabold text-slate-900 tracking-tight">
                {{ isEditing ? `Edit Category: ${existingCategory?.name || name}` : 'Create New Category' }}
              </h1>
              <p class="text-xs text-slate-500 mt-0.5">
                Configure hierarchical taxonomy, return window escrow, and attribute blueprints.
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <AppButton
            variant="outline"
            size="md"
            :disabled="loading"
            @click="router.push('/catalog/categories')"
          >
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            size="md"
            :loading="loading"
            @click="handleSave"
          >
            <template #icon>
              <Save class="w-4 h-4" />
            </template>
            {{ isEditing ? 'Save Changes' : 'Create Category' }}
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Initial Loading State -->
    <div
      v-if="initialLoading"
      class="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-xs"
    >
      <div class="w-8 h-8 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
      <p class="text-xs font-semibold text-slate-500">Loading category information...</p>
    </div>

    <!-- Main Form Content -->
    <div v-else class="flex flex-col gap-6">
      <!-- General Information Card -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
            General Information
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Basic metadata and hierarchical positioning in the catalog tree.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppInput
            :model-value="name"
            label="Category Name"
            placeholder="e.g. Footwear, Smartphones, Winterwear"
            required
            @update:model-value="handleNameChange"
          />

          <AppInput
            :model-value="slug"
            label="URL Slug"
            placeholder="e.g. footwear"
            hint="Auto-generated from name or custom"
            required
            @update:model-value="handleSlugChange"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppSelect
            v-model="parentId"
            label="Parent Category"
            :options="parentCategoryOptions"
            placeholder="None (Top-Level Root Category)"
            searchable
            search-placeholder="Search parent categories..."
            hint="Nests this category inside an existing branch"
          />

          <AppSelect
            v-model="returnWindowDays"
            label="Return Window (Escrow Period)"
            :options="returnWindowOptions"
            placeholder="Select return window..."
            hint="Days post-delivery held in escrow before vendor payout settlement"
          />
        </div>

        <AppTextarea
          v-model="description"
          label="Description (Optional)"
          placeholder="Brief description for customer guidance and SEO context..."
          :rows="2"
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-1 border-t border-slate-100">
          <AppInput
            v-model="sortOrder"
            type="number"
            label="Display Sort Order"
            placeholder="0"
            hint="Lower values appear first"
          />

          <div class="flex flex-col gap-1.5">
            <span class="text-xs font-bold text-slate-800">Visibility Status</span>
            <div class="h-10 flex items-center">
              <AppSwitch
                v-model="isActive"
                label="Active & Publicly Visible"
                sublabel="When disabled, category and its subcategories are hidden from storefront"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Attribute Schema Section -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        <AttributeSchemaBuilder v-model="attributeSchema" />
      </div>

      <!-- Bottom Action Bar -->
      <div class="flex items-center justify-end gap-3 py-2">
        <AppButton
          variant="outline"
          size="md"
          :disabled="loading"
          @click="router.push('/catalog/categories')"
        >
          Cancel
        </AppButton>
        <AppButton
          variant="primary"
          size="md"
          :loading="loading"
          @click="handleSave"
        >
          <template #icon>
            <Save class="w-4 h-4" />
          </template>
          {{ isEditing ? 'Save Changes' : 'Create Category' }}
        </AppButton>
      </div>
    </div>
  </div>
</template>
