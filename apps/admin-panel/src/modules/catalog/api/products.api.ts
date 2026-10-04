import { httpClient } from '@/core/http/client';
import { API_ENDPOINTS } from '@/core/http/endpoints';
import type {
  AdminProduct,
  AdminProductsQuery,
  PaginatedAdminProductsResponse,
  CreateAdminProductInput,
  UpdateAdminProductInput,
  ProductStatus,
} from '../types/product.types';

export const productsApi = {
  async getProducts(query?: AdminProductsQuery): Promise<PaginatedAdminProductsResponse> {
    const params: Record<string, string | number> = {};
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;
    if (query?.search) params.search = query.search;
    if (query?.category_id) params.category_id = query.category_id;
    if (query?.vendor_id) params.vendor_id = query.vendor_id;
    if (query?.status) params.status = query.status;
    if (query?.sortBy) params.sortBy = query.sortBy;
    if (query?.sortOrder) params.sortOrder = query.sortOrder;

    return httpClient.get(API_ENDPOINTS.CATALOG.ADMIN_PRODUCTS, { params });
  },

  async getProductById(id: string): Promise<AdminProduct> {
    return httpClient.get(API_ENDPOINTS.CATALOG.ADMIN_PRODUCT_DETAIL(id));
  },

  async createProduct(data: CreateAdminProductInput): Promise<AdminProduct> {
    return httpClient.post(API_ENDPOINTS.CATALOG.ADMIN_PRODUCTS, data);
  },

  async updateProduct(id: string, data: UpdateAdminProductInput): Promise<AdminProduct> {
    return httpClient.patch(API_ENDPOINTS.CATALOG.ADMIN_PRODUCT_DETAIL(id), data);
  },

  async updateProductStatus(id: string, status: ProductStatus): Promise<AdminProduct> {
    return httpClient.patch(API_ENDPOINTS.CATALOG.ADMIN_PRODUCT_STATUS(id), { status });
  },

  async deleteProduct(id: string): Promise<{ message: string }> {
    return httpClient.delete(API_ENDPOINTS.CATALOG.ADMIN_PRODUCT_DETAIL(id));
  },
};
