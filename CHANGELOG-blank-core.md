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

## feat/blank-default
- Fresh load opens the blank template (`START_COMPONENT` in lab/lab.js), not helix. Helix stays in the library.
- Type menu removed: Scale + Label size -> Layout > Size; Weight + Letter spacing -> Layout > Text. 6 menus: Color, Interaction, Surface, Motion, Rate, Layout.

## feat/blank-default: Rate merged into Motion (Rob t685u)
- 5 main menus: Color, Interaction, Surface, Motion, Layout. `rate` removed from `CATS` and `core.sectionOrder`.
- Motion groups: Timing (Speed, Seconds per loop, Play direction), Movement (Movement feel, Movement strength, Move when idle), Depth (3D depth strength), Hover (Lift). Short labels: Speed, Loop time, Direction, Feel, Strength, When idle, 3D strength.
- Old files: `section`/override `rate` -> Motion, `type` -> Layout (`SECTION_MAP` in lab/manifest.js; `groups.rate` order joins `groups.motion`); scan.js emits Motion; checker accepts retired sections.
- Motion flip pair: Movement <-> Depth. Helix motion group order set to Timing, Movement, Depth.
- Layout > Size: Width before Scale (Height is Pro, sorts after Mid controls).
- Ids, saved values, tiers unchanged. resolve-baseline rewritten on purpose for this change.

## feat/blank-default: Surface titled Style (Rob t688u)
- Main menu title "Surface" -> "Style" (`CATS` label only). Id stays `surface`, so control ids, saved values, tiers, rail order and old `"section": "surface"` files are unchanged. Submenu names unchanged.

## feat/blank-default: Pro first (Rob t689u)
- Style submenus: Opacity, Glow, Corners (was Shape), Glass (was Effects); flip pair Corners <-> Glass. Labels: Corner roundness / Roundness, Background blur / Blur.
- Order: `core.order` (scheme order) sorts every group; the old Free-then-Mid-then-Pro sort inside a group is removed (Mid/Free just show a subset in the same order). Layout > Size: Width, Height, Scale; the Size card draws its Width/Height faders above Scale.
- Duplicates fixed: glow-button relabelled SCALE_TEXT "Label size", next to core SCALE_LABEL "Label size" (both text sizes). Override removed (Scale everywhere); SCALE_LABEL is now "Secondary text size" in Layout > Text; TRACKING short "Tracking" -> "Letter spacing". Helix: Text fade/Shell dim shorts "Starts" -> "Text starts"/"Dim starts".
- Blank template (Pro) now opts in Height (min-height on card, hero, list, modal; default 80px, no visual change) and Secondary text size (scales .cmp-text / field hint); hidden on kinds where they do nothing.
- resolve-test: new duplicate-visible-label check per menu (8 kinds, glow-button, helix). Baseline rewritten on purpose. Ids, saved values, tiers unchanged.

## feat/blank-default: no mouse-wheel on dock controls (Rob t691u)
- Removed the wheel handlers that changed values on knobs (radial dial) and the tempo deck (fader + jog). The wheel now always scrolls the dock; keyboard and drag still work. resolve-test fails if lab/controls.js gets a wheel listener again; tools/test/wheel-scroll-check.py is the browser check.
