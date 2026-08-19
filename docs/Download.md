# ServiceKeep — Download & distribution

## For end users (Windows)

1. Download **`ServiceKeep-Setup-1.0.0.exe`** from Releases (or your download page).
2. Run the installer — choose install folder if prompted.
3. Launch **ServiceKeep** from Start menu or desktop shortcut.
4. On first launch, pick a **data folder** (Documents/ServiceKeep is fine).
5. Add your first vehicle and start logging.

No account, no internet required after install.

### System requirements

- Windows 10 or 11 (64-bit)
- ~200 MB disk space for the app
- Additional space for your data folder (photos, database)

### Windows SmartScreen

The installer is **not code-signed** by default. Windows may show “Windows protected your PC”. Click **More info → Run anyway**. Code signing removes this warning but requires a paid certificate (~$200–400/year).

---

## For developers — build the installer

### One-time setup

```bash
npm install
npm run rebuild
```

On Windows, `better-sqlite3` needs **Visual Studio Build Tools** with “Desktop development with C++”.

### Create Windows installer

```bash
npm run dist:win
```

Output:

```
release/
  ServiceKeep-Setup-1.0.0.exe    ← give this file to users
  win-unpacked/                    ← portable folder (optional)
  latest.yml                       ← auto-update metadata (optional)
```

### Publish checklist

| Step | Required? | Notes |
|------|-----------|--------|
| Bump version in `package.json` + `src/shared/appMeta.ts` | Yes | Keep in sync |
| `npm run typecheck` | Yes | Catch TS errors |
| `npm run dist:win` | Yes | Produces installer |
| Upload `.exe` to GitHub Releases | For public download | Free hosting |
| Code signing certificate | Optional | Removes SmartScreen warning |
| Privacy policy / website | Optional | Good for trust |
| Auto-update server | Optional | Not in v1 |

### GitHub Releases (recommended)

1. Create a repo on GitHub (public or private).
2. Tag a release: `git tag v1.0.0 && git push origin v1.0.0`
3. Upload `release/ServiceKeep-Setup-1.0.0.exe` to the release.
4. Share the release URL — users download the `.exe` directly.

### macOS / Linux

```bash
npm run dist:mac    # → .dmg (needs Mac to build)
npm run dist:linux  # → .AppImage
```

Cross-compiling macOS from Windows is not supported by Apple tooling.

---

## What gets installed

- App binary + Electron runtime (offline)
- User data is **not** bundled — each user chooses their own data folder on first run
- Settings (theme, data path) live in `%APPDATA%/servicekeep/` (Electron `userData`)

## Updating

v1 has no in-app auto-update. Users install a newer `.exe` over the old version. Their data folder is unchanged.
