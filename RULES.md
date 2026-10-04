# RULES.md — Code & Architecture Standards

These are the binding technical standards for this project. Any AI agent or
human contributor must follow these unless a task explicitly overrides one
(see priority order in `AGENT.md`).

## Table of Contents

1. Tech Stack
2. Folder Structure
3. Naming Conventions
4. Component Architecture
5. State Management
6. Styling (Tailwind)
7. TypeScript
8. Data Fetching & API
9. SEO
10. Performance
11. Accessibility
12. Error Handling & Logging
13. Testing
14. Git & Commits
15. Environment & Secrets
16. Code Quality Tooling
17. Security
18. Documentation
19. Responsive Design (Mobile & Tablet)

---

## 1. Tech Stack

- **Framework:** Next.js 14+ (App Router, React Server Components)
- **Language:** TypeScript, `strict` mode
- **Styling:** Tailwind CSS
- **Client state:** Zustand (one store per domain — cart, wishlist, UI)
- **Server/cache state:** TanStack Query
- **Forms & validation:** React Hook Form + Zod
- **Package manager:** pick one (npm / pnpm) and stay consistent across the repo

---

## 2. Folder Structure

Feature-based, scalable structure — `app/` stays thin (routing only), logic
lives in `components/` and `lib/`:

---
src/
  app/                          # Routing only — no business logic here
    (marketing)/                # Route groups for layout separation
    (shop)/
      products/
        [slug]/page.tsx
      cart/page.tsx
      checkout/page.tsx
    api/                        # Route handlers
    layout.tsx
    page.tsx
    sitemap.ts
    robots.ts
    globals.css
  components/
    ui/                         # Generic reusable primitives (Button, Input, Modal)
    common/                     # Shared composite pieces (Header, Footer, Navbar)
    features/                   # Feature-specific, connected components
      product/
      cart/
      checkout/
      auth/
  hooks/                        # Custom React hooks
  lib/
    api/                        # Centralized fetch/API client logic
    utils/                      # Pure helper functions
    validators/                 # Zod schemas
  store/                        # Zustand stores
  types/                        # Shared TS types/interfaces
  constants/
  config/                       # site config, nav config, typed env access
public/
  images/
  icons/
---

**Rules:**

- One component per file; filename matches component name (PascalCase)
- `app/` files are limited to `page`, `layout`, `loading`, `error`, `route`,
  `sitemap`, `robots` — no business logic
- `ui/` components must have zero knowledge of business/domain logic
  (no imports from `store/` or `lib/api/`)
- Colocate a component's test file next to it
- For **CRUD** operations alawys use a dedicated **VIEW** for it , instead of using a modal to perform CRUD operations, unless explicitly mentioned by the user.
- For **List View** always use the **Table Component** which is already present in the shared ui library.
- Always prefere the components present in **"src/components/ui"**, **"src/components/common"**, ***"src/shared/components/ui"**, **"src/shared/components/common"** directories, if not found then create a new component in the same directory.
- Never use max width classes like for root containers or div elements at i
- Buttons should always of size "md",  shall use size "sm" only when explicitly mentioned by the user. 

---

## 3. Naming Conventions

| Type | Convention | Example |
| --- | --- | --- |
| Components | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase, `use` prefix | `useCart.ts` |
| Utilities/functions | camelCase | `formatPrice.ts` |
| Types/interfaces | PascalCase, no `I` prefix | `Product`, `CartItem` |
| Constants | UPPER_SNAKE_CASE | `MAX_CART_ITEMS` |
| Folders | kebab-case | `product-details/` |
| Boolean vars/props | is/has/should prefix | `isLoading`, `hasDiscount` |

---

## 4. Component Architecture

- **Default to Server Components.** Add `"use client"` only when the
  component needs state, effects, event handlers, or browser APIs.
- Keep components single-responsibility; split when a file exceeds
  ~150–200 lines.
- `ui/` = dumb/presentational (no data fetching, no store access).
  `features/` = connected components that read from stores/queries.
- Every component's props are typed via an explicit `interface`, never
  inferred from destructuring alone and never `any`.
- Colocate small subcomponents only used by one parent in the same folder.

---

## 5. State Management

- **Local UI state** (toggle, input value, open/closed) → `useState` /
  `useReducer`
- **Cross-component client state** (cart, wishlist, filters, UI state shared
  across the tree) → Zustand, one store per domain
- **Server state** (products, categories, orders, user profile) → TanStack
  Query — never duplicate server data into a Zustand store
- Avoid prop drilling past 2 levels — lift to context or a store instead
- Don't create global state for something only used within one component subtree

---

## 6. Styling (Tailwind)

- Pull all colors, spacing, font sizes, and breakpoints from
  `tailwind.config.ts`, extended to match the client's finalized design
  system — avoid arbitrary hex/px values in JSX
- Use a `cn()`/`clsx` + `tailwind-merge` utility for conditional class logic
- Mobile-first responsive classes throughout
- Extract a repeated class combination into a component rather than stacking
  `@apply` rules
- Order classes logically: layout → spacing → sizing → typography → color →
  state (`hover:`, `focus:`, `disabled:`)

---

## 7. TypeScript

- `strict: true` in `tsconfig.json`; no `any` — use `unknown` and narrow it
  if the type genuinely isn't known yet
- Explicit return types on all exported functions
- Domain types (`Product`, `Order`, `User`, `CartItem`, etc.) live once in
  `types/` and are imported everywhere — single source of truth
- Use Zod schemas to validate all external data (API responses, form input),
  and infer TypeScript types from the schema (`z.infer<typeof schema>`)
  wherever possible to avoid maintaining two definitions

---

## 8. Data Fetching & API

- Server Components fetch data directly with `async/await` — avoid
  client-side fetching unless the data is user-interaction-driven
- Route Handlers (`app/api/**/route.ts`) expose endpoints the client
  genuinely needs to call
- All fetch logic is centralized in `lib/api/` — components never call
  `fetch` directly
- Set Next.js caching (`fetch` cache option / `revalidate`) deliberately per
  data type: catalog/category data can be cached and revalidated; cart,
  inventory, and checkout data should not be
- Provide `loading.tsx` / `error.tsx` per route segment, plus local
  loading/error states for client-driven interactions

---

## 9. SEO

- Use the Next.js Metadata API (`generateMetadata`) on every page — title,
  description, Open Graph, Twitter card
- Product/category pages generate metadata dynamically from real product data
- Semantic HTML: one `<h1>` per page, proper heading hierarchy, `<main>`,
  `<nav>`, `<article>` used correctly
- `next/image` for all images with descriptive `alt` text (empty `alt` only
  for purely decorative images)
- JSON-LD structured data for `Product`, `BreadcrumbList`, and `Organization`
  schemas
- `app/sitemap.ts` and `app/robots.ts` kept current as routes are added
- Canonical URLs on paginated/filterable listing pages
- Clean, readable URLs (`/products/blue-cotton-shirt`, not
  query-string-heavy IDs)

---

## 10. Performance

- `next/image` everywhere, with correct `sizes`; `priority` reserved for the
  above-the-fold hero image only
- `next/font` for font loading — no manual Google Fonts `<link>` tags
- Static generation (SSG) or ISR for product/category pages where content
  doesn't need to be per-request fresh; SSR reserved for cart, checkout, and
  personalized views
- Heavy client-only components (modals, rich text editors, charts)
  code-split with `next/dynamic`
- Minimize `"use client"` boundaries to keep the client JS bundle small
- Use `useMemo`/`React.memo` only where profiling shows a real cost — don't
  memoize by default
- Lazy-load below-the-fold sections and images
- Watch bundle size via `next build` output / `@next/bundle-analyzer`
- Target Core Web Vitals: **LCP < 2.5s, CLS < 0.1, INP < 200ms**

---

## 11. Accessibility

- All interactive elements are keyboard-navigable with visible focus states
- Form fields have proper `label`/`aria-*` associations
- Color contrast meets WCAG AA against the finalized theme
- All meaningful images have alt text; decorative images use empty alt

---

## 12. Error Handling & Logging

- `error.tsx` boundary per route segment
- User-facing errors show friendly messages — never raw stack traces or API
  error payloads
- API error handling/shape is centralized in `lib/api/`, consistent across
  all endpoints
- Errors are never swallowed silently — logged through a centralized logger
  utility

---

## 13. Testing

- **Unit/component tests:** Jest + React Testing Library, for components,
  hooks, and utilities
- **E2E tests:** Playwright, covering critical flows — browse → add to cart
  → checkout
- Minimum required coverage: cart logic, checkout flow, and any
  pricing/discount calculations
- Every new non-trivial component ships with at least a render test and a
  core-interaction test

---

## 14. Git & Commits

- Branch naming: `feature/<short-name>`, `fix/<short-name>`,
  `chore/<short-name>`
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`,
  `chore:`, `test:`
- One logical change per commit / pull request
- PR description states what changed and why, not just what files changed

---

## 15. Environment & Secrets

- All secrets live in `.env.local`, never committed; `.env.example` is kept
  up to date with every new variable
- Env vars are accessed only through a typed `config/env.ts` wrapper — no
  scattered `process.env.X` calls throughout the codebase
- `NEXT_PUBLIC_` prefix used only for variables that genuinely must be
  available client-side

---

## 16. Code Quality Tooling

- ESLint (Next.js + TypeScript + Tailwind plugin) must pass with zero errors
  before merge
- Prettier for formatting, with a Tailwind class-sorting plugin
- Husky + lint-staged pre-commit hook runs lint, format, and type-check on
  staged files

---

## 17. Security

- All user input is validated server-side with Zod — client-side validation
  is a UX nicety, not a security boundary
- Pricing, discount calculation, and stock checks are always re-verified
  server-side, never trusted from the client
- Auth/session handling follows Next.js best practice — prefer httpOnly
  cookies over storing tokens in `localStorage`

---

## 18. Documentation

- Any non-trivial feature folder gets a short `README.md` if its logic isn't
  self-evident from the code
- Complex business logic gets inline comments explaining **why**, not just
  what the code does

---

## 19. Responsive Design (Mobile & Tablet)

Every page and component is built and verified for mobile, tablet, and
desktop — never "shrunk" from a desktop-only build.

### Breakpoint Strategy

- Use Tailwind's default breakpoints unless the client's design system
  specifies custom ones:
  - `sm`: 640px, `md`: 768px, `lg`: 1024px, `xl`: 1280px, `2xl`: 1536px
- Treat three distinct target ranges, not two:
  - **Mobile:** < 640px
  - **Tablet:** 640px – 1023px (`sm`–`lg`)
  - **Desktop:** ≥ 1024px
- Tablet is not "a bigger phone" or "a smaller desktop" — verify tablet
  layouts explicitly rather than assuming inherited mobile/desktop styles
  look right at `md`/`lg`.

### Mobile-First Implementation

- Write unprefixed (mobile) classes first, then layer `sm:`/`md:`/`lg:`
  overrides — never build desktop-first with `max-*` overrides.

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

### Layout & Navigation

- Primary nav collapses to a drawer/hamburger below `lg`; tablet gets its own
  explicit check rather than assuming the mobile drawer or desktop nav
  "just works" at `md`.
- Product grids: 1 column mobile → 2 columns tablet → 3–4 columns desktop
  (adjust to match the client's finalized design).
- Avoid fixed pixel widths/heights on containers — use `max-w-*`, `w-full`,
  and `flex`/`grid` so layouts reflow instead of breaking.
- Prevent horizontal scroll: avoid unconstrained `w-screen` inside padded
  containers; test every new page at 320px width minimum.

### Touch & Interaction

- All tappable targets (buttons, links, form controls) are at least
  44×44px on mobile/tablet.
- No hover-only interactions for anything required to complete a task (e.g.
  a "quick add to cart" shown only on `:hover` needs a tap-accessible
  equivalent).
- Sticky/floating elements (add-to-cart bar, filter button) reserve safe
  spacing so they never cover content, and drop back to static positioning
  at `lg` if the desktop layout doesn't need them.

### Typography & Spacing

- Form input font size stays at or above 16px — smaller sizes trigger
  unwanted zoom on iOS Safari.
- Use a responsive type scale for headings (`text-base sm:text-lg
  lg:text-xl`) rather than one fixed size at every breakpoint.
- Reduce vertical spacing/padding at mobile (`py-6 md:py-10 lg:py-16`)
  rather than reusing desktop spacing everywhere.

### Images & Media

- Always pass a `sizes` prop to `next/image` matching the actual rendered
  width at each breakpoint — don't let mobile devices download the
  desktop-sized image.
- Use art direction (different crops per breakpoint) for hero/banner images
  where the client's design calls for it.

### Forms & Checkout

- Use correct `inputMode`/`type` attributes (`inputMode="numeric"`,
  `type="email"`, `type="tel"`) so mobile keyboards match the expected input.
- The checkout flow is tested end-to-end at mobile width first — it's the
  highest-traffic, highest-drop-off flow on the site.

### Testing Requirements

- Every new page/component is checked at minimum widths: **375px**
  (mobile), **768px** (tablet portrait), **1024px** (tablet landscape/small
  desktop), **1440px** (desktop).
- Use browser dev tools responsive mode plus at least one real device or
  accurate emulator pass before marking a UI task complete.
- Add viewport-specific Playwright assertions for critical flows (mobile
  nav, checkout) where practical.

### Checklist before marking a UI task done

- [ ] No horizontal scroll at 320px width
- [ ] Layout explicitly verified at tablet (`md`/`lg`), not just mobile and desktop
- [ ] All tap targets ≥ 44×44px
- [ ] Images use responsive `sizes`, no oversized downloads on mobile
- [ ] Form inputs ≥16px font size (no iOS zoom-on-focus)
- [ ] Sticky/floating UI doesn't obscure content at any breakpoint
