import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from '../dto/category/create-category.dto';
import { UpdateCategoryDto } from '../dto/category/update-category.dto';

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  attribute_schema: unknown;
  return_window_days: number;
  sort_order: number;
  parent_id: string | null;
  children: CategoryTreeNode[];
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const slug =
      dto.slug ||
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const existing = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Category with slug "${slug}" already exists`);
    }

    if (dto.parent_id) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parent_id },
      });
      if (!parent || parent.deleted_at) {
        throw new NotFoundException('Parent category not found');
      }
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        parent_id: dto.parent_id || null,
        description: dto.description,
        image_url: dto.image_url,
        attribute_schema: (dto.attribute_schema ?? []) as any,
        return_window_days: dto.return_window_days ?? 7,
        sort_order: dto.sort_order ?? 0,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: { deleted_at: null, is_active: true },
      orderBy: { sort_order: 'asc' },
    });
  }

  async getTree(): Promise<CategoryTreeNode[]> {
    const categories = await this.prisma.category.findMany({
      where: { deleted_at: null, is_active: true },
      orderBy: { sort_order: 'asc' },
    });

    const categoryMap = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    // Initialize nodes
    for (const cat of categories) {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image_url: cat.image_url,
        attribute_schema: cat.attribute_schema,
        return_window_days: cat.return_window_days,
        sort_order: cat.sort_order,
        parent_id: cat.parent_id,
        children: [],
      });
    }

    // Build hierarchy
    for (const cat of categories) {
      const node = categoryMap.get(cat.id)!;
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        categoryMap.get(cat.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
      },
    });

    if (!category || category.deleted_at) {
      throw new NotFoundException(`Category "${slug}" not found`);
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category || category.deleted_at) {
      throw new NotFoundException('Category not found');
    }

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException(`Category with slug "${dto.slug}" already exists`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        parent_id: dto.parent_id === undefined ? undefined : dto.parent_id,
        description: dto.description,
        image_url: dto.image_url,
        attribute_schema: dto.attribute_schema !== undefined ? (dto.attribute_schema as any) : undefined,
        return_window_days: dto.return_window_days,
        sort_order: dto.sort_order,
        is_active: dto.is_active,
      },
    });
  }

  async delete(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: { where: { deleted_at: null } } },
    });

    if (!category || category.deleted_at) {
      throw new NotFoundException('Category not found');
    }

    if (category.children.length > 0) {
      throw new ConflictException(
        'Cannot delete category with active subcategories. Move or delete subcategories first.'
      );
    }

    return this.prisma.category.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
