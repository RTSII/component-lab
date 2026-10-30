# Component Lab v2

A local page for tuning one UI component by hand. The component sits on a
full-window stage; the controls live in a floating glass card on the right that
folds down to one round button. Two icon buttons at the bottom of the card
copy your changes (the default) or the whole working file. No installs, no build step, no internet (fonts are in `lab/fonts/`).
Plain HTML/CSS/JS, no frameworks. Needs Python 3 and Chrome.

v1 is kept untouched next to this folder in `component-lab-v1/`.

## Install location (fixed)
The lab's permanent root on Rob's Windows PC is `C:\Users\rtsii\Desktop\component-lab`. Every new version keeps this same path and folder name; Rob replaces the old files by extracting the new zip over it (the zip's top folder is `component-lab`, so extract into `C:\Users\rtsii\Desktop`). Double-click `run.bat` to start the server and open Chrome, or run `python serve.py` from that folder (the file is `serve.py`). Chrome only.

## Run it

```powershell
cd C:\path\to\component-lab
python serve.py          # then open http://127.0.0.1:5179/ in Chrome
python serve.py 5180     # any other port if 5179 is busy
```

If `python` is not found, try `py serve.py`. If the port is taken, `serve.py`
says so and you can pass another port. Plain `python -m http.server` also works,
but **New component** and **Save to disk** need `serve.py`.

## Using it

- **Sandbox frame**: the stage previews the component in a **1600×770**
  frame by default (Rob's HP laptop: Chrome on a 1600×900 screen). **1366×768**
  and **Fit** are extra checks under Settings › **Viewport**.
- **Floating toolbar** (top left, see *Toolbar* below): component picker, then
  play/pause (or Space) and the speed/scrub slider. It floats over the stage
  and never changes the sandbox size or position.
- **Dock**: hover the round button (or click it) to open the card. Click inside
  it to pin it open. **Esc** or a click outside closes it (Esc closes the colour
  arc first if it is open). The component re-centres in the space the card leaves.
- **Header**: the component name wraps to a second line instead of being cut
  off (e.g. "PTCB26 home helix" shows in full at 1366×768). Basic/Pro is the
  segmented switch in the header (the old boxed **P** rail button is gone; the
  rail is 46 px wide now).
- **Rail** (right edge of the card): Color, Interaction (only when the
  component has cursor/touch behaviour), Surface, Type, Motion, Rate, Layout,
  then the rail actions **+** (new component) and the **toolbar** button (where
  the old P button was), then the gear (Settings). The order and which
  icons show can be changed in Settings › **Rail order** and **Rail actions**.
- **Quick interaction toggle**: for components with a hover behaviour, a small
  pill under the header ("Hover · Pause") cycles the hover options in one
  click; its chevron jumps to the Interaction section.
- **Basic** shows up to 8 featured controls. Only categories that have a
  featured control get a tab. **Pro** shows every control. Rarely needed ones sit
  under **Advanced**, and each control has a star that adds it to Basic or
  removes it. Components always open in Basic.
- **Colours**: palettes found in the project CSS appear as one-click presets.
  In Basic, a swatch opens the radial picker (chips instead when the system asks
  for reduced motion). The chevron opens the full colour page, where
  **Custom…** reveals a picker and hex box.
- **Pro sections** (accordion): in Pro, every category is stacked in one
  scrolling panel ("All controls") as collapsible sections with centred headers
  and a control count. Click a header to open or close it. A rail icon scrolls
  to its section and opens it, without leaving the page, and the rail follows
  your scroll position. Basic is unchanged.
  - **Layout per section**: a "Pro adds" strip at the top says what Pro gives
    you (all N controls, how many advanced, the interaction set, full-file
    copy). Inside a section, controls are grouped into small cards with
    centred headings (for the helix: Color → Card / Text / Glow; Layout →
    Size / Spacing / Radius / Depth; Rate → Turn / Tempo …). Signature
    features (marked ✦) come first. Each card shows only its main controls;
    the rest sit in a **More** fold, and groups that are all advanced go in
    the section's **Advanced** fold.
  - **Control types**: colours are swatch rows plus palette chips; modes are
    segmented tabs; on/off is a switch; continuous values are sliders;
    angles are a **radial dial** (drag, or arrow keys / Home / End); long
    lists (like card count) are a select.
  - **Collapse state**: *Remember* (default: reopens what you had open, per
    component), *All open*, or *All closed*. Saved in the browser.
  - **Motion variants** (try them live, the choice is remembered):
    **A Slide** (height slide + fade), **B Spring** (the default: a soft
    damped spring, about 3% overshoot, header pinned; the sections below are
    pushed down on the same spring and the body settles in from a slight
    scale; closing uses a quick settle with no bounce), **C Stagger** (rows reveal one by
    one), **D Exclusive** (one section open; the others shrink to small
    icon-height chips above and below it).
  - **Switching**: the **⋮** button next to Basic/Pro (shown in Pro only)
    opens a small menu with both choices; it stays open while you try
    variants, Esc or a click outside closes it. The same two settings are under
    Settings › **Pro sections**. Each change is also written to the footer log.
  - With reduced motion asked for by the system (or Settings › animations
    off), sections open with a short fade or instantly.
- **Footer** (bottom of the card on control pages): Copy changes, Copy full
  file, **Undo** (counter-clockwise arrow) and **Reset** (eraser), then the
  `N changed` count on the right. The buttons share a row when there is room
  and wrap to a second row when not. Hover for a tooltip; Tab + Enter/Space
  works too. A button shows a checkmark for about a second when it worked.
  - **Copy changes** (first, highlighted, the default; page with +/−): only
    what you changed, as `- Label [ID --css-var]: old -> new`, plus the
    component's folder and file names and a link that reopens that exact state.
    Small and exact: best when you continue in the same agent chat that
    already has the file.
  - **Copy full file** (page with `</>`): the whole working file. It is one
    standalone HTML page holding the component's CSS, markup and component.js,
    with every current value baked in (CSS custom properties on `.lab-frame`
    and `LAB_PARAMS`), a header comment listing the changes, and a small runner
    so it plays on its own in Chrome. Best for a new chat or new agent that has
    never seen the component.
  - **Undo**: a multi-step stack (up to 100 steps; one slider drag is one
    step). **Ctrl+Z** undoes and **Ctrl+Shift+Z** / **Ctrl+Y** redoes while
    focus is inside the card (not in a text box). Logged as
    `> undo speed 1.40× → 1.00×`. Disabled when there is nothing to undo.
  - **Reset**: puts every control back to its default in one step, logged as
    `> reset 3 changes`. No confirm needed: Undo brings them all back.
    Disabled when nothing has changed.
  - **Interaction in copies**: both copies include an `Interaction:` line
    (e.g. `hover = pause [HOVER], drag = spin [DRAG]`); the full file runs the
    interaction live.
  - **Log**: under the icons, a two-line terminal log of the last actions,
    newest bright and the older one faded. Examples: `> speed 1.00× → 1.40×`,
    `> copied full file (23 KB)`, `> motion B spring`. One slider drag makes
    one line. With nothing done yet it shows `> no changes yet`. When the card
    is at its maximum height (content scrolls), the log is hidden and only
    the icon buttons show; it keeps logging and reappears when there is room
    (the switch uses the full-footer height, so it does not flicker).
- Double-click a control's label to reset that one control.
- **Settings**:
  - dock position (right or bottom) and anchor (9 points; the card stays pinned
    there and grows away from it)
  - animations on or off
  - **Rail order**: drag the grip (or use the ↑/↓ buttons, or Alt+↑/↓ on the
    grip) to reorder the category icons; the eye hides an icon from the rail
    (its Pro section stays). **Reset to default order** undoes both. Saved in
    the browser for every component; a category a component lacks is skipped.
    The Pro sections follow the same order. **+** and Settings are fixed and
    Settings can never be hidden.
  - **Rail actions**: reorder or hide **+** and the toolbar button (same
    grip/arrows/eye/reset as Rail order). Settings is always last and can never
    be hidden.
  - **Viewport**: sandbox frame **1600×770** (default), plus **1366×768** and
    **Fit** as extra checks.
  - **Toolbar**: show toolbar icon (on/off, saved), a gesture hint, start state
    (closed / open / remember), outside click closes it, flick physics on/off
    and flick strength (Light / Normal / Heavy). See *Toolbar* below.
  - **Pro sections**: collapse state and section motion (same as the ⋮ menu)
  - **Interaction scan**: what the scan found in the component's code (only
    shown when something was found)
  - palette source (project, or *My palette* once you have saved one)
  - My palette (4–6 colours)
  - **Save to disk** / **Export JSON** for the manifest
  - **Hold to reset all** (hold for about 1.2 s)
- Values are saved per component in the browser (localStorage) and in the URL
  hash, for example `http://127.0.0.1:5179/#c=helix&SPEED=1.5&CARD_OPACITY=0.6`.

## Toolbar

A floating layer over the stage (fixed, top left; it moves to the top right
when the card is anchored on the left). Only the toolbar takes pointer events.
The stage fit reserves no space for it, so the sandbox keeps the same box with
the toolbar closed, open or with its menu open (checked numerically in the
tests at 1600×770 and 1366×768). The component menu is also a floating layer: it
sizes to its content (104–320 px; ellipsis only past the maximum) and never
moves the sandbox.

- **Closed** it is one icon. **Click** the icon to open all groups or close
  them. **Shift+click** or **←/→** opens or closes one group at a time.
- **Groups** (left to right): **Component** (the primary group: the picker
  sizes to the name, 104–280 px, and sets the toolbar's width; the slider
  scales from it) then **Playback** (pause + slider; only for animated
  components).
- **Progressive motion**: groups slide open one at a time left to right on a
  soft spring (110 ms stagger) and close **left to right too** (Component first,
  quick settle, no bounce). This applies to click, keys, Esc, outside click and
  flicks. The orders are constants in `lab/lab.js`:
  `TB_OPEN_ORDER` / `TB_CLOSE_ORDER` (`'forward'` or `'reverse'`). Reduced motion
  switches the slide off (instant).
- **Esc** closes the component menu first, then the toolbar. An outside click
  closes it (Settings › Toolbar, on by default; clicks in the card do not count).

### Gestures and flick physics

Shared code in `lab/motion.js` (`Motion.Flick`), with the same Settings for
every flick: a move under 6 px is a click; while dragging the element follows
with a rubber band; on release it springs back; reduced motion keeps the
gestures but drops the throw animations.

| Strength | gentle flick (speed or distance) | strong flick |
|---|---|---|
| Light  | ≥ 0.22 px/ms or ≥ 40 px | ≥ 0.75 px/ms or ≥ 120 px |
| Normal | ≥ 0.35 px/ms or ≥ 60 px | ≥ 1.10 px/ms or ≥ 170 px |
| Heavy  | ≥ 0.55 px/ms or ≥ 85 px | ≥ 1.60 px/ms or ≥ 230 px |

Speed is measured over the last 90 ms of the drag.

- **Rail toolbar button**: click, tap or Enter/Space toggles the toolbar.
  **Flick toward the stage** throws the icon out of the rail with inertia, then
  opens groups: gentle opens the next one, strong opens both. **Flick back**
  (away from the stage) closes one group, or if it is closed (or the flick is
  strong) retracts everything and flies the icon back into the rail.
- **Toolbar icon**: flick right opens the next group (strong = all); a gentle
  flick left closes one group; a **strong flick left or up** (away from the
  corner) **dismisses** it for this session only. The saved setting is not
  changed: it comes back on reload or when you switch component, and the rail
  button brings it back with the throw-in.

### Extension point

`TOOLBAR_GROUPS` in `lab/lab.js` is the list of groups (id, label, primary,
optional `when()`). A group is a `.tb-group[data-group]` in `index.html`; the
code orders and hides groups from the list, so adding one is markup plus one
line. The **Viewport** group is still in the markup and wired to the same
`setView()` as Settings; re-add it with `{ id: 'viewport', label: 'Viewport' }`.
Future device presets (iOS, Chrome sizes) and the layout options / left, right
and bottom panel windows plug in here; they are not built yet.

## Adding a component

**From the lab:** press **+**. Pick a kind (Card, Nav, Hero, Animated bg, List,
Button), then a palette, then a name, and press **Create**. This creates
`components/<name>/` from `components/_template/` with that kind's featured
controls, frame sizes and colours, and adds it to `components/registry.js`.
The lab then loads it.

**From the command line:**

```powershell
python new-component.py quiz-score-card --kind card
```

**By hand:** create a folder in `components/` and add its id to
`components/registry.js`:

```
components/<id>/
  component.js    Lab.register({ title, css: ['style.css'], markup: 'markup.html', animated, mount })
  style.css
  markup.html
  manifest.json   optional; the control list (see below)
```

`mount(frame, { params, manifest, time })` returns `{ render(params, offset), rate(params, dt), destroy() }`.
`rate` is optional: return a multiplier for the loop clock (0 pauses, 0.35 slows,
1.8 speeds up), e.g. while the pointer is over the component. `time.nudge(d)`
moves the clock (drag to spin) and `time.offset` reads or sets it.
The lab calls `render` every animation frame. `offset` runs from 0 to 1 per loop
for animated components. Values with a `css` custom property are also set on the
frame element, so plain CSS components need no JS at all.

## Manifest format

`components/<id>/manifest.json`:

```json
{
  "version": 2,
  "kind": "card",
  "title": "Quiz score card",
  "paletteFrom": ["project/tokens.css", "components/quiz-score-card/style.css"],
  "frames": { "1600x770": { "w": 420, "h": 320 }, "1366x768": { "w": 380, "h": 300 } },
  "time": { "cycle": "CYCLE", "speed": "SPEED", "direction": "DIRECTION" },
  "vars": [
    { "id": "ACCENT", "label": "Accent", "category": "color", "control": "swatch-role",
      "role": "accent", "default": "#00e5ff", "css": "--c-accent", "featured": true },
    { "id": "FILL_OP", "label": "Fill opacity", "category": "surface", "control": "slider",
      "min": 0, "max": 1, "step": 0.01, "default": 0.85, "css": "--fill-op", "featured": true },
    { "id": "EASING", "label": "Easing", "category": "motion", "control": "segmented",
      "default": "glide", "css": "--ease",
      "options": [ { "value": "linear", "label": "Linear", "css": "linear" },
                   { "value": "glide", "label": "Glide", "css": "cubic-bezier(0.22,1,0.36,1)" } ] },
    { "id": "CYCLE", "label": "Seconds per loop", "category": "rate", "control": "slider",
      "min": 2, "max": 60, "step": 1, "default": 26, "advanced": true }
  ]
}
```

- `category`: `color`, `interact`, `surface`, `type`, `motion`, `rate` or `layout`.
- `control`: `slider`, `swatch-role`, `switch`, `segmented`, `select` or
  `radial` (angles; `unit: "°"`). A `select` with `min`/`max` lists every step.
- `group`: the mini card a control sits in (e.g. `Card`, `Text`, `Glow`).
  `"groups": { "color": ["Card", "Text", "Glow"] }` at the top level sets the
  order. Without it the lab guesses groups from the id and label.
- `short`: a shorter label for tight rows. `signature: true`: shown first, with ✦.
- `interaction` (with `category: "interact"`): `hover`, `drag`, `touch`,
  `key`, `wheel`, `click` or `hover-css`. A `hover-css` switch turns the
  component's CSS `:hover` rules on and off (also in the exported file).
- `role` (colours): `accent`, `border`, `glow`, `text`, `muted`, `surface`,
  `surface2` or `danger`. The role decides which palette colours are offered first.
- `css`: a custom property set on the frame. `unit` is appended (`px`, `s`, …).
  `cssMap` maps values to CSS, for example `{ "true": "running", "false": "paused" }`.
- `bind`: `[{ "sel": ".btn", "prop": "opacity", "tpl": "{v}" }]` writes the value
  straight into a rule, for CSS that has no custom property.
- `featured`: shown in Basic (8 at most). `advanced`: under Advanced in Pro.
- `time.cycle` / `speed` / `direction` name the vars that drive the loop clock.

## Auto-scan (no manifest)

If a component has no `manifest.json`, `lab/scan.js` builds one when the
component loads. It reads:

- CSS custom properties
- colour literals (grouped by value)
- opacities, border radii, font sizes and durations (durations follow one
  Speed master)
- `UPPER_CASE` number constants in `component.js`
- **interaction**: `lab/scan.js` strips comments and strings, then looks in
  `component.js` for pointer/mouse enter-leave (hover), pointerdown + move
  (drag), wheel, click handlers (ignoring ones that only call
  `preventDefault()`), key/focus handlers and touch events, and in the CSS for
  `:hover` rules and `touch-action: none`. Each finding becomes a control with
  options: hover → Keep / Pause / Slow / Fast, drag → Spin / Ignore, touch →
  Same as hover / Ignore, focus → a switch, CSS hover → on/off. The findings
  are listed in Settings › Interaction scan. When nothing is found the scan
  note says so and the card shows no Interaction section, rail icon or quick
  toggle. The template has none by default; `components/_template/component.js`
  has a comment showing how to add one.

It guesses the kind and features up to 8 controls. The result is kept in the
browser. Press **Settings › Save to disk** to write it as a real
`manifest.json` that you can then edit. Saving also writes your stars.

## Files

```
index.html               the page
lab/lab.js               dock, pages, controls, stepper, state
lab/motion.js            shared curves, content in/out, sliding pages, velocity pill
lab/scan.js              auto-manifest + palette extraction
lab/lab.css              lab chrome
project/tokens.css       the app's colour tokens (palette source only)
components/helix/        helix + manifest
components/_template/    blank starter (all kinds) + kinds.json
new-component.py         create a component (also used by serve.py)
serve.py                 static server + /api/new + /api/manifest
compare/                 original helix (v109) for side-by-side checks
shots/v2-*.png           screenshots at 1600×770 and 1366×768 (v2-tb-*, v2-flick-* = toolbar pass)
```

## Helix notes

`components/helix/component.js` is `initHelix()`/`layout()` from `js/home.js`
v109, with the constants read from the manifest. **Speed** and **Intensity**
are masters. Turn per card is a radial dial; the other rates and angles are
under Pro › Rate › Advanced. `compare/original.html` runs the untouched v109 file
(`compare/original.html#f=1600&o=0.62`).

The helix interaction is wired live, like `js/home.js`: hovering pauses it
(**On hover**: Keep / Pause / Slow / Fast), dragging up or down spins it
(**On drag**: Spin / Ignore), touch follows hover unless set to Ignore, and
keyboard focus on a card brings it to the front and pauses (**Focus pauses**).
Using the helix does not close the card.
