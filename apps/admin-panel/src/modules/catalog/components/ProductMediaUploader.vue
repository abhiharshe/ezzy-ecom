<script setup lang="ts">
import { ref } from 'vue';
import type { ProductImage } from '../types/product.types';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppFileUploader from '@/shared/components/ui/AppFileUploader.vue';
import { Trash2, Star, Link as LinkIcon, Plus, Image as ImageIcon, Eye } from 'lucide-vue-next';

interface Props {
  modelValue: ProductImage[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: ProductImage[]): void;
}>();

const showUrlInput = ref(false);
const newImageUrl = ref('');
const newImageAlt = ref('');

// Handle files selected or dropped from AppFileUploader
const handleFilesSelected = (files: File[]) => {
  const current = [...props.modelValue];

  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        current.push({
          url: dataUrl,
          alt_text: file.name.replace(/\.[^/.]+$/, ''),
          sort_order: current.length,
          is_primary: current.length === 0,
        });
        emit('update:modelValue', [...current]);
      }
    };
    reader.readAsDataURL(file);
  });
};

const addFromUrl = () => {
  const url = newImageUrl.value.trim();
  if (!url) return;

  const current = [...props.modelValue];
  current.push({
    url,
    alt_text: newImageAlt.value.trim() || undefined,
    sort_order: current.length,
    is_primary: current.length === 0,
  });

  emit('update:modelValue', current);
  newImageUrl.value = '';
  newImageAlt.value = '';
  showUrlInput.value = false;
};

const removeImage = (idx: number) => {
  const current = [...props.modelValue];
  const wasPrimary = current[idx].is_primary;
  current.splice(idx, 1);
  if (wasPrimary && current.length > 0) {
    current[0].is_primary = true;
  }
  emit('update:modelValue', current);
};

const setPrimary = (idx: number) => {
  const current = props.modelValue.map((img, i) => ({
    ...img,
    is_primary: i === idx,
  }));
  emit('update:modelValue', current);
};

const updateAltText = (idx: number, alt: string) => {
  const current = [...props.modelValue];
  current[idx] = { ...current[idx], alt_text: alt };
  emit('update:modelValue', current);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Drag and Drop Zone -->
    <AppFileUploader
      label="Drop product images here"
      helperText="Supports high-resolution PNG, JPG, WebP, SVG (up to 10MB each)"
      @files-selected="handleFilesSelected"
    />

    <!-- Option to toggle URL entry -->
    <div class="flex items-center justify-between pt-1">
      <p class="text-xs text-slate-500 font-medium">
        {{ modelValue.length }} image{{ modelValue.length === 1 ? '' : 's' }} uploaded
      </p>
      <button
        type="button"
        class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 cursor-pointer"
        @click="showUrlInput = !showUrlInput"
      >
        <LinkIcon class="w-3.5 h-3.5" />
        <span>{{ showUrlInput ? 'Hide URL input' : 'Or add via image URL' }}</span>
      </button>
    </div>

    <!-- Collapsible URL Input Bar -->
    <div
      v-if="showUrlInput"
      class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-3"
    >
      <input
        v-model="newImageUrl"
        type="url"
        placeholder="Enter image URL (https://...)..."
        class="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
        @keydown.enter.prevent="addFromUrl"
      />
      <input
        v-model="newImageAlt"
        type="text"
        placeholder="Alt text / caption..."
        class="sm:w-56 px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
        @keydown.enter.prevent="addFromUrl"
      />
      <AppButton size="md" variant="secondary" @click="addFromUrl">
        <Plus class="w-4 h-4" />
        <span>Add URL</span>
      </AppButton>
    </div>

    <!-- Uploaded Media Grid -->
    <div
      v-if="modelValue.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <div
        v-for="(img, idx) in modelValue"
        :key="idx"
        class="group relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs flex flex-col transition-all hover:shadow-md"
      >
        <!-- Thumbnail Preview -->
        <div class="relative w-full aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
          <img
            :src="img.url"
            :alt="img.alt_text || 'Product image'"
            class="w-full h-full object-cover"
          />

          <!-- Primary Badge -->
          <div
            v-if="img.is_primary"
            class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold shadow-xs flex items-center gap-1"
          >
            <Star class="w-3 h-3 fill-current text-amber-300" />
            <span>Primary</span>
          </div>

          <!-- Hover Action Overlay -->
          <div class="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
            <button
              v-if="!img.is_primary"
              type="button"
              class="px-2.5 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
              title="Set as primary"
              @click="setPrimary(idx)"
            >
              <Star class="w-3.5 h-3.5 text-amber-500" />
              <span>Make Primary</span>
            </button>
            <button
              type="button"
              class="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm cursor-pointer"
              title="Delete image"
              @click="removeImage(idx)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Alt Text Editable Input Footer -->
        <div class="p-2.5 bg-slate-50/70 border-t border-slate-100">
          <input
            :value="img.alt_text ?? ''"
            type="text"
            placeholder="Image caption / alt text..."
            class="w-full px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500"
            @input="updateAltText(idx, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
