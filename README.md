# Component Lab v2

A zero-build, local browser workbench for previewing, tuning, and exporting individual UI components by hand.

- **Zero dependencies / zero build step:** Plain HTML, CSS, and JavaScript (`ES2022`) served by a lightweight Python 3 standard-library script (`serve.py`).
- **Offline-first:** Self-hosted `Chakra Petch` and `JetBrains Mono` fonts live in `lab/fonts/`. No `npm`, bundlers, or external CDN requests required.
- **Target environment:** Windows PC (`C:\Users\rtsii\Desktop\component-lab`), Python 3, and Google Chrome.

---

## Quick Start

### 1. Fixed Install Location
The permanent workspace root on Rob's Windows PC is:
```text
C:\Users\rtsii\Desktop\component-lab
```
Double-click **`run.bat`** to start the local server and open Chrome, or run from PowerShell / Command Prompt:

```powershell
cd C:\Users\rtsii\Desktop\component-lab
python serve.py               # serves http://127.0.0.1:5179/
python serve.py 5179 --open   # starts server and opens browser once bound
python serve.py 5180          # use another port if 5179 is busy
```
- If `python` is not on `PATH`, use `py serve.py` (`run.bat` checks `py` first to avoid the Windows Store alias stub).
- Plain `python -m http.server` can preview components, but **`serve.py` is required** for the in-app **New Component (`+`)** modal (`/api/new`) and **Save to disk** (`/api/manifest`). `serve.py` validates local `Host`/`Origin` headers, protects `_template` as read-only, and suppresses `__pycache__` generation.
- **Important Origin / Port / `localStorage` Note:** Browser `localStorage` is strictly scoped by hostname and port (`http://127.0.0.1:5179` vs. `http://localhost:5179` vs. `http://127.0.0.1:5180`). Always open the lab at the exact same origin (`http://127.0.0.1:5179/`) so your saved parameter values, starred Basic controls, snapshots, and custom palettes stay visible, or use the JSON backup/restore tools in **Settings › Backup & Reset**.

---

## All-access pass (dock stage 1)

The smallest dock stage is a VIP / all-access lanyard pass instead of a round button: the part of a
backstage badge that hangs from a DJ's lanyard. Portrait, **54 x 84 px**, pinned 16 px from the top and
right edges (exactly where the round button sat), with a short lanyard strap running up to the screen
edge (top anchors only), a metal clip and slot punch, an access band (`ALL ACCESS` by default; also
GUEST LIST, VIP LOUNGE, BACKSTAGE, CREW / TECH, ARTIST / DJ), a photo window, name and role lines
(placeholders `DJ NAME` / `ARTIST`), a barcode, a status LED and a holo sheen that follows the pointer.
It clears the stage toolbar (top left) at both locked viewports, 1600x770 and 1366x768.

| Input | What the pass does |
|---|---|
| Hover | lifts slightly, the holo sheen follows the pointer, tooltip names the pass and shortcuts |
| Click / Enter / Space | next stage (the thin rail); **Shift+click** = straight to the full card |
| Drag | the dock follows with a rubber band and springs back; the badge tilts like it is swinging |
| Flick toward the stage | gentle = next stage, strong = full card (Pro, `PRO_FEATURES.dockFlick`) |
| Strong flick away (edge, up or down) | hides the dock until reload (Pro, `PRO_FEATURES.dockHide` + Settings > Dock > Allow flick-to-hide) |
| `Alt+D` / `Shift+D` | next stage, wrapping card -> lowest stage; from a hidden dock, brings the pass back (and a flicked-away toolbar, top-left) |
| Arrow tab on the edge (hidden dock) | brings back the VIP badge **and** a flicked-away stage toolbar together (toolbar lands top-left) |

Settings > **Profile pass** has a live preview and sets name, role, access level, accent and the picture:
a **Design** (vinyl, jog wheel, cans, equalizer, waveform, faders, chip, bolt), up to 3 **Characters**, or
an uploaded **Photo** (cropped to 160 x 160, kept in this browser's localStorage as
`componentLab:v2:profile`). Files: `lab/avatar.js` (markup), `lab/pass.css` (look). Size comes from
`--trig-w / --trig-h / --trig-r`; the dock morph reads them. Restyle hooks for a future skin (e.g.
Pioneer XDJ-XZ): `--pass-accent`, `--pass-display`, `--pass-face`, `--pass-clip`, `--pass-strap`,
`--strap-w`, and one `pm-*` class per part (`pm-clip`, `pm-slot`, `pm-band`, `pm-photo`, `pm-name`,
`pm-role`, `pm-bars`, `pm-led`, `pm-sheen`).

## Core Workflow: Basic vs. Pro Mode

Component Lab separates everyday visual tuning (**Basic**) from deep parameter inspection, layout organization, and manifest curation (**Pro**). Switch between them anytime using the **`Basic | Pro`** segmented toggle in the card header.

| Area | **Basic Mode** (Everyday Tuning) | **Pro Mode** (Deep Tuning, Curation & Authoring — configured via `PRO_FEATURES` in `lab/lab.js`) |
|---|---|---|
| **Controls shown** | Up to **8 starred (`★`) controls**, shown one category page at a time via the right-hand rail icons (ignores hidden rail categories so Basic is never locked out). | **Every control** in one scrollable **All controls** accordion (`PRO_FEATURES.accordion`), grouped into mini-cards (`Card`, `Text`, `Glow`, etc.) with `More` and `Advanced` folds + **A/B/C Snapshot slots** (`PRO_FEATURES.snapshots`). |
| **Curation & badges** | Clean labels and live values only. | Shows `✦` signature badges, `★` star buttons (`PRO_FEATURES.starCurate`), and source/wiring sub-labels (`where`, `hint`, `js-const` via `PRO_FEATURES.signatureMarks`). |
| **Colour picking** | Project palette presets + radial gooey swatch picker (`Arc`). | Compact swatch chip rows + `Custom…` native colour/hex input + **My palette** editor (`PRO_FEATURES.userPalette`). |
| **Section layout (`⋮`)** | Standard single-category page view. | Header **`⋮`** menu & **Settings › Pro sections** (`PRO_FEATURES.sectionMenu`) choose the default state (*All closed* = default, *First open*, *Remember*), the **Responsive** switch (one section open at a time; the open one moves to the top, and opening another or closing it puts every section back in normal order, closed; off by default) and motion/layout variant (**A Slide**, **B Spring**, **C Stagger**, **D Exclusive chips**). The old *All open* choice was retired; uiVer 6 moves everyone to *All closed* once. |
| **Settings & Manifest** | Essential settings (Dock position, Anchor, Animations, Viewport, Show toolbar icon, Backup & Reset) + one-click link to switch to Pro. | Adds **Palette source & My palette** (`PRO_FEATURES.userPalette`), **Rail order & Rail actions** (`PRO_FEATURES.railCustomize`), **Stage toolbar advanced options** (`PRO_FEATURES.toolbarAdvanced`), **Interaction scan**, and **Manifest Save/Export/Re-scan** (`PRO_FEATURES.manifestTools`). |
| **Exports (Footer)** | **Copy changes**, **Copy full working file**, **Undo**, **Reset**, and **`N changed` (Hold to compare defaults)**. | Same export bar in both modes so you never have to switch modes just to copy. |

---

## Stage, Dock & Floating Toolbar

### Sandbox Stage & Viewport Presets
- The stage previews components inside a scaled sandbox frame:
  - **`1600×770` (Default):** Tuned for Rob's HP laptop (Chrome window on a `1600×900` display).
  - **`1366×768` & `Fit`:** Available under **Settings › Viewport** for secondary laptop/responsive checks.
- The sandbox is primary: it always uses the full window. The dock (card, slim rail, VIP badge) and the floating toolbar only float over it and never resize or move it.

### Sandbox Screen (locked card)
- The sandbox card (`#stageFit`, the thin dotted frame) is the **screen**: one box, no extra bezel or frame drawn. Its border is **locked**: 1552×714 at (24,20) on 1600×770 and 1318×712 at (24,20) on 1366×768, at every dock stage.
- The narrow margin around it is just where the controls live (top-left toolbar, right-hand dock / VIP badge, edge tabs); they float over the stage and never resize or move the screen.
- **Only the contents zoom** inside the card, and zoomed-in content is clipped at the card edge. The zoom pad sits centred at the top of the card.

### Sandbox View Zoom (magnifier)
- Small Pioneer-style pad **centred at the top of the screen**, inside the work area (clear of the top-left toolbar and the right-hand dock at 1600×770 and 1366×768): **− zoom out · readout (e.g. `125%`) · + zoom in · frame icon = reset to 100% and centre**.
- **View only:** it scales the sandbox content on screen (`#stageScaler` transform). Control values, `manifest.json`, Copy changes / full file output, the URL hash and the stage box itself never change. 100% = the normal fit / viewport ratio.
- **Toggle back:** click the readout (or press `0`) to switch **100% ⇄ your last zoom** (and its pan), back and forth.
- **Steps:** 25%, 33%, 50%, 67%, 75%, 90%, 100%, 110%, 125%, 150%, 175%, 200%, 250%, 300%, 400%.
- **Keys** (not while typing in a field or while focus is inside the component): `+` / `=` in, `-` out, `0` toggle. Ctrl/Cmd + `+`/`-`/`0` stay the browser's own page zoom.
- **Mouse / touch:** Ctrl/Cmd + wheel (or a trackpad pinch) over the stage zooms at the cursor; plain wheel over the zoom pad steps it. When zoomed in, drag empty stage space (or middle-mouse drag anywhere) to pan. Touch: two-finger pinch zooms and pans; one finger still drives the component.
- The component keeps reacting to hover, click, drag, wheel and keys at any zoom (the browser maps pointer hits through the CSS transform).
- Hover is exact at any zoom: the helix pauses only while the pointer is on a real card (the browser's hit test at the pointer, re-checked every frame), not on the empty space of the zoomed column. Drag spins by on-screen distance over the zoomed helix, so it tracks the content. Scan-sourced hover uses the component frame, not the whole viewport box.
- Remembered for this browser session only (`sessionStorage`); `?reset` puts it back to 100%. Hide the pad: **Settings › Viewport › Show zoom controls** (Basic and Pro).

### Control Dock & Right Rail
- **One dock, three stages** (`DOCK_STAGES` in `lab/lab.js`, smallest first):
  1. **Pass** (`data-state="closed"`, Pro only): the all-access lanyard pass above.
  2. **Rail** (`data-state="slim"`): the thin vertical icon rail. A rail icon opens the card on that page.
  3. **Card** (`data-state="open"`): the control card plus the rail.
- **Basic:** card + thin rail only. The **X** folds the card to the rail; a rail icon or `Alt+D` opens it
  again. Basic never shows the pass stage and never hides the dock (switching to Basic brings a hidden
  dock back at the rail).
- **Pro** (each behind its own switch in `PRO_FEATURES`, set one to `false` to give it to Basic too):
  - `dockStages`: the pass stage, plus the rail's fold tool (`[data-tool="tuck"]`) that goes straight to it.
  - `dockFlick`: flick the pass, or drag/flick the dock's inner edge (a thin grip shows on hover):
    toward the stage grows, toward the screen edge shrinks; gentle = one stage, strong = to the end.
    Click the edge to toggle rail / card. Uses Settings > Toolbar > Flick physics and strength.
  - `dockHide`: a strong flick of the pass away from the stage hides the dock **for this session
    only** (never saved). It always comes back with `Alt+D` / `Shift+D`, the small edge handle left where
    it was, switching to Basic, or a reload. Turn it off in Settings > Dock > **Allow flick-to-hide**.
  - `helpIcon`: the **?** in the card header. Hover/focus shows a compact help card, click pins it,
    `Esc` or an outside click closes it. Pro sees how the dock, pass and shortcuts work; Basic sees what
    Pro adds and a Switch to Pro button. The text is generated from `KEYS` / `PRO_FEATURES`, so it
    stays in sync with the code.
- **Dock state** (Pro, Settings > Dock > Dock state): `Expanded` (card + rail, default), `Slim rail` or `VIP badge` (collapsed) on load. Saved values are unchanged (`full` / `slim` / `icon`); an old saved `slim` default moves to `full` once (uiVer 5).
  With `VIP badge`, the X folds the card straight to the badge.
- **Hover to expand slim rail** (Pro, `PRO_FEATURES.dockHover`, Settings > Dock, default ON, saved as `ui.dockHover`): rest the cursor on the slim rail (~240 ms) and it grows to the card; move away (~420 ms) and it folds back to the slim rail. It never folds while a control is held or dragged, a text field / select has focus, or the colour arc, popover or help card is open (it waits, then folds). Hover expand / fold is never saved: the Dock state setting and `ui.open` stay as they were. Touch: tap the slim rail's empty space to expand (rail icons open their page as usual); tap outside folds it. Click the avatar on a hover-opened card to keep it open.
- **Nested tabs (a way back for everything flicked away):** the dock's edge tab (`#dockHint`) springs in on its screen edge when the badge is flicked away and slides out when the dock returns. The stage toolbar has its own tab (`#tbHint`, left edge; right edge with a left-anchored dock): while the toolbar is ON but flicked away and no rail pad is on screen (dock at the VIP badge or hidden), the toolbar flies into that tab, the tab springs in, and a click flies the toolbar back to the top-left (the tab slides out). With the slim rail or card showing, the rail pad is its nest instead (LED pulses).
- **Keys:** `Esc` = one stage down (closes the help card, colour arc or popover first; never hides the
  dock). `Alt+D` / `Shift+D` = next stage (wraps). Clicking the stage backdrop folds the card to the rail.
  Clicking or tabbing inside the card pins it open.
- **Rail Icons (top to bottom):**
  0. **Round avatar** (the pass photo): from the expanded card, click collapses straight to the VIP badge (skips the slim rail); from the slim rail, click expands to the card. Shift+click: card -> slim rail, slim rail -> VIP badge. Basic (no badge): card <-> rail. On a card that hover opened from the slim rail, click keeps it open (pins it). The tooltip always names the next step. At stage 1 the VIP badge itself shows the same photo; click it to grow again.
  1. **Categories:** `Color`, `Interaction` (shown only when the component has cursor/touch/key behaviour), `Surface`, `Type`, `Motion`, `Rate`, `Layout`.
  2. **Actions:** **`+`** (New Component modal) and **Toolbar ON/OFF pad** (XDJ-XZ pad style: LED lit = ON, pulsing = ON but flicked/thrown away). Two-stage click: OFF -> ON (flies out to the top-left) · ON but flicked away (LED pulses) or dragged elsewhere (dashed frame) -> back in the top-left corner · ON and home -> OFF (flies home). The pad is click-only on the rail (flicks on it only count with the dock nested at the VIP badge, so no false flicks). While ON, the edge tab / `Alt+D` that brings a hidden dock back also brings the toolbar back, and a Basic/Pro switch never leaves it parked. Basic ignores Pro's hidden rail actions, so the pad is always on Basic's rail.
  3. **Settings (Gear):** Always last on the rail and can never be hidden.
- **Quick Shortcuts & Power Features:**
  - **Click any component title (`#cmpName`)** in the dock header or floating toolbar to switch components even when the floating toolbar is dismissed.
  - **Click any numeric readout (`.ctl-val`)** on a slider or radial dial to type an exact value (`Enter` or blur commits; `Esc` cancels).
  - **Press and hold `N changed` (`#changedCount`)** in the card header to temporarily preview the component with all default values; release to restore your tuned state.
  - **Snapshots (`A` / `B` / `C` in Pro mode):** Click an empty slot to save your current look; click a filled slot to restore it (undoable via `Ctrl+Z`); `Shift+Click` to overwrite; `Alt+Click` or right-click to clear.
  - **Double-click any control label** to reset that single control to its default.
  - **`Ctrl+Z`** undoes and **`Ctrl+Shift+Z` / `Ctrl+Y`** redoes (up to 100 steps; works whenever the dock is open).
  - **URL Query & Hash Helpers:**
    - `?reset` (`http://127.0.0.1:5179/?reset`) clears all `componentLab:v2:*` `localStorage` keys and reloads clean defaults.
    - `?selftest=1` (`http://127.0.0.1:5179/?selftest=1`) runs an automated smoke check across all registered components and logs/toasts the pass/fail summary.
    - `#c=<id>` switches between registered components via the URL hash.

### Floating Stage Toolbar, Free-Roam Drag-and-Drop & Arcade Flick Physics
- **Overlays the entire viewport freely:** `#stageBar` (`.tb`) is `position: fixed; z-index: 12` and floats above the stage without altering `#stageFit` or `#stageScaler` dimensions.
- **Whole-card hit detection & tactile hold (`.is-held`):** Grabbing anywhere on the nested toolbar card shell, border, padding, or `#tbToggle` icon immediately lifts the card (`scale(1.06)`, cyan border glow, elevated shadow, `cursor: grabbing`) and tracks **1:1 with the cursor** with subtle velocity banking.
- **Calm Release = Custom Session Drop Position:** Releasing calmly (or holding stationary `> 90 ms` before letting go) drops the toolbar at that exact `(x, y)` coordinate for the current session (clamped `12 px` inside viewport edges). Dropping it on the right half of the window (`x > 55%` viewport width) sets `data-flip="true"` so expanded groups grow **leftward** (`row-reverse`) and never clip off-screen. Use **Settings › Reset toolbar position** to snap it back to the top-left corner.
- **Flicks only while CLOSED:** an open toolbar ignores flicks entirely (a release just drops it where you let go).
- **Closed (nested) = any flick sends it away:** any flick (`power >= 1`, any direction, gentle or strong) of the closed toolbar sends it away; the old short-flick-to-open gesture was removed (click the icon to open). Only **Settings › Toolbar › Flick physics = off** disables this. Way back: the rail toolbar pad (puts it back top-left); with a hidden dock, the edge arrow tab or `Alt+D` brings back the badge and the toolbar together.
- **Flick away = 5 Video-Game Physics Exit Trajectories:** Throwing the toolbar in any direction launches it into the rail toolbar icon using 1 of 5 arcade trajectories (logged in the footer log) and automatically unhides the rail toolbar icon if it was hidden:
  1. **Gravity Lob (`arc`):** High parabolic lob with backspin before plummeting into the rail slot.
  2. **Wall Ricochet (`ricochet`):** Banks off the nearest viewport edge with squash-and-stretch before zipping into the rail.
  3. **Boomerang Curveball (`curve`):** Sweeps out on a wide S-curve with banking tilt before curving home.
  4. **Slingshot Warp (`warp`):** Pulls back slightly, stretches with motion blur, and streaks into the rail.
  5. **Corkscrew Spiral (`spiral`):** Performs a `720°` barrel roll along the flight vector into the rail.
- **Groups (`TOOLBAR_GROUPS` in `lab/lab.js`):**
  1. **Component Picker (`#tbPick`):** Switches between registered components (also accessible via `#cmpName` in the dock header).
  2. **Playback (`#labPlay`, `#labScrub`):** Play/Pause (`Space`) and loop scrub slider (shown for animated components).
  3. **Viewport (`#viewSeg` — optional extension):** `1600×770`, `1366×768`, and `Fit` (configured in **Settings › Viewport** by default; add `{ id: 'viewport', label: 'Viewport' }` to `TOOLBAR_GROUPS` to also show on the floating toolbar).

---

## AI / Vibe-Coding Relay Guide (How Other AI Agents Should Use This Project)

When collaborating with an AI coding assistant (Cursor, Antigravity, Claude, Grok, ChatGPT) to build or refine UI components, use the following relay workflows and contracts.

### 1. Relaying Tuned Values From Component Lab to an AI Agent
The card footer has two copy buttons designed for different AI chat contexts:

1. **`Copy changes` (Default — Page with `+/−` icon):**
   - **When to use:** You are continuing in an existing AI chat session that already has the component's source files.
   - **What it puts on your clipboard:** A compact diff block listing the component folder, files, active interaction settings, only the modified parameters (`- Label [ID --css-var]: default -> new`), and a `#c=...` deep-link URL:
     ```text
     Component: PTCB26 home helix (components/helix/ — style.css, markup.html, component.js)
     Interaction: hover = pause [HOVER], drag = spin [DRAG]
     Changes:
     - Speed [SPEED]: 1× -> 1.4×
     - Card fill opacity [CARD_OPACITY --helix-card-opacity]: 0.9 -> 0.65
     Link: http://127.0.0.1:5179/#c=helix&SPEED=1.4&CARD_OPACITY=0.65
     ```
2. **`Copy full working file` (Page with `</>` icon):**
   - **When to use:** Starting a brand-new AI chat or handing off to another model/agent that has never seen the component.
   - **What it puts on your clipboard:** A single, self-contained `.html` file containing the font links, tokens, component CSS, HTML markup, `component.js`, baked-in CSS custom properties on `.lab-frame`, `window.LAB_PARAMS` defaults, a summary comment of your changes, and a minimal standalone `requestAnimationFrame` runner that opens directly in Chrome.

### 2. How an AI Agent Should Create or Import a Component Into the Lab
Every component lives in `components/<id>/` and is listed in `components/registry.js`.

- **Scaffold via CLI (recommended for agents):**
  ```powershell
  python new-component.py <component-id> --kind card
  ```
  *(Supported `--kind` templates in `components/_template/kinds.json`: `card`, `nav`, `hero`, `animated-background`, `list`, `button`.)*
- **Component Folder Structure:**
  ```text
  components/<id>/
    component.js    # Calls Lab.register({ id, title, css, markup, animated, mount })
    style.css       # Component styles (prefer CSS custom properties on .lab-frame or :root)
    markup.html     # Component HTML fragment injected inside .lab-frame
    manifest.json   # Optional control definitions (auto-scanned by lab/scan.js if omitted)
  ```
- **`component.js` Lifecycle Contract:**
  ```js
  Lab.register({
    id: 'my-widget',
    title: 'My Widget',
    css: ['style.css'],
    markup: 'markup.html',
    animated: true, // true if render() should be called every animation frame
    mount(frame, { params, manifest, time }) {
      // Query inside `frame` (never `document`) so styles/DOM stay isolated
      return {
        render(P, offset) {
          // Called on parameter change and (if animated) each rAF tick.
          // `P` holds current control values by ID; `offset` is 0..1 loop progress.
        },
        rate(P, dt) {
          // Optional: return clock multiplier (0 = pause, 0.35 = slow, 1 = normal, 1.8 = fast)
          return 1;
        },
        destroy() {
          // Optional: remove window/document listeners or timers on component switch
        }
      };
    }
  });
  ```
- **Pure CSS Components Need Zero JS Logic:** Any manifest variable with a `"css": "--my-var"` property is automatically applied inline on `#labFrame` (with `unit` appended or `cssMap` translated), and any variable with `"bind": [{ "sel": ".my-el", "prop": "border-radius", "tpl": "{v}px" }]` is written into `<style id="labBinds">`.

### 3. Manifest Schema (`components/<id>/manifest.json`)
If `manifest.json` is omitted, `lab/scan.js` automatically scans `style.css`, `markup.html`, and `component.js` to generate controls for CSS custom properties, colour literals (grouped by `hex@alpha` and preserving transparency via `rgb(from {v} r g b / alpha)`), opacities, radii, font sizes (auto-suffixed `_2`, `_3` on selector collisions), animation durations, `UPPER_CASE` numeric JS constants, and pointer/keyboard/CSS `:hover` interactions (requiring down+move for drag, ignoring `preventDefault` click guards, scanning `:focus-visible`, and stripping `@media` wrappers before `:hover`). Use **Settings › Save to disk** in Pro mode to write a curated `manifest.json` to disk.

```json
{
  "version": 2,
  "kind": "card",
  "title": "Quiz score card",
  "paletteFrom": ["project/tokens.css", "components/quiz-score-card/style.css"],
  "frames": {
    "1600x770": { "w": 420, "h": 320 },
    "1366x768": { "w": 380, "h": 300 }
  },
  "time": { "cycle": "CYCLE", "speed": "SPEED", "direction": "DIRECTION" },
  "groups": { "color": ["Card", "Text", "Glow"] },
  "vars": [
    {
      "id": "ACCENT",
      "label": "Accent",
      "category": "color",
      "group": "Card",
      "control": "swatch-role",
      "role": "accent",
      "default": "#00e5ff",
      "css": "--c-accent",
      "featured": true,
      "signature": true
    }
  ]
}
```
- **Categories (`category`):** `color`, `interact`, `surface`, `type`, `motion`, `rate`, `layout`.
- **Controls (`control`):** `slider`, `swatch-role`, `switch`, `segmented`, `select` (auto-expands integer range if `min`/`max` are given without `options`), `radial` (Pioneer XDJ-XZ `HI / MID / LOW` mixer EQ rotary pot; supports optional `variant`: `"eq"`, `"fx"` / `"color"`, `"gain"` / `"trim"`), `tempo` (Pioneer XDJ-XZ vertical tempo fader + jog display deck, automatic for `master: "speed"` in Pro mode), `fader` (vertical mixer channel fader), `pad` (illuminated performance pad switch).
- **Colour roles (`role`):** `accent`, `border`, `glow`, `text`, `muted`, `surface`, `surface2`, `danger`.
- **Interactions (`interaction`):** `hover` (`keep`/`pause`/`slow`/`fast`), `drag` (`spin`/`ignore`), `touch` (`hover`/`ignore`), `key`, `wheel`, `click`, `hover-css` (toggles CSS `:hover` rules on/off).

---

## Repository Layout

```text
index.html                      # Lab shell HTML (stage, floating toolbar, right/bottom dock)
serve.py                        # Local Python HTTP server + POST /api/new and /api/manifest
new-component.py                # CLI & backend scaffolder for new components from _template
run.bat                         # Windows double-click launcher (py/python serve.py 5179 --open)
jsconfig.json                   # Zero-build ES2022 editor config for VS Code / Antigravity
project/
  tokens.css                    # Shared project colour/token definitions (palette source)
lab/
  lab.css                       # Lab UI chrome styles (scoped via @scope (:root) to (#labFrame))
  motion.js                     # Spring presets, FLIP helpers, and Motion.Flick physics
  scan.js                       # Auto-manifest generator & CSS/JS interaction scanner
  controls.js                   # Control rows, click-to-type inputs, radial dials, colour Arc & hold button
  export.js                     # Manifest clean export/save, clipboard summaries, standalone HTML & JSON backup
  lab.js                        # Core lab state, PRO_FEATURES, dock stages, help card, floating toolbar & self-test runner
  avatar.js                     # All-access lanyard pass markup + profile (Settings > Profile pass)
  pass.css                      # Pass look (54 x 84) + Settings preview; --pass-* restyle hooks
  dock.css                      # Dock edge grip, hidden-dock handle, ? help card
  icons.js                      # Material Icons registry (loaded, not wired in yet; v2 keeps its own icons)
  fonts/                        # Offline Chakra Petch & JetBrains Mono font files + fonts.css
components/
  registry.js                   # Ordered list of components shown in the lab picker
  helix/                        # Reference component: PTCB26 3D rotating card helix
  _template/                    # Starter template & kinds.json for new components
compare/
  original.html                 # Untouched v109 helix baseline for visual A/B verification
  original-home.js              # Original home.js helix script
COMPONENT-LAB-REVIEW-MVP.md     # Consolidated code review, MVP execution plan & future audit log
mvp-decision-selector.html      # Interactive HTML decision selector for the MVP plan
```

---

## Git Branching & Safe Development Workflow

- **`main` branch (Failsafe Baseline):** Preserves the untouched starting snapshot of Component Lab v2. Do not commit experimental or untested work directly to `main`.
- **`feat/mvp-v2` branch (Active Development):** All MVP bug fixes, recovery paths, `PRO_FEATURES` organization, enhancements, and documentation updates happen on `feat/mvp-v2` with clean checkpoint commits after each major phase:
  1. **Step 1 Checkpoint:** Backend, launcher & `_template` fixes (`serve.py`, `new-component.py`, `run.bat`, `_template/component.js`, `jsconfig.json`).
  2. **Step 2 Checkpoint:** Auto-scan & motion fixes (`lab/scan.js`, `lab/motion.js`).
  3. **Step 3 Checkpoint:** Core lab fixes, `PRO_FEATURES` gating, enhancements (`4.1–4.7`), `@scope` CSS isolation, and `lab/controls.js` + `lab/export.js` split.
- **Merging to `main`:** Only merge `feat/mvp-v2` into `main` after full verification in Chrome (`1600×770` and `1366×768`) and explicit user approval.
- **Post-MVP Roadmap & Audit Log (see `COMPONENT-LAB-REVIEW-MVP.md` › *Future project review & post-MVP audit log*):**
  1. **ES Module (`<script type="module">`) & `lab/state.js` evaluation** when scaling beyond 5 lab files.
  2. **Persist Custom Floating Toolbar Position (`ui.tbPos`)** across reloads using normalized viewport ratios.
  3. **Toolbar Reposition vs. Throw Sensitivity Refinement:** Separate drag distance (`d >= L.far`) from release velocity (`sp >= L.strong`) and add a micro-jitter deadzone during hover/pause before release so long-distance repositioning never accidentally triggers an off-screen throw.
  4. **Sandbox-First Primary Workarea & Reactive Chrome UX:** Maximize stage screen allocation (`#stageFit` / `#stageScaler`) relative to UI chrome and make the dock/toolbar reactively dim, tuck, or coordinate during active component interaction or slider tuning.
  5. **Base vs. Pro FAQ / Guide Section:** Document the full Base vs. Pro feature breakdown in a dedicated FAQ/Help section (kept out of the active control menu card so cards/subcards remain streamlined around titles, buttons, and controls).
  6. **Subcard Capacity & `More (x–y)` Dropdown Rubric:** Formalize thresholds for when subcard controls stay inline (`1–3` items, as applied to `Surface › Opacity`) vs. when to collapse overflow items into `More (N)` or range-indexed `More (x–y)` dropdowns for larger components.
  7. **Dual-Sided 3D Flip Subcards (`buildFlipCard`):** Secondary/advanced subcards (`Interaction: Pointer ↔ Touch & keys`, `Motion: Loop ↔ Depth`, `Rate: Text fade ↔ Shell dim`, and per-card `Advanced` folds) spin 180° in 3D without resizing the menu card.
  8. **3-Tier Control Mode (`Basic` | `Mid` | `Pro`):** Introduce a `Mid` tier featuring a Pioneer DDJ-controller style UI with 3 preset rate pads for `Rate / Tempo` and `Interaction` controls (moving `Interaction` out of `Basic` into `Mid`+), while `Pro` unlocks full continuous fine-tuning with the Pioneer XDJ-XZ vertical tempo deck and mixer EQ knobs.
  9. **Pioneer XDJ-XZ DJ Hardware UI/UX Controls:** Pro dock features authentic Pioneer DJ hardware styling: vertical tempo turntable deck with high-res optical jog ring and ±6/±10/±16/WIDE range switch; color-matched knurled EQ mixer dials (HIGH/MID/LOW); tactile backlit silicone performance pads (`.xdj-perf-pad` with cyan LED bars) for `Surface › Fades`; an illuminated circular Beat FX ON/OFF stomp button + Level/Depth rotary dial + 4 depth preset pads (`.xdj-fx-unit`) for `Surface › Glow`; and a unified 3-column Pioneer mixer console deck (`.mini-body.is-deck`) for `Layout › Spacing & Radius` combining a Master Level Swing Cap rotary dial (`SWING CAP`) alongside Channel 1 (`TRAVEL` Spread) and Channel 2 (`WAVE` S-Curve with center 0-detent LED) vertical faders.
   10. **Pioneer XDJ-XZ 2-Column Size Deck & Inline Compact Select (Layout › Size):** Unified console card combining an inline compact card-count selector ([ 8 ▾ ] ☆) with side-by-side vertical channel faders for Card width (CARD_W, CH 1) and Back scale (SCALE_MIN, CH 2), eliminating the 3D flip card on Size and cleanly folding depth scaling into the primary layout card.
