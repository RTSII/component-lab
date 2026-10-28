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
  const VIEWS = [{ id: 'fit', label: 'Fit' }, { id: '1600x770', label: '1600Ã—770', w: 1600, h: 770 }, { id: '1366x768', label: '1366Ã—768', w: 1366, h: 768 }];
  const MARGIN = 16;
  const BASIC_CAP = 8;
  const RAIL_W = 46;

  // Central declarative map for Basic vs. Pro feature gating.
  const PRO_FEATURES = {
    accordion: true,        // Single scrolling panel with mini-cards + Advanced folds
    starCurate: true,       // â˜… buttons to curate Basic's 8 featured controls
    signatureMarks: true,   // Sparkle icon on signature controls + where/hint subtitles
    sectionMenu: true,      // â‹® menu & Pro section collapse/motion settings (A/B/C/D)
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
    return (isNaN(n) ? val : n.toFixed(decimals(v.step))) + (v.unit ? (v.unit === 'Ã—' || v.unit === 'Â°' ? v.unit : ' ' + v.unit) : '');
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
    if (v.unit === 'Ã—') return String(val);
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
    if (rescanToast) toast('Component files changed â€” controls re-scanned.', 4200);
    else if (auto) toast('No manifest.json, so the controls were made by auto-scan. Settings â€º Save to disk keeps them.', 5200);
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
    $('vpTag').textContent = view.w ? view.w + ' Ã— ' + view.h + ' viewport' : '';
    $('stageNote').textContent = def.title + '  Â·  frame ' + f.w + ' Ã— ' + f.h + (view.w ? '  in ' + view.label : '') + '  Â·  ' + Math.round(s * 100) + '%';
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
          ? 'Slot ' + k + ' saved Â· Click to load Â· Shift+Click to overwrite Â· Alt+Click or Right-click to clear'
          : 'Slot ' + k + ' empty Â· Click to save current look';
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
      return total + ' controls Â· ' + cats.filter((c) => c.n).length + ' sections';
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
        b.type = 'button'; b.dataset.variant = v.id; b.title = v.id + ' Â· ' + v.hint;
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


  // ---------- footer: terminal log ----------
  // Last two actions, newest first and brightest. A slider drag updates its own line in place
  // (from-value kept) instead of adding a line per step.
  const Log = (function () {
    let lines = [];
    let idleN = 0;
    function paint() {
      const box = $('footLog');
      if (!box) return;
      const show = lines.length ? lines : [{ text: idleN ? idleN + ' changed (restored)' : 'no changes yet', idle: true }];
      box.innerHTML = show.slice(0, 2).map((l, i) => '<div class="log-line' + (i ? ' is-old' : '') + (l.idle ? ' is-idle' : '') + (l.kind ? ' is-' + l.kind : '') + '"><span class="log-caret">&gt;</span> ' + esc(l.text) + '</div>').join('');
    }
    function add(entry) {
      lines.unshift(entry);
      lines = lines.slice(0, 2);
      paint();
      const nl = $('footLog') && $('footLog').firstElementChild;
      if (nl && M.level() === 'full') nl.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: M.easeOut });
    }
    return {
      change(v, from, to) {
        const head = lines[0];
        if (head && head.key === v.id) { head.to = to; head.text = v.label.toLowerCase() + ' ' + fmt(v, head.from) + ' \u2192 ' + fmt(v, to); paint(); return; }
        add({ key: v.id, from, to, text: v.label.toLowerCase() + ' ' + fmt(v, from) + ' \u2192 ' + fmt(v, to) });
      },
      push(text, kind) { add({ text, kind }); },
      idle(n) { idleN = n; if (!lines.length) paint(); },
      clear() { lines = []; paint(); },
      get lines() { return lines.map((l) => l.text); }
    };
  })();
  function announce(text) { const a = $('footLive'); if (a) { a.textContent = ''; setTimeout(() => { a.textContent = text; }, 30); } }
  function flashOk(btn, ok) {
    if (!btn) return;
    const ico = btn.querySelector('.ico');
    clearTimeout(btn._f);
    btn.classList.remove('is-ok', 'is-bad');
    btn.classList.add(ok ? 'is-ok' : 'is-bad');
    if (ok) btn.innerHTML = svg('check');
    btn._f = setTimeout(() => { btn.classList.remove('is-ok', 'is-bad'); btn.innerHTML = svg(btn.dataset.icon); }, 1200);
    if (ok && M.level() === 'full') { const c = btn.querySelector('.ico'); if (c) c.animate([{ transform: 'scale(0.6)', opacity: 0.2 }, { transform: 'scale(1)', opacity: 1 }], { duration: 260, easing: M.spring }); }
    return ico;
  }

  // ---------- wire export.js module ----------
  const exportMod = window.Lab.initExport({
    $, el, esc, KEY, store, toast, fetchText,
    getDef: () => def, getMan: () => man, getVars: () => vars, getP: () => P, getUi: () => ui,
    getOffset: () => offset, getPlaying: () => playing, getBindStyle: () => bindStyle,
    changedVars, interactVars, fmt, cssVal, frameKeyFor, wrap,
    flashOk, announce, Log,
    reloadAfterImport: () => {
      Object.assign(ui, store.get('ui', {}));
      if (ui.anchor === 'middle-center') ui.anchor = 'top-right';
      M.enabled = ui.motion !== false;
      document.documentElement.classList.toggle('no-motion', !ui.motion);
      if (def) loadComponent(def.id, false).then(() => relayout());
    }
  });
  const { manifestForExport, saveManifest, copyText, interactionText, changesText, copyChanges, workingFile, copyFull, exportLabData, importLabData } = exportMod;

  // ---------- settings ----------
  function section(inner, title) { inner.appendChild(el('div', 'ctl-label sub sec', esc(title))); }
  const CAT_ORDER = {
    name: 'rail', items: () => orderedCats(), present: (id) => hasCat(id), min: 1,
    order: () => (Array.isArray(ui.railOrder) ? ui.railOrder : []), setOrder: (ids) => { ui.railOrder = ids; },
    hidden: () => railHidden(), setHidden: (h) => { ui.railHidden = h; },
    hiddenTitle: 'Hidden from the rail (Pro section stays)', minMsg: 'Keep at least one category on the rail.',
    note: 'Pro sections follow this order. Settings always stays on the rail.'
  };
  const TOOL_ORDER = {
    name: 'rail actions', items: () => orderedTools(), present: () => true, min: 0,
    order: () => (Array.isArray(ui.toolOrder) ? ui.toolOrder : []), setOrder: (ids) => { ui.toolOrder = ids; },
    hidden: () => toolHidden(), setHidden: (h) => { ui.toolHidden = h; },
    hiddenTitle: 'Hidden from the rail', minMsg: '',
    note: 'Below the categories. Settings is always last and always shown.'
  };
  function railOrderEl(spec) {
    spec = spec || CAT_ORDER;
    const box = el('div', 'order-box');
    const listEl = el('div', 'order-list');
    listEl.setAttribute('role', 'list');
    const present = (id) => spec.present(id);
    const commit = (ids, msg) => {
      spec.setOrder(ids); saveUi();
      buildRail();
      paint(msg);
    };
    function moveTo(from, to) {
      const ids = spec.items().map((c) => c.id);
      if (to < 0 || to >= ids.length || from === to) return;
      const [x] = ids.splice(from, 1);
      ids.splice(to, 0, x);
      commit(ids);
      Log.push(spec.name + ' order: ' + ids.join(' · '));
      const b = listEl.querySelector('.order-row[data-cat="' + x + '"] .order-grip');
      if (b) b.focus({ preventScroll: true });
    }
    function paint() {
      const first = {};
      listEl.querySelectorAll('.order-row').forEach((r) => { first[r.dataset.cat] = r.getBoundingClientRect().top; });
      listEl.innerHTML = '';
      const cats = spec.items();
      cats.forEach((c, i) => {
        const hidden = spec.hidden().includes(c.id);
        const row = el('div', 'order-row' + (present(c.id) ? '' : ' is-absent') + (hidden ? ' is-hidden' : ''));
        row.dataset.cat = c.id;
        row.setAttribute('role', 'listitem');
        const grip = el('button', 'order-grip', '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="7" r="1.3" class="fill"/><circle cx="15" cy="7" r="1.3" class="fill"/><circle cx="9" cy="12" r="1.3" class="fill"/><circle cx="15" cy="12" r="1.3" class="fill"/><circle cx="9" cy="17" r="1.3" class="fill"/><circle cx="15" cy="17" r="1.3" class="fill"/></svg>');
        grip.type = 'button';
        grip.setAttribute('aria-label', 'Move ' + c.label + ' (drag, or Alt+Arrow keys)');
        grip.title = 'Drag to reorder';
        const name = el('span', 'order-name', svg(c.icon) + '<span>' + esc(c.label) + '</span>' + (present(c.id) ? '' : '<em>not in this one</em>'));
        const up = el('button', 'icon-btn order-arrow', '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14l5-5 5 5"/></svg>');
        up.type = 'button'; up.disabled = i === 0; up.setAttribute('aria-label', 'Move ' + c.label + ' up'); up.title = 'Up';
        const dn = el('button', 'icon-btn order-arrow', '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>');
        dn.type = 'button'; dn.disabled = i === cats.length - 1; dn.setAttribute('aria-label', 'Move ' + c.label + ' down'); dn.title = 'Down';
        const eye = el('button', 'icon-btn order-eye' + (hidden ? '' : ' is-on'), '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (hidden ? '<path d="M4 4l16 16"/><path d="M9.9 6.2A9 9 0 0 1 21 12a14 14 0 0 1-2.6 3.3M6.3 7.4A14 14 0 0 0 3 12c1.8 3.6 5 6 9 6a8 8 0 0 0 3.4-.8"/>' : '<path d="M3 12c1.8-3.6 5-6 9-6s7.2 2.4 9 6c-1.8 3.6-5 6-9 6s-7.2-2.4-9-6z"/><circle cx="12" cy="12" r="2.6"/>') + '</svg>');
        eye.type = 'button';
        eye.setAttribute('aria-pressed', hidden ? 'false' : 'true');
        eye.setAttribute('aria-label', (hidden ? 'Show ' : 'Hide ') + c.label + ' on the rail');
        eye.title = hidden ? spec.hiddenTitle : 'Shown on the rail';
        up.addEventListener('click', () => moveTo(i, i - 1));
        dn.addEventListener('click', () => moveTo(i, i + 1));
        grip.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); moveTo(i, i + (e.key === 'ArrowUp' ? -1 : 1)); }
        });
        eye.addEventListener('click', () => {
          const h = spec.hidden().slice();
          const k = h.indexOf(c.id);
          if (k < 0) {
            if (spec.min && cats.length - h.length <= spec.min) { toast(spec.minMsg); return; }
            h.push(c.id);
          } else h.splice(k, 1);
          spec.setHidden(h); saveUi();
          buildRail();
          Log.push((k < 0 ? 'rail hide ' : 'rail show ') + c.label.toLowerCase());
          paint();
          const e2 = listEl.querySelector('.order-row[data-cat="' + c.id + '"] .order-eye');
          if (e2) e2.focus({ preventScroll: true });
        });
        grip.addEventListener('pointerdown', (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          grip.setPointerCapture(e.pointerId);
          const rows = [...listEl.children];
          const i0 = rows.indexOf(row), h = row.offsetHeight + 4, y0 = e.clientY;
          let target = i0, moved = false;
          row.classList.add('is-drag');
          const mv = (ev) => {
            const dy = ev.clientY - y0;
            if (Math.abs(dy) > 3) moved = true;
            target = Math.max(0, Math.min(rows.length - 1, i0 + Math.round(dy / h)));
            row.style.transform = 'translateY(' + dy + 'px)';
            rows.forEach((r, j) => {
              if (r === row) return;
              const sh = j > i0 && j <= target ? -h : j < i0 && j >= target ? h : 0;
              r.style.transform = sh ? 'translateY(' + sh + 'px)' : '';
            });
          };
          const upf = () => {
            grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', upf); grip.removeEventListener('pointercancel', upf);
            row.classList.remove('is-drag');
            rows.forEach((r) => { r.style.transform = ''; });
            if (moved && target !== i0) moveTo(i0, target);
          };
          grip.addEventListener('pointermove', mv);
          grip.addEventListener('pointerup', upf);
          grip.addEventListener('pointercancel', upf);
        });
        row.append(grip, name, up, dn, eye);
        listEl.appendChild(row);
      });
      if (M.level() === 'full') listEl.querySelectorAll('.order-row').forEach((r) => {
        const t0 = first[r.dataset.cat];
        if (t0 == null) return;
        const dy = t0 - r.getBoundingClientRect().top;
        if (Math.abs(dy) > 1) r.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 360, easing: M.springSoft });
      });
      reset.disabled = !spec.order().length && !spec.hidden().length;
    }
    const foot = el('div', 'order-foot');
    const reset = el('button', 'link-btn', 'Reset to default order');
    reset.type = 'button';
    reset.addEventListener('click', () => { spec.setOrder([]); spec.setHidden([]); saveUi(); buildRail(); paint(); Log.push(spec.name + ' order reset'); toast('Rail back to the default order.'); });
    foot.append(el('span', 'note', spec.note), reset);
    box.append(listEl, foot);
    paint();
    return box;
  }
  function switchRow(label, get, set, note) {
    const sw = el('button', 'switch', '<span class="knob"></span>');
    sw.type = 'button';
    sw.setAttribute('role', 'switch');
    sw.setAttribute('aria-label', label);
    const sync = () => sw.setAttribute('aria-checked', get() ? 'true' : 'false');
    sync();
    sw.addEventListener('click', () => { set(!get()); sync(); Log.push(label.toLowerCase() + (get() ? ' on' : ' off')); });
    const row = el('div', 'ctl ctl-inline');
    const h = el('div', 'ctl-head');
    h.append(el('span', 'ctl-label', esc(label)), sw);
    row.appendChild(h);
    if (note) row.appendChild(el('p', 'note', note));
    return row;
  }
  function setRow(label, ctl, note) {
    const row = el('div', 'ctl');
    const head = el('div', 'ctl-head');
    head.appendChild(el('span', 'ctl-label', esc(label)));
    row.appendChild(head);
    if (ctl) row.appendChild(ctl);
    if (note) row.appendChild(el('p', 'note', note));
    return row;
  }
  function relayout() {
    applyDockLayout();
    layoutStage();
    requestAnimationFrame(() => { fitPages(null, false); syncRail(true); document.querySelectorAll('.seg').forEach((sg) => syncSeg(sg, null, sg.dataset.value, true)); });
  }
  function buildSettings(inner) {
    section(inner, 'Dock');
    const pos = el('div', 'seg seg-sm');
    buildSeg(pos, [{ value: 'right', label: 'Right' }, { value: 'bottom', label: 'Bottom' }], ui.dockPos, (val) => {
      ui.dockPos = val; saveUi();
      grid.classList.toggle('is-disabled', val === 'bottom');
      relayout();
    }, { equal: true });
    inner.appendChild(setRow('Position', pos));

    const grid = el('div', 'anchor-grid' + (ui.dockPos === 'bottom' ? ' is-disabled' : ''));
    grid.setAttribute('role', 'radiogroup');
    grid.setAttribute('aria-label', 'Anchor');
    ANCHORS.forEach((a) => {
      const b = el('button', 'anchor-dot' + (a === ui.anchor ? ' is-on' : ''), '<i></i>');
      b.type = 'button';
      b.setAttribute('aria-label', 'Anchor ' + a.replace('-', ' '));
      if (a === 'middle-center') {
        b.disabled = true;
        b.title = 'Center anchor disabled (covers component stage)';
      } else {
        b.title = a.replace('-', ' ');
        b.addEventListener('click', () => {
          if (ui.dockPos === 'bottom') { toast('Anchor applies to the right dock.'); return; }
          ui.anchor = a; saveUi();
          grid.querySelectorAll('.anchor-dot').forEach((x) => x.classList.toggle('is-on', x === b));
          relayout();
        });
      }
      grid.appendChild(b);
    });
    const anchorRow = setRow('Anchor', grid, 'The card stays pinned here and grows away from it.');
    inner.appendChild(anchorRow);

    section(inner, 'Behaviour');
    const sw = el('button', 'switch', '<span class="knob"></span>');
    sw.type = 'button';
    sw.setAttribute('role', 'switch');
    sw.setAttribute('aria-checked', ui.motion ? 'true' : 'false');
    sw.setAttribute('aria-label', 'Animations');
    sw.addEventListener('click', () => {
      ui.motion = !ui.motion; saveUi();
      M.enabled = ui.motion;
      sw.setAttribute('aria-checked', ui.motion ? 'true' : 'false');
      document.documentElement.classList.toggle('no-motion', !ui.motion);
      toast(ui.motion ? 'Animations on' + (M.level() === 'fade' ? ' (fades only: your system asks for reduced motion)' : '') : 'Animations off');
    });
    const mrow = el('div', 'ctl ctl-inline');
    const mh = el('div', 'ctl-head');
    mh.append(el('span', 'ctl-label', 'Animations'), sw);
    mrow.appendChild(mh);
    inner.appendChild(mrow);

    if (hasPro('userPalette')) {
      const up = userPalette();
      const src = el('div', 'seg seg-sm');
      buildSeg(src, [{ value: 'project', label: 'Project' }, { value: 'user', label: 'My palette', disabled: !up, hint: 'Save a palette under My palette first' }], up ? ui.paletteSource : 'project', (val) => { ui.paletteSource = val; saveUi(); toast('Swatches now come from ' + (val === 'user' ? 'My palette' : 'the project CSS')); }, { equal: true });
      inner.appendChild(setRow('Palette source', src, up ? null : 'Save a palette under My palette to use it here.'));

      const nav = el('button', 'nav-row', svg('user') + '<span>My palette</span><span class="nav-meta">' + (up ? up.length + ' colours' : 'not set') + '</span>' + svg('chev'));
      nav.type = 'button';
      nav.addEventListener('click', () => push({ type: 'user' }));
      inner.appendChild(nav);
    }

    if (hasPro('railCustomize')) {
      section(inner, 'Rail order');
      inner.appendChild(railOrderEl(CAT_ORDER));
      inner.appendChild(el('div', 'ctl-label sub', 'Rail actions'));
      inner.appendChild(railOrderEl(TOOL_ORDER));
    }

    section(inner, 'Viewport');
    const vps = el('div', 'seg seg-sm');
    vps.dataset.set = 'viewport';
    buildSeg(vps, [VIEWS[1], VIEWS[2], VIEWS[0]].map((x) => ({ value: x.id, label: x.label })), ui.view, (val) => setView(val), { equal: true });
    inner.appendChild(setRow('Sandbox frame', vps, '1600\u00d7770 is the default: the HP laptop (Chrome on a 1600\u00d7900 screen). 1366\u00d7768 and Fit are extra checks.'));

    section(inner, 'Toolbar');
    const tbShowRow = switchRow('Show toolbar icon', () => TB.shown, (on) => TB.setOut(on), 'The floating toolbar over the stage. Grab anywhere on its shell to drag & drop it for this session, or throw it hard to launch an arcade exit!');
    tbShowRow.id = 'tbShowSwitchRow';
    inner.appendChild(tbShowRow);
    if (TB.hasCustomPos) {
      const resetPosBtn = el('button', 'link-btn', 'Reset toolbar position to default corner');
      resetPosBtn.type = 'button';
      resetPosBtn.addEventListener('click', () => {
        TB.resetPos();
        toast('Toolbar returned to default corner.');
        renderPage(0);
      });
      inner.appendChild(resetPosBtn);
    }
    if (hasPro('toolbarAdvanced')) {
      inner.appendChild(el('p', 'note tb-gestures', 'Gestures on the toolbar: click opens/closes all groups · Shift+click or \u2190/\u2192 one group · drag & release calmly to drop at a custom spot · short horizontal flick opens/closes · strong throw launches an arcade exit to the rail.'));
      const tbs = el('div', 'seg seg-sm');
      tbs.dataset.tb = 'start';
      buildSeg(tbs, [{ value: 'closed', label: 'Closed' }, { value: 'open', label: 'Open' }, { value: 'remember', label: 'Remember' }], ui.tbStart, (val) => { ui.tbStart = val; saveUi(); Log.push('toolbar start ' + val); }, { equal: true });
      inner.appendChild(setRow('Start state', tbs, 'How the toolbar opens when the lab loads. Remember reopens the groups you had open.'));
      inner.appendChild(switchRow('Outside click closes it', () => ui.tbAutoClose, (on) => { ui.tbAutoClose = on; saveUi(); }));
      inner.appendChild(switchRow('Flick physics', () => ui.flick, (on) => { ui.flick = on; M.flickOn = on; saveUi(); fs.querySelectorAll('.seg-btn').forEach((b) => { b.disabled = !on; }); }, 'Flick the rail toolbar button toward the stage to throw the toolbar out; flick or throw the toolbar to launch it back.'));
      const fs = el('div', 'seg seg-sm');
      fs.dataset.tb = 'flick';
      buildSeg(fs, [{ value: 'light', label: 'Light' }, { value: 'normal', label: 'Normal' }, { value: 'heavy', label: 'Heavy' }], ui.flickStrength, (val) => { ui.flickStrength = val; M.flickStrength = val; saveUi(); Log.push('flick ' + val); }, { equal: true });
      if (!ui.flick) fs.querySelectorAll('.seg-btn').forEach((b) => { b.disabled = true; });
      inner.appendChild(setRow('Flick strength', fs, 'Light: a soft flick is enough. Heavy: needs a fast, long flick.'));
    }

    if (hasPro('sectionMenu')) {
      section(inner, 'Pro sections');
      const col = el('div', 'seg seg-sm');
      col.dataset.acc = 'collapse';
      buildSeg(col, COLLAPSE.map((c) => ({ value: c.id, label: c.label })), ui.accCollapse, (val) => Acc.setCollapse(val), { equal: true });
      inner.appendChild(setRow('Collapse state', col, 'Remember reopens what you had open, per component.'));
      const vseg = el('div', 'seg seg-sm');
      vseg.dataset.acc = 'variant';
      buildSeg(vseg, VARIANTS.map((v) => ({ value: v.id, label: v.id + ' ' + v.label })), ui.accVariant, (val) => Acc.setVariant(val), { equal: true });
      inner.appendChild(setRow('Section motion', vseg, 'B spring morph is the default. A slide + fade · C stagger rows · D one open, rest as chips. Also in the \u22ee menu.'));
    }

    if (hasPro('manifestTools')) {
      const scan = (man && man.scan) || [];
      if (scan.length) {
        section(inner, 'Interaction scan');
        const ia = interactVars();
        inner.appendChild(el('p', 'note', 'Found in the code: ' + esc(scan.map((x) => x.label + ' (' + x.evidence + ')').join(', ')) + '. '
          + (ia.length ? 'Controls: ' + esc(ia.map((v) => v.label).join(', ')) + '.' : 'Not exposed as controls yet; add "interact" vars to manifest.json (README › Interaction).')));
      }

      section(inner, 'Manifest');
      const btns = el('div', 'btn-row');
      const save = el('button', 'btn', 'Save to disk');
      save.type = 'button';
      if (def && def.id === '_template') {
        save.disabled = true;
        save.title = '_template is read-only; use Export JSON instead';
      } else {
        save.title = 'Write components/' + def.id + '/manifest.json (stars included)';
        save.addEventListener('click', saveManifest);
      }
      const exp = el('button', 'btn', 'Export JSON');
      exp.type = 'button';
      exp.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(manifestForExport(), null, 2) + '\n'], { type: 'application/json' });
        const a = el('a');
        a.href = URL.createObjectURL(blob);
        a.download = def.id + '.manifest.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      });
      const rescan = el('button', 'btn', 'Re-scan files');
      rescan.type = 'button';
      rescan.title = 'Re-scan CSS, HTML, and JS source files for this component';
      rescan.addEventListener('click', () => {
        if (!def) return;
        store.del('manifest:' + def.id);
        loadComponent(def.id, false).then(() => { go({ type: 'settings' }); toast('Re-scanned ' + def.title + ' source files.'); });
      });
      btns.append(save, exp, rescan);
      inner.appendChild(btns);
    }

    section(inner, 'Backup & Reset');
    const bkBtns = el('div', 'btn-row');
    const expBk = el('button', 'btn', 'Export lab data');
    expBk.type = 'button';
    expBk.title = 'Download all saved values, stars, snapshots, palettes & UI settings as JSON';
    expBk.addEventListener('click', exportLabData);
    const impBk = el('button', 'btn', 'Import lab data');
    impBk.type = 'button';
    impBk.title = 'Restore saved lab data from a backup JSON file';
    impBk.addEventListener('click', importLabData);
    bkBtns.append(expBk, impBk);
    inner.appendChild(bkBtns);

    inner.appendChild(holdButton('Hold to reset all', 1200, () => {
      store.del('values:' + def.id);
      store.del('featured:' + def.id);
      store.del('manifest:' + def.id);
      store.del('accOpen:' + def.id);
      store.del('snaps:' + def.id);
      vars.forEach((v) => { P[v.id] = v.default; });
      loadComponent(def.id, false).then(() => { go({ type: 'settings' }); toast('Reset: every value, snapshot, star and saved scan for ' + def.title + '.'); });
    }));
    inner.appendChild(el('p', 'note', 'Resets every value, snapshot and star for this component.'));

    const resetUiBtn = el('button', 'link-btn', 'Reset lab layout & settings');
    resetUiBtn.type = 'button';
    resetUiBtn.addEventListener('click', () => {
      store.del('ui');
      Object.assign(ui, {
        dockPos: 'right', anchor: 'top-right', mode: 'basic', motion: true, paletteSource: 'project',
        view: '1600x770', open: true, accCollapse: 'remember', accVariant: 'B',
        tbOut: true, tbStart: 'closed', tbAutoClose: true, tbLast: [], flick: true, flickStrength: 'normal',
        railOrder: [], railHidden: [], toolOrder: [], toolHidden: []
      });
      saveUi();
      M.enabled = true;
      M.flickOn = true;
      M.flickStrength = 'normal';
      document.documentElement.classList.remove('no-motion');
      TB.resetPos();
      TB.setOut(true);
      setMode('basic');
      relayout();
      go({ type: 'settings' });
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
    return def.title;
  }

  // ---------- my palette ----------
  function buildUser(inner) {
    const cur = userPalette() || [];
    const slots = [];
    inner.appendChild(el('p', 'note', 'Four to six colours. The lab works out which is the accent, text and surface.'));
    const grid = el('div', 'user-grid');
    for (let i = 0; i < 6; i++) {
      const c = cur[i] || '';
      const cell = el('div', 'user-slot' + (c ? '' : ' is-empty'));
      const col = el('input', 'color-in');
      col.type = 'color'; col.value = c || '#808080'; col.setAttribute('aria-label', 'Colour ' + (i + 1));
      const hx = el('input', 'hex-in');
      hx.type = 'text'; hx.value = c.toUpperCase(); hx.placeholder = '#'; hx.maxLength = 7; hx.spellcheck = false; hx.setAttribute('aria-label', 'Hex ' + (i + 1));
      col.addEventListener('input', () => { hx.value = col.value.toUpperCase(); cell.classList.remove('is-empty'); });
      hx.addEventListener('input', () => { const ok = /^#?[0-9a-f]{6}$/i.test(hx.value.trim()); hx.classList.toggle('is-bad', !!hx.value && !ok); if (ok) { col.value = S.hex('#' + hx.value.trim().replace('#', '')); cell.classList.remove('is-empty'); } });
      cell.append(col, hx);
      grid.appendChild(cell);
      slots.push(hx);
    }
    inner.appendChild(grid);
    const pick = el('button', 'link-btn', 'Fill from project palette');
    pick.type = 'button';
    pick.addEventListener('click', () => {
      projectPalette.slice(0, 6).forEach((c, i) => { slots[i].value = c.toUpperCase(); slots[i].dispatchEvent(new Event('input')); slots[i].previousSibling.value = c; });
    });
    inner.appendChild(pick);
    const row = el('div', 'btn-row');
    const save = el('button', 'btn btn-primary', 'Save palette');
    save.type = 'button';
    save.addEventListener('click', () => {
      const cols = slots.map((s) => s.value.trim()).filter((s) => /^#?[0-9a-f]{6}$/i.test(s)).map((s) => S.hex('#' + s.replace('#', '')));
      if (cols.length < 4) { toast('Add at least four colours.'); return; }
      store.set('userPalette', cols);
      toast('Saved. Choose "My palette" as the palette source in Settings to use it.');
      back();
    });
    const clear = el('button', 'btn', 'Clear');
    clear.type = 'button';
    clear.addEventListener('click', () => { store.del('userPalette'); if (ui.paletteSource === 'user') { ui.paletteSource = 'project'; saveUi(); } toast('My palette cleared.'); back(); });
    row.append(save, clear);
    inner.appendChild(row);
    return cur.length ? cur.length + ' saved' : 'Not set';
  }

  // ---------- new component stepper: kind -> palette -> name ----------
  const STEP_NAMES = ['Kind', 'Palette', 'Name'];
  function startNew() {
    newDraft = { kind: 'card', palette: 'project', name: '' };
    go({ type: 'new', step: 0 });
  }
  function kindList() {
    const k = (kindsInfo && kindsInfo.kinds) || { card: { label: 'Card', desc: 'Title, text, action' } };
    return Object.entries(k).map(([id, x]) => ({ id, label: x.label || id, desc: x.desc || '', featured: x.featured || [] }));
  }
  const KIND_GLYPH = {
    card: '<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 10h8M8 14h5"/>',
    nav: '<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M7 12h3M14 12h3"/>',
    hero: '<path d="M5 8h14M5 12h10M5 16h6"/>',
    'animated-background': '<path d="M3 15c3 0 3-6 6-6s3 6 6 6 3-6 6-6"/><path d="M3 19c3 0 3-4 6-4s3 4 6 4 3-4 6-4" opacity=".5"/>',
    list: '<path d="M9 7h11M9 12h11M9 17h11"/><circle cx="5" cy="7" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="17" r="1"/>',
    button: '<rect x="4" y="8" width="16" height="8" rx="4"/><path d="M9 12h6"/>'
  };
  function paletteOptions() {
    const out = [{ id: 'project', name: 'Project palette', colors: S.rolesFrom(projectPalette.slice(0, 8)) || null, dots: projectPalette.slice(0, 5) }];
    presets.forEach((p) => out.push({ id: p.id, name: p.name, colors: p.colors, dots: [p.colors.accent, p.colors.text, p.colors.surface, p.colors.muted] }));
    const up = userPalette();
    out.push({ id: 'user', name: 'My palette', colors: up ? S.rolesFrom(up) : null, dots: up || [], disabled: !up });
    return out;
  }
  function slugify(s) { return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40); }
  function buildNew(spec, inner) {
    const step = spec.step || 0;
    const bars = el('div', 'steps');
    STEP_NAMES.forEach((n, i) => bars.appendChild(el('div', 'step' + (i < step ? ' is-done' : i === step ? ' is-on' : ''), '<i></i><span>' + (i + 1) + ' · ' + n + '</span>')));
    inner.appendChild(bars);
    const body = el('div', 'step-body');
    inner.appendChild(body);
    if (step === 0) {
      body.appendChild(el('p', 'note', 'What are you building? This picks the starter markup and which controls are featured in Basic.'));
      const tiles = el('div', 'tiles');
      tiles.setAttribute('role', 'radiogroup');
      tiles.appendChild(el('span', 'tile-ind'));
      kindList().forEach((k) => {
        const t = el('button', 'tile' + (k.id === newDraft.kind ? ' is-on' : ''), '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (KIND_GLYPH[k.id] || KIND_GLYPH.card) + '</svg><strong>' + esc(k.label) + '</strong><span>' + esc(k.desc) + '</span>');
        t.type = 'button';
        t.dataset.kind = k.id;
        t.setAttribute('role', 'radio');
        t.setAttribute('aria-checked', k.id === newDraft.kind ? 'true' : 'false');
        t.addEventListener('click', () => { newDraft.kind = k.id; tiles.querySelectorAll('.tile').forEach((x) => { x.classList.toggle('is-on', x === t); x.setAttribute('aria-checked', x === t ? 'true' : 'false'); }); syncTiles(inner.parentNode); });
        tiles.appendChild(t);
      });
      body.appendChild(tiles);
    } else if (step === 1) {
      body.appendChild(el('p', 'note', 'Starting colours. Found in the project CSS; change them any time.'));
      const list = el('div', 'pal-list');
      paletteOptions().forEach((p) => {
        const b = el('button', 'pal-opt' + (p.id === newDraft.palette ? ' is-on' : '') + (p.disabled ? ' is-disabled' : ''), '<span class="preset-dots">' + p.dots.slice(0, 5).map((c) => '<i style="background:' + c + '"></i>').join('') + '</span><span class="pal-name">' + esc(p.name) + '</span>' + (p.disabled ? '<span class="nav-meta">set in Settings</span>' : svg('check', 'pal-check')));
        b.type = 'button';
        if (p.disabled) { b.disabled = true; b.title = 'Save a palette under Settings › My palette first'; }
        b.addEventListener('click', () => { newDraft.palette = p.id; list.querySelectorAll('.pal-opt').forEach((x) => x.classList.toggle('is-on', x === b)); });
        list.appendChild(b);
      });
      body.appendChild(list);
    } else {
      const k = kindList().find((x) => x.id === newDraft.kind) || kindList()[0];
      const f = el('label', 'field');
      f.innerHTML = '<span class="ctl-label">Name</span>';
      const inp = el('input', 'field-in');
      inp.type = 'text'; inp.value = newDraft.name; inp.placeholder = 'e.g. quiz-score-card'; inp.spellcheck = false; inp.maxLength = 40;
      const hint = el('span', 'field-hint');
      const upd = () => { newDraft.name = inp.value; const s = slugify(inp.value); hint.textContent = s ? 'components/' + s + '/' : 'Lowercase letters, numbers and dashes.'; hint.classList.toggle('is-bad', !!inp.value && (!s || (window.LAB_REGISTRY || []).includes(s))); };
      inp.addEventListener('input', upd);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') createNew(); });
      upd();
      f.append(inp, hint);
      body.appendChild(f);
      const sum = el('div', 'summary');
      sum.innerHTML = '<div><span>Kind</span><strong>' + esc(k.label) + '</strong></div><div><span>Palette</span><strong>' + esc((paletteOptions().find((p) => p.id === newDraft.palette) || {}).name || 'Project') + '</strong></div><div><span>Basic</span><strong>' + k.featured.length + ' featured controls</strong></div>';
      body.appendChild(sum);
      setTimeout(() => inp.focus({ preventScroll: true }), 60);
    }
    const foot = el('div', 'step-foot');
    const backB = el('button', 'btn', step === 0 ? 'Cancel' : 'Back');
    backB.type = 'button';
    backB.addEventListener('click', () => { if (step === 0) go({ type: 'cat', cat: visibleCats()[0].id }); else replaceTop({ type: 'new', step: step - 1 }, -1); });
    const next = el('button', 'btn btn-primary', step === 2 ? 'Create' : 'Continue');
    next.type = 'button';
    next.addEventListener('click', () => { if (step < 2) replaceTop({ type: 'new', step: step + 1 }, 1); else createNew(); });
    foot.append(backB, next);
    inner.appendChild(foot);
    return 'Step ' + (step + 1) + ' of 3';
  }
  function syncTiles(scope, instant) {
    const tiles = scope && scope.querySelector('.tiles');
    if (!tiles) return;
    const on = tiles.querySelector('.tile.is-on');
    const ind = tiles.querySelector('.tile-ind');
    if (!on || !ind) return;
    if (instant) ind.style.opacity = '0';
    M.glide(ind, on.offsetLeft, on.offsetTop, on.offsetWidth, on.offsetHeight);
  }
  async function createNew() {
    const name = slugify(newDraft.name);
    if (!name) { toast('Give it a name first.'); return; }
    if ((window.LAB_REGISTRY || []).includes(name)) { toast('components/' + name + ' already exists.'); return; }
    const p = paletteOptions().find((x) => x.id === newDraft.palette);
    try {
      const r = await fetch('api/new', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, kind: newDraft.kind, palette: p && p.colors ? p.colors : null, title: newDraft.name.trim() }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || 'HTTP ' + r.status);
    } catch (e) {
      toast('Could not create (' + e.message + '). Needs serve.py; or run: python new-component.py ' + name + ' --kind ' + newDraft.kind, 7000);
      return;
    }
    await loadScript('components/registry.js' + bust()).catch(() => {});
    buildPicker();
    store.del('values:' + name);
    await loadComponent(name, false);
    toast('Created components/' + name + '/ and loaded it.');
  }

  // ---------- floating nested toolbar (TB Overhaul: Enhancement #7) ----------
  const TOOLBAR_GROUPS = [
    { id: 'component', label: 'Component', primary: true },
    { id: 'playback', label: 'Playback', when: () => !!(def && def.animated) }
  ];
  const TB_OPEN_ORDER = 'forward';
  const TB_CLOSE_ORDER = 'forward';
  const TB_STAGGER = 110;   // ms between groups
  const RAIL_TOOLS = [{ id: 'new', label: 'New component', icon: 'plus' }, { id: 'toolbar', label: 'Stage toolbar', icon: 'toolbar' }];
  function orderedTools() {
    const ord = Array.isArray(ui.toolOrder) ? ui.toolOrder : [];
    const idx = (id) => { const i = ord.indexOf(id); return i < 0 ? 100 + RAIL_TOOLS.findIndex((t) => t.id === id) : i; };
    return RAIL_TOOLS.slice().sort((a, b) => idx(a.id) - idx(b.id));
  }
  const toolHidden = () => (Array.isArray(ui.toolHidden) ? ui.toolHidden : []);

  const TB = (function () {
    const open = new Set();
    let railBtn = null, settleT = 0, stepDir = 1;
    let shown = ui.tbOut !== false;
    // Session-only custom drop position: { x, y, flip } (see Future Audit Log #3 for ui.tbPos persistence)
    let customPos = null;
    const bar = () => $('stageBar');
    const icon = () => $('tbToggle');
    const gEl = (id) => bar().querySelector('.tb-group[data-group="' + id + '"]');
    const avail = () => TOOLBAR_GROUPS.filter((g) => gEl(g.id) && (!g.when || g.when()));
    const inOrder = (o) => (o === 'reverse' ? avail().reverse() : avail());
    const isOpen = () => avail().some((g) => open.has(g.id));
    const allOpen = () => avail().every((g) => open.has(g.id));
    const growDir = () => (getComputedStyle(bar()).flexDirection === 'row-reverse' ? -1 : 1);

    function applyCustomPos() {
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
      applyCustomPos();
      Log.push('toolbar reset to default corner');
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
      if (sw) sw.setAttribute('aria-checked', shown ? 'true' : 'false');
    }

    function paint(changed, opening) {
      const lv = M.level();
      changed.forEach((g, i) => {
        const e = gEl(g.id);
        e.style.setProperty('--tb-delay', lv === 'full' ? i * TB_STAGGER + 'ms' : '0ms');
        e.style.setProperty('--tb-dur', lv === 'full' ? (opening ? '0.46s' : '0.3s') : lv === 'fade' ? '0.12s' : '0.01ms');
        e.style.setProperty('--tb-ease', opening ? 'var(--spring-soft)' : 'var(--settle)');
        e.classList.add('is-moving');
      });
      TOOLBAR_GROUPS.forEach((g) => {
        const e = gEl(g.id);
        if (!e) return;
        const on = open.has(g.id);
        e.classList.toggle('is-open', on);
        e.inert = !on;
        e.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      if (!open.has('component') && menuAnchor === $('tbPick')) menuClose();
      const any = isOpen();
      icon().setAttribute('aria-expanded', any ? 'true' : 'false');
      icon().title = any
        ? 'Close toolbar (Esc) · drag to move · flick to launch'
        : 'Open toolbar · Shift+click or \u2192 opens one group · drag to move';
      syncRailBtn();
      syncSettingsSwitch();
      ui.tbLast = [...open];
      saveUi();
      clearTimeout(settleT);
      settleT = setTimeout(() => {
        bar().querySelectorAll('.tb-group.is-moving').forEach((e) => e.classList.remove('is-moving'));
      }, M.level() === 'full' ? changed.length * TB_STAGGER + 520 : 160);
      requestAnimationFrame(sizeUnit);
      if (open.has('viewport')) requestAnimationFrame(() => syncSeg($('viewSeg'), viewPill, ui.view, true));
    }
    function openN(n, quiet) {
      if (!shown) return 0;
      const todo = inOrder(TB_OPEN_ORDER).filter((g) => !open.has(g.id)).slice(0, n);
      todo.forEach((g) => open.add(g.id));
      if (todo.length) { paint(todo, true); if (!quiet) Log.push('toolbar open ' + todo.map((g) => g.id).join(' \u2192 ')); }
      return todo.length;
    }
    function closeN(n, quiet) {
      const todo = inOrder(TB_CLOSE_ORDER).filter((g) => open.has(g.id)).slice(0, n);
      todo.forEach((g) => open.delete(g.id));
      if (!isOpen()) open.clear();
      if (todo.length) { paint(todo, false); if (!quiet) Log.push('toolbar close ' + todo.map((g) => g.id).join(' \u2192 ')); }
      return todo.length;
    }
    const toggle = () => (isOpen() ? closeN(Infinity) : openN(Infinity));
    function step() {
      if (allOpen()) stepDir = -1; else if (!isOpen()) stepDir = 1;
      return stepDir > 0 ? openN(1) : closeN(1);
    }
    function syncRailBtn() {
      if (!railBtn) return;
      const on = shown && isOpen();
      railBtn.classList.toggle('is-on', on);
      railBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    function homeRect() {
      const r = railBtn && railBtn.isConnected && dockOpen ? railBtn.getBoundingClientRect() : $('dockTrigger').getBoundingClientRect();
      return r.width ? r : null;
    }
    function flyOut(from, power, v) {
      unhideRailToolbar();
      const n = power >= 2 ? Infinity : 1;
      if (shown) { openN(n); return; }
      open.clear();
      applyCustomPos();
      paint([], true);
      shown = true;
      bar().dataset.out = 'true';
      syncSettingsSwitch();
      Log.push('toolbar out' + (power >= 2 ? ' (strong flick)' : power ? ' (flick)' : ''));
      const lv = M.level(), to = icon().getBoundingClientRect();
      if (lv !== 'full' || !from) {
        if (lv === 'fade') bar().animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
        openN(n, true);
        return;
      }
      const dx = from.left + from.width / 2 - (to.left + to.width / 2), dy = from.top + from.height / 2 - (to.top + to.height / 2);
      const dist = Math.hypot(dx, dy), sp = Math.max(1.4, Math.abs(v || 0) * 2.2);
      const dur = Math.round(Math.max(420, Math.min(820, dist / sp)));
      bar().animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.72)', opacity: 0.35 },
        { transform: 'translate(' + dx * 0.18 + 'px,' + dy * 0.18 + 'px) scale(0.96)', opacity: 1, offset: 0.55 },
        { transform: 'none', opacity: 1 }
      ], { duration: dur, easing: M.springSoft });
      bar().dataset.flying = String(dur);
      setTimeout(() => { openN(n, true); delete bar().dataset.flying; }, Math.round(dur * 0.62));
    }
    function flyHome() {
      if (!shown) return;
      unhideRailToolbar();
      const had = isOpen();
      closeN(Infinity, true);
      Log.push('toolbar back to rail');
      const lv = M.level();
      const wait = lv === 'full' && had ? avail().length * TB_STAGGER + 240 : 0;
      setTimeout(() => {
        const h = homeRect(), from = icon().getBoundingClientRect();
        const done = () => { shown = false; bar().dataset.out = 'false'; syncRailBtn(); syncSettingsSwitch(); };
        if (lv !== 'full' || !h) { done(); return; }
        const dx = h.left + h.width / 2 - (from.left + from.width / 2), dy = h.top + h.height / 2 - (from.top + from.height / 2);
        bar().animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.6)', opacity: 0 }],
          { duration: 440, easing: 'cubic-bezier(0.5, 0, 0.75, 0.3)', fill: 'forwards' }).finished.then(() => { done(); bar().getAnimations().forEach((a) => a.cancel()); }, done);
      }, wait);
    }
    function setOut(on) {
      ui.tbOut = on; saveUi();
      if (on && !shown) flyOut(homeRect(), 0, 0);
      if (!on && shown) { unhideRailToolbar(); closeN(Infinity, true); shown = false; bar().dataset.out = 'false'; syncRailBtn(); syncSettingsSwitch(); }
    }

    // 5 Video-Game Physics Exit Trajectories when throwing/flicking the toolbar off-screen!
    const TRICKS = ['arc', 'ricochet', 'curve', 'warp', 'spiral'];
    let lastTrick = '';
    function pickTrick(vx, vy) {
      const pool = TRICKS.filter((t) => t !== lastTrick);
      if (Math.abs(vx) > Math.abs(vy) * 1.8 && pool.includes('warp') && Math.random() < 0.45) return (lastTrick = 'warp');
      if (vy < -0.55 && pool.includes('arc') && Math.random() < 0.45) return (lastTrick = 'arc');
      const choice = pool[Math.floor(Math.random() * pool.length)] || 'arc';
      lastTrick = choice;
      return choice;
    }

    function dismiss(vx, vy) {
      if (!shown) return;
      unhideRailToolbar();
      const b = bar();
      b.classList.remove('is-held');
      const had = isOpen();
      closeN(Infinity, true);
      const lv = M.level();
      const pvx = vx || -0.9;
      const pvy = vy || -0.4;
      const trick = pickTrick(pvx, pvy);
      const trickNames = {
        arc: 'gravity lob!',
        ricochet: 'wall ricochet!',
        curve: 'boomerang curve!',
        warp: 'slingshot warp!',
        spiral: 'corkscrew spiral!'
      };
      Log.push('toolbar trick \u00b7 ' + (trickNames[trick] || 'dismissed'));

      const wait = lv === 'full' && had ? avail().length * TB_STAGGER + 180 : 0;
      setTimeout(() => {
        const done = () => {
          shown = false;
          b.dataset.out = 'false';
          b.getAnimations().forEach((a) => a.cancel());
          syncRailBtn();
          syncSettingsSwitch();
          if (railBtn && railBtn.offsetWidth && lv === 'full') {
            railBtn.animate(
              [{ transform: 'scale(1)' }, { transform: 'scale(1.34) rotate(-8deg)' }, { transform: 'scale(0.93)' }, { transform: 'scale(1)' }],
              { duration: 420, easing: M.spring }
            );
          }
        };
        if (lv !== 'full') {
          if (lv === 'fade') b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' }).finished.then(done, done);
          else done();
          return;
        }
        const from = icon().getBoundingClientRect();
        const h = homeRect();
        const tx = h ? (h.left + h.width / 2 - (from.left + from.width / 2)) : pvx * 360;
        const ty = h ? (h.top + h.height / 2 - (from.top + from.height / 2)) : pvy * 360;
        let kf, dur, ease;

        if (trick === 'arc') {
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
        } else if (trick === 'ricochet') {
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
        } else if (trick === 'curve') {
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
        } else if (trick === 'warp') {
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
        } else {
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
        }
        b.animate(kf, { duration: dur, easing: ease, fill: 'forwards' }).finished.then(done, done);
      }, wait);
    }

    function railClick() { if (!shown) flyOut(railBtn ? railBtn.getBoundingClientRect() : null, 2, 0); else toggle(); }
    function railButton(b) {
      railBtn = b;
      syncRailBtn();
      const LIM = 22;
      M.Flick(b, {
        onMove(d, full) { if (full) b.style.transform = 'translateX(' + M.rubber(d, LIM).toFixed(1) + 'px)'; },
        onRelease({ d, v, dir, power }) {
          M.snapBack(b, M.rubber(d, LIM));
          if (!power) return;
          const r = b.getBoundingClientRect(), st = $('stageFit').getBoundingClientRect();
          const toStage = Math.sign(st.left + st.width / 2 - (r.left + r.width / 2)) || -1;
          if (dir === toStage) flyOut(r, power, v);
          else if (shown) { if (power >= 2 || !isOpen()) flyHome(); else closeN(1); }
        }
      });
    }

    // ---- component menu: a floating layer on <main>, can anchor to #tbPick or #cmpName ----
    const menu = () => $('tbMenu');
    let menuOpen = false, menuAnchor = null;
    function menuShow(anchorEl) {
      const target = anchorEl || $('tbPick');
      if (menuOpen && menuAnchor === target) { menuClose(true); return; }
      const m = menu();
      m.innerHTML = '';
      (window.LAB_REGISTRY || []).forEach((id) => {
        const o = el('button', 'tb-opt', esc(pickLabel(id)));
        o.type = 'button';
        o.dataset.id = id;
        o.setAttribute('role', 'option');
        o.setAttribute('aria-selected', def && def.id === id ? 'true' : 'false');
        o.addEventListener('click', () => { menuClose(true); if (!def || id !== def.id) { $('labPicker').value = id; loadComponent(id, false); } });
        m.appendChild(o);
      });
      m.hidden = false;
      const r = target.getBoundingClientRect(), w = Math.max(r.width, m.offsetWidth);
      const flip = target === $('cmpName') ? (r.left + w > innerWidth - 12) : (growDir() < 0);
      m.style.minWidth = Math.max(140, r.width) + 'px';
      m.style.top = Math.round(r.bottom + 6) + 'px';
      m.style.left = Math.max(12, Math.min(innerWidth - w - 12, Math.round(flip ? r.right - w : r.left))) + 'px';
      m.style.transformOrigin = flip ? 'top right' : 'top left';
      menuOpen = true;
      menuAnchor = target;
      $('tbPick').setAttribute('aria-expanded', target === $('tbPick') ? 'true' : 'false');
      if ($('cmpName')) $('cmpName').setAttribute('aria-expanded', target === $('cmpName') ? 'true' : 'false');
      const lv = M.level();
      if (lv === 'full') m.animate([{ opacity: 0, transform: 'translateY(-6px) scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: M.springSoft });
      else if (lv === 'fade') m.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 });
      const cur = m.querySelector('[aria-selected="true"]') || m.firstChild;
      if (cur) cur.focus({ preventScroll: true });
    }
    function menuClose(focusPick) {
      if (!menuOpen) return;
      const prevAnchor = menuAnchor || $('tbPick');
      menuOpen = false;
      menuAnchor = null;
      menu().hidden = true;
      $('tbPick').setAttribute('aria-expanded', 'false');
      if ($('cmpName')) $('cmpName').setAttribute('aria-expanded', 'false');
      if (focusPick && prevAnchor) prevAnchor.focus({ preventScroll: true });
    }
    function sizeUnit() {
      const pick = $('tbPick');
      if (pick && pick.offsetWidth) bar().style.setProperty('--tb-unit', pick.offsetWidth + 'px');
    }
    function init() {
      const host = $('tbGroups');
      TOOLBAR_GROUPS.forEach((g) => { const e = gEl(g.id); if (e) host.appendChild(e); });
      host.querySelectorAll('.tb-group').forEach((e) => { if (!TOOLBAR_GROUPS.some((g) => g.id === e.dataset.group)) e.hidden = true; });
      icon().innerHTML = svg('toolbar');
      icon().addEventListener('click', (e) => { if (e.shiftKey) step(); else toggle(); });
      icon().addEventListener('keydown', (e) => {
        const g = growDir();
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          ((e.key === 'ArrowRight') === (g > 0)) ? openN(1) : closeN(1);
        }
      });

      // Whole-card tactile hold, 1:1 free-roam drag-and-drop, and flick gesture on #stageBar
      const b = bar();
      let startLeft = 16, startTop = 16;
      const isChildControl = (target) => {
        if (!target || !target.closest) return false;
        return !!target.closest('#tbPick, #labPlay, #labScrub, #viewSeg');
      };
      const clearHeld = () => b.classList.remove('is-held');
      window.addEventListener('pointerup', clearHeld, { passive: true });
      window.addEventListener('pointercancel', clearHeld, { passive: true });

      M.Flick(b, {
        axis: 'xy',
        alwaysDrag: true,
        ignore(e) { return isChildControl(e.target); },
        onDown() {
          const rect = b.getBoundingClientRect();
          startLeft = rect.left;
          startTop = rect.top;
          b.classList.add('is-held');
        },
        onTap(e, cancelled) {
          b.classList.remove('is-held');
          b.style.transform = '';
          if (cancelled) return;
          // Clicking the outer shell/border (outside #tbToggle, which has its own click listener) toggles open/close
          if (e && e.target && !e.target.closest('#tbToggle') && !isChildControl(e.target)) {
            if (e.shiftKey) step();
            else toggle();
          }
        },
        onMove(dx, full, dy, vxNow) {
          const nx = Math.max(8, Math.min(innerWidth - 48, startLeft + dx));
          const ny = Math.max(8, Math.min(innerHeight - 48, startTop + dy));
          b.style.left = Math.round(nx) + 'px';
          b.style.top = Math.round(ny) + 'px';
          b.style.right = 'auto';
          b.dataset.customPos = 'true';
          if (full) {
            const tilt = Math.max(-9, Math.min(9, (vxNow || 0) * 4));
            b.style.transform = 'scale(1.06) rotate(' + tilt.toFixed(2) + 'deg)';
          }
        },
        onRelease({ dir, power, axis, dx, dy, vx, vy }) {
          b.classList.remove('is-held');
          b.style.transform = '';
          const dist = Math.hypot(dx, dy);
          const g = growDir();

          // 1. Short horizontal flick near origin: quick expand/collapse gesture!
          if (M.flickOn && dist < 75 && power >= 1 && axis === 'x') {
            applyCustomPos();
            if (dir === g) {
              openN(power >= 2 ? Infinity : 1);
              return;
            }
            if (dir === -g && power === 1 && isOpen()) {
              closeN(1);
              return;
            }
          }

          // 2. Strong throw in any direction: arcade physics exit trajectory to the rail!
          if (M.flickOn && power >= 2) {
            dismiss(vx || dx / 200, vy || dy / 200);
            return;
          }

          // 3. Calm release (stationary hold >90ms or gentle drag): drop toolbar at custom viewport position!
          const rect = b.getBoundingClientRect();
          const clampedX = Math.max(12, Math.min(innerWidth - rect.width - 12, startLeft + dx));
          const clampedY = Math.max(12, Math.min(innerHeight - rect.height - 12, startTop + dy));
          const flip = clampedX > innerWidth * 0.55;
          customPos = { x: clampedX, y: clampedY, flip };
          applyCustomPos();
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
      $('tbPick').addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' && !menuOpen) { e.preventDefault(); menuShow($('tbPick')); } });
      if ($('cmpName')) {
        $('cmpName').addEventListener('click', (e) => { e.stopPropagation(); menuShow($('cmpName')); });
      }
      menu().addEventListener('keydown', (e) => {
        const opts = [...menu().querySelectorAll('.tb-opt')], i = opts.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = opts[(i + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length]; if (n) n.focus(); }
        if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); (e.key === 'Home' ? opts[0] : opts[opts.length - 1]).focus(); }
        if (e.key === 'Tab') menuClose(false);
      });
      M.flickOn = ui.flick !== false;
      M.flickStrength = ui.flickStrength || 'normal';
      bar().dataset.out = shown ? 'true' : 'false';
      applyCustomPos();
      paint([], true);
    }
    function start() {
      const lv = M.enabled;
      M.enabled = false;   // first paint: no stagger
      if (shown) {
        if (ui.tbStart === 'open') openN(Infinity, true);
        else if (ui.tbStart === 'remember') { const last = Array.isArray(ui.tbLast) ? ui.tbLast : []; avail().forEach((g) => { if (last.includes(g.id)) open.add(g.id); }); paint([], true); }
        else paint([], true);
      }
      M.enabled = lv;
    }
    function refresh() {
      requestAnimationFrame(sizeUnit);
      if (ui.tbOut !== false && !shown) { shown = true; bar().dataset.out = 'true'; bar().getAnimations().forEach((a) => a.cancel()); }
      if (shown) paint([], true);
    }
    return {
      init, start, refresh, toggle, step, openN, closeN, flyOut, flyHome, dismiss, setOut, railClick,
      resetPos,
      get shown() { return shown; },
      get hasCustomPos() { return !!customPos; },
      railButton, menuShow, menuClose,
      get isOpen() { return isOpen(); }, get openIds() { return avail().filter((g) => open.has(g.id)).map((g) => g.id); },
      get menuOpen() { return menuOpen; },
      outside(t) {
        if (menuOpen && !menu().contains(t) && !t.closest('#tbPick') && !t.closest('#cmpName')) menuClose(false);
        if (ui.tbAutoClose && isOpen() && !bar().contains(t) && !menu().contains(t) && !dock.contains(t)) closeN(Infinity);
      },
      esc() {
        if (menuOpen) { menuClose(true); return true; }
        if (isOpen() && bar().contains(document.activeElement)) { closeN(Infinity); icon().focus({ preventScroll: true }); return true; }
        return false;
      },
      close() { if (isOpen()) closeN(Infinity); }
    };
  })();

  function setView(val) {
    if (!VIEWS.some((x) => x.id === val)) return;
    ui.view = val; saveUi(); applyFrameVars(); layoutStage();
    syncSeg($('viewSeg'), viewPill, val, true);
    document.querySelectorAll('[data-set="viewport"]').forEach((h) => syncSeg(h, null, val));
    Log.push('viewport ' + ((VIEWS.find((x) => x.id === val) || {}).label || val));
  }
  const pickLabel = (id) => (id === '_template' ? 'Blank template' : id);
  function buildPicker() {
    const sel = $('labPicker');
    sel.innerHTML = '';
    (window.LAB_REGISTRY || []).forEach((id) => {
      const o = el('option', null, id === '_template' ? 'Blank template' : esc(id));
      o.value = id;
      sel.appendChild(o);
    });
    if (def) sel.value = def.id;
  }

  // ---------- Self-test (?selftest=1) ----------
  async function runSelfTest() {
    const reg = window.LAB_REGISTRY || [];
    const startId = def ? def.id : reg[0];
    const results = [];
    for (const id of reg) {
      try {
        await loadComponent(id, false);
        const okVars = vars.length > 0;
        const sample = vars.find((v) => v.control === 'slider' || v.control === 'radial') || vars[0];
        if (sample) {
          const orig = P[sample.id];
          setValue(sample.id, sample.max != null ? sample.max : orig, { quiet: true, noHistory: true });
          setValue(sample.id, orig, { quiet: true, noHistory: true });
        }
        const html = await workingFile();
        const okHtml = typeof html === 'string' && html.includes('<!doctype html>');
        results.push({ id, ok: okVars && okHtml, n: vars.length });
      } catch (err) {
        results.push({ id, ok: false, err: String(err) });
      }
    }
    if (startId && reg.includes(startId)) await loadComponent(startId, false);
    const passed = results.filter((r) => r.ok).length;
    const summary = 'Self-test: ' + passed + '/' + results.length + ' passed (' + results.map((r) => r.id + ':' + (r.ok ? r.n + 'v' : 'FAIL')).join(', ') + ')';
    Log.push(summary);
    toast(summary, 5000);
    console.info('[Component Lab Self-Test]', results);
  }

  function buildChrome() {
    buildPicker();
    $('labPicker').addEventListener('change', (e) => loadComponent(e.target.value, false));
    TB.init();
    $('viewSeg').classList.add('seg-xs');
    $('viewSeg').querySelectorAll('.seg-btn').forEach((b) => { const v = VIEWS.find((x) => x.id === b.dataset.value); if (v) { b.title = v.w ? v.w + ' \u00d7 ' + v.h + ' viewport' : 'Fit the frame to the free space'; b.setAttribute('aria-label', b.title); } });
    viewPill = buildSeg($('viewSeg'), VIEWS.map((x) => ({ value: x.id, label: x.w ? String(x.w) : x.label })), ui.view, (val) => setView(val));
    modePill = buildSeg($('modeSeg'), [{ value: 'basic', label: 'Basic' }, { value: 'pro', label: 'Pro' }], mode, (val) => setMode(val), { equal: true });
    $('dockTrigger').innerHTML = svg('sliders');
    $('dockClose').innerHTML = svg('close');
    $('backBtn').innerHTML = svg('back');
    [['copyBtn', 'diff', copyChanges], ['fullBtn', 'code', copyFull], ['undoBtn', 'undo', () => Hist.undo()], ['resetBtn', 'reset', resetAll]].forEach(([id, icon, fn]) => {
      const b = $(id);
      b.dataset.icon = icon;
      b.innerHTML = svg(icon);
      b.addEventListener('click', () => {
        fn();
        requestAnimationFrame(() => {
          const a = document.activeElement;
          if (!b.disabled || (a && a !== document.body && a !== b)) return;
          const next = ['undoBtn', 'resetBtn', 'fullBtn'].map($).find((x) => x && !x.disabled);
          if (next) next.focus({ preventScroll: true });
        });
      });
    });

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
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startCompare(e); }
    });
    chgBtn.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.key === 'Enter') stopCompare();
    });
    chgBtn.addEventListener('blur', stopCompare);

    $('backBtn').addEventListener('click', back);
    $('moreBtn').innerHTML = svg('dots');
    $('moreBtn').addEventListener('click', (e) => { e.stopPropagation(); Pop.toggle(); });
    $('dockClose').addEventListener('click', closeDock);
    $('labPlay').addEventListener('click', () => { playing = !playing; syncTime(); writeHash(); });
    $('labScrub').addEventListener('input', (e) => { playing = false; offset = +e.target.value; syncTime(); writeHash(); });
    document.documentElement.classList.toggle('no-motion', !ui.motion);

    // Lab-side capture guards for scan-sourced interaction controls (Item 2.3)
    const scaler = $('stageScaler');
    scaler.addEventListener('pointerenter', (e) => {
      scanHovering = true;
      scanHoverTouch = e.pointerType === 'touch';
    });
    scaler.addEventListener('pointerleave', () => {
      scanHovering = false;
      scanHoverTouch = false;
    });
    scaler.addEventListener('pointerdown', (e) => {
      if (!def) return;
      const curP = activeParams();
      if (e.pointerType === 'touch') {
        scanHoverTouch = true;
        if (byId.TOUCH && byId.TOUCH.source === 'scan' && curP.TOUCH === 'ignore') {
          e.stopImmediatePropagation();
          return;
        }
      }
      if (byId.DRAG && byId.DRAG.source === 'scan' && (curP.DRAG === 'ignore' || curP.DRAG === false)) {
        e.stopImmediatePropagation();
      }
    }, true);
    scaler.addEventListener('pointermove', (e) => {
      if (!def) return;
      const curP = activeParams();
      if (e.pointerType === 'touch' && byId.TOUCH && byId.TOUCH.source === 'scan' && curP.TOUCH === 'ignore') {
        e.stopImmediatePropagation();
        return;
      }
      if (e.buttons !== 0 && byId.DRAG && byId.DRAG.source === 'scan' && (curP.DRAG === 'ignore' || curP.DRAG === false)) {
        e.stopImmediatePropagation();
      }
    }, true);
    scaler.addEventListener('wheel', (e) => {
      if (!def) return;
      const curP = activeParams();
      if (byId.WHEEL && byId.WHEEL.source === 'scan' && !curP.WHEEL) {
        e.stopImmediatePropagation();
      }
    }, { capture: true, passive: true });
    scaler.addEventListener('click', (e) => {
      if (!def) return;
      const curP = activeParams();
      if (byId.CLICK && byId.CLICK.source === 'scan' && !curP.CLICK) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }, true);
    frameEl.addEventListener('keydown', (e) => {
      if (!def) return;
      const curP = activeParams();
      if (byId.KEYS && byId.KEYS.source === 'scan' && !curP.KEYS) {
        e.stopImmediatePropagation();
        return;
      }
      if (e.key === ' ' && byId.KEY_PAUSE && byId.KEY_PAUSE.source === 'scan' && curP.KEY_PAUSE) {
        const tag = (e.target && e.target.tagName || '').toLowerCase();
        if (!['input', 'textarea', 'select', 'button'].includes(tag)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          scanKbdPause = !scanKbdPause;
        }
      }
    }, true);

    const trig = $('dockTrigger');
    trig.addEventListener('click', () => openDock('click'));
    trig.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => openDock('hover'), 220); });
    trig.addEventListener('mouseleave', () => clearTimeout(hoverTimer));
    dock.addEventListener('mouseenter', () => clearTimeout(leaveTimer));
    dock.addEventListener('mouseleave', () => {
      if (!dockOpen || pinned || Arc.isOpen || Pop.isOpen || dock.contains(document.activeElement)) return;
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => { if (!pinned && !Arc.isOpen && !dock.contains(document.activeElement)) closeDock(); }, 500);
    });
    dock.addEventListener('pointerdown', () => { if (dockOpen) pinned = true; });
    dock.addEventListener('focusin', () => { if (dockOpen) pinned = true; });

    document.addEventListener('pointerdown', (e) => {
      const t = e.target;
      if (Arc.isOpen && !Arc.contains(t) && !t.closest('.swatch-trigger')) Arc.close();
      if (Pop.isOpen && !Pop.contains(t)) Pop.hide();
      TB.outside(t);
      if (!dockOpen || dock.contains(t) || Arc.contains(t) || t.closest('#stageBar') || t.closest('#tbMenu') || t.closest('#toast') || t.closest('#labFrame')) return;
      closeDock();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (TB.esc()) return;
        if (Pop.isOpen) { Pop.hide(true); return; }
        if (Arc.isOpen) { Arc.close(false, true); return; }
        if (dockOpen) { closeDock(); trig.focus({ preventScroll: true }); return; }
        TB.close();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.altKey && /^[zy]$/i.test(e.key)) {
        const a = document.activeElement;
        const texty = a && (a.tagName === 'TEXTAREA' || a.isContentEditable || (a.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'color', 'button'].includes(a.type)));
        if (dockOpen && !texty && def) {
          e.preventDefault();
          const redo = e.key.toLowerCase() === 'y' || e.shiftKey;
          if (!(redo ? Hist.redo() : Hist.undo())) announce(redo ? 'Nothing to redo' : 'Nothing to undo');
        }
        return;
      }
      const tag = (e.target.tagName || '').toLowerCase();
      if (e.key === ' ' && !['input', 'textarea', 'select', 'button'].includes(tag) && def && def.animated) { e.preventDefault(); playing = !playing; syncTime(); writeHash(); }
    });
    let rz = 0;
    addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { Arc.close(true); TB.menuClose(); relayout(); }); });
    addEventListener('hashchange', () => {
      const h = readHash();
      const reg = window.LAB_REGISTRY || [];
      if (h.c && reg.includes(h.c) && (!def || h.c !== def.id)) loadComponent(h.c, true);
    });
  }

  async function init() {
    // URL escape hatch: ?reset clears componentLab:v2:* keys and strips ?reset from URL (Item 2.5)
    try {
      const url = new URL(location.href);
      if (url.searchParams.has('reset')) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith(KEY)) localStorage.removeItem(k);
        }
        Object.assign(ui, {
          dockPos: 'right', anchor: 'top-right', mode: 'basic', motion: true, paletteSource: 'project',
          view: '1600x770', open: true, accCollapse: 'remember', accVariant: 'B',
          tbOut: true, tbStart: 'closed', tbAutoClose: true, tbLast: [], flick: true, flickStrength: 'normal',
          railOrder: [], railHidden: [], toolOrder: [], toolHidden: []
        });
        mode = 'basic';
        url.searchParams.delete('reset');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    } catch (_) {}

    buildChrome();
    applyDockLayout();
    try { kindsInfo = JSON.parse(await fetchText('components/_template/kinds.json')); } catch (e) { kindsInfo = null; }
    const reg = window.LAB_REGISTRY || [];
    const h = readHash();
    const first = h.c && reg.includes(h.c) ? h.c : reg[0];
    if (!first) { toast('No components in components/registry.js', 8000); return; }
    requestAnimationFrame(tick);
    try {
      await loadComponent(first, true);
    } finally {
      TB.start();
      if (ui.open !== false) {
        const prev = M.enabled;
        M.enabled = false;   // first paint: no morph
        openDock('click');
        M.enabled = prev;
      } else layoutStage();
      document.documentElement.classList.add('is-ready');
    }

    // Smoke self-test: ?selftest=1 (Item 4.6)
    try {
      const url = new URL(location.href);
      if (url.searchParams.get('selftest') === '1') {
        setTimeout(() => runSelfTest(), 250);
      }
    } catch (_) {}
  }
  window.__lab = { openDock, closeDock, go, push, back, setMode, startNew, get state() { return { dockOpen, pinned, mode, navStack: navStack.slice(), ui: Object.assign({}, ui), id: def && def.id, P: Object.assign({}, P), offset, rate: rateNow, playing, scan: man && man.scan, railCats: railCats().map((c) => c.id), sections: visibleCats().map((c) => c.id) }; }, Arc, TB, setView, layoutStage, setValue, workingFile, changesText, Log, Acc, Pop, Hist, resetAll, runSelfTest };
  init();
})();
