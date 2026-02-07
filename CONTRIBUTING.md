# Contributing to Licor System

Thank you for your interest in contributing to Licor System! This guide will help you get up and running quickly.

---

## Table of Contents

- [Development Environment](#development-environment)
- [Code Style & Conventions](#code-style--conventions)
- [Project Conventions](#project-conventions)
- [How to Add a New Feature](#how-to-add-a-new-feature)
- [Branching Strategy](#branching-strategy)
- [Pull Requests](#pull-requests)
- [Common Tasks](#common-tasks)

---

## Development Environment

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 18.x | Runtime |
| npm | >= 9.x | Package manager |
| Git | Latest | Version control |
| VS Code | Latest | Recommended editor |

### Recommended VS Code Extensions

- **ESLint** — Linting
- **Tailwind CSS IntelliSense** — Class autocomplete
- **Prettier** — Code formatting
- **ES7+ React/Redux/React-Native snippets** — Snippets

### Setup

```bash
git clone https://github.com/ronaldmendzas/licor-system.git
cd licor-system
npm install
cp .env.local.example .env.local
# Fill in your Supabase credentials in .env.local
npm run dev
```

---

## Code Style & Conventions

### TypeScript

- **Strict mode** is enabled. No `any` types unless absolutely necessary.
- Use TypeScript interfaces from `src/types/index.ts` — never create inline types for database entities.
- All component props should be typed with interfaces.

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Pages | `page.tsx` in route folder | `src/app/ventas/page.tsx` |
| Components | `kebab-case.tsx` | `product-card.tsx` |
| Libraries | `kebab-case.ts` | `voice-ai.ts` |
| Types | `index.ts` in `types/` | `src/types/index.ts` |

### Component Pattern

Every page and component in this project is **client-side rendered**:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-store";

export default function MyPage() {
  const { products, loadAll } = useAppStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="p-6 space-y-6">
      {/* content */}
    </div>
  );
}
```

### Styling

- **Tailwind CSS v4** — No CSS modules or styled-components.
- Dark theme only — use `zinc-*` for backgrounds, `violet-*` for accents.
- Consistent spacing: `space-y-6` between sections, `gap-4` in grids.
- The custom theme is defined in `src/app/globals.css` under `@theme {}`.

### State Management

- All data flows through the **Zustand store** at `src/store/app-store.ts`.
- Never call Supabase directly from components — use store actions.
- Call `loadAll()` in each page's `useEffect` to hydrate data.

### Database

- Stock is managed by **database triggers**, not application code.
- Exception: voiding a sale manually restores stock because there's no DELETE trigger.
- Always check `supabase/schema.sql` before modifying table structures.
- If you add a new table, add it to the schema file AND update the TypeScript types.

---

## Project Conventions

### Adding a New Page

1. Create `src/app/your-page/page.tsx` with `"use client"` directive
2. Add the route to the sidebar in `src/components/navigation/side-menu.tsx`
3. Follow the existing pattern: load data via store, render with Tailwind

### Adding a New Database Table

1. Add the SQL to `supabase/schema.sql`
2. Add the TypeScript interface to `src/types/index.ts`
3. Add store actions (fetch, create, update, delete) to `src/store/app-store.ts`
4. If stock-related, add appropriate triggers

### Adding a Voice AI Intent

1. Open `src/lib/voice-ai.ts`
2. Add a new case to the `processCommand()` function
3. Add keyword patterns to the intent matching section
4. Test with the voice interface at `/voz`

### Adding a Festive Date

1. Open `src/lib/festive-dates.ts`
2. Add the date to the `FESTIVE_DATES` array
3. Include: `name`, `month`, `day`, `priority`, `emoji`, `description`, `productSuggestions`
4. For moveable dates, add to the `getMoveableDates()` function

---

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — auto-deploys to Vercel |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation only |

### Workflow

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make changes, commit
git add -A
git commit -m "feat: description of change"

# Push and create PR
git push origin feature/my-feature
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug in sales form
docs: update README
refactor: simplify voice AI parser
style: adjust card spacing
chore: update dependencies
```

---

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes with clear, atomic commits
3. Ensure `npm run build` passes with no errors
4. Run `npx tsc --noEmit` for type checking
5. Open a PR with:
   - **Title** following the commit convention
   - **Description** explaining what changed and why
   - **Screenshots** for UI changes
6. Request a review

---

## Common Tasks

### Run Type Checking

```bash
npx tsc --noEmit
```

### Run Linting

```bash
npx next lint
```

### Build for Production

```bash
npm run build
```

### Reset Local Database

Re-run the schema against your Supabase instance from the SQL Editor.

### Test Offline Mode

1. Open DevTools → Application → Service Workers
2. Check "Offline"
3. The app should show a red "Sin conexión" banner and work from IndexedDB cache

### Test Voice AI

1. Navigate to `/voz`
2. Click the microphone button
3. Speak a command in Spanish (e.g., _"Cuánto hay de Paceña?"_)
4. The AI should recognize the intent and execute it

---

## Questions?

If you have questions about the codebase, check:
1. [README.md](README.md) — Project overview
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Detailed architecture
3. The code itself — most files are well-commented

For anything else, open a GitHub issue.
