// Component Lab v2 core. No dependencies, no build step.
// Components live in components/<id>/: component.js calls Lab.register({...}); manifest.json lists
// the controls (see README). A component without manifest.json gets one from lab/scan.js.
// Control rows/Arc/dial live in lab/controls.js; export/manifest/backup helpers live in lab/export.js.
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const M = window.Motion;
  const S = window.Scan;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const bust = () => '?t=' + Date.now();
  const KEY = 'componentLab:v2:';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(KEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del(k) { try { localStorage.removeItem(KEY + k); } catch (e) { /* ignore */ } }
  };

  function hashText(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  // ---------- icons ----------
  const ICON = {
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    color: '<path d="M12 3.6c3 3.5 6 6.8 6 10.1a6 6 0 0 1-12 0c0-3.3 3-6.6 6-10.1z"/>',
    surface: '<path d="M12 4l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 16l8 4 8-4"/>',
    type: '<path d="M5 6.5h14M12 6.5V19M9 19h6"/>',
    motion: '<path d="M3 15c3 0 3-6 6-6s3 6 6 6 3-6 6-6"/>',
    rate: '<path d="M4.6 16.5a8 8 0 1 1 14.8 0"/><path d="M12 13.5l4-4.2"/><circle cx="12" cy="13.5" r="1.2"/>',
    layout: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    toolbar: '<rect x="2.8" y="7" width="18.4" height="10" rx="5"/><path d="M10.4 9.6l2.6 2.4-2.6 2.4"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M5.5 18.5l1.9-1.9M16.6 7.4l1.9-1.9"/>',
    close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    back: '<path d="M14.5 6l-6 6 6 6"/>',
    chev: '<path d="M9.5 6l6 6-6 6"/>',
    star: '<path d="M12 4.2l2.4 4.9 5.4.7-3.9 3.8.9 5.4L12 16.4 7.2 19l.9-5.4-3.9-3.8 5.4-.7z"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.2"/><path d="M15.5 8.5V6.6a2 2 0 0 0-2-2H6.6a2 2 0 0 0-2 2v6.9a2 2 0 0 0 2 2h1.9"/>',
    play: '<path d="M8 5.5l10.5 6.5L8 18.5z"/>',
    pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
    user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1.2-3.4 4-5 7-5s5.8 1.6 7 5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    diff: '<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"/><path d="M14 3.5v5h5"/><path d="M12 10.5v5M9.5 13h5M9.5 17.5h5"/>',
    code: '<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"/><path d="M14 3.5v5h5"/><path d="M10 12l-2.2 2.5L10 17M14 12l2.2 2.5L14 17"/>',
    dots: '<circle cx="12" cy="5.8" r="1.5" class="fill"/><circle cx="12" cy="12" r="1.5" class="fill"/><circle cx="12" cy="18.2" r="1.5" class="fill"/>',
    expand: '<path d="M7 9.5l5-5 5 5M7 14.5l5 5 5-5"/>',
    collapse: '<path d="M7 4.5l5 5 5-5M7 19.5l5-5 5 5"/>',
    remember: '<path d="M5 12a7 7 0 1 0 2.1-5"/><path d="M5 4.5V8h3.5"/><path d="M12 8.5V12l2.5 1.6"/>',
    interact: '<path d="M6.5 4.2l11 5.6-4.9 1.4-2.2 4.8z"/><path d="M12.8 11.4l4.4 4.6"/><path d="M4 15.5c.4 2 1.8 3.6 3.8 4.3"/>',
    undo: '<path d="M6 9.6A7 7 0 1 1 6.6 16"/><path d="M5.6 4.8v4.9h4.9"/>',
    reset: '<path d="M15.6 4.4l4 4-8.8 8.8H6.7l-2.2-2.2a1.4 1.4 0 0 1 0-2z"/><path d="M10.4 20h9.1"/><path d="M10.9 9.1l4 4"/>',
    sig: '<path d="M12 3.5l2 6.5 6.5 2-6.5 2-2 6.5-2-6.5-6.5-2 6.5-2z" class="fill"/>'
  };
  const svg = (n, cls) => '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + ICON[n] + '</svg>';

  const CATS = [
    { id: 'color', label: 'Color', icon: 'color' },
    { id: 'interact', label: 'Interaction', icon: 'interact' },
    { id: 'surface', label: 'Surface', icon: 'surface' },
    { id: 'type', label: 'Type', icon: 'type' },
    { id: 'motion', label: 'Motion', icon: 'motion' },
    { id: 'rate', label: 'Rate', icon: 'rate' },
    { id: 'layout', label: 'Layout', icon: 'layout' }
  ];
  const CAT_IDS = CATS.map((c) => c.id);
  const ANCHORS = ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'];
  const VIEWS = [{ id: 'fit', label: 'Fit' }, { id: '1600x770', label: '1600×770', w: 1600, h: 770 }, { id: '1366x768', label: '1366×768', w: 1366, h: 768 }];
  const MARGIN = 16;
  const BASIC_CAP = 8;
  const RAIL_W = 46;

  // Central declarative map for Basic vs. Pro feature gating.
  const PRO_FEATURES = {
    accordion: true,        // Single scrolling panel with mini-cards + Advanced folds
    starCurate: true,       // ★ buttons to curate Basic's 8 featured controls
    signatureMarks: true,   // Sparkle icon on signature controls + where/hint subtitles
    sectionMenu: true,      // ⋮ menu & Pro section collapse/motion settings (A/B/C/D)
    userPalette: true,      // Custom 6-slot "My palette" editor
    railCustomize: true,    // Drag-reorder / hide rail categories & action tools
    toolbarAdvanced: true,  // Toolbar start state & flick strength tuning
    manifestTools: true,    // Interaction scan diagnostics + Save/Export/Re-scan manifest.json
    snapshots: true         // Named A / B / C snapshot slots per component
  };

  // ---------- state ----------
  const ui = Object.assign({ dockPos: 'right', anchor: 'top-right', mode: 'basic', motion: true, paletteSource: 'project', view: '1600x770', open: true, accCollapse: 'remember', accVariant: 'B', tbOut: true, tbStart: 'closed', tbAutoClose: true, tbLast: [], flick: true, flickStrength: 'normal' }, store.get('ui', {}));
  if (ui.anchor === 'middle-center') ui.anchor = 'top-right';
  if (store.get('uiVer', 0) < 3) { ui.accVariant = 'B'; store.set('uiVer', 3); store.set('ui', ui); }
  if (store.get('uiVer', 0) < 4) { ui.view = '1600x770'; store.set('uiVer', 4); store.set('ui', ui); }
  const saveUi = () => store.set('ui', ui);
  M.enabled = ui.motion !== false;

  let def = null, inst = null, man = null, vars = [], byId = {}, P = {};
  let offset = 0, playing = true, lastT = 0, loadSeq = 0, pendingResolve = null;
  let mode = ui.mode === 'pro' ? 'pro' : 'basic';
  const hasPro = (k) => mode === 'pro' && !!PRO_FEATURES[k];
  let previewDefaults = false;
  let scanHovering = false, scanHoverTouch = false, scanKbdPause = false;
  let projectPalette = [], presets = [], kindsInfo = null;
  let navStack = [{ type: 'cat', cat: 'color' }];
  let dockOpen = false, pinned = false, hoverTimer = 0, leaveTimer = 0;
  let railPill = null, modePill = null, viewPill = null;
  let newDraft = { kind: 'card', palette: 'project', name: '' };
  let pageRO = null;
  let bindStyle = null;
  let logMute = false;

  const dock = $('dock'), card = $('card'), pagesEl = $('pages'), frameEl = $('labFrame');

  // ---------- small helpers ----------
  function toast(text, ms) {
    const t = $('toast');
    t.textContent = text;
    t.classList.add('is-on');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('is-on'), ms || 3200);
  }
  async function fetchText(url) {
    try { const r = await fetch(url + bust(), { cache: 'no-store' }); return r.ok ? await r.text() : null; } catch (e) { return null; }
  }
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => { s.remove(); resolve(); };
      s.onerror = () => { s.remove(); reject(new Error('Could not load ' + src)); };
      document.body.appendChild(s);
    });
  }
  function loadCss(href) {
    return new Promise((resolve) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.className = 'lab-css'; l.href = href;
      l.onload = l.onerror = () => resolve();
      document.head.appendChild(l);
    });
  }
  const decimals = (step) => { const s = String(step || 1); return s.includes('.') ? s.split('.')[1].length : 0; };
  const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
  function fmt(v, val) {
    if (v.control === 'swatch-role') return String(val).toUpperCase();
    if (v.control === 'switch') return val ? 'on' : 'off';
    if (v.options) { const o = v.options.find((x) => same(x.value, val)); return o ? o.label : String(val); }
    const n = Number(val);
    return (isNaN(n) ? val : n.toFixed(decimals(v.step))) + (v.unit ? (v.unit === '×' || v.unit === '°' ? v.unit : ' ' + v.unit) : '');
  }
  function coerce(v, raw) {
    if (v.control === 'swatch-role') return S.hex(raw) || v.default;
    if (v.control === 'switch') return raw === true || raw === 'true' || raw === '1' || raw === 1;
    if (v.options) { const o = v.options.find((x) => same(x.value, raw)); return o ? o.value : v.default; }
    const n = Number(raw);
    return isNaN(n) ? v.default : n;
  }

  // ---------- Lab API ----------
  function activeParams() {
    if (!previewDefaults) return P;
    const defP = {};
    vars.forEach((v) => { defP[v.id] = v.default; });
    return defP;
  }
  window.Lab = Object.assign(window.Lab || {}, {
    register(d) { if (pendingResolve) { const r = pendingResolve; pendingResolve = null; r(d); } },
    get params() { return activeParams(); }
  });

  // ---------- hash ----------
  function readHash() {
    const out = {};
    location.hash.replace(/^#/, '').split('&').forEach((kv) => {
      if (!kv) return;
      const i = kv.indexOf('=');
      out[decodeURIComponent(i < 0 ? kv : kv.slice(0, i))] = i < 0 ? '' : decodeURIComponent(kv.slice(i + 1));
    });
    return out;
  }
  function writeHash() {
    if (!def) return;
    const parts = ['c=' + encodeURIComponent(def.id)];
    if (def.animated && !playing) parts.push('o=' + wrap(offset).toFixed(3));
    vars.forEach((v) => { if (!same(P[v.id], v.default)) parts.push(v.id + '=' + encodeURIComponent(P[v.id])); });
    history.replaceState(null, '', '#' + parts.join('&'));
  }

  // ---------- manifest ----------
  function normVar(v) {
    v.label = v.label || v.id;
    if (!CAT_IDS.includes(v.category)) v.category = 'layout';
    if (!v.control) v.control = v.category === 'color' ? 'swatch-role' : typeof v.default === 'boolean' ? 'switch' : v.options ? 'segmented' : 'slider';
    if (v.control === 'swatch-role') { v.default = S.hex(v.default) || '#ffffff'; v.role = v.role || 'accent'; }
    if (v.control === 'select' && !v.options && v.min != null && v.max != null) {
      v.options = [];
      v._genOpts = true;
      for (let x = v.min; x <= v.max; x += (v.step || 1)) v.options.push({ value: x, label: String(x) + (v.unit ? ' ' + v.unit : '') });
    }
    if (v.control === 'slider' || v.control === 'radial') {
      if (v.min == null) v.min = 0;
      if (v.max == null) v.max = Math.max(1, Number(v.default) * 2 || 1);
      if (v.step == null) v.step = (v.max - v.min) <= 2 ? 0.01 : 1;
    }
    v.featured = !!v.featured;
    return v;
  }
  function featuredOverrides() { return store.get('featured:' + def.id, {}); }

  // ---------- applying values ----------
  function isModified(v) {
    if (previewDefaults) return false;
    return !same(P[v.id], v.default) || (v.speedScaled && byId.SPEED && !same(P.SPEED, byId.SPEED.default));
  }
  function cssVal(v) {
    const curP = activeParams();
    const val = curP[v.id];
    if (v.control === 'swatch-role' && v.alpha != null && v.alpha < 1) return 'rgb(from ' + val + ' r g b / ' + v.alpha + ')';
    if (v.options) { const o = v.options.find((x) => same(x.value, val)); if (o && o.css != null) return o.css; }
    if (v.cssMap) return v.cssMap[String(val)];
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (v.speedScaled && byId.SPEED) return +(val / (curP.SPEED || 1)).toFixed(4) + (v.unit || '');
    if (v.unit === '×') return String(val);
    return val + (v.unit || '');
  }
  function applyVar(v) {
    if (!v.css) return;
    if (isModified(v)) frameEl.style.setProperty(v.css, cssVal(v));
    else frameEl.style.removeProperty(v.css);
  }
  function flushBinds() {
    if (!bindStyle) { bindStyle = document.createElement('style'); bindStyle.id = 'labBinds'; document.head.appendChild(bindStyle); }
    if (!def) { bindStyle.textContent = ''; return; }
    const scope = '.lab-frame[data-component="' + def.id + '"] ';
    const lines = [];
    vars.filter(isModified).forEach((v) => (v.bind || []).forEach((b) => {
      const sel = b.sel.split(',').map((s) => scope + s.trim()).join(', ');
      lines.push(sel + ' { ' + b.prop + ': ' + b.tpl.split('{v}').join(cssVal(v)) + ' !important; }');
    }));
    bindStyle.textContent = lines.join('\n');
  }
  function applyAll() { vars.forEach(applyVar); flushBinds(); applyHoverCss(); }

  function setValue(id, raw, opts) {
    const v = byId[id];
    if (!v) return;
    const prev = P[id];
    P[id] = coerce(v, raw);
    if (!same(prev, P[id]) && !(opts && opts.noHistory)) Hist.record(id, prev, P[id]);
    if (!logMute && !same(prev, P[id])) Log.change(v, prev, P[id]);
    applyVar(v);
    if (v.interaction === 'hover-css' || (v.interaction === 'hover' && v.control === 'switch')) applyHoverCss();
    if (v.bind || v.master === 'speed') { if (v.master === 'speed') vars.forEach((x) => { if (x.speedScaled) applyVar(x); }); flushBinds(); }
    store.set('values:' + def.id, P);
    writeHash();
    refreshChanged();
    if (!opts || !opts.quiet) syncRow(id);
    if (v.category === 'interact') syncQuick();
  }

  // ---------- undo / redo ----------
  const Hist = (function () {
    let undo = [], redo = [], batch = null, replaying = false;
    function record(id, from, to) {
      if (replaying) return;
      if (batch) { const e = batch.find((x) => x.id === id); if (e) e.to = to; else batch.push({ id, from, to }); return; }
      const top = undo[undo.length - 1], now = Date.now();
      if (top && !top.label && top.items.length === 1 && top.items[0].id === id && now - top.t < 700) { top.items[0].to = to; top.t = now; }
      else undo.push({ items: [{ id, from, to }], t: now });
      if (undo.length > 100) undo.shift();
      redo = [];
      sync();
    }
    function begin() { batch = []; }
    function end(label) {
      const b = batch; batch = null;
      if (b && b.length) { undo.push({ items: b, label, t: 0 }); redo = []; }
      sync();
    }
    function replay(entry, back) {
      replaying = true; logMute = true;
      (back ? entry.items.slice().reverse() : entry.items).forEach((x) => setValue(x.id, back ? x.from : x.to, { noHistory: true }));
      logMute = false; replaying = false;
    }
    function describe(entry, back) {
      if (entry.label) return entry.label + ' (' + entry.items.length + ')';
      const x = entry.items[0], v = byId[x.id];
      return v ? v.label.toLowerCase() + ' ' + fmt(v, back ? x.to : x.from) + ' \u2192 ' + fmt(v, back ? x.from : x.to) : x.id;
    }
    function doUndo() {
      const e = undo.pop();
      if (!e) return false;
      replay(e, true); redo.push(e);
      Log.push('undo ' + describe(e, true));
      announce('Undid ' + describe(e, true));
      sync();
      return true;
    }
    function doRedo() {
      const e = redo.pop();
      if (!e) return false;
      replay(e, false); undo.push(e);
      Log.push('redo ' + describe(e, false));
      announce('Redid ' + describe(e, false));
      sync();
      return true;
    }
    function clear() { undo = []; redo = []; batch = null; sync(); }
    function sync() {
      const u = $('undoBtn');
      if (!u) return;
      const last = undo[undo.length - 1];
      u.disabled = !last;
      u.title = last ? 'Undo ' + describe(last, true) + '  (Ctrl+Z)' : 'Nothing to undo';
      u.setAttribute('aria-label', last ? 'Undo ' + describe(last, true) : 'Undo (nothing to undo)');
    }
    return { record, begin, end, undo: doUndo, redo: doRedo, clear, sync, get size() { return undo.length; }, get redoSize() { return redo.length; } };
  })();
  function resetAll() {
    const ch = changedVars();
    if (!ch.length) return;
    Hist.begin();
    logMute = true;
    ch.forEach((v) => setValue(v.id, v.default));
    logMute = false;
    Hist.end('reset');
    Log.push('reset ' + ch.length + ' change' + (ch.length === 1 ? '' : 's') + ' (undo: \u21ba)');
    announce('Reset ' + ch.length + ' changes. Undo brings them back.');
    toast('Reset ' + ch.length + ' to defaults. Undo (Ctrl+Z) brings them back.');
  }

  // ---------- CSS :hover styles as an interaction control (lab-side, no component code needed) ----------
  function hoverRules() {
    const out = [];
    const walk = (rules) => [...rules].forEach((r) => {
      if (r.cssRules && !r.selectorText) walk(r.cssRules);
      else if (r.selectorText && (r.__labSel || r.selectorText).includes(':hover')) out.push(r);
    });
    document.querySelectorAll('link.lab-css').forEach((l) => { try { if (l.sheet) walk(l.sheet.cssRules); } catch (e) { /* cross-origin */ } });
    return out;
  }
  function applyHoverCss() {
    const curP = activeParams();
    const vFx = vars.find((x) => x.interaction === 'hover-css');
    const vHov = vars.find((x) => x.interaction === 'hover' && x.control === 'switch' && x.source === 'scan');
    if (!vFx && !vHov) return;
    const allow = (vFx ? !!curP[vFx.id] : true) && (vHov ? !!curP[vHov.id] : true);
    hoverRules().forEach((r) => {
      if (!r.__labSel) r.__labSel = r.selectorText;
      r.selectorText = allow ? r.__labSel : r.__labSel.replace(/:hover/g, ':hover:not(*)');
    });
  }
  const interactVars = () => vars.filter((v) => v.category === 'interact');
  function changedVars() { return vars.filter((v) => !same(P[v.id], v.default)); }
  function refreshChanged() {
    const n = changedVars().length;
    const chBtn = $('changedCount');
    chBtn.textContent = previewDefaults ? 'previewing defaults' : (n ? n + ' changed' : '0 changed');
    chBtn.classList.toggle('is-on', !!n);
    chBtn.title = n ? 'Hold to preview defaults (live A/B compare)' : 'No changes from defaults';
    $('copyBtn').disabled = !n;
    $('resetBtn').disabled = !n;
    $('resetBtn').title = n ? 'Reset all ' + n + ' changes to defaults (undoable)' : 'Nothing to reset';
    Log.idle(n);
    document.querySelectorAll('.ctl[data-id]').forEach((row) => {
      const v = byId[row.dataset.id];
      if (v) row.classList.toggle('is-changed', !same(P[v.id], v.default));
    });
  }

  // ---------- palette ----------
  function userPalette() { const p = store.get('userPalette', null); return Array.isArray(p) && p.length >= 4 ? p : null; }
  function activePalette() { return ui.paletteSource === 'user' && userPalette() ? userPalette() : projectPalette; }
  function swatchesFor(v, n) {
    const ranked = S.rankFor(v.role, activePalette());
    const list = [];
    [v.default].concat(ranked).forEach((c) => { c = S.hex(c); if (c && !list.some((x) => same(x, c))) list.push(c); });
    return list.slice(0, n || 6);
  }
  function allPresets() {
    const list = [{ id: 'project', name: 'Defaults', colors: null }].concat(presets);
    const up = userPalette();
    if (up) list.push({ id: 'user', name: 'My palette', colors: S.rolesFrom(up) });
    return list;
  }
  function presetDots(p) {
    if (!p.colors) return vars.filter((v) => v.control === 'swatch-role').slice(0, 4).map((v) => v.default);
    return ['accent', 'text', 'surface', 'muted'].map((r) => p.colors[r]).filter(Boolean);
  }
  function applyPreset(p) {
    Hist.begin();
    logMute = true;
    vars.filter((v) => v.control === 'swatch-role').forEach((v) => {
      const c = p.colors ? p.colors[v.role] || (v.role === 'surface2' ? S.mix(p.colors.surface, '#000', 0.5) : null) : v.default;
      if (c) setValue(v.id, c);
    });
    logMute = false;
    Hist.end('palette ' + p.name.toLowerCase());
    Log.push('palette ' + p.name.toLowerCase());
    toast('Palette: ' + p.name);
  }

  // ---------- component loading ----------
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
      toast('Error in ' + id + '/component.js: ' + e.message, 6000);
      console.error(e);
      return;
    }
    pendingResolve = null;
    if (!d || seq !== loadSeq) { if (!d) toast(id + '/component.js did not call Lab.register({...})', 6000); return; }
    d.id = id;
    d.title = d.title || id;
    d.frames = d.frames || { default: { w: 420, h: 300 } };

    const cssFiles = await Promise.all((d.css || []).map(async (f) => ({ name: f, text: (await fetchText(base + f)) || '' })));
    const markup = d.markup ? await fetchText(base + d.markup) : '';
    let m = null, auto = false, rescanToast = false;
    const sig = hashText(cssFiles.map((f) => f.text).join('\n') + '\0' + (markup || '') + '\0' + jsText);
    const mt = await fetchText(base + 'manifest.json');
    if (mt) { try { m = JSON.parse(mt); } catch (e) { toast('manifest.json has a JSON error (' + e.message + '); using auto-scan.', 6000); } }
    if (!m) {
      const savedAuto = store.get('manifest:' + id, null);
      if (savedAuto && Array.isArray(savedAuto.vars) && savedAuto.sig === sig) m = savedAuto;
      else {
        rescanToast = !!(savedAuto && savedAuto.sig && savedAuto.sig !== sig);
        m = S.analyze({ id, title: d.title, cssFiles, markup: markup || '', js: jsText, legacyParams: d.params, animated: !!d.animated });
        m.sig = sig;
        store.set('manifest:' + id, m);
      }
      m.auto = true;
      auto = true;
    }
    m.vars = (m.vars || []).map(normVar);
    if (seq !== loadSeq) return;

    const tokens = await fetchText('project/tokens.css');
    const palSrc = m.paletteFrom && m.paletteFrom.length ? await Promise.all(m.paletteFrom.map(fetchText)) : cssFiles.map((f) => f.text).concat([tokens]);
    let pal = S.palette(palSrc.filter(Boolean), 16);
    if (pal.length < 4) pal = pal.concat(S.palette([tokens || ''], 16)).filter((c, i, a) => a.indexOf(c) === i);

    if (inst && inst.destroy) { try { inst.destroy(); } catch (e) { /* ignore */ } }
    inst = null;
    scanHovering = false; scanHoverTouch = false; scanKbdPause = false;
    document.querySelectorAll('link.lab-css').forEach((l) => l.remove());
    await Promise.all((d.css || []).map((f) => loadCss(base + f + bust())));
    if (seq !== loadSeq) return;

    def = d; man = m; vars = m.vars; byId = {};
    m.scan = S.interactions({ js: jsText, css: cssFiles.map((f) => f.text).join('\n'), markup: markup || '' });
    Log.clear();
    Hist.clear();
    vars.forEach((v) => { byId[v.id] = v; });
    const ov = featuredOverrides();
    vars.forEach((v) => { if (ov[v.id] !== undefined) v.featured = !!ov[v.id]; });
    if (m.frames) d.frames = Object.assign({}, m.frames);
    d.time = m.time || { cycle: d.cycleParam };
    projectPalette = pal;
    presets = S.presets(pal);

    P = {};
    vars.forEach((v) => { P[v.id] = v.default; });
    const saved = store.get('values:' + id, null);
    const hash = fromHash ? readHash() : {};
    if (saved) vars.forEach((v) => { if (saved[v.id] !== undefined) P[v.id] = coerce(v, saved[v.id]); });
    vars.forEach((v) => { if (hash[v.id] !== undefined && hash[v.id] !== '') P[v.id] = coerce(v, hash[v.id]); });
    offset = hash.o !== undefined ? +hash.o : (d.defaultOffset || 0);
    playing = !!d.animated && hash.o === undefined;

    frameEl.removeAttribute('style');
    frameEl.dataset.component = id;
    frameEl.innerHTML = markup || '';
    applyFrameVars();
    applyAll();
    layoutStage();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    try { inst = d.mount(frameEl, { params: P, manifest: m, time: timeApi }) || {}; } catch (e) { inst = {}; toast('mount() error: ' + e.message, 6000); console.error(e); }

    mode = ui.mode === 'pro' ? 'pro' : 'basic';
    syncHeadTools();
    $('cmpName').textContent = d.title;
    $('cmpName').title = d.title + ' (click to switch component)';
    syncQuick();
    $('labPicker').value = id;
    $('tbPickName').textContent = pickLabel(id);
    $('tbPick').title = 'Component: ' + pickLabel(id);
    $('labTime').classList.toggle('is-hidden', !d.animated);
    TB.refresh();
    syncTime();
    syncSeg($('modeSeg'), modePill, mode, true);
    buildRail();
    navStack = [{ type: 'cat', cat: railCats()[0] ? railCats()[0].id : 'color' }];
    renderPage(0);
    refreshChanged();
    writeHash();
    if (rescanToast) toast('Component files changed — controls re-scanned.', 4200);
    else if (auto) toast('No manifest.json, so the controls were made by auto-scan. Settings › Save to disk keeps them.', 5200);
    if (m.notes && m.notes.length) toast(m.notes.join(' '), 5200);
  }

  // ---------- stage ----------
  function frameKeyFor(view) {
    const keys = Object.keys(def.frames);
    return keys.includes(view) ? view : keys[0];
  }
  function applyFrameVars() {
    if (!def) return;
    const f = def.frames[frameKeyFor(ui.view)];
    frameEl.style.width = f.w + 'px';
    frameEl.style.height = f.h + 'px';
    Object.entries(f.vars || {}).forEach(([k, v]) => frameEl.style.setProperty(k, v));
  }
  function cardWidth() {
    if (ui.dockPos === 'bottom') return Math.min(720, innerWidth - 2 * MARGIN);
    return Math.round(Math.max(320, Math.min(340, innerWidth * 0.22))) + RAIL_W;
  }
  function cardMaxH() { return ui.dockPos === 'bottom' ? Math.round(innerHeight * 0.5) : innerHeight - 2 * MARGIN; }
  function freeRect() {
    const W = innerWidth, H = innerHeight;
    const r = { x: 0, y: 0, w: W, h: H };
    if (!dockOpen) return r;
    const [row, col] = (ui.dockPos === 'bottom' ? 'bottom-center' : ui.anchor).split('-');
    const cw = cardWidth() + 2 * MARGIN, ch = cardMaxH() + 2 * MARGIN;
    if (ui.dockPos === 'bottom' || col === 'center') {
      if (row === 'bottom') r.h = H - ch;
      else if (row === 'top') { r.y = ch; r.h = H - ch; }
      return r;
    }
    if (col === 'right') r.w = W - cw;
    else if (col === 'left') { r.x = cw; r.w = W - cw; }
    return r;
  }
  function layoutStage() {
    if (!def) return;
    const r = freeRect();
    const topPad = 20, bottomPad = r.y + r.h >= innerHeight ? 36 : 16, side = 24;
    const box = { x: r.x + side, y: r.y + topPad, w: Math.max(80, r.w - 2 * side), h: Math.max(80, r.h - topPad - bottomPad) };
    const fit = $('stageFit');
    Object.assign(fit.style, { left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px' });
    const view = VIEWS.find((x) => x.id === ui.view) || VIEWS[0];
    const f = def.frames[frameKeyFor(ui.view)];
    const bw = view.w || f.w, bh = view.h || f.h;
    const s = Math.min(1, box.w / bw, box.h / bh);
    const scaler = $('stageScaler');
    scaler.style.width = bw + 'px';
    scaler.style.height = bh + 'px';
    scaler.style.transform = 'translate(-50%, -50%) scale(' + s.toFixed(4) + ')';
    $('vpBox').classList.toggle('is-on', !!view.w);
    $('vpTag').textContent = view.w ? view.w + ' × ' + view.h + ' viewport' : '';
    $('stageNote').textContent = def.title + '  ·  frame ' + f.w + ' × ' + f.h + (view.w ? '  in ' + view.label : '') + '  ·  ' + Math.round(s * 100) + '%';
  }

  // ---------- time ----------
  const wrap = (v) => ((v % 1) + 1) % 1;
  const timeApi = {
    nudge(d) { offset += d; },
    get offset() { return offset; },
    set offset(v) { offset = v; },
    get playing() { return playing; }
  };
  let rateNow = 1;
  function syncTime() {
    $('labPlay').innerHTML = svg(playing ? 'pause' : 'play');
    $('labPlay').setAttribute('aria-label', playing ? 'Pause' : 'Play');
    $('labScrub').value = wrap(offset);
  }
  function tick(t) {
    const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
    lastT = t;
    if (def && inst && inst.render) {
      const curP = activeParams();
      if (playing && def.animated) {
        const tm = def.time || {};
        const cyc = tm.cycle && curP[tm.cycle] ? curP[tm.cycle] : 10;
        const spd = tm.speed && curP[tm.speed] !== undefined ? curP[tm.speed] : 1;
        const dir = tm.direction && curP[tm.direction] !== undefined ? Number(curP[tm.direction]) || 1 : 1;
        let k = 1;
        if (inst.rate) { try { k = Number(inst.rate(curP, dt)); if (!isFinite(k)) k = 1; } catch (e) { k = 1; } }
        if (byId.HOVER && byId.HOVER.source === 'scan' && scanHovering && !(scanHoverTouch && byId.TOUCH && curP.TOUCH === 'ignore')) {
          const hr = { play: 1, pause: 0, slow: 0.35, fast: 1.8 }[curP.HOVER];
          if (hr !== undefined) k *= hr;
        }
        if (byId.KEY_PAUSE && byId.KEY_PAUSE.source === 'scan' && curP.KEY_PAUSE && scanKbdPause) k = 0;
        rateNow = k;
        offset += (dt / Math.max(0.1, cyc)) * spd * dir * k;
      }
      if (def.animated) $('labScrub').value = wrap(offset);
      try { inst.render(curP, wrap(offset)); } catch (e) { toast('render error: ' + e.message, 6000); playing = false; syncTime(); console.error(e); }
    }
    requestAnimationFrame(tick);
  }

  // ---------- segmented control (velocity pill) ----------
  function buildSeg(host, items, value, onPick, opts) {
    host.innerHTML = '';
    host.classList.add('seg');
    const pill = el('span', 'seg-pill');
    host.appendChild(pill);
    const vp = new M.VelocityPill(pill, 'x');
    host._pill = vp;
    items.forEach((it) => {
      const b = el('button', 'seg-btn', esc(it.label));
      b.type = 'button';
      b.dataset.value = String(it.value);
      b.setAttribute('role', 'radio');
      if (it.disabled) { b.disabled = true; if (it.hint) b.title = it.hint; }
      b.addEventListener('click', () => {
        if (b.disabled) return;
        syncSeg(host, vp, it.value);
        onPick(it.value);
      });
      host.appendChild(b);
    });
    if (opts && opts.equal) host.style.gridTemplateColumns = 'repeat(' + items.length + ', minmax(0, 1fr))';
    host.dataset.value = String(value);
    requestAnimationFrame(() => syncSeg(host, vp, host.dataset.value, true));
    return vp;
  }
  function syncSeg(host, vp, value, instant) {
    if (!host) return;
    vp = vp || host._pill;
    host.dataset.value = String(value);
    let hit = null;
    host.querySelectorAll('.seg-btn').forEach((b) => {
      const on = same(b.dataset.value, value);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      if (on) hit = b;
    });
    if (vp) vp.moveTo(hit, instant || !host.offsetWidth);
  }

  // ---------- dock: open / close morph ----------
  function applyDockLayout() {
    dock.dataset.anchor = ui.anchor;
    dock.dataset.pos = ui.dockPos;
    dock.style.setProperty('--card-w', cardWidth() + 'px');
    dock.style.setProperty('--card-maxh', cardMaxH() + 'px');
  }
  function openDock(how) {
    clearTimeout(leaveTimer);
    const fromKey = document.activeElement === $('dockTrigger');
    if (dockOpen) { if (how !== 'hover') pinned = true; return; }
    dockOpen = true;
    pinned = how !== 'hover';
    ui.open = true; saveUi();
    applyDockLayout();
    dock.getAnimations().forEach((a) => a.cancel());
    card.querySelector('.card-main').getAnimations().forEach((a) => a.cancel());
    $('rail').getAnimations().forEach((a) => a.cancel());
    dock.dataset.state = 'open';
    dock.classList.remove('is-closing');
    $('dockTrigger').setAttribute('aria-expanded', 'true');
    fitPages(null, false);
    syncRail(true);
    syncSeg($('modeSeg'), modePill, mode, true);
    if (fromKey) {
      requestAnimationFrame(() => {
        const target = document.querySelector('#rail .rail-btn.is-active') || $('dockClose');
        if (target) target.focus({ preventScroll: true });
      });
    }
    const to = card.getBoundingClientRect();
    layoutStage();
    const lv = M.level();
    if (lv !== 'off') {
      dock.classList.add('is-morphing');
      const a = dock.animate([
        { width: '52px', height: '52px', borderRadius: '26px' },
        { width: to.width + 'px', height: to.height + 'px', borderRadius: '22px' }
      ], { duration: lv === 'full' ? 300 : 150, easing: M.settle });
      a.finished.catch(() => {}).then(() => { if (dockOpen) dock.classList.remove('is-morphing'); });
      M.contentIn(card.querySelector('.card-main'), 60);
      M.contentIn($('rail'), 30);
      M.travel($('dockTrigger'), $('dockClose'), svg('sliders'));
    }
  }
  function closeDock() {
    if (!dockOpen) return;
    Arc.close(true);
    Pop.hide();
    const from = card.getBoundingClientRect();
    dockOpen = false; pinned = false;
    ui.open = false; saveUi();
    layoutStage();
    const lv = M.level();
    const finish = () => {
      if (dockOpen) return;
      dock.dataset.state = 'closed';
      dock.classList.remove('is-morphing', 'is-closing');
      card.querySelector('.card-main').getAnimations().forEach((x) => x.cancel());
      $('rail').getAnimations().forEach((x) => x.cancel());
      $('dockTrigger').setAttribute('aria-expanded', 'false');
      M.contentIn($('dockTrigger').firstChild);
    };
    if (lv === 'off') { finish(); return; }
    dock.classList.add('is-morphing', 'is-closing');
    M.travel($('dockClose'), $('dockTrigger'), svg('close'), { rotate: -90 });
    const a = dock.animate([
      { width: from.width + 'px', height: from.height + 'px', borderRadius: '22px' },
      { width: '52px', height: '52px', borderRadius: '26px' }
    ], { duration: lv === 'full' ? 280 : 150, easing: M.settle });
    M.contentOut(card.querySelector('.card-main'));
    M.contentOut($('rail'));
    a.finished.catch(() => {}).then(finish);
  }

  // ---------- rail ----------
  function basicVars() {
    let f = vars.filter((v) => v.featured);
    if (!f.length) f = vars.filter((v) => !v.advanced);
    return f.slice(0, BASIC_CAP);
  }
  function hasCat(id) { return vars.some((v) => v.category === id); }
  function orderedCats() {
    const ord = Array.isArray(ui.railOrder) ? ui.railOrder : [];
    const idx = (id) => { const i = ord.indexOf(id); return i < 0 ? 100 + CAT_IDS.indexOf(id) : i; };
    return CATS.slice().sort((a, b) => idx(a.id) - idx(b.id));
  }
  const railHidden = () => (Array.isArray(ui.railHidden) ? ui.railHidden : []);
  function visibleCats() {
    if (hasPro('accordion')) return orderedCats().filter((c) => c.id !== 'interact' || hasCat('interact'));
    const f = basicVars();
    return orderedCats().filter((c) => f.some((v) => v.category === c.id));
  }
  // Rail icons: in Basic mode ignore railHidden() so hidden categories cannot lock out Basic controls.
  function railCats() {
    const vc = visibleCats();
    if (!hasPro('railCustomize')) return vc;
    const shown = vc.filter((c) => !railHidden().includes(c.id));
    return shown.length ? shown : vc;
  }
  function buildRail() {
    const tabs = $('railTabs');
    tabs.innerHTML = '<span class="rail-pill"></span>';
    railCats().forEach((c) => {
      const b = el('button', 'rail-btn', svg(c.icon) + '<span class="rail-tip">' + c.label + '</span>');
      b.type = 'button';
      b.dataset.cat = c.id;
      b.setAttribute('aria-label', c.label);
      b.addEventListener('click', () => { openDock('click'); go({ type: 'cat', cat: c.id }); });
      tabs.appendChild(b);
    });
    railPill = new M.VelocityPill(tabs.querySelector('.rail-pill'), 'y');
    const tools = $('railTools');
    tools.innerHTML = '';
    const tool = (key, html, label, fn) => {
      const b = el('button', 'rail-btn rail-tool', html + '<span class="rail-tip">' + label + '</span>');
      b.type = 'button'; b.dataset.tool = key; b.setAttribute('aria-label', label);
      b.addEventListener('click', fn);
      tools.appendChild(b);
      return b;
    };
    orderedTools().filter((t) => !toolHidden().includes(t.id)).forEach((t) => {
      if (t.id === 'new') tool('new', svg('plus'), 'New component', () => { openDock('click'); startNew(); });
      if (t.id === 'toolbar') TB.railButton(tool('toolbar', svg('toolbar'), 'Stage toolbar (click, or flick toward the stage)', () => TB.railClick()));
    });
    tool('settings', svg('gear'), 'Settings', () => { openDock('click'); go({ type: 'settings' }); });
    requestAnimationFrame(() => syncRail(true));
  }
  function railKey(spec) {
    if (spec.type === 'cat') return spec.cat;
    if (spec.type === 'role') return byId[spec.id] ? byId[spec.id].category : 'color';
    if (spec.type === 'user') return 'settings';
    return spec.type;
  }
  function railIndex(spec) {
    const order = railCats().map((c) => c.id).concat(orderedTools().filter((t) => !toolHidden().includes(t.id)).map((t) => t.id), ['settings']);
    const i = order.indexOf(railKey(spec));
    return i < 0 ? 0 : i;
  }
  function syncRail(instant) {
    const k = railKey(navStack[0]);
    let hit = null;
    document.querySelectorAll('#rail .rail-btn').forEach((b) => {
      const on = (b.dataset.cat || b.dataset.tool) === k;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      if (on && b.dataset.cat) hit = b;
    });
    if (railPill) railPill.moveTo(hit, instant || !dockOpen);
  }
  function flashTip(key) {
    const b = document.querySelector('#rail .rail-btn[data-cat="' + key + '"], #rail .rail-btn[data-tool="' + key + '"]');
    if (!b) return;
    b.classList.add('is-flash');
    clearTimeout(b._f);
    b._f = setTimeout(() => b.classList.remove('is-flash'), 1100);
  }
  function setMode(m) {
    if (m === mode) return;
    mode = m;
    ui.mode = m; saveUi();
    syncHeadTools();
    syncSeg($('modeSeg'), modePill, mode);
    buildRail();
    const cur = navStack[0];
    if (cur.type === 'cat' && !visibleCats().some((c) => c.id === cur.cat)) navStack = [{ type: 'cat', cat: railCats()[0].id }];
    else navStack = [cur];
    renderPage(0);
    toast(mode === 'pro' ? 'Pro: every control. Star one to feature it in Basic.' : 'Basic: the ' + basicVars().length + ' featured controls.');
  }

  // ---------- navigation ----------
  const top = () => navStack[navStack.length - 1];
  const sameSpec = (a, b) => a.type === b.type && a.cat === b.cat && a.id === b.id && a.step === b.step;
  function go(spec) {
    const cur = navStack[0];
    const proCat = hasPro('accordion') && spec.type === 'cat';
    if (proCat && navStack.length === 1 && cur.type === 'cat' && Acc.list()) {
      navStack[0] = spec;
      Acc.focus(spec.cat);
      syncRail();
      flashTip(spec.cat);
      return;
    }
    if (navStack.length === 1 && sameSpec(cur, spec)) { flashTip(railKey(spec)); return; }
    const dir = railIndex(spec) >= railIndex(cur) ? 1 : -1;
    navStack = [spec];
    renderPage(dir);
    if (proCat) Acc.focus(spec.cat, true);
    flashTip(railKey(spec));
  }
  function push(spec) { navStack.push(spec); renderPage(1); }
  function back() { if (navStack.length > 1) { navStack.pop(); renderPage(-1); } }
  function replaceTop(spec, dir) { navStack[navStack.length - 1] = spec; renderPage(dir); }

  function footCollapsed() { return top().type !== 'cat'; }
  function availH() {
    const head = $('cardHead').offsetHeight;
    const foot = footCollapsed() ? 0 : $('footInner').scrollHeight;
    return Math.max(120, cardMaxH() - head - foot - 2);
  }
  let logH = 0;
  function setFootCompact(on) {
    const foot = $('cardFoot');
    if (foot.classList.contains('is-compact') === on) return;
    foot.classList.toggle('is-compact', on);
    $('footLog').setAttribute('aria-hidden', 'true');
    if (!on && dockOpen && M.level() === 'full') $('footLog').animate([{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: M.easeOut });
  }
  function fitPages(fromH, animate) {
    const page = pagesEl.querySelector('.page:not(.is-leaving)');
    if (!page) return;
    const inner = page.querySelector('.page-inner');
    const natural = inner.offsetHeight;
    inner._h = natural;
    if (footCollapsed()) setFootCompact(false);
    else {
      const compactNow = $('cardFoot').classList.contains('is-compact');
      if (!compactNow && $('footLog').offsetHeight) logH = $('footLog').offsetHeight + 6;
      const footFull = $('footInner').scrollHeight + (compactNow ? (logH || 36) : 0);
      setFootCompact(natural > cardMaxH() - $('cardHead').offsetHeight - footFull - 2 + 0.5);
    }
    const av = availH();
    const to = Math.min(natural, av);
    page.classList.toggle('is-scroll', natural > av + 0.5);
    if (animate && dockOpen && fromH != null) M.height(pagesEl, fromH, to);
    else { pagesEl.getAnimations().forEach((a) => { if (a.__height) a.cancel(); }); pagesEl.style.height = to + 'px'; }
  }

  function pageTitleFor(spec) {
    if (spec.type === 'cat' && hasPro('accordion')) return 'All controls';
    if (spec.type === 'cat') { const c = CATS.find((x) => x.id === spec.cat); return c ? c.label : spec.cat; }
    if (spec.type === 'role') return byId[spec.id] ? byId[spec.id].label : 'Colour';
    if (spec.type === 'settings') return 'Settings';
    if (spec.type === 'user') return 'My palette';
    if (spec.type === 'new') return 'New component';
    return '';
  }
  function renderPage(dir) {
    if (!def) return;
    const spec = top();
    Arc.close(true);
    const old = pagesEl.querySelector('.page:not(.is-leaving)');
    const fromH = pagesEl.offsetHeight;
    const page = el('div', 'page');
    const inner = el('div', 'page-inner');
    page.appendChild(inner);
    const meta = buildPage(spec, inner);

    const title = $('pageTitle');
    const newTitle = pageTitleFor(spec);
    if (title.textContent !== newTitle) { title.textContent = newTitle; M.contentIn(title); }
    $('pageMeta').textContent = meta || '';
    $('backBtn').classList.toggle('is-on', navStack.length > 1);
    $('backBtn').tabIndex = navStack.length > 1 ? 0 : -1;
    const fc = footCollapsed();
    $('cardFoot').classList.toggle('is-collapsed', fc);
    $('cardFoot').inert = fc;
    $('cardHead').classList.toggle('is-new', spec.type === 'new');

    pagesEl.appendChild(page);
    if (old) {
      if (dir && dockOpen && M.level() !== 'off') {
        old.classList.add('is-leaving');
        old.style.top = -old.scrollTop + 'px';
        M.slide(old, page, dir).then(() => old.remove());
      } else old.remove();
    }
    if (pageRO) pageRO.disconnect();
    pageRO = new ResizeObserver(() => {
      if (!page.isConnected || page.classList.contains('is-leaving')) return;
      if (Math.abs(inner.offsetHeight - (inner._h || 0)) < 1) return;
      fitPages(null, false);
    });
    pageRO.observe(inner);
    fitPages(fromH, !!old && !!dir);
    syncRail(!dockOpen);
    refreshChanged();
    requestAnimationFrame(() => page.querySelectorAll('.seg').forEach((s) => syncSeg(s, null, s.dataset.value, true)));
    if (spec.type === 'new') requestAnimationFrame(() => syncTiles(page, true));
  }

  function buildPage(spec, inner) {
    if (spec.type === 'cat' && hasPro('accordion')) return Acc.build(spec.cat, inner);
    if (spec.type === 'cat') return buildCat(spec.cat, inner);
    if (spec.type === 'role') return buildRole(spec.id, inner);
    if (spec.type === 'settings') return buildSettings(inner);
    if (spec.type === 'user') return buildUser(inner);
    if (spec.type === 'new') return buildNew(spec, inner);
    return '';
  }

  // ---------- Basic category page ----------
  function buildCat(cat, inner) {
    const list = basicVars().filter((v) => v.category === cat);
    if (cat === 'color' && vars.some((v) => v.control === 'swatch-role')) inner.appendChild(buildPresets());
    list.forEach((v) => inner.appendChild(ctlRow(v)));
    if (!list.length) inner.appendChild(el('p', 'empty', 'Nothing in this category for this component.'));
    return basicVars().length + ' of ' + vars.length + ' controls';
  }

  // A disclosure (Advanced / More). The body grows on the soft spring (CSS grid rows).
  function foldEl(label, n, fill, cls) {
    const box = el('div', 'adv' + (cls ? ' ' + cls : ''));
    const btn = el('button', 'adv-btn', '<span>' + esc(label) + '</span><span class="adv-n">' + n + '</span>' + svg('chev', 'adv-chev'));
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    const body = el('div', 'adv-body');
    const bodyIn = el('div', 'adv-inner');
    fill(bodyIn);
    body.appendChild(bodyIn);
    body.setAttribute('inert', '');
    btn.addEventListener('click', () => {
      const on = !box.classList.contains('is-open');
      box.classList.toggle('is-open', on);
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) body.removeAttribute('inert'); else body.setAttribute('inert', '');
      if (on) requestAnimationFrame(() => bodyIn.querySelectorAll('.seg').forEach((sg) => syncSeg(sg, null, sg.dataset.value, true)));
    });
    box.append(btn, body);
    return box;
  }

  // ---------- Pro section layouts: mini cards per sub-group ----------
  function autoGroup(v) {
    const id = v.id;
    switch (v.category) {
      case 'color':
        if (/GLOW|SHADOW/.test(id) || v.role === 'glow') return 'Glow';
        if (['text', 'muted', 'danger'].includes(v.role) || /TEXT|LABEL|TITLE|INK/.test(id)) return 'Text';
        if (['surface', 'surface2', 'border'].includes(v.role)) return 'Card';
        return 'Accent';
      case 'interact': return ['touch', 'key'].includes(v.interaction) ? 'Touch & keys' : 'Pointer';
      case 'surface':
        if (v.control === 'switch') return 'Toggles';
        if (/GLOW|BLUR|SHADOW/.test(id)) return 'Effects';
        return 'Opacity';
      case 'type': return /WEIGHT|TRACK|FAMILY|CASE/.test(id) ? 'Style' : 'Size';
      case 'motion': return /EAS|CURVE|DIRECTION/.test(id) ? 'Curve' : 'Movement';
      case 'rate': return v.master || /SPEED|TEMPO|INTENSITY/.test(id) ? 'Tempo' : 'Timing';
      default:
        if (/RADIUS|ROUND/.test(id)) return 'Radius';
        if (/PAD|GAP|MARGIN|TRAVEL|SPACE/.test(id)) return 'Spacing';
        if (/^N$|COUNT|W$|WIDTH|H$|HEIGHT|SIZE/.test(id)) return 'Size';
        return 'Shape';
    }
  }
  const sigFirst = (items) => items.filter((v) => v.signature).concat(items.filter((v) => !v.signature));
  function groupsFor(list, cat) {
    const order = (man.groups && man.groups[cat]) || [];
    const map = new Map();
    list.forEach((v) => { const g = v.group || autoGroup(v); if (!map.has(g)) map.set(g, []); map.get(g).push(v); });
    const gs = [...map.entries()].map(([name, items], i) => ({ name, items: sigFirst(items), i }));
    const rank = (g) => (g.items.some((v) => v.signature && !v.advanced) ? -1000 : 0) + (order.includes(g.name) ? order.indexOf(g.name) : 500 + g.i);
    return gs.sort((a, b) => rank(a) - rank(b));
  }
  function miniCard(g, bare, inAdv) {
    const lead = inAdv ? g.items : g.items.filter((v) => !v.advanced);
    const more = inAdv ? [] : g.items.filter((v) => v.advanced);
    const card = el('div', 'mini' + (bare ? ' is-bare' : ''));
    card.dataset.group = g.name;
    if (!bare) card.appendChild(el('div', 'mini-head', '<span>' + esc(g.name) + '</span>'));
    const body = el('div', 'mini-body' + (lead.length > 1 && lead.every((v) => v.control === 'radial') ? ' is-dials' : ''));
    lead.forEach((v) => body.appendChild(ctlRow(v, { compact: !bare })));
    card.appendChild(body);
    if (more.length) card.appendChild(foldEl('More', more.length, (b) => more.forEach((v) => b.appendChild(ctlRow(v, { compact: !bare }))), 'mini-more'));
    return card;
  }
  function fillPro(cat, inner) {
    const all = vars.filter((v) => v.category === cat);
    if (!all.length) { inner.appendChild(el('p', 'empty', 'No ' + (CATS.find((c) => c.id === cat) || {}).label + ' controls for this component.')); return { n: 0, adv: 0 }; }
    if (cat === 'color' && vars.some((v) => v.control === 'swatch-role')) inner.appendChild(buildPresets());
    const groups = groupsFor(all, cat);
    const front = groups.filter((g) => g.items.some((v) => !v.advanced));
    const back = groups.filter((g) => g.items.every((v) => v.advanced));
    const bare = front.length === 1 && front[0].items.length <= 3;
    front.forEach((g) => inner.appendChild(miniCard(g, bare)));
    const advN = all.filter((v) => v.advanced).length;
    if (back.length) inner.appendChild(foldEl('Advanced', back.reduce((a, g) => a + g.items.length, 0), (b) => back.forEach((g) => b.appendChild(miniCard(g, false, true))), 'adv-sec'));
    return { n: all.length, adv: advN };
  }
  function proStrip() {
    const adv = vars.filter((v) => v.advanced).length, ia = interactVars().length;
    const s = el('div', 'pro-strip');
    s.innerHTML = '<span class="pro-tag">Pro adds</span>'
      + '<span title="Every control, not just the ' + basicVars().length + ' featured">all ' + vars.length + '</span>'
      + (adv ? '<span title="Inner Advanced and More folds">' + adv + ' advanced</span>' : '')
      + (ia ? '<span class="is-ia" title="Cursor / touch / keyboard behaviour">' + svg('interact') + ia + ' interaction</span>' : '')
      + '<span title="Star or unstar controls to curate the 8 Basic controls">\u2605 curate Basic</span>';
    return s;
  }
  function buildSnapBar() {
    if (!hasPro('snapshots') || !def) return null;
    const bar = el('div', 'snap-bar');
    bar.appendChild(el('span', 'snap-tag', 'Snapshots'));
    const paint = () => {
      const snaps = store.get('snaps:' + def.id, {});
      bar.querySelectorAll('.snap-slot').forEach((b) => {
        const k = b.dataset.slot, s = snaps[k];
        b.classList.toggle('is-filled', !!s);
        b.title = s
          ? 'Slot ' + k + ' saved · Click to load · Shift+Click to overwrite · Alt+Click or Right-click to clear'
          : 'Slot ' + k + ' empty · Click to save current look';
      });
    };
    ['A', 'B', 'C'].forEach((k) => {
      const b = el('button', 'snap-slot', k);
      b.type = 'button';
      b.dataset.slot = k;
      b.addEventListener('click', (e) => {
        const snaps = store.get('snaps:' + def.id, {});
        if (e.altKey) {
          delete snaps[k];
          store.set('snaps:' + def.id, snaps);
          paint();
          Log.push('snapshot ' + k + ' cleared');
          toast('Cleared snapshot ' + k + '.');
          return;
        }
        if (!snaps[k] || e.shiftKey) {
          snaps[k] = Object.assign({}, P);
          store.set('snaps:' + def.id, snaps);
          paint();
          Log.push('saved snapshot ' + k);
          toast('Saved current look to snapshot ' + k + '.');
          return;
        }
        Hist.begin();
        logMute = true;
        vars.forEach((v) => { if (snaps[k][v.id] !== undefined) setValue(v.id, snaps[k][v.id]); });
        logMute = false;
        Hist.end('snapshot ' + k);
        Log.push('loaded snapshot ' + k);
        toast('Loaded snapshot ' + k + ' (Ctrl+Z undoes).');
      });
      b.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const snaps = store.get('snaps:' + def.id, {});
        if (!snaps[k]) return;
        delete snaps[k];
        store.set('snaps:' + def.id, snaps);
        paint();
        Log.push('snapshot ' + k + ' cleared');
        toast('Cleared snapshot ' + k + '.');
      });
      bar.appendChild(b);
    });
    paint();
    return bar;
  }

  // ---------- Pro: accordion sections in one scrolling panel ----------
  const VARIANTS = [
    { id: 'A', label: 'Slide', hint: 'Height slide with fade' },
    { id: 'B', label: 'Spring', hint: 'Default. Spring morph: header pinned, body grows from it on a soft spring and pushes the sections below' },
    { id: 'C', label: 'Stagger', hint: 'Rows reveal one after another' },
    { id: 'D', label: 'Exclusive', hint: 'One open at a time; the others shrink to chips' }
  ];
  const COLLAPSE = [
    { id: 'remember', label: 'Remember', icon: 'remember', hint: 'Reopen what was open last time' },
    { id: 'open', label: 'All open', icon: 'expand', hint: 'Every section starts open' },
    { id: 'closed', label: 'All closed', icon: 'collapse', hint: 'Every section starts closed' }
  ];
  const Acc = (function () {
    let spyLock = 0;
    const list = () => pagesEl.querySelector('.page:not(.is-leaving) .acc-list');
    const secs = () => { const l = list(); return l ? [...l.querySelectorAll(':scope > .acc')] : []; };
    const sec = (cat) => { const l = list(); return l ? l.querySelector('.acc[data-cat="' + cat + '"]') : null; };
    const variant = () => (VARIANTS.some((x) => x.id === ui.accVariant) ? ui.accVariant : 'B');
    const openCats = () => secs().filter((x) => x.classList.contains('is-open')).map((x) => x.dataset.cat);
    function persist() { if (def && ui.accCollapse === 'remember') store.set('accOpen:' + def.id, openCats()); }
    function initialOpen(focusCat, cats) {
      const nonEmpty = cats.filter((c) => c.n).map((c) => c.id);
      let open;
      if (ui.accCollapse === 'open') open = nonEmpty.slice();
      else if (ui.accCollapse === 'closed') open = [];
      else { const st = store.get('accOpen:' + def.id, null); open = Array.isArray(st) ? st : [focusCat]; }
      if (variant() === 'D' && open.length > 1) open = [open.includes(focusCat) ? focusCat : open[0]];
      return open;
    }
    function build(focusCat, inner) {
      const wrapEl = el('div', 'acc-list');
      wrapEl.dataset.variant = variant();
      wrapEl.appendChild(proStrip());
      const snapBar = buildSnapBar();
      if (snapBar) wrapEl.appendChild(snapBar);
      const cats = visibleCats().map((c) => {
        const box = el('section', 'acc');
        box.dataset.cat = c.id;
        const head = el('button', 'acc-head', svg(c.icon) + '<span class="acc-label">' + esc(c.label) + '</span><span class="acc-n"></span>' + svg('chev', 'acc-chev'));
        head.type = 'button';
        head.id = 'acc-h-' + c.id;
        head.setAttribute('aria-controls', 'acc-b-' + c.id);
        head.title = c.label;
        const body = el('div', 'acc-body');
        body.id = 'acc-b-' + c.id;
        body.setAttribute('role', 'region');
        body.setAttribute('aria-labelledby', head.id);
        const bin = el('div', 'acc-inner');
        const r = fillPro(c.id, bin);
        head.querySelector('.acc-n').textContent = r.n;
        if (c.id === 'interact') box.classList.add('acc-interact');
        body.appendChild(bin);
        box.append(head, body);
        head.addEventListener('click', () => toggle(c.id));
        wrapEl.appendChild(box);
        return { id: c.id, n: r.n, box };
      });
      const open = initialOpen(focusCat, cats);
      cats.forEach((c) => setState(c.box, open.includes(c.id)));
      inner.appendChild(wrapEl);
      inner.classList.add('is-acc');
      requestAnimationFrame(() => {
        const page = wrapEl.closest('.page');
        if (page) page.addEventListener('scroll', () => spy(page), { passive: true });
      });
      const total = cats.reduce((a, c) => a + c.n, 0);
      return total + ' controls · ' + cats.filter((c) => c.n).length + ' sections';
    }
    function setState(box, on) {
      box.classList.toggle('is-open', on);
      const head = box.querySelector('.acc-head'), body = box.querySelector('.acc-body');
      head.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) body.removeAttribute('inert'); else body.setAttribute('inert', '');
    }
    function cancelAll(box) {
      box.querySelectorAll('.acc-body, .acc-inner, .acc-inner > *').forEach((n) => n.getAnimations().forEach((a) => { if (!a.__keep) a.cancel(); }));
      box.getAnimations().forEach((a) => a.cancel());
    }
    function animate(box, on, fromH) {
      const body = box.querySelector('.acc-body'), bin = body.firstElementChild;
      const lv = M.level(), v = variant();
      if (lv === 'off') return;
      const toH = on ? bin.offsetHeight : 0;
      if (lv === 'fade') {
        if (on) bin.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'linear' });
        return;
      }
      const H = (dur, ease) => body.animate([{ height: fromH + 'px' }, { height: toH + 'px' }], { duration: dur, easing: ease });
      if (v === 'A') {
        H(on ? 300 : 240, M.settle);
        bin.animate(on ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }], { duration: on ? 260 : 200, easing: M.easeOut });
      } else if (v === 'B') {
        const dist = Math.abs(toH - fromH);
        const dur = Math.round(Math.min(620, Math.max(420, 380 + dist * 0.45)));
        if (on) {
          H(dur, M.springSoft);
          bin.animate([{ opacity: 0, transform: 'translateY(-10px) scale(0.965)', offset: 0 }, { opacity: 1, offset: 0.35 }, { opacity: 1, transform: 'none' }], { duration: dur - 40, easing: M.springSoft });
        } else {
          H(Math.round(Math.min(320, 220 + dist * 0.12)), M.settle);
          bin.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px) scale(0.98)' }], { duration: 170, easing: M.easeOut });
        }
      } else if (v === 'C') {
        H(on ? 220 : 180, M.settle);
        if (on) [...bin.children].forEach((row, i) => row.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 280, delay: 60 + i * 45, easing: M.easeOut, fill: 'backwards' }));
        else bin.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: M.easeOut });
      } else {
        H(on ? 420 : 220, on ? M.spring : M.settle);
        if (on) bin.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: 60, easing: M.easeOut, fill: 'backwards' });
      }
    }
    function apply(want, opts) {
      const all = secs();
      if (!all.length) return;
      const flip = variant() === 'D' && M.level() === 'full';
      const before = flip ? all.map((b) => b.getBoundingClientRect()) : null;
      const changes = [];
      all.forEach((box) => {
        const on = want.includes(box.dataset.cat);
        if (on === box.classList.contains('is-open')) return;
        const fromH = box.querySelector('.acc-body').getBoundingClientRect().height;
        cancelAll(box);
        setState(box, on);
        changes.push([box, on, fromH]);
      });
      if (!(opts && opts.instant)) changes.forEach(([b, on, h]) => animate(b, on, h));
      if (flip) all.forEach((b, i) => {
        const a = b.getBoundingClientRect(), o = before[i];
        const dx = o.left - a.left, dy = o.top - a.top, sx = o.width / (a.width || 1);
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01) return;
        b.animate([{ transformOrigin: '0 0', transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transformOrigin: '0 0', transform: 'none' }], { duration: 420, easing: M.spring });
      });
      list().querySelectorAll('.acc.is-open .seg').forEach((sg) => syncSeg(sg, null, sg.dataset.value, true));
      persist();
    }
    function toggle(cat, force) {
      const box = sec(cat);
      if (!box) return;
      const on = force != null ? force : !box.classList.contains('is-open');
      let want = openCats().filter((c) => c !== cat);
      if (on) want = variant() === 'D' ? [cat] : want.concat([cat]);
      apply(want);
      if (on) { navStack[0] = { type: 'cat', cat }; syncRail(); }
    }
    function scrollTo(cat, instant) {
      const box = sec(cat);
      const page = box && box.closest('.page');
      if (!page) return;
      spyLock = Date.now() + 700;
      const go2 = (beh) => page.scrollTo({ top: Math.max(0, box.offsetTop - 2), behavior: beh });
      go2(instant || M.level() !== 'full' ? 'auto' : 'smooth');
      setTimeout(() => { spyLock = Date.now() + 300; go2('auto'); }, M.level() === 'off' ? 0 : 560);
    }
    function focus(cat, instant) {
      const box = sec(cat);
      if (!box) return;
      if (!box.classList.contains('is-open')) toggle(cat, true);
      scrollTo(cat, instant);
    }
    function spy(page) {
      if (Date.now() < spyLock || navStack.length !== 1 || navStack[0].type !== 'cat') return;
      const all = secs();
      let hit = all[0];
      all.forEach((b) => { if (b.offsetTop - page.scrollTop <= 24) hit = b; });
      if (hit && hit.dataset.cat !== navStack[0].cat) { navStack[0] = { type: 'cat', cat: hit.dataset.cat }; syncRail(); }
    }
    function setVariant(id) {
      ui.accVariant = id; saveUi();
      const l = list();
      if (l) {
        l.dataset.variant = id;
        if (id === 'D') { const o = openCats(); if (o.length > 1) apply([o.includes(navStack[0].cat) ? navStack[0].cat : o[0]]); }
      }
      const vv = VARIANTS.find((x) => x.id === id);
      Log.push('motion ' + id + ' ' + vv.label.toLowerCase());
      syncPop();
    }
    function setCollapse(id) {
      ui.accCollapse = id; saveUi();
      const all = secs().filter((b) => +b.querySelector('.acc-n').textContent > 0).map((b) => b.dataset.cat);
      if (id === 'open') apply(variant() === 'D' ? [navStack[0].cat] : all);
      else if (id === 'closed') apply([]);
      else persist();
      Log.push('sections ' + COLLAPSE.find((x) => x.id === id).label.toLowerCase());
      syncPop();
    }
    return { build, toggle, focus, list, setVariant, setCollapse, openCats, variant };
  })();

  // ---------- 3-dot quick menu (Pro): collapse mode + motion variant ----------
  const Pop = (function () {
    let open = false;
    function build() {
      const pop = $('accPop');
      pop.innerHTML = '';
      pop.appendChild(el('div', 'pop-label', 'Sections'));
      const row = el('div', 'pop-row pop-collapse');
      COLLAPSE.forEach((c) => {
        const b = el('button', 'pop-btn', svg(c.icon) + '<span>' + esc(c.label) + '</span>');
        b.type = 'button'; b.dataset.collapse = c.id; b.title = c.hint;
        b.setAttribute('role', 'menuitemradio');
        b.addEventListener('click', () => Acc.setCollapse(c.id));
        row.appendChild(b);
      });
      pop.appendChild(row);
      pop.appendChild(el('div', 'pop-label', 'Motion'));
      const grid = el('div', 'pop-row pop-variants');
      VARIANTS.forEach((v) => {
        const b = el('button', 'pop-btn pop-var', '<b>' + v.id + '</b><span>' + esc(v.label) + '</span>');
        b.type = 'button'; b.dataset.variant = v.id; b.title = v.id + ' · ' + v.hint;
        b.setAttribute('role', 'menuitemradio');
        b.addEventListener('click', () => Acc.setVariant(v.id));
        grid.appendChild(b);
      });
      pop.appendChild(grid);
      sync();
    }
    function sync() {
      document.querySelectorAll('[data-collapse]').forEach((b) => { const on = b.dataset.collapse === ui.accCollapse; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
      document.querySelectorAll('[data-variant].pop-btn, .seg[data-acc="variant"] .seg-btn').forEach((b) => { if (!b.dataset.variant) return; const on = b.dataset.variant === ui.accVariant; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
      document.querySelectorAll('.seg[data-acc]').forEach((sg) => { const val = sg.dataset.acc === 'variant' ? ui.accVariant : ui.accCollapse; if (sg.dataset.value !== val) syncSeg(sg, null, val); });
    }
    function show() {
      if (open) return;
      open = true;
      build();
      const pop = $('accPop');
      pop.hidden = false;
      $('moreBtn').setAttribute('aria-expanded', 'true');
      $('moreBtn').classList.add('is-on');
      if (M.level() === 'full') pop.animate([{ opacity: 0, transform: 'scale(0.6)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 320, easing: M.spring });
      else if (M.level() === 'fade') pop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 });
      const f = pop.querySelector('.pop-btn.is-on') || pop.querySelector('.pop-btn');
      if (f) f.focus({ preventScroll: true });
    }
    function hide(focusBack) {
      if (!open) return;
      open = false;
      const pop = $('accPop');
      $('moreBtn').setAttribute('aria-expanded', 'false');
      $('moreBtn').classList.remove('is-on');
      const done = () => { if (!open) pop.hidden = true; };
      if (M.level() === 'full') pop.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.7)' }], { duration: 160, easing: M.easeOut }).finished.catch(() => {}).then(done);
      else done();
      if (focusBack) $('moreBtn').focus({ preventScroll: true });
    }
    return { show, hide, sync, toggle() { if (open) hide(); else show(); }, get isOpen() { return open; }, contains(t) { return $('accPop').contains(t) || $('moreBtn').contains(t); } };
  })();
  function syncPop() { Pop.sync(); }
  function syncHeadTools() {
    const showMore = hasPro('sectionMenu');
    $('moreBtn').classList.toggle('is-hidden', !showMore);
    $('moreBtn').tabIndex = showMore ? 0 : -1;
    if (!showMore) Pop.hide();
  }

  function quickVar() {
    const ia = interactVars();
    return ia.find((v) => v.interaction === 'hover' && v.options) || ia.find((v) => v.interaction === 'hover') || null;
  }
  function syncQuick() {
    const row = $('quickRow');
    if (!row) return;
    const v = def ? quickVar() : null;
    row.hidden = !v;
    if (!v) { row.innerHTML = ''; row.dataset.id = ''; return; }
    if (row.dataset.id !== v.id) {
      row.dataset.id = v.id;
      row.innerHTML = '';
      const pill = el('button', 'quick-pill', svg('interact') + '<span class="quick-k"></span><b class="quick-v"></b>');
      pill.type = 'button';
      pill.addEventListener('click', () => {
        const cur = byId[row.dataset.id];
        if (!cur) return;
        if (cur.options) { const i = cur.options.findIndex((o) => same(o.value, P[cur.id])); setValue(cur.id, cur.options[(i + 1) % cur.options.length].value); }
        else setValue(cur.id, !P[cur.id]);
        const b = pill.querySelector('.quick-v');
        if (M.level() === 'full') b.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: M.springSoft });
      });
      const goB = el('button', 'icon-btn quick-go', svg('chev'));
      goB.type = 'button';
      goB.setAttribute('aria-label', 'All interaction controls');
      goB.title = 'All interaction controls';
      goB.addEventListener('click', () => { openDock('click'); go({ type: 'cat', cat: 'interact' }); });
      row.append(pill, goB);
    }
    const pill = row.querySelector('.quick-pill');
    pill.querySelector('.quick-k').textContent = v.short || v.label;
    pill.querySelector('.quick-v').textContent = fmt(v, P[v.id]);
    pill.title = v.label + ': ' + fmt(v, P[v.id]) + ' (click to cycle)';
    pill.setAttribute('aria-label', v.label + ': ' + fmt(v, P[v.id]) + '. Click to change.');
    pill.classList.toggle('is-changed', !same(P[v.id], v.default));
  }

  // ---------- wire controls.js module ----------
  const controlsMod = window.Lab.initControls({
    el, esc, svg, M, S, BASIC_CAP,
    getDef: () => def, getVars: () => vars, getById: () => byId, getP: () => P, getUi: () => ui,
    hasPro, same, fmt, decimals, setValue,
    swatchesFor, allPresets, presetDots, applyPreset,
    userPalette, featuredOverrides, store, toast, push, buildSeg, syncSeg
  });
  const { buildPresets, starBtn, ctlRow, dialEl, chip, syncRow, buildRole, Arc, holdButton } = controlsMod;


  // ---------- footer log ----------
  const Log = (function () {
    const entries = [];
    let lastKey = '';
    function push(text, key) {
      if (!text) return;
      if (key && key === lastKey && entries.length) entries[entries.length - 1] = text;
      else { entries.push(text); if (entries.length > 3) entries.shift(); }
      lastKey = key || '';
      paint(key !== lastKey);
    }
    function paint() {
      const box = $('footLog');
      if (!box) return;
      if (!entries.length) {
        box.innerHTML = '<div class="log-empty">Changes you make will show here</div>';
        return;
      }
      box.innerHTML = entries.map((t, i) => '<div class="log-line' + (i === entries.length - 1 ? ' is-latest' : '') + '">' + esc(t) + '</div>').join('');
      const last = box.lastElementChild;
      if (last && M.level() === 'full') last.animate([{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: M.easeOut });
    }
    function clear() { entries.length = 0; lastKey = ''; paint(); }
    return { push, clear, list: () => entries.slice() };
  })();

  function announce(msg) { const a = $('live'); a.textContent = ''; setTimeout(() => { a.textContent = msg; }, 20); }
  function flashOk(b, label) {
    if (!b) return;
    const orig = b._origHtml || (b._origHtml = b.innerHTML);
    b.classList.add('is-ok');
    b.innerHTML = svg('check') + '<span>' + label + '</span>';
    clearTimeout(b._t);
    b._t = setTimeout(() => { b.classList.remove('is-ok'); b.innerHTML = orig; }, 1300);
  }

  // ---------- wire export.js module ----------
  const exportMod = window.Lab.initExport({
    $, el, svg, M, S, store, STORAGE_KEY,
    getDef: () => def, getMan: () => man, getRawFiles: () => rawFiles,
    getVars: () => vars, getById: () => byId, getP: () => P, getUi: () => ui,
    same, fmt, interactVars, featuredOverrides, userPalette,
    Log, toast, announce, flashOk, reloadComponent: () => loadComponent(def.id, true)
  });
  const { manifestForExport, saveManifest, copyText, interactionText, changesText, copyChanges, workingFile, copyFull, exportLabData, importLabData } = exportMod;

  // ---------- Settings, User Palette, New Component ----------
  function buildSettings(inner) {
    inner.appendChild(el('div', 'set-sec', 'Card position'));
    const grid = el('div', 'anchor-grid');
    ANCHORS.forEach((a) => {
      const b = el('button', 'anchor-dot' + (ui.anchor === a ? ' is-on' : ''), '');
      b.type = 'button';
      b.dataset.anchor = a;
      b.setAttribute('aria-label', a.replace('-', ' '));
      if (a === 'middle-center') {
        b.disabled = true;
        b.title = 'Center anchor disabled (covers component stage)';
      } else {
        b.addEventListener('click', () => {
          ui.anchor = a; saveUi();
          grid.querySelectorAll('.anchor-dot').forEach((d) => d.classList.toggle('is-on', d === b));
          relayout(true);
        });
      }
      grid.appendChild(b);
    });
    const posRow = el('div', 'set-row');
    posRow.append(el('div', '', '<div class="set-label">Anchor</div><div class="set-sub">Eight outer positions around the component</div>'), grid);
    inner.appendChild(posRow);

    inner.appendChild(setRow('Open trigger', 'Hover or click on the rail', [
      { value: 'hover', label: 'Hover' }, { value: 'click', label: 'Click' }
    ], () => ui.openOn, (v) => { ui.openOn = v; saveUi(); }));

    inner.appendChild(setRow('Motion', 'Spring physics across the lab', [
      { value: 'full', label: 'Full' }, { value: 'fade', label: 'Subtle' }, { value: 'off', label: 'Off' }
    ], () => ui.motion, (v) => { ui.motion = v; saveUi(); applyMotionPref(); }));

    inner.appendChild(setRow('Background', 'Stage backdrop behind the component', [
      { value: 'obsidian', label: 'Dark' }, { value: 'grid', label: 'Grid' }, { value: 'checker', label: 'Check' }, { value: 'paper', label: 'Light' }
    ], () => ui.stage, (v) => { ui.stage = v; saveUi(); $('stage').dataset.bg = v; }));

    if (hasPro('userPalette')) {
      const palBtn = el('button', 'nav-row', '<div><div class="set-label">My palette</div><div class="set-sub">' + userPalette().length + ' saved swatches</div></div>' + svg('chev'));
      palBtn.type = 'button';
      palBtn.addEventListener('click', () => push({ type: 'user' }));
      inner.appendChild(palBtn);
    }

    if (hasPro('railCustomize')) {
      inner.appendChild(el('div', 'set-sec', 'Rail order'));
      inner.appendChild(el('div', 'set-sub set-note', 'Drag or use the arrows to reorder. Eye hides an icon from the rail.'));
      inner.appendChild(railOrderEl());

      inner.appendChild(el('div', 'set-sec', 'Rail actions'));
      inner.appendChild(el('div', 'set-sub set-note', 'New component (+) and the Stage toolbar button above the gear.'));
      inner.appendChild(toolOrderEl());
    }

    inner.appendChild(el('div', 'set-sec', 'Stage toolbar'));
    const tbShowRow = switchRow('Show toolbar icon', 'Top-left button; grab any edge to drag & drop, or flick hard to launch', () => TB.shown, (on) => {
      if (on) TB.flyHome(); else TB.dismiss();
    });
    tbShowRow.id = 'tbShowSwitchRow';
    inner.appendChild(tbShowRow);
    if (TB.hasCustomPos) {
      const resetPosBtn = el('button', 'link-btn', 'Reset toolbar position to top-left corner');
      resetPosBtn.type = 'button';
      resetPosBtn.addEventListener('click', () => {
        TB.resetPos();
        toast('Toolbar returned to top-left corner.');
        renderPage(0);
      });
      inner.appendChild(resetPosBtn);
    }
    if (hasPro('toolbarAdvanced')) {
      inner.appendChild(setRow('Start state', 'How the stage toolbar opens on load', [
        { value: 'icon', label: 'Icon' }, { value: '1', label: '1 group' }, { value: 'all', label: 'Full' }, { value: 'remember', label: 'Remember' }
      ], () => ui.tbInit || 'icon', (v) => { ui.tbInit = v; saveUi(); }));
      inner.appendChild(switchRow('Outside click closes it', 'Collapse to the icon when clicking the stage', () => !!ui.tbCloseOut, (on) => {
        ui.tbCloseOut = on; saveUi();
      }));
      inner.appendChild(switchRow('Flick physics', 'Short flick opens; hard throw triggers arcade exit', () => ui.tbFlick !== false, (on) => {
        ui.tbFlick = on; saveUi();
      }));
      inner.appendChild(setRow('Flick strength', 'How fast a throw needs to be', [
        { value: 'gentle', label: 'Gentle' }, { value: 'normal', label: 'Normal' }, { value: 'firm', label: 'Firm' }
      ], () => ui.tbPower || 'normal', (v) => { ui.tbPower = v; saveUi(); }));
    }

    if (hasPro('sectionMenu')) {
      inner.appendChild(el('div', 'set-sec', 'Pro sections'));
      const colRow = setRow('Collapse state', 'How sections start in Pro (also in the \u22ee menu)',
        COLLAPSE.map((c) => ({ value: c.id, label: c.label.replace('All ', '') })),
        () => ui.accCollapse || 'remember', (v) => Acc.setCollapse(v));
      colRow.querySelector('.seg').dataset.acc = 'collapse';
      inner.appendChild(colRow);
      const varRow = setRow('Section motion', 'A Slide · B Spring · C Stagger · D Exclusive',
        VARIANTS.map((v) => ({ value: v.id, label: v.id })),
        () => ui.accVariant || 'B', (v) => Acc.setVariant(v));
      varRow.querySelector('.seg').dataset.acc = 'variant';
      varRow.querySelectorAll('.seg-btn').forEach((b, i) => { b.dataset.variant = VARIANTS[i].id; b.title = VARIANTS[i].id + ' · ' + VARIANTS[i].hint; });
      inner.appendChild(varRow);
    }

    if (hasPro('manifestTools')) {
      const scanList = (def && def.scan && def.scan.interactions) || [];
      inner.appendChild(el('div', 'set-sec', 'Interaction scan'));
      const scanSub = scanList.length
        ? 'Detected: ' + scanList.map((s) => s.kind + ' (' + s.evidence + ')').join(' · ')
        : 'No hover, drag, wheel, key, click or touch handlers detected in this component.';
      const genRow = switchRow('Generate missing controls', scanSub, () => ui.genInteract !== false, (on) => {
        ui.genInteract = on; saveUi();
        loadComponent(def.id, true);
        toast(on ? 'Generated interaction controls enabled.' : 'Showing only manifest-declared controls.');
      });
      inner.appendChild(genRow);

      inner.appendChild(el('div', 'set-sec', 'Manifest'));
      const isTpl = def && def.id === '_template';
      const manRow = el('div', 'set-row');
      manRow.appendChild(el('div', '', '<div class="set-label">manifest.json</div><div class="set-sub">' + (isTpl ? 'Protected scaffold template (export only)' : 'Include your \u2605 featured set and current defaults') + '</div>'));
      const manBtns = el('div', 'btn-pair');
      const saveB = el('button', 'foot-btn is-primary', svg('save') + '<span>Save to disk</span>');
      saveB.type = 'button';
      if (isTpl) {
        saveB.disabled = true;
        saveB.title = '_template is read-only; use Export JSON instead';
      } else {
        saveB.addEventListener('click', () => saveManifest(saveB));
      }
      const dlB = el('button', 'foot-btn', svg('download') + '<span>Export JSON</span>');
      dlB.type = 'button';
      dlB.addEventListener('click', () => {
        S.download(def.id + '-manifest.json', JSON.stringify(manifestForExport(), null, 2), 'application/json');
        toast('Downloaded ' + def.id + '-manifest.json');
      });
      manBtns.append(saveB, dlB);
      manRow.appendChild(manBtns);
      inner.appendChild(manRow);

      const rescanRow = el('div', 'set-row');
      rescanRow.appendChild(el('div', '', '<div class="set-label">Source scan</div><div class="set-sub">Re-read CSS, JS & HTML without losing current slider values</div>'));
      const rescanB = el('button', 'foot-btn', svg('reset') + '<span>Re-scan files</span>');
      rescanB.type = 'button';
      rescanB.addEventListener('click', () => rescanComponent(rescanB));
      rescanRow.appendChild(rescanB);
      inner.appendChild(rescanRow);
    }

    inner.appendChild(el('div', 'set-sec', 'Reset & backup'));
    const bkRow = el('div', 'set-row');
    bkRow.appendChild(el('div', '', '<div class="set-label">Lab data backup</div><div class="set-sub">Save or restore all values, snapshots, palettes & UI settings</div>'));
    const bkBtns = el('div', 'btn-pair');
    const expB = el('button', 'foot-btn', svg('download') + '<span>Export lab data</span>');
    expB.type = 'button';
    expB.addEventListener('click', () => exportLabData());
    const impB = el('button', 'foot-btn', svg('plus') + '<span>Import lab data</span>');
    impB.type = 'button';
    impB.addEventListener('click', () => importLabData());
    bkBtns.append(expB, impB);
    bkRow.appendChild(bkBtns);
    inner.appendChild(bkRow);

    const resetAll = holdButton('Hold to reset all', () => {
      if (!def) return;
      store.del('values:' + def.id);
      store.del('featured:' + def.id);
      store.del('manifest:' + def.id);
      store.del('accOpen:' + def.id);
      store.del('snaps:' + def.id);
      loadComponent(def.id, true);
      toast('Reset values, snapshots, and featured controls.');
    });
    resetAll.classList.add('reset-all');
    inner.appendChild(resetAll);

    const resetUiBtn = el('button', 'link-btn', 'Reset lab layout & settings');
    resetUiBtn.type = 'button';
    resetUiBtn.addEventListener('click', () => {
      store.del('ui');
      Object.keys(ui).forEach((k) => delete ui[k]);
      Object.assign(ui, {
        mode: 'basic', anchor: 'bottom-right', openOn: 'hover', motion: 'full', stage: 'obsidian',
        view: 'fit', accVariant: 'B', accCollapse: 'remember', genInteract: true,
        railOrder: CAT_IDS.slice(), railHidden: [], toolOrder: TOOL_IDS.slice(), toolHidden: [],
        tbOut: true, tbGroups: 0, tbInit: 'icon', tbCloseOut: false, tbFlick: true, tbPower: 'normal'
      });
      saveUi();
      mode = ui.mode;
      $('stage').dataset.bg = ui.stage;
      applyMotionPref();
      TB.resetPos();
      TB.flyHome();
      syncHeadTools();
      syncSeg($('modeSeg'), modePill, mode);
      buildRail();
      relayout(true);
      renderPage(0);
      toast('Reset lab layout and settings to defaults.');
    });
    inner.appendChild(resetUiBtn);

    if (mode === 'basic') {
      const proLink = el('button', 'link-btn', 'Switch to Pro for rail order, custom palettes & manifest tools \u2192');
      proLink.type = 'button';
      proLink.addEventListener('click', () => {
        setMode('pro');
        go({ type: 'settings' });
      });
      inner.appendChild(proLink);
    }
    return '';
  }

  function orderListEl(items, getOrd, setOrd, getHid, setHid, minVis) {
    const box = el('div', 'rail-order');
    let dragId = null;
    const curOrder = () => {
      const o = getOrd().filter((id) => items.some((x) => x.id === id));
      items.forEach((x) => { if (!o.includes(x.id)) o.push(x.id); });
      return o;
    };
    const commit = (ord, hid) => {
      if (ord) setOrd(ord);
      if (hid) setHid(hid);
      saveUi();
      buildRail();
      paint();
    };
    function move(id, d) {
      const o = curOrder(), i = o.indexOf(id), j = i + d;
      if (i < 0 || j < 0 || j >= o.length) return;
      o.splice(i, 1); o.splice(j, 0, id);
      commit(o, null);
    }
    function toggleHide(id) {
      const h = getHid().slice();
      const i = h.indexOf(id);
      if (i >= 0) h.splice(i, 1);
      else {
        if (items.length - h.length <= minVis) { toast(minVis ? 'Keep at least one category on the rail.' : ''); return; }
        h.push(id);
      }
      commit(null, h);
    }
    function paint() {
      box.innerHTML = '';
      const o = curOrder(), h = getHid();
      o.forEach((id, i) => {
        const c = items.find((x) => x.id === id);
        if (!c) return;
        const off = h.includes(id);
        const row = el('div', 'ro-row' + (off ? ' is-off' : ''));
        row.draggable = true;
        row.dataset.id = id;
        row.innerHTML = '<span class="ro-grip" aria-hidden="true">' + svg('grip') + '</span>'
          + '<span class="ro-ico">' + svg(c.icon) + '</span>'
          + '<span class="ro-label">' + esc(c.label) + '</span>';
        const up = el('button', 'icon-btn ro-arr', svg('up'));
        up.type = 'button'; up.disabled = i === 0; up.setAttribute('aria-label', 'Move ' + c.label + ' up');
        up.addEventListener('click', () => move(id, -1));
        const dn = el('button', 'icon-btn ro-arr', svg('down'));
        dn.type = 'button'; dn.disabled = i === o.length - 1; dn.setAttribute('aria-label', 'Move ' + c.label + ' down');
        dn.addEventListener('click', () => move(id, 1));
        const eye = el('button', 'icon-btn ro-eye' + (off ? '' : ' is-on'), svg(off ? 'eyeOff' : 'eye'));
        eye.type = 'button'; eye.setAttribute('aria-label', (off ? 'Show ' : 'Hide ') + c.label + ' on rail');
        eye.title = off ? 'Hidden from rail (click to show)' : 'Visible on rail (click to hide)';
        eye.addEventListener('click', () => toggleHide(id));
        row.append(up, dn, eye);
        row.addEventListener('dragstart', (e) => { dragId = id; row.classList.add('is-drag'); try { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; } catch (_) {} });
        row.addEventListener('dragend', () => { dragId = null; row.classList.remove('is-drag'); box.querySelectorAll('.is-over').forEach((n) => n.classList.remove('is-over')); });
        row.addEventListener('dragover', (e) => { if (!dragId || dragId === id) return; e.preventDefault(); row.classList.add('is-over'); });
        row.addEventListener('dragleave', () => row.classList.remove('is-over'));
        row.addEventListener('drop', (e) => {
          e.preventDefault(); row.classList.remove('is-over');
          if (!dragId || dragId === id) return;
          const ord = curOrder(), a = ord.indexOf(dragId), b = ord.indexOf(id);
          if (a < 0 || b < 0) return;
          ord.splice(a, 1); ord.splice(b, 0, dragId);
          commit(ord, null);
        });
        box.appendChild(row);
      });
    }
    paint();
    return box;
  }
  function railOrderEl() {
    const wrapEl = el('div', '');
    wrapEl.appendChild(orderListEl(CATS, () => orderedCats().map((c) => c.id), (o) => { ui.railOrder = o; }, railHidden, (h) => { ui.railHidden = h; }, 1));
    const resetB = el('button', 'link-btn', 'Reset rail order');
    resetB.type = 'button';
    resetB.addEventListener('click', () => { ui.railOrder = CAT_IDS.slice(); ui.railHidden = []; saveUi(); buildRail(); renderPage(0); });
    wrapEl.appendChild(resetB);
    return wrapEl;
  }
  function toolOrderEl() {
    return orderListEl(TOOLS, () => orderedTools().map((t) => t.id), (o) => { ui.toolOrder = o; }, toolHidden, (h) => { ui.toolHidden = h; }, 0);
  }
  function switchRow(label, sub, get, set) {
    const row = el('div', 'set-row');
    const txt = el('div', '', '<div class="set-label">' + esc(label) + '</div><div class="set-sub">' + esc(sub) + '</div>');
    const sw = el('button', 'switch' + (get() ? ' is-on' : ''), '<span class="switch-knob"></span>');
    sw.type = 'button'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', get() ? 'true' : 'false');
    sw.addEventListener('click', () => { const n = !get(); sw.classList.toggle('is-on', n); sw.setAttribute('aria-checked', n ? 'true' : 'false'); set(n); });
    row.append(txt, sw);
    return row;
  }
  function setRow(label, sub, opts, get, set) {
    const row = el('div', 'set-row');
    const txt = el('div', '', '<div class="set-label">' + esc(label) + '</div><div class="set-sub">' + esc(sub) + '</div>');
    const seg = el('div', 'seg seg-sm');
    buildSeg(seg, opts, get(), set);
    row.append(txt, seg);
    return row;
  }

  function buildUser(inner) {
    const list = userPalette();
    const grid = el('div', 'sw-grid');
    const paint = () => {
      grid.innerHTML = '';
      userPalette().forEach((hex, idx) => {
        const b = el('button', 'sw-dot', '<span style="--sw:' + hex + '"></span>');
        b.type = 'button'; b.title = hex + ' (click to remove)';
        b.addEventListener('click', () => { const cur = userPalette(); cur.splice(idx, 1); saveUserPalette(cur); paint(); });
        grid.appendChild(b);
      });
    };
    paint();
    const addRow = el('div', 'hex-row');
    const inp = el('input', 'hex-in'); inp.type = 'text'; inp.placeholder = '#38bdf8'; inp.maxLength = 7;
    const addB = el('button', 'mini-btn', svg('plus') + ' Add');
    addB.type = 'button';
    addB.addEventListener('click', () => {
      const h = S.parseColor(inp.value);
      if (!h) { toast('Enter a 6-digit hex like #38bdf8'); return; }
      const cur = userPalette();
      if (!cur.includes(h)) { cur.push(h); saveUserPalette(cur); }
      inp.value = ''; paint();
    });
    addRow.append(inp, addB);
    inner.append(el('div', 'set-sub', 'Click a swatch to remove it. These appear under "My palette" on every colour page.'), grid, addRow);
    return list.length + ' swatches';
  }

  function startNew() {
    newDraft = { name: '', id: '', kind: 'widget', look: 'obsidian', motion: 'spring' };
    go({ type: 'new', step: 1 });
  }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32); }

  const KINDS = [
    { value: 'button', label: 'Button', sub: 'Trigger or toggle', glyph: '<span class="g-pill"><i class="g-dot"></i><b>Action</b></span>' },
    { value: 'card',   label: 'Card',   sub: 'Panel or tile',     glyph: '<span class="g-card"><i class="g-bar"></i><i class="g-line"></i><i class="g-line s"></i></span>' },
    { value: 'widget', label: 'Dial',   sub: 'Meter or readout',  glyph: '<span class="g-dial"><i></i><b>72</b></span>' },
    { value: 'input',  label: 'Slider', sub: 'Range or field',    glyph: '<span class="g-track"><i class="g-fill"></i><b class="g-thumb"></b></span>' },
    { value: 'loader', label: 'Pulse',  sub: 'Spinner or state',  glyph: '<span class="g-ring"><i></i><b></b></span>' },
    { value: 'nav',    label: 'Tabs',   sub: 'Segmented bar',     glyph: '<span class="g-tabs"><i class="on"></i><i></i><i></i></span>' }
  ];
  const LOOKS = [
    { value: 'obsidian', label: 'Obsidian', sub: 'Deep glass · cyan + violet', c: ['#0d1018', '#38bdf8', '#a78bfa'] },
    { value: 'aurora',   label: 'Aurora',   sub: 'Soft dark · mint + sky',     c: ['#0a1418', '#34d399', '#38bdf8'] },
    { value: 'ember',    label: 'Ember',    sub: 'Warm dark · amber + rose',   c: ['#16100e', '#fbbf24', '#fb7185'] },
    { value: 'paper',    label: 'Paper',    sub: 'Crisp light · cobalt + ink', c: ['#f5f6fa', '#2563eb', '#0f172a'] }
  ];
  const FEELS = [
    { value: 'snappy', label: 'Snappy', sub: 'Quick & crisp',    curve: 'M4 22 C 10 4, 18 4, 36 4' },
    { value: 'spring', label: 'Spring', sub: 'Gentle overshoot', curve: 'M4 22 C 11 1, 17 1, 23 6 C 28 9, 32 4, 36 4' },
    { value: 'floaty', label: 'Calm',   sub: 'Slow & weightless',curve: 'M4 22 C 16 20, 20 4, 36 4' }
  ];

  function tileGrid(group, items, cur, pick, render) {
    const g = el('div', 'tile-grid tile-' + group);
    g.dataset.group = group;
    g.dataset.value = cur;
    g.appendChild(el('span', 'tile-pill'));
    items.forEach((it) => {
      const b = el('button', 'tile' + (it.value === cur ? ' is-on' : ''), render(it));
      b.type = 'button';
      b.dataset.value = it.value;
      b.setAttribute('aria-pressed', it.value === cur ? 'true' : 'false');
      b.addEventListener('click', () => {
        pick(it.value);
        g.dataset.value = it.value;
        g.querySelectorAll('.tile').forEach((t) => {
          const on = t.dataset.value === it.value;
          t.classList.toggle('is-on', on);
          t.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        syncTiles(g.closest('.page') || document, false);
      });
      g.appendChild(b);
    });
    return g;
  }
  function syncTiles(scope, instant) {
    scope.querySelectorAll('.tile-grid').forEach((g) => {
      const pill = g.querySelector('.tile-pill');
      const on = g.querySelector('.tile.is-on');
      if (!pill || !on) return;
      if (!g._pill) g._pill = new M.TilePill(pill);
      g._pill.moveTo(on, instant);
    });
  }

  function buildNew(spec, inner) {
    const step = spec.step || 1;
    const dots = el('div', 'step-dots');
    for (let i = 1; i <= 3; i++) dots.appendChild(el('span', 'step-dot' + (i === step ? ' is-on' : i < step ? ' is-done' : '')));
    inner.appendChild(dots);

    if (step === 1) {
      const wrap = el('div', 'new-step');
      const lab = el('label', 'new-label', 'Component name');
      const inp = el('input', 'new-in');
      inp.type = 'text'; inp.placeholder = 'Magnetic Button'; inp.value = newDraft.name;
      const slugEl = el('div', 'new-slug', 'components/<b>' + (newDraft.id || 'magnetic-button') + '</b>/');
      inp.addEventListener('input', () => {
        newDraft.name = inp.value;
        newDraft.id = slug(inp.value);
        slugEl.innerHTML = 'components/<b>' + esc(newDraft.id || 'my-component') + '</b>/';
      });
      wrap.append(lab, inp, slugEl, el('div', 'new-label', 'Starting shape'));
      wrap.appendChild(tileGrid('kind', KINDS, newDraft.kind, (v) => { newDraft.kind = v; }, (it) =>
        '<span class="tile-glyph">' + it.glyph + '</span><span class="tile-t">' + esc(it.label) + '</span><span class="tile-s">' + esc(it.sub) + '</span>'));
      const next = el('button', 'foot-btn is-primary new-next', '<span>Next: Palette & feel</span>' + svg('chev'));
      next.type = 'button';
      next.addEventListener('click', () => {
        if (!newDraft.id) { newDraft.name = 'Magnetic Button'; newDraft.id = 'magnetic-button'; }
        replaceTop({ type: 'new', step: 2 }, 1);
      });
      wrap.appendChild(next);
      inner.appendChild(wrap);
      setTimeout(() => inp.focus(), 60);
    } else if (step === 2) {
      const wrap = el('div', 'new-step');
      wrap.appendChild(el('div', 'new-label', 'Palette'));
      wrap.appendChild(tileGrid('look', LOOKS, newDraft.look, (v) => { newDraft.look = v; }, (it) =>
        '<span class="look-sw" style="--c0:' + it.c[0] + ';--c1:' + it.c[1] + ';--c2:' + it.c[2] + '">'
        + '<i class="sw-bg"></i><i class="sw-a"></i><i class="sw-b"></i></span>'
        + '<span class="tile-txt"><span class="tile-t">' + esc(it.label) + '</span><span class="tile-s">' + esc(it.sub) + '</span></span>'));
      wrap.appendChild(el('div', 'new-label', 'Motion feel'));
      wrap.appendChild(tileGrid('feel', FEELS, newDraft.motion, (v) => { newDraft.motion = v; }, (it) =>
        '<svg class="feel-svg" viewBox="0 0 40 26" aria-hidden="true"><path d="' + it.curve + '"/></svg>'
        + '<span class="tile-t">' + esc(it.label) + '</span><span class="tile-s">' + esc(it.sub) + '</span>'));
      const row = el('div', 'new-nav');
      const b = el('button', 'foot-btn', 'Back'); b.type = 'button'; b.addEventListener('click', () => replaceTop({ type: 'new', step: 1 }, -1));
      const n = el('button', 'foot-btn is-primary', svg('spark') + '<span>Create component</span>'); n.type = 'button';
      n.addEventListener('click', () => createNew(n));
      row.append(b, n);
      wrap.appendChild(row);
      inner.appendChild(wrap);
    } else if (step === 3) {
      const id = newDraft.id || 'my-component';
      const cmd = 'python new-component.py ' + id + ' --name "' + (newDraft.name || id) + '" --kind ' + newDraft.kind + ' --look ' + newDraft.look + ' --motion ' + newDraft.motion;
      const wrap = el('div', 'new-step');
      wrap.append(
        el('div', 'new-label', 'Ready to scaffold'),
        el('div', 'set-sub', 'Run this in the component-lab folder (or run serve.py to create components in one click):'),
        el('pre', 'cmd-box', esc(cmd))
      );
      const copyB = el('button', 'foot-btn is-primary new-next', svg('copy') + '<span>Copy command</span>');
      copyB.type = 'button';
      copyB.addEventListener('click', () => copyText(cmd, 'Copied command. Run it, then refresh.', copyB, 'Copied'));
      const backB = el('button', 'foot-btn new-next', 'Back'); backB.type = 'button'; backB.addEventListener('click', () => replaceTop({ type: 'new', step: 2 }, -1));
      wrap.append(copyB, backB);
      inner.appendChild(wrap);
    }
    return 'Step ' + step + ' of 3';
  }
  async function createNew(btn) {
    btn.disabled = true;
    try {
      const r = await fetch('api/new-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDraft)
      });
      if (!r.ok) {
        let msg = '';
        try { msg = (await r.json()).error || ''; } catch (_) {}
        if (r.status === 409 || /exists/i.test(msg)) { toast('components/' + newDraft.id + ' already exists — pick another name.'); btn.disabled = false; replaceTop({ type: 'new', step: 1 }, -1); return; }
        throw new Error(msg || r.status);
      }
      const j = await r.json();
      if (!j || !j.ok) throw new Error((j && j.error) || 'api');
      await loadRegistry();
      navStack = [{ type: 'cat', cat: 'color' }];
      await loadComponent(j.id);
      toast('Created components/' + j.id + '/ — ready to tune.');
    } catch (_) {
      btn.disabled = false;
      replaceTop({ type: 'new', step: 3 }, 1);
      toast('Server is static — copy the command below, or run: python serve.py');
    }
  }

  // ---------- Stage & Floating Nested Toolbar (TB Overhaul: Enhancement #7) ----------
  const TB = (function () {
    const N = 3;
    let open = 0, out = true, menuOpen = false, menuAnchor = null, railBtn = null;
    let customPos = null; // Session-only custom drop position: { x, y, flip } (see Future Audit Log #3 for ui.tbPos persistence)
    const bar = () => $('stageBar');
    const toggleBtn = () => $('tbToggle');
    const groups = () => [...bar().querySelectorAll('.tb-g')];
    const growDir = () => (customPos && customPos.flip ? -1 : 1);

    function save() {
      ui.tbOut = out;
      if (ui.tbInit === 'remember') ui.tbGroups = open;
      saveUi();
    }
    function applyCustomCoords() {
      const b = bar();
      if (!b) return;
      if (customPos) {
        b.style.left = Math.round(customPos.x) + 'px';
        b.style.top = Math.round(customPos.y) + 'px';
        b.style.right = 'auto';
        b.dataset.customPos = 'true';
        b.dataset.flip = customPos.flip ? 'true' : 'false';
      } else {
        b.style.left = '';
        b.style.top = '';
        b.style.right = '';
        delete b.dataset.customPos;
        delete b.dataset.flip;
      }
    }
    function resetPos() {
      customPos = null;
      applyCustomCoords();
      Log.push('toolbar reset to top-left');
    }
    function unhideRailToolbar() {
      if (Array.isArray(ui.toolHidden) && ui.toolHidden.includes('toolbar')) {
        ui.toolHidden = ui.toolHidden.filter((id) => id !== 'toolbar');
        saveUi();
        buildRail();
      }
    }
    function syncSettingsSwitch() {
      const row = $('tbShowSwitchRow');
      if (!row) return;
      const sw = row.querySelector('.switch');
      if (sw) {
        sw.classList.toggle('is-on', out);
        sw.setAttribute('aria-checked', out ? 'true' : 'false');
      }
    }
    function paint(animate) {
      const b = bar();
      b.dataset.open = String(open);
      b.classList.toggle('is-out', out);
      b.inert = !out;
      toggleBtn().setAttribute('aria-expanded', open > 0 ? 'true' : 'false');
      toggleBtn().title = open > 0
        ? 'Stage toolbar (click to collapse · drag to move · flick to throw)'
        : 'Stage toolbar (click to open · Shift+click for 1 group · drag to move)';
      groups().forEach((g, i) => {
        const on = out && i < open;
        const wasOn = g.classList.contains('is-on');
        g.classList.toggle('is-on', on);
        g.inert = !on;
        if (animate && on && !wasOn && M.level() === 'full') {
          const inner = g.querySelector('.tb-gi');
          const d = growDir();
          inner.animate(
            [{ opacity: 0, transform: 'translateX(' + (-8 * d) + 'px) scale(0.92)' }, { opacity: 1, transform: 'none' }],
            { duration: 360, delay: i * 55, easing: M.springSoft, fill: 'backwards' }
          );
        }
      });
      if (open < 1) menuHide();
      if (open >= 3) setTimeout(() => syncSeg($('viewSeg'), viewPill, ui.view, true), M.level() === 'full' ? 280 : 0);
      if (railBtn) {
        railBtn.classList.toggle('is-summoned', out);
        railBtn.title = out ? 'Stage toolbar is on the stage (click to collapse it to here)' : 'Stage toolbar (click or flick right to send to stage)';
      }
      syncSettingsSwitch();
    }
    function setOpen(n, animate) {
      const next = Math.max(0, Math.min(N, n));
      if (next === open && out) return;
      open = next;
      paint(animate !== false);
      save();
    }
    function toggle(stepOnly) {
      if (!out) { flyHome(stepOnly ? 1 : N); return; }
      if (stepOnly) setOpen(open < N ? open + 1 : 0, true);
      else setOpen(open > 0 ? 0 : N, true);
    }
    function start() {
      out = ui.tbOut !== false;
      const init = ui.tbInit || 'icon';
      open = init === 'all' ? N : init === '1' ? 1 : init === 'remember' ? (ui.tbGroups || 0) : 0;
      applyCustomCoords();
      paint(false);
    }

    // 5 Video-Game Physics Exit Trajectories when throwing/flicking the toolbar off-screen!
    const TRICKS = ['arc', 'ricochet', 'curve', 'warp', 'spiral'];
    let lastTrick = '';
    function pickTrick(vx, vy) {
      const pool = TRICKS.filter((t) => t !== lastTrick);
      // Bias slightly by throw angle while keeping arcade variety
      if (Math.abs(vx) > Math.abs(vy) * 1.8 && pool.includes('warp') && Math.random() < 0.45) return (lastTrick = 'warp');
      if (vy < -0.55 && pool.includes('arc') && Math.random() < 0.45) return (lastTrick = 'arc');
      const choice = pool[Math.floor(Math.random() * pool.length)] || 'arc';
      lastTrick = choice;
      return choice;
    }

    function dismiss(vx, vy) {
      if (!out) return;
      menuHide();
      if (open > 0) { open = 0; paint(false); }
      const b = bar();
      b.classList.remove('is-held');
      const from = b.getBoundingClientRect();
      // Ensure rail toolbar button is visible so user is never locked out (Item 2.5)
      unhideRailToolbar();
      const rb = railBtn && railBtn.getBoundingClientRect();
      const tx = (rb && rb.width ? rb.left + rb.width / 2 - from.width / 2 : 12) - from.left;
      const ty = (rb && rb.height ? rb.top + rb.height / 2 - from.height / 2 : innerHeight - 80) - from.top;
      out = false;
      save();

      if (M.level() === 'full') {
        const hasThrow = vx != null || vy != null;
        const pvx = vx || -0.9;
        const pvy = vy || 0.4;
        const trick = hasThrow ? pickTrick(pvx, pvy) : 'direct';
        let kf, dur, ease;

        if (trick === 'arc') {
          // 1. Gravity Lob: launches high on throw vector with backspin, peaks, then plummets into rail slot
          const peakX = Math.max(-from.left + 16, Math.min(innerWidth - from.left - 48, pvx * 165));
          const peakY = Math.min(-45, -Math.abs(pvy) * 140 - 55);
          kf = [
            { transform: 'translate(0,0) scale(1.08) rotate(0deg)', opacity: 1, offset: 0 },
            { transform: 'translate(' + peakX.toFixed(1) + 'px,' + peakY.toFixed(1) + 'px) scale(0.92) rotate(' + (pvx >= 0 ? 140 : -140) + 'deg)', opacity: 1, offset: 0.42 },
            { transform: 'translate(' + (tx * 0.72).toFixed(1) + 'px,' + (ty * 0.65).toFixed(1) + 'px) scale(0.64) rotate(' + (pvx >= 0 ? 290 : -290) + 'deg)', opacity: 0.9, offset: 0.76 },
            { transform: 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(0.28) rotate(' + (pvx >= 0 ? 360 : -360) + 'deg)', opacity: 0, offset: 1 }
          ];
          dur = 580;
          ease = 'cubic-bezier(0.22, 0.68, 0.36, 1)';
          Log.push('toolbar trick · gravity lob!');
        } else if (trick === 'ricochet') {
          // 2. Wall Ricochet: banks off nearest viewport wall with squash-and-stretch before zipping into rail
          const hitRight = pvx > 0.15;
          const wallX = hitRight ? (innerWidth - from.right - 6) : (-from.left + 6);
          const wallY = Math.max(-from.top + 14, Math.min(innerHeight - from.bottom - 14, pvy * 180));
          kf = [
            { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0 },
            { transform: 'translate(' + wallX.toFixed(1) + 'px,' + wallY.toFixed(1) + 'px) scaleX(0.72) scaleY(1.28) rotate(' + (hitRight ? 22 : -22) + 'deg)', opacity: 1, offset: 0.36 },
            { transform: 'translate(' + (wallX * 0.5 + tx * 0.5).toFixed(1) + 'px,' + (wallY * 0.5 + ty * 0.5).toFixed(1) + 'px) scale(0.75) rotate(' + (hitRight ? -140 : 140) + 'deg)', opacity: 0.92, offset: 0.7 },
            { transform: 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(0.28) rotate(' + (hitRight ? -240 : 240) + 'deg)', opacity: 0, offset: 1 }
          ];
          dur = 560;
          ease = M.easeOut;
          Log.push('toolbar trick · wall ricochet!');
        } else if (trick === 'curve') {
          // 3. Boomerang Curveball: sweeps out in a wide S-curve with banking tilt before curving home
          const sweepX = Math.max(-from.left + 24, Math.min(innerWidth - from.left - 56, pvx * 220 + (pvx >= 0 ? 90 : -90)));
          const sweepY = Math.max(-from.top + 24, Math.min(innerHeight - from.bottom - 24, pvy * 150 - 40));
          kf = [
            { transform: 'translate(0,0) scale(1.06) rotate(0deg)', opacity: 1, offset: 0 },
            { transform: 'translate(' + sweepX.toFixed(1) + 'px,' + sweepY.toFixed(1) + 'px) scale(0.95) rotate(' + (pvx >= 0 ? 48 : -48) + 'deg)', opacity: 1, offset: 0.45 },
            { transform: 'translate(' + (tx * 1.08).toFixed(1) + 'px,' + (ty * 0.82).toFixed(1) + 'px) scale(0.58) rotate(' + (pvx >= 0 ? -32 : 32) + 'deg)', opacity: 0.88, offset: 0.82 },
            { transform: 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(0.28) rotate(0deg)', opacity: 0, offset: 1 }
          ];
          dur = 590;
          ease = M.springSoft;
          Log.push('toolbar trick · boomerang curve!');
        } else if (trick === 'warp') {
          // 4. Slingshot Warp: pulls back slightly, stretches along velocity vector, then hyperspace-streaks to rail
          const pullX = -pvx * 22, pullY = -pvy * 22;
          const dashX = pvx * 130, dashY = pvy * 130;
          kf = [
            { transform: 'translate(0,0) scale(1)', filter: 'blur(0px)', opacity: 1, offset: 0 },
            { transform: 'translate(' + pullX.toFixed(1) + 'px,' + pullY.toFixed(1) + 'px) scale(0.86)', filter: 'blur(0px)', opacity: 1, offset: 0.2 },
            { transform: 'translate(' + dashX.toFixed(1) + 'px,' + dashY.toFixed(1) + 'px) scaleX(1.45) scaleY(0.68)', filter: 'blur(2px)', opacity: 0.95, offset: 0.48 },
            { transform: 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(0.24)', filter: 'blur(0px)', opacity: 0, offset: 1 }
          ];
          dur = 470;
          ease = M.easeOut;
          Log.push('toolbar trick · slingshot warp!');
        } else if (trick === 'spiral') {
          // 5. Corkscrew Spiral: 720-degree barrel roll along flight vector into the rail
          const midX = tx * 0.48 + pvx * 85;
          const midY = ty * 0.48 + pvy * 85;
          kf = [
            { transform: 'translate(0,0) scale(1.08) rotate(0deg)', opacity: 1, offset: 0 },
            { transform: 'translate(' + (midX * 0.55).toFixed(1) + 'px,' + (midY * 0.55).toFixed(1) + 'px) scale(0.92) rotate(260deg)', opacity: 1, offset: 0.35 },
            { transform: 'translate(' + midX.toFixed(1) + 'px,' + midY.toFixed(1) + 'px) scale(0.68) rotate(520deg)', opacity: 0.92, offset: 0.7 },
            { transform: 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(0.26) rotate(720deg)', opacity: 0, offset: 1 }
          ];
          dur = 610;
          ease = 'cubic-bezier(0.2, 0.75, 0.35, 1)';
          Log.push('toolbar trick · corkscrew spiral!');
        } else {
          // Calm dismiss (from Settings switch or rail click)
          const kx = pvx * 55, ky = pvy * 55;
          kf = [
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: 'translate(' + kx.toFixed(1) + 'px,' + ky.toFixed(1) + 'px) scale(0.92)', opacity: 0.95, offset: 0.22 },
            { transform: 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(0.35)', opacity: 0 }
          ];
          dur = 440;
          ease = M.easeOut;
          Log.push('toolbar -> rail');
        }

        const anim = b.animate(kf, { duration: dur, easing: ease });
        anim.finished.catch(() => {}).then(() => {
          paint(false);
          if (railBtn && railBtn.offsetWidth) {
            railBtn.animate(
              [{ transform: 'scale(1)' }, { transform: 'scale(1.34) rotate(-8deg)' }, { transform: 'scale(0.93)' }, { transform: 'scale(1)' }],
              { duration: 420, easing: M.spring }
            );
          }
        });
      } else {
        paint(false);
        Log.push('toolbar -> rail');
      }
    }

    function flyHome(openCount, vx) {
      unhideRailToolbar();
      const b = bar();
      const rb = railBtn && railBtn.getBoundingClientRect();
      out = true;
      open = openCount != null ? openCount : 0;
      applyCustomCoords();
      paint(false);
      save();
      if (M.level() === 'full' && rb && rb.width) {
        const to = b.getBoundingClientRect();
        const fx = rb.left - to.left, fy = rb.top - to.top;
        const arcY = Math.min(fy * 0.4, -36) - Math.min(80, Math.abs(vx || 0) * 35);
        b.animate([
          { transform: 'translate(' + fx + 'px,' + fy + 'px) scale(0.4) rotate(-18deg)', opacity: 0.2 },
          { transform: 'translate(' + (fx * 0.35).toFixed(1) + 'px,' + arcY.toFixed(1) + 'px) scale(1.06) rotate(4deg)', opacity: 1, offset: 0.6 },
          { transform: 'none', opacity: 1 }
        ], { duration: 520, easing: M.spring });
      }
      Log.push('toolbar -> stage');
    }

    function railClick() {
      if (!out) flyHome(0);
      else if (open === 0) setOpen(N, true);
      else dismiss();
    }
    function railButton(btn) {
      railBtn = btn;
      paint(false);
      M.Flick(btn, {
        get enabled() { return ui.tbFlick !== false; },
        get sensitivity() { return ui.tbPower || 'normal'; },
        onTap() { railClick(); },
        onDrag(dx, dy) {
          if (M.level() !== 'full') return;
          btn.style.transform = 'translate(' + (dx * 0.28).toFixed(1) + 'px,' + (dy * 0.22).toFixed(1) + 'px)';
        },
        onEnd({ power, vx, vy }) {
          btn.style.transform = '';
          if (power === 0) return;
          if (!out && (vx > 0.2 || vy < -0.25)) flyHome(power >= 2 ? N : 1, vx);
          else if (out) dismiss(vx, vy);
        }
      });
    }

    // Component picker menu: can anchor to #tbPick (stage toolbar) or #cmpName (dock header)
    function menuBuild() {
      const m = $('tbMenu');
      m.innerHTML = '';
      reg.forEach((id) => {
        const on = def && def.id === id;
        const it = el('button', 'tb-item' + (on ? ' is-on' : ''), '<span>' + esc(id) + '</span>' + svg('check'));
        it.type = 'button'; it.setAttribute('role', 'menuitemradio'); it.setAttribute('aria-checked', on ? 'true' : 'false');
        it.addEventListener('click', () => { menuHide(); if (!def || def.id !== id) loadComponent(id); });
        m.appendChild(it);
      });
      const sep = el('div', 'tb-sep');
      const add = el('button', 'tb-item', '<span>+ New component\u2026</span><span></span>');
      add.type = 'button';
      add.addEventListener('click', () => { menuHide(); openDock('click'); startNew(); });
      m.append(sep, add);
    }
    function syncMenuHighlight() {
      const m = $('tbMenu');
      if (!m || m.hidden) return;
      m.querySelectorAll('.tb-item').forEach((it) => {
        const label = it.querySelector('span');
        if (!label || label.textContent.startsWith('+')) return;
        const on = def && def.id === label.textContent;
        it.classList.toggle('is-on', !!on);
        it.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }
    function menuShow(anchorEl) {
      const target = anchorEl || $('tbPick');
      if (menuOpen && menuAnchor === target) { menuHide(); return; }
      menuOpen = true;
      menuAnchor = target;
      menuBuild();
      const m = $('tbMenu'), r = target.getBoundingClientRect();
      const left = Math.max(12, Math.min(innerWidth - 220, Math.round(r.left)));
      m.style.left = left + 'px';
      m.style.top = Math.round(r.bottom + 6) + 'px';
      m.hidden = false;
      $('tbPick').setAttribute('aria-expanded', target === $('tbPick') ? 'true' : 'false');
      if ($('cmpName')) $('cmpName').setAttribute('aria-expanded', target === $('cmpName') ? 'true' : 'false');
      if (M.level() === 'full') m.animate([{ opacity: 0, transform: 'translateY(-4px) scale(0.95)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: M.spring });
    }
    function menuHide() {
      if (!menuOpen) return;
      menuOpen = false;
      menuAnchor = null;
      $('tbMenu').hidden = true;
      $('tbPick').setAttribute('aria-expanded', 'false');
      if ($('cmpName')) $('cmpName').setAttribute('aria-expanded', 'false');
    }
    function outsideDown(t) {
      if (menuOpen && !$('tbMenu').contains(t) && !$('tbPick').contains(t) && (!$('cmpName') || !$('cmpName').contains(t))) menuHide();
      if (ui.tbCloseOut && out && open > 0 && !bar().contains(t) && (!railBtn || !railBtn.contains(t))) setOpen(0, true);
    }

    // Bind whole-card tactile hold, 1:1 free-roam drag-and-drop, and flick gesture on #stageBar
    function wire() {
      const b = bar();
      let startLeft = 14, startTop = 14, dragging = false;

      // Ignore pointerdown inside interactive child controls so scrubbing/clicking them works normally
      const isChildControl = (target) => {
        if (!target || !target.closest) return false;
        return !!target.closest('#tbPick, #labPlay, #labScrub, #viewSeg');
      };

      b.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || isChildControl(e.target)) return;
        const rect = b.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        dragging = false;
        b.classList.add('is-held');
      });

      const clearHeld = () => b.classList.remove('is-held');
      window.addEventListener('pointerup', clearHeld, { passive: true });
      window.addEventListener('pointercancel', clearHeld, { passive: true });

      M.Flick(b, {
        get enabled() { return true; },
        get sensitivity() { return ui.tbPower || 'normal'; },
        ignore(e) { return isChildControl(e.target); },
        onTap(e) {
          b.classList.remove('is-held');
          b.style.transform = '';
          // Tap on #tbToggle or collapsed shell toggles open/close
          if (open === 0 || (e.target && e.target.closest && e.target.closest('#tbToggle'))) {
            toggle(e.shiftKey);
          }
        },
        onDrag(dx, dy, vx) {
          dragging = true;
          const nx = Math.max(8, Math.min(innerWidth - 48, startLeft + dx));
          const ny = Math.max(8, Math.min(innerHeight - 48, startTop + dy));
          b.style.left = Math.round(nx) + 'px';
          b.style.top = Math.round(ny) + 'px';
          b.style.right = 'auto';
          b.dataset.customPos = 'true';
          if (M.level() === 'full') {
            const tilt = Math.max(-9, Math.min(9, (vx || 0) * 4));
            b.style.transform = 'scale(1.06) rotate(' + tilt.toFixed(2) + 'deg)';
          }
        },
        onEnd({ dx, dy, vx, vy, power, axis, dir }) {
          b.classList.remove('is-held');
          b.style.transform = '';
          if (!dragging) return;
          dragging = false;

          const dist = Math.hypot(dx, dy);
          const flickOn = ui.tbFlick !== false;
          const gd = growDir();

          // 1. Short horizontal flick near origin: quick expand/collapse gesture!
          if (flickOn && dist < 75 && power >= 1 && axis === 'x') {
            applyCustomCoords();
            if (dir === gd) {
              setOpen(power >= 2 ? N : Math.min(N, open + 1), true);
              return;
            }
            if (dir === -gd && open > 0 && power === 1) {
              setOpen(open - 1, true);
              return;
            }
          }

          // 2. Strong throw in any direction: arcade physics exit trajectory to the rail!
          if (flickOn && power >= 2) {
            dismiss(vx, vy);
            return;
          }

          // 3. Calm release (stationary hold >90ms or gentle drag): drop toolbar at custom viewport position!
          const rect = b.getBoundingClientRect();
          const clampedX = Math.max(12, Math.min(innerWidth - rect.width - 12, startLeft + dx));
          const clampedY = Math.max(12, Math.min(innerHeight - rect.height - 12, startTop + dy));
          const flip = clampedX > innerWidth * 0.55;
          customPos = { x: clampedX, y: clampedY, flip };
          applyCustomCoords();
          if (M.level() === 'full') {
            b.animate(
              [{ transform: 'scale(1.06)' }, { transform: 'scale(0.97)' }, { transform: 'scale(1)' }],
              { duration: 280, easing: M.spring }
            );
          }
          Log.push('toolbar dropped at (' + Math.round(clampedX) + ', ' + Math.round(clampedY) + ')');
        }
      });

      $('tbPick').addEventListener('click', () => menuShow($('tbPick')));
    }

    return {
      start, wire, toggle, setOpen, dismiss, flyHome, railButton, railClick,
      outsideDown, menuHide, menuShow, syncMenuHighlight, resetPos,
      menuToggle(anchorEl) { if (menuOpen && menuAnchor === (anchorEl || $('tbPick'))) menuHide(); else menuShow(anchorEl); },
      get isMenuOpen() { return menuOpen; },
      get shown() { return out; },
      get hasCustomPos() { return !!customPos; }
    };
  })();

  function freeRect() {
    const pad = 16;
    const w = window.innerWidth, h = window.innerHeight;
    let l = pad, t = pad, r = w - pad, b = h - pad;
    if (dockOpen) {
      const d = dock.getBoundingClientRect();
      if (ui.anchor.endsWith('right')) r = Math.min(r, d.left - pad);
      else if (ui.anchor.endsWith('left')) l = Math.max(l, d.right + pad);
      else if (ui.anchor.startsWith('bottom')) b = Math.min(b, d.top - pad);
      else if (ui.anchor.startsWith('top')) t = Math.max(t, d.bottom + pad);
    }
    return { x: l, y: t, w: Math.max(160, r - l), h: Math.max(120, b - t) };
  }
  function fitStage(animate) {
    if (!def) return;
    const nat = def.size || { width: 420, height: 300 };
    const box = freeRect();
    const fit = $('stageFit');
    fit.style.left = box.x + 'px';
    fit.style.top = box.y + 'px';
    fit.style.width = box.w + 'px';
    fit.style.height = box.h + 'px';
    frameEl.style.width = nat.width + 'px';
    frameEl.style.height = nat.height + 'px';
    const fitScale = Math.min(1, (box.w - 24) / nat.width, (box.h - 24) / nat.height);
    const scale = ui.view === '1x' ? 1 : +fitScale.toFixed(3);
    const s = $('stageScaler');
    if (animate && M.level() === 'full') s.animate([{ transform: s.style.transform || 'scale(1)' }, { transform: 'scale(' + scale + ')' }], { duration: 360, easing: M.springSoft });
    s.style.transform = 'scale(' + scale + ')';
    fit.classList.toggle('is-scroll', ui.view === '1x' && (nat.width > box.w || nat.height > box.h));
  }

  // ---------- Dock positioning ----------
  function cardMaxH() { return Math.min(580, window.innerHeight - 28); }
  function placeDock() {
    const a = ANCHORS.includes(ui.anchor) && ui.anchor !== 'middle-center' ? ui.anchor : 'bottom-right';
    const [v, h] = a.split('-');
    dock.dataset.v = v;
    dock.dataset.h = h;
    dock.style.top = v === 'top' ? '14px' : v === 'middle' ? '50%' : '';
    dock.style.bottom = v === 'bottom' ? '14px' : '';
    dock.style.left = h === 'left' ? '14px' : h === 'center' ? '50%' : '';
    dock.style.right = h === 'right' ? '14px' : '';
    const tx = h === 'center' ? '-50%' : '0';
    const ty = v === 'middle' ? '-50%' : '0';
    dock.style.transform = tx === '0' && ty === '0' ? '' : 'translate(' + tx + ',' + ty + ')';
    const ox = h === 'left' ? '0%' : h === 'right' ? '100%' : '50%';
    const oy = v === 'top' ? '0%' : v === 'bottom' ? '100%' : '50%';
    card.style.transformOrigin = ox + ' ' + oy;
  }
  function relayout(animate) {
    const before = animate ? dock.getBoundingClientRect() : null;
    placeDock();
    fitStage(animate);
    fitPages(null, false);
    if (before && M.level() === 'full') {
      const after = dock.getBoundingClientRect();
      const dx = before.left - after.left, dy = before.top - after.top;
      if (Math.abs(dx) + Math.abs(dy) > 2) dock.animate([{ transform: (dock.style.transform || '') + ' translate(' + dx + 'px,' + dy + 'px)' }, { transform: dock.style.transform || 'none' }], { duration: 420, easing: M.spring });
    }
  }
  function openDock(how) {
    clearTimeout(hoverTimer);
    if (how === 'click') pinned = true;
    if (dockOpen) return;
    dockOpen = true;
    dock.classList.add('is-open');
    card.inert = false;
    fitPages(null, false);
    syncRail(true);
    requestAnimationFrame(() => card.querySelectorAll('.seg').forEach((s) => syncSeg(s, null, s.dataset.value, true)));
    M.cardOpen(card, card.style.transformOrigin);
    fitStage(true);
  }
  function closeDock() {
    clearTimeout(hoverTimer);
    if (!dockOpen) return;
    dockOpen = false;
    pinned = false;
    Arc.close(true);
    Pop.hide();
    dock.classList.remove('is-open');
    card.inert = true;
    fitStage(true);
  }

  function applyMotionPref() {
    const m = ui.motion || 'full';
    document.documentElement.dataset.motion = m === 'full' ? (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'fade' : 'full') : m;
  }

  // ---------- Segmented pills ----------
  function buildSeg(seg, opts, cur, onChange) {
    seg.innerHTML = '<span class="seg-pill"></span>';
    seg.dataset.value = cur;
    const pill = new M.VelocityPill(seg.querySelector('.seg-pill'), 'x');
    seg._pill = pill;
    opts.forEach((o) => {
      const b = el('button', 'seg-btn', esc(o.label));
      b.type = 'button';
      b.dataset.val = o.value;
      b.setAttribute('aria-pressed', same(o.value, cur) ? 'true' : 'false');
      b.addEventListener('click', () => {
        onChange(o.value);
        syncSeg(seg, pill, o.value);
      });
      seg.appendChild(b);
    });
    requestAnimationFrame(() => syncSeg(seg, pill, cur, true));
    return pill;
  }
  function syncSeg(seg, pill, val, instant) {
    if (!seg) return;
    const p = pill || seg._pill;
    seg.dataset.value = val;
    let hit = null;
    seg.querySelectorAll('.seg-btn').forEach((b) => {
      const on = String(b.dataset.val) === String(val);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) hit = b;
    });
    if (p && hit) p.moveTo(hit, instant || !seg.offsetWidth);
  }

  let toastTimer = 0;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('is-on');
    announce(msg);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 2200);
  }

  // ---------- Re-scan component source files live ----------
  async function rescanComponent(btn) {
    if (!def) return;
    const savedValues = Object.assign({}, P);
    await loadComponent(def.id, true);
    Object.keys(savedValues).forEach((k) => {
      if (byId[k]) {
        P[k] = clamp(byId[k], savedValues[k]);
        applyVar(byId[k], P[k]);
      }
    });
    saveValues();
    refreshChanged();
    renderPage(0);
    if (btn) flashOk(btn, 'Scanned');
    toast('Re-scanned ' + def.id + ' source files.');
  }

  // ---------- Stage timeline ----------
  function tick(now) {
    const dt = Math.min(0.05, (now - lastTick) / 1000);
    lastTick = now;
    if (playing && !keyPaused) {
      const rateVar = vars.find((v) => v.master && v.category === 'rate') || byId.SPEED || byId.TEMPO;
      const rate = rateVar ? Number(P[rateVar.id]) || 1 : 1;
      labT = (labT + dt * 0.25 * rate) % 1;
      const sc = $('labScrub');
      if (sc && document.activeElement !== sc) sc.value = labT.toFixed(3);
      if (instance && typeof instance.tick === 'function') {
        try { instance.tick(labT, dt * rate, P); } catch (_) {}
      }
    }
    requestAnimationFrame(tick);
  }

  // ---------- Self-test (?selftest=1) ----------
  async function runSelfTest() {
    const startId = def ? def.id : reg[0];
    const results = [];
    for (const id of reg) {
      try {
        await loadComponent(id, true);
        const okVars = vars.length > 0;
        const sample = vars.find((v) => v.control === 'slider' || v.control === 'radial') || vars[0];
        if (sample) {
          const orig = P[sample.id];
          setValue(sample.id, sample.max != null ? sample.max : orig, { silent: true });
          setValue(sample.id, orig, { silent: true });
        }
        const html = workingFile();
        const okHtml = typeof html === 'string' && html.includes('<!doctype html>');
        results.push({ id, ok: okVars && okHtml, n: vars.length });
      } catch (err) {
        results.push({ id, ok: false, err: String(err) });
      }
    }
    if (startId && reg.includes(startId)) await loadComponent(startId, true);
    const passed = results.filter((r) => r.ok).length;
    const summary = 'Self-test: ' + passed + '/' + results.length + ' components passed (' + results.map((r) => r.id + ':' + (r.ok ? r.n + 'v' : 'FAIL')).join(', ') + ')';
    Log.push(summary);
    toast(summary);
    console.info('[Component Lab Self-Test]', results);
  }

  // ---------- Wire static chrome ----------
  function buildChrome() {
    $('backBtn').innerHTML = svg('back');
    $('backBtn').addEventListener('click', back);
    $('moreBtn').innerHTML = svg('dots');
    $('moreBtn').addEventListener('click', () => Pop.toggle());
    $('closeBtn').innerHTML = svg('close');
    $('closeBtn').addEventListener('click', closeDock);
    $('tbToggle').innerHTML = svg('sliders');
    $('tbChev').innerHTML = svg('chev');
    $('cmpChev').innerHTML = svg('chev');
    $('labPlay').innerHTML = svg('pause');
    $('stage').dataset.bg = ui.stage || 'obsidian';

    // Header component title button opens component picker menu (#tbMenu)
    $('cmpName').addEventListener('click', () => TB.menuToggle($('cmpName')));

    // Hold-to-Compare Default Values on #changedCount (Item 4.1)
    const chgBtn = $('changedCount');
    const startCompare = (e) => {
      if (!def || previewDefaults) return;
      if (e.type === 'pointerdown' && e.button !== 0) return;
      previewDefaults = true;
      chgBtn.classList.add('is-holding');
      applyAll();
      refreshChanged();
    };
    const stopCompare = () => {
      if (!previewDefaults) return;
      previewDefaults = false;
      chgBtn.classList.remove('is-holding');
      applyAll();
      refreshChanged();
    };
    chgBtn.addEventListener('pointerdown', startCompare);
    chgBtn.addEventListener('pointerup', stopCompare);
    chgBtn.addEventListener('pointerleave', stopCompare);
    chgBtn.addEventListener('pointercancel', stopCompare);
    chgBtn.addEventListener('keydown', (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
        e.preventDefault();
        startCompare(e);
      }
    });
    chgBtn.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.key === 'Enter') stopCompare();
    });
    chgBtn.addEventListener('blur', stopCompare);

    modePill = buildSeg($('modeSeg'), [{ value: 'basic', label: 'Basic' }, { value: 'pro', label: 'Pro' }], mode, setMode);
    viewPill = buildSeg($('viewSeg'), [{ value: 'fit', label: 'Fit' }, { value: '1x', label: '1\u00d7' }], ui.view || 'fit', (v) => { ui.view = v; saveUi(); fitStage(true); });

    const resetHold = holdButton('Hold to reset', resetComponent);
    $('footResetSlot').appendChild(resetHold);
    const copyChg = el('button', 'foot-btn', svg('copy') + '<span>Copy changes</span>');
    copyChg.type = 'button'; copyChg.id = 'copyChangesBtn'; copyChg.title = 'Copy only what you changed (compact summary for AI or notes)';
    copyChg.addEventListener('click', () => copyChanges(copyChg));
    const copyAll = el('button', 'foot-btn is-primary', svg('spark') + '<span>Copy working file</span>');
    copyAll.type = 'button'; copyAll.id = 'copyFullBtn'; copyAll.title = 'Copy a complete standalone HTML file with your values baked in (Shift+click downloads it)';
    copyAll.addEventListener('click', (e) => copyFull(copyAll, e.shiftKey));
    $('footActions').append(copyChg, copyAll);

    $('labPlay').addEventListener('click', () => {
      playing = !playing;
      $('labPlay').innerHTML = svg(playing ? 'pause' : 'play');
      $('labPlay').setAttribute('aria-label', playing ? 'Pause timeline' : 'Play timeline');
    });
    $('labScrub').addEventListener('input', (e) => {
      labT = parseFloat(e.target.value) || 0;
      if (instance && typeof instance.tick === 'function') instance.tick(labT, 0, P);
    });

    // Lab-side capture guards for scan-sourced interaction controls (Item 2.3)
    const scaler = $('stageScaler');
    const isScanControl = (id) => byId[id] && byId[id].source === 'scan';
    scaler.addEventListener('pointermove', (e) => {
      if (!def) return;
      if (isScanControl('HOVER') && P.HOVER === 'off' && e.buttons === 0) {
        e.stopImmediatePropagation();
      }
      if (isScanControl('DRAG') && P.DRAG === false && e.buttons !== 0) {
        e.stopImmediatePropagation();
      }
    }, true);
    scaler.addEventListener('pointerdown', (e) => {
      if (!def) return;
      if (isScanControl('TOUCH') && P.TOUCH === false && e.pointerType === 'touch') {
        e.stopImmediatePropagation();
      }
    }, true);
    scaler.addEventListener('click', (e) => {
      if (!def) return;
      if (isScanControl('CLICK') && P.CLICK === false) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }, true);
    scaler.addEventListener('wheel', (e) => {
      if (!def) return;
      if (isScanControl('WHEEL') && P.WHEEL === 'off') {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }, { capture: true, passive: false });
    frameEl.addEventListener('keydown', (e) => {
      if (!def) return;
      if (isScanControl('KEYS') && P.KEYS === false) {
        e.stopImmediatePropagation();
        return;
      }
      if (e.key === ' ' && byId.KEY_PAUSE && P.KEY_PAUSE !== false) {
        const tag = (e.target && e.target.tagName) || '';
        if (!/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(tag)) {
          e.preventDefault();
          keyPaused = !keyPaused;
          toast(keyPaused ? 'Timeline paused (Space)' : 'Timeline resumed');
        }
      }
    }, true);

    TB.wire();
    buildRail();
    syncHeadTools();
    placeDock();
    card.inert = true;

    // Hover-to-open dock & focus pinning so keyboard Tab does not auto-close the dock (Item 2.6)
    dock.addEventListener('focusin', () => {
      if (dockOpen) pinned = true;
    });
    rail.addEventListener('mouseenter', () => {
      if (ui.openOn === 'hover' && !dockOpen) { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => openDock('hover'), 70); }
    });
    dock.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
    dock.addEventListener('mouseleave', () => {
      if (ui.openOn === 'hover' && dockOpen && !pinned && !Arc.isOpen && !dock.contains(document.activeElement)) {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(closeDock, 260);
      }
    });
    document.addEventListener('pointerdown', (e) => {
      if (Arc.isOpen && !Arc.contains(e.target)) Arc.close();
      if (Pop.isOpen && !Pop.contains(e.target)) Pop.hide();
      TB.outsideDown(e.target);
      if (dockOpen && !dock.contains(e.target) && !Arc.contains(e.target)) closeDock();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (Arc.isOpen) { Arc.close(false, true); e.preventDefault(); }
        else if (Pop.isOpen) { Pop.hide(true); e.preventDefault(); }
        else if (TB.isMenuOpen) { TB.menuHide(); e.preventDefault(); }
        else if (navStack.length > 1) { back(); e.preventDefault(); }
        else if (dockOpen) { closeDock(); e.preventDefault(); }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'z' || e.key === 'Z' || e.key === 'y' || e.key === 'Y')) {
        const a = document.activeElement;
        const texty = a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && a.type === 'text') || a.isContentEditable);
        if (dockOpen && !texty && def) {
          e.preventDefault();
          if (e.key === 'y' || e.key === 'Y' || e.shiftKey) Hist.redo();
          else Hist.undo();
        }
      }
    });
    window.addEventListener('resize', () => { Arc.close(true); Pop.hide(); TB.menuHide(); placeDock(); fitStage(false); fitPages(null, false); });
    window.addEventListener('hashchange', () => {
      const h = S.readHash();
      if (h.c && reg.includes(h.c) && (!def || h.c !== def.id)) loadComponent(h.c, true);
    });
  }

  async function init() {
    // URL escape hatch: ?reset clears componentLab:v2:* keys and strips ?reset from URL (Item 2.5)
    try {
      const url = new URL(location.href);
      if (url.searchParams.has('reset')) {
        store.clearAll();
        Object.keys(ui).forEach((k) => delete ui[k]);
        Object.assign(ui, {
          mode: 'basic', anchor: 'bottom-right', openOn: 'hover', motion: 'full', stage: 'obsidian',
          view: 'fit', accVariant: 'B', accCollapse: 'remember', genInteract: true,
          railOrder: CAT_IDS.slice(), railHidden: [], toolOrder: TOOL_IDS.slice(), toolHidden: [],
          tbOut: true, tbGroups: 0, tbInit: 'icon', tbCloseOut: false, tbFlick: true, tbPower: 'normal'
        });
        mode = ui.mode;
        url.searchParams.delete('reset');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    } catch (_) {}

    applyMotionPref();
    buildChrome();
    await loadRegistry();
    const h = S.readHash();
    const first = (h.c && reg.includes(h.c)) ? h.c : reg[0];
    requestAnimationFrame(tick);
    try {
      await loadComponent(first, true);
    } finally {
      TB.start();
      openDock('click');
      requestAnimationFrame(() => document.querySelector('.lab').classList.add('is-ready'));
    }

    // Smoke self-test: ?selftest=1 (Item 4.6)
    try {
      const url = new URL(location.href);
      if (url.searchParams.get('selftest') === '1') {
        setTimeout(() => runSelfTest(), 250);
      }
    } catch (_) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
