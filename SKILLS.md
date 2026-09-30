# AGENTS.md — AI Agent Operating Guide

This file governs **how** any AI coding agent (Antigravity IDE assistant, or any
other AI pair-programmer used on this project) must behave while working in this
repository. It covers process, decision-making, and conduct. For **code-level**
standards (folder structure, naming, styling, SEO, performance, etc.), see
`RULES.md` — this file and that one are meant to be read together.

---

## 1. Priority of Instructions

When instructions conflict, resolve in this order:

1. **Explicit instruction in the current task/prompt** (from a human)
2. **AGENTS.md** (this file) — process & behavior
3. **RULES.md** — code standards & architecture
4. **Official framework/library docs** and idiomatic defaults (Next.js, React, TS)
5. **General industry best practice**

If a human instruction conflicts with RULES.md or AGENT.md, the agent should
**flag the conflict** in its response rather than silently overriding the
project's standards.

---

## 2. Project Snapshot

- **Type:** E-commerce web application
- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Design:** UI/theme is already finalized by the client — the agent's job is
  to implement it faithfully, not to redesign or restyle it
- **Delivery model:** AI-accelerated development — most implementation work is
  driven through prompts inside Antigravity IDE
- **Goal:** Production-grade, scalable, SEO-friendly, fast-loading storefront,
  delivered quickly without sacrificing code quality

---

## 3. Agent Responsibilities

The agent is expected to act like a disciplined senior engineer, not just an
autocomplete tool:

- Understand the existing codebase before adding to it
- Follow RULES.md without being reminded on every prompt
- Keep the codebase consistent — same patterns, same conventions, no "one-off"
  solutions
- Proactively flag when a request will create technical debt, duplicate
  functionality, or break an existing pattern
- Write code that a human reviewer can understand and maintain, not just code
  that works

---

## 4. Standard Workflow for Every Task

1. **Understand**
   - Re-read the relevant section(s) of RULES.md for the type of work
   - Check `components/`, `hooks/`, `lib/`, `types/` for existing building
     blocks before creating new ones
2. **Plan**
   - Identify which files will be added/changed
   - Note any ambiguity or missing information (API shape, business rule, etc.)
3. **Implement**
   - Follow RULES.md conventions exactly (naming, folder placement, typing,
     styling approach)
   - Reuse existing components/hooks/utilities — don't duplicate logic
   - Keep the change scoped to the task at hand
4. **Verify**
   - Code type-checks and lints cleanly
   - No console errors/warnings introduced
   - Checked at mobile, tablet, and desktop breakpoints per the Responsive
     Design section of RULES.md — tablet is verified explicitly, not assumed
   - SEO metadata considered for any new page/route
5. **Document**
   - Add inline comments for non-obvious logic
   - Update a local `README.md` if a new pattern or module is introduced

---

## 5. Do

- Check for existing components/hooks/utils before creating new ones
- Ask for clarification when a request is ambiguous or conflicts with
  RULES.md, rather than guessing silently
- Keep pull requests / changes scoped to a single task — no unrelated
  refactors bundled in
- Type everything: props, API responses, function signatures
- Explain non-obvious decisions with a short comment
- Default to Server Components; only opt into Client Components when
  interactivity genuinely requires it
- Treat performance and SEO as requirements, not afterthoughts, on every page

## 6. Don't

- Don't introduce a new library or pattern that duplicates something that
  already exists in the project without flagging it first
- Don't hardcode content, prices, or copy that should come from an API/CMS/config
- Don't silence ESLint or TypeScript errors to "make it work" — fix the root
  cause
- Don't commit secrets, API keys, or `.env` files
- Don't alter the client's finalized design/theme without explicit instruction
- Don't trust client-side values for anything that affects price, stock, or
  order totals — always re-verify server-side

---

## 7. When the Agent Should Ask Instead of Assume

Stop and ask a clarifying question (don't guess) when:

- The shape or source of data (API/CMS/backend) isn't defined for the task
- Business logic is ambiguous (pricing rules, discounts, tax, inventory,
  shipping calculation)
- A request conflicts with RULES.md or an existing pattern in the codebase
- The task touches **payments, authentication, or personal user data**

For everything else, make the most reasonable, RULES.md-compliant choice and
state the assumption in the response so a human can correct it quickly.

---

## 8. Prompting Guidance (for the team directing the AI)

To get consistent output from the agent:

- Reference exact file paths when asking for a change (e.g. "update
  `components/features/product/ProductCard.tsx`")
- Keep one feature or fix per prompt where possible
- State the acceptance criteria — what "done" looks like for this task
- Point the agent to the relevant RULES.md section for the type of work
  (e.g. "follow the SEO section for this page")
- For bug fixes, include the exact error/behavior, not just "it's broken"

---

## 9. Commit & PR Expectations

See the **Git & Commits** section in `RULES.md` for branch naming and commit
message format. In short: one logical change per commit, Conventional Commits
format, and a PR description that states *what* changed and *why*.

---

## 10. Source of Truth

If RULES.md and the live codebase ever disagree (e.g. RULES.md says use
Zustand but the codebase has since standardized on something else), the agent
should point out the discrepancy rather than picking one silently — this file
and RULES.md should be updated to match reality as the project evolves.
