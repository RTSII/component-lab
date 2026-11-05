# Component Lab hierarchy (guardrails)

Status: rules doc (Rob t692u/t693u). Nothing here changes code by itself; the build follows these rules.
Related: [LABEL-RUBRIC.md](LABEL-RUBRIC.md) (naming), [MENU-SCHEME.md](MENU-SCHEME.md) (current menus),
[DEPENDENCY-MAP.md](DEPENDENCY-MAP.md) (every Pro control and its parent).

## 1. The three levels
**Menu › Submenu › Control.** Nothing else sits in the dock.

| Level | What it is | Today (feat/blank-default) |
|---|---|---|
| Menu | One of the fixed main menus | Color, Interaction, Style, Motion, Layout |
| Submenu | One sub-topic of that menu (a card in the dock) | e.g. Style › Opacity, Glow, Corners, Glass |
| Control | One setting the user changes | e.g. Style › Corners › Corner roundness |

## 2. Rules
1. **Every control has a parent.** A control belongs to exactly one submenu, and every submenu to exactly one menu. No loose controls, no control in two places (one topic, one place).
2. **A dependent control lives with its primary.** If a control only matters when another one is on (Hover lift only matters when hover is on), it sits in the same menu as that primary, normally the same submenu, right after it.
3. **A dependent follows its primary's state.** When the primary is off, the dependent **hides, in every tier** (Rob t694u; was "grey out in Pro"). Declared with `parent` + `showIf` in core.json (DEPENDENCY-MAP.md §5.1).
4. **A dependent never overrides its primary.** Changing a dependent must never turn the primary on, change its value, or produce the effect the primary has switched off. If the primary says "off", nothing it owns may still move, glow or react.
5. **Plain words.** Every menu, submenu and control label follows LABEL-RUBRIC.md: what a normal person sees and changes, no developer or typesetting terms, no catch-all names.
6. **Submenu labels match their parent.** A submenu is a sub-topic of its menu and reads naturally after it (Motion › Timing, Layout › Size). A control reads naturally after its submenu (Layout › Size › Width).
7. **Numbers follow the real count.** Any card number or count badge shows the real number of things it stands for. Cards numbered as a sequence start at 1 and have no gaps. A badge never shows a number that reads like a card number when it is a control count (see DEPENDENCY-MAP.md §4).
8. **Pro first.** Pro is the full tier and covers every function of the app. Design and approve Pro first; Mid and Free are later subsets cut from Pro, in the same order. Tier never reorders controls.
9. **General app first.** Rules, labels and code key on the general menus and core controls, never on one component (not helix, not the simple button).

**Layout › Size (applied).** Width and Height are one control when both are shown: a vertical metal handle parked at the far left (Width) or far right (Height) of a slot under the fader, a text label of the active side, and one vertical tempo fader (the Motion Speed fader strip). Ids stay `SIZE_W` / `SIZE_H`. Pills, a tilted mid-well bar, and a horizontal slider were rejected. Width alone (no Height in the tier) is the same vertical fader with no switch. Detail: [DEPENDENCY-MAP.md](DEPENDENCY-MAP.md) §5.5.

## 3. Kind flow ("New component")
1. The entry is called **New component** (replaces "Blank template" in the picker and dock title).
2. The user picks one kind from a short list (3-5 shown at once; the full set is card, nav, hero, animated background, list, button, modal, input).
3. The lab then shows only the menus and controls that apply to that kind. A menu with no applicable controls is not shown.
4. What applies comes from backend files only, never from hard-coded UI rules:
   - `components/_core/core.json`: every control (the Pro master list), its menu, submenu, order and tier.
   - `components/_template/kinds.json`: per-kind settings (today: `hide`, defaults, free picks, colour group name).
   - per-kind folders (proposed below): the kind's markup, styles and its own extra controls.

### 3.1 How a kind declares its controls: `hide` vs `show`
| | `hide` list (today) | explicit `show` list (proposed) |
|---|---|---|
| Meaning | everything in core applies except these | only these core controls apply |
| New core control | appears on every kind automatically (may do nothing on some) | appears nowhere until a kind lists it |
| Risk | dead controls (no CSS reads them) slip in | a forgotten control is missing |
| Checker support | `check-components.py` warns on unused CSS vars | checker can fail on a listed id with no CSS |

**Applied (feat/hierarchy-apply):** every kind now has an explicit `show` list (below). Original recommendation: use an explicit `show` list per kind (the kind says what it supports, in Pro order), keep `hide` readable for old files (a kind with `hide` only means "core minus hide"). The checker fails when a shown control has no CSS/JS reading it in that kind's files, and warns when a core control is shown by no kind. This matches rule 1 (every control has a real parent and a real effect).

**Locked.** `components/_kinds/<kind>/kind.json` `show` is the only core set for that kind. A saved component (glow-button, helix, anything new) may not carry a hide or opt list that differs. The lab rewrites hide/opt from the show list on load (`lockKindShow`), and `check-components.py` errors if the file disagrees. The blank template is the pre-kind base and is the one exception. Component extras (helix layout, glow-button icon/sheen) stay on that component; they are not core controls.

### 3.2 Proposed folder layout
```
components/
  _core/core.json              # Pro master list: menus, submenus, controls, order, tiers
  _kinds/
    kinds.json                 # index: kind id, plain name, order in the picker, tags
    card/
      kind.json                # show list, defaults, free picks, colour group name, extra controls
      markup.html
      style.css
    nav/ ...
    hero/ ...
    animated-background/ ...
    list/ ...
    button/ ...
    modal/ ...
    input/ ...
  <saved components>/          # user components made from a kind (manifest.json + files)
```
- Adding a kind = add one folder + one line in `_kinds/kinds.json`; no lab code change.
- Shared base styles stay in one file (today `_template/style.css`) so the kinds stay small; a kind folder only adds what is different.
- Migration (applied): `python tools/migrate-kinds.py` turned `_template/kinds.json` into `_kinds/` (index `order`,
  `kind.json` with `show`, `markup.html`), dropping controls that did nothing for a kind's markup. Loaders (lab,
  check-components.py, new-component.py, resolve-test.js) read `_kinds/` first and fall back to the old
  `_template/kinds.json`, which stays in place. The KINDS table in `_template/component.js` stays as the markup fallback.
  Kind styles still live in the shared `_template/style.css` (per-kind `style.css` is the next step).
- Checker (applied): `tools/check-components.py --check` errors when a kind's `show` list names a control that no CSS
  rule for that kind's markup reads (or, for a control with no CSS, that the component script never names), and
  warns on folders missing from the index, missing show lists and free picks outside the show list.

## 4. Component Wizard
The Component Wizard (later, paid tiers) runs the kind flow as a stepper and teaches the folder structure, naming and tags as it goes (where files go, how a kind and its controls are named, which tags to pick). On first run it opens as a short step-by-step guide that can be skipped at any step and reopened from the menu.
