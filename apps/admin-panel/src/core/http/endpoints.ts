export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    UPDATE_PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  CATALOG: {
    CATEGORIES: '/categories',
    CATEGORY_TREE: '/categories/tree',
    PRODUCTS: '/products',
    PRODUCT_BY_SLUG: (slug: string) => `/products/${slug}`,
  },
  ORDERS: {
    LIST: '/orders',
    DETAIL: (id: string) => `/orders/${id}`,
  },
  AFFILIATES: {
    ADMIN_LIST: '/admin/affiliates',
    ADMIN_UPDATE_TIER: (id: string) => `/admin/affiliates/${id}/tier`,
    APPROVE_COMMISSIONS: (orderId: string) => `/admin/affiliates/orders/${orderId}/approve-commissions`,
  },
  SEARCH: {
    SEMANTIC: '/search/semantic',
    REINDEX: '/search/reindex',
  },
  SEO: {
    GENERATE_ALL: '/seo/admin/generate-all',
    PRODUCT_SEO: (id: string) => `/seo/products/${id}`,
  },
  PAYMENTS: {
    CREATE_INTENT: '/payments/create-intent',
    VERIFY: '/payments/verify',
  },
} as const;
