<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ChevronDown, Check, Search, X } from 'lucide-vue-next';

export interface MultiSelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface Props {
  modelValue?: (string | number)[];
  options: MultiSelectOption[] | string[];
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  labelClassName?: string;
  maxDisplayTags?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  options: () => [],
  label: '',
  placeholder: 'Select options...',
  searchPlaceholder: 'Search items...',
  searchable: true,
  disabled: false,
  required: false,
  error: '',
  hint: '',
  size: 'md',
  className: '',
  labelClassName: '',
  maxDisplayTags: 2,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: (string | number)[]): void;
  (e: 'change', value: (string | number)[]): void;
}>();

const isOpen = ref(false);
const searchQuery = ref('');
const dropdownRef = ref<HTMLElement | null>(null);

const normalizedOptions = computed<MultiSelectOption[]>(() => {
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

const selectedLabels = computed(() => {
  return normalizedOptions.value.filter((opt) =>
    props.modelValue.includes(opt.value)
  );
});

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = '';
  }
};

const toggleOption = (val: string | number) => {
  const current = [...props.modelValue];
  const index = current.indexOf(val);
  if (index > -1) {
    current.splice(index, 1);
  } else {
    current.push(val);
  }
  emit('update:modelValue', current);
  emit('change', current);
};

const removeTag = (val: string | number, e: MouseEvent) => {
  e.stopPropagation();
  const current = props.modelValue.filter((item) => item !== val);
  emit('update:modelValue', current);
  emit('change', current);
};

const clearAll = (e: MouseEvent) => {
  e.stopPropagation();
  emit('update:modelValue', []);
  emit('change', []);
};

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
    <!-- Label -->
    <div v-if="label" class="flex items-center justify-between">
      <label :class="['text-xs font-bold text-slate-800 flex items-center gap-1 select-none', labelClassName]">
        {{ label }}
        <span v-if="required" class="text-red-500 font-bold">*</span>
      </label>
    </div>

    <!-- Trigger -->
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
        size === 'sm' ? 'min-h-8.5 py-1 px-2.5 text-xs' : size === 'lg' ? 'min-h-11.5 py-1.5 px-4 text-base' : 'min-h-10 py-1.5 px-3 text-sm',
        className,
      ]"
      @click="toggleDropdown"
    >
      <div class="flex items-center gap-1.5 flex-wrap flex-1 min-w-0 pr-2">
        <template v-if="selectedLabels.length > 0">
          <span
            v-for="opt in selectedLabels.slice(0, maxDisplayTags)"
            :key="String(opt.value)"
            class="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-md text-xs"
          >
            <span class="truncate max-w-[120px]">{{ opt.label }}</span>
            <span
              class="hover:text-indigo-900 cursor-pointer p-0.5 rounded"
              @click="removeTag(opt.value, $event)"
            >
              <X class="w-3 h-3" />
            </span>
          </span>

          <span
            v-if="selectedLabels.length > maxDisplayTags"
            class="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded text-xs"
          >
            +{{ selectedLabels.length - maxDisplayTags }} more
          </span>
        </template>
        <span v-else class="text-slate-400 font-normal">
          {{ placeholder }}
        </span>
      </div>

      <div class="flex items-center gap-1 shrink-0 ml-1.5">
        <span
          v-if="modelValue.length > 0 && !disabled"
          class="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Clear all"
          @click="clearAll"
        >
          <X class="w-3.5 h-3.5" />
        </span>
        <ChevronDown
          :class="[
            'w-4 h-4 text-slate-400 transition-transform duration-200',
            isOpen ? 'rotate-180 text-indigo-600' : '',
          ]"
        />
      </div>
    </button>

    <!-- Dropdown -->
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
        <!-- Search -->
        <div v-if="searchable" class="px-2.5 pb-2 pt-1 border-b border-slate-100">
          <div class="relative flex items-center">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="searchPlaceholder"
              class="w-full bg-slate-50 border border-slate-200 rounded-md py-1 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              @click.stop
            />
          </div>
        </div>

        <!-- Options -->
        <div class="overflow-y-auto flex-1 p-1 space-y-0.5">
          <button
            v-for="opt in filteredOptions"
            :key="String(opt.value)"
            type="button"
            :disabled="opt.disabled"
            :class="[
              'w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer select-none',
              modelValue.includes(opt.value)
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
              opt.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
            ]"
            @click="toggleOption(opt.value)"
          >
            <span class="truncate">{{ opt.label }}</span>
            <div
              :class="[
                'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                modelValue.includes(opt.value)
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-slate-300 bg-white',
              ]"
            >
              <Check v-if="modelValue.includes(opt.value)" class="w-3 h-3 text-white stroke-[3]" />
            </div>
          </button>

          <div
            v-if="filteredOptions.length === 0"
            class="py-4 text-center text-xs text-slate-400"
          >
            No matching options found
          </div>
        </div>
      </div>
    </Transition>

    <!-- Error or Hint -->
    <p v-if="error" class="text-xs font-semibold text-red-600 animate-fade-in">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-xs text-slate-500">
      {{ hint }}
    </p>
  </div>
</template>
