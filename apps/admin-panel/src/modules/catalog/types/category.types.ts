export type AttributeType = 'text' | 'select' | 'multi-select' | 'boolean' | 'number';

export interface AttributeSchemaItem {
  name: string;
  type: AttributeType;
  options?: string[];
  isVariant: boolean; // True if this attribute differentiates purchasable inventory SKUs (e.g. Size, Color)
  isRequired?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  attribute_schema: AttributeSchemaItem[];
  return_window_days: number;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  parent_id?: string | null;
  description?: string;
  image_url?: string;
  attribute_schema?: AttributeSchemaItem[];
  return_window_days?: number;
  sort_order?: number;
  is_active?: boolean;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;
