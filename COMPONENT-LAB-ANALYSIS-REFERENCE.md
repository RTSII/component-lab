# Component Lab — Analysis Reference (control audit · library scaffolding · core template · P0 status)

Consolidated from the three Oct 31, 2026 (ET) reviews so they can be used to finish the work: the **Mid/Pro menu audit + library scaffolding** review, the **generic base component template** proposal, and the **P0 build run** (local, uncommitted, branch `feat/icons-dock`). Rob's go-ahead (t590u): *"go ahead with P0 as one local uncommited run, keep the rate section the same for now, heli will get both steps. update project docs when done and add the analysis reviews into an md for future reference and use to complete"*.

**Jump to:** [1. Control audit](#1-control-audit-43-helix-controls) · [2. Library scaffolding & phases](#2-library-scaffolding-tags-filters-search-folders) · [3. Base template proposal](#3-base-template-proposal-core1--schema-3) · [4. Open / deferred](#4-open-and-deferred-items) · [5. P0 status & remaining checklist](#5-p0-completion-status--remaining-checklist) · [6. Status log](#6-status-log)

Related docs: [README.md](README.md) (tiers, core template, schema 3, scripts) · [COMPONENT-LAB-REVIEW-MVP.md](COMPONENT-LAB-REVIEW-MVP.md) (MVP review + audit log) · [components/_core/core.json](components/_core/core.json) · [lab/manifest.js](lab/manifest.js) · [tools/check-components.py](tools/check-components.py)

---

## 1. Control audit (43 helix controls)

**How it was checked (light):** both tiers rendered headless at 1600x770 and every `.ctl[data-id]` row listed with section, card, flip face and widget; no console errors. Pro shows all 43, Mid exactly the 22 tagged Free+Mid (6 + 16), Free 6. Nothing missing or doubled (HOVER also sits on the quick key, intended). No min/max/step/default differs from the original `compare/original-home.js` constants (STEP 44, TEXT_FADE 52/86, BACK_FADE 70/110, BACK_OPACITY .3, END_FADE 3/3.85, TILT 1, RADIUS .26/84/6, TRAVEL .94, WAVE .3, SCALE_MIN .56, CYCLE 26, border fill .2/3.4, CARD_W 156, PERSPECTIVE 900). Every widget snaps to `step` and clamps to [min, max].

### 1.1 The 43 controls after P0 (old ID → new ID)

Generated from the before/after resolution check in the P0 run. "core" = inherits a core@1 control (Step A tag + Step B rename); "extra" = helix-only, ID unchanged. Every range and default is identical before and after (column *Same?*).

| # | Old ID | New ID | Kind | Tier | Section › card | Widget | Pro face | min / max / step | default | Same? |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `CARD_BORDER` | `COLOR_BORDER` | core | Free | color › Card | swatches | front | — | "#00e5ff" | yes |
| 2 | `TITLE_TEXT` | `COLOR_TEXT` | core | Free | color › Text | swatches | front | — | "#00e5ff" | yes |
| 3 | `GLOW` | `COLOR_GLOW` | core | Free | color › Glow | swatches | front | — | "#00e5ff" | yes |
| 4 | `CARD_FILL` | `COLOR_FILL` | core | Free | color › Card | swatches | front (fixed) | — | "#00324e" | yes |
| 5 | `CARD_FILL_2` | `COLOR_FILL_2` | core | Pro | color › Card | swatches | back | — | "#011220" | yes |
| 6 | `LABEL_TEXT` | `COLOR_MUTED` | core | Pro | color › Text | swatches | back | — | "#8fd0df" | yes |
| 7 | `ZERO_TEXT` | `ZERO_TEXT` | extra | Pro | color › Text | swatches | back | — | "#c90a1d" | yes |
| 8 | `HOVER` | `IX_HOVER` | core | Mid | interact › Pointer | seg-pads | front | — | "pause" | yes |
| 9 | `DRAG` | `IX_DRAG` | core | Mid | interact › Pointer | seg-pads | front | — | "scrub" | yes |
| 10 | `TOUCH` | `IX_TOUCH` | core | Mid | interact › Touch & keys | seg-pads | back | — | "hover" | yes |
| 11 | `KEY_PAUSE` | `IX_KEY` | core | Mid | interact › Touch & keys | switch | back | — | true | yes |
| 12 | `CARD_OPACITY` | `OPACITY_FILL` | core | Mid | surface › Opacity | h-slider | front | 0/1.2/0.01 | 1 | yes |
| 13 | `BORDER_OPACITY` | `OPACITY_BORDER` | core | Mid | surface › Opacity | h-slider | front | 0/1/0.01 | 1 | yes |
| 14 | `GLOW_STRENGTH` | `GLOW_STRENGTH` | core | Mid | surface › Glow | fx-unit | front | 0/3/0.05 | 1 | yes |
| 15 | `BACK_OPACITY` | `BACK_OPACITY` | extra | Pro | surface › Opacity | h-slider | front | 0/1/0.01 | 0.3 | yes |
| 16 | `TEXT_FADE_ON` | `TEXT_FADE_ON` | extra | Free | surface › Fades | pad | front | — | true | yes |
| 17 | `END_FADE_ON` | `END_FADE_ON` | extra | Free | surface › Fades | pad | front | — | true | yes |
| 18 | `NUM_SCALE` | `SCALE_TEXT` | core | Mid | type › Size | h-slider | front | 0.5/2/0.05 | 1 | yes |
| 19 | `LABEL_SCALE` | `SCALE_LABEL` | core | Mid | type › Size | h-slider | front | 0.5/2/0.05 | 1 | yes |
| 20 | `EASING` | `MOTION_EASING` | core | Mid | motion › Loop | seg-pads | front | — | "linear" | yes |
| 21 | `DIRECTION` | `MOTION_DIRECTION` | core | Mid | motion › Loop | seg-pads | front | — | 1 | yes |
| 22 | `PERSPECTIVE` | `DEPTH_PERSPECTIVE` | core | Pro | motion › Depth | h-slider | back | 200/2000/10 | 900 | yes |
| 23 | `SPEED` | `MOTION_SPEED` | core | Mid | rate › Tempo | tempo-deck | front | 0.25/3/0.05 | 1 | yes |
| 24 | `INTENSITY` | `MOTION_INTENSITY` | core | Pro | rate › Tempo | h-slider | back | 0/2/0.05 | 1 | yes |
| 25 | `CYCLE` | `MOTION_CYCLE` | core | Pro | rate › Tempo | h-slider | back | 4/120/1 | 26 | yes |
| 26 | `STEP` | `STEP` | extra | Mid | rate › Turn | knob | front | 0/90/1 | 44 | yes |
| 27 | `TILT` | `TILT` | extra | Pro | rate › Turn | h-slider | back | 0/2/0.05 | 1 | yes |
| 28 | `TEXT_FADE_A` | `TEXT_FADE_A` | extra | Pro | rate › Text fade | knob | back | 0/180/1 | 52 | yes |
| 29 | `TEXT_FADE_B` | `TEXT_FADE_B` | extra | Pro | rate › Text fade | knob | back | 0/180/1 | 86 | yes |
| 30 | `BACK_FADE_A` | `BACK_FADE_A` | extra | Pro | rate › Shell dim | knob | back | 0/180/1 | 70 | yes |
| 31 | `BACK_FADE_B` | `BACK_FADE_B` | extra | Pro | rate › Shell dim | knob | back | 0/180/1 | 110 | yes |
| 32 | `END_FADE_A` | `END_FADE_A` | extra | Pro | rate › End fade | h-slider | back | 0/8/0.05 | 3 | yes |
| 33 | `END_FADE_B` | `END_FADE_B` | extra | Pro | rate › End fade | h-slider | back | 0/8/0.05 | 3.85 | yes |
| 34 | `FILL_FULL_AT` | `FILL_FULL_AT` | extra | Pro | rate › Border fill | h-slider | back | 0/6/0.05 | 0.2 | yes |
| 35 | `FILL_EMPTY_AT` | `FILL_EMPTY_AT` | extra | Pro | rate › Border fill | h-slider | back | 0/8/0.05 | 3.4 | yes |
| 36 | `N` | `N` | extra | Mid | layout › Size | select-compact | front | 3/16/1 | 8 | yes |
| 37 | `CARD_W` | `SIZE_W` | core | Mid | layout › Size | v-fader | front | 80/240/1 | 156 | yes |
| 38 | `RADIUS_MAX` | `RADIUS_MAX` | extra | Mid | layout › Spacing & Radius | knob | front | 0/160/1 | 84 | yes |
| 39 | `TRAVEL` | `TRAVEL` | extra | Pro | layout › Spacing & Radius | v-fader | front | 0.3/1.6/0.01 | 0.94 | yes |
| 40 | `WAVE` | `WAVE` | extra | Pro | layout › Spacing & Radius | v-fader | front | -1/1/0.05 | 0.3 | yes |
| 41 | `SCALE_MIN` | `SCALE_MIN` | extra | Pro | layout › Size | v-fader | front | 0.1/1/0.01 | 0.56 | yes |
| 42 | `RADIUS_FRAC` | `RADIUS_FRAC` | extra | Pro | layout › Spacing & Radius | knob | back | 0/0.6/0.01 | 0.26 | yes |
| 43 | `RADIUS_PAD` | `RADIUS_PAD` | extra | Pro | layout › Spacing & Radius | knob | back | 0/40/1 | 6 | yes |


### 1.2 Widget / grouping judgement

- Widget types are right in general: knobs for angles (STEP, fade angles), vertical faders for layout distances and scale (bipolar WAVE has a zero LED), on/off pads for the Fades, segmented pads for enums, an FX unit (knob + on/off + presets) for glow, a tempo deck for Speed in Pro, a compact select for the card count.
- Cosmetic inconsistencies: KEY_PAUSE (now `IX_KEY`) is the last plain iOS switch while the other booleans are pads; TILT is a slider beside the STEP knob in the Turn card; RADIUS_MAX is captioned "MASTER" though it is not a master.
- Fade thresholds (TEXT/BACK/END fade A/B, border fill) sit under **Rate** while their ON pads sit under **Surface › Fades** (one feature split across two sections).
- Two "Glow" cards (colour under Color, strength under Surface): fine for now.
- `manifest.groups.rate` still lists the empty "Loop time" group (skipped silently; cleanup only).

### 1.3 Must-fix (all three done in P0)

| # | Finding | Fix in P0 |
|---|---|---|
| a | Mid SPEED had only 3 pads (0.5×/1×/2×): lost the 0.25–3 continuous range; a value like 1.35 lit no pad | Mid now renders a real slider (0.25–3, step 0.05) with the 0.5×/1×/2× pads under it (`controls.js` `isRatePads`). Pro keeps the tempo deck. |
| b | CARD_FILL is a Free colour but sat on the **back** of the Pro Card flip card (`advanced: true`) | `COLOR_FILL` override `advanced` dropped → front in Pro. The loader also forces `advanced: false` on every Free control, so Pro never hides what Free shows. |
| c | Mid lone-control cards: the Spacing & Radius knob sat left; Card width was a bare fader with no deck tile | Mid only: a single deck control is centred (`.is-single`), and Size gets the mixed deck (Cards select on top, Card width fader in a centred tile with its CH 1 caption). |

### 1.4 Should-fix before component #2 (done in P0)

Widget choice and deck captions were keyed to helix IDs in `controls.js` (SPEED, GLOW_STRENGTH, TEXT_FADE_ON / END_FADE_ON, RADIUS_MAX, TRAVEL, CARD_W, WAVE, SCALE_MIN, N) and `lab.js` (`group === 'Spacing & Radius'`, `g.name === 'Fades'`, `byId.SPEED`, scan `byId.HOVER/TOUCH/DRAG/KEY_PAUSE`). All moved to manifest fields: `widget`, `variant`, `deckLabel`, `padTitle` / `padSub`, `master: "speed"`, `layout.deck` / `layout.pads`, and the scan `interaction` kind.

### 1.5 Safe to defer (with reason)

- A/B fade pairs are not ordered (A > B inverts the fade; A == B is a 0/0 edge at one value). Visual only. Proper fix = the deferred dual-handle start/end widget. P0 adds `pair` fields and the checker enforces **defaults** in order.
- Shift+wheel fine step on knobs / tempo deck rounds back down (no downward fine step). Arrows, drag and click-to-type work.
- Hash / snapshot values are not clamped to min/max on load (`coerce()`); only hand-typed URLs hit it.
- Regroup fade thresholds next to their ON pads (manifest-only UX choice for Rob).
- KEY_PAUSE pad style, TILT knob, "MASTER" caption, orphan "Loop time" group, two Glow cards: cosmetic.
- Tier labels Base/Mid/Pro live in the one `TIER` object; rename there once names are final.
- ~~README line ~94 still describes the old Basic/Pro model~~ → fixed in P0.

---

## 2. Library scaffolding (tags, filters, search, folders)

**State before P0:** `components/registry.js` was a hand-edited flat array; each component a flat folder (`component.js`, `manifest.json`, `markup.html`, `style.css`); manifests held controls only (no tags/category/license/status/version/thumbnail). Loading is already lazy per component. The picker is a flat, unsearchable list. ui-vault (`RTSII/ui-vault`) already has the richer vocabulary (purpose / interaction / tech / feel / fit, source, license, status) that schema 3 reuses. Nothing enforced "no licensed code in the public repo".

**Schema 3 meta block (implemented):** `schema: 3` and `meta { id, name, version, kind, category, tags{purpose,interaction,tech,feel,fit}, tierMin, source{origin,author,url,vaultId,note}, license (original | MIT | Apache-2.0 | licensed-private), status (draft | wip | ready | deprecated | template), deps, thumbnail, created, updated }`. Vocabularies live in `core.json` (`tagVocab`, `categories`, `licenses`, `statuses`).

**Folders (convention):**
- Now: `components/<id>/` (flat). Reserved: `components/_core/` (core@1), `components/_template/` (blank template + `kinds.json`). Planned: `components/_shared/` (shared helpers / CSS).
- P2: `components/<category>/<id>/` (one level at most); the id stays globally unique and the index stores the path so `#c=<id>` links never break.
- Licensed / Aceternity rebuilds **never** go in this repo: a git-ignored `components-private/` root or a separate private repo, indexed into an uncommitted `index.private.json`.

**Generated index + validation (implemented as `tools/check-components.py`, stdlib):** writes `components/index.json` (id, name, schema, version, kind, category, tags, license, status, inherits, control counts per tier, thumbnail, updated) and regenerates `components/registry.js` (existing order kept, new folders appended, `_template` last). Runs from `serve.py` at start / after Save, and from `new-component.py`. No git hook (Rob's rule).

**Filter / search UX (P1):** a Library popover replacing the flat picker: search (name, id, tags; `/` focuses), facet chips (category, purpose, interaction, tech, status, tier), Recent + Favourites (localStorage), grouped by category with counts, full keyboard nav; licensed entries show a lock badge and export refuses them; `tierMin` greys out with UPGRADE.

**Performance:** one `index.json` fetch (~200 B/entry; 1,000 components ≈ 200 KB before gzip); component code stays lazy; thumbnails lazy-loaded; virtualise only past ~200 entries; release the previous component's `destroy()`, CSS and raf on switch (verify once there are 2+ components); in-memory substring search.

### Phases

| Phase | Scope | Status |
|---|---|---|
| **P0** | core@1 + schema-3 loader, manifest-driven widgets, helix Steps A + B with migration, checker + licence guard + index, scaffold + `_template` on core, 3 must-fixes, docs | **Done (uncommitted, 2026-10-31)** |
| **P1** | Lab reads `index.json` (fallback `registry.js`); Library popover (search, facets, Recent, Favourites); build component #2 as the proof (simple card or button); port the disintegrating gallery (ours) as #3 | Open |
| **P2** | Category subfolders, `components-private/` root + `index.private.json`, Playwright thumbnail script (320x200 `thumb.webp`); optional Rate → Motion merge; cross-component "Looks" (core-value presets that apply to any component) | Open |
| **P3** | ui-vault sync (`vaultId`; "Save generic copy to ui-vault created/" only when Rob asks), saved filter views, bulk tag editing in Settings › Manifest tools, list virtualisation past 200 | Open |

---

## 3. Base template proposal (core@1 + schema 3)

### 3.1 Key findings that drove it

- `_template` had 22 generic vars but no tiers, no interaction vars, and every new component got a **copy** (no inheritance), so base fixes never reached existing components.
- The helix was the de-facto rubric: lab code keyed on helix IDs (see 1.4).
- Values are stored by var ID (`values:<id>`, `snaps:<id>`, `featured:<id>`, `#c=<id>&ID=value`, exports), so any rename needs alias migration.
- Recurrence survey (helix, template, disintegrating gallery, 3-stage dock, licensed gallery control **names** only, ui-vault interaction tags): width 5/5; border, fill, speed, gap 4; glow colour+strength, fill/border opacity, text colour 3; radius, easing, text scale, accent/muted, height 2. Interaction tags: click 7, hover 6, scroll 5, keyboard 5, drag 4 → slots HOVER, PRESS, DRAG, TOUCH, KEY (scroll stays an extra for now). Reduced motion should be a lab-wide setting, not a control.

### 3.2 Core set: 12 core controls + 5 interaction slots (as built in `components/_core/core.json`)

| ID | Section › group | Widget (Mid / Pro) | Range / step / default | Tier | CSS var |
|---|---|---|---|---|---|
| `COLOR_BORDER` | Color › Card | swatches | palette + hex / `#00e5ff` | Free | `--c-border` |
| `COLOR_FILL` | Color › Card | swatches | `#04121f` | Free | `--c-fill` |
| `COLOR_TEXT` | Color › Text | swatches | `#d8f3ff` | Free | `--c-text` |
| `COLOR_GLOW` | Color › Glow | swatches | `#00e5ff` | Free | `--c-glow` |
| `IX_HOVER` | Interaction › Pointer | seg-pads | rate: play/pause/slow/fast (pause) · fx: none/lift/glow/both (lift) | Mid | behaviour |
| `IX_PRESS` | Interaction › Pointer | seg-pads | none/press/glow (press) | Mid | behaviour |
| `IX_DRAG` | Interaction › Pointer | seg-pads | rate: scrub/ignore (scrub) · fx: none/tilt (none) | Mid | behaviour |
| `IX_TOUCH` | Interaction › Touch & keys | seg-pads | hover/ignore (hover) | Mid (back) | behaviour |
| `IX_KEY` | Interaction › Touch & keys | pad | on/off (on) | Mid (back) | behaviour |
| `OPACITY_FILL` | Surface › Opacity | h-slider | 0–1 / 0.01 / 0.86 | Mid | `--fill-op` |
| `OPACITY_BORDER` | Surface › Opacity | h-slider | 0–1 / 0.01 / 0.6 | Mid | `--border-op` |
| `GLOW_STRENGTH` | Surface › Glow | fx-unit | 0–3 / 0.05 / 1 × | Free pick / Mid | `--glow-k` |
| `RADIUS` | Surface › Shape | knob | 0–48 / 1 / 14 px | Free pick / Mid | `--radius` |
| `SCALE_TEXT` | Type › Size | h-slider | 0.5–2 / 0.05 / 1 × | Mid | `--type-k` |
| `MOTION_SPEED` | **Rate › Tempo** (Rate kept) | Mid slider + 0.5/1/2 pads · Pro tempo deck | 0.25–3 / 0.05 / 1 × (`master: speed`) | Mid | `--speed` |
| `MOTION_EASING` | Motion › Loop | seg-pads | settle/spring/linear (settle) | Mid | `--ease` (option css) |
| `SIZE_W` | Layout › Size | v-fader (CH 1) | 120–520 / 1 / 300 px | Mid | `--w` |

**Optional library** (opt in by ID; Pro unless raised): `COLOR_ACCENT`, `COLOR_MUTED`, `COLOR_FILL_2`, `BLUR`, `WEIGHT`, `TRACKING`, `SCALE_LABEL`, `SIZE_H`, `SPACE_PAD`, `SPACE_GAP`, `MOTION_DIRECTION` (`timeRole: direction`), `MOTION_INTENSITY` (`master: intensity`), `MOTION_CYCLE` (`timeRole: cycle`, 2–120 s), `DEPTH_PERSPECTIVE`, `HOVER_LIFT`, `IDLE`.

Why × (scale) for text and speed: works on any component without knowing its native base size / native speed; the native value stays a component constant and core scales it, so one Speed control means the same everywhere.

**Tier budget:** Free = 6 (4 core colours + 2 `freePicks`, default `GLOW_STRENGTH` + `RADIUS`), Mid ≤ 22 cumulative, Pro = everything. Inside each section + group: Free first, then Mid, then Pro (flip backs), so Pro never hides what Free / Mid show.

### 3.3 Naming

- Core IDs = PROPERTY_TARGET from a fixed vocabulary: `COLOR_*`, `OPACITY_*`, `GLOW_*`, `RADIUS`, `BLUR`, `SCALE_*`, `SIZE_*`, `SPACE_*`, `WEIGHT`, `TRACKING`, `MOTION_*`, `DEPTH_*`, `IX_*`, `HOVER_LIFT`, `IDLE`. Reserved: an extra may not reuse any core or optional ID (checker enforces).
- Extras: UPPER_SNAKE, no component prefix needed; new components prefer noun-first names (`ORBIT_RADIUS`, not `RADIUS_MAX`).
- Labels are free per component via override ("Card border" vs "Button outline"); the ID stays generic. CSS vars may be overridden (helix keeps `--hx-*`, so `style.css` is untouched).

### 3.4 Schema 3 (as built)

```json
{
  "schema": 3,
  "meta": { "id": "helix", "name": "PTCB26 home helix", "version": "1.1.0", "kind": "card", "category": "cards",
            "tags": { "purpose": ["card", "list"], "interaction": ["hover", "drag", "touch", "keyboard"] },
            "tierMin": "free", "source": { "origin": "original", "author": "Rob" }, "license": "original", "status": "ready" },
  "inherits": "core@1",
  "animated": true,
  "core": {
    "hide": ["IX_PRESS", "RADIUS"],
    "opt": ["COLOR_FILL_2", "COLOR_MUTED", "SCALE_LABEL", "MOTION_DIRECTION", "DEPTH_PERSPECTIVE", "MOTION_INTENSITY", "MOTION_CYCLE"],
    "freePicks": ["TEXT_FADE_ON", "END_FADE_ON"],
    "interaction": { "mode": "rate" },
    "override": { "OPACITY_FILL": { "label": "Card opacity", "max": 1.2, "default": 1, "css": "--hx-fill-op" } }
  },
  "layout": { "deck": ["Spacing & Radius"], "pads": ["Fades"] },
  "groups": { "rate": ["Tempo", "Turn", "Loop time", "Text fade", "Shell dim", "End fade", "Border fill"] },
  "order": ["COLOR_BORDER", "COLOR_TEXT", "COLOR_GLOW", "COLOR_FILL", "…"],
  "extras": [ { "id": "STEP", "label": "Turn per card", "section": "rate", "group": "Turn", "widget": "knob", "min": 0, "max": 90, "step": 1, "default": 44, "tier": "mid" } ],
  "aliases": { "SPEED": "MOTION_SPEED", "CARD_W": "SIZE_W" },
  "aliasVersion": 1
}
```

- **Override whitelist** (`core.json overrideWhitelist`): label, short, min, max, step, default, unit, options, css, tier, group, section, widget, variant, deckLabel, pair, padTitle, padSub, role, hint, where, note, featured, advanced, signature, master, timeRole, interaction, cssMap, alpha, bind. `null` removes a core key.
- **Resolution order:** core.json → interaction mode (`rate` | `fx`) → `core.override` → extras → `freePicks` (Free) → `order` → tier sort per group. Schema-2 manifests still load unchanged.
- **Widgets** (manifest field): swatches, seg-pads, pad, switch, h-slider, knob, v-fader, fx-unit, tempo-deck, select, select-compact.
- **Behaviour flags replace ID checks:** `master: "speed" | "intensity"`, `timeRole: "cycle" | "direction"`, `interaction: hover | press | drag | touch | key`, `deckLabel`, `padTitle` / `padSub`, `pair`, `layout.deck` / `layout.pads`. `manifest.time` is derived from the flags.
- **Name clashes found while building:** "signature" already means the ✦ sparkle mark, so the proposal's `core.signature` Free picks are named **`freePicks`**; "role" is the swatch colour role, so time roles are **`timeRole`**.

### 3.5 Helix Steps A + B

- **Step A (core tags):** the 22 generic helix vars resolve from core@1 (`v.core`), taking section / widget / tier / behaviour from core.json plus minimal overrides; lab code no longer references helix IDs.
- **Step B (rename + aliases):** the 22 take core IDs (21 renamed; `GLOW_STRENGTH` was already core). `aliases` (old → new) live in the manifest permanently. Migration, idempotent and versioned (`idVer:<id>`), runs on **every** load of the component: `values:`, every `snaps:` slot (A/B/C) and `featured:` are renamed in the raw store (a key already on the new ID wins); the URL hash maps old keys; backup import reloads the component and so passes through the same migration; undo history is in-memory and starts clean; palette presets are role-based (no IDs). Exports (Copy changes, interaction line, working-file comment) show `NEW (was OLD)` for one release; `LAB_PARAMS` uses the new IDs; Save to disk / Export JSON write the schema-3 source with star changes folded back in.
- Helix `component.js`: 12 `P.<OLD>` reads renamed + `cycleParam: 'MOTION_CYCLE'`.

### 3.6 New-component scaffold + checklist

`python new-component.py quiz-button --kind button --category buttons --tags purpose:button,interaction:hover --license original` (also the lab's **+ New** via `serve.py /api/new`). It copies `_template` (schema 3, inherits core@1, the 5 IX slots wired in `component.js`, CSS centred), writes meta + per-kind frames / stars / default overrides / palette, runs the checker (index + registry), and removes the folder if the check fails. `--license licensed-private` is refused.

Checklist per new component:
1. Scaffold with the script (never copy the helix).
2. Record the original's real constants (NOTES / `meta.source.note`); overrides so defaults = original look and ranges cover it.
3. Hide core controls that truly do not apply (one-line reason).
4. Add extras in named groups with widget, unit, tier; noun-first IDs.
5. Pick the 2 Free `freePicks` (the 2 most visible knobs).
6. Wire all 5 interaction slots, or set the slot's options to the honest subset.
7. Tier budget: Free 6, Mid ≤ 22, Pro all.
8. Check centring + sandbox fit at 1600x770 and 1366x768, cursor and touch.
9. Checker green; meta filled; licensed rebuilds only in the private root.
10. Copy changes + working file export open and run standalone.

### 3.7 Risks (proposal) and how P0 handled them

| Risk | Mitigation |
|---|---|
| A missed helix-ID check silently changes a widget | Before/after DOM dump of all control rows at Free/Mid/Pro (see §6) — only the intended changes differ |
| ID rename breaks saved values / snapshots / links / backups | Aliases + idempotent load-time migration of values, snaps, stars and hash; tested with seeded old-ID data |
| Core ranges too narrow / wide for a component | Overrides allowed; checker flags defaults outside the range |
| Mid budget overflow as extras grow | Checker enforces Free ≤ 6, Mid ≤ 22 |
| "featured" overlaps tier / signature | `featured` stays a user star only; `freePicks` drives Free |
| Rate → Motion section change disturbs rail order | Not done (Rate kept per t590u) |
| Licensed leakage | core.json and `_template` 100% original; checker licence guard scans `components/` and `lab/` |
| Performance | One ~10 KB core.json fetch, cached; merge is O(vars) |

---

## 4. Open and deferred items

- **Rate → Motion merge** (proposal): deferred by Rob (t590u). Core speed / intensity / cycle sit in Rate › Tempo meanwhile.
- **Dedicated component section** ("Helix" section for extras): deferred; `component` maps to the existing sections for now (helix extras keep their sections).
- Dual-handle `FADE_RANGE` widget (fixes A/B ordering properly); `IX_PRESS` ripple variants; scroll as a core slot; lab-wide reduced-motion setting.
- Shift+wheel fine step; hash / snapshot clamp on load.
- `lab/scan.js` (auto-scan, no manifest) still emits schema-2 IDs (`HOVER`, `SPEED`, …); move it to core IDs in P1.
- `kinds.json` per-kind hide lists (e.g. animated-background hides `SCALE_TEXT`, `IX_PRESS`) — not added yet.
- `manifest.groups.rate` orphan "Loop time"; KEY_PAUSE pad style; TILT knob; "MASTER" caption; two Glow cards.
- Remove the `(was OLD)` export suffix after one release.
- Library popover, category folders, private root, thumbnails, ui-vault sync (P1–P3).

---

## 5. P0 completion status & remaining checklist

### P0 — done (committed `d090c4a` on `feat/icons-dock`, Oct 31, 2026 ET)

- [x] `components/_core/core.json` — core@1: 12 core + 5 IX slots + 16 optional, widgets, override whitelist, groups, budget, tag vocab, categories, licences, statuses.
- [x] `lab/manifest.js` — schema-3 resolver (`resolve`, `renameKeys`, `sourceForSave`, `widgetOf`); loaded before `lab.js`.
- [x] `lab/lab.js` — loads core.json for schema 3, alias migration (values / snaps / stars / hash), `speedVar()` / `scanIx()` instead of `byId.SPEED/HOVER/TOUCH/DRAG/KEY_PAUSE`, `layout.deck` / `layout.pads` instead of group names, Mid lone-control centring + Size mixed deck.
- [x] `lab/controls.js` — no helix IDs: `deckLabel`, `padTitle` / `padSub`, `variant: compact`, `widget: fx-unit`, `master: speed`; Mid Speed slider + pads.
- [x] `lab/export.js` — schema-3 source for Save / Export JSON, resolved vars in the working file, `NEW (was OLD)` in exports.
- [x] `lab/lab.css` — `.is-single` centring.
- [x] Helix: schema-3 manifest (22 core + 21 extras, Step A + B), `component.js` renamed reads, CARD_FILL on the Pro front.
- [x] `tools/check-components.py` — validator, licence guard, `components/index.json` + generated `registry.js`; wired into `serve.py` (start, Save) and `new-component.py`.
- [x] `new-component.py` — schema-3 scaffold with `--kind --category --tags --license [--title]`.
- [x] `components/_template` rebuilt on core@1 (manifest, component.js with the 5 IX slots, centred style.css, kinds.json on core IDs).
- [x] Docs: README, COMPONENT-LAB-REVIEW-MVP.md, this file.

### P1 — status (committed + pushed, Oct 31, 2026 ET)

P0 was committed on `feat/icons-dock` as `d090c4a` (Rob t591u "commit this"). P1 below was committed together with the wizard / navigation plan docs and pushed to GitHub (Rob t594u).

- [x] `components/_template` on core@1 (inherits core, 5 IX slots wired, centred CSS) — passes `tools/check-components.py`. `kinds.json` now has per-kind `hide` lists (button: `SIZE_W`, `IX_DRAG`; nav: `IX_DRAG`; animated-background: `SIZE_W`, `IX_DRAG`, `IX_PRESS`), applied by `new-component.py`.
- [x] `lab/scan.js` emits core IDs: CSS custom properties that match a core control's `css` (e.g. `--radius`, `--c-border`, `--w`) and common names (`SPEED`, `EASE`, `GLOW`, `PAD`, `GAP` …, `CORE_SYNONYMS`) use the core ID; interaction controls are `IX_HOVER`, `IX_DRAG`, `IX_TOUCH`, `IX_KEY` (+ non-core `IX_WHEEL`, `IX_CLICK`, `IX_HOVER_CSS`); master speed is `MOTION_SPEED`. Each rename goes into the scan result's `aliases` and the lab migrates saved data of auto-scanned components once (`migrateIds`). Lab capture guards use `scanIx(kind)` instead of `byId.WHEEL / CLICK / KEYS`. The lab passes `core.json` to `Scan.analyze`.
- [x] Component #2 **`glow-button`** ("Glow button", kind button, category buttons, status ready): made with `new-component.py`, then its own markup / JS / CSS. Manifest: inherits core; hides `SIZE_W` + `IX_DRAG`; opt `COLOR_ACCENT`, `BLUR`, `WEIGHT`, `TRACKING`, `SPACE_PAD`, `HOVER_LIFT`, `IDLE`; freePicks `GLOW_STRENGTH` + `RADIUS`; extras in the "Button" group (`section: component`, shown under Layout): `BTN_ICON` (Mid, pads none / arrow / play / plus), `BTN_SHEEN` (Mid, pad), `BTN_SHEEN_ANGLE` (Pro, knob 0–180°), `BTN_PULSE` (Pro, pad), `BTN_CASE` (Pro, pads). Free 6 / Mid 17 / Pro 27. Slots: hover lift / glow / both + sheen, press squash / flare, touch same-as-hover or ignored, keyboard focus ring or out of tab order. No helix code.
- [x] Picker and toolbar menu show names from `components/index.json` (fallback: folder id).
- [ ] Port the disintegrating gallery (ours, original, not the licensed bundle) as #3 — **skipped in P1**: it is an ES module with raw WebGL2 and its own clock, so it needs a module loader path (dynamic `import()` in `mount`), a 16-var schema-3 mapping and `rate`/time wiring. Not a quick port. The licensed Aceternity bundle stays out of this repo.
- [ ] Library popover from `index.json` (search, facets, Recent, Favourites) — moved to P2 with category folders (worth it at 3–5 components).
- [ ] Dedicated "component" section in the rail (extras with `section: component` currently show in Layout).
- [ ] Verify the previous component's raf / CSS / listeners are released on switch with 3+ components (2 checked: CSS swapped, helix values kept).

**P1 verification (light):** checker 0 errors (3 components); `node --check` on `lab/scan.js`, `lab/lab.js`, `glow-button/component.js`; headless Chrome 1600x770 at `?tier=free|mid|pro` for helix (6 / 22 / 43) and glow-button (6 / 17 / 27), 0 console errors; button centred (0 px offset), hover lift −4 px; `IX_TOUCH` / `IX_KEY` / `BTN_ICON` changes applied; helix → glow-button → helix kept helix `MOTION_SPEED` 1.75 and `SIZE_W` 190, glow-button kept `RADIUS` 30; scanner unit check returned core IDs + aliases.

### P2

- [ ] Library popover from `components/index.json` (search, facets: category / tags / status / tier, Recent, Favourites).
- [ ] Disintegrating gallery (ours) as #3 via a module-loader path.
- [ ] Category subfolders + `components-private/` root + `index.private.json` (git-ignored).
- [ ] Thumbnail script (Playwright, 320x200 `thumb.webp`).
- [ ] Optional: Rate → Motion merge (map `ui.railOrder` once); dedicated component section.
- [ ] Cross-component "Looks" presets on core IDs.
- [ ] (Plan, Rob t594u) Decide the toolbar component-list cap (8 / 10 / 12 + "More..." to Library page or popover) - see "Later: New-component wizard and component navigation".
- [ ] (Plan) Shared component-list function for the toolbar dropdown and the dock-header name dropdown, with a "Wizard" entry on top.
- [ ] (Later, not now) New-component wizard stepper in the sandbox (type -> choices -> confirm), paid tiers.

### P3

- [ ] ui-vault sync (`vaultId`; save generic copy to ui-vault `created/` only when Rob asks).
- [ ] Saved filter views; bulk tag editing in Settings › Manifest tools; virtualisation past 200 components.

### Paid-tier offering analysis (Rob t593u, docs only)

Rob's framing: the Pro template builder is "the real nuts and bolts" of the product: a wide range of controls and component banks to start and test with. It is what the lab already does, so this section turns the P0 / P1 findings into a tier offer. Nothing here is built yet.

**1. The banks**
- **Control bank:** (a) **core@1** — 12 core controls (4 colours, fill / border opacity, glow, radius, text scale, speed, easing, width); (b) **interaction slots** — `IX_HOVER`, `IX_PRESS`, `IX_DRAG`, `IX_TOUCH`, `IX_KEY` (scanner adds `IX_WHEEL`, `IX_CLICK`, `IX_HOVER_CSS`); (c) **optional library** — 16 opt-ins (accent, muted, second fill, blur, weight, tracking, label scale, height, padding, gap, direction, intensity, cycle, perspective, hover lift, idle); (d) **component extras** — each component's own controls (helix 21, glow-button 5).
- **Widget bank:** swatches, seg-pads, pad, switch, h-slider, knob, v-fader, fx-unit, tempo-deck, select (core.json `widgets`), chosen per control in the manifest.
- **Component bank:** library components (helix, glow-button, `_template`; gallery next), the 6 kinds in `kinds.json` (card, nav, hero, animated-background, list, button) with frames, starred controls, defaults and hide lists, and the 12 categories in `core.json`.
- **Add-on / connector bank (future):** motion, interaction and effect snippets with their own meta (see "Later: Pro blank-component template builder").

**2. Tier split (recommended)**

| | Free (taste) | Mid (unlock) | Pro (builder) |
|---|---|---|---|
| Controls | 6: 4 core colours + 2 `freePicks` per component | up to 22: all core + interaction slots + chosen opt-ins / extras tagged `tier: mid`; real ranges (sliders, not just presets) | everything: all extras, flip-card backs, `where` / `hint`, stars, custom hex, tempo deck |
| Interaction | sees the default behaviour only | the 5 IX slots | slots + scanner-only slots + interaction scan diagnostics |
| Components | 2–3 featured components (one per kind family), read-only | full public library, kind templates, snapshots A/B/C (save is Pro today) | library + blank template + `+ New` / `new-component.py`, manifest Save / Export / Re-scan, the builder pop-out, private banks |
| Output | copy values | copy changes / working file | export manifest + code, connectors, later ui-vault sync |

- Free shows "what this lab can do" on every component with the same 6-control shape, so it stays a fair taste and the budget check (`budget.free = 6`) enforces it.
- Mid is the "tune any component fully" plan: the 22-control budget stays the cap, so Mid never becomes Pro by accident.
- Pro is "make and extend components": the builder, scaffold, scanner and connector suggestions.

**3. How schema 3 meta drives it**
- Per control: `tier` (free / mid / pro), `freePicks`, `featured`, `signature`, `advanced` decide what each tier shows; the checker enforces the budget.
- Per component: `meta.tierMin` can gate a whole component (for example Pro-only showcase components); `status` (draft / ready / template) hides drafts from Free and Mid; `license` keeps private / licensed entries out of public tiers.
- Library and builder: `kind`, `category`, `tags.purpose`, `tags.interaction`, `tags.tech` (code language) and `tags.feel` drive Library filters (P2) and the builder's suggestions (match add-ons whose applies-to kinds / tech overlap; skip what the component already covers via `core.hide` / `opt`).
- `components/index.json` already carries control counts per tier, so a tier badge ("6 / 17 / 27") and upsell hints need no extra data.

**4. Seeding and testing the banks**
- Starter components (one per kind, all original): glow-button (done), a card, a nav / tabs, a hero, a list, an animated background, plus the helix and the gallery as showcase pieces. Each made with `new-component.py`, checked, and loaded headless at Free / Mid / Pro.
- Starter add-ons (for the builder): spring easing, idle float, press ripple, sheen sweep, glow pulse, scroll reveal, cursor tilt, glass blur, each with CSS + vanilla JS snippets and the core / opt IDs it adds.
- Test loop per bank item: checker (ranges, defaults, budget, licence), headless tier load with 0 console errors, interaction slot smoke test (hover / press / touch / key), and a switch test so saved values never leak between components.

**5. Packaging and licensing**
- **Public bank** (this repo): original or permissively licensed components and add-ons only; checker licence guard blocks Aceternity / licensed markers.
- **Private bank:** git-ignored `components-private/` + `index.private.json` (P2) for licensed rebuilds (for example the Aceternity gallery bundle) and Rob's paid-only pieces; never committed here, shipped only in a private build or separate private repo.
- Paid tiers would unlock private-bank entries by `license` + `tierMin`; each entry keeps `source.url` / `author` so licence terms can be checked before anything is offered to paying users (some licences don't allow redistribution even to paid users).

**6. Open questions for Rob**
1. Final tier names and prices (Free / Base / Pro kept for now), and whether Mid saves values and snapshots (only Pro saves today).
2. How many components Free sees: all of them at 6 controls, or a featured few?
3. Is the builder Pro-only, or does Mid get a read-only "what could be added" preview as an upsell?
4. Should private / licensed banks ever be part of a paid offer, given their licence terms?
5. Snippet languages beyond CSS / vanilla JS (React first?), and where the add-on catalog lives (this repo vs ui-vault).
6. Does export (code / manifest) belong to Mid or Pro?

### Later (P3 or after): Pro blank-component template builder

Deferred by Rob (t592u). Docs only, not built.

- **Goal:** build out the top-tier blank component template builder. A pop-out (opened from an "Advanced" button, or from extra pages / tabs) filters the library and offers choices and connectors from what exists and beyond, showing what extra code or connections could add (for example motion), relevant to the component's type, purpose and code language.
- **Access:** Pro only (tier `pro`; listed in `PRO_FEATURES`). Free and Mid don't see it.
- **Inputs:** schema-3 `meta` of the component being built and of the whole library through `components/index.json`: `kind`, `category`, `tags.purpose`, `tags.interaction`, `tags.tech` (code language: vanilla-js, css, svg, canvas, webgl, react), `tags.feel`, `license`, `status`, `deps`; plus core@1 control and `IX_*` slot coverage (which core controls are hidden, which opt-ins are in use).
- **Outputs:** ranked suggestions of add-ons / connectors, for example motion (idle loop, spring easing, scroll reveal), interaction (press ripple, drag, cursor-follow), effects (sheen, glow pulse, glass blur), each with a short what-it-does note, the core / optional control IDs it would add, and a code snippet per language (CSS, vanilla JS, later React). "Add" would write the extra into the manifest and starter code (Pro, with undo).
- **Already enabled by P0 / P1:** tag vocabulary and categories in `core.json`; per-component meta + control counts in the generated `index.json`; `core.opt` library and `overrideWhitelist`; per-kind defaults / hide lists in `_template/kinds.json`; `new-component.py` scaffold; `check-components.py` validation; licence field + licence guard.
- **Prerequisites:** a fuller library (several components per category), the Library popover / index reader (P2), tag vocab kept current, licence flags on every entry so licensed or private sources (`components-private/`) are never suggested into the public tree, and a snippet store (an `addons/` catalog with its own meta: applies-to kinds / tech, adds controls, licence).
- **Open questions:** where the snippet catalog lives (in this repo vs ui-vault); suggestion ranking (tag overlap only, or usage); whether "Add" edits files through `serve.py` or only copies code; how React snippets fit a vanilla lab; whether Mid gets a read-only preview.

### Later (P2-related, docs only): New-component wizard and component navigation

Added by Rob (t594u). Plans only - **not built**; Rob: "i dont want to create the wizard now, just add to plans".

**a) New-component wizard (paid tiers)**
- A button on the **expanded paid-tier dock** opens a **wizard stepper inside the sandbox** (sandbox stays primary: the stepper floats over it and never resizes / reflows it) that assists the user in creating a new component.
- **Step 1 - qualifier questions:** what type of component (for example card, button, nav, hero, list, animated background - the kinds in `_template/kinds.json` and categories in `core.json`).
- **Step 2 - next choice(s):** offered from the step-1 answer (for example purpose / feel / interaction / code language, starter controls and add-ons), filtered by library tags.
- **Step 3 (most likely final) - confirm:** summary of choices, then "Start customizing" scaffolds the component (same path as `new-component.py`: core@1 + kind hide lists + chosen opt-ins) and loads it in the sandbox.
- Relates to "Later: Pro blank-component template builder": the same schema-3 meta / `components/index.json` tags drive the wizard choices; the builder pop-out is the deeper "Advanced" layer after the wizard.

**b) Toolbar component dropdown**
- A **"Wizard"** option at the top (for example "+ New with wizard"), a divider, then the components listed below it.

**c) Open decision: how many components before overflow** (no decision made)
- Options: list **8**, **10** or **12** components, then a **"More..."** entry that opens the component folder / Library page (redirect) or the P2 Library popover.
- Trade-offs: 8 keeps the menu short and fits 1366x768 with no scroll, but pushes users to the Library sooner; 10 is a middle ground; 12 shows more at once but needs a scroll or tighter rows on 1366x768 and gets slow to scan. Ordering inside the cap (Recent / Favourites / featured / alphabetical) changes which cap feels right. A cap based on viewport height is another option.

**d) Idea: component name at the far right of the expanded dock as a dropdown**
- Make the component name in the expanded dock header a dropdown with the **same list logic** as the toolbar dropdown (Wizard option on top, same overflow rule and "More..."), from one shared list function so both stay in sync.
- Open questions: tier visibility (Wizard Pro only, or Mid too? Free sees only the list?); mobile / slim dock behaviour (dropdown, sheet, or hidden); Recent / Favourites ordering; centred header layout and touch target size.

### Deferred

- [ ] Dual-handle fade range widget; IX_PRESS ripple; scroll slot; lab-wide reduced motion.
- [ ] Shift+wheel fine step; hash / snapshot clamp.
- [ ] Cosmetics: KEY_PAUSE pad style, TILT knob, "MASTER" caption, orphan "Loop time", two Glow cards.
- [ ] Drop the `(was OLD)` export suffix after one release.

---

## 6. Status log

| When (ET) | What |
|---|---|
| Sat Oct 31, 2026 | Mid/Pro menu audit + library scaffolding review (read-only). 43 controls verified; 3 must-fixes, 1 should-fix, defer list; schema-3 meta + phases P0–P3. |
| Sat Oct 31, 2026 | Base template proposal (read-only): core@1 (12 core + 5 IX slots + optional library), naming, schema 3, helix Steps A/B, scaffold checklist, risks, phased plan. |
| Sat Oct 31, 2026 | Rob (t590u): P0 as one local uncommitted run; keep Rate; helix gets both steps; update docs; add this reference. |
| Sat Oct 31, 2026 | **P0 run (uncommitted, branch `feat/icons-dock`)** — built on a box copy, served on a temp port (not 5179), files copied back to the PC. Results below. |
| Sat Oct 31, 2026 | Rob (t591u): P0 committed `d090c4a` on `feat/icons-dock`; **P1 run (local, uncommitted)**: scan.js on core IDs, kinds hide lists, component #2 `glow-button`, picker names from index.json; gallery port skipped. Rob (t592u): "Pro blank-component template builder" added as a Later item; Rob (t593u): "Paid-tier offering analysis" added (docs only). |
| Sat Oct 31, 2026 | Rob (t594u): New-component wizard + toolbar/dock component dropdowns added as plans (not built); P1 committed and `feat/icons-dock` pushed to GitHub. |

**P0 verification (light):**
- `node --check` on every `lab/*.js`, both `component.js` files and `registry.js`: pass.
- Headless Chrome at 1600x770, `?reset&tier=free|mid|pro#c=helix`: no console errors; Free 6 / Mid 22 / Pro 43 rows, same set and same order as before (old IDs mapped to new).
- Before/after row diff (section, card, flip face, widget class, range, caption, value) — only the intended changes: Mid `MOTION_SPEED` gained its 0.25–3/0.05 slider; Mid `N` + `SIZE_W` now in the Size mixed deck with the Card width tile centred; Mid `RADIUS_MAX` centred; Pro `COLOR_FILL` moved from the flip back to the front.
- Manifest-level check: `resolve(new helix manifest, core.json)` equals the old 43 vars except renames and added metadata (`core`, `was`, `widget`, `deckLabel`, `pair`, `padTitle`, `padSub`, `timeRole`), N `variant: compact`, and `COLOR_FILL advanced` removed. No range, step or default changed.
- Migration test: seeded old-ID values, snapshots A/B and stars, reloaded → all moved to new IDs (`idVer:helix = 1`) and displayed; an old link `#c=helix&SPEED=1.5&CARD_W=170` applied and rewrote to new IDs.
- `_template` loads at Free / Mid / Pro with no errors (6 / 17 / 27 controls). Checker: 0 errors; negative test caught a core-name clash, bad range, default out of range, Free over budget and an Aceternity marker; `--license licensed-private` refused.
