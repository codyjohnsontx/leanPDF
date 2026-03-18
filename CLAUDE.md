# CLAUDE.md

Operational rules for AI coding agents working in this repo.

**Instruction priority:** direct user instruction → this file → existing repo patterns.

---

## Project Overview

**leanPDF** — a local-first PDF viewer, annotator, form filler, and signature tool. Also hosts a suite of browser-based text/PDF utility tools.

**Key constraint: everything runs in the browser. No server, no uploads, no backend.**

### Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + React Router 7 |
| Build | Vite 7 + TypeScript 5 (strict) |
| PDF viewing | pdfjs-dist |
| PDF manipulation | pdf-lib + @libpdf/core |
| Component primitives | shadcn/ui (Radix UI under the hood) |
| Styling | Custom CSS (`src/index.css`) + Tailwind utilities (no preflight) |
| Icons | lucide-react |
| Storage | IndexedDB via `idb` |

---

## Module Map

```
src/
├── app/                  # App shell, routing, global context (DocumentProvider)
├── components/ui/        # shadcn/ui primitives: Button, Input, Textarea, Label,
│                         #   Dialog, Tabs, RadioGroup, Badge
├── features/
│   ├── viewer/           # PDF viewer shell, page rendering, dialogs
│   ├── tools/            # PdfToolShell, TextToolShell, ToolPageLayout, toolRegistry
│   ├── annotations/      # Drawing/annotation overlay
│   ├── forms/            # PDF form field filling
│   ├── search/           # Text search
│   └── signatures/       # Signature placement
├── lib/
│   ├── pdf/              # PDF processing logic (rotate, split, merge, security, etc.)
│   ├── text/             # Text transformation utilities
│   ├── storage/          # IndexedDB, sessionStore, signatureStore
│   └── utils/            # download, fileReader, ids, pageRangeParser, search
│   └── utils.ts          # cn() helper (clsx + tailwind-merge)
└── routes/
    ├── tools/            # One file per tool route (lazy-loaded)
    └── *.tsx             # Top-level routes: Landing, Home, Viewer, ToolsHub
```

**Rule:** UI components go in `src/components/ui/`. Business logic goes in `src/lib/`. Never mix them.

---

## Styling Rules

The app uses a dark glassmorphic design. `src/index.css` is the source of truth for layout, page shells, and global styles. Tailwind utilities are available but only for component-level classes.

### CSS Variables

| Variable | Value | Use |
|---|---|---|
| `--color-accent` | `#f5ab35` | Orange — primary CTA color |
| `--accent-2` | `#38bdf8` | Cyan — secondary accent |
| `--accent-soft` | `rgba(245,171,53,0.14)` | Hover/active backgrounds |
| `--border-alpha` | `rgba(255,255,255,0.09)` | Default border |
| `--border-strong-alpha` | `rgba(255,255,255,0.16)` | Stronger border (panels, dialogs) |
| `--text-main` | `#edf2f7` | Primary text |
| `--text-muted` | `#9fb1c4` | Secondary/label text |
| `--success` | `#58d68d` | Success states |
| `--danger` | `#ff7b72` | Error/destructive states |

> **Important:** `--accent`, `--border`, and `--border-strong` are reserved for shadcn token names. Always use the project-specific names above in component code.

### Buttons

Use `<Button>` from `@/components/ui/button` — not raw `<button className="...">`.

| Variant | Use for |
|---|---|
| `default` | Primary CTA (orange gradient) |
| `ghost` | Secondary actions, nav links |
| `tool` | Toolbar/mode toggles |
| `chip` | Inline option selectors, copy buttons |

Use `<Button asChild>` to apply button styles to a `<Link>` or `<label>` without nesting.

### Dialogs

Use shadcn `Dialog` primitives from `@/components/ui/dialog`. The old `src/app/Dialog.tsx` is deleted. Use `onOpenAutoFocus` on `DialogContent` for initial focus control.

---

## Adding a New Tool

1. Add metadata to `src/features/tools/toolRegistry.ts` (id, title, description, category, href, icon)
2. Create `src/routes/tools/YourToolRoute.tsx` — wrap with `<ToolPageLayout>`
3. For text tools, use `<TextToolShell transform={fn}>` — just provide the transform function
4. For PDF tools, use `<PdfToolShell onAction={fn}>` — just provide the async action
5. Add a lazy import + route in `src/app/App.tsx`
6. Add the lucide icon to `ICON_MAP` in `src/routes/ToolsHubRoute.tsx`

Business logic lives in `src/lib/text/` or `src/lib/pdf/` — not in the route component.

---

## Operating Principles

- Read nearby code before editing
- Match existing patterns (naming, structure, component usage)
- Make small, focused changes — prefer minimal diffs
- Stop and report errors instead of guessing
- Never refactor unrelated code
- Never introduce large rewrites without explicit instruction

### Diff size guardrail

Prefer: fewer than 200 lines changed, fewer than 5 files modified. If larger work is required: explain why, propose a plan, wait for approval.

---

## Commands

```bash
npm run dev          # start dev server
npm run build        # tsc -b && vite build
npm run lint         # eslint
npm run test:run     # vitest run (non-watch)
npx tsc -b           # type check only
```

Before finishing any task: run `npx tsc -b` and `npm run test:run`. Do not claim tests passed unless executed.

---

## Git Rules

See `~/.claude/CLAUDE.md` for the authoritative git/PR rules. Short version:

- Do not run git commands if the working tree is dirty
- Run git commands one at a time; stop immediately if one fails
- Never force push, reset, rebase, or amend without explicit instruction
- For push + PR: run `git push -u origin HEAD` then `gh pr create --fill`, in that order, synchronously

---

## Boundaries

- Never modify or read: `.env`, `.env.local`, `node_modules/`, `dist/`
- Never expose API keys, credentials, or tokens
- Never move PDF processing logic to a server — it must stay client-side
- Never install a package that duplicates what pdfjs-dist, pdf-lib, or @libpdf/core already provide

---

## Definition of Done

A task is complete when:

- The requested change is implemented
- `npx tsc -b` passes with zero errors
- `npm run test:run` passes
- No unrelated files were modified
