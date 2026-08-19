# ServiceKeep — Database Schema

## 1. Storage layout

```
<dataPath>/
  data.db              # SQLite database
  images/              # image binaries (not inside SQLite)
    <entry_id>/
      <uuid>.<ext>
```

SQLite pragmas:
- `journal_mode = WAL`
- `foreign_keys = ON`

Schema version is stored in `meta.schema_version` (currently `1`).

## 2. ER diagram

```
meta
  └─ key/value app metadata

vehicles 1───* service_entries 1───* entry_images
```

## 3. Tables

### 3.1 `meta`

| Column | Type | Notes |
|---|---|---|
| `key` | TEXT PK | e.g. `schema_version` |
| `value` | TEXT | stringified value |

### 3.2 `vehicles`

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | autoincrement |
| `name` | TEXT NOT NULL | display label |
| `make` | TEXT | nullable |
| `model` | TEXT | nullable |
| `year` | INTEGER | nullable |
| `current_km` | REAL NOT NULL DEFAULT 0 | latest known odometer |
| `fuel_type` | TEXT | nullable |
| `engine_notes` | TEXT | oil specs / notes |
| `archived_at` | TEXT | ISO timestamp; NULL = active |
| `created_at` | TEXT NOT NULL | ISO timestamp |
| `updated_at` | TEXT NOT NULL | ISO timestamp |

Indexes:
- `idx_vehicles_archived(archived_at)`

### 3.3 `service_entries`

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | autoincrement |
| `vehicle_id` | INTEGER NOT NULL | FK → `vehicles.id` ON DELETE CASCADE |
| `category` | TEXT NOT NULL | see enum below |
| `title` | TEXT NOT NULL | short summary |
| `comment` | TEXT | free text |
| `cost_eur` | REAL | nullable |
| `odometer_km` | REAL | km at time of work |
| `performed_at` | TEXT NOT NULL | ISO timestamp/date |
| `next_due_date` | TEXT | manual reminder date |
| `next_due_km` | REAL | manual reminder km |
| `archived_at` | TEXT | NULL = active |
| `created_at` | TEXT NOT NULL | |
| `updated_at` | TEXT NOT NULL | |

Indexes:
- `idx_entries_vehicle(vehicle_id)`
- `idx_entries_category(category)`
- `idx_entries_performed(performed_at)`
- `idx_entries_next_due_date(next_due_date)`

### 3.4 `entry_images`

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `entry_id` | INTEGER NOT NULL | FK → `service_entries.id` ON DELETE CASCADE |
| `file_name` | TEXT NOT NULL | stored file name |
| `relative_path` | TEXT NOT NULL | relative to `images/` |
| `mime_type` | TEXT | optional |
| `size_bytes` | INTEGER | optional |
| `created_at` | TEXT NOT NULL | |

Indexes:
- `idx_images_entry(entry_id)`

## 4. Category enum (application-level)

Stored as TEXT in `service_entries.category`:

| Value | Label |
|---|---|
| `oil` | Oil |
| `small_service` | Small service |
| `big_service` | Big service |
| `parts` | Parts |
| `tires` | Tires |
| `registration` | Registration |
| `insurance` | Insurance |
| `other` | Other |

## 5. Business rules encoded in app logic

1. **Archive vs delete**
   - Archive sets `archived_at`
   - Permanent delete removes the row (CASCADE removes child entries/images)

2. **Odometer update**
   - Creating an entry with `odometer_km` updates `vehicles.current_km` only if the new value is greater

3. **Reminders**
   - Not a separate table in v1
   - Derived from `next_due_date` / `next_due_km` + vehicle `current_km`

4. **Image limits**
   - Max 5 rows per `entry_id`
   - Max 5MB per file (enforced before insert)

5. **Timestamps**
   - Stored as ISO-8601 strings (`YYYY-MM-DDTHH:mm:ss.sssZ`)

## 6. Useful queries

### Active vehicles
```sql
SELECT * FROM vehicles
WHERE archived_at IS NULL
ORDER BY name COLLATE NOCASE;
```

### Entries for one vehicle
```sql
SELECT * FROM service_entries
WHERE vehicle_id = ?
  AND archived_at IS NULL
ORDER BY performed_at DESC, id DESC;
```

### Reminder candidates
```sql
SELECT
  e.id,
  e.vehicle_id,
  v.name AS vehicle_name,
  e.title,
  e.category,
  e.next_due_date,
  e.next_due_km,
  v.current_km
FROM service_entries e
JOIN vehicles v ON v.id = e.vehicle_id
WHERE e.archived_at IS NULL
  AND v.archived_at IS NULL
  AND (e.next_due_date IS NOT NULL OR e.next_due_km IS NOT NULL);
```

### Spend by category (post-v1 reports)
```sql
SELECT category, SUM(COALESCE(cost_eur, 0)) AS total_eur
FROM service_entries
WHERE archived_at IS NULL
  AND performed_at >= ?
  AND performed_at < ?
GROUP BY category
ORDER BY total_eur DESC;
```

## 7. Backup contents

A valid backup folder must include:

```
data.db
images/          # optional but preserved when present
```

No separate dump format in v1 — the SQLite file **is** the source of truth.

## 8. Migration policy

- Current version: **1**
- Future schema changes should:
  1. Bump `DB_SCHEMA_VERSION`
  2. Add migration steps keyed by version in main-process DB bootstrap
  3. Update this document

## 9. Create-table SQL (source of truth in code)

See `src/main/db/schema.ts` (`SCHEMA_SQL`). Keep this document and that file aligned whenever the schema changes.
