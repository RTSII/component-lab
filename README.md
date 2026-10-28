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
- **Important Port / `localStorage` Note:** Browser `localStorage` is scoped by origin and port (`http://127.0.0.1:5179` vs. `http://127.0.0.1:5180`). Always use the same port (default `5179`) so your saved parameter values, starred Basic controls, and custom palettes stay visible, or use the JSON backup/restore tools in **Settings**.

---

## Core Workflow: Basic vs. Pro Mode

Component Lab separates everyday visual tuning (**Basic**) from deep parameter inspection, layout organization, and manifest curation (**Pro**). Switch between them anytime using the **`Basic | Pro`** segmented toggle in the card header.

| Area | **Basic Mode** (Everyday Tuning) | **Pro Mode** (Deep Tuning, Curation & Authoring) |
|---|---|---|
| **Controls shown** | Up to **8 starred (`★`) controls**, shown one category page at a time via the right-hand rail icons. | **Every control** in one scrollable **All controls** accordion, grouped into mini-cards (`Card`, `Text`, `Glow`, etc.) with `More` and `Advanced` folds. |
| **Curation & badges** | Clean labels and live values only. | Shows `✦` signature badges, `★` star buttons (click to add/remove a control from Basic's 8 slots), and source/wiring hints (`where`, `lab-bound`, `js-const`). |
| **Colour picking** | Project palette presets + radial gooey swatch picker (`Arc`). | Compact swatch chip rows + `Custom…` native colour/hex input + 6-slot **My palette** editor. |
| **Section layout (`⋮`)** | Standard single-category page view. | Header **`⋮`** menu & **Settings › Pro sections** choose collapse mode (*Remember*, *All open*, *All closed*) and motion/layout variant (**A Slide**, **B Spring**, **C Stagger**, **D Exclusive chips**). |
| **Exports (Footer)** | **Copy changes**, **Copy full working file**, **Undo**, **Reset**, and **`N changed`**. | Same export bar in both modes so you never have to switch modes just to copy. |

---

## Stage, Dock & Floating Toolbar

### Sandbox Stage & Viewport Presets
- The stage previews components inside a scaled sandbox frame:
  - **`1600×770` (Default):** Tuned for Rob's HP laptop (Chrome window on a `1600×900` display).
  - **`1366×768` & `Fit`:** Available under **Settings › Viewport** for secondary laptop/responsive checks.
- The component automatically re-centres in the remaining stage space when the control dock opens on the right or bottom.

### Control Dock & Right Rail
- **Opening & Pinning:** Hover or click the round trigger button (`#dockTrigger`) to open the glass card. Clicking or tabbing inside the card pins it open; pressing **`Esc`** or clicking the stage backdrop unpins and closes it (`Esc` closes any open colour arc or popover first).
- **Rail Icons (top to bottom):**
  1. **Categories:** `Color`, `Interaction` (shown only when the component has cursor/touch/key behaviour), `Surface`, `Type`, `Motion`, `Rate`, `Layout`.
  2. **Actions:** **`+`** (New Component modal) and **Toolbar** (shows/throws out the floating stage toolbar).
  3. **Settings (Gear):** Always last on the rail and can never be hidden.
- **Quick Shortcuts:**
  - **Double-click any control label** to reset that single control to its default.
  - **`Ctrl+Z`** undoes and **`Ctrl+Shift+Z` / `Ctrl+Y`** redoes (up to 100 steps; a full slider drag counts as one step).
  - **URL Hash State:** Tuned values sync live to the URL hash (e.g. `http://127.0.0.1:5179/#c=helix&SPEED=1.5&CARD_OPACITY=0.6`) for bookmarking or sharing.

### Floating Stage Toolbar & Flick Physics
- Floats at the top-left of the stage (moves to top-right if the dock is anchored on the left) without affecting sandbox dimensions.
- **Groups (left to right):**
  1. **Component Picker:** Switches between registered components (also accessible by clicking the component title in the dock header).
  2. **Playback:** Play/Pause (`Space`) and loop speed/scrub slider (shown for animated components).
- **Progressive Open/Close:** Clicking the toolbar icon opens or closes all groups; **`Shift+Click`** or **`←` / `→`** steps one group at a time on a staggered spring (`TB_OPEN_ORDER` / `TB_CLOSE_ORDER` in `lab/lab.js`).
- **Flick Physics (`lab/motion.js` — `Motion.Flick`):**
  - Dragging `< 6 px` acts as a click; dragging further pulls with rubber-band resistance and measures release velocity over the last `90 ms` (pausing stationary for `> 90 ms` before release zeroes velocity and snaps back without triggering a flick):

| Strength Setting | Gentle Flick (speed or distance) | Strong Flick (speed or distance) |
|---|---|---|
| **Light** | `≥ 0.22 px/ms` or `≥ 40 px` | `≥ 0.75 px/ms` or `≥ 120 px` |
| **Normal** | `≥ 0.35 px/ms` or `≥ 60 px` | `≥ 1.10 px/ms` or `≥ 170 px` |
| **Heavy** | `≥ 0.55 px/ms` or `≥ 85 px` | `≥ 1.60 px/ms` or `≥ 230 px` |

  - **Rail Toolbar Button:** Flick toward the stage to throw the toolbar out of the rail (gentle = 1 group, strong = all groups). Flick back toward the rail to retract.
  - **Floating Toolbar Icon:** Flick right to open groups; gentle flick left closes one group; **strong flick left/up** dismisses the floating toolbar for the current session (click the rail toolbar icon or toggle **Settings › Show toolbar icon** to bring it back).
- **Extension Point (`TOOLBAR_GROUPS`):** Defined in `lab/lab.js` (`{ id, label, primary, when }`) matching `.tb-group[data-group]` elements in `index.html`. Re-enabling the built-in `#tbViewport` group requires only adding `{ id: 'viewport', label: 'Viewport' }` to `TOOLBAR_GROUPS`.

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
  *(Supported `--kind` templates in `components/_template/kinds.json`: `card`, `nav`, `hero`, `bg`, `list`, `button`.)*
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
- **Controls (`control`):** `slider`, `swatch-role`, `switch`, `segmented`, `select` (auto-expands integer range if `min`/`max` are given without `options`), `radial` (angle dial with `unit: "°"`).
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
  lab.css                       # Lab UI chrome styles
  motion.js                     # Spring presets, FLIP helpers, and Motion.Flick physics
  scan.js                       # Auto-manifest generator & CSS/JS interaction scanner
  lab.js                        # Core lab state, dock, controls, toolbar, and export logic
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
