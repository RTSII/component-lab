# Importing a component from your computer

Status: **checker only.** `tools/import-component.py` analyses one component, a folder of components
or a zip and reports what would happen. It never writes into `components/`. A lab "Import" button and
an `--install` step are planned (see CHANGELOG-blank-core.md, deferred).

## Required layout

```text
<id>/                     folder name = component id: lowercase letters, numbers, dashes (no leading _)
  component.js            REQUIRED  plain script that calls Lab.register({ title, css, markup, frames, mount, ... })
  style.css               recommended  listed in css: [...]; core controls are CSS custom properties
  markup.html             optional  only if component.js names it in markup: '...'
  manifest.json           recommended  schema 3: meta + core (inherits core@1) + extras
  (images / fonts)        optional  .svg .png .jpg .webp .gif .woff .woff2, bundled locally
```

Allowed file types: `.js .css .html .json .svg .png .jpg .jpeg .webp .gif .woff .woff2 .md .txt`.
Limits: 512 KB per file (warning), 4 MB per component (error), 60 files (warning). No symlinks.

### manifest.json (schema 3)

Start from `components/_template/manifest.json`, or scaffold with `python new-component.py <id> --kind <kind>`
and move your code in. Must have:

- `meta.id` equal to the folder name, `meta.license` (`original`, `MIT`, ...), and for open-source code
  `meta.source.url` (provenance).
- `core`: `{ "inherits": "core@1", "hide": [...], "opt": [...], "override": {...} }`.
- `extras`: the component's own controls (`UPPER_SNAKE` ids with a short prefix, `"section": "component"`
  for its own Layout group). Names follow docs/NAMING-STANDARD.md.

Without a manifest the lab auto-scans the files (works, but no tiers, tags or core mapping).

### Core mapping

Use the core CSS variables so the core controls drive your component with no extra work:

| Control | CSS var | Control | CSS var |
|---|---|---|---|
| COLOR_BORDER | `--c-border` | RADIUS | `--radius` |
| COLOR_FILL | `--c-fill` | SCALE_TEXT | `--type-k` |
| COLOR_TEXT | `--c-text` | MOTION_SPEED | `--speed` |
| COLOR_GLOW | `--c-glow` | MOTION_EASING | `--ease` |
| COLOR_ACCENT | `--c-accent` | SIZE_W / SIZE_H | `--w` / `--h` |
| OPACITY_FILL | `--fill-op` | SPACE_PAD / SPACE_GAP | `--pad` / `--gap` |
| OPACITY_BORDER | `--border-op` | BLUR | `--blur` |
| GLOW_STRENGTH | `--glow-k` | WEIGHT / TRACKING | `--fw` / `--track` |

The checker lists which vars map to core controls and warns about vars nothing sets.

## What blocks an import

`component.js` runs inside the lab page, so these are **errors**:

- missing `component.js`, or it never calls `Lab.register`; files named in `css:` / `markup:` missing
- bad id, reserved id (`_core`, `_template`), id already in `components/`, duplicate id in the batch
- licence markers (`aceternity`, `licensed-private`, `all rights reserved`): licensed code stays in the private vault
- network or code-loading calls: `fetch`, `XMLHttpRequest`, `WebSocket`/`EventSource`, `sendBeacon`, `eval`,
  `new Function`, `import()`, ES `import`/`export`, `postMessage`, page navigation, cookies, browser storage
- external URLs in `src`/`href`/`url()`/`@import` (bundle assets in the folder), inline `<script>` in html/svg
- unsafe zip paths (`..`, absolute) are skipped and reported
- schema-3 manifest errors from `tools/check-components.py`

Warnings (NEEDS WORK): no manifest, legacy schema 2, no style.css, unmapped CSS vars, big files, no licence/provenance.

## Usage

```powershell
python tools/import-component.py C:\path\my-card                 # one folder
python tools/import-component.py C:\path\downloads               # batch: every sub-folder with component.js
python tools/import-component.py C:\path\pack.zip --json         # zip (read in memory), JSON report
```

Exit code 0 = nothing blocked. To import a READY component today: copy the folder to `components/<id>/`,
run `python tools/check-components.py`, then open the lab (test on a second port: `python serve.py 5180`).
