---
name: shadcn-ui
description: Use shadcn/ui components for ServiceKeep UI styling. Use when building or refactoring renderer UI, adding forms, dialogs, tables, or installing shadcn components via MCP.
---

# shadcn/ui — ServiceKeep

## Stack

- **Style:** radix-nova preset
- **Tailwind:** v4 via `@tailwindcss/vite`
- **Theme:** red/black ServiceKeep tokens in `src/renderer/src/index.css`
- **Dark mode:** `html.dark` class (see `src/renderer/src/lib/theme.ts`)

## Paths

| Item | Location |
|---|---|
| `components.json` | project root |
| UI components | `src/renderer/src/components/ui/` |
| Utils (`cn`) | `src/renderer/src/lib/utils.ts` |
| Global styles | `src/renderer/src/index.css` |
| Import alias | `@/` → `src/renderer/src/` |

## Adding components

Prefer the **shadcn MCP server** (`.cursor/mcp.json`):

```
Add card, input, label, select, textarea, and dialog from shadcn
```

Or CLI from project root:

```bash
npx shadcn@latest add button card input label select textarea dialog
```

## Usage rules

1. **Use shadcn components** for new UI — do not add custom `.btn`, `.panel`, etc. when migrating screens.
2. Import from `@/components/ui/*` and compose with Tailwind utilities.
3. Use `cn()` from `@/lib/utils` for conditional classes.
4. Icons: `lucide-react`.
5. Keep Electron renderer free of Node APIs — UI only talks to `window.servicekeep`.

## Example

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default">Save</Button>
<Button variant="outline">Cancel</Button>
<Button variant="destructive">Delete</Button>
```

## MCP setup (Cursor)

1. Enable **shadcn** in Cursor Settings → MCP
2. Green dot = tools available
3. If tools missing: restart Cursor or run `npx clear-npx-cache`

## Docs

- https://ui.shadcn.com/docs/mcp
- Project `components.json` for aliases and registry config
