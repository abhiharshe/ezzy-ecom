import { httpClient } from '@/core/http/client';
import { API_ENDPOINTS } from '@/core/http/endpoints';
import type {
  Category,
  CategoryTreeNode,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types/category.types';

export const categoriesApi = {
  async getCategories(includeInactive = true): Promise<Category[]> {
    return httpClient.get(API_ENDPOINTS.CATALOG.CATEGORIES, {
      params: { includeInactive: String(includeInactive) },
    });
  },

  async getCategoryTree(includeInactive = true): Promise<CategoryTreeNode[]> {
    return httpClient.get(API_ENDPOINTS.CATALOG.CATEGORY_TREE, {
      params: { includeInactive: String(includeInactive) },
    });
  },

  async getCategoryBySlug(slug: string): Promise<Category> {
    return httpClient.get(API_ENDPOINTS.CATALOG.PRODUCT_BY_SLUG(slug));
  },

  async createCategory(data: CreateCategoryInput): Promise<Category> {
    return httpClient.post(API_ENDPOINTS.CATALOG.CATEGORIES, data);
  },

  async updateCategory(id: string, data: UpdateCategoryInput): Promise<Category> {
    return httpClient.patch(`${API_ENDPOINTS.CATALOG.CATEGORIES}/${id}`, data);
  },

  async deleteCategory(id: string): Promise<{ message: string }> {
    return httpClient.delete(`${API_ENDPOINTS.CATALOG.CATEGORIES}/${id}`);
  },
};
