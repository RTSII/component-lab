**Update (t689u, feat/blank-default):** applied: Shape→Corners, Effects→Glass, Backdrop blur→Background blur, Corner radius→Corner roundness, Tracking→Letter spacing, Label size→Secondary text size (now Layout › Text). Rows below are the original audit.

# Label audit: blank template (8 kinds) + core controls vs LABEL-RUBRIC.md

Read-only audit on `feat/blank-core` (HEAD `e6faa08`), Nov 3, 2026 (ET). No code or labels were changed.
**How:** each kind was resolved with `LabManifest.applyKindSpec()` + `resolve()` + `orderGroups()` +
`flipPlan()` (lab/manifest.js) from `components/_template/manifest.json`, `kinds.json` and
`components/_core/core.json`. Section titles come from `CATS` in lab/lab.js. Pro rows show `short`
(lab/controls.js line 107) and Base shows `label`.
**Status:** OK, or MISMATCH (with the rule number from LABEL-RUBRIC.md). "Proposed" labels are suggestions
for Rob to approve. They are not applied.
**Order:** the Pro-complete table comes first (§0). Mid and Free are subsets of it, never designed upward.
**Helix:** not audited (one line). Its labels are its own overrides and follow this rubric later, if at all.

## 0. Pro-complete table (designed first; Mid and Free cut from it)

This is every core@1 control (12 core + 5 interaction + 16 optional = 33) in final Pro order:
section, then subcard order (`core.groups`), then Free → Mid → Pro inside each card. The **Mid** and
**Free** columns only mark which Pro rows that tier keeps. The tiers have no layouts of their own.
Counts are for the card kind: Pro 33 in the full set, of which 27 are on the template today; Mid 17;
Free 6. Other kinds drop the rows their `hide` list removes (see §2 and §4).
"On template" = shown on the blank template today. "no" means the core has the control but the template's
`opt` list leaves it out.
Face = where it sits in Pro (back = flip back). The Color section has had no flips since t652u, so a Color
"back" just means it's the second choice in its row.

| # | Section | Subcard (now → **proposed**) | Id | Label now | Proposed | Pro face | Mid | Free | On template | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Color | Card → **kind name**¹ | `COLOR_BORDER` | Border | same | front | ✔ | ✔ | yes | OK |
| 2 | Color | Card → **kind name**¹ | `COLOR_FILL` | Fill | **Fill top** (when a gradient exists) | front | ✔ | ✔ | yes | OK |
| 3 | Color | Card → **kind name**¹ | `COLOR_FILL_2` | Fill (gradient end) | **Fill bottom** | back | – | – | **no** | MISMATCH (4) |
| 4 | Color | Text | `COLOR_TEXT` | Text | **Main** | front | ✔ | ✔ | yes | MISMATCH (2) |
| 5 | Color | Text | `COLOR_MUTED` | Muted text | **Secondary** | back | – | – | yes | MISMATCH (1) |
| 6 | Color | Glow | `COLOR_GLOW` | Glow | same | front | ✔ | ✔ | yes | OK |
| 7 | Color | Accent | `COLOR_ACCENT` | Accent | same | front | – | – | yes | OK |
| 8 | Interaction | Pointer → **Mouse** | `IX_HOVER` | On hover | same | front | ✔ | – | yes | OK |
| 9 | Interaction | Pointer → **Mouse** | `IX_PRESS` | On press | same | front | ✔ | – | yes | OK |
| 10 | Interaction | Pointer → **Mouse** | `IX_DRAG` | On drag | same | front | ✔ | – | yes | OK |
| 11 | Interaction | Touch & keys | `IX_TOUCH` | Touch | same | back | ✔ | – | yes | OK |
| 12 | Interaction | Touch & keys | `IX_KEY` | Keyboard focus / Focus | **Keyboard / Keys** | back | ✔ | – | yes | MISMATCH (1) |
| 13 | Surface | Opacity | `OPACITY_FILL` | Fill opacity | same | front | ✔ | – | yes | OK |
| 14 | Surface | Opacity | `OPACITY_BORDER` | Border opacity | same | front | ✔ | – | yes | OK |
| 15 | Surface | Glow → **Glow strength** | `GLOW_STRENGTH` | Glow strength | same | front | ✔ | ✔ | yes | OK |
| 16 | Surface | Shape | `RADIUS` | Corner radius | same | front | ✔ | ✔ | yes | OK |
| 17 | Surface | Effects → **Blur** | `BLUR` | Backdrop blur | **Background blur** | back | – | – | yes | MISMATCH (1) |
| 18 | Type | Size | `SCALE_TEXT` | Text size | same | front | ✔ | – | yes | OK |
| 19 | Type | Size | `SCALE_LABEL` | Label size | same | front | – | – | **no** | OK |
| 20 | Type | Style | `WEIGHT` | Weight | same | back | – | – | yes | OK |
| 21 | Type | Style | `TRACKING` | Letter spacing / Tracking | **Letter spacing / Letters** | back | – | – | yes | MISMATCH (1) |
| 22 | Motion | Loop → **Movement** | `MOTION_EASING` | Easing | **Feel** | front | ✔ | – | yes | MISMATCH (1) |
| 23 | Motion | Loop → **Movement** | `MOTION_DIRECTION` | Direction | same | front | – | – | **no** | OK |
| 24 | Motion | Depth | `DEPTH_PERSPECTIVE` | Perspective | **3D strength** | back | – | – | **no** | MISMATCH (1) |
| 25 | Motion | Hover → **Lift & idle** | `HOVER_LIFT` | Hover lift | same | front | – | – | yes | OK |
| 26 | Motion | Hover → **Lift & idle** | `IDLE` | Idle animation | same | front | – | – | yes | OK |
| 27 | Rate | Tempo | `MOTION_SPEED` | Speed | same | front | ✔ | – | yes | OK |
| 28 | Rate | Tempo | `MOTION_INTENSITY` | Glow / blob intensity (template) | **Motion strength (move to Motion)** | back | – | – | yes | MISMATCH (13, 3) |
| 29 | Rate | Tempo | `MOTION_CYCLE` | Seconds per loop / Loop | **Seconds per loop / Loop time** | back | – | – | **no** | MISMATCH (8) |
| 30 | Layout | Size | `SIZE_W` | Width | same | front | ✔ | – | yes | OK |
| 31 | Layout | Size | `SIZE_H` | Height | same | front | – | – | **no** | OK |
| 32 | Layout | Spacing | `SPACE_PAD` | Padding | **Inside space** | front | – | – | yes | MISMATCH (1) |
| 33 | Layout | Spacing | `SPACE_GAP` | Gap | **Space between** | front | – | – | yes | MISMATCH (1) |


¹ The kind's plain name: Card, Button, Menu bar, Banner, List, Popup, Text box, Background (§2).

**What the Pro-first view shows:**
- **Mid rows on a Pro flip back:** `IX_TOUCH` and `IX_KEY` (rows 11-12). Mid shows them, then Pro hides
  them behind the Pointer flip. This is the one place where the tiers aren't a clean cut.
- **Pro gaps on the template:** 6 Pro rows never appear on any kind (`COLOR_FILL_2`, `SCALE_LABEL`,
  `MOTION_DIRECTION`, `DEPTH_PERSPECTIVE`, `MOTION_CYCLE`, `SIZE_H`). The Pro set isn't complete yet, so the
  Fill arrows and the Depth card can't be seen on the blank template.
- **Free is the same 6 rows on every kind** (default free picks). blank-component.md §3.3 proposed picking
  them per kind from the Pro set, e.g. animated background = Glow strength + Speed.
- **Mid differs by kind only through `hide`:** card / hero / list 17, nav / modal 16, button / input 15,
  animated background 14.

## Totals

| Area | Audited | OK | Mismatch |
|---|---|---|---|
| Accordion titles | 7 | 6 | 1 |
| Kind names (picker / + New) | 8 | 3 | 5 |
| Kind one-line descriptions | 8 | 5 | 3 |
| Color body subcard (per kind) | 8 | 3 | 5 |
| Color other subcards | 3 | 3 | 0 |
| Color controls | 7 | 4 | 3 |
| Color section UI from the t652u redesign | 3 | 2 | 1 |
| Interaction (subcards, controls, flip) | 8 | 5 | 3 |
| Surface (subcards, controls, flip) | 10 | 6 | 4 |
| Type (subcards, controls, flip) | 7 | 6 | 1 |
| Motion (subcards, controls) | 8 | 4 | 4 |
| Rate (subcard, back title, controls) | 5 | 2 | 3 |
| Layout (subcards, controls) | 6 | 4 | 2 |
| Other names (template name, tier word) | 2 | 0 | 2 |
| **Total** | **90** | **53** | **37** |

## 1. Accordion titles

| Title | Status | Proposed / note |
|---|---|---|
| Color | OK | |
| Interaction | OK | Shown only when the component has cursor / touch / key behaviour |
| Surface | OK | |
| Type | OK | A plainer option is "Text", but Color › Text already uses that word, so keep Type |
| Motion | OK | |
| Rate | MISMATCH (3) | Speed, intensity and loop time are all motion. The Rate → Motion merge is Rob's open call (ANALYSIS §4). If it stays, name it "Timing" |
| Layout | OK | core.json `sectionOrder` has an 8th entry, `component`. It isn't a title: those controls show first inside Layout |

## 2. Kinds (same name everywhere: picker, + New tiles, kind strip, Color body subcard)

| Kind id | Picker label | Color body subcard (`colorGroup`) | Description | Proposed name | Status |
|---|---|---|---|---|---|
| card | Card | Card (core default) | Title, text, action | Card | OK / OK / OK |
| button | Button | Button | One call to action | Button | OK / OK / OK |
| list | List | List | Rows with values | List | OK / OK / OK |
| nav | Nav | Nav | Tabs or menu bar | Menu bar | MISMATCH (1, 4: abbreviation) / MISMATCH / OK |
| hero | Hero | Hero | Headline block | Banner | MISMATCH (1: web jargon) / MISMATCH / OK |
| animated-background | Animated bg | Backdrop | Moving backdrop | Background (desc "Moving background") | MISMATCH (4: "bg") / MISMATCH (1: "backdrop") / MISMATCH (1) |
| modal | Modal | Modal | Dialog over a scrim | Popup (desc "Box that pops up over the page") | MISMATCH (1) / MISMATCH (1) / MISMATCH (1: "scrim") |
| input | Input | Field | Labelled text field | Text box (desc "Text box with a label") | MISMATCH (1) / MISMATCH (1: "field") / MISMATCH (1) |

North changed the Color body subcards to Nav, Hero, Backdrop, List, Button, Modal and Field on this branch
(kinds.json `colorGroup`, commit 0c07202 docs). 3 of the 8 conform (Card, Button, List). The other 5 use
developer words and break rule 1. The picker label and the Color subcard also differ for 2 kinds
("Animated bg" vs "Backdrop", "Input" vs "Field"), which breaks rule 6.

## 3. Color (same for all 8 kinds; body subcard name in §2)

| Subcard › control (id) | Label / short now | Proposed | Status |
|---|---|---|---|
| Text (subcard) | Text | Text | OK |
| Glow (subcard) | Glow | Glow | OK |
| Accent (subcard) | Accent | Accent | OK |
| Body › `COLOR_BORDER` | Border / Border | Border | OK |
| Body › `COLOR_FILL` | Fill / Fill | Fill (top when a gradient exists) | OK |
| Body › `COLOR_FILL_2` (core, **not on the template**) | Fill (gradient end) / Fill 2 | Fill bottom / Bottom | MISMATCH (4: "Fill 2" says nothing). Also, no kind opts in, so the up / down Fill arrows never show on the blank template |
| Text › `COLOR_TEXT` | Text / Text | Main | MISMATCH (2: repeats its subcard) |
| Text › `COLOR_MUTED` | Muted text / Muted | Secondary | MISMATCH (1: "muted" is a designer word) |
| Glow › `COLOR_GLOW` | Glow / Glow | (one-control card) | OK |
| Accent › `COLOR_ACCENT` | Accent / Accent | (one-control card) | OK |

**North's Color redesign (t652u, commits 99e3b98 / e6faa08):**

| Item | Now | Status |
|---|---|---|
| Palette button on the Color header | "Palettes" (tooltip) | OK |
| Fill row with up / down buttons | "Fill", "Top colour" / "Bottom colour" | OK, follows the rubric. The template never shows it (see `COLOR_FILL_2`) |
| Text selector | "Text \| Muted" | MISMATCH (2, 1). Its names come from the controls' short labels, so fixing those fixes the selector: "Main \| Secondary" |

## 4. Interaction

| Subcard › control (id) | Label / short now | Proposed | Status |
|---|---|---|---|
| Pointer (subcard) | Pointer | Mouse | MISMATCH (1: "pointer" is a code term) |
| Touch & keys (subcard) | Touch & keys | Touch & keys | OK |
| Pointer › `IX_HOVER` | On hover / Hover | same | OK |
| Pointer › `IX_PRESS` | On press / Press (hidden on bg, input) | same | OK |
| Pointer › `IX_DRAG` | On drag / Drag (hidden on nav, bg, button, modal, input) | same | OK |
| Touch & keys › `IX_TOUCH` | Touch / Touch | same | OK |
| Touch & keys › `IX_KEY` | Keyboard focus / Focus | Keyboard / Keys | MISMATCH (1, 8: "focus" is a code term) |
| Pro flip Pointer ↔ Touch & keys | back holds 2 **Mid** controls | Show both cards in Pro, or make the back hold only Pro controls | MISMATCH (11: Pro hides what Mid shows; breaks core.json `freeRule`) |

## 5. Surface

| Subcard › control (id) | Label / short now | Proposed | Status |
|---|---|---|---|
| Opacity (subcard) | Opacity | Opacity | OK |
| Glow (subcard) | Glow | Glow strength (or move it under Color › Glow) | MISMATCH (3: same name as Color › Glow, so one feature sits in two sections) |
| Shape (subcard) | Shape | Shape (or "Corners") | OK |
| Effects (subcard) | Effects | Blur | MISMATCH (4: a catch-all name for one control) |
| Opacity › `OPACITY_FILL` | Fill opacity / Fill | same | OK |
| Opacity › `OPACITY_BORDER` | Border opacity / Border | same | OK |
| Glow › `GLOW_STRENGTH` | Glow strength / Strength | same | OK |
| Shape › `RADIUS` | Corner radius / Radius | same | OK |
| Effects › `BLUR` | Backdrop blur / Blur | Background blur / Blur | MISMATCH (1: "backdrop") |
| Pro flip Shape ↔ Effects | corners ↔ blur | No flip: two small cards, or put Blur with Opacity | MISMATCH (10: two unrelated topics on one card) |

## 6. Type

| Subcard › control (id) | Label / short now | Proposed | Status |
|---|---|---|---|
| Size (subcard) | Size | Size | OK (Layout › Size is a different parent) |
| Style (subcard) | Style | Style | OK |
| Size › `SCALE_TEXT` | Text size / Text | same | OK |
| Size › `SCALE_LABEL` (core, not on template) | Label size / Label | same | OK |
| Style › `WEIGHT` | Weight / Weight | same | OK |
| Style › `TRACKING` | Letter spacing / Tracking | Letter spacing / Letters | MISMATCH (1, 8: "tracking" is a typesetting term shown in Pro) |
| Pro flip Size ↔ Style | text size ↔ text style | same | OK |

## 7. Motion

| Subcard › control (id) | Label / short now | Proposed | Status |
|---|---|---|---|
| Loop (subcard) | Loop | Movement (or "Feel") | MISMATCH (2: on the template it holds only Easing, which is not a loop) |
| Depth (subcard, core, not on template) | Depth | Depth | OK |
| Hover (subcard) | Hover | Lift & idle | MISMATCH (3: hover also lives in Interaction; Idle is not hover) |
| Loop › `MOTION_EASING` | Easing / Easing | Feel | MISMATCH (1: "easing" is a code / animation term) |
| Loop › `MOTION_DIRECTION` (core, not on template) | Direction | same | OK |
| Depth › `DEPTH_PERSPECTIVE` (core, not on template) | Perspective | 3D strength | MISMATCH (1: "perspective" is a CSS term) |
| Hover › `HOVER_LIFT` | Hover lift / Lift | same | OK |
| Hover › `IDLE` | Idle animation / Idle | same | OK |

## 8. Rate

| Subcard › control (id) | Label / short now | Proposed | Status |
|---|---|---|---|
| Tempo (subcard) | Tempo | Tempo | OK |
| Pro back title | Tempo · Adv | Tempo (more) | MISMATCH (4, 10: "Adv" abbreviation) |
| Tempo › `MOTION_SPEED` | Speed / Speed | same | OK |
| Tempo › `MOTION_INTENSITY` | **Glow / blob intensity** / Intensity (template override, shown on all 8 kinds) | Motion strength / Strength (and move to Motion) | MISMATCH (13: "blob" fits only the animated background; 3: intensity is not a rate) |
| Tempo › `MOTION_CYCLE` (core, not on template) | Seconds per loop / Loop | Seconds per loop / Loop time | MISMATCH (8: short "Loop" equals the Motion › Loop subcard) |

## 9. Layout

| Subcard › control (id) | Label / short now | Proposed | Status |
|---|---|---|---|
| Size (subcard; not on bg, button: width hidden) | Size | Size | OK |
| Spacing (subcard) | Spacing | Spacing | OK |
| Size › `SIZE_W` | Width / Width | same | OK |
| Size › `SIZE_H` (core, not on template) | Height / Height | same | OK |
| Spacing › `SPACE_PAD` | Padding / Padding | Inside space | MISMATCH (1: CSS term) |
| Spacing › `SPACE_GAP` | Gap / Gap | Space between | MISMATCH (1: CSS term) |

## 10. Other names

| Item | Now | Proposed | Status |
|---|---|---|---|
| Blank template name | "Blank template" (meta.name, docs) vs "Blank component" (blank-component.md §1.2 menu) | One name: "Blank template" | MISMATCH (15) |
| Lowest tier word | Pill says **Base**, while the star toast says "is now in Basic (x/8)" (controls.js line 60) and "curate Basic" (lab.js line 2162); Free is 6, not 8 | "Base" everywhere, with the correct count | MISMATCH (15, 12) |

## Item caps (rule 9) and tier order (rule 11)

- Every template subcard holds 1-3 controls on every kind, so no fold is needed. The cap rule isn't
  written into code or the checker, though, so nothing stops a 4+ card.
- `miniCard()` (lab.js line 1927) still special-cases the group name `'Opacity'`, a hard-coded name
  (rule 13). blank-component.md §3.1.1 asked to remove it.
- Tier order inside each group is Free → Mid → Pro (resolve() sorts it) on every kind. The only break is
  the Interaction flip (§4).
- Budget per kind (Free / Mid / Pro): card 6/17/27, nav 6/16/26, hero 6/17/27, animated-background 6/14/24,
  list 6/17/27, button 6/15/25, modal 6/16/26, input 6/15/25. All 8 kinds use the same 2 free picks
  (Glow strength, Corner radius). blank-component.md §3.3 proposed different picks per kind.
