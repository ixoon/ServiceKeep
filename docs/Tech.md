# ServiceKeep — Technical Architecture

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Desktop shell | **Electron** | Cross-platform Windows / macOS / Linux |
| UI | **React + TypeScript + shadcn/ui** | Component library + Tailwind v4 styling |
| Bundler | **Vite via electron-vite** | Fast dev server, clean main/preload/renderer split |
| Database | **SQLite (`better-sqlite3`)** | Local, reliable, zero server cost |
| Packaging | **electron-builder** | Free installers (NSIS / DMG / AppImage) |

> Note: Next.js was considered, then intentionally dropped. For a local offline desktop app, **Vite + React** is simpler and avoids SSR/server complexity.

## 2. High-level architecture

```
┌──────────────────────────────────────────────┐
│ Renderer (React UI)                          │
│  - pages, forms, theme, routing              │
│  - talks only through window.servicekeep API │
└──────────────────────┬───────────────────────┘
                       │ contextBridge / IPC
┌──────────────────────▼───────────────────────┐
│ Preload                                      │
│  - exposes typed safe API                    │
└──────────────────────┬───────────────────────┘
                       │ ipcMain.handle
┌──────────────────────▼───────────────────────┐
│ Main process                                 │
│  - window lifecycle                          │
│  - dialogs (folder/file pickers)             │
│  - SQLite access                             │
│  - image copy + backup/restore               │
│  - app-settings.json (data path, theme)      │
└──────────────────────────────────────────────┘
```

Security defaults:
- `contextIsolation: true`
- `nodeIntegration: false`
- No direct filesystem/DB access from renderer

## 3. Repository layout

```
src/
  main/                 # Electron main process
    index.ts
    db/                 # SQLite open + schema
    ipc/handlers.ts     # IPC routes
    services/           # vehicles, entries, images, backup, settings
  preload/              # Bridge API
  renderer/             # React app
    index.html
    src/
      App.tsx
      pages/
      components/
      styles/
  shared/               # Types shared by main + renderer
docs/
  PRD.md
  Tech.md
  DB.md
```

## 4. Data locations

### App settings (small JSON)
Stored in Electron `userData`:
- path example (Windows): `%APPDATA%/servicekeep/app-settings.json`
- fields: `dataPath`, `theme`, `activeVehicleId`

### User data folder (chosen on first launch)
User selects any directory. App creates:

```
<dataPath>/
  data.db
  images/
    <entryId>/
      <uuid>.jpg
```

This keeps the database portable and USB-friendly.

## 5. Process responsibilities

### Main
- Initialize DB when `dataPath` exists
- CRUD for vehicles/entries/images
- Reminder query/computation
- Backup export (`data.db` + `images/`)
- Restore into current data folder
- Native dialogs

### Renderer
- Presentation + forms
- **shadcn/ui** components (`@/components/ui/*`)
- Tailwind v4 + CSS variables in `src/renderer/src/index.css`
- Dark mode via `html.dark` class
- Calls preload API only

### Preload
- `window.servicekeep.*` typed methods

## 6. IPC surface (summary)

| Channel | Purpose |
|---|---|
| `app:chooseDataPath` | First-run / change data folder |
| `app:initIfConfigured` | Bootstrap |
| `settings:*` | Theme + active vehicle |
| `vehicles:*` | Vehicle CRUD / archive |
| `entries:*` | Entry CRUD / archive |
| `reminders:list` | Due/upcoming list |
| `images:*` | Add/list/delete images |
| `backup:export` / `backup:restore` | Portable backup |

## 7. Reminder logic

For each non-archived entry with `next_due_date` and/or `next_due_km`:

- **Date due** if `next_due_date <= today`
- **Km due** if `vehicle.current_km >= next_due_km`
- **Due** if either is true
- **Overdue** if date is in the past or current km is beyond due km

No automatic interval generation in v1 — user enters next due values manually.

## 8. Image rules

- Max **5** images per entry
- Max **5MB** per file
- Copied into data folder (not referenced by original path)
- Deleted from disk when image row is removed

## 9. Backup / restore

### Export
1. `wal_checkpoint(FULL)` to flush SQLite WAL
2. Copy `data.db`
3. Copy `images/` tree
4. Destination: `servicekeep-backup-<timestamp>/`

### Restore
1. User picks backup folder containing `data.db`
2. App overwrites current data folder DB + images
3. Re-opens SQLite

## 10. Theming

CSS variables in `global.css`:
- Dark default (`#0b0b0c` background, red accent `#e11d2e`)
- Light theme via `html[data-theme='light']`
- Fonts: Instrument Sans (display) + DM Sans (body)

## 11. Build & run

### Development
```bash
npm install
npm run rebuild
npm run dev
```

### Production build
```bash
npm run dist        # current OS
npm run dist:win
npm run dist:mac
npm run dist:linux
```

Artifacts go to `release/`.

## 12. Native module note (`better-sqlite3`)

`better-sqlite3` must be compiled against Electron’s Node ABI.

- `postinstall` runs `electron-builder install-app-deps`
- If DB fails to load in dev, run: `npm run rebuild`
- Windows may require Build Tools for native compilation

`electron.vite` externalizes main-process deps so the native addon is not bundled incorrectly. `asarUnpack` includes `better-sqlite3` for packaged apps.

## 13. shadcn/ui + MCP

- Config: `components.json` at project root
- Components: `src/renderer/src/components/ui/`
- Add via CLI: `npx shadcn@latest add <component>`
- Cursor MCP: `.cursor/mcp.json` → enable **shadcn** in Settings → MCP
- Project skill: `.cursor/skills/shadcn/SKILL.md`

## 14. Future technical extensions

- SQL migrations table beyond simple `meta.schema_version`
- Report queries (sum by month/category)
- Optional OS notifications
- Vendor fonts for fully offline UI assets
- Stricter CSP / no external font CDN
