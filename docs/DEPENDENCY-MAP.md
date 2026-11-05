# Dependency map: every Pro control, its parent, and what "off" means

Source: read from the code on feat/blank-default @ a6bf444 (`components/_core/core.json`, `components/_template/kinds.json`,
`components/_template/style.css`, `components/_template/component.js`, `lab/lab.js`, `lab/controls.js`).
Rules: [HIERARCHY.md](HIERARCHY.md). Anything marked **PROPOSED** is not applied.

**Today the dock has no dependency logic at all**: no control greys out or hides when another is off
(no `disabled` / dim / hide-by-value code for controls in lab.js or controls.js). The "Parent" column is what the rules require.

## 1. Pro controls (33 core; blank template shows the ones its kind uses)
| # | Menu › Submenu | Control (id) | Parent (primary) | When the parent is off |
|---|---|---|---|---|
| 1 | Color › Card | Border (COLOR_BORDER) | none | n/a |
| 2 | Color › Card | Fill (COLOR_FILL) | none | n/a |
| 3 | Color › Card | Fill (gradient end) (COLOR_FILL_2) | Fill | n/a (no on/off; no CSS on template yet) |
| 4 | Color › Text | Text (COLOR_TEXT) | none | n/a |
| 5 | Color › Text | Muted text (COLOR_MUTED) | none (needs secondary text on the kind) | hide on kinds without secondary text |
| 6 | Color › Glow | Glow (COLOR_GLOW) | Style › Glow strength | grey out when Glow strength = 0 |
| 7 | Color › Accent | Accent (COLOR_ACCENT) | none | n/a |
| 8 | Interaction › Pointer | On hover (IX_HOVER) | Interaction on/off | grey out |
| 9 | Interaction › Pointer | On press (IX_PRESS) | Interaction on/off | grey out |
| 10 | Interaction › Pointer | On drag (IX_DRAG) | Interaction on/off | grey out |
| 11 | Interaction › Touch & keys | Touch (IX_TOUCH) | Pointer (hover/press) | grey out when hover and press are both None |
| 12 | Interaction › Touch & keys | Keyboard focus (IX_KEY) | On hover | focus ring stays; "shows hover" part greys out when hover = None |
| 13 | Style › Opacity | Fill opacity (OPACITY_FILL) | none | n/a |
| 14 | Style › Opacity | Border opacity (OPACITY_BORDER) | none | n/a |
| 15 | Style › Glow | Glow strength (GLOW_STRENGTH) | none (primary for Color › Glow) | n/a |
| 16 | Style › Corners | Corner roundness (RADIUS) | none | n/a |
| 17 | Style › Glass | Background blur (BLUR) | Fill opacity | grey out at Fill opacity = 1 (blur shows only through a see-through fill) |
| 18 | Motion › Timing | Speed (MOTION_SPEED) | Move when idle (fx kinds) / play (animated kinds) | grey out when idle movement is off |
| 19 | Motion › Timing | Seconds per loop (MOTION_CYCLE) | Speed | see §3 (duplicate of Speed) |
| 20 | Motion › Timing | Play direction (MOTION_DIRECTION) | Move when idle / play | grey out when off (no CSS on template yet) |
| 21 | Motion › Movement | Movement feel (MOTION_EASING) | none (also used by hover transitions) | n/a |
| 22 | Motion › Movement | Movement strength (MOTION_INTENSITY) | Move when idle | grey out when idle is off (**PROPOSED** move: §2) |
| 23 | Motion › Movement | Move when idle (IDLE) | none (primary for self-running motion) | n/a |
| 24 | Motion › Depth | 3D depth strength (DEPTH_PERSPECTIVE) | On drag = Tilt | grey out unless drag tilts (no CSS on template: hard-coded `perspective(700px)`) |
| 25 | Motion › Hover | Hover lift (HOVER_LIFT) | On hover = Lift/Both | grey out when hover is None/Glow (**PROPOSED** move: §2) |
| 26 | Layout › Size | Width (SIZE_W) | none | n/a |
| 27 | Layout › Size | Height (SIZE_H) | none | n/a |
| 28 | Layout › Size | Scale (SCALE_TEXT) | none | n/a |
| 29 | Layout › Spacing | Padding (SPACE_PAD) | none | n/a |
| 30 | Layout › Spacing | Gap (SPACE_GAP) | none (needs 2+ items in the kind) | hide on single-item kinds |
| 31 | Layout › Text | Secondary text size (SCALE_LABEL) | the kind has secondary text | hidden by kind (`hide` in kinds.json) |
| 32 | Layout › Text | Weight (WEIGHT) | none | n/a |
| 33 | Layout › Text | Letter spacing (TRACKING) | none | n/a |

Kind-specific extras (glow-button Button › Icon, Hover sheen, Sheen angle, Idle pulse ring, Label case) follow the
same rules: Sheen angle's parent is Hover sheen (grey out when sheen is off); Idle pulse ring's parent is Move when idle.

## 2. PROPOSED (Rob): Interaction owns everything that reacts to the user
- **Hover lift** moves from Motion › Hover to **Interaction › Pointer**, right after On hover, under the Interaction on/off.
- **Movement strength** moves from Motion › Movement to **Interaction**, under the Interaction on/off.
  (Note from the code: on the template, Movement strength drives `--pulse`, the glow breathing of the idle
  animation and the animated-background blobs, not a user reaction. If it moves, its CSS meaning should move too,
  or it becomes "reaction strength". See open decision 1.)
- **Motion keeps only self-running things:** Timing (Speed), Movement (Movement feel, Move when idle), Depth.
- **The Interaction on/off button** moves from the snapshot row (Pro home row, `buildQuickCtl()` in `lab/lab.js`
  ~line 2667, placed by the comment at ~2167) to the **far left of the Interaction dropdown row**. It switches the
  primary interaction (On hover today, `quickVar()`), and side two (Touch & keys) too, because Touch and Keyboard focus
  depend on side one.
- **Card numbers 2 and 3 → 1 and 2.** Checked in code: these are not card numbers. The Interaction "Pointer" card
  is a flip card (`buildFlipCard`, `lab/lab.js` ~1860-1905); its round badge (`.flip-circle`, set at ~line 1901)
  shows the **number of controls on the hidden side**: 2 (Touch & keys) on the front, 3 (Pointer) when flipped.
  It reads as "card 2 / card 3" although there are only 2 sides. **PROPOSED:** show the side number (1 / 2) or a plain
  "flip" icon only, and keep the control count in the tooltip (HIERARCHY rule 7).
- **Speed vs Seconds per loop:** both set tempo (Speed multiplies, Seconds per loop sets the loop length; the clock
  uses both via `time.cycle` / `time.speed`). **PROPOSED:** keep Speed; remove Seconds per loop from the user's menu
  (keep the id as a component setting for the base loop length), or repurpose it as "Loop length" only for animated
  kinds with no Speed.
- **Width / Height → one control:** a mixer-style channel switch (two-position, label shows the active side:
  "Width" / "Height") that drives one slider. **PROPOSED.**
- **Padding / Gap → stepped presets:** None / Tight / Normal / Roomy pads plus a small fine-tune, instead of the
  tempo-deck faders (`v-fader` widget today). **PROPOSED.**

## 3. Where a dependent overrides its primary today (from the code)
1. **Hover lift drives the idle bob.** `style.css` keyframes `cmp-idle` (line ~27) translate by `--lift`, and Hover lift sets `--lift`. So with hover = None, changing Hover lift still changes how far the component floats when idle, and with Move when idle on, a hover setting moves the idle animation. Dependent (lift) leaks past its primary (hover).
2. **Movement strength changes the glow.** `--pulse = 0.5 × --intensity` feeds the box-shadow alpha of card/hero/list/nav/modal (lines ~50, ~98) and the background blob opacity (line ~79). A Motion control changes Style › Glow brightness, even with Move when idle off.
3. **Hover and press replace the drag tilt.** `.cmp` has `transform: perspective(700px) rotateX/Y(--tilt…)` (line ~23); the hover rule (`transform: translateY(...)`, line ~30-34) and press rule (`scale(0.97)`, line ~39) replace the whole transform, so while hovered or pressed the tilt from On drag is dropped. Two primaries fight; neither is a dependent, but the result is that one switched-on behaviour silently cancels another.
4. **Movement feel also sets hover/press transitions** (`transition: ... var(--ease)`, line ~22). A Motion control changes how Interaction reacts. Acceptable if documented as shared; otherwise split.
5. **3D depth strength does nothing on the template** (no `--perspective` in style.css; tilt uses a fixed 700px). Not an override, but a control with no effect (rule 1).
6. **Rate-mode hover (helix):** On hover = Slow/Fast changes the playback rate on top of Speed. Here a primary (hover) overrides another primary (Speed) while hovered; intended, but should be documented.

## 4. Open decisions (only ones that change what a user can do)
1. Movement strength: move to Interaction as "reaction strength" (and stop it driving idle glow), or keep it in Motion for idle breathing?
2. Seconds per loop: remove from the menu (Speed only), or keep it for animated kinds?
3. Width / Height: one switch + one slider, or keep two faders?
4. Padding / Gap: preset pads + fine-tune, or sliders?
5. Dependents when the primary is off: grey out (recommended for Pro) or hide?
6. Kinds: explicit `show` lists (recommended) or keep `hide` lists?

## 5. Applied on feat/hierarchy-apply (Rob t692u/t694u/t695u)

### 5.1 Dependents under their primary (commit 1)
- **How a dependent is declared:** a core control carries `"parent"` and `"showIf"` (core.json; both may be overridden per
  component). `showIf` is a list of OR'd clauses; each clause is `{ ID: [allowed values] }` or `{ ID: { "not": [...] } }`.
  A clause that names a control the component does not have is skipped, so a dependent only hides when its real parent
  is present and off (`lab/manifest.js depShown`). The lab hides the row (all tiers), hides a card whose rows are all
  hidden, and recounts the section and flip-card numbers. Rows stay built, so nothing on the stage moves.
- **Hover lift** → Interaction › Pointer, right after On hover; shows only when On hover = Lift or Both.
- **Movement strength → Reaction strength (template).** Decision: helix uses `MOTION_INTENSITY` as a real self-running
  strength (step, tilt, wave), so the core control stays in Motion for animated components. The blank template's copy
  only fed idle glow breathing (a Style result) and blob opacity, so the template now opts in a new Interaction control,
  **Reaction strength** (`IX_STRENGTH`, `--react`, Interaction › Pointer) that scales hover lift, hover/press glow and
  press squeeze. It shows when hover or press is on. Saved template values move over by alias
  (`MOTION_INTENSITY → IX_STRENGTH`, existing migrateIds path).
- **Glow is Style's again:** card glow no longer breathes with a Motion control (fixed alpha); animated-background blob
  brightness now follows Style › Glow strength.
- **Hover lift no longer drives idle float:** the idle float uses its own fixed `--float` (Motion owns idle).
- **Transforms composed:** drag tilt, hover lift and press squeeze each set one part of one transform
  (`--tilt-*`, `--hov-y`, `--press-k`), so none cancels another.
- **Other parents applied:** Touch (side two) shows only while any pointer interaction is on; Speed and Play direction
  hide when Move when idle is off (only where the component has Move when idle). Motion keeps Timing, Movement
  (feel + idle) and Depth; the Motion › Hover card is gone.

### 5.2 Kinds show only what applies (commit 2)
- `components/_kinds/<kind>/kind.json` + `markup.html` replace the hide lists (HIERARCHY.md 3.2). The migration dropped
  controls that did nothing for the kind's markup: nav (Width, Height, Secondary text size), animated background
  (Background blur, Muted text, Border opacity, Secondary text size, Height, Gap), list (Muted text, Secondary text
  size, Letter spacing), button (Background blur, Border, Muted text, Border opacity, Fill opacity, Secondary text size,
  Height, Gap), input (Height). Card, hero and modal keep everything.
- Render rule: the dock shows the kind's show list, then hides dependents whose parent is off (§5.1).
