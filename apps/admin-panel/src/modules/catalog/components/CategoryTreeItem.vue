<script setup lang="ts">
import { computed } from 'vue';
import type { CategoryTreeNode } from '../types/category.types';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import {
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-vue-next';

interface Props {
  node: CategoryTreeNode;
  level?: number;
  expandedIds: Set<string>;
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
});

const emit = defineEmits<{
  (e: 'toggle', id: string): void;
  (e: 'edit', category: CategoryTreeNode): void;
  (e: 'add-child', parentId: string): void;
  (e: 'delete', category: CategoryTreeNode): void;
}>();

const hasChildren = computed(() => props.node.children && props.node.children.length > 0);
const isExpanded = computed(() => props.expandedIds.has(props.node.id));

const variantAttributesCount = computed(() => {
  if (!props.node.attribute_schema || !Array.isArray(props.node.attribute_schema)) return 0;
  return props.node.attribute_schema.filter((a) => a.isVariant).length;
});

const totalAttributesCount = computed(() => {
  if (!props.node.attribute_schema || !Array.isArray(props.node.attribute_schema)) return 0;
  return props.node.attribute_schema.length;
});
</script>

<template>
  <div class="tree-item-group">
    <div
      class="tree-node"
      :style="{ paddingLeft: `${Math.max(12, level * 28 + 12)}px` }"
      :class="{ 'is-root': level === 0, 'is-inactive': !node.is_active }"
    >
      <!-- Expand / Collapse chevron -->
      <button
        type="button"
        class="chevron-btn"
        :class="{ 'is-empty': !hasChildren, 'is-open': isExpanded }"
        :disabled="!hasChildren"
        @click="emit('toggle', node.id)"
      >
        <ChevronRight v-if="hasChildren" :size="16" />
        <span v-else class="empty-bullet">•</span>
      </button>

      <!-- Folder Icon -->
      <div class="node-icon" :class="{ 'is-root-icon': level === 0 }">
        <FolderOpen v-if="isExpanded && hasChildren" :size="17" />
        <Folder v-else :size="17" />
      </div>

      <!-- Category Name & Slug -->
      <div class="node-info">
        <div class="title-row">
          <span class="category-name">{{ node.name }}</span>
          <span class="category-slug">/{{ node.slug }}</span>
        </div>
        <p v-if="node.description" class="category-desc">
          {{ node.description }}
        </p>
      </div>

      <!-- Badges & Metadata -->
      <div class="node-badges">
        <!-- Return Window -->
        <span class="meta-tag return-tag" title="Escrow refund window">
          <Clock :size="12" />
          {{ node.return_window_days ?? 7 }}d return
        </span>

        <!-- Attributes count -->
        <span
          v-if="totalAttributesCount > 0"
          class="meta-tag attr-tag"
          :class="{ 'has-variant': variantAttributesCount > 0 }"
          title="Configured attribute schema"
        >
          <Layers :size="12" />
          {{ totalAttributesCount }} attrs
          <span v-if="variantAttributesCount > 0" class="variant-pill">
            {{ variantAttributesCount }} var
          </span>
        </span>

        <!-- Children count -->
        <AppBadge v-if="hasChildren" variant="blue" size="sm">
          {{ node.children.length }} sub
        </AppBadge>

        <!-- Status -->
        <AppBadge :variant="node.is_active ? 'green' : 'neutral'" size="sm">
          {{ node.is_active ? 'Active' : 'Draft' }}
        </AppBadge>
      </div>

      <!-- Action Buttons -->
      <div class="node-actions">
        <button
          type="button"
          class="action-btn btn-add"
          title="Add Subcategory under this"
          @click="emit('add-child', node.id)"
        >
          <Plus :size="15" />
          <span class="action-label">Subcategory</span>
        </button>

        <button
          type="button"
          class="action-btn btn-edit"
          title="Edit Category"
          @click="emit('edit', node)"
        >
          <Edit2 :size="15" />
        </button>

        <button
          type="button"
          class="action-btn btn-delete"
          title="Delete Category"
          @click="emit('delete', node)"
        >
          <Trash2 :size="15" />
        </button>
      </div>
    </div>

    <!-- Recursive children list -->
    <div v-if="hasChildren && isExpanded" class="tree-children">
      <CategoryTreeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :expanded-ids="expandedIds"
        @toggle="emit('toggle', $event)"
        @edit="emit('edit', $event)"
        @add-child="emit('add-child', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.tree-item-group {
  display: flex;
  flex-direction: column;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding-right: 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.15s ease;
}

.tree-node:hover {
  background-color: #f8fafc;
}

.tree-node.is-root {
  font-weight: 600;
  border-left: 3px solid transparent;
}

.tree-node.is-root:hover {
  border-left-color: #7c3aed;
}

.tree-node.is-inactive {
  opacity: 0.65;
}

.chevron-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  border-radius: 4px;
  padding: 0;
  transition: transform 0.15s ease, color 0.15s ease;
}

.chevron-btn.is-open {
  transform: rotate(90deg);
  color: #7c3aed;
}

.chevron-btn.is-empty {
  cursor: default;
  color: #cbd5e1;
}

.empty-bullet {
  font-size: 14px;
  line-height: 1;
}

.node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  flex-shrink: 0;
}

.is-root-icon {
  color: #7c3aed;
}

.node-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.category-name {
  font-size: 13.5px;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-slug {
  font-size: 12px;
  color: #94a3b8;
  font-family: monospace;
}

.category-desc {
  font-size: 11.5px;
  color: #64748b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 480px;
}

.node-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.return-tag {
  background-color: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.attr-tag {
  background-color: #f1f5f9;
  color: #334155;
}

.attr-tag.has-variant {
  background-color: #faf5ff;
  color: #6b21a8;
  border: 1px solid #e9d5ff;
}

.variant-pill {
  background-color: #7c3aed;
  color: #ffffff;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 9.5px;
  font-weight: 600;
  margin-left: 2px;
}

.node-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px;
  font-size: 11.5px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background-color: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
  color: #0f172a;
}

.action-btn.btn-add {
  color: #6d28d9;
  border-color: #ede9fe;
  background-color: #faf5ff;
}

.action-btn.btn-add:hover {
  background-color: #f3e8ff;
  border-color: #ddd6fe;
}

.action-btn.btn-delete:hover {
  background-color: #fff1f2;
  border-color: #fecdd3;
  color: #e11d48;
}

.tree-children {
  display: flex;
  flex-direction: column;
}
</style>
