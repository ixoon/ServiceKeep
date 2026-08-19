# ServiceKeep

Local desktop garage & service log for Windows, macOS, and Linux.

**Free · offline · no cloud account · EUR + km**

## Download (Windows)

Build the installer locally:

```bash
npm install
npm run rebuild
npm run dist:win
```

The installer appears at **`release/ServiceKeep-Setup-1.0.0.exe`** — share that file with users.

Full distribution guide: **[docs/Download.md](docs/Download.md)**

## Features

- Multiple vehicles with VIN, plate, color, and per-vehicle service intervals
- Service entries (oil, services, parts, tires, registration, insurance, other)
- Costs in EUR, distance in km, photo documentation (up to 5 per entry)
- Manual reminders by date and/or km · in-app + OS notifications
- Reports with spend charts by month, category, and vehicle
- Global search (`Ctrl+K`) across titles, comments, part numbers, VIN
- Dark / light theme · backup & restore (`data.db` + `images/`)

## Docs

- [Product requirements](docs/PRD.md)
- [Architecture](docs/Tech.md)
- [Database schema](docs/DB.md)
- [Download & distribution](docs/Download.md)

## Development

### Requirements

- Node.js 20+ (22 works)
- Windows: Visual Studio Build Tools with C++ (for `better-sqlite3`)

### Setup

```bash
npm install
npm run rebuild
npm run dev
```

On first launch, choose a **data folder**. The app creates:

```
<data-folder>/
  data.db
  images/
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Electron + Vite dev app |
| `npm run build` | Build main/preload/renderer |
| `npm run typecheck` | TypeScript check |
| `npm run dist:win` | Windows NSIS installer → `release/` |
| `npm run dist:mac` | macOS DMG (build on Mac) |
| `npm run dist:linux` | Linux AppImage |

## UI

Styling uses **shadcn/ui** (Radix Nova) + Tailwind v4. See `.cursor/skills/shadcn/SKILL.md`.
