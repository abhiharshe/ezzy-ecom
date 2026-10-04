<script setup lang="ts">
interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  headerClass?: string;
}

interface Props {
  columns: Column[];
  items: any[];
  loading?: boolean;
  emptyText?: string;
}

withDefaults(defineProps<Props>(), {
  items: () => [],
  loading: false,
  emptyText: 'No records found',
});
</script>

<template>
  <div class="w-full overflow-hidden border border-slate-200 rounded-xl bg-white shadow-xs">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <!-- Header -->
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50/70">
            <th
              v-for="col in columns"
              :key="col.key"
              :style="{ width: col.width }"
              :class="[
                'px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider select-none',
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                col.headerClass,
              ]"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody class="divide-y divide-slate-100 text-sm font-medium text-slate-800">
          <!-- Loading Row -->
          <tr v-if="loading">
            <td :colspan="columns.length" class="py-12 text-center text-slate-400">
              <div class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-xs font-semibold">Loading data...</span>
              </div>
            </td>
          </tr>

          <!-- Data Rows -->
          <template v-else-if="items.length > 0">
            <tr
              v-for="(item, idx) in items"
              :key="item.id || idx"
              class="hover:bg-slate-50/80 transition-colors"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                :class="[
                  'px-4 py-3.5',
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                ]"
              >
                <slot :name="`cell(${col.key})`" :item="item" :value="item[col.key]">
                  {{ item[col.key] }}
                </slot>
              </td>
            </tr>
          </template>

          <!-- Empty Row -->
          <tr v-else>
            <td :colspan="columns.length" class="py-12 text-center text-slate-400">
              <slot name="empty">
                <p class="text-xs font-medium">{{ emptyText }}</p>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Optional Footer / Pagination slot -->
    <div
      v-if="$slots.footer"
      class="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
