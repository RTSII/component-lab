# Naming standard (subcards, groups, menus)

Rule: **every subcard, group and menu name says what it controls.** A reader should know which part of
the component or which parameter moves before touching the control.

## Groups (subcard titles)

| Where | Name it after | Examples |
|---|---|---|
| Colour groups that paint the component body (`COLOR_BORDER`, `COLOR_FILL`, `COLOR_FILL_2`) | the element being painted | `Card` (card kind, helix), `Button`, `Nav`, `Hero`, `List`, `Modal`, `Field` (input), `Backdrop` (animated background) |
| Other colour groups | the role | `Text`, `Glow`, `Accent` |
| Color section single rows (no flips) | Fill row: the words the two fill labels share (`Fill top` / `Fill bottom` -> `Fill`); Text selector: each control's `short`, else `label` | `Fill`, `Number \| Label \| Zero value` (helix), `Text \| Muted` (template) |
| Flip-card front / back | the two halves of one topic | `Size <-> Style` (type), `Corners <-> Glass` (Style, id surface), `Pointer <-> Touch & keys` (interact), `Movement <-> Depth` (motion) |
| A component's own controls (`extras` with `"section": "component"`) | the component's part | `Button` (glow-button: icon, sheen, pulse, case) |
| Advanced back of a flip | `<front>·Adv` only when the back is the same topic in more depth | `Turn·Adv`, `Tempo·Adv` (helix) |

Do not use a generic name (`Misc`, `Other`, `Options`) or another component's name.

## Where names come from (no hard-coded component ids)

- **Template kinds:** `components/_template/kinds.json` → `kinds.<id>.colorGroup`. Leave it out when the
  core name (`Card`) already fits. `tools/check-components.py` warns when a kind's colour group is empty.
- **Real components:** `manifest.json` → `core.override.<ID>.group` plus `groups.color` for the order.
  Example (glow-button): `COLOR_BORDER` / `COLOR_FILL` get `"group": "Button"`, and
  `"groups": { "color": ["Button", "Text", "Glow", "Accent"] }`.
- **Component groups first in Layout:** controls with `"section": "component"` get the internal flag
  `componentGroup` (lab/manifest.js) and are ranked first in Layout, ahead of signature groups.
- **Flip pairs:** `FLIP_PAIRS` in lab/manifest.js are keyed by section (`surface`, `interact`, `type`,
  `motion`). A component can add or override pairs with `manifest.source.flipPairs`
  (`{ "<section>": { "<front>": "<back>" } }`).

## Saved data is safe across renames

Saved values, snapshots and stars (`values:<id>`, `snaps:<id>`, `featured:<id>`) and the `#c=` hash are
keyed by **control id** (`UPPER_SNAKE`), never by group name. Renaming a group changes only the title.

## Control ids and labels

- Ids: `UPPER_SNAKE`, prefixed by topic (`COLOR_`, `OPACITY_`, `MOTION_`, `IX_`, `SIZE_`, `SPACE_`;
  component extras use a short component prefix, e.g. `BTN_`, `HX_`). Never rename an id without an
  `aliases` entry.
- Labels name the parameter in the component's terms ("Button border", not "Border colour 1").

## Menus (applied, feat/blank-default)
Five menus: Color, Interaction, Style, Motion, Layout (Style = id `surface`, retitled t688u). There is no Type or Rate menu; Rate's controls are in Motion > Timing (Speed, Loop time, Direction) and Motion > Movement (Feel, Strength, When idle), 3D strength in Motion > Depth.
There is no Type menu. Layout > Size: Width, Height, Scale. Layout > Text: Secondary text size, Weight, Letter spacing. Style: Opacity, Glow, Corners, Glass.
A component must not relabel a general control so it reads like another one (glow-button no longer calls Scale "Label size"). tools/test/resolve-test.js fails if two controls in one menu show the same label or short label (8 kinds, glow-button, helix).
Order inside a group = core.order (Pro scheme order); tier never reorders.
