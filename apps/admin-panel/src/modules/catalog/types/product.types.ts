import type { AttributeSchemaItem, Category } from './category.types';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'OUT_OF_STOCK';

export interface ProductImage {
  id?: string;
  url: string;
  alt_text?: string | null;
  sort_order?: number;
  is_primary?: boolean;
}

export interface ProductStockLevel {
  id?: string;
  warehouse_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface AdminProductVariant {
  id?: string;
  product_id?: string;
  sku: string;
  barcode?: string | null;
  weight_in_grams?: number | null;
  price_in_paise: number; // in paise from backend
  price_in_rupees?: number; // helper for UI
  compare_at_price_in_paise?: number | null;
  compare_at_price_in_rupees?: number | null;
  variant_attributes: Record<string, string | number | boolean>;
  is_active: boolean;
  stock_levels?: ProductStockLevel[];
  initial_stock?: number;
}

export interface AdminProduct {
  id: string;
  vendor_id: string;
  category_id: string;
  brand_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  attributes: Record<string, string | number | boolean>;
  status: ProductStatus;
  base_price_in_paise: number;
  base_price_in_rupees?: number;
  compare_at_price_in_paise?: number | null;
  compare_at_price_in_rupees?: number | null;
  cost_price_in_paise?: number | null;
  cost_price_in_rupees?: number | null;
  tags: string[];
  is_featured: boolean;
  total_stock?: number;
  reserved_stock?: number;
  variants_count?: number;
  category?: Category;
  brand?: { id: string; name: string; slug: string } | null;
  vendor?: { id: string; store_name: string; email: string } | null;
  variants?: AdminProductVariant[];
  images?: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface AdminProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  vendor_id?: string;
  status?: ProductStatus;
  sortBy?: 'created_at' | 'name' | 'base_price_in_paise';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedAdminProductsResponse {
  data: AdminProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateAdminProductInput {
  name: string;
  category_id: string;
  vendor_id?: string;
  brand_id?: string;
  slug?: string;
  description?: string;
  attributes?: Record<string, string | number | boolean>;
  base_price_in_paise: number;
  compare_at_price_in_paise?: number;
  cost_price_in_paise?: number;
  tags?: string[];
  is_featured?: boolean;
  status?: ProductStatus;
  variants?: {
    sku: string;
    barcode?: string;
    weight_in_grams?: number;
    price_in_paise: number;
    compare_at_price_in_paise?: number;
    variant_attributes: Record<string, string | number | boolean>;
    is_active?: boolean;
    initial_stock?: number;
  }[];
  images?: {
    url: string;
    alt_text?: string;
    sort_order?: number;
    is_primary?: boolean;
  }[];
}

export type UpdateAdminProductInput = Partial<CreateAdminProductInput>;
