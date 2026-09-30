import type { RouteRecordRaw } from 'vue-router';

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/overview',
    name: 'overview',
    component: () => import('./views/OverviewView.vue'),
    meta: { layout: 'admin', requiresAuth: true },
  },
];
