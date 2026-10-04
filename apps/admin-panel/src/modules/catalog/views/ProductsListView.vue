<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { productsApi } from '../api/products.api';
import { categoriesApi } from '../api/categories.api';
import type { AdminProduct, ProductStatus } from '../types/product.types';
import type { Category } from '../types/category.types';
import { useToast } from '@/shared/composables/useToast';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import AppDataTable from '@/shared/components/ui/AppDataTable.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';
import {
  Plus,
  Search,
  Layers,
  Edit2,
  Trash2,
  Package,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Archive,
} from 'lucide-vue-next';

const router = useRouter();
const toast = useToast();

const loading = ref(false);
const products = ref<AdminProduct[]>([]);
const categories = ref<Category[]>([]);

// Filters & Pagination
const search = ref('');
const selectedCategory = ref('');
const selectedStatus = ref<string>('');
const currentPage = ref(1);
const limit = ref(10);
const totalProducts = ref(0);
const totalPages = ref(1);

// Delete Confirmation Modal State
const showDeleteModal = ref(false);
const productToDelete = ref<AdminProduct | null>(null);
const isDeleting = ref(false);

const tableColumns = [
  { key: 'product', label: 'Product', width: '35%' },
  { key: 'category', label: 'Category', width: '15%' },
  { key: 'price', label: 'Base Price', width: '15%' },
  { key: 'stock', label: 'Inventory', width: '15%' },
  { key: 'status', label: 'Status', width: '10%' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '10%' },
];

const fetchCategories = async () => {
  try {
    categories.value = await categoriesApi.getCategories(true);
  } catch (err: any) {
    console.error('Failed to load categories', err);
  }
};

const fetchProducts = async () => {
  loading.value = true;
  try {
    const res = await productsApi.getProducts({
      page: currentPage.value,
      limit: limit.value,
      search: search.value || undefined,
      category_id: selectedCategory.value || undefined,
      status: (selectedStatus.value as ProductStatus) || undefined,
    });

    products.value = res.data;
    totalProducts.value = res.meta.total;
    totalPages.value = res.meta.totalPages;
  } catch (err: any) {
    toast.error('Error', err.message || 'Failed to load products');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchProducts()]);
});

// Watch filters to reset page and refetch
watch([selectedCategory, selectedStatus], () => {
  currentPage.value = 1;
  fetchProducts();
});

let searchDebounce: NodeJS.Timeout;
watch(search, () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    currentPage.value = 1;
    fetchProducts();
  }, 350);
});

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchProducts();
};

const navigateToCreate = () => {
  router.push('/catalog/products/create');
};

const navigateToEdit = (id: string) => {
  router.push(`/catalog/products/${id}/edit`);
};

const promptDelete = (product: AdminProduct) => {
  productToDelete.value = product;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!productToDelete.value) return;
  isDeleting.value = true;
  try {
    await productsApi.deleteProduct(productToDelete.value.id);
    toast.success('Archived', `Product "${productToDelete.value.name}" has been archived.`);
    showDeleteModal.value = false;
    productToDelete.value = null;
    await fetchProducts();
  } catch (err: any) {
    toast.error('Delete Failed', err.message || 'Could not delete product');
  } finally {
    isDeleting.value = false;
  }
};

const getStatusVariant = (status: ProductStatus) => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'DRAFT':
      return 'secondary';
    case 'ARCHIVED':
      return 'danger';
    case 'OUT_OF_STOCK':
      return 'warning';
    default:
      return 'default';
  }
};

const formatCurrency = (paise: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(paise / 100);
};
</script>

<template>
  <div class="p-6 md:p-8 space-y-6 mx-auto">
    <!-- Top Navigation / Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">Product Catalog</h1>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            {{ totalProducts }} items
          </span>
        </div>
        <p class="text-xs text-slate-500 font-medium mt-1">
          Manage master SKUs, variant matrices, dynamic JSONB specs, and real-time inventory
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Switch to Categories View -->
        <AppButton variant="secondary" size="md" @click="router.push('/catalog/categories')">
          <Layers class="w-4 h-4" />
          <span>Categories Tree</span>
        </AppButton>

        <!-- New Product Full-Page View Navigation -->
        <AppButton variant="primary" size="md" @click="navigateToCreate">
          <Plus class="w-4 h-4" />
          <span>New Product</span>
        </AppButton>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
      <!-- Search Input -->
      <div class="w-full md:w-80">
        <AppInput
          v-model="search"
          placeholder="Search products by name or SKU..."
          class="w-full"
        >
          <template #prefix>
            <Search class="w-4 h-4 text-slate-400" />
          </template>
        </AppInput>
      </div>

      <!-- Filters -->
      <div class="w-full md:w-auto flex flex-wrap items-center gap-3">
        <!-- Category Filter -->
        <div class="w-48">
          <AppSelect
            v-model="selectedCategory"
            placeholder="All Categories"
            :options="[
              { label: 'All Categories', value: '' },
              ...categories.map(c => ({ label: c.name, value: c.id }))
            ]"
          />
        </div>

        <!-- Status Filter -->
        <div class="w-40">
          <AppSelect
            v-model="selectedStatus"
            placeholder="All Statuses"
            :options="[
              { label: 'All Statuses', value: '' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Archived', value: 'ARCHIVED' },
              { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
            ]"
          />
        </div>
      </div>
    </div>

    <!-- Data Table Container -->
    <AppDataTable
      :columns="tableColumns"
      :items="products"
      :loading="loading"
      empty-text="No products match your search criteria."
    >
      <!-- Product Column (Thumbnail + Name + Slug + Tags) -->
      <template #cell(product)="{ item }">
        <div class="flex items-center gap-3.5 py-1">
          <div class="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
            <img
              v-if="item.images && item.images.length > 0"
              :src="item.images[0].url"
              :alt="item.name"
              class="w-full h-full object-cover"
            />
            <Package v-else class="w-6 h-6 text-slate-300" />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span
                class="font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer truncate text-sm"
                @click="navigateToEdit(item.id)"
              >
                {{ item.name }}
              </span>
              <span v-if="item.is_featured" class="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[10px] font-extrabold border border-amber-200 shrink-0">
                Featured
              </span>
            </div>
            <p class="text-xs text-slate-400 font-mono mt-0.5 truncate">/{{ item.slug }}</p>
          </div>
        </div>
      </template>

      <!-- Category Column -->
      <template #cell(category)="{ item }">
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-slate-700">
            {{ item.category?.name || 'Uncategorized' }}
          </span>
          <span v-if="item.brand" class="text-[11px] text-slate-400">
            Brand: {{ item.brand.name }}
          </span>
        </div>
      </template>

      <!-- Price Column -->
      <template #cell(price)="{ item }">
        <div class="flex flex-col">
          <span class="text-sm font-bold text-slate-900">
            {{ formatCurrency(item.base_price_in_paise) }}
          </span>
          <span
            v-if="item.compare_at_price_in_paise && item.compare_at_price_in_paise > item.base_price_in_paise"
            class="text-[11px] text-slate-400 line-through"
          >
            {{ formatCurrency(item.compare_at_price_in_paise) }}
          </span>
        </div>
      </template>

      <!-- Stock / Inventory Column -->
      <template #cell(stock)="{ item }">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-1.5">
            <span
              :class="[
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold',
                (item.total_stock ?? 0) > 10
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : (item.total_stock ?? 0) > 0
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
              ]"
            >
              {{ item.total_stock ?? 0 }} in stock
            </span>
          </div>
          <span class="text-[11px] text-slate-500 font-medium">
            {{ item.variants_count || 1 }} variant{{ (item.variants_count || 1) > 1 ? 's' : '' }}
          </span>
        </div>
      </template>

      <!-- Status Column -->
      <template #cell(status)="{ item }">
        <AppBadge :variant="getStatusVariant(item.status)" size="sm">
          {{ item.status }}
        </AppBadge>
      </template>

      <!-- Actions Column -->
      <template #cell(actions)="{ item }">
        <div class="flex items-center justify-end gap-1.5">
          <button
            type="button"
            class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Edit Product"
            @click="navigateToEdit(item.id)"
          >
            <Edit2 class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Archive Product"
            @click="promptDelete(item)"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </template>

      <!-- Pagination Footer -->
      <template #footer>
        <div class="flex items-center justify-between w-full text-xs text-slate-500 font-medium">
          <span>
            Showing <strong class="text-slate-800">{{ (currentPage - 1) * limit + 1 }}</strong> to
            <strong class="text-slate-800">{{ Math.min(currentPage * limit, totalProducts) }}</strong> of
            <strong class="text-slate-800">{{ totalProducts }}</strong> results
          </span>

          <div class="flex items-center gap-2">
            <AppButton
              variant="secondary"
              size="xs"
              :disabled="currentPage === 1"
              @click="handlePageChange(currentPage - 1)"
            >
              Previous
            </AppButton>
            <span class="px-2 font-bold text-slate-700">{{ currentPage }} / {{ totalPages || 1 }}</span>
            <AppButton
              variant="secondary"
              size="xs"
              :disabled="currentPage >= totalPages"
              @click="handlePageChange(currentPage + 1)"
            >
              Next
            </AppButton>
          </div>
        </div>
      </template>
    </AppDataTable>

    <!-- Delete Confirmation Modal -->
    <AppModal
      v-model="showDeleteModal"
      title="Archive Product"
      confirm-text="Archive Product"
      confirm-variant="danger"
      :loading="isDeleting"
      @confirm="confirmDelete"
    >
      <p class="text-sm text-slate-600">
        Are you sure you want to archive <strong>"{{ productToDelete?.name }}"</strong>? This product will be marked as archived and removed from storefront catalog listings.
      </p>
    </AppModal>
  </div>
</template>
