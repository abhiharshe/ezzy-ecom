import { createRouter, createWebHistory } from 'vue-router';
import { authRoutes } from '@/modules/auth/auth.routes';
import { dashboardRoutes } from '@/modules/command/dashboard/dashboard.routes';
import { profileRoutes } from '@/modules/profile/profile.routes';
import { catalogRoutes } from '@/modules/catalog/catalog.routes';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const routes = [
  {
    path: '/',
    redirect: '/overview',
  },
  ...authRoutes,
  ...dashboardRoutes,
  ...profileRoutes,
  ...catalogRoutes,
  {
    path: '/:pathMatch(.*)*',
    redirect: '/overview',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const token = localStorage.getItem('accessToken');
  const isAuthenticated = !!token;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.meta.guestOnly && isAuthenticated) {
    next({ name: 'overview' });
  } else {
    next();
  }
});

export default router;
