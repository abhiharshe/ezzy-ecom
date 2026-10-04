<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ChevronDown, Check, Search, X } from 'lucide-vue-next';

export interface SelectOption {
  label: string;
  value: string | number | boolean | null;
  disabled?: boolean;
  icon?: any;
}

interface Props {
  modelValue?: string | number | boolean | null;
  options: SelectOption[] | string[];
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  labelClassName?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  options: () => [],
  label: '',
  placeholder: 'Select an option...',
  searchPlaceholder: 'Search options...',
  searchable: false,
  clearable: false,
  clearLabel: 'Clear selection',
  disabled: false,
  required: false,
  error: '',
  hint: '',
  size: 'md',
  className: '',
  labelClassName: '',
  loading: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any): void;
  (e: 'search', query: string): void;
}>();

const isOpen = ref(false);
const searchQuery = ref('');
const dropdownRef = ref<HTMLElement | null>(null);

// Normalize options to SelectOption[]
const normalizedOptions = computed<SelectOption[]>(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt };
    }
    return opt;
  });
});

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) {
    return normalizedOptions.value;
  }
  const q = searchQuery.value.toLowerCase().trim();
  return normalizedOptions.value.filter((opt) =>
    opt.label.toLowerCase().includes(q)
  );
});

const selectedOption = computed(() => {
  return normalizedOptions.value.find((opt) => opt.value === props.modelValue);
});

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = '';
  }
};

const selectOption = (opt: SelectOption) => {
  if (opt.disabled) return;
  emit('update:modelValue', opt.value);
  emit('change', opt.value);
  isOpen.value = false;
  searchQuery.value = '';
};

const clearSelection = (e: MouseEvent) => {
  e.stopPropagation();
  emit('update:modelValue', null);
  emit('change', null);
};

const handleSearchInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  searchQuery.value = val;
  emit('search', val);
};

// Close on outside click
const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div ref="dropdownRef" class="relative flex flex-col gap-1.5 w-full">
    <!-- Optional Label -->
    <div v-if="label" class="flex items-center justify-between">
      <label :class="['text-xs font-bold text-slate-800 flex items-center gap-1 select-none', labelClassName]">
        {{ label }}
        <span v-if="required" class="text-red-500 font-bold">*</span>
      </label>
    </div>

    <!-- Select Trigger Button -->
    <button
      type="button"
      :disabled="disabled"
      :class="[
        'w-full bg-white border rounded-lg font-medium text-left flex items-center justify-between transition-all outline-none select-none',
        'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
        error
          ? 'border-red-500 bg-red-50/20'
          : 'border-slate-200 hover:border-slate-300',
        disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : 'cursor-pointer',
        size === 'sm' ? 'min-h-8.5 py-1 px-3 text-xs' : size === 'lg' ? 'min-h-11.5 py-2 px-4 text-base' : 'min-h-10 py-1.5 px-3.5 text-sm',
        className,
      ]"
      @click="toggleDropdown"
    >
      <div class="flex items-center gap-2 truncate pr-2">
        <component :is="selectedOption?.icon" v-if="selectedOption?.icon" class="w-4 h-4 shrink-0 text-slate-500" />
        <span
          :class="[
            'truncate',
            selectedOption ? 'text-slate-900 font-medium' : 'text-slate-400 font-normal',
          ]"
        >
          {{ selectedOption?.label || placeholder }}
        </span>
      </div>

      <div class="flex items-center gap-1 shrink-0 ml-1.5">
        <!-- Clear Button -->
        <span
          v-if="clearable && selectedOption && !disabled"
          class="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Clear"
          @click="clearSelection"
        >
          <X class="w-3.5 h-3.5" />
        </span>

        <!-- Chevron Icon -->
        <ChevronDown
          :class="[
            'w-4 h-4 text-slate-400 transition-transform duration-200',
            isOpen ? 'rotate-180 text-indigo-600' : '',
          ]"
        />
      </div>
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute top-[calc(100%+4px)] left-0 w-full z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 max-h-64 flex flex-col overflow-hidden animate-fade-in"
      >
        <!-- Search Field inside Dropdown -->
        <div v-if="searchable" class="px-2.5 pb-2 pt-1 border-b border-slate-100">
          <div class="relative flex items-center">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              :value="searchQuery"
              :placeholder="searchPlaceholder"
              class="w-full bg-slate-50 border border-slate-200 rounded-md py-1 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              @input="handleSearchInput"
              @click.stop
            />
          </div>
        </div>

        <!-- Options List -->
        <div class="overflow-y-auto flex-1 p-1 space-y-0.5">
          <!-- Clear Option if clearable -->
          <button
            v-if="clearable && selectedOption"
            type="button"
            class="w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-md flex items-center gap-2 cursor-pointer font-medium italic"
            @click="clearSelection"
          >
            <X class="w-3.5 h-3.5" />
            <span>{{ clearLabel }}</span>
          </button>

          <!-- List of Options -->
          <button
            v-for="opt in filteredOptions"
            :key="String(opt.value)"
            type="button"
            :disabled="opt.disabled"
            :class="[
              'w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer select-none',
              opt.value === modelValue
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
              opt.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
            ]"
            @click="selectOption(opt)"
          >
            <div class="flex items-center gap-2 truncate">
              <component :is="opt.icon" v-if="opt.icon" class="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span class="truncate">{{ opt.label }}</span>
            </div>
            <Check v-if="opt.value === modelValue" class="w-4 h-4 text-indigo-600 shrink-0 ml-2" />
          </button>

          <!-- Empty State -->
          <div
            v-if="filteredOptions.length === 0"
            class="py-4 text-center text-xs text-slate-400"
          >
            No matching options found
          </div>
        </div>
      </div>
    </Transition>

    <!-- Error or Hint Message -->
    <p v-if="error" class="text-xs font-semibold text-red-600 animate-fade-in">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-xs text-slate-500">
      {{ hint }}
    </p>
  </div>
</template>
