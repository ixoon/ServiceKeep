# ServiceKeep — Product Requirements Document (PRD)

## 1. Overview

**ServiceKeep** is a free, offline-first desktop application for Windows, macOS, and Linux. It helps a vehicle owner keep a complete local service history: parts replaced, oil changes, small/big services, tires, registration, insurance, costs, photos, and manual reminders.

There is **no cloud account**, **no subscription**, and **no paid third-party service** required for core use.

## 2. Goals

- Track maintenance and ownership costs for **multiple vehicles**
- Store everything **locally** (SQLite + image files)
- Support **backup/restore** to USB or another folder
- Provide a clean professional UI (dark default + light theme, red/black accent)
- Ship a usable **v1** quickly without overbuilding

## 3. Non-goals (v1)

- Email / SMTP notifications
- Cloud sync or multi-user accounts
- Password / PIN lock
- Advanced analytics charts
- Custom user-defined categories (fixed list for now; extensible later)
- Mobile apps

## 4. Decisions locked with stakeholder

| Topic | Decision |
|---|---|
| App name | **ServiceKeep** |
| UI language | English |
| Platforms | Windows + macOS + Linux from the start |
| Stack | Electron + React (Vite) + TypeScript + SQLite |
| Currency / units | EUR + km |
| Vehicles | Multiple from day one |
| Auth | None |
| Theme | Dark default + light toggle |
| Reminders | Manual next due **date and/or km**; in-app only |
| Images | Up to 5 per entry, max ~5MB each |
| Data location | User chooses folder on first launch |
| Backup | Folder containing `data.db` + `images/` |
| Delete model | Archive + permanent delete |
| Reports | After v1 |
| Email | Not in v1 (revisit later only if free/simple) |

## 5. Personas

**Primary:** one private car owner who maintains one or more vehicles and wants a reliable local log they can back up to a USB stick.

## 6. Core concepts

### Vehicle
A garage item with name/label, make/model/year, current odometer (km), fuel type, and engine/oil notes.

### Service entry
A dated log item belonging to one vehicle, with category, title, optional comment, optional cost (EUR), optional odometer reading, and optional next-due date/km.

### Reminder
Derived from an entry’s manual `next_due_date` and/or `next_due_km`. An item is **due** when either threshold is reached (compared to today / vehicle current km).

### Images
Local files copied into the chosen data folder under `images/<entryId>/`.

## 7. Entry categories (v1)

- Oil
- Small service
- Big service
- Parts
- Tires
- Registration
- Insurance
- Other

Each entry may include a free-text **comment**.

## 8. User journeys

### First launch
1. App opens setup screen
2. User chooses a data folder
3. App creates `data.db` + `images/`
4. User lands on Dashboard

### Add a vehicle
1. Open Vehicles
2. Enter name (required), optional details, current km
3. Save → appears in garage + vehicle switcher

### Log work
1. Open Entries
2. Select vehicle + category
3. Enter title, date, optional km/cost/comment
4. Optionally set next due date and/or km
5. Save, then attach images (optional)

### Check reminders
1. Open Reminders (or Dashboard due section)
2. See upcoming / due / overdue items

### Backup to USB
1. Open Settings → Export backup
2. Choose destination (e.g. USB)
3. App writes `servicekeep-backup-<timestamp>/data.db` + `images/`

### Restore
1. Settings → Restore backup
2. Choose a backup folder that contains `data.db`
3. Contents replace current data folder DB/images

## 9. Functional requirements (v1)

### Must have
- Multi-vehicle CRUD (create/update/archive/restore/permanent delete)
- Active vehicle switcher (dashboard list + quick chips)
- Service entry CRUD with categories + comment
- Vehicle current km + per-entry odometer
- When entry km > vehicle km, vehicle current km updates upward
- Manual reminder fields (date and/or km) + in-app due calculation
- Multiple images per entry (limits enforced)
- First-run data path selection + changeable later
- Backup export + restore
- Dark/light theme
- English UI

### Nice follow-ups (post v1)
- Monthly/yearly cost reports by category
- Image gallery viewer improvements
- Optional PIN
- Custom categories
- OS notifications
- CSV export

## 10. UX / design direction

- Professional desktop utility, not a marketing landing page
- Dark theme by default, light theme available
- Accent: red on black/charcoal (light mode: white/soft gray + red accent)
- Clear navigation: Dashboard, Vehicles, Entries, Reminders, Settings
- One primary job per screen
- Vehicle switcher available on main working screens

## 11. Constraints

- Fully local; no required internet after install (fonts may load from Google in dev; can be vendored later)
- Zero paid APIs / SaaS
- Cross-platform packaging via electron-builder
- Data must be portable via folder backup

## 12. Success criteria for v1

A user can:
1. Pick a data folder
2. Add 2+ vehicles
3. Log mixed service history with costs and photos
4. See due reminders from date/km
5. Export backup to USB and restore it on the same or another machine

## 13. Open follow-ups (intentionally deferred)

- Rich reporting UI
- Email reminders
- Multi-profile support
- Automatic interval suggestions (e.g. oil every 10,000 km)
