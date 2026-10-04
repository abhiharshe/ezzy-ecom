<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Category, CategoryTreeNode } from '../types/category.types';
import { categoriesApi } from '../api/categories.api';
import { useToast } from '@/shared/composables/useToast';
import AppButton from '@/shared/components/ui/AppButton.vue';
import CategoryTreeItem from '../components/CategoryTreeItem.vue';
import {
  FolderTree,
  Plus,
  Search,
  RefreshCw,
  Layers,
  CheckCircle2,
  FolderOpen,
  ChevronsDown,
  ChevronsUp,
  AlertTriangle,
} from 'lucide-vue-next';

const router = useRouter();
const toast = useToast();

const loading = ref(true);
const flatCategories = ref<Category[]>([]);
const categoryTree = ref<CategoryTreeNode[]>([]);
const searchQuery = ref('');
const expandedIds = ref<Set<string>>(new Set());

// Delete Confirmation
const isDeleteModalOpen = ref(false);
const categoryToDelete = ref<CategoryTreeNode | null>(null);
const deleting = ref(false);

const loadData = async () => {
  loading.value = true;
  try {
    const [tree, flat] = await Promise.all([
      categoriesApi.getCategoryTree(true),
      categoriesApi.getCategories(true),
    ]);
    categoryTree.value = tree;
    flatCategories.value = flat;

    // Expand top-level roots by default
    if (expandedIds.value.size === 0) {
      tree.forEach((root) => expandedIds.value.add(root.id));
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load categories';
    toast.error(message);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

// Stats
const totalCount = computed(() => flatCategories.value.length);
const rootCount = computed(() => categoryTree.value.length);
const activeCount = computed(() => flatCategories.value.filter((c) => c.is_active).length);
const variantCategoriesCount = computed(() => {
  return flatCategories.value.filter((c) => {
    return Array.isArray(c.attribute_schema) && c.attribute_schema.some((a) => a.isVariant);
  }).length;
});

// Toggle expand/collapse
const handleToggle = (id: string) => {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id);
  } else {
    expandedIds.value.add(id);
  }
};

const expandAll = () => {
  const allIds = new Set<string>();
  const collect = (nodes: CategoryTreeNode[]) => {
    for (const n of nodes) {
      allIds.add(n.id);
      if (n.children && n.children.length > 0) {
        collect(n.children);
      }
    }
  };
  collect(categoryTree.value);
  expandedIds.value = allIds;
};

const collapseAll = () => {
  expandedIds.value = new Set();
};

// Filtered Tree for Search
const filterTree = (nodes: CategoryTreeNode[], query: string): CategoryTreeNode[] => {
  if (!query) return nodes;
  const q = query.toLowerCase().trim();

  const result: CategoryTreeNode[] = [];

  for (const node of nodes) {
    const matchesSelf =
      node.name.toLowerCase().includes(q) ||
      node.slug.toLowerCase().includes(q) ||
      (node.description && node.description.toLowerCase().includes(q));

    const matchingChildren = node.children ? filterTree(node.children, query) : [];

    if (matchesSelf || matchingChildren.length > 0) {
      // Auto-expand matches
      expandedIds.value.add(node.id);
      result.push({
        ...node,
        children: matchingChildren,
      });
    }
  }

  return result;
};

const displayedTree = computed(() => {
  return filterTree(categoryTree.value, searchQuery.value);
});

// Navigation Actions (Full Page CRUD)
const openCreateRoot = () => {
  router.push('/catalog/categories/create');
};

const openAddChild = (parentId: string) => {
  router.push({
    path: '/catalog/categories/create',
    query: { parentId },
  });
};

const openEdit = (category: CategoryTreeNode) => {
  router.push(`/catalog/categories/${category.id}/edit`);
};

// Delete Actions
const promptDelete = (category: CategoryTreeNode) => {
  categoryToDelete.value = category;
  isDeleteModalOpen.value = true;
};

const confirmDelete = async () => {
  if (!categoryToDelete.value) return;

  deleting.value = true;
  try {
    await categoriesApi.deleteCategory(categoryToDelete.value.id);
    toast.success(`Category "${categoryToDelete.value.name}" deleted successfully`);
    isDeleteModalOpen.value = false;
    categoryToDelete.value = null;
    loadData();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete category';
    toast.error(message);
  } finally {
    deleting.value = false;
  }
};
</script>

<template>
  <div class="categories-view">
    <!-- View Header -->
    <div class="view-header">
      <div>
        <nav class="breadcrumb">
          <span>Catalog</span>
          <span class="separator">/</span>
          <span class="active">Categories & Schemas</span>
        </nav>
        <h1 class="view-title">
          Category Taxonomy & Blueprints
        </h1>
        <p class="view-desc">
          Organize infinite-nesting category trees, configure return escrow windows, and define dynamic attribute schemas.
        </p>
      </div>

      <div class="header-actions">
        <AppButton
          type="button"
          variant="secondary"
          size="md"
          :loading="loading"
          @click="loadData"
        >
          <template #icon>
            <RefreshCw :size="15" />
          </template>
          Refresh
        </AppButton>

        <AppButton
          type="button"
          variant="primary"
          size="md"
          @click="openCreateRoot"
        >
          <template #icon>
            <Plus :size="16" />
          </template>
          New Root Category
        </AppButton>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrap purple">
          <FolderTree :size="18" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalCount }}</span>
          <span class="stat-label">Total Categories</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap blue">
          <FolderOpen :size="18" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ rootCount }}</span>
          <span class="stat-label">Root Branches</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap green">
          <CheckCircle2 :size="18" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ activeCount }}</span>
          <span class="stat-label">Active & Public</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap coral">
          <Layers :size="18" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ variantCategoriesCount }}</span>
          <span class="stat-label">Variant-Enabled</span>
        </div>
      </div>
    </div>

    <!-- Explorer Panel -->
    <div class="explorer-panel">
      <!-- Toolbar -->
      <div class="panel-toolbar">
        <div class="search-box">
          <Search :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Search categories by name, slug or description..."
          />
        </div>

        <div class="toolbar-buttons">
          <button
            type="button"
            class="tool-btn"
            title="Expand all branches"
            @click="expandAll"
          >
            <ChevronsDown :size="15" />
            <span>Expand All</span>
          </button>

          <button
            type="button"
            class="tool-btn"
            title="Collapse all branches"
            @click="collapseAll"
          >
            <ChevronsUp :size="15" />
            <span>Collapse All</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="state-container">
        <div class="spinner"></div>
        <p class="state-text">Loading category taxonomy...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="categoryTree.length === 0" class="state-container">
        <FolderTree :size="48" class="state-icon" />
        <h3 class="state-title">No categories created yet</h3>
        <p class="state-sub">
          Get started by building your product category tree. Categories drive vendor product specifications and storefront search filters.
        </p>
        <AppButton
          type="button"
          variant="primary"
          size="md"
          @click="openCreateRoot"
        >
          <template #icon>
            <Plus :size="16" />
          </template>
          Create First Category
        </AppButton>
      </div>

      <!-- Search Empty State -->
      <div v-else-if="displayedTree.length === 0" class="state-container">
        <Search :size="40" class="state-icon" />
        <h3 class="state-title">No matching categories found</h3>
        <p class="state-sub">
          No categories match the search query "<strong>{{ searchQuery }}</strong>".
        </p>
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          @click="searchQuery = ''"
        >
          Clear Filter
        </AppButton>
      </div>

      <!-- Tree Listing -->
      <div v-else class="tree-container">
        <CategoryTreeItem
          v-for="rootNode in displayedTree"
          :key="rootNode.id"
          :node="rootNode"
          :level="0"
          :expanded-ids="expandedIds"
          @toggle="handleToggle"
          @edit="openEdit"
          @add-child="openAddChild"
          @delete="promptDelete"
        />
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="isDeleteModalOpen"
      class="delete-backdrop"
      @click.self="isDeleteModalOpen = false"
    >
      <div class="delete-card animate-scale-up">
        <div class="delete-icon-wrap">
          <AlertTriangle :size="24" />
        </div>
        <h3 class="delete-title">Delete Category?</h3>
        <p class="delete-desc">
          Are you sure you want to delete
          <strong>"{{ categoryToDelete?.name }}"</strong>?
          <span v-if="categoryToDelete?.children && categoryToDelete.children.length > 0" class="delete-warning">
            Warning: This category has {{ categoryToDelete.children.length }} subcategories.
          </span>
        </p>

        <div class="delete-actions">
          <AppButton
            type="button"
            variant="ghost"
            :disabled="deleting"
            @click="isDeleteModalOpen = false"
          >
            Cancel
          </AppButton>
          <AppButton
            type="button"
            variant="danger"
            :loading="deleting"
            @click="confirmDelete"
          >
            Yes, Delete
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.categories-view {
  padding: 24px 32px 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.breadcrumb .separator {
  color: #cbd5e1;
}

.breadcrumb .active {
  color: #7c3aed;
  font-weight: 500;
}

.view-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.view-desc {
  font-size: 13.5px;
  color: #64748b;
  margin: 0;
  max-width: 650px;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.stat-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrap.purple {
  background-color: #f5f3ff;
  color: #7c3aed;
}

.stat-icon-wrap.blue {
  background-color: #eff6ff;
  color: #2563eb;
}

.stat-icon-wrap.green {
  background-color: #ecfdf5;
  color: #059669;
}

.stat-icon-wrap.coral {
  background-color: #fff1f2;
  color: #e11d48;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

/* Explorer Panel */
.explorer-panel {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.panel-toolbar {
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background-color: #f8fafc;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 460px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input {
  width: 100%;
  height: 38px;
  padding: 0 12px 0 36px;
  font-size: 13px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background-color: #ffffff;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  border-color: #7c3aed;
}

.toolbar-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-btn:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

/* States */
.state-container {
  padding: 64px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.state-icon {
  color: #94a3b8;
  margin-bottom: 12px;
}

.state-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 6px 0;
}

.state-sub {
  font-size: 13px;
  color: #64748b;
  max-width: 440px;
  margin: 0 0 18px 0;
  line-height: 1.5;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tree-container {
  display: flex;
  flex-direction: column;
}

/* Delete Modal */
.delete-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.delete-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.delete-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #fef2f2;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.delete-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}

.delete-desc {
  font-size: 13.5px;
  color: #64748b;
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.delete-warning {
  display: block;
  margin-top: 8px;
  color: #dc2626;
  font-weight: 500;
  font-size: 12.5px;
}

.delete-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.animate-scale-up {
  animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
