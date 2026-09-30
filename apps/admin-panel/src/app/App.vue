<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AdminLayout from '@/layouts/AdminLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';

const route = useRoute();

const currentLayout = computed(() => {
  return route.meta.layout === 'auth' ? AuthLayout : AdminLayout;
});
</script>

<template>
  <component :is="currentLayout">
    <router-view />
  </component>
</template>

<style>
/* Global App Shell Styles */
#root {
  min-height: 100vh;
  width: 100%;
}
</style>
