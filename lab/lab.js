// Component Lab v2 core. No dependencies, no build step.
// Components live in components/<id>/: component.js calls Lab.register({...}); manifest.json lists
// the controls (see README). A component without manifest.json gets one from lab/scan.js.
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

  // ---------- state ----------
  const ui = Object.assign({ dockPos: 'right', anchor: 'top-right', motion: true, paletteSource: 'project', view: '1600x770', open: true, accCollapse: 'remember', accVariant: 'B', tbOut: true, tbStart: 'closed', tbAutoClose: true, tbLast: [], flick: true, flickStrength: 'normal' }, store.get('ui', {}));
  // v3: motion B (spring morph) became the default section motion; move older saved choices onto it once.
  if (store.get('uiVer', 0) < 3) { ui.accVariant = 'B'; store.set('uiVer', 3); store.set('ui', ui); }
  // v4: the sandbox defaults to 1600×770 (Rob's HP laptop Chrome viewport on a 1600×900 screen)
  if (store.get('uiVer', 0) < 4) { ui.view = '1600x770'; store.set('uiVer', 4); store.set('ui', ui); }
  const saveUi = () => store.set('ui', ui);
  M.enabled = ui.motion !== false;

  let def = null, inst = null, man = null, vars = [], byId = {}, P = {};
  let offset = 0, playing = true, lastT = 0, loadSeq = 0, pendingResolve = null;
  let mode = 'basic';
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
  window.Lab = {
    register(d) { if (pendingResolve) { const r = pendingResolve; pendingResolve = null; r(d); } },
    get params() { return P; }
  };

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
  function manifestForExport() {
    const out = JSON.parse(JSON.stringify(man));
    delete out.auto; delete out.notes;
    return out;
  }

  // ---------- applying values ----------
  function cssVal(v) {
    const val = P[v.id];
    if (v.options) { const o = v.options.find((x) => same(x.value, val)); if (o && o.css != null) return o.css; }
    if (v.cssMap) return v.cssMap[String(val)];
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (v.speedScaled && byId.SPEED) return +(val / (P.SPEED || 1)).toFixed(4) + (v.unit || '');
    if (v.unit === '×') return String(val);
    return val + (v.unit || '');
  }
  function applyVar(v) { if (v.css) frameEl.style.setProperty(v.css, cssVal(v)); }
  function flushBinds() {
    if (!bindStyle) { bindStyle = document.createElement('style'); bindStyle.id = 'labBinds'; document.head.appendChild(bindStyle); }
    if (!def) { bindStyle.textContent = ''; return; }
    const scope = '.lab-frame[data-component="' + def.id + '"] ';
    const lines = [];
    vars.forEach((v) => (v.bind || []).forEach((b) => {
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
    if (v.interaction === 'hover-css') applyHoverCss();
    if (v.bind || v.master === 'speed') { if (v.master === 'speed') vars.forEach((x) => { if (x.speedScaled) applyVar(x); }); flushBinds(); }
    store.set('values:' + def.id, P);
    writeHash();
    refreshChanged();
    if (!opts || !opts.quiet) syncRow(id);
    if (v.category === 'interact') syncQuick();
  }

  // ---------- undo / redo ----------
  // One stack per component. A slider drag (same control, <700ms between steps) is one entry;
  // palette presets and Reset are one batch entry each.
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
    const v = vars.find((x) => x.interaction === 'hover-css');
    if (!v) return;
    hoverRules().forEach((r) => {
      if (!r.__labSel) r.__labSel = r.selectorText;
      r.selectorText = P[v.id] ? r.__labSel : r.__labSel.replace(/:hover/g, ':hover:not(*)');
    });
  }
  const interactVars = () => vars.filter((v) => v.category === 'interact');
  function changedVars() { return vars.filter((v) => !same(P[v.id], v.default)); }
  function refreshChanged() {
    const n = changedVars().length;
    $('changedCount').textContent = n ? n + ' changed' : '0 changed';
    $('changedCount').classList.toggle('is-on', !!n);
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
    const got = new Promise((resolve) => { pendingResolve = resolve; });
    try { await loadScript(base + 'component.js' + bust()); } catch (e) { toast(e.message + '. Is components/' + id + '/ there?', 6000); return; }
    const d = await got;
    if (seq !== loadSeq) return;
    d.id = id;
    d.title = d.title || id;
    d.frames = d.frames || { default: { w: 420, h: 300 } };

    const cssFiles = await Promise.all((d.css || []).map(async (f) => ({ name: f, text: (await fetchText(base + f)) || '' })));
    const markup = d.markup ? await fetchText(base + d.markup) : '';
    let m = null, auto = false;
    const jsText = (await fetchText(base + 'component.js')) || '';
    const mt = await fetchText(base + 'manifest.json');
    if (mt) { try { m = JSON.parse(mt); } catch (e) { toast('manifest.json has a JSON error (' + e.message + '); using auto-scan.', 6000); } }
    if (!m) {
      const savedAuto = store.get('manifest:' + id, null);
      if (savedAuto && Array.isArray(savedAuto.vars)) m = savedAuto;
      else {
        m = S.analyze({ id, title: d.title, cssFiles, markup: markup || '', js: jsText, legacyParams: d.params, animated: !!d.animated });
        store.set('manifest:' + id, m);
      }
      m.auto = true;
      auto = true;
    }
    m.vars = (m.vars || []).map(normVar);
    if (seq !== loadSeq) return;

    // palette: the project's own styles (manifest.paletteFrom, else the component CSS + project tokens)
    const tokens = await fetchText('project/tokens.css');
    const palSrc = m.paletteFrom && m.paletteFrom.length ? await Promise.all(m.paletteFrom.map(fetchText)) : cssFiles.map((f) => f.text).concat([tokens]);
    let pal = S.palette(palSrc.filter(Boolean), 16);
    if (pal.length < 4) pal = pal.concat(S.palette([tokens || ''], 16)).filter((c, i, a) => a.indexOf(c) === i);

    if (inst && inst.destroy) { try { inst.destroy(); } catch (e) { /* ignore */ } }
    inst = null;
    document.querySelectorAll('link.lab-css').forEach((l) => l.remove());
    await Promise.all((d.css || []).map((f) => loadCss(base + f + bust())));
    if (seq !== loadSeq) return;

    def = d; man = m; vars = m.vars; byId = {};
    // What the interaction scan sees in the code (shown in Settings; auto-scan turns it into controls).
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

    // UI
    mode = 'basic'; // existing components always open to Basic
    syncHeadTools();
    $('cmpName').textContent = d.title;
    $('cmpName').title = d.title;
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
    if (auto) toast('No manifest.json, so the controls were made by auto-scan. Settings › Save to disk keeps them.', 5200);
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
    return Math.round(Math.max(320, Math.min(340, innerWidth * 0.22))) + RAIL_W; // main column + icon rail
  }
  function cardMaxH() { return ui.dockPos === 'bottom' ? Math.round(innerHeight * 0.5) : innerHeight - 2 * MARGIN; }
  // Space the stage gets: the window minus the side the card is anchored to.
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
    // the floating toolbar is a layer over the stage: no space is reserved for it
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
  // Handed to mount(): lets a component's own interaction code (drag to spin, focus to bring a
  // card forward) move the shared clock. inst.rate(P, dt) scales playback (hover pause / slow / fast).
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
      if (playing && def.animated) {
        const tm = def.time || {};
        const cyc = tm.cycle && P[tm.cycle] ? P[tm.cycle] : 10;
        const spd = tm.speed && P[tm.speed] !== undefined ? P[tm.speed] : 1;
        const dir = tm.direction && P[tm.direction] !== undefined ? Number(P[tm.direction]) || 1 : 1;
        let k = 1;
        if (inst.rate) { try { k = Number(inst.rate(P, dt)); if (!isFinite(k)) k = 1; } catch (e) { k = 1; } }
        rateNow = k;
        offset += (dt / Math.max(0.1, cyc)) * spd * dir * k;
      }
      if (def.animated) $('labScrub').value = wrap(offset);
      try { inst.render(P, wrap(offset)); } catch (e) { toast('render error: ' + e.message, 6000); playing = false; syncTime(); console.error(e); }
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
  // Closed-dock size comes from --trig-w / --trig-h / --trig-r (lab/pass.css), so the morph follows the pass.
  function trigBox() {
    const cs = getComputedStyle(document.documentElement), g = (k, d) => (cs.getPropertyValue(k).trim() || d);
    return { width: g('--trig-w', '52px'), height: g('--trig-h', '52px'), borderRadius: g('--trig-r', '26px') };
  }
  function openDock(how) {
    clearTimeout(leaveTimer);
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
    const to = card.getBoundingClientRect();
    layoutStage();
    const lv = M.level();
    if (lv !== 'off') {
      dock.classList.add('is-morphing');
      const a = dock.animate([
        trigBox(),
        { width: to.width + 'px', height: to.height + 'px', borderRadius: '22px' }
      ], { duration: lv === 'full' ? 300 : 150, easing: M.settle });
      a.finished.catch(() => {}).then(() => { if (dockOpen) dock.classList.remove('is-morphing'); });
      M.contentIn(card.querySelector('.card-main'), 60);
      M.contentIn($('rail'), 30);
      M.travel($('dockTrigger'), $('dockClose'), window.Pass ? Pass.miniHtml() : svg('sliders'));
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
      trigBox()
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
  // Settings › Rail order: one global order (localStorage, every component); a component without
  // a category just skips it. Pro sections follow the same order.
  function orderedCats() {
    const ord = Array.isArray(ui.railOrder) ? ui.railOrder : [];
    const idx = (id) => { const i = ord.indexOf(id); return i < 0 ? 100 + CAT_IDS.indexOf(id) : i; };
    return CATS.slice().sort((a, b) => idx(a.id) - idx(b.id));
  }
  const railHidden = () => (Array.isArray(ui.railHidden) ? ui.railHidden : []);
  function visibleCats() {
    if (mode === 'pro') return orderedCats().filter((c) => c.id !== 'interact' || hasCat('interact'));
    const f = basicVars();
    return orderedCats().filter((c) => f.some((v) => v.category === c.id));
  }
  // Rail icons: the visible categories minus any hidden in Settings (never empty).
  function railCats() {
    const vc = visibleCats(), shown = vc.filter((c) => !railHidden().includes(c.id));
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
    const proCat = mode === 'pro' && spec.type === 'cat';
    // Pro: every category is a section in one panel, so a rail click opens + scrolls to it.
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
  // Footer: when the content needs more room than the card has, show only the icon row and
  // hide the log (it keeps logging). The decision uses the full-footer height, so showing or
  // hiding the log never flips it back (no flicker).
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
    if (spec.type === 'cat' && mode === 'pro') return 'All controls';
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

    // header
    const title = $('pageTitle');
    const newTitle = pageTitleFor(spec);
    if (title.textContent !== newTitle) { title.textContent = newTitle; M.contentIn(title); }
    $('pageMeta').textContent = meta || '';
    $('backBtn').classList.toggle('is-on', navStack.length > 1);
    $('backBtn').tabIndex = navStack.length > 1 ? 0 : -1;
    $('cardFoot').classList.toggle('is-collapsed', footCollapsed());
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
    // Content that grows on its own (Advanced disclosure, Custom box) is tracked frame by frame.
    pageRO = new ResizeObserver(() => {
      if (!page.isConnected || page.classList.contains('is-leaving')) return;
      if (Math.abs(inner.offsetHeight - (inner._h || 0)) < 1) return;
      fitPages(null, false);
    });
    pageRO.observe(inner);
    fitPages(fromH, !!old && !!dir);
    syncRail(!dockOpen);
    refreshChanged();
    // pills inside the new page need layout first
    requestAnimationFrame(() => page.querySelectorAll('.seg').forEach((s) => syncSeg(s, null, s.dataset.value, true)));
    if (spec.type === 'new') requestAnimationFrame(() => syncTiles(page, true));
  }

  function buildPage(spec, inner) {
    if (spec.type === 'cat' && mode === 'pro') return Acc.build(spec.cat, inner);
    if (spec.type === 'cat') return buildCat(spec.cat, inner);
    if (spec.type === 'role') return buildRole(spec.id, inner);
    if (spec.type === 'settings') return buildSettings(inner);
    if (spec.type === 'user') return buildUser(inner);
    if (spec.type === 'new') return buildNew(spec, inner);
    return '';
  }

  // ---------- category page ----------
  function buildCat(cat, inner) {
    const r = fillCat(cat, inner);
    if (mode === 'basic') return basicVars().length + ' of ' + vars.length + ' controls';
    return r.n + (r.n === 1 ? ' control' : ' controls') + (r.adv ? ' · ' + r.adv + ' advanced' : '');
  }
  function fillCat(cat, inner) {
    let list, adv = [];
    if (mode === 'basic') list = basicVars().filter((v) => v.category === cat);
    else { const all = vars.filter((v) => v.category === cat); list = all.filter((v) => !v.advanced); adv = all.filter((v) => v.advanced); }
    if (cat === 'color' && vars.some((v) => v.control === 'swatch-role')) inner.appendChild(buildPresets());
    list.forEach((v) => inner.appendChild(ctlRow(v)));
    if (adv.length) inner.appendChild(foldEl('Advanced', adv.length, (bodyIn) => adv.forEach((v) => bodyIn.appendChild(ctlRow(v)))));
    if (!list.length && !adv.length) inner.appendChild(el('p', 'empty', 'Nothing in this category for this component.'));
    return { n: list.length + adv.length, adv: adv.length };
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
  // A var's group comes from manifest "group"; otherwise from these per-category rules.
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
  // Slim line at the top of Pro: what Pro adds over Basic.
  function proStrip() {
    const adv = vars.filter((v) => v.advanced).length, ia = interactVars().length;
    const s = el('div', 'pro-strip');
    s.innerHTML = '<span class="pro-tag">Pro adds</span>'
      + '<span title="Every control, not just the ' + basicVars().length + ' featured">all ' + vars.length + '</span>'
      + (adv ? '<span title="Inner Advanced and More folds">' + adv + ' advanced</span>' : '')
      + (ia ? '<span class="is-ia" title="Cursor / touch / keyboard behaviour">' + svg('interact') + ia + ' interaction</span>' : '')
      + '<span title="Copy full file carries every value, including the ones Basic hides">full-file copy</span>';
    return s;
  }

  // ---------- Pro: accordion sections in one scrolling panel ----------
  // Variants (Settings or the 3-dot menu): A slide + fade, B spring morph (header pinned, body
  // grows with a slight scale), C stagger-reveal of rows, D exclusive (one open, the rest shrink
  // to chips). Collapse: remember (per component, localStorage) / all open / all closed.
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
      // keep the rail pill on the section at the top of the scroll
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
    // Animate one section. fromH = body height before the class change.
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
        // Spring morph, header pinned: only the body moves. Height uses a soft spring (~3% overshoot),
        // so the sections below are pushed by the same curve; content scales up from the header edge.
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
    // Set several sections at once (FLIP the section boxes for D, where chips reflow).
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
    $('moreBtn').classList.toggle('is-hidden', mode !== 'pro');
    $('moreBtn').tabIndex = mode === 'pro' ? 0 : -1;
    if (mode !== 'pro') Pop.hide();
  }

  // Quick interaction toggle under the header: only when the component has a hover behaviour.
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

  function buildPresets() {
    const wrapEl = el('div', 'presets');
    wrapEl.appendChild(el('div', 'ctl-label sub', 'Palettes from this project'));
    const row = el('div', 'preset-row');
    allPresets().forEach((p) => {
      const b = el('button', 'preset', '<span class="preset-dots">' + presetDots(p).map((c) => '<i style="background:' + c + '"></i>').join('') + '</span><span>' + esc(p.name) + '</span>');
      b.type = 'button';
      b.title = p.colors ? 'Apply ' + p.name + ' to every colour' : 'Back to the component\u2019s own colours';
      b.addEventListener('click', () => applyPreset(p));
      row.appendChild(b);
    });
    wrapEl.appendChild(row);
    return wrapEl;
  }

  function starBtn(v) {
    const b = el('button', 'star' + (v.featured ? ' is-on' : ''), svg('star'));
    b.type = 'button';
    b.setAttribute('aria-pressed', v.featured ? 'true' : 'false');
    b.title = v.featured ? 'Featured in Basic (click to remove)' : 'Feature in Basic';
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const count = vars.filter((x) => x.featured).length;
      if (!v.featured && count >= BASIC_CAP) { toast('Basic holds ' + BASIC_CAP + ' controls. Unstar one first.'); return; }
      v.featured = !v.featured;
      const ov = featuredOverrides();
      ov[v.id] = v.featured;
      store.set('featured:' + def.id, ov);
      b.classList.toggle('is-on', v.featured);
      b.setAttribute('aria-pressed', v.featured ? 'true' : 'false');
      b.title = v.featured ? 'Featured in Basic (click to remove)' : 'Feature in Basic';
      toast(v.featured ? v.label + ' is now in Basic (' + (count + 1) + '/' + BASIC_CAP + ').' : v.label + ' removed from Basic.');
    });
    return b;
  }

  function ctlRow(v, opts) {
    const compact = !!(opts && opts.compact);
    const row = el('div', 'ctl ctl-' + v.control + (compact ? ' is-compact' : '') + (v.signature && mode === 'pro' ? ' is-sig' : ''));
    row.dataset.id = v.id;
    const head = el('div', 'ctl-head');
    const lab = el('label', 'ctl-label', (v.signature && mode === 'pro' ? svg('sig', 'sig-ico') : '') + esc(compact && v.short ? v.short : v.label));
    if (v.signature && mode === 'pro') row.title = 'Signature feature of this component';
    lab.title = (v.hint ? v.hint + '\n' : '') + v.id + (v.css ? '  ' + v.css : '') + '\nDouble-click to reset';
    lab.addEventListener('dblclick', () => setValue(v.id, v.default));
    const out = el('span', 'ctl-val', esc(fmt(v, P[v.id])));
    head.append(lab, out);
    if (mode === 'pro') head.appendChild(starBtn(v));
    row.appendChild(head);
    const uid = 'c-' + v.id;

    if (v.control === 'slider') {
      lab.htmlFor = uid;
      const r = el('input', 'range');
      Object.assign(r, { type: 'range', id: uid, min: v.min, max: v.max, step: v.step, value: P[v.id] });
      const paint = () => r.style.setProperty('--p', ((r.value - v.min) / (v.max - v.min || 1) * 100).toFixed(2) + '%');
      paint();
      r.addEventListener('input', () => { setValue(v.id, r.value, { quiet: true }); paint(); out.textContent = fmt(v, P[v.id]); });
      row.appendChild(r);
    } else if (v.control === 'swatch-role') {
      const line = el('div', 'swatch-line');
      if (mode === 'basic' && M.level() === 'full') {
        const trig = el('button', 'swatch-trigger', '<span class="sw" style="background:' + P[v.id] + '"></span><span class="sw-hex">' + esc(String(P[v.id]).toUpperCase()) + '</span>');
        trig.type = 'button';
        trig.setAttribute('aria-haspopup', 'true');
        trig.setAttribute('aria-label', v.label + ': pick a colour');
        trig.addEventListener('click', (e) => { e.stopPropagation(); Arc.toggle(trig, v); });
        line.appendChild(trig);
        out.textContent = '';
      } else {
        const chips = el('div', 'chips');
        swatchesFor(v, compact ? 4 : 6).forEach((c) => chips.appendChild(chip(v, c)));
        line.appendChild(chips);
      }
      const more = el('button', 'icon-btn more-btn', svg('chev'));
      more.type = 'button';
      more.setAttribute('aria-label', 'All colours for ' + v.label);
      more.title = 'All colours';
      more.addEventListener('click', () => push({ type: 'role', id: v.id }));
      line.appendChild(more);
      row.appendChild(line);
    } else if (v.control === 'switch') {
      const sw = el('button', 'switch', '<span class="knob"></span>');
      sw.type = 'button'; sw.id = uid;
      sw.setAttribute('role', 'switch');
      sw.setAttribute('aria-checked', P[v.id] ? 'true' : 'false');
      sw.setAttribute('aria-label', v.label);
      sw.addEventListener('click', () => setValue(v.id, !P[v.id]));
      head.insertBefore(sw, out.nextSibling);
      out.remove();
      row.classList.add('ctl-inline');
    } else if (v.control === 'segmented') {
      const seg = el('div', 'seg seg-sm');
      seg.setAttribute('role', 'radiogroup');
      seg.setAttribute('aria-label', v.label);
      buildSeg(seg, v.options.map((o) => ({ value: o.value, label: o.label })), P[v.id], (val) => setValue(v.id, val, { quiet: true }) || (out.textContent = fmt(v, P[v.id])), { equal: true });
      row.appendChild(seg);
    } else if (v.control === 'radial') {
      row.appendChild(dialEl(v, out));
    } else if (v.control === 'select') {
      lab.htmlFor = uid;
      const s = el('select', 'lab-select');
      s.id = uid;
      v.options.forEach((o) => { const op = el('option', null, esc(o.label)); op.value = o.value; s.appendChild(op); });
      s.value = String(P[v.id]);
      s.addEventListener('change', () => setValue(v.id, s.value));
      row.appendChild(s);
    }
    return row;
  }
  // Radial dial for angle-type values (unit °: the needle shows the real angle, 0 = up, clockwise)
  // or any bounded number (270° sweep). Drag around it, or use the arrow keys.
  function dialEl(v, out) {
    const isDeg = v.unit === '°';
    const d = el('div', 'dial');
    d.tabIndex = 0;
    d.setAttribute('role', 'slider');
    d.setAttribute('aria-label', v.label);
    d.setAttribute('aria-valuemin', v.min);
    d.setAttribute('aria-valuemax', v.max);
    d.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="dial-face" cx="32" cy="32" r="27"/><path class="dial-range"/><path class="dial-arc"/><line class="dial-needle" x1="32" y1="32" x2="32" y2="14"/><circle class="dial-hub" cx="32" cy="32" r="3.2"/></svg>';
    const a0 = isDeg ? v.min : -135, span = isDeg ? Math.min(359.9, v.max - v.min) : 270;
    const angOf = (val) => (isDeg ? Number(val) : a0 + ((val - v.min) / (v.max - v.min || 1)) * span);
    const pt = (a, r) => [(32 + r * Math.sin(a * Math.PI / 180)).toFixed(2), (32 - r * Math.cos(a * Math.PI / 180)).toFixed(2)];
    const arc = (a1, a2, r) => { if (a2 - a1 < 0.5) return ''; const p1 = pt(a1, r), p2 = pt(a2, r); return 'M' + p1.join(' ') + ' A' + r + ' ' + r + ' 0 ' + (a2 - a1 > 180 ? 1 : 0) + ' 1 ' + p2.join(' '); };
    const paint = () => {
      const a = angOf(P[v.id]);
      d.querySelector('.dial-range').setAttribute('d', arc(a0, a0 + span, 24));
      d.querySelector('.dial-arc').setAttribute('d', arc(a0, a, 24));
      const tip = pt(a, 18), n = d.querySelector('.dial-needle');
      n.setAttribute('x2', tip[0]); n.setAttribute('y2', tip[1]);
      d.setAttribute('aria-valuenow', P[v.id]);
      d.setAttribute('aria-valuetext', fmt(v, P[v.id]));
    };
    const put = (val) => {
      const st = v.step || 1;
      val = Math.min(v.max, Math.max(v.min, Math.round(val / st) * st));
      setValue(v.id, +val.toFixed(decimals(st)), { quiet: true });
      paint();
      if (out) out.textContent = fmt(v, P[v.id]);
    };
    const fromEvent = (e) => {
      const r = d.getBoundingClientRect();
      let a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
      if (isDeg) {
        a = (a + 360) % 360;
        if (a < v.min || a > v.max) { const mid = (v.max + (360 - v.max + v.min) / 2) % 360; a = a > v.max && a < mid ? v.max : v.min; }
        put(a);
      } else put(v.min + ((Math.min(135, Math.max(-135, a)) + 135) / 270) * (v.max - v.min));
    };
    d.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      d.focus({ preventScroll: true });
      d.setPointerCapture(e.pointerId);
      d.classList.add('is-drag');
      fromEvent(e);
      const mv = (ev) => fromEvent(ev);
      const upf = () => { d.classList.remove('is-drag'); d.removeEventListener('pointermove', mv); d.removeEventListener('pointerup', upf); d.removeEventListener('pointercancel', upf); };
      d.addEventListener('pointermove', mv);
      d.addEventListener('pointerup', upf);
      d.addEventListener('pointercancel', upf);
    });
    d.addEventListener('keydown', (e) => {
      const st = (v.step || 1) * (e.shiftKey ? 10 : 1);
      const k = { ArrowUp: st, ArrowRight: st, ArrowDown: -st, ArrowLeft: -st }[e.key];
      if (k != null) { e.preventDefault(); put(Number(P[v.id]) + k); }
      else if (e.key === 'Home') { e.preventDefault(); put(v.min); }
      else if (e.key === 'End') { e.preventDefault(); put(v.max); }
    });
    d._paint = paint;
    paint();
    return d;
  }
  function chip(v, c) {
    const b = el('button', 'chip' + (same(P[v.id], c) ? ' is-on' : ''));
    b.type = 'button';
    b.style.setProperty('--c', c);
    b.dataset.c = c;
    b.title = c.toUpperCase() + (same(c, v.default) ? ' (default)' : '');
    b.setAttribute('aria-label', v.label + ' ' + c);
    b.addEventListener('click', () => setValue(v.id, c));
    return b;
  }
  function syncRow(id) {
    const v = byId[id];
    document.querySelectorAll('.ctl[data-id="' + id + '"]').forEach((row) => {
      const out = row.querySelector('.ctl-val');
      if (out && !row.querySelector('.swatch-trigger')) out.textContent = fmt(v, P[id]);
      const r = row.querySelector('input.range');
      if (r) { r.value = P[id]; r.style.setProperty('--p', ((P[id] - v.min) / (v.max - v.min || 1) * 100).toFixed(2) + '%'); }
      const sw = row.querySelector('.switch');
      if (sw) sw.setAttribute('aria-checked', P[id] ? 'true' : 'false');
      const seg = row.querySelector('.seg');
      if (seg) syncSeg(seg, null, P[id]);
      const sel = row.querySelector('select');
      if (sel) sel.value = String(P[id]);
      const dl = row.querySelector('.dial');
      if (dl && dl._paint) dl._paint();
      const trig = row.querySelector('.swatch-trigger');
      if (trig) { trig.querySelector('.sw').style.background = P[id]; trig.querySelector('.sw-hex').textContent = String(P[id]).toUpperCase(); }
      row.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', same(c.dataset.c, P[id])));
      const hexIn = row.querySelector('.hex-in');
      if (hexIn && document.activeElement !== hexIn) hexIn.value = String(P[id]).toUpperCase();
      const col = row.querySelector('input[type=color]');
      if (col) col.value = P[id];
    });
  }

  // ---------- nested colour page ----------
  function buildRole(id, inner) {
    const v = byId[id];
    if (!v) return '';
    const row = el('div', 'ctl ctl-role');
    row.dataset.id = id;
    const head = el('div', 'ctl-head');
    head.append(el('span', 'ctl-label', 'Current'), el('span', 'ctl-val', esc(String(P[id]).toUpperCase())));
    row.appendChild(head);
    const cur = el('div', 'role-current', '<span class="sw-big" style="background:' + P[id] + '"></span><span class="role-note">' + esc(v.role) + ' role · ' + esc(v.id) + '</span>');
    row.appendChild(cur);
    const src = ui.paletteSource === 'user' && userPalette() ? 'My palette' : 'Project palette';
    row.appendChild(el('div', 'ctl-label sub', src + ', best matches first'));
    const chips = el('div', 'chips chips-wrap');
    swatchesFor(v, 18).forEach((c) => chips.appendChild(chip(v, c)));
    row.appendChild(chips);
    const actions = el('div', 'role-actions');
    const reset = el('button', 'link-btn', 'Use default (' + esc(String(v.default).toUpperCase()) + ')');
    reset.type = 'button';
    reset.addEventListener('click', () => setValue(id, v.default));
    const customBtn = el('button', 'link-btn', 'Custom…');
    customBtn.type = 'button';
    actions.append(reset, customBtn);
    row.appendChild(actions);
    const custom = el('div', 'custom-box');
    const colIn = el('input', 'color-in');
    colIn.type = 'color'; colIn.value = P[id]; colIn.setAttribute('aria-label', 'Colour picker');
    const hexIn = el('input', 'hex-in');
    hexIn.type = 'text'; hexIn.value = String(P[id]).toUpperCase(); hexIn.maxLength = 7; hexIn.spellcheck = false; hexIn.setAttribute('aria-label', 'Hex value');
    colIn.addEventListener('input', () => setValue(id, colIn.value));
    hexIn.addEventListener('input', () => { const h = /^#?[0-9a-f]{6}$/i.test(hexIn.value.trim()) ? S.hex('#' + hexIn.value.trim().replace('#', '')) : null; hexIn.classList.toggle('is-bad', !h); if (h) setValue(id, h); });
    custom.append(colIn, hexIn);
    row.appendChild(custom);
    customBtn.addEventListener('click', () => { custom.classList.toggle('is-open'); if (custom.classList.contains('is-open')) hexIn.focus(); });
    // keep the big swatch in sync
    const syncBig = () => { cur.querySelector('.sw-big').style.background = P[id]; head.querySelector('.ctl-val').textContent = String(P[id]).toUpperCase(); };
    row.addEventListener('click', () => requestAnimationFrame(syncBig));
    row.addEventListener('input', () => requestAnimationFrame(syncBig));
    inner.appendChild(row);
    return v.category === 'color' ? 'Colour' : '';
  }

  // ---------- radial gooey palette picker ----------
  // Plain blobs go through the SVG goo filter (so they melt out of the trigger); the coloured dots
  // are drawn on a separate layer on top, so the filter never smears the actual colours.
  const Arc = (function () {
    let node = null, owner = null, v = null;
    // Fans out to the side with more room inside the card (right for a right dock, so it never
    // spills past the card edge), on a 60px radius.
    const R = 60, N = 6;
    const span = () => [-58, 58];
    function pts() {
      const out = [];
      const [A0, A1] = span();
      for (let i = 0; i < N; i++) { const a = (A0 + (A1 - A0) * (i / (N - 1))) * Math.PI / 180; out.push({ x: Math.cos(a) * R, y: Math.sin(a) * R }); }
      return out;
    }
    function open(trig, variable) {
      close(true);
      owner = trig; v = variable;
      const r = trig.querySelector('.sw').getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      node = el('div', 'arc');
      node.style.left = cx + 'px';
      node.style.top = cy + 'px';
      node.setAttribute('role', 'listbox');
      node.setAttribute('aria-label', v.label + ' colours');
      const goo = el('div', 'arc-goo');
      const topL = el('div', 'arc-top');
      goo.appendChild(el('span', 'arc-blob arc-core'));
      const colors = swatchesFor(v, N);
      const P2 = pts();
      const full = M.level() === 'full';
      colors.forEach((c, i) => {
        const p = P2[i];
        const blob = el('span', 'arc-blob');
        goo.appendChild(blob);
        const dot = el('button', 'arc-dot' + (same(c, P[v.id]) ? ' is-on' : ''));
        dot.type = 'button';
        dot.style.setProperty('--c', c);
        dot.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
        dot.title = c.toUpperCase() + (same(c, v.default) ? ' (default)' : '');
        dot.setAttribute('role', 'option');
        dot.setAttribute('aria-label', c);
        dot.addEventListener('click', (e) => { e.stopPropagation(); setValue(v.id, c); node && node.querySelectorAll('.arc-dot').forEach((d) => d.classList.toggle('is-on', d === dot)); setTimeout(() => close(), 140); });
        topL.appendChild(dot);
        if (full) {
          blob.animate([{ transform: 'translate(0,0) scale(0.6)' }, { transform: 'translate(' + p.x + 'px,' + p.y + 'px) scale(1)' }], { duration: 520, delay: i * 28, easing: M.spring, fill: 'both' });
          dot.animate([{ transform: 'translate(' + p.x * 0.4 + 'px,' + p.y * 0.4 + 'px) scale(0.4)', opacity: 0 }, { transform: 'translate(' + p.x + 'px,' + p.y + 'px) scale(1)', opacity: 1 }], { duration: 480, delay: 60 + i * 28, easing: M.spring, fill: 'both' });
        } else blob.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
      });
      const center = el('span', 'arc-center');
      center.style.background = P[v.id];
      topL.appendChild(center);
      node.append(goo, topL);
      document.body.appendChild(node);
      trig.classList.add('is-open');
      trig.setAttribute('aria-expanded', 'true');
      const first = topL.querySelector('.arc-dot.is-on') || topL.querySelector('.arc-dot');
      if (first) first.focus({ preventScroll: true });
    }
    function close(instant) {
      if (!node) return;
      const n = node, t = owner;
      node = null; owner = null; v = null;
      if (t) { t.classList.remove('is-open'); t.setAttribute('aria-expanded', 'false'); }
      if (instant || M.level() !== 'full') { n.remove(); return; }
      n.classList.add('is-closing');
      const blobs = n.querySelectorAll('.arc-blob:not(.arc-core)');
      n.querySelectorAll('.arc-dot').forEach((d) => d.animate([{ opacity: 1 }, { opacity: 0, transform: 'translate(0,0) scale(0.3)' }], { duration: 200, easing: M.easeOut, fill: 'forwards' }));
      const anims = [...blobs].map((b) => b.animate([{}, { transform: 'translate(0,0) scale(0.5)' }], { duration: 240, easing: M.settle, fill: 'forwards' }));
      Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(() => n.remove());
    }
    return {
      open, close,
      toggle(trig, variable) { if (node && owner === trig) close(); else open(trig, variable); },
      get isOpen() { return !!node; },
      contains(t) { return !!node && node.contains(t); }
    };
  })();

  // ---------- hold to confirm ----------
  function holdButton(label, ms, fn) {
    const b = el('button', 'hold-btn', '<span class="hold-fill"></span><span class="hold-label">' + esc(label) + '</span>');
    b.type = 'button';
    b.title = 'Press and hold';
    const fill = b.querySelector('.hold-fill');
    let a = null;
    const start = (e) => {
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      if (e.type === 'keydown') { e.preventDefault(); if (e.repeat) return; }
      if (a) return;
      b.classList.add('is-holding');
      a = fill.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: ms, easing: 'linear', fill: 'forwards' });
      a.finished.then(() => {
        a = null;
        b.classList.remove('is-holding');
        b.classList.add('is-done');
        fn();
        setTimeout(() => { b.classList.remove('is-done'); fill.getAnimations().forEach((x) => x.cancel()); }, 900);
      }).catch(() => {});
    };
    const stop = () => {
      if (!a) return;
      const cur = a;
      a = null;
      b.classList.remove('is-holding');
      const p = Number(getComputedStyle(fill).transform.split(',')[0].replace('matrix(', '')) || 0;
      cur.cancel();
      fill.animate([{ transform: 'scaleX(' + p + ')' }, { transform: 'scaleX(0)' }], { duration: 220, easing: M.easeOut });
    };
    b.addEventListener('pointerdown', start);
    b.addEventListener('keydown', start);
    ['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur'].forEach((ev) => b.addEventListener(ev, stop));
    return b;
  }

  // ---------- settings ----------
  function section(inner, title) { inner.appendChild(el('div', 'ctl-label sub sec', esc(title))); }
  // Settings › Rail order: drag the grip, or use the arrows; the eye hides a category from the rail
  // (its Pro section stays). Global for every component; Reset restores the default order.
  // One reorder list, used twice: categories (ui.railOrder/railHidden) and rail actions
  // (ui.toolOrder/toolHidden). Settings is never in a list, so it can't be moved or hidden.
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
        // pointer drag on the grip (mouse, pen and touch)
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
      // slide rows from where they were (keeps the change readable)
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
  // ---------- Settings > Profile: the pass shown on the closed dock ----------
  function buildProfile(inner) {
    if (!window.Pass) return;
    section(inner, 'Profile pass');
    const stage = el('div', 'pass-stage');
    const paint = () => { stage.innerHTML = Pass.fullHtml(); };
    paint();
    inner.appendChild(stage);
    const upd = (patch, msg) => { Pass.set(patch); paint(); if (msg) Log.push(msg); };
    const cur = () => Pass.profile;

    const nameIn = el('input', 'field-in');
    nameIn.type = 'text'; nameIn.maxLength = 18; nameIn.spellcheck = false; nameIn.value = cur().name; nameIn.setAttribute('aria-label', 'Name on the pass');
    nameIn.addEventListener('input', () => upd({ name: nameIn.value }));
    inner.appendChild(setRow('Name', nameIn));

    const roleIn = el('input', 'field-in');
    roleIn.type = 'text'; roleIn.maxLength = 24; roleIn.spellcheck = false; roleIn.value = cur().role; roleIn.setAttribute('aria-label', 'Role line');
    roleIn.addEventListener('input', () => upd({ role: roleIn.value }));
    inner.appendChild(setRow('Role', roleIn));

    const tierSel = el('select', 'lab-select');
    tierSel.setAttribute('aria-label', 'Access level');
    Pass.TIERS.forEach((t) => { const o = el('option', null, esc(t.label)); o.value = t.id; tierSel.appendChild(o); });
    tierSel.value = cur().tier;
    tierSel.addEventListener('change', () => upd({ tier: tierSel.value }, 'pass tier ' + tierSel.value));
    inner.appendChild(setRow('Access level', tierSel));

    const acc = el('div', 'prof-accents');
    Pass.ACCENTS.forEach((c) => {
      const b = el('button', 'prof-accent' + (c === cur().accent ? ' is-on' : ''));
      b.type = 'button'; b.style.setProperty('--c', c); b.title = c.toUpperCase(); b.setAttribute('aria-label', 'Accent ' + c);
      b.addEventListener('click', () => { upd({ accent: c }, 'pass accent ' + c); acc.querySelectorAll('.prof-accent').forEach((x) => x.classList.toggle('is-on', x === b)); drawSource(); });
      acc.appendChild(b);
    });
    inner.appendChild(setRow('Accent', acc));

    const src = el('div', 'seg seg-sm');
    buildSeg(src, [{ value: 'glyph', label: 'Design' }, { value: 'text', label: 'Characters' }, { value: 'image', label: 'Photo' }], cur().type, (val) => { upd({ type: val }, 'pass picture ' + val); drawSource(); }, { equal: true });
    inner.appendChild(setRow('Picture', src));

    const box = el('div', 'prof-src');
    inner.appendChild(box);
    function drawSource() {
      const p = cur();
      box.innerHTML = '';
      if (p.type === 'glyph') {
        const g = el('div', 'prof-grid');
        Pass.DESIGNS.forEach((d) => {
          const b = el('button', 'prof-design' + (d.id === p.glyph ? ' is-on' : ''), '<svg viewBox="0 0 32 32" aria-hidden="true">' + d.svg + '</svg><span>' + esc(d.label) + '</span>');
          b.type = 'button'; b.setAttribute('aria-label', d.label);
          b.addEventListener('click', () => { upd({ glyph: d.id }, 'pass design ' + d.label.toLowerCase()); g.querySelectorAll('.prof-design').forEach((x) => x.classList.toggle('is-on', x === b)); });
          g.appendChild(b);
        });
        box.appendChild(g);
      } else if (p.type === 'text') {
        const ch = el('input', 'field-in');
        ch.type = 'text'; ch.maxLength = 3; ch.spellcheck = false; ch.value = p.chars; ch.placeholder = 'e.g. RS'; ch.setAttribute('aria-label', 'Characters');
        ch.addEventListener('input', () => upd({ chars: ch.value }));
        box.append(setRow('Characters (up to 3)', ch));
      } else {
        const row = el('div', 'prof-photo');
        const file = el('input'); file.type = 'file'; file.accept = 'image/*'; file.hidden = true;
        const pick = el('button', 'btn', p.image ? 'Replace photo' : 'Upload photo');
        pick.type = 'button';
        pick.addEventListener('click', () => file.click());
        file.addEventListener('change', async () => {
          const f = file.files && file.files[0];
          if (!f) return;
          try { const url = await Pass.fileToDataUrl(f); upd({ type: 'image', image: url }, 'pass photo set'); drawSource(); }
          catch (e) { toast(e.message, 4200); }
          file.value = '';
        });
        row.append(pick, file);
        if (p.image) {
          const rm = el('button', 'btn', 'Remove');
          rm.type = 'button';
          rm.addEventListener('click', () => { upd({ image: '', type: 'glyph' }, 'pass photo removed'); syncSeg(src, null, 'glyph'); drawSource(); });
          row.appendChild(rm);
        }
        row.appendChild(el('p', 'note', 'Cropped to a square and kept in this browser only (about 10 KB).'));
        box.appendChild(row);
      }
    }
    drawSource();

    const rs = el('button', 'link-btn', 'Reset profile pass');
    rs.type = 'button';
    rs.addEventListener('click', () => { Pass.reset(); renderPage(0); Log.push('profile pass reset'); toast('Profile pass reset.'); });
    inner.appendChild(rs);
  }

  function buildSettings(inner) {
    buildProfile(inner);
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
      b.title = a.replace('-', ' ');
      b.setAttribute('aria-label', 'Anchor ' + a.replace('-', ' '));
      b.addEventListener('click', () => {
        if (ui.dockPos === 'bottom') { toast('Anchor applies to the right dock.'); return; }
        ui.anchor = a; saveUi();
        grid.querySelectorAll('.anchor-dot').forEach((x) => x.classList.toggle('is-on', x === b));
        relayout();
      });
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

    const up = userPalette();
    const src = el('div', 'seg seg-sm');
    buildSeg(src, [{ value: 'project', label: 'Project' }, { value: 'user', label: 'My palette', disabled: !up, hint: 'Save a palette under My palette first' }], up ? ui.paletteSource : 'project', (val) => { ui.paletteSource = val; saveUi(); toast('Swatches now come from ' + (val === 'user' ? 'My palette' : 'the project CSS')); }, { equal: true });
    inner.appendChild(setRow('Palette source', src, up ? null : 'Save a palette under My palette to use it here.'));

    const nav = el('button', 'nav-row', svg('user') + '<span>My palette</span><span class="nav-meta">' + (up ? up.length + ' colours' : 'not set') + '</span>' + svg('chev'));
    nav.type = 'button';
    nav.addEventListener('click', () => push({ type: 'user' }));
    inner.appendChild(nav);

    section(inner, 'Rail order');
    inner.appendChild(railOrderEl(CAT_ORDER));
    inner.appendChild(el('div', 'ctl-label sub', 'Rail actions'));
    inner.appendChild(railOrderEl(TOOL_ORDER));

    section(inner, 'Viewport');
    const vps = el('div', 'seg seg-sm');
    vps.dataset.set = 'viewport';
    buildSeg(vps, [VIEWS[1], VIEWS[2], VIEWS[0]].map((x) => ({ value: x.id, label: x.label })), ui.view, (val) => setView(val), { equal: true });
    inner.appendChild(setRow('Sandbox frame', vps, '1600×770 is the default: the HP laptop (Chrome on a 1600×900 screen). 1366×768 and Fit are extra checks.'));

    section(inner, 'Toolbar');
    inner.appendChild(switchRow('Show toolbar icon', () => ui.tbOut !== false, (on) => TB.setOut(on), 'The floating toolbar over the stage (top left). The rail toolbar button also shows or hides it.'));
    inner.appendChild(el('p', 'note tb-gestures', 'Gestures on the toolbar icon: click opens or closes all groups · Shift+click or ←/→ one group · flick right opens (harder = all) · gentle flick left closes one · strong flick left or up dismisses it until the next reload or component switch. Rail button: click toggles · flick toward the stage throws it out (gentle = first group, strong = all) · flick away sends it back.'));
    const tbs = el('div', 'seg seg-sm');
    tbs.dataset.tb = 'start';
    buildSeg(tbs, [{ value: 'closed', label: 'Closed' }, { value: 'open', label: 'Open' }, { value: 'remember', label: 'Remember' }], ui.tbStart, (val) => { ui.tbStart = val; saveUi(); Log.push('toolbar start ' + val); }, { equal: true });
    inner.appendChild(setRow('Start state', tbs, 'How the toolbar opens when the lab loads. Remember reopens the groups you had open.'));
    inner.appendChild(switchRow('Outside click closes it', () => ui.tbAutoClose, (on) => { ui.tbAutoClose = on; saveUi(); }));
    inner.appendChild(el('p', 'note', 'Position: top left (top right while the card is anchored on the left). More positions and side panels plug in later (README › Toolbar).'));
    inner.appendChild(switchRow('Flick physics', () => ui.flick, (on) => { ui.flick = on; M.flickOn = on; saveUi(); fs.querySelectorAll('.seg-btn').forEach((b) => { b.disabled = !on; }); }, 'Flick the rail toolbar button toward the stage to throw the toolbar out; flick back to return it. Clicks and keys always work.'));
    const fs = el('div', 'seg seg-sm');
    fs.dataset.tb = 'flick';
    buildSeg(fs, [{ value: 'light', label: 'Light' }, { value: 'normal', label: 'Normal' }, { value: 'heavy', label: 'Heavy' }], ui.flickStrength, (val) => { ui.flickStrength = val; M.flickStrength = val; saveUi(); Log.push('flick ' + val); }, { equal: true });
    if (!ui.flick) fs.querySelectorAll('.seg-btn').forEach((b) => { b.disabled = true; });
    inner.appendChild(setRow('Flick strength', fs, 'Light: a soft flick is enough. Heavy: needs a fast, long flick.'));

    section(inner, 'Pro sections');
    const col = el('div', 'seg seg-sm');
    col.dataset.acc = 'collapse';
    buildSeg(col, COLLAPSE.map((c) => ({ value: c.id, label: c.label })), ui.accCollapse, (val) => Acc.setCollapse(val), { equal: true });
    inner.appendChild(setRow('Collapse state', col, 'Remember reopens what you had open, per component.'));
    const vseg = el('div', 'seg seg-sm');
    vseg.dataset.acc = 'variant';
    buildSeg(vseg, VARIANTS.map((v) => ({ value: v.id, label: v.id + ' ' + v.label })), ui.accVariant, (val) => Acc.setVariant(val), { equal: true });
    inner.appendChild(setRow('Section motion', vseg, 'B spring morph is the default. A slide + fade · C stagger rows · D one open, rest as chips. Also in the ⋮ menu.'));
    const scan = (man.scan || []);
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
    save.title = 'Write components/' + def.id + '/manifest.json (stars included)';
    save.addEventListener('click', saveManifest);
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
    btns.append(save, exp);
    inner.appendChild(btns);

    section(inner, 'Reset');
    inner.appendChild(holdButton('Hold to reset all', 1200, () => {
      store.del('values:' + def.id);
      store.del('featured:' + def.id);
      store.del('manifest:' + def.id);
      vars.forEach((v) => { P[v.id] = v.default; });
      loadComponent(def.id, false).then(() => { go({ type: 'settings' }); toast('Reset: every value, star and saved scan for ' + def.title + '.'); });
    }));
    inner.appendChild(el('p', 'note', 'Resets every value and star for this component.'));
    return def.title;
  }
  async function saveManifest() {
    try {
      const r = await fetch('api/manifest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: def.id, manifest: manifestForExport() }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || 'HTTP ' + r.status);
      man.auto = false;
      store.del('featured:' + def.id);
      store.del('manifest:' + def.id);
      toast('Saved components/' + def.id + '/manifest.json');
    } catch (e) {
      toast('Could not save (' + e.message + '). Is the lab running from serve.py? Export JSON works anywhere.', 6000);
    }
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
      toast('Could not create (' + e.message + '). Needs serve.py; or run: python3 new-component.py ' + name + ' --kind ' + newDraft.kind, 7000);
      return;
    }
    await loadScript('components/registry.js' + bust()).catch(() => {});
    buildPicker();
    store.del('values:' + name);
    await loadComponent(name, false);
    toast('Created components/' + name + '/ and loaded it.');
  }

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
  async function copyText(text) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      const ta = el('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove();
    }
    window.__lastCopy = text;
    if (!ok) console.log(text);
    return ok;
  }

  // ---------- a) copy changes: small prompt-ready snippet ----------
  function changesText() {
    const ch = changedVars();
    const lines = ['Component Lab: ' + def.title + ' (' + def.id + '), ' + ch.length + ' changed'];
    lines.push('Files: components/' + def.id + '/ (' + ['manifest.json'].concat(def.css || [], def.markup ? [def.markup] : [], ['component.js']).join(', ') + ')');
    ch.forEach((v) => lines.push('- ' + v.label + ' [' + v.id + (v.css ? ' ' + v.css : '') + ']: ' + fmt(v, v.default) + ' -> ' + fmt(v, P[v.id])));
    const it = interactionText();
    if (it) lines.push(it);
    lines.push('Link: ' + location.href);
    return lines.join('\n');
  }
  // One line with every interaction setting (changed or not), for the snippet and the full file.
  function interactionText() {
    const ia = interactVars();
    if (!ia.length) return '';
    return 'Interaction: ' + ia.map((v) => (v.short || v.label).toLowerCase() + ' = ' + fmt(v, P[v.id]).toLowerCase() + ' [' + v.id + ']').join(', ');
  }
  async function copyChanges() {
    const ch = changedVars();
    if (!ch.length) return;
    const ok = await copyText(changesText());
    flashOk($('copyBtn'), ok);
    Log.push(ok ? 'copied ' + ch.length + ' change' + (ch.length === 1 ? '' : 's') : 'copy blocked (text in console)', ok ? 'ok' : 'bad');
    announce(ok ? 'Copied ' + ch.length + ' changes' : 'Copy blocked by the browser');
    if (!ok) toast('Copy blocked by the browser; text is in the console.');
  }

  // ---------- b) full working file: one standalone HTML with the current values baked in ----------
  async function workingFile() {
    const base = 'components/' + def.id + '/';
    const cssFiles = await Promise.all((def.css || []).map(async (f) => ({ name: f, text: (await fetchText(base + f)) || '' })));
    const markup = def.markup ? (await fetchText(base + def.markup)) || '' : '';
    const js = (await fetchText(base + 'component.js')) || '';
    const f = def.frames[frameKeyFor(ui.view)];
    const decl = ['width: ' + f.w + 'px', 'height: ' + f.h + 'px'];
    Object.entries(f.vars || {}).forEach(([k, v]) => decl.push(k + ': ' + v));
    vars.forEach((v) => { if (v.css) decl.push(v.css + ': ' + cssVal(v)); });
    const binds = bindStyle ? bindStyle.textContent : '';
    const ch = changedVars();
    const params = {};
    vars.forEach((v) => { params[v.id] = P[v.id]; });
    const stamp = new Date();
    const safe = (t) => String(t).replace(/<\/(script|style)/gi, '<\\/$1');
    const out = [
      '<!doctype html>',
      '<!--',
      '  Component Lab working file: ' + def.title + ' (' + def.id + ')',
      '  Source: components/' + def.id + '/ (' + (def.css || []).concat(def.markup ? [def.markup] : [], ['component.js']).join(', ') + ')',
      '  Frame: ' + frameKeyFor(ui.view) + ' (' + f.w + ' x ' + f.h + ')',
      '  Exported: ' + stamp.getFullYear() + '-' + String(stamp.getMonth() + 1).padStart(2, '0') + '-' + String(stamp.getDate()).padStart(2, '0') + ' ' + stamp.toTimeString().slice(0, 8) + ' (local time)',
      '  ' + (ch.length ? ch.length + ' changed from defaults:' : 'No changes from defaults.'),
      ch.map((v) => '    - ' + v.label + ' [' + v.id + (v.css ? ' ' + v.css : '') + ']: ' + fmt(v, v.default) + ' -> ' + fmt(v, P[v.id])).join('\n'),
      (interactionText() ? '  ' + interactionText() + '\n  (component.js reads these from LAB_PARAMS; the runner applies its rate() and time hooks.)' : '  Interaction: none in this component.'),
      '  Every value below (CSS custom properties on .lab-frame and LAB_PARAMS) is the live lab state.',
      '  Open this file in Chrome to see it run on its own.',
      '-->',
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8">',
      '<title>' + esc(def.title) + ' (working file)</title>',
      '<style>',
      'html, body { margin: 0; height: 100%; background: #07090d; color: #e9edf3; font: 13px/1.4 system-ui, sans-serif; }',
      '.lab-frame { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }',
      '</style>'
    ];
    const hv = vars.find((x) => x.interaction === 'hover-css');
    const hoverOff = (t) => (hv && !P[hv.id] ? t.replace(/:hover/g, ':hover:not(*)') : t);
    cssFiles.forEach((c) => out.push('<style data-file="' + esc(c.name) + '">\n' + safe(hoverOff(c.text)).trim() + '\n</style>'));
    out.push('<style data-file="lab-values">\n/* current lab values */\n.lab-frame[data-component="' + def.id + '"] {\n  ' + decl.join(';\n  ') + ';\n}\n' + (binds ? safe(binds) + '\n' : '') + '</style>');
    out.push('</head>', '<body>');
    out.push('<div class="lab-frame" id="labFrame" data-component="' + esc(def.id) + '">\n' + markup.trim() + '\n</div>');
    out.push('<script>\n// Lab shim: component.js calls Lab.register(); the runner below mounts it with these values.\nwindow.LAB_PARAMS = ' + safe(JSON.stringify(params, null, 2)) + ';\nwindow.LAB_MANIFEST = ' + safe(JSON.stringify(manifestForExport())) + ';\nwindow.Lab = { register: function (d) { window.LAB_DEF = d; }, get params() { return window.LAB_PARAMS; } };\n</script>');
    out.push('<script data-file="component.js">\n' + safe(js).trim() + '\n</script>');
    const tm = def.time || {};
    out.push('<script>\n// Runner: same loop as the lab (cycle / speed / direction, plus the interaction hooks:\n// inst.rate() scales playback for hover pause / slow / fast; time.nudge() lets drag spin it).\n(function () {\n  var P = window.LAB_PARAMS, d = window.LAB_DEF, frame = document.getElementById("labFrame");\n  var T = ' + JSON.stringify({ cycle: tm.cycle || null, speed: tm.speed || null, direction: tm.direction || null }) + ', animated = ' + (!!def.animated) + ', offset = ' + (+wrap(offset).toFixed(4)) + ', playing = ' + (!!def.animated && playing) + ', last = 0;\n  var time = { nudge: function (x) { offset += x; }, get offset() { return offset; }, set offset(v) { offset = v; }, get playing() { return playing; } };\n  var inst = (d && d.mount && d.mount(frame, { params: P, manifest: window.LAB_MANIFEST, time: time })) || {};\n  function tick(t) {\n    var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;\n    if (inst.render) {\n      if (animated && playing) {\n        var cyc = T.cycle && P[T.cycle] ? P[T.cycle] : 10, spd = T.speed && P[T.speed] !== undefined ? P[T.speed] : 1, dir = T.direction && P[T.direction] !== undefined ? Number(P[T.direction]) || 1 : 1;\n        var k = inst.rate ? Number(inst.rate(P, dt)) : 1; if (!isFinite(k)) k = 1;\n        offset += (dt / Math.max(0.1, cyc)) * spd * dir * k;\n      }\n      inst.render(P, ((offset % 1) + 1) % 1);\n    }\n    requestAnimationFrame(tick);\n  }\n  requestAnimationFrame(tick);\n})();\n</script>');
    out.push('</body>', '</html>', '');
    return out.join('\n');
  }
  async function copyFull() {
    const text = await workingFile();
    const ok = await copyText(text);
    flashOk($('fullBtn'), ok);
    Log.push(ok ? 'copied full file (' + Math.round(text.length / 1024) + ' KB)' : 'copy blocked (text in console)', ok ? 'ok' : 'bad');
    announce(ok ? 'Copied the full working file' : 'Copy blocked by the browser');
    if (!ok) toast('Copy blocked by the browser; the file is in the console.');
  }

  // ---------- chrome ----------

  // ---------- floating nested toolbar ----------
  // EXTENSION POINT. Each entry is one toolbar group; its markup is the matching
  // <div class="tb-group" data-group="…"> in index.html (or build one in `build(host)`).
  // `when()` hides a group for components that don't need it. Future groups (layout options,
  // left/right/bottom panel windows) are added here; nothing else needs to change.
  // Order here = order on screen = open/close order. The Component group is primary: the
  // toolbar's width follows it (--tb-unit). To drop a group (e.g. fold Viewport away later),
  // delete its line: its markup is then hidden.
  // Viewport is not in the toolbar for now (Rob: the sandbox defaults to the HP laptop's
  // 1600×770; the other presets live under Settings › Viewport). Its markup and wiring stay in
  // place, so re-adding it (or device presets later) is one line here:
  //   { id: 'viewport', label: 'Viewport' },
  const TOOLBAR_GROUPS = [
    { id: 'component', label: 'Component', primary: true },
    { id: 'playback', label: 'Playback', when: () => !!(def && def.animated) }
  ];
  // Stagger order. 'forward' = left to right (group 1 first). Rob: opening AND closing both run
  // left to right (group 1 collapses first). Flip either to 'reverse' to change it.
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
    // shown = on screen right now. ui.tbOut is the saved Settings choice; gestures (dismiss flick,
    // flick back to the rail) only change `shown`, in memory, so a reload or a component switch
    // brings the toolbar back when Settings says show.
    let shown = ui.tbOut !== false;
    const bar = () => $('stageBar');
    const icon = () => $('tbToggle');
    const gEl = (id) => bar().querySelector('.tb-group[data-group="' + id + '"]');
    const avail = () => TOOLBAR_GROUPS.filter((g) => gEl(g.id) && (!g.when || g.when()));
    const inOrder = (o) => (o === 'reverse' ? avail().reverse() : avail());
    const isOpen = () => avail().some((g) => open.has(g.id));
    const allOpen = () => avail().every((g) => open.has(g.id));
    // which way the groups grow (+1 right; -1 when the card is anchored left and the bar flips)
    const growDir = () => (getComputedStyle(bar()).flexDirection === 'row-reverse' ? -1 : 1);

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
      if (!open.has('component')) menuClose();
      const any = isOpen();
      icon().setAttribute('aria-expanded', any ? 'true' : 'false');
      icon().title = any ? 'Close toolbar (Esc) · flick to retract' : 'Open toolbar · Shift+click or → opens one group';
      syncRailBtn();
      ui.tbLast = [...open];
      saveUi();
      clearTimeout(settleT);
      settleT = setTimeout(() => {
        bar().querySelectorAll('.tb-group.is-moving').forEach((e) => e.classList.remove('is-moving'));
        syncSeg($('viewSeg'), viewPill, ui.view, true);
      }, M.level() === 'full' ? changed.length * TB_STAGGER + 520 : 160);
      requestAnimationFrame(sizeUnit);
      if (open.has('viewport')) requestAnimationFrame(() => syncSeg($('viewSeg'), viewPill, ui.view, true));
    }
    function openN(n, quiet) {
      if (!shown) return 0;
      const todo = inOrder(TB_OPEN_ORDER).filter((g) => !open.has(g.id)).slice(0, n);
      todo.forEach((g) => open.add(g.id));
      if (todo.length) { paint(todo, true); if (!quiet) Log.push('toolbar open ' + todo.map((g) => g.id).join(' → ')); }
      return todo.length;
    }
    function closeN(n, quiet) {
      const todo = inOrder(TB_CLOSE_ORDER).filter((g) => open.has(g.id)).slice(0, n);
      todo.forEach((g) => open.delete(g.id));
      // a group the component doesn't use (e.g. playback on a static one) closes silently with it
      if (!isOpen()) open.clear();
      if (todo.length) { paint(todo, false); if (!quiet) Log.push('toolbar close ' + todo.map((g) => g.id).join(' → ')); }
      return todo.length;
    }
    const toggle = () => (isOpen() ? closeN(Infinity) : openN(Infinity));
    function step() {   // Shift+click cycles: one more group each press, then one fewer
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
    // Throw the nested icon out from `from` (the rail button) to its spot; open by flick power.
    function flyOut(from, power, v) {
      const n = power >= 2 ? Infinity : 1;
      if (shown) { openN(n); return; }
      open.clear();
      paint([], true);
      shown = true;
      bar().dataset.out = 'true';
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
      // inertia: fast out of the rail, decelerating, a soft spring overshoot on landing
      bar().animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.72)', opacity: 0.35 },
        { transform: 'translate(' + dx * 0.18 + 'px,' + dy * 0.18 + 'px) scale(0.96)', opacity: 1, offset: 0.55 },
        { transform: 'none', opacity: 1 }
      ], { duration: dur, easing: M.springSoft });
      bar().dataset.flying = String(dur);
      setTimeout(() => { openN(n, true); delete bar().dataset.flying; }, Math.round(dur * 0.62));
    }
    // Retract every group (in close order), then fly the icon back into the rail button.
    function flyHome() {
      if (!shown) return;
      const had = isOpen();
      closeN(Infinity, true);
      Log.push('toolbar back to rail');
      const lv = M.level();
      const wait = lv === 'full' && had ? avail().length * TB_STAGGER + 240 : 0;
      setTimeout(() => {
        const h = homeRect(), from = icon().getBoundingClientRect();
        const done = () => { shown = false; bar().dataset.out = 'false'; syncRailBtn(); };
        if (lv !== 'full' || !h) { done(); return; }
        const dx = h.left + h.width / 2 - (from.left + from.width / 2), dy = h.top + h.height / 2 - (from.top + from.height / 2);
        bar().animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.6)', opacity: 0 }],
          { duration: 440, easing: 'cubic-bezier(0.5, 0, 0.75, 0.3)', fill: 'forwards' }).finished.then(() => { done(); bar().getAnimations().forEach((a) => a.cancel()); }, done);
      }, wait);
    }
    // Settings › Show toolbar icon (saved)
    function setOut(on) {
      ui.tbOut = on; saveUi();
      if (on && !shown) flyOut(null, 0, 0);
      if (!on && shown) { closeN(Infinity, true); shown = false; bar().dataset.out = 'false'; syncRailBtn(); }
    }
    // Strong flick of the nested icon away from its corner: retract the groups (close order),
    // then throw it off screen along the flick. Session only (Settings stay as they are).
    function dismiss(vx, vy, sx, sy) {
      if (!shown) return;
      const had = isOpen();
      closeN(Infinity, true);
      Log.push('toolbar dismissed (rail button brings it back)');
      const lv = M.level();
      const wait = lv === 'full' && had ? avail().length * TB_STAGGER + 220 : 0;
      setTimeout(() => {
        const done = () => { shown = false; bar().dataset.out = 'false'; bar().getAnimations().forEach((a) => a.cancel()); syncRailBtn(); };
        if (lv !== 'full') { if (lv === 'fade') bar().animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' }).finished.then(done, done); else done(); return; }
        const m = Math.hypot(vx, vy) || 1, k = Math.min(420, 180 + m * 120);
        const tx = (vx / m) * k, ty = (vy / m) * k;
        const s0 = had ? 'none' : 'translate(' + (sx || 0) + 'px,' + (sy || 0) + 'px)';
        bar().animate([{ transform: s0, opacity: 1 }, { transform: 'translate(' + tx + 'px,' + ty + 'px) rotate(' + (tx > 0 ? 8 : -8) + 'deg) scale(0.8)', opacity: 0 }],
          { duration: 380, easing: 'cubic-bezier(0.2, 0.6, 0.35, 1)', fill: 'forwards' }).finished.then(done, done);
      }, wait);
    }
    // the rail button: click toggles (bringing the toolbar out if it was in the rail); flick
    // toward the stage throws it out, flick away from the stage sends it back
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
    // ---- component menu: a floating layer on <body> ----
    const menu = () => $('tbMenu');
    let menuOpen = false;
    function menuShow() {
      const m = menu(), pick = $('tbPick');
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
      const r = pick.getBoundingClientRect(), w = Math.max(r.width, m.offsetWidth);
      const flip = growDir() < 0;
      m.style.minWidth = r.width + 'px';
      m.style.top = Math.round(r.bottom + 6) + 'px';
      m.style.left = Math.round(flip ? r.right - w : r.left) + 'px';
      m.style.transformOrigin = flip ? 'top right' : 'top left';
      menuOpen = true;
      pick.setAttribute('aria-expanded', 'true');
      const lv = M.level();
      if (lv === 'full') m.animate([{ opacity: 0, transform: 'translateY(-6px) scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: M.springSoft });
      else if (lv === 'fade') m.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 });
      const cur = m.querySelector('[aria-selected="true"]') || m.firstChild;
      if (cur) cur.focus({ preventScroll: true });
    }
    function menuClose(focusPick) {
      if (!menuOpen) return;
      menuOpen = false;
      menu().hidden = true;
      $('tbPick').setAttribute('aria-expanded', 'false');
      if (focusPick) $('tbPick').focus({ preventScroll: true });
    }
    // the primary (component) group sets the unit the other groups size from
    function sizeUnit() {
      const pick = $('tbPick');
      if (pick && pick.offsetWidth) bar().style.setProperty('--tb-unit', pick.offsetWidth + 'px');
    }
    function init() {
      // DOM order follows the config; groups not in the config are hidden
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
      // Nested icon gestures (thresholds: M.FLICK_LEVELS, Settings › Flick strength):
      //   flick toward the groups (right): gentle opens the next group, strong opens all
      //   gentle flick back (left): retracts one group (close order)
      //   STRONG flick away from the corner (left or up): dismiss for this session
      //   gentle flick up or down: nothing (snaps back)
      const LIM = 28;
      M.Flick(icon(), {
        axis: 'xy',
        onMove(dx, full, dy) { if (full) bar().style.transform = 'translate(' + M.rubber(dx, LIM).toFixed(1) + 'px,' + M.rubber(dy, LIM * 0.6).toFixed(1) + 'px)'; },
        onRelease({ dir, power, axis, dx, dy, vx, vy }) {
          const g = growDir();
          const away = power >= 2 && ((axis === 'x' && dir === -g) || (axis === 'y' && dir < 0));
          if (away) { bar().style.transform = ''; dismiss(vx || dx / 200, vy || dy / 200, M.rubber(dx, LIM), M.rubber(dy, LIM * 0.6)); return; }
          M.snapBack(bar(), M.rubber(dx, LIM), 'xy', M.rubber(dy, LIM * 0.6));
          if (!power || axis !== 'x') return;
          if (dir === g) openN(power >= 2 ? Infinity : 1);
          else closeN(1);
        }
      });
      $('tbPick').addEventListener('click', () => (menuOpen ? menuClose(true) : menuShow()));
      $('tbPick').addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' && !menuOpen) { e.preventDefault(); menuShow(); } });
      menu().addEventListener('keydown', (e) => {
        const opts = [...menu().querySelectorAll('.tb-opt')], i = opts.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = opts[(i + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length]; if (n) n.focus(); }
        if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); (e.key === 'Home' ? opts[0] : opts[opts.length - 1]).focus(); }
        if (e.key === 'Tab') menuClose(false);
      });
      M.flickOn = ui.flick !== false;
      M.flickStrength = ui.flickStrength || 'normal';
      bar().dataset.out = shown ? 'true' : 'false';
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
    // every component load: a session dismiss ends here (Settings says show -> it comes back)
    function refresh() {
      requestAnimationFrame(sizeUnit);
      if (ui.tbOut !== false && !shown) { shown = true; bar().dataset.out = 'true'; bar().getAnimations().forEach((a) => a.cancel()); }
      if (shown) paint([], true);
    }
    return {
      init, start, refresh, toggle, step, openN, closeN, flyOut, flyHome, dismiss, setOut, railClick,
      get shown() { return shown; }, railButton, menuShow, menuClose,
      get isOpen() { return isOpen(); }, get openIds() { return avail().filter((g) => open.has(g.id)).map((g) => g.id); },
      get menuOpen() { return menuOpen; },
      outside(t) {
        if (menuOpen && !menu().contains(t) && !t.closest('#tbPick')) menuClose(false);
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
  // one place that changes the sandbox viewport (toolbar group if present, Settings › Viewport)
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
  function buildChrome() {
    buildPicker();
    $('labPicker').addEventListener('change', (e) => loadComponent(e.target.value, false));
    TB.init();
    $('viewSeg').classList.add('seg-xs');
    $('viewSeg').querySelectorAll('.seg-btn').forEach((b) => { const v = VIEWS.find((x) => x.id === b.dataset.value); b.title = v.w ? v.w + ' × ' + v.h + ' viewport' : 'Fit the frame to the free space'; b.setAttribute('aria-label', b.title); });
    // compact viewport chip: short labels, full size in the tooltip
    viewPill = buildSeg($('viewSeg'), VIEWS.map((x) => ({ value: x.id, label: x.w ? String(x.w) : x.label })), ui.view, (val) => setView(val));
    modePill = buildSeg($('modeSeg'), [{ value: 'basic', label: 'Basic' }, { value: 'pro', label: 'Pro' }], mode, (val) => setMode(val), { equal: true });
    if (window.Pass) Pass.mount($('dockTrigger')); else $('dockTrigger').innerHTML = svg('sliders');
    $('dockClose').innerHTML = svg('close');
    $('backBtn').innerHTML = svg('back');
    [['copyBtn', 'diff', copyChanges], ['fullBtn', 'code', copyFull], ['undoBtn', 'undo', () => Hist.undo()], ['resetBtn', 'reset', resetAll]].forEach(([id, icon, fn]) => {
      const b = $(id);
      b.dataset.icon = icon;
      b.innerHTML = svg(icon);
      b.addEventListener('click', () => {
        fn();
        // a button that just disabled itself (reset, last undo) drops focus to <body>; keep it in
        // the footer so Ctrl+Z and Tab keep working
        requestAnimationFrame(() => {
          const a = document.activeElement;
          if (!b.disabled || (a && a !== document.body && a !== b)) return;
          const next = ['undoBtn', 'resetBtn', 'fullBtn'].map($).find((x) => x && !x.disabled);
          if (next) next.focus({ preventScroll: true });
        });
      });
    });
    $('backBtn').addEventListener('click', back);
    $('moreBtn').innerHTML = svg('dots');
    $('moreBtn').addEventListener('click', (e) => { e.stopPropagation(); Pop.toggle(); });
    $('dockClose').addEventListener('click', closeDock);
    $('labPlay').addEventListener('click', () => { playing = !playing; syncTime(); writeHash(); });
    $('labScrub').addEventListener('input', (e) => { playing = false; offset = +e.target.value; syncTime(); writeHash(); });
    document.documentElement.classList.toggle('no-motion', !ui.motion);

    const trig = $('dockTrigger');
    trig.addEventListener('click', () => openDock('click'));
    trig.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => openDock('hover'), 220); });
    trig.addEventListener('mouseleave', () => clearTimeout(hoverTimer));
    dock.addEventListener('mouseenter', () => clearTimeout(leaveTimer));
    dock.addEventListener('mouseleave', () => {
      if (!dockOpen || pinned || Arc.isOpen || Pop.isOpen) return;
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => { if (!pinned && !Arc.isOpen) closeDock(); }, 500);
    });
    dock.addEventListener('pointerdown', () => { if (dockOpen) pinned = true; });

    document.addEventListener('pointerdown', (e) => {
      const t = e.target;
      if (Arc.isOpen && !Arc.contains(t) && !t.closest('.swatch-trigger')) Arc.close();
      if (Pop.isOpen && !Pop.contains(t)) Pop.hide();
      TB.outside(t);
      // using the component itself (hover, drag, focus) keeps the card open
      if (!dockOpen || dock.contains(t) || Arc.contains(t) || t.closest('#stageBar') || t.closest('#tbMenu') || t.closest('#toast') || t.closest('#labFrame')) return;
      closeDock();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (TB.esc()) return;
        if (Pop.isOpen) { Pop.hide(true); return; }
        if (Arc.isOpen) { Arc.close(); const tr = document.querySelector('.swatch-trigger'); if (tr) tr.focus({ preventScroll: true }); return; }
        if (dockOpen) { closeDock(); trig.focus({ preventScroll: true }); return; }
        TB.close();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.altKey && /^[zy]$/i.test(e.key)) {
        const a = document.activeElement;
        const texty = a && (a.tagName === 'TEXTAREA' || a.isContentEditable || (a.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'color', 'button'].includes(a.type)));
        if (a && dock.contains(a) && dockOpen && !texty && def) {
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
    addEventListener('hashchange', () => { const h = readHash(); if (h.c && def && h.c !== def.id) loadComponent(h.c, true); });
  }

  async function init() {
    buildChrome();
    applyDockLayout();
    try { kindsInfo = JSON.parse(await fetchText('components/_template/kinds.json')); } catch (e) { kindsInfo = null; }
    const reg = window.LAB_REGISTRY || [];
    const h = readHash();
    const first = h.c && reg.includes(h.c) ? h.c : reg[0];
    if (!first) { toast('No components in components/registry.js', 8000); return; }
    await loadComponent(first, true);
    TB.start();
    if (ui.open !== false) {
      const prev = M.enabled;
      M.enabled = false;   // first paint: no morph
      openDock('click');
      M.enabled = prev;
    } else layoutStage();
    requestAnimationFrame(tick);
    document.documentElement.classList.add('is-ready');
  }
  window.__lab = { openDock, closeDock, go, push, back, setMode, startNew, get state() { return { dockOpen, pinned, mode, navStack: navStack.slice(), ui: Object.assign({}, ui), id: def && def.id, P: Object.assign({}, P), offset, rate: rateNow, playing, scan: man && man.scan, railCats: railCats().map((c) => c.id), sections: visibleCats().map((c) => c.id) }; }, Arc, TB, setView, layoutStage, setValue, workingFile, changesText, Log, Acc, Pop, Hist, resetAll };
  init();
})();
