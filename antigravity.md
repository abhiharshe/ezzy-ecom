# Antigravity-IDE Context: Micro Service Based E-commerce Application

## 1. Project Overview
I am a solo developer building a "Micro Service Based E-commerce Application". The system handles physical products, multi-warehouse inventory, multi-vendor capabilities, and affiliate marketing. It leverages AI-assisted tools for automated SEO and semantic product discovery.

The project is structured as an Nx Monorepo containing four main applications:
1. **Storefront (Website)** - Customer-facing e-commerce site.
2. **Admin Panel** - Super-admin dashboard for platform management.
3. **Vendor Portal** - Dashboard for third-party sellers to manage their catalogs and orders.
4. **Backend Core** - Centralized API and webhook handler.

## 2. Tech Stack & Architecture
Do not suggest or switch to technologies outside of this stack without explicit permission.

*   **Monorepo:** Nx (`apps/` and `libs/` structure).
*   **Storefront:** Next.js (App Router) - deployed to Vercel.
*   **Admin & Vendor Portals:** Vue 3 (Composition API), Vite, PrimeVue, Pinia, TanStack Vue Query - deployed to Vercel.
*   **Backend:** NestJS (TypeScript) - deployed to a containerized environment.
*   **Database:** PostgreSQL with Prisma ORM.
*   **Message Broker / Background Jobs:** Upstash QStash (Kafka was explicitly dropped to support serverless architectures). Uses HTTP webhooks for event-driven workflows.
*   **Code Sharing:** TypeScript interfaces and Prisma generated clients must be stored in the Nx `libs/` folder and shared across the Vue, Next.js, and NestJS apps.

## 3. Core Features & Domain Logic
*   **Multi-Warehouse Inventory:** Products have variants. Variable attributes (size, color, material) are stored in a PostgreSQL JSONB field. Inventory is mapped by `variant_id` + `warehouse_id`.
*   **Race Condition Prevention:** The backend must use database-level atomic updates or distributed locks to prevent double-booking during checkout.
*   **Affiliate Marketing:** Click attribution is managed via time-to-live (TTL) caches. A ledger table tracks multi-tier commissions triggered by order completion events via QStash.
*   **AI-Powered SEO:** Background workers (triggered via QStash) automatically generate JSON-LD metadata, optimized titles, and alt-text whenever a vendor updates a product.
*   **Semantic Search:** Product discovery utilizes vector similarity (e.g., `pgvector`) for natural language queries.

## 4. Exclusions & Future Scope
*   **Delivery System:** Currently out of scope. Do not write routing, logistics, or delivery driver code.
*   **Kafka:** Replaced by Upstash QStash to accommodate Vercel's serverless constraints. Do not write Kafka producer/consumer code.

## 5. Antigravity-IDE Rules of Engagement
*   **Architectural Pre-computation:** Before modifying the Nx dependency graph or creating cross-app features, outline the proposed changes and wait for my approval.
*   **Strict Typing:** Utilize end-to-end type safety. Never use `any`; use `unknown` and type-guard appropriately.
*   **Nx Command Safety:** When generating new apps or libraries within Nx, always use the `--name` flag (e.g., `nx g @nx/nest:app --name=service-name`).
*   **Framework Paradigms:** Keep functions small. Ensure Vue components use the Composition API (`<script setup>`). Ensure NestJS utilizes decorators, DTOs, and `class-validator`.