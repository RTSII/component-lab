# feat/blank-core: blank template as the core (backend half)

Branch `feat/blank-core` from `feat/icons-dock` @ fda87c8 (tag `pre-blank-core`). Not merged.
Helix safety copy: tag `pre-blank-core` + `component-lab-backups/helix-2026-11-02/` (outside the repo).

## Done

- **Regression harness** `tools/test/resolve-test.js` (`node tools/test/resolve-test.js`): helix resolved
  output and Pro layout must be byte-identical to fda87c8; glow-button may change only on listed paths;
  all 8 template kinds resolved in JS and Python must match.
- **Kind checks** in `tools/check-components.py` (warnings only): unknown ids, category, markup missing in
  `_template/component.js`, dead/out-of-range defaults, featured-not-shown, unused CSS vars, budget, colour
  group names. One shared kind merge: Python `apply_kind` / JS `LabManifest.applyKindSpec`.
- **Template kinds: 8** (`card nav hero animated-background list button modal input`); modal + input markup
  and CSS in `_template`, glyphs in the + New dialog, category `forms`.
- **Advanced only on WEIGHT / TRACKING** (core.json).
- **Flip pairing by section** (`FLIP_PAIRS`, `manifest.source.flipPairs`); `orderGroups` / `flipPlan` in lab/manifest.js.
- **Kind switch, console only:** `await __lab.setTemplateKind('modal')`, `__lab.templateKind`, hash key
  `kind=` (only on `#c=_template`), changed values carry over. No UI.
- **Naming:** colour group named after the painted element (kinds.json `colorGroup`; glow-button `Button`);
  component groups ranked first in Layout (`componentGroup`); Help text counts and names come from the
  loaded component. Saved data is keyed by control id (unchanged).
- **/api/new overrides:** optional `{control id: value}`, validated against the resolved controls and applied
  after the palette (save-as-new keeps tuned colours). Rollback on failure kept. + New UI unchanged.
- **Import checker** `tools/import-component.py` + docs/COMPONENT-IMPORT.md (report only).
- **docs/NAMING-STANDARD.md**.

## Visible changes

- glow-button: Color group "Card" → "Button"; Layout shows Button first; Surface is Glow | Shape<->Effects | Opacity;
  Type is Size<->Style.
- + New dialog: 8 kind tiles (one more row).
- Help (Base/Mid): counts and control names follow the loaded component (helix text names its two fade pads).
- Helix: no layout change (6/22/43, every flip pair identical) outside Color; Color: see the redesign below.

## Color section redesign (t652u, Mid + Pro dock)

- **Palettes drawer:** painter's-palette button at the left of the Color header (replaces the section icon
  there; the rail icon is unchanged). Section open: hover peeks the palette pills, click pins / unpins them
  (touch + keyboard: button, `aria-expanded`, `aria-pressed`). Closed by default, session only. Caption
  "Palettes from this project" removed from this drawer (`buildPresets({ caption: false })`). Cards start right
  under the header; the drawer slides open (CSS grid rows) and pushes them down.
- **No flips in Color:** `fillPro('color')` now uses `fillColor()` / `colorCard()` (lab.js). A body group's
  fill pair (role `surface` + `surface2`, i.e. `COLOR_FILL` + `COLOR_FILL_2`) is ONE "Fill" row with up / down
  elevator buttons (up = top colour, default; down = bottom) and a 2-stop gradient preview. No `surface2`
  control (Mid, glow-button, template) = a plain Fill row, no arrows. Border stays its own row.
- **Text (any non-body colour group with 2+ colours):** one row, selector on the left (names from the
  controls' `short` / `label`: helix Number | Label | Zero value, template Text | Muted), the selected
  colour's star / swatches / chevron on the right. Selected option glows (same as the arrows). Arrow keys
  move the selection; double-click an option resets that colour.
- Every colour keeps its own `.ctl` row (same id, star, chips, picker); only the selected one is shown, so
  saved values, palettes, snapshots, undo and tier gating are unchanged. Selections are session only.
- `tools/test/resolve-test.js` is unchanged and still passes: it checks the resolved manifest and the
  group/flip *plan*; the Color section simply no longer renders that plan as flip cards.
- Later idea (not built): each colour group as a card button that expands over the area above it.

## Deferred (not in this branch)

Boot / registry order change (`_template` stays last), empty sandbox, chooser overlay, header slide-down
drawer, VIP blank-template icon, kind picker UI, grouped toolbar menu, wizard, per-kind snapshots/stars,
lab Import button / `--install`.
