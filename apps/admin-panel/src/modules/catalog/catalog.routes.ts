import type { RouteRecordRaw } from 'vue-router';

export const catalogRoutes: RouteRecordRaw[] = [
  {
    path: '/catalog',
    redirect: '/catalog/products',
  },
  {
    path: '/catalog/products',
    name: 'catalog-products',
    component: () => import('./views/ProductsListView.vue'),
    meta: { layout: 'admin', requiresAuth: true },
  },
  {
    path: '/catalog/products/create',
    name: 'catalog-products-create',
    component: () => import('./views/ProductFormView.vue'),
    meta: { layout: 'admin', requiresAuth: true },
  },
  {
    path: '/catalog/products/:id/edit',
    name: 'catalog-products-edit',
    component: () => import('./views/ProductFormView.vue'),
    meta: { layout: 'admin', requiresAuth: true },
  },
  {
    path: '/catalog/categories',
    name: 'catalog-categories',
    component: () => import('./views/CategoriesView.vue'),
    meta: { layout: 'admin', requiresAuth: true },
  },
  {
    path: '/catalog/categories/create',
    name: 'catalog-categories-create',
    component: () => import('./views/CategoryFormView.vue'),
    meta: { layout: 'admin', requiresAuth: true },
  },
  {
    path: '/catalog/categories/:id/edit',
    name: 'catalog-categories-edit',
    component: () => import('./views/CategoryFormView.vue'),
    meta: { layout: 'admin', requiresAuth: true },
  },
];

