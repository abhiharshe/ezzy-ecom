<script setup lang="ts">
export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface Props {
  columns: TableColumn[];
  rows: Record<string, any>[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});
</script>

<template>
  <div class="data-table-container">
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :style="{ textAlign: col.align || 'left', width: col.width }"
              class="table-th"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="loading-row">
            <td :colspan="columns.length" class="loading-cell">
              <div class="table-spinner"></div>
              <span>Loading data...</span>
            </td>
          </tr>
          <tr v-else-if="rows.length === 0" class="empty-row">
            <td :colspan="columns.length" class="empty-cell">
              <span>No items found</span>
            </td>
          </tr>
          <tr v-else v-for="(row, rowIndex) in rows" :key="rowIndex" class="table-tr">
            <td
              v-for="col in columns"
              :key="col.key"
              :style="{ textAlign: col.align || 'left' }"
              class="table-td"
            >
              <slot :name="`cell(${col.key})`" :row="row" :value="row[col.key]" :index="rowIndex">
                {{ row[col.key] ?? '—' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.data-table-container {
  width: 100%;
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
  width: 100%;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.table-th {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-light);
  white-space: nowrap;
}

.table-tr {
  transition: background-color 0.12s ease;
  border-bottom: 1px solid var(--border-light);
}

.table-tr:last-child {
  border-bottom: none;
}

.table-tr:hover {
  background-color: #fafbfc;
}

.table-td {
  padding: 14px 16px;
  font-size: 13px;
  color: var(--text-main);
  vertical-align: middle;
}

.loading-cell, .empty-cell {
  padding: 40px 16px;
  text-align: center;
  color: var(--text-subtle);
  font-size: 13px;
}

.table-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: var(--primary-600);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin: 0 auto 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
