import type { RouteRecordRaw } from 'vue-router';

export const profileRoutes: RouteRecordRaw[] = [
  {
    path: '/profile',
    name: 'profile',
    component: () => import('./views/ProfileView.vue'),
    meta: { layout: 'admin', requiresAuth: true },
  },
];
