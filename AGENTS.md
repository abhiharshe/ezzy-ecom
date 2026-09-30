# Antigravity-IDE Context: Micro Service Based E-commerce Application

## 1. Project Overview

You & user both are building a "Micro Service Based E-commerce Application". The system handles physical products, multi-warehouse inventory, multi-vendor capabilities, and affiliate marketing. It leverages AI-assisted tools for automated SEO and semantic product discovery.
User shall provide the context, business requirements and instructions, ask questions if any.

The project is structured as an Nx Monorepo containing four main applications:

1. **Storefront (Website)** - Customer-facing e-commerce site.
2. **Admin Panel** - Super-admin dashboard for platform management.
3. **Vendor Portal** - Dashboard for third-party sellers to manage their catalogs and orders.
4. **Backend Core** - Centralized API and webhook handler.

## 2. Tech Stack & Architecture

Do not suggest or switch to technologies outside of this stack without explicit permission.

1. **Monorepo:** Nx (`apps/` and `libs/` structure).
2. **Storefront:** Next.js (App Router) - deployed to Vercel.
3. **Admin & Vendor Portals:** Vue 3 (Composition API), Vite, PrimeVue, Pinia, TanStack Vue Query - deployed to Vercel.
4. **Backend:** NestJS (TypeScript) - deployed to a containerized environment.
5. **Database:** PostgreSQL with Prisma ORM.
6. **Message Broker / Background Jobs:** Upstash QStash (Kafka was explicitly dropped to support serverless architectures). Uses HTTP webhooks for event-driven workflows.
7. **Code Sharing:** TypeScript interfaces and Prisma generated clients must be stored in the Nx `libs/` folder and shared across the Vue, Next.js, and NestJS apps.

## 3. Core Features & Domain Logic

1. **Multi-Warehouse Inventory:** Products have variants. Variable attributes (size, color, material) are stored in a PostgreSQL JSONB field. Inventory is mapped by `variant_id` + `warehouse_id`.
2. **Race Condition Prevention:** The backend must use database-level atomic updates or distributed locks to prevent double-booking during checkout.
3. **Affiliate Marketing:** Click attribution is managed via time-to-live (TTL) caches. A ledger table tracks multi-tier commissions triggered by order completion events via QStash.
4. **AI-Powered SEO:** Background workers (triggered via QStash) automatically generate JSON-LD metadata, optimized titles, and alt-text whenever a vendor updates a product.
5. **Semantic Search:** Product discovery utilizes vector similarity (e.g., `pgvector`) for natural language queries.
6. **Multi-Level Categories & Schemas:** Categories use an Adjacency List pattern (`parentId` referencing itself) for infinite nesting. Each Category contains an `attributeSchema` JSON blueprint that dictates the expected attributes, filter types (e.g., 'select', 'boolean'), and whether an attribute splits inventory (`isVariant`).
7. **Product vs. Variant (JSONB Storage)**:
    **The Base Product:** The `Product` table holds the marketing shell and uses a JSONB `attributes` column to store specs identical across all variants (e.g., `{"Brand": "Nike", "Material": "Cotton"}`).
    **The Purchasable SKU:** The `ProductVariant` table holds the specific physical item, price, and barcode. It uses a JSONB `variantAttributes` column for the specific choices that define the SKU (e.g., `{"Color": "Red", "Size": "M"}`).
8. **Dynamic Filtering:**:
    Filter UI rendering is driven dynamically by the `Category.attributeSchema`.
    Database reads rely on PostgreSQL's native JSONB querying and GIN indexes via Prisma (e.g., `where: { variantAttributes: { path: ['Size'], equals: 'M' } }`). Filter state must live entirely in the URL (`useSearchParams`), not in client state managers, allowing for bookmarkable and SEO-friendly pages.

## 4. Inventory Management (V1 Single Warehouse Concept)

1. **Implementation:** For Version 1, the backend logic injects a default `DEFAULT_WAREHOUSE_ID` into all inventory transactions to speed up development. The Vendor Portal UI should only show a single "Stock" field.

## 5. Order Splitting & Payments

1. **Sub-Orders:** A customer checkout creates one parent `Order` (for payment processing) and splits into multiple `SubOrder` records grouped by `vendorId`. Vendors only see and fulfill their respective sub-orders.
2. **Payments:** Employs an escrow/holding period approach for vendor payouts to account for refunds and returns. A window of 7,10 or 30 days post-delivery is to be maintained for returns and refunds, depending on the product category. A simple webhook will be triggered on order delivery. The number of days should be configurable in the admin panel.

## 6. Authentication, RBAC, and Security

1. **Auth Strategy:** Stateless JWTs decoding to an RBAC role (`CUSTOMER`, `VENDOR`, `ADMIN`).
2. **Vendor Scoping:** All NestJS endpoints interacting with vendor data MUST securely filter by `user.vendorId` derived from the JWT to prevent cross-tenant data leaks.
3. **Media/Images:** Direct-to-S3 uploads from the Vue portals using NestJS-generated Pre-signed URLs.

## 7. Exclusions & Future Scope

1. **Delivery System:** Currently out of scope. Do not write routing, logistics, or delivery driver code.
2. **Kafka:** Replaced by Upstash QStash to accommodate Vercel's serverless constraints. Do not write Kafka producer/consumer code.

## 8. Antigravity-IDE Rules of Engagement

1. **Architectural Pre-computation:** Before modifying the Nx dependency graph or creating cross-app features, outline the proposed changes and wait for my approval.
2. **Strict Typing:** Utilize end-to-end type safety. Never use `any`; use `unknown` and type-guard appropriately.
3. **Nx Command Safety:** When generating new apps or libraries within Nx, always use the `--name` flag (e.g., `nx g @nx/nest:app --name=service-name`).
4. **Framework Paradigms:** Keep functions small. Ensure Vue components use the Composition API (`<script setup>`). Ensure NestJS utilizes decorators, DTOs, and `class-validator`.
5. **Database Migrations:** All schema changes (Prisma migrations) must be performed using `npx prisma migrate dev --name migration_name`. Ensure the migration is applied to the shared schema in the monolith, not the isolated schema in the legacy DB container.
