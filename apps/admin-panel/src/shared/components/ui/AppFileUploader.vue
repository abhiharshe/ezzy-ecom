<script setup lang="ts">
import { ref } from 'vue';
import { UploadCloud, FileUp, AlertCircle } from 'lucide-vue-next';
import AppButton from './AppButton.vue';

interface Props {
  accept?: string;
  multiple?: boolean;
  maxSizeInMb?: number;
  label?: string;
  helperText?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif',
  multiple: true,
  maxSizeInMb: 10,
  label: 'Upload Media',
  helperText: 'PNG, JPG, WebP, SVG or GIF up to 10MB',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'files-selected', files: File[]): void;
  (e: 'error', message: string): void;
}>();

const isDragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const errorMessage = ref<string | null>(null);

const triggerFileDialog = () => {
  if (props.disabled) return;
  fileInputRef.value?.click();
};

const validateAndEmitFiles = (fileList: FileList | File[]) => {
  errorMessage.value = null;
  const files = Array.from(fileList);
  const validFiles: File[] = [];

  const maxBytes = props.maxSizeInMb * 1024 * 1024;
  const acceptedTypes = props.accept.split(',').map((t) => t.trim().toLowerCase());

  for (const file of files) {
    if (file.size > maxBytes) {
      errorMessage.value = `File "${file.name}" exceeds the maximum size of ${props.maxSizeInMb}MB.`;
      emit('error', errorMessage.value);
      continue;
    }

    if (props.accept && props.accept !== '*/*') {
      const isTypeValid = acceptedTypes.some((type) => {
        if (type.endsWith('/*')) {
          const mainType = type.split('/')[0];
          return file.type.startsWith(`${mainType}/`);
        }
        return file.type.toLowerCase() === type || file.name.toLowerCase().endsWith(type.replace('.', ''));
      });

      if (!isTypeValid) {
        errorMessage.value = `File "${file.name}" has an unsupported format.`;
        emit('error', errorMessage.value);
        continue;
      }
    }

    validFiles.push(file);
  }

  if (validFiles.length > 0) {
    emit('files-selected', validFiles);
  }

  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

const handleFileInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    validateAndEmitFiles(target.files);
  }
};

const handleDragOver = (event: DragEvent) => {
  if (props.disabled) return;
  event.preventDefault();
  event.stopPropagation();
  isDragging.value = true;
};

const handleDragLeave = (event: DragEvent) => {
  if (props.disabled) return;
  event.preventDefault();
  event.stopPropagation();
  isDragging.value = false;
};

const handleDrop = (event: DragEvent) => {
  if (props.disabled) return;
  event.preventDefault();
  event.stopPropagation();
  isDragging.value = false;

  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    validateAndEmitFiles(event.dataTransfer.files);
  }
};
</script>

<template>
  <div class="w-full flex flex-col gap-2">
    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="handleFileInputChange"
    />

    <!-- Drop Zone -->
    <div
      :class="[
        'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer select-none flex flex-col items-center justify-center gap-3',
        isDragging
          ? 'border-indigo-600 bg-indigo-50/70 scale-[1.005] shadow-md'
          : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400',
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
      ]"
      @click="triggerFileDialog"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- Icon Bubble -->
      <div
        :class="[
          'w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-200 shadow-xs',
          isDragging
            ? 'bg-indigo-600 text-white scale-110'
            : 'bg-white text-indigo-600 border border-slate-200',
        ]"
      >
        <UploadCloud v-if="isDragging" class="w-7 h-7 animate-pulse" />
        <FileUp v-else class="w-7 h-7" />
      </div>

      <!-- Text & Prompt -->
      <div class="space-y-1">
        <p class="text-sm font-bold text-slate-800">
          <span class="text-indigo-600 hover:text-indigo-700 underline underline-offset-2">Click to browse</span> or drag & drop files here
        </p>
        <p class="text-xs text-slate-500 font-medium">
          {{ helperText }}
        </p>
      </div>

      <!-- Button Trigger (Size MD per guidelines) -->
      <AppButton
        type="button"
        variant="secondary"
        size="md"
        class="mt-1 pointer-events-none"
      >
        <FileUp class="w-4 h-4" />
        <span>Browse Files</span>
      </AppButton>
    </div>

    <!-- Error Alert -->
    <div
      v-if="errorMessage"
      class="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200"
    >
      <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>
