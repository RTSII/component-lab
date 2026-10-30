# Component Lab v2 — Comparative Review & Unified MVP Plan

## Part 1: Comparison of Reviews & Resolution of Conflicts

### 1. Where Both Reviews Agreed
- **Component loader hang & race condition:** `loadComponent()` (`lab/lab.js` lines 368–374) hangs forever if `component.js` has a syntax error or omits `Lab.register()`, because `<script>` `onload` still fires on syntax errors and `pendingResolve` is never called. Rapid component switching can also cross-resolve `pendingResolve`.
- **Auto-scan (`lab/scan.js`) strips RGBA alpha values:** `parse()` (lines 12–21) and `hex()` (line 23) flatten `rgba(...)` and 8-digit hex values into opaque 6-digit hex, and `flushBinds()` (`lab/lab.js` lines 198–208) immediately injects `!important` rules on load, destroying component transparency before you touch a control.
- **Stale auto-scan cache in `localStorage`:** Caching `manifest:<id>` in `loadComponent()` (`lab/lab.js` lines 386–391) prevents edits to a component's `style.css` or `component.js` from ever being picked up on reload unless you hold-reset the entire component.
- **`_template` exposed in `components/registry.js`:** Having `'_template'` selectable in the picker and writable via `Save to disk` risks corrupting the base template used by `new-component.py`.
- **Radial colour picker (`Arc`) focus bug:** Pressing `Escape` while `Arc` (`lab/lab.js` lines 1544–1618) is open (line 2670) focuses `document.querySelector('.swatch-trigger')` (always the first swatch on the page) instead of the `owner` button that opened it.
- **`serve.py` and `run.bat` fragility:** `do_POST()` (`serve.py` lines 46–70) only catches `ValueError` (missing `OSError` and file-system errors), and `run.bat` (lines 4–5) launches Chrome before Python binds the port.
- **Scattered Basic/Pro logic & `.pro-strip` mismatch:** There is no central `PRO_FEATURES` / `MODES` map; `mode === 'pro'` is checked in a dozen places, and `proStrip()` (`lab/lab.js` lines 981–990) claims Pro adds `full-file copy` even though `#fullBtn` is always visible in Basic.
- **Tooling choice:** Plain HTML/CSS/JS + Python stdlib is the right architecture; adding bundlers, Node, or frameworks would hurt maintainability.

---

### 2. Unique Findings Caught Only by Our First Review (Kept)
1. **`_template/component.js` overwrites custom `markup.html` on every mount:** In `components/_template/component.js` (lines 28–29), `const host = frame.querySelector('.cmp-host') || frame; host.innerHTML = KINDS[kind] || KINDS.card;` runs unconditionally, wiping out any HTML the user pastes into `markup.html` (Opus hadn't read `_template/component.js` before its quota paused).
2. **Hiding rail categories in Settings orphans Basic controls:** `railCats()` (`lab/lab.js` lines 682–685) filters out `ui.railHidden` in both Basic and Pro. In Pro, hidden rail categories are still reachable by scrolling the accordion; in Basic, there is no accordion, so hiding a category on the rail makes its featured controls completely unreachable.
3. **`Settings › Show toolbar icon` switch desynchronizes after a flick dismiss or `flyHome()`:** `TB.dismiss()` (`lab/lab.js` line 2433) and `TB.flyHome()` (line 2409) set `shown = false` without updating `ui.tbOut`. Opening Settings shows **Show toolbar icon** as still `ON` (`ui.tbOut !== false`), so clicking it once sets `ui.tbOut = false` (staying hidden) and requires a second click to bring the toolbar back.
4. **`Ctrl+Z` / `Ctrl+Y` fails whenever `document.activeElement` is `document.body`:** `lab/lab.js` (line 2678) requires `dock.contains(document.activeElement)`, which fails right after initial dock open, after picking an `Arc` colour, or after double-clicking a label to reset a control.
5. **Standalone export (`workingFile`) omits `lab/fonts/fonts.css`:** Exported HTML files fall back to system fonts instead of `Chakra Petch` and `JetBrains Mono`.

---

### 3. Unique Findings Caught Only by Opus (Added to Unified Plan)
1. **Top-level `const`/`let` redeclaration crash & double network fetch in `loadComponent()`:** `loadComponent()` (`lab/lab.js` lines 372–382) loads `component.js` via `<script>` in global scope and then fetches `component.js` a second time as text. If a component has top-level `const` or `let` constants (which `scan.js` line 345 actively scans for!), switching components `A → B → A` throws a global `SyntaxError: Identifier '...' has already been declared` and hangs the lab.
2. **Startup bricking in `init()` if the first component fails:** `init()` (`lab/lab.js` lines 2701–2709) awaits `loadComponent(first, true)` *before* calling `TB.start()`, `openDock()`, or `requestAnimationFrame(tick)`. A broken first component prevents the toolbar, dock, and animation loop from ever starting.
3. **Auto-scanned interaction controls (`HOVER`, `DRAG`, `CLICK`, `WHEEL`, `KEYS`, `TOUCH`) are inert unless lab-enforced:** Except for `HOVER_FX` (`hover-css`), controls created by `interactionVars()` (`lab/scan.js` lines 246–263) do nothing until the user manually edits `component.js` to read `P.HOVER`, `P.DRAG`, etc. Having the lab enforce scan-sourced interactions via capture-phase listeners on `#stageScaler` and clock scaling in `tick()` makes scanned interaction controls work out of the box.
4. **`manifestForExport()` leaks runtime `scan`, `generated`, and expanded `select` options into saved `manifest.json`:** `normVar()` (`lab/lab.js` lines 168–170) mutates `v.options` in-place from `min`/`max` on `select` controls. Saving the manifest writes that expanded `options` array to disk, so later edits to `min`/`max` in `manifest.json` are silently ignored. `manifestForExport()` (lines 181–185) also forgets to strip `man.scan` and `man.generated`.
5. **Stale flick velocity after drag-pause-release in `lab/motion.js`:** `M.Flick` (`lab/motion.js` lines 229–241) only prunes velocity samples during `pointermove`. If you drag, pause for 300 ms, and release, `pointerup` computes velocity from the old move samples before the pause, triggering an unintended flick or toolbar dismissal.
6. **Three additional keyboard/focus bugs:**
   - Opening `#dockTrigger` with `Enter`/`Space` hides the trigger and drops focus to `<body>` instead of moving focus into the dock.
   - Hover-opening the dock (`pinned === false`) and then tabbing into it allows `mouseleave` (line 2650) to close the dock while keyboard focus is inside it (`focusin` should set `pinned = true`).
   - Collapsing `#cardFoot` on sub-pages (`Settings`, `New`, `Role`) hides it with CSS (`opacity: 0; pointer-events: none`) without setting `inert`, so `Tab` still steps through 4 invisible footer buttons.
7. **Selector ID collisions in `lab/scan.js`:** Two rules ending in the same class segment (e.g., `.a .title` and `.b .title` with `font-size`) both produce `TITLE_FONT`; `add()` (line 270) silently drops the second control instead of suffixing `_2`.
8. **Component picker recovery & `localStorage` port trap (`5179` vs `5180`):** The component picker only exists in the floating toolbar (so hiding the toolbar leaves no header picker), and switching ports when `5179` is busy strands all `localStorage` data on the old origin.
9. **Localhost CSRF & bytecode cleanup in `serve.py`:** `do_POST()` lacks an `Origin`/`Host` header check (allowing cross-tab `text/plain` POSTs to localhost) and writes `__pycache__` into the root folder.

---

### 4. Resolution of Conflicting Choices (With Reasons)

| Topic | Our Initial Choice | Opus's Choice | Winning Choice & Why |
|---|---|---|---|
| **Fixing `loadComponent()` hangs & errors** | Keep `loadScript()` + add a 4 s timeout on `pendingResolve`. | Fetch `component.js` once as text and run `new Function(jsText + '\n//# sourceURL=...')()` in `try/catch`. | **Opus's `new Function` approach.** It eliminates the duplicate network fetch, catches syntax and runtime errors synchronously without waiting for a timeout, eliminates the `pendingResolve` race condition, and isolates top-level `const`/`let` in a function scope so switching components (`A → B → A`) never throws a redeclaration `SyntaxError`. |
| **Preserving CSS alpha & avoiding `!important` side effects** | Only apply CSS vars and `flushBinds()` when `isModified(v)` is true, plus preserve alpha on modified vars. | Always apply vars/binds, but track `v.alpha` and emit `rgb(from {v} r g b / alpha)`. | **Combine both.** Opus's `v.alpha` + `rgb(from ...)` key separation ensures semi-transparent colours keep their alpha when tuned, while our `isModified(v)` guard ensures untouched components never have their `:hover`, `:focus-visible`, or `@media` rules clobbered by unconditional `!important` binds on initial load. |
| **Auto-scan `localStorage` caching (`manifest:<id>`)** | Always run `S.analyze()` when `manifest.json` is absent on disk; drop `manifest:<id>` storage. | Cache `manifest:<id>` with a djb2 text hash (`sig`) of `css + markup + js`, re-scan when `sig` changes, and add a `Re-scan` button. | **Opus's `sig`-hash check + `Re-scan` button.** Hashing the source text takes ~20 lines, automatically invalidates the cache the moment you edit `style.css` or `component.js`, lets the lab toast `"Component files changed — controls re-scanned"`, and gives a manual `Re-scan` button in Settings. |
| **`Copy full working file` (`#fullBtn`) in Basic vs. Pro** | Hide `#fullBtn` in Basic mode to match `.pro-strip`'s `"full-file copy"` badge. | Keep `#fullBtn` visible in both modes and remove the misleading `"full-file copy"` badge from `.pro-strip`. | **Opus's choice.** Copying the standalone working file for a new chat is a core everyday action (highlighted in `README.md` line 5). Forcing a mode switch just to click `Copy full file` adds friction; removing the 1-line badge from `proStrip()` fixes the inconsistency cleanly. |
| **Pro Accordion Motion Variants (`A/B/C/D`) & `⋮` Menu** | Keep them and gate the `⋮` menu (`#moreBtn`) and `Pro sections` settings to Pro mode via `PRO_FEATURES`. | Delete variants `A`, `C`, `D` and the `⋮` menu as "exploration debris." | **Override Opus — keep them gated to Pro.** Variant `D` (`Exclusive`) is not just an animation tweak; it is a compact workspace layout where closed sections collapse into horizontal chips around the active section. All four variants are complete, working, and tiny (~45 lines). Gating `#moreBtn` to Pro keeps Basic mode completely free of clutter without destroying a signature Pro capability. |
| **CSS Isolation (`lab.css` vs. component CSS)** | Not addressed in first pass. | Rewrite component `<link>` tags into `<style>@scope (.lab-frame) { ... }</style>` AND wrap `lab.css` in `@scope (:root) to (.lab-frame)`. | **Use `@scope (:root) to (#labFrame)` in `lab/lab.css` only (override full component `@scope` wrapping).** Wrapping `lab/lab.css` UI rules in `@scope (:root) to (#labFrame)` takes 2 lines and stops `.card`, `.btn`, `.switch`, and `:focus-visible` from bleeding into `#labFrame`. By contrast, wrapping component CSS in `@scope (.lab-frame)` breaks `:root` and `body` selectors in pasted component stylesheets and complicates `hoverRules()`. |
| **Splitting the 2,714-line `lab/lab.js` monolith** | Split into 3 plain IIFE files sharing `window.Lab` (`controls.js`, `export.js`, `lab.js`). | Convert `lab.js` into ES Modules (`import`/`export`) with a shared exported state object. | **Override Opus — use plain IIFE scripts on `window.Lab`.** `motion.js` (`window.Motion`) and `scan.js` (`window.Scan`) already use plain IIFEs. Converting to ES modules requires refactoring ~20 closure variables into an imported state object across the entire file. Plain `<script>` files sharing `window.Lab` require zero build tools and far less refactoring risk. |

---

## Part 2: Unified MVP Action Plan

### Bugs and fixes

#### 1. Component loader (`loadComponent` & `init`) hangs on syntax errors, crashes on top-level `const` reloads, and can brick startup
**Why it matters:** `loadComponent()` (`lab/lab.js` lines 368–382) loads `component.js` via `<script>` in the global scope and fetches it a second time for `scan.js`. If `component.js` has a syntax error or top-level `const`/`let` (which fails on reload when switching `A → B → A`), `onload` still fires, `pendingResolve` is never called, and `init()` (lines 2701–2709) never reaches `TB.start()`, `openDock()`, or `requestAnimationFrame(tick)`.

1. In `lab/lab.js` (lines 368–383), fetch `component.js` once with `fetchText()` and execute it inside a function scope via `new Function()` with a `//# sourceURL=` comment:
   ```js
   async function loadComponent(id, fromHash) {
     const seq = ++loadSeq;
     const base = 'components/' + id + '/';
     const jsText = await fetchText(base + 'component.js');
     if (seq !== loadSeq) return;
     if (jsText == null) { toast('Could not load ' + base + 'component.js. Is the folder there?', 6000); return; }
     let d = null;
     pendingResolve = (reg) => { d = reg; };
     try {
       new Function(jsText + '\n//# sourceURL=components/' + id + '/component.js')();
     } catch (e) {
       pendingResolve = null;
       toast('Error in ' + id + '/component.js: ' + e.message, 7000);
       console.error(e);
       return;
     }
     pendingResolve = null;
     if (!d) { toast(id + '/component.js ran but never called Lab.register({...}).', 6000); return; }
   ```
2. Remove the duplicate `const jsText = (await fetchText(base + 'component.js')) || '';` on line 382.
3. In `init()` (`lab/lab.js` lines 2701–2710), start `requestAnimationFrame(tick)` before `await loadComponent(first, true)` and wrap the load in `try / finally` so `TB.start()` and `openDock('click')` always run even if the first component fails.
4. On line 2690 of `lab/lab.js`, validate `hashchange` against `window.LAB_REGISTRY` before calling `loadComponent`:
   ```js
   addEventListener('hashchange', () => {
     const h = readHash(), reg = window.LAB_REGISTRY || [];
     if (h.c && reg.includes(h.c) && (!def || h.c !== def.id)) loadComponent(h.c, true);
   });
   ```

---

#### 2. `_template/component.js` overwrites custom HTML in `markup.html`, and `_template` can be overwritten via `Save to disk`
**Why it matters:** `mount()` in `components/_template/component.js` (lines 28–29) runs `const host = frame.querySelector('.cmp-host') || frame; host.innerHTML = KINDS[kind] || KINDS.card;`, wiping out any HTML you paste into `markup.html`. In addition, `KINDS.nav` (line 20) uses `<a>` tags without `href="#"` (making them unfocusable by keyboard), and `Save to disk` allows overwriting `components/_template/manifest.json`.

1. In `components/_template/component.js` (line 20), add `href="#"` to the four `<a>` elements in `KINDS.nav`.
2. In `components/_template/component.js` (lines 28–31), only inject `KINDS[kind]` when `.cmp-host` is present and empty:
   ```js
   const host = frame.querySelector('.cmp-host');
   if (host && !host.children.length) {
     host.innerHTML = KINDS[kind] || KINDS.card;
     host.dataset.kind = kind;
   }
   (host || frame).addEventListener('click', (e) => e.preventDefault());
   ```
3. In `serve.py` (line 59), reject `cid == "_template"` in `/api/manifest`, and in `buildSettings()` (`lab/lab.js` lines 1924–1927), disable the `Save to disk` button when `def.id === '_template'` with `title="Template is read-only; use + New to create a component"`.

---

#### 3. Auto-scan (`lab/scan.js`) strips RGBA alpha channels and `flushBinds()` forces `!important` on untouched components
**Why it matters:** `parse()` (lines 12–21) and `hex()` (line 23) in `lab/scan.js` strip alpha from `rgba(...)` and `#rrggbbaa` colours, turning translucent fills and shadows into solid hex colours. Then `applyAll()` (`lab/lab.js` line 209) and `flushBinds()` (lines 198–208) inject inline variables and `!important` rules immediately on load even when every control is still at its default.

1. In `lab/scan.js` (lines 12–23), fix 8-digit hex alpha parsing in `parse()` and add an `alphaOf(c)` helper:
   ```js
   const alphaOf = (c) => { const p = typeof c === 'string' ? parse(c) : c; return p ? +(p.a != null ? p.a : 1).toFixed(3) : 1; };
   ```
2. In `lab/scan.js` (lines 287–291), store `alpha` on scanned CSS custom properties when `a < 1`, and in lines 302–310, group `colorLits` by `h + '@' + a` and preserve alpha in `tpl` via Chrome's relative colour syntax:
   ```js
   (d.value.match(COLOR_RE) || []).slice(0, 1).forEach((lit) => {
     const p = parse(lit), h = hex(p);
     if (!h) return;
     const a = alphaOf(p), key = h + '@' + a;
     const e = colorLits.get(key) || { hex: h, alpha: a, binds: [], props: [] };
     const repl = a < 1 ? 'rgb(from {v} r g b / ' + a + ')' : '{v}';
     e.binds.push({ sel: r.sel, prop: d.prop, tpl: d.value.replace(lit, repl) });
     e.props.push(d.prop);
     colorLits.set(key, e);
   });
   ```
3. In `cssVal(v)` (`lab/lab.js` lines 188–196), preserve `v.alpha` for semi-transparent colour custom properties:
   ```js
   if (v.control === 'swatch-role' && v.alpha != null && v.alpha < 1) {
     return 'rgb(from ' + val + ' r g b / ' + v.alpha + ')';
   }
   ```
4. In `applyVar(v)` (line 197) and `flushBinds()` (lines 198–208) in `lab/lab.js`, only emit inline properties or `!important` bind rules for controls that have actually been modified from their default (or scaled by a modified `SPEED` master):
   ```js
   function isModified(v) {
     return !same(P[v.id], v.default) || (v.speedScaled && byId.SPEED && !same(P.SPEED, byId.SPEED.default));
   }
   function applyVar(v) {
     if (!v.css) return;
     if (isModified(v)) frameEl.style.setProperty(v.css, cssVal(v));
     else frameEl.style.removeProperty(v.css);
   }
   ```
   And filter `vars.filter(isModified).forEach(...)` inside `flushBinds()`.

---

#### 4. Auto-scan (`lab/scan.js`) interaction controls do nothing unless enforced by the lab, plus detection & ID-collision bugs
**Why it matters:**
- When `interactionVars()` (`lab/scan.js` lines 246–263) creates `HOVER`, `DRAG`, `WHEEL`, `CLICK`, `KEYS`, or `TOUCH` controls during an auto-scan, changing them in the UI has no effect unless the component's JS was hand-edited to read `P.HOVER`, `P.DRAG`, etc.
- `INTERACTIONS` (`lab/scan.js` lines 213–220) flags any bare `pointerdown` as `drag` (even without `pointermove`), flags `helix`'s `dragMoved` click-suppression guard (`components/helix/component.js` line 184) as a `click` feature, misses `:focus-visible` in CSS, and can false-positive `:hover` inside `@media (hover: hover)`.
- `add()` (`lab/scan.js` line 270) silently drops controls when two rules end in the same selector token (e.g. two `.title` rules with `font-size`).

1. In `lab/scan.js` (line 270), add a `uniq(id)` helper inside `analyze()` so colliding selector IDs get suffixed (`_2`, `_3`) instead of dropped:
   ```js
   const uniq = (base) => { let id = base, n = 2; while (seen.has(id)) id = base + '_' + (n++); return id; };
   ```
   Wrap `idOf(...)` calls for opacity (line 311), border-radius (line 318), and font-size (line 322) in `uniq(...)`.
2. In `interactions()` (`lab/scan.js` lines 222–244), refine detection so:
   - `drag` requires both a down event (`pointerdown|mousedown|dragstart`) and a move event (`pointermove|mousemove|touchmove`) in `js` (or `draggable="true"` in markup).
   - `click` ignores listeners whose body only calls `preventDefault()` / `stopPropagation()` (such as `if (!dragMoved) return; e.preventDefault();`).
   - `key` also checks `/:focus-visible|:focus-within/.test(css)`.
   - `hoverCss` strips `@media[^{]*\{` before matching `:hover` so `@media (hover: hover)` does not false-positive.
3. In `lab/lab.js` (line 521), enforce scan-generated interaction controls (`v.source === 'scan'`) automatically on the lab side so they work without editing `component.js`:
   - Track `scanHovering` via `pointerenter`/`pointerleave` on `frameEl`. In `tick()` (lines 536–547), if `byId.HOVER && byId.HOVER.source === 'scan'`, multiply `k` by `{ play: 1, pause: 0, slow: 0.35, fast: 1.8 }[P.HOVER] ?? 1` when `scanHovering` is true (unless `scanHoverTouch && byId.TOUCH && P.TOUCH === 'ignore'`).
   - Attach a capture-phase listener on `$('stageScaler')` for `pointerdown`, `pointermove`, `click`, `wheel`, `keydown`, `focusin`, `touchstart`, `pointerenter`, and `mouseover` that checks if the corresponding `source === 'scan'` control (`DRAG`, `CLICK`, `WHEEL`, `KEYS`/`KEY_PAUSE`, `TOUCH`, or static `HOVER`) is set to `'ignore'` or `false`, and if so calls `e.stopPropagation()` (plus `e.preventDefault()` on `click` and `wheel`).
   - In `applyHoverCss()` (lines 311–318), also disable `:hover` rules when a static component's scanned `HOVER` switch is `false`.

---

#### 5. Recovery paths: hidden rail categories in Basic, out-of-sync toolbar switch, hidden component picker, and `?reset` escape hatch
**Why it matters:**
- Hiding categories in `Settings › Rail order` hides them in Basic mode (`railCats()`, lines 682–685), where there is no scrolling accordion to reach them.
- Dismissing the stage toolbar via a strong flick (`TB.dismiss()`, line 2433) or flicking it back to the rail (`TB.flyHome()`, line 2409) sets `shown = false` without updating `ui.tbOut`, leaving `Settings › Toolbar › Show toolbar icon` out of sync (showing `ON` while the toolbar is gone) and leaving no component picker if the toolbar stays hidden.
- Selecting the `middle-center` anchor in `Settings › Dock` (`freeRect()`, lines 483–495) places the control card directly over the middle of the component stage.

1. In `railCats()` (`lab/lab.js` lines 682–685), ignore `railHidden()` when `mode === 'basic'` so featured Basic controls can never be hidden:
   ```js
   function railCats() {
     const vc = visibleCats();
     if (mode !== 'pro') return vc;
     const shown = vc.filter((c) => !railHidden().includes(c.id));
     return shown.length ? shown : vc;
   }
   ```
2. In `buildSettings()` (`lab/lab.js` line 1890) and `TB.setOut()` (lines 2426–2430), bind the **Show toolbar icon** switch getter to `() => TB.shown` (instead of `() => ui.tbOut !== false`), and in `TB.dismiss()` / `TB.flyHome()`, if `'toolbar'` is in `ui.toolHidden`, remove `'toolbar'` from `ui.toolHidden` and call `buildRail()` so the rail toolbar button is always visible when the stage toolbar is dismissed.
3. Make `#cmpName` in the card header (`index.html` line 66) a button (or click target) that opens the component picker menu (`TB.menuShow($('cmpName'))`) when clicked, so you can always switch components even when the floating stage toolbar is hidden.
4. In `ANCHORS` (line 64) / `buildSettings()` (line 1833), disable the center cell (`middle-center`) in the 3×3 anchor grid so the dock cannot be anchored dead-center over the component.
5. At the top of `init()` (`lab/lab.js` line 2693), check `if (new URLSearchParams(location.search).has('reset')) { localStorage.clear(); history.replaceState(null, '', location.pathname + location.hash); }` as a URL escape hatch (`http://127.0.0.1:5179/?reset`).

---

#### 6. Auto-scan cache never invalidates on file edits, and `Save to disk` leaks runtime fields into `manifest.json`
**Why it matters:**
- `loadComponent()` (`lab/lab.js` lines 386–391) caches `manifest:<id>` in `localStorage` forever, ignoring edits you make to `style.css`, `markup.html`, or `component.js`.
- `normVar()` (lines 168–170) mutates `v.options` in-place on `select` controls that use `min`/`max`, and `manifestForExport()` (lines 181–185) writes that generated `options` array plus `man.scan` and `man.generated` into `manifest.json`.

1. In `lab/lab.js` (lines 168–170), mark generated select options with `v._genOpts = true` in `normVar()`, and strip runtime properties in `manifestForExport()` (lines 181–185):
   ```js
   function manifestForExport() {
     const out = JSON.parse(JSON.stringify(man));
     delete out.auto; delete out.notes; delete out.scan; delete out.generated; delete out.sig;
     (out.vars || []).forEach((v) => {
       if (v._genOpts) { delete v.options; delete v._genOpts; }
     });
     return out;
   }
   ```
2. Add a small string hash helper `hashText(s)` in `lab/lab.js` (line 385), compute `const sig = hashText(cssFiles.map((f) => f.text).join('\n') + '\0' + markup + '\0' + jsText);`, and in `loadComponent()` re-run `S.analyze()` whenever `!savedAuto || savedAuto.sig !== sig` (storing `m.sig = sig` and toasting when a file edit triggered a re-scan).
3. In `buildSettings()` (`lab/lab.js` line 1922), add a `Re-scan files` button next to `Save to disk` when `man.auto` is true:
   ```js
   const rescan = el('button', 'btn', 'Re-scan files');
   rescan.type = 'button';
   rescan.addEventListener('click', () => {
     store.del('manifest:' + def.id);
     loadComponent(def.id, false).then(() => toast('Re-scanned ' + def.title + ' from CSS/HTML/JS.'));
   });
   ```

---

#### 7. Five keyboard & focus-management bugs (`Ctrl+Z`, `Arc` close, dock open/hover-close, collapsed footer)
**Why it matters:**
1. `Ctrl+Z` / `Ctrl+Y` (line 2678) fails whenever `document.activeElement` is `document.body` (right after startup, after picking an `Arc` colour, or after double-clicking a label).
2. Closing `Arc` with `Escape` (line 2670) focuses the first `.swatch-trigger` in the document instead of `owner`, and clicking a colour dot (line 1583) drops focus to `<body>`.
3. Opening `#dockTrigger` via keyboard hides `#dockTrigger` and drops focus to `<body>`.
4. Hover-opening the dock and then pressing `Tab` into it still lets `mouseleave` auto-close the dock 500 ms later while focus is inside it.
5. When `#cardFoot` is collapsed on `Settings`, `New component`, or `Role` pages (line 845), its 4 buttons remain in the `Tab` order despite being invisible.

1. In `lab/lab.js` (line 2678), change `if (a && dock.contains(a) && dockOpen && !texty && def)` to `if (dockOpen && !texty && def)`.
2. In `Arc.close(instant, focusOwner)` (`lab/lab.js` lines 1600–1611), add `if (focusOwner && t) t.focus({ preventScroll: true });`, pass `true` when closing from a dot click (line 1583), and call `Arc.close(false, true)` in the `Escape` handler (line 2670).
3. In `openDock()` (`lab/lab.js` lines 600–615), check `const fromKey = document.activeElement === $('dockTrigger');` before hiding the trigger, and if true, focus `#rail .rail-btn.is-active` or `#dockClose` after opening.
4. Near line 2655 of `lab/lab.js`, add `dock.addEventListener('focusin', () => { if (dockOpen) pinned = true; });` and update the `mouseleave` check (line 2651) to also bail if `dock.contains(document.activeElement)`.
5. In `renderPage()` (`lab/lab.js` line 845), set `inert` whenever `#cardFoot` is collapsed:
   ```js
   const fc = footCollapsed();
   $('cardFoot').classList.toggle('is-collapsed', fc);
   $('cardFoot').inert = fc;
   ```

---

#### 8. Stale flick velocity after drag-and-hold in `lab/motion.js`
**Why it matters:** In `M.Flick` (`lab/motion.js` lines 229–241), velocity samples in `st.s` are only trimmed during `pointermove`. If you drag the toolbar icon, hold still for half a second, and release, `pointerup` computes velocity from the old samples before the pause and triggers an unintended flick or session dismissal.

1. In `M.Flick` (`lab/motion.js` lines 240–242), zero the release velocity if the pointer was stationary for more than `90 ms` before `pointerup`:
   ```js
   const a = s.s[0], b = s.s[s.s.length - 1], dt = Math.max(1, b.t - a.t);
   const stale = e.timeStamp - b.t > 90;
   const dx = e.clientX - s.x0, dy = e.clientY - s.y0;
   const vx = stale ? 0 : (b.x - a.x) / dt, vy = stale ? 0 : (b.y - a.y) / dt;
   ```

---

#### 9. `serve.py` and `run.bat` hardening (Origin check, error handling, partial-create cleanup, Chrome launch timing)
**Why it matters:**
- `serve.py` (lines 46–70) accepts `POST` requests without checking `Origin`/`Host` (allowing cross-tab localhost CSRF) and only catches `ValueError` (so `OSError` crashes the request thread).
- `new-component.py` (lines 42–77) can leave a half-created component folder behind if an error occurs after `shutil.copytree()`.
- `run.bat` (lines 4–5) opens Chrome before `serve.py` binds the socket and checks `where python` before `where py` (which can hit the Windows Store alias stub).

1. At the top of `serve.py` (line 17), set `sys.dont_write_bytecode = True` before importing `new-component.py` so `__pycache__` is not written to the root folder, and delete the existing `__pycache__` folder.
2. In `do_POST()` (`serve.py` lines 46–70), verify `Host` and `Origin` are local (`127.0.0.1` or `localhost`) and catch `Exception` so any unexpected error returns clean JSON:
   ```python
   host = self.headers.get("Host", "")
   origin = self.headers.get("Origin", "")
   if not host.startswith(("127.0.0.1:", "localhost:")) or (origin and not origin.startswith(("http://127.0.0.1:", "http://localhost:"))):
       return self.reply(403, {"ok": False, "error": "Forbidden origin"})
   ```
   And replace `except ValueError as e:` with:
   ```python
   except ValueError as e:
       self.reply(400, {"ok": False, "error": str(e)})
   except Exception as e:
       self.reply(500, {"ok": False, "error": str(e)})
   ```
3. In `create()` (`new-component.py` lines 42–77), wrap the file edits after `shutil.copytree(TEMPLATE, dest, ...)` in a `try / except Exception:` block that calls `shutil.rmtree(dest, ignore_errors=True); raise` on failure.
4. In `serve.py` (lines 72–81), support `--open` (opening `http://127.0.0.1:<port>/` via `webbrowser.open()` *after* `ThreadingHTTPServer` binds, or opening the existing server if the port is already bound), and simplify `run.bat` to try `py serve.py 5179 --open` first, then `python serve.py 5179 --open`.

---

#### 10. CSS isolation: prevent `lab/lab.css` rules from bleeding into `#labFrame`
**Why it matters:** `lab/lab.css` defines global rules for `button, input, select`, `:focus-visible`, `.card`, `.page`, `.chip`, `.switch`, `.btn`, and `.tile`. Any component inside `#labFrame` that uses those common class names or native buttons inherits the lab's chrome styling and cyan focus ring.

1. In `lab/lab.css` (line 50), wrap everything after the `.stage` / `.lab-frame` / `.vp-box` positioning rules (from line 51 to the end of the file, plus lines 20–33) in a Chrome `@scope` donut block so lab UI styles never apply inside `#labFrame`:
   ```css
   @scope (:root) to (#labFrame) {
     /* button resets, :focus-visible, .glass, .tb, .dock, .card, .ctl, etc. */
   }
   ```
2. In `workingFile()` (`lab/lab.js` line 2244), add `<link rel="stylesheet" href="lab/fonts/fonts.css">` to the exported `<head>` so standalone working files render with `Chakra Petch` and `JetBrains Mono`.

---

### Structure and language issues

#### 1. Split `lab/lab.js` (2,714 lines) into 3 focused plain-JS files on `window.Lab`
**Why it matters:** Keeping 148 KB of code in a single `lab/lab.js` IIFE makes edits slow and error-prone. Using plain `<script>` files attached to `window.Lab` (matching `window.Motion` in `lab/motion.js` and `window.Scan` in `lab/scan.js`) avoids ES-module state refactoring while cutting file size down to manageable pieces.

1. Extract `lab/export.js` (~180 lines): `copyText()`, `changesText()`, `interactionText()`, `workingFile()`, `saveManifest()`, and `localStorage` backup/restore helpers.
2. Extract `lab/controls.js` (~450 lines): `ctlRow()`, `dialEl()`, `chip()`, `syncRow()`, `buildRole()`, `Arc`, and `holdButton()`.
3. Load `lab/controls.js` and `lab/export.js` in `index.html` (lines 108–111) right before `lab/lab.js`.

---

#### 2. Remove dead `buildCat` Pro code and guard hidden `viewSeg` updates
**Why it matters:**
- `buildCat()` and `fillCat()` (`lab/lab.js` lines 883–897) contain `mode === 'pro'` branches that are dead code because `buildPage()` (line 873) sends all Pro category views to `Acc.build()` (line 1024).
- `TB.paint()` (line 2346) re-syncs `$('viewSeg')` on a timer after every toolbar animation even though `'viewport'` is not in `TOOLBAR_GROUPS`.

1. Simplify `buildCat()` (`lab/lab.js` lines 883–897) to only render `basicVars().filter((v) => v.category === cat)`.
2. In `TB.paint()` (line 2346), remove the unconditional `syncSeg($('viewSeg'), viewPill, ui.view, true)` call inside `setTimeout` (since line 2349 already guards it with `if (open.has('viewport'))`).

---

#### 3. Add optional `jsconfig.json` for zero-build IDE type-checking and clean up `README.md` drift
**Why it matters:**
- `README.md` references non-existent folders (`component-lab-v1/` on line 9, `shots/v2-*.png` on line 331), claims `scan.js` strips strings (line 301), and `lab/lab.js` (line 2117) suggests `python3 new-component.py` in a toast on Windows (where `py` or `python` is standard).
- A 6-line `jsconfig.json` enables instant typo and undefined-variable warnings in VS Code / Antigravity without any build step or npm packages.

1. In `lab/lab.js` (line 2117), change `python3 new-component.py` in the error toast to `python new-component.py`.
2. Update `README.md` (lines 317–332) to match the actual files on disk and note that switching server ports (`5179` vs `5180`) uses a separate browser `localStorage` origin.
3. Add a minimal `jsconfig.json` at the project root:
   ```json
   {
     "compilerOptions": { "target": "ES2022", "checkJs": false },
     "include": ["lab/*.js", "components/**/*.js"]
   }
   ```

---

### Base/Pro organization

Instead of scattering `mode === 'pro'` checks across `lab/lab.js`, organize the lab around a single **`PRO_FEATURES`** map with a clear workflow split between **Basic** (everyday tuning), **Pro** (deep tuning, layout control, and curation), and **Settings** (everyday preferences vs. Pro authoring tools):

| Workflow Layer | **Basic** (Fast, zero-clutter core) | **Pro** (Full control, organization & authoring) |
|---|---|---|
| **Control view** | Up to 8 featured controls, one category page at a time via rail icons | All controls in one scrolling accordion (`All controls`), sub-grouped into mini-cards with `More` and `Advanced` folds |
| **Control metadata** | Clean labels and values only | Adds `✦` signature marks, `★` star buttons to curate Basic's 8 controls, and a subtle `where` / `lab-bound` / `js-const` line under controls |
| **Colour picking** | Project palette presets + radial gooey swatch picker (`Arc`) | Compact swatch chip rows + `Custom…` hex/colour picker + `My palette` 6-slot editor |
| **Header tools** | Component switcher (`#cmpName`), `Basic / Pro` switch, quick hover pill | Adds `⋮` section options menu (`#moreBtn` / `Pop`) for collapse mode and motion variants (`A/B/C/D`) |
| **Footer export** | `Copy changes`, `Copy full working file`, `Undo`, `Reset`, `N changed` (hold to compare defaults) | Same (both modes keep full export; remove the misleading `"full-file copy"` badge from `.pro-strip`) |
| **Settings page** | **Everyday settings:** Dock position & anchor, Animations, Viewport (`1600×770` / `1366×768` / `Fit`), Show toolbar icon, Reset | **Adds Pro & Setup sections:** `My palette`, `Rail order` & `Rail actions`, `Toolbar` start/flick tuning, `Pro sections`, `Interaction scan` diagnostics, `Manifest` (`Save to disk` / `Export JSON` / `Re-scan`), and `Backup / Restore JSON` |

#### Steps to implement `PRO_FEATURES` gating

1. Near the top of `lab/lab.js` (line 69), define `PRO_FEATURES` and `hasPro(key)`:
   ```js
   const PRO_FEATURES = {
     accordion: true,      // All controls in one scrolling accordion with mini-cards & Advanced folds
     starCurate: true,     // Star buttons on controls to curate the 8 Basic controls
     signatureMarks: true, // ✦ signature badges and where/wiring notes on controls
     sectionMenu: true,    // ⋮ section collapse & motion variant menu in header + Settings
     railCustomize: true,  // Reorder or hide rail categories and actions in Settings
     customPalette: true,  // My palette editor and palette source switcher in Settings
     flickTuning: true,    // Toolbar start state and flick strength tuning in Settings
     scanDiagnostics: true,// Interaction scan code findings in Settings
     manifestTools: true   // Save to disk, Export JSON, and Re-scan in Settings
   };
   const hasPro = (k) => mode === 'pro' && !!PRO_FEATURES[k];
   ```
2. In `proStrip()` (`lab/lab.js` lines 981–990), remove the inaccurate `full-file copy` span and replace it with `★ curate Basic` so the strip accurately describes what Pro adds.
3. Replace scattered `mode === 'pro'` checks in `lab/lab.js` with `hasPro(...)`:
   - `buildPage()` (line 873) and `pageTitleFor()` (line 819): use `hasPro('accordion')`.
   - `syncHeadTools()` (line 1246): gate `#moreBtn` with `hasPro('sectionMenu')`.
   - `ctlRow()` (lines 1329–1338): gate `.is-sig` and `svg('sig')` with `hasPro('signatureMarks')`, and gate `starBtn(v)` with `hasPro('starCurate')`.
   - `buildSettings()` (lines 1820–1951): wrap `My palette` (`hasPro('customPalette')`), `Rail order` / `Rail actions` (`hasPro('railCustomize')`), toolbar start/flick tuning (`hasPro('flickTuning')`), `Pro sections` (`hasPro('sectionMenu')`), `Interaction scan` (`hasPro('scanDiagnostics')`), and `Manifest` (`hasPro('manifestTools')`). When in Basic mode, show a single link button at the bottom of Settings: `"Switch to Pro for rail order, custom palettes & manifest tools"`.
4. Persist `ui.mode` in `setMode()` (line 743) and restore `mode = ui.mode === 'pro' ? 'pro' : 'basic'` in `loadComponent()` (line 442) so switching components while in Pro mode does not kick you back to Basic.

---

### Worthwhile enhancements

#### 1. Press-and-hold on `N changed` in the footer to compare against defaults
**Why it matters:** While tuning a component, you frequently want to A/B check your current changes against the original untouched component without losing your undo stack or triggering a reset.

1. Change `<span class="changed" id="changedCount">` in `index.html` (line 90) to `<button class="changed" id="changedCount" type="button" title="Hold to preview defaults">`.
2. In `buildChrome()` (`lab/lab.js` line 2636), wire `pointerdown` / `keydown` (`Space`/`Enter`) on `$('changedCount')` to temporarily snapshot `P`, apply `v.default` for all vars (`applyAll()`), and restore the snapshot on `pointerup` / `pointerleave` / `keyup`.

---

#### 2. Show `where` / `hint` and wiring status (`lab-bound` vs `js-const`) in Pro mode
**Why it matters:** `components/helix/manifest.json` and `scan.js` already populate `v.where`, `v.hint`, and `v.source`, but `ctlRow()` (`lab/lab.js` lines 1327–1400) hides them in a native hover tooltip or ignores them completely. Especially for auto-scanned `js-const` controls (which only take effect once `component.js` reads `P.NAME`), surfacing a tiny note in Pro mode prevents confusion.

1. In `ctlRow()` (`lab/lab.js` line 1399), when `hasPro('signatureMarks') && (v.source === 'js-const' || v.hint)`, append a compact `.ctl-sub` line under the control showing `v.hint || v.note`.
2. Style `.ctl-sub` in `lab/lab.css` (line 228) as `font: 10.5px/1.3 var(--mono); color: var(--lab-dim);`.

---

#### 3. Click-to-type exact numbers on slider and dial controls
**Why it matters:** Dragging a 300 px slider or 60 px radial dial is great for feel, but typing an exact value like `156` or `44` is much faster when matching a spec.

1. In `ctlRow()` (`lab/lab.js` line 1336), when `v.control === 'slider' || v.control === 'radial'`, add a `click` listener on `out` (`.ctl-val`) that replaces `out`'s text with a compact `<input type="number" class="val-in">` pre-filled with `P[v.id]`.
2. Commit `setValue(v.id, inp.value)` on `Enter` or `blur`, and restore `fmt(v, P[v.id])` on `Escape`.

---

#### 4. One-click Backup / Restore of all lab `localStorage` data (plus global UI reset)
**Why it matters:** Because `localStorage` is tied to the browser origin and port (`127.0.0.1:5179`), clearing browser data or switching ports loses all saved values, stars, and custom palettes.

1. In `buildSettings()` (`lab/lab.js` line 1941), add `Export lab data` and `Import lab data` buttons that dump/restore all `localStorage` keys prefixed with `componentLab:v2:` as a single JSON file.
2. In the `Hold to reset all` callback (line 1942), add `store.del('accOpen:' + def.id)`, and add a `Reset lab layout & settings` link button below it that deletes `store.del('ui')` and reloads.

---

#### 5. Built-in automated smoke check (`?selftest=1`) *(Claude Opus bonus)*
**Why it matters:** Gives a solo developer a 3-second automated sanity check in Chrome after editing component code or lab files without needing external test runners.

1. At the end of `init()` in `lab/lab.js`, check `new URLSearchParams(location.search).get('selftest') === '1'`.
2. When active, iterate through `window.LAB_REGISTRY` (excluding `_template`), call `await loadComponent(c.id)`, verify `inst && def` mounted without console/runtime errors, test stage scaler dimensions at `1600×770` and `1366×768`, and display a summary toast (`Self-test passed: N/N components OK` or failure details).

---

#### 6. Named snapshot slots (`A / B / C`) per component *(Claude Opus bonus)*
**Why it matters:** Lets you stash and compare 2–3 distinct colour/motion directions for the active component directly inside the card header/footer without overwriting your main working state.

1. Store up to 3 lightweight value snapshots per component under `store.get('snaps:' + def.id, {})` (`{ A: {...}, B: {...}, C: {...} }`).
2. Render a compact `A · B · C` pill group in Pro mode (click an empty slot or `Shift+Click` to save current `P` into that slot; click a filled slot to apply its values via `pushHistory()`; right-click or `Alt+Click` to clear).

---

#### 7. Floating stage toolbar (`#stageBar`): full-card hit detection, tactile grab feedback, 1:1 free-roam drag-and-drop over the sandbox, and video-game exit trajectories
**Why it matters:** Previously, `M.Flick(icon(), ...)` was bound only to the inner `32×32 px` `#tbToggle` button (missing the outer `.tb` glass border/padding), compressed movement through `M.rubber(dx, 28)` so the icon lagged behind the cursor and felt trapped in the top-left corner, always snapped back to `(16px, 16px)` on release, and used a single linear fade-out when dismissed. Because `.tb` is `position: fixed; z-index: 12;`, it floats above the stage without affecting `#stageFit` or `#stageScaler` sandbox layout at all.

1. **Full-card & border hit detection (`#stageBar`):**
   - Bind gesture handling on the entire `#stageBar` (`.tb`) shell so grabbing the icon, the `4 px` glass padding, or the `1 px` outer border engages the toolbar (while ignoring interactive inner controls like `#tbPick`, `#labPlay`, `#labScrub`, and `#viewSeg`).
2. **Tactile press/hold & velocity-tilt feedback:**
   - Add `.is-held` on `pointerdown` (immediate `scale(1.05)`, elevated cyan border glow `rgba(110, 231, 255, 0.48)`, deeper drop shadow, `cursor: grabbing`) and `.is-dragging` during movement with subtle live velocity banking (`rotate(clamp(vx * 4, -9, 9)deg)`).
3. **1:1 cursor tracking & session-persistent drop anywhere over the stage:**
   - Replace `M.rubber(dx, 28)` with true **1:1 cursor tracking** (`left` / `top` updated from `startLeft + dx`, `startTop + dy`).
   - **Drop to relocate (session-scoped until reload):** Releasing the cursor without a flick velocity (`power === 0` or after holding stationary `> 90 ms`) drops and anchors the toolbar at that custom `(x, y)` spot (clamped within `12 px` of viewport edges) with a crisp spring settle.
   - **Auto-flip expansion (`data-flip`):** If dropped on the right half of the viewport (`x > innerWidth * 0.55`), automatically flip `.tb` (`flex-direction: row-reverse`) so groups expand inward toward the stage center instead of clipping off the right edge.
4. **Gesture disambiguation (Click vs. Drop vs. Flick):**
   - **Tap (`< 6 px`):** Toggles groups open/closed (`Shift+Click` steps 1 group).
   - **Short directional flick (`< 75 px` drag with flick velocity along `x`):** Snaps back to the current custom anchor spot and opens `1` group (gentle), opens `all` groups (strong toward `growDir()`), or closes `1` group (gentle against `growDir()`).
   - **Drag & Drop (`≥ 10 px` move released calmly / after hold):** Relocates `#stageBar` to the release coordinates for the current session.
   - **Strong throw (`power >= 2` away / any high-speed throw):** Triggers the video-game exit trajectory (`TB.dismiss`).
5. **Video-game exit trajectories (`TB.dismiss`):**
   - Cycle/randomize across 5 distinct arcade flight paths when thrown off-screen (logging the trick name in the footer log):
     1. **Gravity Lob (`arc`):** Launches along `(vx, vy)` then accelerates downward under arcade gravity in a parabolic arc while tumbling (`rotate(420deg)`).
     2. **Wall Ricochet (`ricochet`):** Streaks to the nearest viewport wall, bounces off with a squash-stretch impact flash (`scale(1.28, 0.74)`), and ricochets across the stage spinning.
     3. **Boomerang Curveball (`curve`):** Curves perpendicular to the throw vector (Magnus spin) while spinning `540deg` off-screen.
     4. **Slingshot Warp (`warp`):** Briefly winds back (`-vx`) with a charge-up squash (`scale(1.2, 0.82)`), then blasts out at hyper-speed with motion-stretch (`scale(1.65, 0.68)` + `blur(2px)`).
     5. **Corkscrew Spiral (`spiral`):** Flies outward along a sinusoidal corkscrew path while spinning `720deg` and shrinking into the horizon (`scale(0.12)`).

---

### Future project review & post-MVP audit log

#### 1. Claude Opus's ES Module (`<script type="module">`) & shared state proposal (Item 1.7 — for later evaluation)
- **What Opus proposed:** Instead of splitting `lab/lab.js` into classic IIFE `<script>` files sharing `window.Lab`, convert `lab/motion.js`, `lab/scan.js`, `lab/controls.js`, `lab/export.js`, and `lab/lab.js` to native ES modules loaded via `<script type="module" src="lab/lab.js"></script>`.
- **Required architectural changes if adopted later:**
  - Extract all top-level mutable closure variables currently inside `lab/lab.js` (`def`, `inst`, `man`, `vars`, `P`, `mode`, `ui`, `history`, `histIdx`, `pinned`, `openId`, `lastCat`, `railView`, `loadSeq`, `featured`, `accOpen`) into a dedicated `lab/state.js` module exporting a shared `state` object (or getter/setter helpers).
  - Replace direct variable mutations (`mode = 'pro'`, `P = {}`, `inst = ...`) across all split files with property mutations on the imported `state` object (`state.mode = 'pro'`, `state.P = {}`, `state.inst = ...`).
  - Keep `window.Lab = { register }` attached globally so dynamically evaluated `components/<id>/component.js` files continue to register without needing module imports.
- **Criteria to review at a later date:**
  - **Stress & scale:** Whether growing beyond ~5 lab files or adding heavier async component pipelines makes explicit ES `import`/`export` dependency graphs safer than `window.Lab` namespace attachment.
  - **Variable & state edge-cases:** Ensuring live bindings vs. object property references (`state.P` vs. local `P` aliases during rapid slider scrubbing, undo/redo snapshots, and hold-to-compare previews) cannot go stale across modules.
  - **Environment constraints:** Remembering that `<script type="module">` enforces strict CORS (`http://127.0.0.1:5179` works; opening `index.html` via `file://` will block module imports) and enables strict mode (`'use strict'`) automatically across all files.

#### 2. Complete inventory of steps, files & edge-cases Claude Opus did not reach before quota pause (~93% mark)
Because Claude Opus's 5-hour quota expired while it was mid-sentence drafting code snippet #6 (`@scope`), the following items were either not reached in its file reads or not written into its final output. They are recorded here so nothing is lost during implementation or future project reviews:
1. **`components/_template/component.js` (lines 20, 28–31) — Custom HTML overwrite & `_template` write protection:**
   - Opus did not read `_template/component.js` in full (only grepped line 20 for `<a class="t-link">`). It missed lines 28–31 where `host.innerHTML = KINDS[kind]` runs unconditionally on every `mount()` and `render()` when `P.kind` is set, wiping out any custom HTML placed in `components/<id>/markup.html`.
   - Also keep read-only protection so `Save to disk` (`lab/lab.js` line 1933) and `serve.py` (`do_POST`) refuse to overwrite `components/_template/manifest.json`.
2. **`lab/lab.js` `workingFile()` (line 2244) — Missing font stylesheet in standalone export:**
   - Opus paused before auditing `workingFile()`'s HTML `<head>` template, which omits `<link rel="stylesheet" href="lab/fonts/fonts.css">`, causing exported standalone files to fall back from `Chakra Petch` / `JetBrains Mono` to system fonts.
3. **`lab/lab.js` `railCats()` (line 682) — Basic-mode rail category lockout:**
   - Opus noted rail customization in Settings but did not catch that `railCats()` filters out `railHidden()` categories even when `mode === 'basic'`. Because Basic mode has no scrolling accordion fallback, hiding a category in Pro and switching to Basic permanently locks the user out of that category in Basic mode.
4. **`lab/lab.js` `TB.dismiss()` / `TB.flyHome()` (lines 515–525, 1906) — Toolbar visibility switch desync:**
   - Opus noted that dismissing the floating toolbar hides the component picker, but missed that `Settings › Show toolbar icon` reads `ui.tbStart !== 'hidden'` instead of `TB.shown`, so the toggle still displays **ON** when the toolbar is hidden (and if the rail `'toolbar'` icon was also hidden, the toolbar cannot be recovered).
5. **`lab/lab.js` `applyVar()` & `flushBinds()` (lines 222–288) — Premature `!important` binds on untouched controls:**
   - Opus focused on preserving RGBA alpha via `rgb(from {v} r g b / alpha)`, but did not guard `applyVar()` and `flushBinds()` with `isModified(v)`. Without the `isModified(v)` guard, untouched auto-scanned binds inject `<style id="labBinds">` rules with `!important` on initial load, overriding the component's native `:hover`, `:focus-visible`, and `@media` rules before the user touches a single slider.
6. **`lab/scan.js` `interactions()` (lines 262–316) — False-positive `click` on drag-guards & missing CSS `:focus-visible`:**
   - Opus caught that `drag` needs `pointerdown` + move, but missed that `components/helix/component.js` (line 184) uses `addEventListener('click', (e) => { if (dragMoved) { e.preventDefault(); e.stopPropagation(); } }, true)` purely to suppress accidental clicks after dragging—which `scan.js` falsely flags as a `CLICK` interaction. Also missed scanning CSS for `:focus-visible` (`keys`) and stripping `@media` blocks before checking `:hover`.
7. **`lab/lab.js` `buildCat()` (lines 768–796) & `TB.paint()` (line 536) — Dead code & hidden DOM timer:**
   - Unreachable `if (mode === 'pro')` branch inside `buildCat()` (since `buildPage()` returns `buildProAccordion()` on line 873 before calling `buildCat()`) and an unguarded `setTimeout(..., 520)` in `TB.paint()` that mutates `viewSeg.hidden` after every toolbar drag frame even when the toolbar is collapsed.
8. **`compare/original.html` & `compare/original-home.js` — Legacy comparison harness:**
   - Opus listed `compare/` in `Get-ChildItem` but never read those files; keep `compare/` intact as the reference baseline for `helix`.
9. **Paused final report sections (Opus snippets #6–#10):**
   - Opus's trace cut off mid-sentence while writing snippet #6 (`@scope` CSS isolation) and before writing its final sections on `scan.js` `uniq()`, `manifestForExport()` cleanup, keyboard focus fixes, `serve.py` CSRF/Origin hardening, and `run.bat` / `serve.py --open`—all of which we recovered directly from its earlier reasoning trace and merged into sections 1–3 above.

#### 3. Future Settings Option: Persist Custom Floating Toolbar Location (`ui.tbPos`)
- **Current MVP behaviour (Main Step 3):** Dragging and dropping `#stageBar` relocates the floating toolbar anywhere over the viewport/sandbox for the current browser session (resets to default corner on full page reload).
- **Future enhancement:** Add a **Settings › Toolbar › Position** control (`Default corner` | `Remember custom spot` | `Reset position`) backed by `ui.tbPos = { xRatio, yRatio, flip }` in `componentLab:v2:ui` (`localStorage`). Storing normalized viewport ratios (`x / innerWidth`, `y / innerHeight`) ensures the saved custom spot adapts cleanly when switching between `1600×770` and `1366×768` laptop displays or resizing the Chrome window.

#### 4. Future Refinement: Toolbar Reposition vs. Throw Sensitivity & Hold/Pause Gesture Disambiguation
- **Observed issue during testing:** When holding and dragging `#stageBar` across the screen to test motion and repositioning it into the narrow top strip above the sandbox, pausing/hovering the cursor and releasing still triggered a flick/dismiss (`power >= 2`) instead of dropping the toolbar in place.
- **Root cause:**
  1. In `lab/motion.js`, `M.flickPower(dx, vx)` evaluates `if (sp >= L.strong || d >= L.far) return 2;`. Because `d >= L.far` (`170 px` in Normal mode) triggers `power = 2` based on **total drag distance alone**, any reposition drag longer than `170 px` is treated as a strong throw unless `stale` (`e.timeStamp - b.t > 90`) zeroes it out.
  2. When releasing a mouse button or trackpad after a pause, a tiny `1–2 px` physical micro-jitter often fires a `pointermove` within the final `90 ms` before `pointerup`, resetting `b.t` so `stale` evaluates to `false` even though the user paused!
- **Future fix / refinement plan:**
  1. **Velocity-only throw threshold for free-roam drag-and-drop:** For free-roam repositioning on `#stageBar`, never promote a release to `power = 2` based on drag distance `d` alone—require true release **velocity** (`Math.hypot(vx, vy) >= L.strong`) over the last `80–100 ms` window.
  2. **Micro-jitter deadzone on pause detection:** Ignore sub-pixel/micro-movements (`< 3 px` over the last `90 ms`) when computing `stale` / release velocity so natural finger/mouse button release jitter after a hover/pause always registers as `vx = 0, vy = 0` (a calm drop).
  3. **Live visual cue ("Drop" vs. "Throw"):** Provide subtle visual feedback on `.tb.is-held` showing whether the current cursor state is settled for a stationary drop vs. primed for an off-screen throw.

#### 5. Future Architecture & UX Study: Sandbox-First Primary Workarea & Reactive Chrome Workflow
- **Core goal:** Make the sandbox component stage (`#stageFit` / `#stageScaler` / `#labFrame`) truly act and feel like the **primary workarea**, maximizing usable component screen real estate vs. the footprint taken by surrounding lab chrome (`#dock`, `#stageBar`, margins/gutters), while making the lab's panels react intelligently to what the user is doing.
- **Areas to explore & design in a dedicated planning pass:**
  1. **Maximizing Sandbox Allocation (`freeRect` & `layoutStage`):**
     - Audit the padding/margins around `#stageFit` (`topPad`, `bottomPad`, `side`, and `cw = cardWidth() + 2 * MARGIN`) so the sandbox uses every available pixel when the dock is open, and consider an "Overlay / Floating Dock" mode where the dock floats translucently over the edge without shrinking `freeRect()` when inspecting full-bleed or wide (`1600×770`) layouts.
  2. **Reactive Chrome During Active Sandbox Or Slider Interaction:**
     - **While dragging a slider / dial / colour swatch:** Temporarily fade the dock card backdrop to ultra-low opacity (or collapse non-active rows) so the user can see the entire sandbox clearly behind the dock while tuning.
     - **While interacting directly with the component inside `#labFrame` (hovering, dragging, testing keyboard/click states):** Automatically dim, tuck, or compact the dock and floating toolbar out of the way so the component has 100% visual focus.
  3. **Coordinated Dock ↔ Floating Toolbar Workflow:**
     - Allow the floating toolbar (`#stageBar`) and main dock (`#dock`) to complement each other dynamically (e.g., docking `#stageBar` into the top margin strip or card header when space is tight, or surfacing the most recently tuned control on `#stageBar` when the main dock is closed for full-screen sandbox testing).

#### 6. Future Documentation / UI Section: Base vs. Pro Differences (FAQ / Help) & Streamlined Menu Card
- **UI Space Optimization (Applied):**
  - Removed the inline `"PRO ADDS"` feature summary strip (`proStrip()` / `.pro-strip`) and inline `.ctl-sub` wiring text from the control menu card/subcards so menu cards and subcards stay compact and focused strictly on titles, buttons, and interactive components (wiring details remain accessible via hover tooltips on control labels).
  - Removed the `#changedCount` (`N changed`) text and `#footLog` terminal log box from the bottom of the menu card (`#cardFoot`), centering the 4 footer action buttons (`#copyBtn`, `#fullBtn`, `#undoBtn`, `#resetBtn`).
- **Future FAQ / Help Section:**
  - Repurpose the Base vs. Pro feature breakdown (`all N controls` vs. `8 featured`, inner `Advanced` / `More` folds, `Interaction` controls, `★ curate Basic`, `A / B / C` snapshots, `⋮` section collapse & motion variants, custom 6-slot palette, and rail/manifest tools) into a dedicated **FAQ / Base-vs-Pro Guide** section (in docs or a dedicated Help modal/drawer) rather than taking up permanent vertical space inside the control menu card.

#### 7. Pioneer DJ XDJ-XZ Hardware-Styled Tempo Deck & Mixer EQ Knobs (`lab/controls.js`, `lab/lab.css`)
- **Pioneer XDJ-XZ Vertical Tempo Deck (`tempoDeckEl`):**
  - Replaces the horizontal `Speed` slider in the Pro `Tempo` card with a vertical **Pioneer DJ XDJ-XZ** controller deck while preserving the exact same `SPEED` parameter range (`0.25×` – `3.00×`, `step: 0.05`, `default: 1.00×`), click-to-type `.ctl-val`, undo/redo, and reset functionality.
  - **Vertical Pitch / Tempo Fader (`TEMPO`):** Features a recessed vertical slot with 19 silkscreened horizontal calibration ticks, a true `50%` center `0` (`1.00×`) detent with a glowing green `TEMPO RESET` LED (`.xdj-zero-led`), magnetic center-detent snap (bypassed with `Shift`), bi-directional LED track fill, and a 3D dark P-LOCK style horizontal fader cap with a bright white center index stripe.
  - **XDJ-XZ Jog Platter & On-Jog Display:** Features the silver-rimmed XDJ-XZ platter with dimpled outer bevel, glowing cyan/blue side-wing arcs around the central LCD (`1.00×` speed + `+0.0%` pitch delta), red-illuminated `MT` (`MASTER TEMPO`) badge when shifted off `1.00×`, `-` / `+` pitch-bend nudge buttons, and a green-LED `RESET` button.
- **XDJ-XZ Mixer `HI / MID / LOW` EQ Rotary Knobs (`dialEl`) & Extensible Variants:**
  - All `radial` rotary controls (`Text fade` › `Starts` & `Gone`, `Shell dim` › `Starts` & `Full`, and `Turn` › `Turn per card`) share a uniform `68×68px` **Pioneer XDJ-XZ EQ (`HI / MID / LOW` freq)** potentiometer design: white silkscreened split C-arc scale with a 12 o'clock center notch, 11 radial EQ ticks, dark rubberized P-LOCK style cap with knurled grip skirt, and a bold solid white pointer stripe.
  - Supports pro-audio vertical drag (`Shift` for fine precision), outer-ring radial angle drag, mouse-wheel stepping, and double-click to reset.
  - Built-in extensible hardware variants (`v.variant` / `v.control`) for future controls: `'eq'` (default High/Mid/Low pot), `'fx'` / `'color'` (silver Sound Color FX cap), `'gain'` / `'trim'` (amber/orange peak arc), `'fader'` / `'volume'` (`faderEl` vertical channel fader), and `'pad'` / `'button'` (`padBtnEl` illuminated performance pad).

#### 8. Future Rubric: Subcard Item Caps vs. `More (x–y)` Dropdown Thresholds
- **Immediate Change Applied (`Surface › Opacity`):**
  - Folded `Back-card opacity` (`Back cards`) directly into the main `OPACITY` subcard alongside `Card` and `Border` (`components/helix/manifest.json` + `miniCard()` in `lab/lab.js`), removing the `More (1)` dropdown and sizing `.mini` (`padding: 9px 11px 12px`) to house all 3 sliders cleanly.
- **Future Rubric to Formalize Across Components:**
  - **Inline Threshold (`1–3` controls):** Always display all controls directly inside the subcard without a `More` dropdown (never render `More (1)` for a 3-slider card).
  - **Single `More` Fold (`4–6` controls):** Show the top `2–3` primary/featured controls inline and group the remaining `2–3` secondary controls into a single `More (N)` disclosure.
  - **Range-Indexed / Paginated Dropdowns (`7+` controls):** When a subcard or category contains larger parameter sets, split overflow controls into indexed range disclosures (e.g. `More (4–6)`, `More (7–9)`) or sub-group folds so no single card exceeds comfortable viewport height.

#### 9. Dual-Sided 3D Card-Flip UI/UX for Secondary & Advanced Options (`buildFlipCard` / `.mini.is-flip`)
- **Applied Architecture (`lab/lab.js`, `lab/lab.css`):**
  - Replaced vertical-resizing `Advanced (N)` and `More (N)` dropdown folds with **Dual-Sided 3D Flip Subcards (`buildFlipCard`)**.
  - Both faces (`.flip-face.is-front` and `.flip-face.is-back`) share `grid-area: 1 / 1` inside `.flip-rotor` (`perspective: 900px; transform-style: preserve-3d`), so spinning 180° (`rotateY(180deg)`) between the primary controls and the secondary/advanced controls **never resizes the card or shifts the menu scroll position**.
  - Applied across **Interaction** (`Pointer` ↔ `Touch & keys`), **Motion** (`Loop` ↔ `Depth`), **Color** (`Card` ↔ `Adv`, `Text` ↔ `Adv`), **Rate** (`Tempo` ↔ `Adv`, `Turn` ↔ `Adv`, `Text fade` ↔ `Shell dim`, `End fade` ↔ `Border fill`), and **Layout** (`Size` ↔ `Depth`, `Radius` ↔ `Adv`, `Spacing` ↔ `Adv`).

#### 10. Future 3-Tier Control Architecture (`Basic` | `Mid` | `Pro`) — DDJ Preset Pads vs. XDJ-XZ Fine-Tune Deck
- **`Basic` Tier (Quick Look & Core Visuals):**
  - Focused strictly on core visual/surface/layout essentials.
  - **Move `Interaction` out of `Basic`** and into `Mid` and `Pro` tiers.
- **`Mid` Tier (New — Pioneer DDJ-Style Preset Controller UI/UX):**
  - Introduces the `Interaction` category (`Pointer` ↔ `Touch & keys` flip card) and curated intermediate controls.
  - Features a **Pioneer DDJ-controller style UI/UX** where controls like `Rate / Tempo` use **3 tactile preset rate buttons / performance pads** (e.g. `0.5× Half` | `1.0× Nominal` | `2.0× Double`) for fast, musical one-tap selection without overwhelming the user with full calibration scales.
  - **Mid-Tier Side Menu Collapsible Anchor Option:** Mid-tier will receive the added option of collapsing the side menu anchor point to a thin vertical dock capsule (sharing the `slim` anchor flexibility between Mid and Pro tiers), while Basic mode remains strictly full expanded with zero options.
- **`Pro` Tier (Pioneer XDJ-XZ Full Fine-Tune Studio):**
  - Full access to every control, dual-sided advanced flip cards, `A / B / C` snapshots, manifest/rail customization, and continuous fine-tune adjustment using the **Pioneer XDJ-XZ** vertical tempo fader + jog platter display and `HI / MID / LOW` mixer EQ rotary knobs.

#### 11. Pioneer XDJ-XZ Performance Pads & Beat FX Module (`Surface › Fades` & `Surface › Glow`)
- **Pioneer XDJ-XZ Backlit Silicone Performance Pads (`padSwitchEl` / `.xdj-perf-pad`):**
  - Converts boolean switch controls under `Fades` (`TEXT_FADE_ON` and `END_FADE_ON`) from stacked mobile toggle rows into an authentic side-by-side **2-column Pioneer XDJ-XZ Performance Pad strip** (`.mini-body.is-pads`).
  - **Tactile Hardware Styling:** Modeled directly after the 8 backlit silicone pads under the XDJ-XZ jog wheels, featuring a matte dark rubber bevel, brilliant cyan top LED indicator bar (`#00f0ff` glow), uppercase title (`TEXT FADE` / `END FADE`), subtitle (`Turned cards` / `Cards at ends`), and status pill (`● ON` / `○ OFF`).
  - **Space & Ergonomic Optimization:** Cuts vertical card height by nearly 50% (from ~84px down to ~48px) while doubling the click/tap target area. Includes tactile physical depression animation (`:active`), keyboard accessibility (`Space` / `Enter`), and corner curate star button (`starBtn(v)`) for Basic mode curation.
- **Pioneer XDJ-XZ Beat FX & Level/Depth Unit (`fxUnitEl` / `.xdj-fx-unit`):**
  - Converts continuous intensity controls under `Glow` (`GLOW_STRENGTH`: `0.00..3.00×`, `step: 0.05`, `default: 1.00×`, `css: "--hx-glow-k"`) from a generic horizontal slider into a dedicated **XDJ-XZ Beat FX module**.
  - **Iconic Illuminated BEAT FX ON/OFF Stomp Button (`.xdj-fx-btn`):** Modeled directly on the round illuminated blue/cyan Beat FX button from the DJM-900 / XDJ-XZ mixer. Displays an outer chrome bezel, dark well, and glowing cyan neon lens when active (`>0`). Clicking toggles between bypass (`0.00×`) and active (instantly restoring the last non-zero intensity or default `1.00×`).
  - **`LEVEL / DEPTH` Rotary Knob (`dialEl` with `variant: "fx"`):** Brushed silver metallic cap, knurled skirt, 270° calibrated sweep (`0..3×`), glowing cyan pointer needle, click-to-type numerical input (`.ctl-val`), and double-click reset to default `1.00×`.
  - **Quick-Depth Performance Pads (`.xdj-fx-pads`):** 4 micro performance pads (`[ OFF ]`, `[ 0.5× ]`, `[ 1.0× ]`, `[ 2.0× ]`) for instant one-touch jumps to key glow intensities, with active backlit cyan illumination matching the dial level. Fully synchronized via `syncRow(id)`.



#### 12. Pro Side Menu Default Load State & Dock Anchor Point Settings (Nested Icon | Slim Menu | Full Expanded)
- **Pro Default Load/Save State (`ui.proDock: 'slim'`):**
  - Pro mode defaults on cold load to a collapsed, thin vertical dock capsule (`slim`), anchored to the screen edge (taking only 48px width).
  - Maximizes the component testing stage (`freeRect()` allocates `innerWidth - 78px` instead of `392px`), keeping all rail category icons, tools, and actions immediately accessible.
- **Settings Configuration (`Side menu` Segmented Control in Pro Mode Only):**
  - Under `Settings > Dock`, Pro users can select and save their preferred side menu state:
    1. `Nested icon` (`icon`): round floating trigger button (`#dockTrigger`).
    2. `Slim menu` (`slim` — default for Pro): thin vertical dock anchor capsule.
    3. `Full expanded` (`full` / `open`): expanded 392px card.
  - Persisted across reloads in `componentLab:v2:ui.proDock`.
- **Basic Mode Invariant:** Basic mode stays unchanged, defaulting to full expanded with no extra options displayed in Settings.
- **Two-Stage Esc Gesture:** Esc while full open collapses to `slim`; Esc while in `slim` collapses to `closed` (nested icon).
- **Dedicated Tuck Tool (`#railTools [data-tool="tuck"]`):** Pro users can collapse the slim menu to nested icon with one click using the collapse tool on the rail.
- **Smooth 6-Way Morphing:** Animated transitions across all states with `.dock.is-morphing` and `.is-closing`.
- **Update 2026-10-30 (branch `feat/icons-dock`): 3-stage dock merged in.** The three states are now
  stages 1 pass / 2 rail / 3 card (`DOCK_STAGES`). The round nested icon became the 54 x 84 all-access
  lanyard pass. The setting is now `Settings > Dock > Start stage` (`1 Pass | 2 Rail | 3 Card`, same
  `ui.proDock` values). Basic now folds to the thin rail (X / Esc / outside click) instead of staying full
  expanded, and never shows the pass or hides the dock. Pro adds flick stepping, flick-to-hide (session
  only, `Alt+D` / edge handle / Basic / reload bring it back) and the `?` help card, each behind its own
  `PRO_FEATURES` switch (`dockStages`, `dockFlick`, `dockHide`, `helpIcon`). Esc steps one stage down;
  hover no longer auto-opens the card. See README > All-access pass and Control Dock.

#### 13. Pioneer XDJ-XZ 3-Column Geometry Deck (Layout › Spacing & Radius)
- **Combined Console Deck (.mini-body.is-deck):**
  - Unifies the previously separate SPACING and RADIUS subcards into a single high-efficiency Pioneer XDJ-XZ 3-Column Geometry Deck (components/helix/manifest.json, lab/controls.js, lab/lab.js, lab/lab.css).
  - Saves ~60px of vertical height (reducing card height from ~220px across two cards down to a single ~160px card), while grouping all three spatial positioning parameters into an intuitive pro-audio mixer layout.
  - Left Column — Master Gain / Radius Knob (SWING CAP):
    - Large 56x56px Master Level rotary dial (dialEl with variant: 'master' / 'gain') controlling RADIUS_MAX (0..160 px, default 84).
    - Features a brushed silver cap, knurled perimeter, cyan indicator needle, live numeric readout (84 px), top-right curation star, and MASTER hardware sub-label.
  - Center Column — Channel 1 Vertical Fader (CH 1 · SPREAD):
    - Authentic Pioneer XDJ-XZ vertical channel fader (faderEl) controlling vertical card spread (TRAVEL: 0.30..1.60, default 0.94).
    - Features a recessed 82px track, calibration scale ticks, tactile beveled fader cap with illuminated white center line, cyan LED fill track, click-to-type readout, top-right star, and CH 1 sub-label.
  - Right Column — Channel 2 Vertical Fader with Center 0 Detent (CH 2 · S-CURVE):
    - Bipolar vertical channel fader (faderEl) controlling vertical S-curve curvature (WAVE: -1.00..+1.00, default +0.30).
    - Features a physical center zero detent at 0.00 with an illuminated green zero indicator LED (.xdj-zero-led), bi-directional glowing cyan LED fill radiating outward from center 50%, full keyboard navigation (ArrowUp/ArrowDown/PageUp/PageDown), and CH 2 sub-label.
- **Dual-Sided 3D Card Flip to Advanced Radius Options:**
  - Card header features clickable 3D flip badge (flip 2) that smoothly flips 180° to reveal the advanced radius controls (RADIUS_FRAC and RADIUS_PAD) rendered as two side-by-side Pioneer EQ rotary dials (.is-dials).

#### 14. Pioneer XDJ-XZ 2-Column Size Deck & Inline Compact Select (Layout › Size)
- **Consolidated Size Subcard (.mini-body.is-mixed-deck):**
  - Unifies the previously split card count dropdown, `Card width` slider, and `Back scale` depth slider into a single high-density console card.
  - Eliminates the 3D flip mechanism on the `Size` card completely by folding `Back scale` (`SCALE_MIN`) onto the front face beside `Card width` (`CARD_W`).
  - Top Area (`.mini-deck-top`):
    - Converts the card count dropdown (`N`) into an inline compact selector (`.ctl-select-inline` and `.lab-select.is-compact`).
    - Eliminates redundant `.ctl-val` duplicate readout text. Placed cleanly inline: `Cards` [ `8 ▾` ] `☆` with a 52px width, cyan border accent, dark semi-transparent fill, and glowing cyan chevron.
  - Lower Area (`.mini-deck-faders.is-2col`):
    - Left Column (`CH 1`): Pioneer XDJ-XZ vertical channel fader for `CARD_W` (`Card width`, 80..240 px, default 156 px). Recessed `#090b10` well, 82px fader track, calibration tick marks, white illuminated center indicator line, and cyan LED fill.
    - Right Column (`CH 2`): Pioneer XDJ-XZ vertical channel fader for `SCALE_MIN` (`Back scale`, 0.10..1.00×, default 0.56×). Recessed `#090b10` well, 82px fader track, calibration tick marks, white illuminated center indicator line, and cyan LED fill.
  - Fully removes `"Depth"` from `manifest.json` `groups.layout`, leaving a clean 2-card layout accordion: `["Size", "Spacing & Radius"]`.

---

### Next-session pickup notes

- **Workspace root:** `C:\Users\rtsii\Desktop\component-lab`
- **User-confirmed selections:** All recommended conflict resolutions (`1.1–1.7`), all 10 core bug/recovery fixes (`2.1–2.10`), all 4 structure/Base-Pro items (`3.1–3.4`), and **all 7 enhancements (`4.1–4.7`, including Opus's `?selftest=1` smoke check and `A/B/C` snapshot slots)**.
- **Execution order for the implementation session:**
  1. ✅ **[COMPLETED — `5526d26`] Backend & launcher hardening (`serve.py`, `new-component.py`, `run.bat`, `components/_template/component.js`, `jsconfig.json`):**
     - Added `sys.dont_write_bytecode = True`, `Origin`/`Host` validation, `_template` write protection, `Exception` + `KeyboardInterrupt` handlers, and `--open` browser launch to `serve.py`; removed `__pycache__/`.
     - Added partial-folder cleanup on failure to `new-component.py`, added `jsconfig.json`, and fixed `_template/component.js` so `KINDS[kind]` only populates an empty `.cmp-host` and `KINDS.nav` links have `href="#"`.
  2. ✅ **[COMPLETED — `cf0900c`] Auto-scan & motion fixes (`lab/scan.js`, `lab/motion.js`):**
     - Added `alphaOf()` and `h + '@' + a` colour grouping with `rgb(from {v} r g b / a)` in `scan.js`.
     - Added `uniq()` ID collision suffixing and tightened `interactions()` (`drag` requires move, ignore `preventDefault`/`stopPropagation` click guards, check CSS `:focus-visible`, strip `@media` before `:hover`).
     - Added the `e.timeStamp - b.t > 90` stale-velocity and power zeroing check in `M.Flick` in `motion.js`.
  3. ✅ **[COMPLETED — Main Step 3] Core lab fixes, `PRO_FEATURES` organization, floating toolbar overhaul, enhancements & file split (`lab/lab.js`, `lab/controls.js`, `lab/export.js`, `lab/lab.css`, `index.html`, `README.md`):**
     - Replaced `loadScript` in `loadComponent()` with single-fetch `new Function(rawJs + '\n//# sourceURL=components/' + id + '/component.js')()` and hardened `init()` startup order (`try / finally` + `hashchange` registry validation).
     - Added `isModified(v)` guard to `applyVar()` / `flushBinds()` so unmodified defaults do not clobber CSS `:hover`/`:focus` pseudo-states, `v.alpha` support in `cssVal()`, `sig` hash invalidation (`_genOpts` + `rawFiles`) for `manifest:<id>`, clean `manifestForExport()`, and capture-phase enforcement on `#stageScaler` / `#labFrame` for scan-sourced interactions.
     - Applied all 5 recovery fixes (`railCats` Basic guard, `TB.shown` switch sync + rail unhide on dismiss/flyHome, clickable `#cmpName` component picker in header, disabled `middle-center` anchor, `?reset` URL parameter) and all keyboard/focus fixes (`Ctrl+Z` without `dock.contains`, `Arc.close(false, true)` owner focus restoration, `focusin` pin on dock, `cardFoot.inert`).
     - Overhauled the floating stage toolbar (`TB` in `lab/lab.js` + `.tb` in `lab/lab.css` — Enhancement #7): whole-card hit detection (ignoring interactive child controls), `.is-held` tactile lift + cyan border glow, 1:1 free-roam cursor tracking across the viewport with live velocity banking, session-only custom drop position on calm release (or `>90 ms` hold) with automatic `data-flip="true"` inward expansion on the right half of the window, `Reset toolbar position` button in Settings, and 5 video-game physics exit trajectories (`arc`, `ricochet`, `curve`, `warp`, `spiral`) when thrown off-screen.
     - Added `PRO_FEATURES` / `hasPro()`, wired all 7 enhancements (hold `N changed` to preview defaults, Pro `where`/`hint` subtitles, click `.ctl-val` to type, backup/restore JSON + UI reset + live `Re-scan files`, `jsconfig.json`, `?selftest=1` smoke check, and `A/B/C` snapshot slots), wrapped `lab/lab.css` UI chrome rules in `@scope (:root) to (#labFrame)`, split `lab/controls.js` and `lab/export.js` out of `lab/lab.js`, and synchronized `README.md`.

