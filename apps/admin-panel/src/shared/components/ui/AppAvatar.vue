<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  name: 'User',
  size: 'md',
});

const initials = computed(() => {
  if (!props.name) return 'U';
  const parts = props.name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return props.name.substring(0, 2).toUpperCase();
});
</script>

<template>
  <div class="avatar" :class="`avatar--${size}`">
    <img v-if="src" :src="src" :alt="name" class="avatar-img" />
    <span v-else class="avatar-fallback">{{ initials }}</span>
  </div>
</template>

<style scoped>
.avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #ffffff;
  font-weight: 700;
  user-select: none;
  flex-shrink: 0;
}

.avatar--sm {
  width: 28px;
  height: 28px;
  font-size: 11px;
}

.avatar--md {
  width: 34px;
  height: 34px;
  font-size: 12px;
}

.avatar--lg {
  width: 48px;
  height: 48px;
  font-size: 16px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  line-height: 1;
}
</style>
