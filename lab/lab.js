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
  const rawStore = {
    get(k, d) { try { const v = localStorage.getItem(KEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del(k) { try { localStorage.removeItem(KEY + k); } catch (e) { /* ignore */ } }
  };

  // ---------- tiers (t586u): internal ids free / mid / pro ----------
  // The ONE place for tier names: rename a label here and every header pill, button, toast and help line follows.
  // upgradeTo = the tier that tier's UPGRADE button offers.
  const TIER = {
    free: { id: 'free', label: 'Base', upgradeTo: 'mid' },
    mid: { id: 'mid', label: 'Mid', upgradeTo: 'pro' },
    pro: { id: 'pro', label: 'Pro', upgradeTo: null }
  };
  // DEV SWITCH (t587u): every load starts on this tier with its full menu, ignoring any saved tier or leftover
  // Base / Mid preview in storage. An explicit ?tier=free|mid|pro, Settings > Tier (dev) and Alt+Shift+T still
  // work for deliberate testing until the next plain reload. Set to null to restore normal saved-tier behaviour.
  const DEV_FORCE_TIER = 'pro';
  const TIER_IDS = ['free', 'mid', 'pro'];
  const tierRank = (t) => Math.max(0, TIER_IDS.indexOf(t));
  // TODO(subscription): the plan / purchase page. While empty, Lab.upgrade() only shows a "coming soon" toast;
  // once set, the UPGRADE buttons redirect here with ?tier=<target> appended.
  const UPGRADE_URL = '';
  // One capability table (the tier is a SETTING for now: Settings > Tier (dev), ?tier=free|mid|pro, Alt+Shift+T;
  // no licensing). PRO_FEATURES below keeps its keys; FEATURE_TIER maps each one onto this 3-way model.
  const CAPS = {
    free: { settings: false, copySnippet: false, copyFull: false, undo: false, interaction: false, snapshots: 0, accordions: false, responsive: false, toolbar: false, dockStages: [3], savedPrefs: 'none', controls: 'ga', newComponent: false },
    mid: { settings: 'limited', copySnippet: true, copyFull: false, undo: false, interaction: true, snapshots: 1, accordions: true, responsive: true, toolbar: true, dockStages: [2, 3], savedPrefs: 'some', controls: 'vip', newComponent: false },
    pro: { settings: 'full', copySnippet: true, copyFull: true, undo: true, interaction: true, snapshots: 3, accordions: true, responsive: true, toolbar: true, dockStages: [1, 2, 3], savedPrefs: 'all', controls: 'pro', newComponent: true }
  };
  const VAR_TIER = { ga: 0, vip: 1, pro: 2 };   // manifest var "tier" -> the lowest tier rank that shows it
  // Which tier you are on. The stored 'tier' key is your plan (the dev setting). Pro's switch can step DOWN to
  // preview a lower tier for this tab only (sessionStorage); UPGRADE steps back up to anything up to the plan.
  const TIER_PREVIEW = KEY + 'tierPreview';
  const URLQ = (() => { try { return new URL(location.href).searchParams; } catch (_) { return new URLSearchParams(''); } })();
  if (URLQ.has('reset')) {   // ?reset: clear every componentLab:v2:* key first (default tier: pro)
    try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.startsWith(KEY)) localStorage.removeItem(k); } } catch (_) { /* ignore */ }
    try { sessionStorage.removeItem(TIER_PREVIEW); } catch (_) { /* ignore */ }
  }
  // uiVer 7 migration: the old Basic / Pro switch (ui.mode) becomes the tier: 'basic' -> 'free', 'pro' -> 'pro'
  if (!TIER_IDS.includes(rawStore.get('tier', null))) { const old = rawStore.get('ui', null); rawStore.set('tier', old && old.mode === 'basic' ? 'free' : 'pro'); }
  if (TIER_IDS.includes(DEV_FORCE_TIER) && !TIER_IDS.includes(URLQ.get('tier'))) { rawStore.set('tier', DEV_FORCE_TIER); try { sessionStorage.removeItem(TIER_PREVIEW); } catch (_) { /* ignore */ } }
  if (TIER_IDS.includes(URLQ.get('tier'))) { rawStore.set('tier', URLQ.get('tier')); try { sessionStorage.removeItem(TIER_PREVIEW); } catch (_) { /* ignore */ } }
  let plan = rawStore.get('tier', 'pro');
  let tier = (() => { let p = null; try { p = sessionStorage.getItem(TIER_PREVIEW); } catch (_) { /* ignore */ } return TIER_IDS.includes(p) && tierRank(p) < tierRank(plan) ? p : plan; })();
  const caps = () => CAPS[tier];
  // Saved preferences per tier. Pro saves everything, as before. Mid saves only the dock state and the two
  // section settings, under its own 'mid:' keys so a Pro setup is never overwritten. Free saves nothing.
  // Anything not saved lives in memory for this page only (values, snapshot A, other settings).
  const MID_UI = ['proDock', 'accCollapse', 'accResponsive'];
  const mem = new Map();
  const pickKeys = (o, keys) => { const r = {}; if (o && typeof o === 'object') keys.forEach((x) => { if (o[x] !== undefined) r[x] = o[x]; }); return r; };
  function gate(k) {
    if (tier === 'pro' || k === 'tier' || k === 'uiVer' || k.startsWith('manifest:')) return { raw: k };
    if (tier === 'mid' && k === 'ui') return { raw: 'mid:ui', pick: MID_UI };
    return null;
  }
  const store = {
    get(k, d) { const g = gate(k); if (!g) return mem.has(k) ? JSON.parse(mem.get(k)) : d; const v = rawStore.get(g.raw, d); return g.pick ? pickKeys(v, g.pick) : v; },
    set(k, v) { const g = gate(k); if (!g) { try { mem.set(k, JSON.stringify(v)); } catch (_) { /* ignore */ } return; } rawStore.set(g.raw, g.pick ? pickKeys(v, g.pick) : v); },
    del(k) { const g = gate(k); if (!g) { mem.delete(k); return; } rawStore.del(g.raw); }
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
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6"/><circle cx="12" cy="16.9" r="0.9" class="fill"/>',
    handle: '<path d="M14.5 6l-6 6 6 6"/>',
    zoomIn: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M8 10.5h5M10.5 8v5"/>',
    zoomOut: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M8 10.5h5"/>',
    zoomFit: '<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
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
    sig: '<path d="M12 3.5l2 6.5 6.5 2-6.5 2-2 6.5-2-6.5-6.5-2 6.5-2z" class="fill"/>',
    up: '<path d="M12 19V6"/><path d="M6.5 11.5L12 6l5.5 5.5"/>',
    flip: '<path d="M17 4l3 3-3 3"/><path d="M4 11V9a2 2 0 0 1 2-2h14"/><path d="M7 20l-3-3 3-3"/><path d="M20 13v2a2 2 0 0 1-2 2H4"/>'
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
  const VIEWS = [{ id: 'fit', label: 'Fit' }, { id: '1600x770', label: '1600\u00d7770', w: 1600, h: 770 }, { id: '1366x768', label: '1366\u00d7768', w: 1366, h: 768 }];
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
    snapshots: true,        // Named A / B / C snapshot slots per component
    // Dock (one switch each; set to false to give it to Basic too):
    dockStages: true,       // stage 1 (the lanyard pass) in the card -> rail -> pass progression
    dockFlick: true,        // flick the pass / the dock's inner edge to step stages
    dockHide: true,         // strong flick of the pass away hides the dock for this session
    dockHover: true,        // hover the slim rail: it grows to the card, folds back when the cursor leaves
    helpIcon: true,         // ? help card: full how-to in Pro; Base / Mid see what the next tiers add
    accSettings: true,      // Settings > Sections: default state + responsive (Mid's short Settings list)
    tempoDeck: true,        // MOTION_SPEED as the DJ tempo deck (Mid gets 0.5x / 1x / 2x preset pads instead)
    customColour: true      // Custom... hex / colour input on a colour's page
  };
  // The lowest tier that has each PRO_FEATURES key (anything not listed = Pro only).
  const FEATURE_TIER = { accordion: 'mid', snapshots: 'mid', dockHover: 'mid', accSettings: 'mid' };
  // ---- dock stages (like the toolbar's nested progression) ----
  // Stage n -> dock data-state, smallest first: 1 = the lanyard pass, 2 = thin rail, 3 = card + rail.
  // Basic keeps 2 and 3 only (the X folds the card to the rail).
  const DOCK_STAGES = ['closed', 'slim', 'open'];
  // Shortcuts: the help card text is generated from this.
  const KEYS = {
    dock: { label: 'Alt+D', alt: 'Shift+D', test: (e) => (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyD') },
    dockAlt: { test: (e) => (e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyD') },
    down: { label: 'Esc' },
    pause: { label: 'Space' },
    zoomIn: { label: '+' }, zoomOut: { label: '\u2212' }, zoomToggle: { label: '0' }
  };

  // ---------- state ----------
  const UI_DEFAULTS = { dockPos: 'right', anchor: 'top-right', proDock: 'full', motion: true, paletteSource: 'project', view: '1600x770', open: true, accCollapse: 'closed', accResponsive: false, accVariant: 'B', tbOut: true, tbStart: 'closed', tbAutoClose: true, tbLast: [], flick: true, flickStrength: 'normal', dockFlickHide: true, dockHover: true, zoomCtl: true };
  // migrations run on the saved (Pro) settings, whatever tier is showing
  const ui = Object.assign({}, UI_DEFAULTS, rawStore.get('ui', {}));
  if (rawStore.get('uiVer', 0) < 3) { ui.accVariant = 'B'; rawStore.set('uiVer', 3); rawStore.set('ui', ui); }
  if (rawStore.get('uiVer', 0) < 4) { ui.view = '1600x770'; rawStore.set('uiVer', 4); rawStore.set('ui', ui); }
  // v5: Pro now opens fully expanded (card + rail). 'slim' was the old saved default, so move it to 'full'; 'icon' stays.
  if (rawStore.get('uiVer', 0) < 5) { if (!ui.proDock || ui.proDock === 'slim') ui.proDock = 'full'; rawStore.set('uiVer', 5); rawStore.set('ui', ui); }
  // uiVer 6: Pro sections start ALL CLOSED (new default); 'All open' was retired for 'First open'. Responsive (one open, moved to the top) starts off.
  if (rawStore.get('uiVer', 0) < 6) { ui.accCollapse = 'closed'; if (typeof ui.accResponsive !== 'boolean') ui.accResponsive = false; rawStore.set('uiVer', 6); rawStore.set('ui', ui); }
  // uiVer 7: tiers. ui.mode (Basic / Pro) is retired; it was turned into the 'tier' key above ('basic' -> 'free').
  if (rawStore.get('uiVer', 0) < 7) { delete ui.mode; rawStore.set('uiVer', 7); rawStore.set('ui', ui); }
  // The settings the current tier sees: Pro = everything saved, Mid = defaults + its few saved ones, Free = defaults.
  function loadUiForTier() {
    Object.keys(ui).forEach((k) => { delete ui[k]; });
    Object.assign(ui, UI_DEFAULTS, store.get('ui', {}));
    delete ui.mode;
    if (ui.anchor === 'middle-center') ui.anchor = 'top-right';
    if (!['closed', 'first', 'remember'].includes(ui.accCollapse)) ui.accCollapse = 'closed';
    if (tier === 'mid') { if (ui.accCollapse === 'remember') ui.accCollapse = 'closed'; if (ui.proDock === 'icon') ui.proDock = 'full'; }
  }
  loadUiForTier();
  const saveUi = () => store.set('ui', ui);
  M.enabled = ui.motion !== false;
  // screen look (CSS only, never a control value): margin tone + expanded-dock glass as data-* on <html> (lab.css / dock.css)
  const applyLook = () => { const r = document.documentElement; r.dataset.margin = ui.marginTone || 'dark'; r.dataset.glass = ui.glass || 'frosted'; };
  applyLook();

  let def = null, inst = null, man = null, vars = [], byId = {}, P = {};
  let offset = 0, playing = true, lastT = 0, loadSeq = 0, pendingResolve = null;
  // mode = the old two-way alias ('pro' only on the Pro tier); tier is the real switch.
  let mode = tier === 'pro' ? 'pro' : 'basic';
  const hasPro = (k) => !!PRO_FEATURES[k] && tierRank(tier) >= tierRank(FEATURE_TIER[k] || 'pro');
  let previewDefaults = false;
  let scanHovering = false, scanHoverTouch = false, scanKbdPause = false;
  let projectPalette = [], presets = [], kindsInfo = null;
  let navStack = [{ type: 'cat', cat: 'color' }];
  let dockState = 'closed', dockOpen = false, pinned = false, hoverTimer = 0, leaveTimer = 0;
  let dockHidden = false, lastFrom = 'closed';
  // morphTok: bumps on every dock morph so a cancelled morph's late cleanup never touches the next one
  let morphTok = 0;
  // hoverOpen: the card was grown from the slim rail by hover (folds back on leave, never saved)
  let hoverOpen = false, dockPress = false, overDock = false;
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
    return (isNaN(n) ? val : n.toFixed(decimals(v.step))) + (v.unit ? (v.unit === '\u00d7' || v.unit === '\u00b0' ? v.unit : ' ' + v.unit) : '');
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
    if (!(v.tier in VAR_TIER)) delete v.tier;   // "ga" | "vip" | "pro" (who sees the control); see tierVars()
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
  // Behaviour flags (manifest fields), never component ids: the master Speed control, and the auto-scan
  // interaction controls (source 'scan') by interaction kind.
  const speedVar = () => vars.find((x) => x.master === 'speed') || null;
  const scanIx = (kind) => vars.find((x) => x.source === 'scan' && x.interaction === kind) || null;
  function isModified(v) {
    if (previewDefaults) return false;
    const sv = speedVar();
    return !same(P[v.id], v.default) || (v.speedScaled && sv && !same(P[sv.id], sv.default));
  }
  function cssVal(v) {
    const curP = activeParams();
    const val = curP[v.id];
    if (v.control === 'swatch-role' && v.alpha != null && v.alpha < 1) return 'rgb(from ' + val + ' r g b / ' + v.alpha + ')';
    if (v.options) { const o = v.options.find((x) => same(x.value, val)); if (o && o.css != null) return o.css; }
    if (v.cssMap) return v.cssMap[String(val)];
    if (typeof val === 'boolean') return val ? '1' : '0';
    const sv = v.speedScaled ? speedVar() : null;
    if (sv) return +(val / (curP[sv.id] || 1)).toFixed(4) + (v.unit || '');
    if (v.unit === '\u00d7') return String(val);
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
    if (caps().undo) {
      announce('Reset ' + ch.length + ' changes. Undo brings them back.');
      toast('Reset ' + ch.length + ' to defaults. Undo (Ctrl+Z) brings them back.');
    } else {
      announce('Reset ' + ch.length + ' changes.');
      toast('Reset ' + ch.length + ' to defaults.');
    }
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
  // The controls this tier SHOWS (manifest var "tier": ga / vip / pro). vars stays complete (values, export,
  // URL hash, defaults), so a hidden control simply keeps its default. No "tier" field (other components):
  // featured = every tier, other plain controls = Mid, advanced = Pro.
  function varTier(v) { return v.tier in VAR_TIER ? VAR_TIER[v.tier] : v.featured ? 0 : v.advanced ? 2 : 1; }
  function tierVars() {
    if (tier === 'pro') return vars;
    const r = tierRank(tier);
    let list = vars.filter((v) => varTier(v) <= r && (caps().interaction || v.category !== 'interact'));
    if (tier === 'free' && !vars.some((v) => v.tier)) list = list.slice(0, BASIC_CAP);
    return list;
  }
  function changedVars() { return vars.filter((v) => !same(P[v.id], v.default)); }
  // Footer per tier: Base = Reset only; Mid = Copy changes + Reset; Pro = Copy changes, Copy full, Undo, Reset.
  function syncFootTools() {
    const c = caps();
    [['copyBtn', c.copySnippet], ['fullBtn', c.copyFull], ['undoBtn', c.undo]].forEach(([id, on]) => {
      const b = $(id);
      if (!b) return;
      b.classList.toggle('is-tier-off', !on);
      b.tabIndex = on ? 0 : -1;
      b.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
  }
  function refreshChanged() {
    const n = changedVars().length;




    $('copyBtn').disabled = !n;
    $('resetBtn').disabled = !n;
    $('resetBtn').title = n ? 'Reset all ' + n + ' changes to defaults (undoable)' : 'Nothing to reset';
    $('copyBtn').title = n ? 'Copy ' + n + ' change' + (n === 1 ? '' : 's') + ' (old \u2192 new snippet)' : 'No changes from defaults';
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
  // Core template (components/_core/core.json, "core@1"): fetched once, shared by every schema-3 manifest.
  let coreDoc = null;
  async function loadCore() {
    if (coreDoc) return coreDoc;
    const t = await fetchText('components/_core/core.json');
    try { coreDoc = t ? JSON.parse(t) : null; } catch (e) { coreDoc = null; toast('components/_core/core.json has a JSON error (' + e.message + ').', 6000); }
    return coreDoc || { controls: [], optional: [] };
  }
  // One-time, idempotent id migration (helix Step B, t590u): saved values, snapshots and stars stored under an
  // old control id move to its new id ("aliases" in manifest.json: old -> new). Runs on every load, so a backup
  // imported later (Settings > Import) or an old snapshot is migrated too; a key already on the new id wins.
  // Works on the raw saved store so Pro data migrates even while previewing Mid / Base.
  function migrateIds(id, aliases, ver) {
    if (!aliases || !Object.keys(aliases).length) return;
    const LM = window.LabManifest;
    let n = 0;
    ['values:', 'featured:'].forEach((pre) => {
      const cur = rawStore.get(pre + id, null);
      const r = LM.renameKeys(cur, aliases);
      if (r.changed) { rawStore.set(pre + id, r.obj); n++; }
      if (mem.has(pre + id)) { const rm = LM.renameKeys(JSON.parse(mem.get(pre + id)), aliases); if (rm.changed) mem.set(pre + id, JSON.stringify(rm.obj)); }
    });
    const snaps = rawStore.get('snaps:' + id, null);
    if (snaps && typeof snaps === 'object') {
      let ch = false;
      Object.keys(snaps).forEach((k) => { const r = LM.renameKeys(snaps[k], aliases); if (r.changed) { snaps[k] = r.obj; ch = true; } });
      if (ch) { rawStore.set('snaps:' + id, snaps); n++; }
    }
    if (rawStore.get('idVer:' + id, 0) < (ver || 1)) rawStore.set('idVer:' + id, ver || 1);
    if (n) console.info('[lab] ' + id + ': moved saved data to the new control ids (' + n + ' store key' + (n === 1 ? '' : 's') + ').');
  }
  // A shared link may still use an old id (#c=helix&SPEED=1.5): map it to the new id; the new id wins.
  function aliasHash(h, aliases) {
    if (!aliases) return h;
    return window.LabManifest.renameKeys(h, aliases).obj;
  }

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
        m = S.analyze({ id, title: d.title, cssFiles, markup: markup || '', js: jsText, legacyParams: d.params, animated: !!d.animated, core: await loadCore() });
        m.sig = sig;
        store.set('manifest:' + id, m);
      }
      m.auto = true;
      auto = true;
    }
    if (m.schema === 3) {
      m = window.LabManifest.resolve(m, await loadCore());
      if (m.loaderNotes) console.warn('[lab] ' + id + '/manifest.json:', m.loaderNotes.join(' | '));
      migrateIds(id, m.aliases, m.source && m.source.aliasVersion);
    } else if (auto && m.aliases) migrateIds(id, m.aliases, 1);   // auto-scan on core@1 ids (P1): old scan ids move over once
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
    const hash = fromHash ? aliasHash(readHash(), m.aliases) : {};
    if (saved) vars.forEach((v) => { if (saved[v.id] !== undefined) P[v.id] = coerce(v, saved[v.id]); });
    // a shared URL can only set the controls this tier shows (the hidden ones keep their defaults)
    const seen = tier === 'pro' ? null : new Set(tierVars().map((v) => v.id));
    vars.forEach((v) => { if (hash[v.id] !== undefined && hash[v.id] !== '' && (!seen || seen.has(v.id))) P[v.id] = coerce(v, hash[v.id]); });
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

    mode = tier === 'pro' ? 'pro' : 'basic';
    syncHeadTools();
    syncFootTools();
    $('cmpName').textContent = d.title;
    $('cmpName').title = d.title + ' (click to switch component)';
    syncQuick();
    $('labPicker').value = id;
    $('tbPickName').textContent = pickLabel(id);
    $('tbPick').title = 'Component: ' + pickLabel(id);
    $('labTime').classList.toggle('is-hidden', !d.animated);
    TB.refresh();
    syncTime();
    syncModeSw();
    buildRail();
    navStack = [{ type: 'cat', cat: railCats()[0] ? railCats()[0].id : 'color' }];
    renderPage(0);
    refreshChanged();
    writeHash();
    if (rescanToast) toast('Component files changed \u2014 controls re-scanned.', 4200);
    else if (auto) toast('No manifest.json, so the controls were made by auto-scan. Settings \u203a Save to disk keeps them.', 5200);
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
  // The sandbox (stage) is primary: it always uses the full window. The dock (card, slim rail, VIP badge)
  // and the stage toolbar float OVER it (position: fixed + z-index) and never resize, shift or reflow it,
  // at any stage or during a morph.
  function freeRect() {
    return { x: 0, y: 0, w: innerWidth, h: innerHeight };
  }
  // The screen box: the ONE source for the sandbox screen's size + position (zoom, pan, hover and
  // pointer maths all read it back from #stageFit / Zoom.setBase). The side margins are sized so the
  // stage-1 VIP badge (--trig-w, lab/pass.css) fits in the margin beside the screen with a small gap,
  // the same on both sides (screen centred); the top margin sits below the badge's top edge so the
  // badge rises above the screen. 1600x770 -> 1266 x 698 at (167, 36); 1366x768 -> 1032 x 696 at (167, 36).
  const SCREEN_TOP = 36, SCREEN_BOTTOM = 36, SCREEN_GAP = 8;
  function screenBox(r) {
    const tw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--trig-w')) || 54;
    const side = Math.max(24, Math.min(Math.round(tw) + MARGIN + SCREEN_GAP, Math.round(r.w * 0.16)));
    return { x: r.x + side, y: r.y + SCREEN_TOP, w: Math.max(80, r.w - 2 * side), h: Math.max(80, r.h - SCREEN_TOP - SCREEN_BOTTOM) };
  }
  function layoutStage() {
    if (!def) return;
    const r = freeRect();
    const box = screenBox(r);
    const fit = $('stageFit');
    Object.assign(fit.style, { left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px' });
    // the screen's top edge (CSS --scr-t): the top-centre zoom pad sits just inside it; the box never changes for it
    $('stage').style.setProperty('--scr-t', box.y + 'px');
    const view = VIEWS.find((x) => x.id === ui.view) || VIEWS[0];
    const f = def.frames[frameKeyFor(ui.view)];
    const bw = view.w || f.w, bh = view.h || f.h;
    const s = Math.min(1, box.w / bw, box.h / bh);
    const scaler = $('stageScaler');
    scaler.style.width = bw + 'px';
    scaler.style.height = bh + 'px';
    Zoom.setBase({ s, box, bw, bh });   // fit scale x the view zoom (view only: never a control value)
    $('vpBox').classList.toggle('is-on', !!view.w);
    $('vpTag').textContent = view.w ? view.w + ' \u00d7 ' + view.h + ' viewport' : '';
    stageNoteBase = def.title + '  \u00b7  frame ' + f.w + ' \u00d7 ' + f.h + (view.w ? '  in ' + view.label : '') + '  \u00b7  ' + Math.round(s * 100) + '%';
    Zoom.note();
  }
  let stageNoteBase = '';

  // ---------- sandbox view zoom (magnifier) ----------
  // View only: scales and pans the sandbox CONTENT on screen (#stageScaler transform). It never
  // touches a control value, the manifest, export / copy output, the URL hash, or the size and
  // position of the sandbox (stage) itself. 100% = the normal fit / viewport ratio. Remembered for
  // this browser session only (sessionStorage); ?reset puts it back to 100%. The browser's own
  // Ctrl/Cmd +/-/0 page zoom is left alone.
  //   icons (top-centre, inside the screen): - / readout (click = 100% <-> last zoom) / + / fit
  //   keys: + or = in, - out, 0 = 100% <-> last zoom (not while typing or focused in the component)
  //   Ctrl/Cmd + wheel (or a trackpad pinch) over the stage zooms at the cursor; plain wheel over the icons
  //   pan: drag empty stage space, or middle-mouse drag anywhere on it; touch: two-finger pinch / pan
  const Zoom = (() => {
    const MIN = 0.25, MAX = 4;
    const STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];
    const SKEY = KEY + 'zoom';
    const clampZ = (v) => Math.min(MAX, Math.max(MIN, Number(v) || 1));
    let z = 1, px = 0, py = 0, last = null, ctl = null, read = null;
    let base = { s: 1, box: { x: 0, y: 0, w: innerWidth, h: innerHeight }, bw: 1, bh: 1 };
    let pan = null, pinch = null;
    try {
      const v = JSON.parse(sessionStorage.getItem(SKEY) || 'null');
      if (v) { z = clampZ(v.z); px = +v.px || 0; py = +v.py || 0; last = v.last && v.last.z ? { z: clampZ(v.last.z), px: +v.last.px || 0, py: +v.last.py || 0 } : null; }
    } catch (_) { /* private mode */ }
    const save = () => { try { sessionStorage.setItem(SKEY, JSON.stringify({ z, px, py, last })); } catch (_) { /* ignore */ } };
    const is1 = (v) => Math.abs(v - 1) < 0.001;
    const pct = (v) => Math.round(v * 100) + '%';
    function clampPan() {
      const S = base.s * z, b = base.box;
      const lx = Math.max(0, (S * base.bw - b.w) / 2 + 60), ly = Math.max(0, (S * base.bh - b.h) / 2 + 60);
      px = Math.max(-lx, Math.min(lx, px));
      py = Math.max(-ly, Math.min(ly, py));
    }
    function apply(live) {
      const sc = $('stageScaler');
      if (!sc) return;
      sc.classList.toggle('is-zoom-live', !!live);
      sc.style.transform = 'translate(-50%, -50%) translate(' + px.toFixed(1) + 'px, ' + py.toFixed(1) + 'px) scale(' + (base.s * z).toFixed(4) + ')';
      const st = $('stage');
      if (st) st.dataset.zoomed = z > 1.001 ? 'in' : (z < 0.999 ? 'out' : '');
      sync();
    }
    function sync() {
      if (!ctl) return;
      read.textContent = pct(z);
      const back = is1(z) ? (last ? 'Back to ' + pct(last.z) : 'At 100%') : 'Back to 100%';
      read.title = 'View zoom ' + pct(z) + ' (screen only, not the component\u2019s size). Click: ' + back + ' (' + KEYS.zoomToggle.label + ')';
      read.setAttribute('aria-label', read.title);
      read.disabled = is1(z) && !last;
      ctl.querySelector('[data-z="out"]').disabled = z <= MIN + 0.001;
      ctl.querySelector('[data-z="in"]').disabled = z >= MAX - 0.001;
      ctl.querySelector('[data-z="fit"]').disabled = is1(z) && !px && !py;
      ctl.classList.toggle('is-zoomed', !is1(z));
      ctl.hidden = ui.zoomCtl === false;
      note();
    }
    function note() {
      const n = $('stageNote');
      if (n) n.textContent = stageNoteBase + (stageNoteBase && !is1(z) ? '  \u00b7  view ' + pct(z) : '');
    }
    // zoom to nz keeping the point under (cx, cy) (client px) still; default = the sandbox centre
    function set(nz, cx, cy, live) {
      nz = clampZ(nz);
      const b = base.box, fx = b.x + b.w / 2, fy = b.y + b.h / 2;
      const ux = cx == null ? 0 : cx - fx, uy = cy == null ? 0 : cy - fy;
      const k = nz / z;
      px = ux - (ux - px) * k;
      py = uy - (uy - py) * k;
      z = nz;
      if (is1(z) && cx == null) { z = 1; }
      clampPan();
      apply(live);
      save();
    }
    function step(dir, cx, cy) {
      const nz = dir > 0 ? STEPS.find((v) => v > z + 0.001) : STEPS.slice().reverse().find((v) => v < z - 0.001);
      if (nz != null) { set(nz, cx, cy); Log.push('view zoom ' + pct(z)); }
    }
    function reset() {
      if (!is1(z)) last = { z, px, py };
      z = 1; px = 0; py = 0;
      apply(false); save();
      Log.push('view zoom 100%');
    }
    // the "toggle back": 100% <-> the last zoom (and where it was panned)
    function toggle() {
      if (!is1(z)) { reset(); return; }
      if (!last) return;
      const l = last;
      last = { z: 1, px, py };
      z = l.z; px = l.px; py = l.py;
      clampPan(); apply(false); save();
      Log.push('view zoom back to ' + pct(z));
    }
    const texty = (a) => !!(a && (a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable || (a.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'color', 'button'].includes(a.type))));
    // plain + / = / - / 0 (no Ctrl / Cmd / Alt: those stay the browser's page zoom)
    function key(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return false;
      const a = document.activeElement;
      if (texty(a) || (a && a.closest && a.closest('#labFrame'))) return false;
      const k = e.key, c = e.code;
      let act = null;
      if (k === '+' || k === '=' || c === 'NumpadAdd') act = 'in';
      else if (k === '-' || k === '_' || c === 'NumpadSubtract') act = 'out';
      else if (k === '0' || c === 'Numpad0') act = 'toggle';
      if (!act) return false;
      e.preventDefault();
      if (act === 'toggle') toggle(); else step(act === 'in' ? 1 : -1);
      return true;
    }
    const blank = (t) => !t.closest('#labFrame, #stageBar, #tbMenu, #zoomCtl, .stage-note');
    function build() {
      const stage = $('stage');
      ctl = el('div', 'zoom-ctl glass');
      ctl.id = 'zoomCtl';
      ctl.setAttribute('role', 'toolbar');
      ctl.setAttribute('aria-label', 'Sandbox view zoom (screen only)');
      const b = (z0, ico, title) => { const x = el('button', 'zoom-btn', svg(ico)); x.type = 'button'; x.dataset.z = z0; x.title = title; x.setAttribute('aria-label', title); return x; };
      read = el('button', 'zoom-read', '100%');
      read.type = 'button';
      read.dataset.z = 'toggle';
      ctl.append(
        b('out', 'zoomOut', 'Zoom out (' + KEYS.zoomOut.label + ')'),
        read,
        b('in', 'zoomIn', 'Zoom in (' + KEYS.zoomIn.label + ')'),
        b('fit', 'zoomFit', 'Reset view to 100% and centre (click the readout or ' + KEYS.zoomToggle.label + ' to go back)')
      );
      stage.appendChild(ctl);
      ctl.addEventListener('click', (e) => {
        const t = e.target.closest('[data-z]');
        if (!t || t.disabled) return;
        const a = t.dataset.z;
        if (a === 'in') step(1); else if (a === 'out') step(-1); else if (a === 'toggle') toggle(); else reset();
      });
      ctl.addEventListener('dblclick', (e) => e.preventDefault());
      // Ctrl/Cmd + wheel (trackpad pinch arrives as Ctrl + wheel) over the stage: zoom at the cursor.
      // Captured on the stage so the component never also scrolls, and the page never browser-zooms.
      stage.addEventListener('wheel', (e) => {
        const onCtl = !!e.target.closest('#zoomCtl');
        if (!(e.ctrlKey || e.metaKey) && !onCtl) return;
        if (e.target.closest('#stageBar, #tbMenu')) return;
        e.preventDefault();
        e.stopPropagation();
        const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
        if (onCtl) { set(z * Math.exp(-Math.sign(dy) * 0.12)); return; }
        set(z * Math.exp(-Math.max(-60, Math.min(60, dy)) * 0.0045), e.clientX, e.clientY, true);
      }, { capture: true, passive: false });
      // pan: middle-mouse drag anywhere on the stage, or left drag on empty stage space (not the component)
      stage.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return;
        const mid = e.button === 1, left = e.button === 0 && blank(e.target);
        if (!mid && !left) return;
        if (left && z <= 1.001) return;   // nothing to pan at 100% or below (the content fits)
        if (mid) { e.preventDefault(); e.stopPropagation(); }
        pan = { id: e.pointerId, x: e.clientX, y: e.clientY, px, py, moved: false };
        armed = true;
        try { stage.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      }, true);
      stage.addEventListener('pointermove', (e) => {
        if (!pan || e.pointerId !== pan.id) return;
        const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
        if (!pan.moved && Math.hypot(dx, dy) < 3) return;
        pan.moved = true;
        stage.classList.add('is-panning');
        px = pan.px + dx; py = pan.py + dy;
        clampPan(); apply(true);
      });
      const endPan = (e) => {
        if (!pan || (e && e.pointerId !== pan.id)) return;
        if (pan.moved) save();
        pan = null;
        stage.classList.remove('is-panning');
        setTimeout(() => { armed = false; }, 0);
      };
      stage.addEventListener('pointerup', endPan);
      stage.addEventListener('pointercancel', endPan);
      stage.addEventListener('lostpointercapture', endPan);
      stage.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });
      // touch: two fingers pinch (zoom at their midpoint) and pan together; one finger stays the component's
      const mid2 = (t) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2, d: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) || 1 });
      stage.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 2 || e.target.closest('#stageBar, #tbMenu, #zoomCtl')) return;
        const m = mid2(e.touches);
        pinch = { m, z, px, py };
      }, { passive: true });
      stage.addEventListener('touchmove', (e) => {
        if (!pinch || e.touches.length !== 2) return;
        e.preventDefault();
        const m = mid2(e.touches);
        // restart from the pinch start each move so it never drifts
        z = pinch.z; px = pinch.px + (m.x - pinch.m.x); py = pinch.py + (m.y - pinch.m.y);
        const nz = clampZ(pinch.z * m.d / pinch.m.d);
        const b = base.box, ux = m.x - (b.x + b.w / 2), uy = m.y - (b.y + b.h / 2), k = nz / z;
        px = ux - (ux - px) * k; py = uy - (uy - py) * k; z = nz;
        clampPan(); apply(true);
      }, { passive: false });
      const endPinch = (e) => { if (pinch && e.touches.length < 2) { pinch = null; save(); Log.push('view zoom ' + pct(z)); } };
      stage.addEventListener('touchend', endPinch);
      stage.addEventListener('touchcancel', endPinch);
      sync();
    }
    let armed = false;
    return {
      build, key, set, step, reset, toggle, sync, note,
      setBase(bs) { base = bs; clampPan(); apply(false); },
      clear() { z = 1; px = 0; py = 0; last = null; try { sessionStorage.removeItem(SKEY); } catch (_) { /* ignore */ } },
      // true while this pointerdown started a pan (so the outside-click fold leaves the card alone)
      claims(t) { return armed || !!(t && t.closest && t.closest('#zoomCtl')); },
      get level() { return z; }, get pan() { return { x: px, y: py }; }, get last() { return last; }
    };
  })();

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
        const sHv = scanIx('hover'), sTo = scanIx('touch'), sKy = scanIx('key');
        if (sHv && scanHovering && !(scanHoverTouch && sTo && curP[sTo.id] === 'ignore')) {
          const hr = { play: 1, pause: 0, slow: 0.35, fast: 1.8 }[curP[sHv.id]];
          if (hr !== undefined) k *= hr;
        }
        if (sKy && curP[sKy.id] && scanKbdPause) k = 0;
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
  // Card header, top-left (t586u). Pro: the Beat-FX style pill switch (as before); sliding it to Base steps DOWN
  // to preview the lower tiers (this tab only). Base / Mid: a tier pill (BASE / MID) + a glowing UPGRADE button
  // (Lab.upgrade). Labels come from TIER. Keyboard on the switch: Enter/Space toggles, Left = Base.
  function buildModeSw(host) {
    if (!host) return;
    host.dataset.tier = '';
    syncModeSw();
  }
  function syncModeSw() {
    const host = $('modeSeg');
    if (!host) return;
    if (host.dataset.tier !== tier) {
      host.dataset.tier = tier;
      host.innerHTML = '';
      host.removeAttribute('role');
      if (tier === 'pro') {
        host.className = 'mode-sw';
        const b = el('button', 'msw-btn', '<span class="msw-lbl msw-b">' + esc(TIER.free.label) + '</span><span class="msw-track"><i class="msw-knob"><i class="msw-led"></i></i></span><span class="msw-lbl msw-p">' + esc(TIER.pro.label) + '</span>');
        b.type = 'button';
        b.id = 'modeSw';
        b.setAttribute('role', 'switch');
        const down = () => { host.dataset.value = 'basic'; setTimeout(() => setTier('free'), M.level() === 'full' ? 240 : 0); };
        b.addEventListener('click', down);
        b.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); down(); } });
        host.appendChild(b);
      } else {
        host.className = 'mode-sw tier-sw';
        const t = TIER[tier], up = TIER[t.upgradeTo] || TIER.pro;
        const pill = el('span', 'tier-pill', esc(t.label));
        pill.title = t.label + ' tier';
        const ub = el('button', 'tier-up', svg('up') + '<span>Upgrade</span>');
        ub.type = 'button';
        ub.id = 'tierUp';
        ub.addEventListener('click', () => upgrade(up.id));
        host.append(pill, ub);
      }
    }
    const b = host.querySelector('.msw-btn');
    if (b) {
      host.dataset.value = 'pro';
      b.setAttribute('aria-checked', 'true');
      b.setAttribute('aria-label', 'Tier: ' + TIER.pro.label + ' (switch to ' + TIER.free.label + ' to preview the lower tiers)');
      b.title = TIER.pro.label + ': every control, sections, snapshots, settings \u00b7 click, Enter or Space (or \u2190) steps down to preview ' + TIER.free.label + '; its UPGRADE button steps back up';
    }
    const ub = host.querySelector('.tier-up');
    if (ub) {
      const to = TIER[TIER[tier].upgradeTo] || TIER.pro, back = tierRank(to.id) <= tierRank(plan);
      ub.title = 'Upgrade (coming soon)' + (back ? ' \u00b7 preview: click steps back up to ' + to.label : '');
      ub.setAttribute('aria-label', 'Upgrade to ' + to.label + (back ? ' (preview: steps back up)' : ' (coming soon)'));
    }
  }
  // The ONE upgrade entry point (header button, help card). Below your plan (a preview) it steps back up.
  // TODO(subscription): with UPGRADE_URL set, this redirects to the plan / purchase page instead of the toast.
  function upgrade(target) {
    const to = TIER_IDS.includes(target) ? target : TIER[tier].upgradeTo;
    if (!to || to === tier) return;
    if (tierRank(to) <= tierRank(plan)) { setTier(to); return; }
    if (UPGRADE_URL) { location.href = UPGRADE_URL + (UPGRADE_URL.includes('?') ? '&' : '?') + 'tier=' + encodeURIComponent(to); return; }
    Log.push('upgrade to ' + TIER[to].label + ' (coming soon)');
    toast('Upgrade to ' + TIER[to].label + ': coming soon. Dev: Settings \u203a Tier (dev), ?tier=' + to + ' or Alt+Shift+T.', 4800);
  }
  window.Lab.upgrade = upgrade;
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

  // The card's X only shows when the slim-rail hover expand/collapse is unavailable (Basic) or turned off
  // (Settings > Dock > Hover to expand slim rail). Otherwise the round avatar + hover do its job (t584u).
  const closeShown = () => minStage() < 3 && !(proOn('dockHover') && ui.dockHover !== false);
  const closeAnchor = () => (closeShown() ? $('dockClose') : $('railAvatar'));
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
  function setDockState(targetState, opts) {
    opts = opts || {};
    const fromState = (dock && dock.dataset.state) || dockState || 'closed';
    if (fromState === targetState && !opts.force) return;

    clearTimeout(leaveTimer);
    clearTimeout(hoverTimer);

    const fromKey = document.activeElement === $('dockTrigger');
    const lv = opts.instant ? 'off' : M.level();

    if (fromState === 'open' && targetState !== 'open') {
      Arc.close(true);
      Pop.hide();
      Help.hide();
    }

    const prevRect = (dock && dock.offsetWidth && dock.offsetHeight) ? dock.getBoundingClientRect() : null;
    const cardMain = card.querySelector('.card-main');
    const mainW = cardMain.offsetWidth;   // the card's content width now (kept while it folds away)

    dock.getAnimations().forEach((a) => a.cancel());
    cardMain.getAnimations().forEach((a) => a.cancel());
    $('rail').getAnimations().forEach((a) => a.cancel());
    const tok = ++morphTok;
    dock.classList.remove('is-sliding');
    cardMain.style.width = '';

    lastFrom = fromState;
    dockState = targetState;
    dockOpen = (targetState === 'open');
    const viaHover = opts.how === 'hover';
    hoverOpen = targetState === 'open' && viaHover;
    if (targetState === 'open') {
      pinned = !viaHover;
      if (!viaHover) ui.open = true;
    } else {
      pinned = false;
      if (!viaHover) ui.open = false;
    }
    if (!viaHover) saveUi();   // hover expand / fold never changes what is saved

    applyDockLayout();

    const finish = () => {
      if (tok !== morphTok) return;   // a newer morph took over
      dock.dataset.state = targetState;
      dock.classList.remove('is-morphing', 'is-closing');
      $('dockTrigger').setAttribute('aria-expanded', targetState === 'open' ? 'true' : 'false');
      dock.dataset.stage = String(DOCK_STAGES.indexOf(targetState) + 1);
      syncAvatar();
      syncHint();   // the toolbar's left tab shows while no rail pad is on screen
      if (targetState === 'closed') {
        M.contentIn($('dockTrigger').firstChild);
      }
    };

    if (lv === 'off' || !prevRect) {
      finish();
      if (targetState === 'open') {
        fitPages(null, false);
        syncRail(true);
        syncModeSw();
        if (fromKey) {
          requestAnimationFrame(() => {
            const target = document.querySelector('#rail .rail-btn.is-active') || closeAnchor();
            if (target) target.focus({ preventScroll: true });
          });
        }
      } else if (targetState === 'slim') {
        syncRail(true);
      }
      layoutStage();
      return;
    }

    // Animated transition
    if (targetState === 'closed') {
      dock.classList.add('is-morphing', 'is-closing');
      if (fromState === 'open') {
        M.travel(closeAnchor(), $('dockTrigger'), closeShown() ? svg('close') : (window.Pass ? Pass.miniHtml() : svg('close')), { rotate: closeShown() ? -90 : 0 });
        M.contentOut(card.querySelector('.card-main'));
      }
      M.contentOut($('rail'));
      layoutStage();
      const a = dock.animate([
        { width: prevRect.width + 'px', height: prevRect.height + 'px', borderRadius: fromState === 'slim' ? '20px' : '22px' },
        trigBox()
      ], { duration: lv === 'full' ? 280 : 150, easing: M.settle });
      a.finished.then(finish, () => {});
      return;
    }

    // Target is 'open' or 'slim'
    // Card -> slim rail (hover fold, Shift+click, Esc, outside click) is a pure shrink: measure the slim
    // rail with the card content already gone (not its unconstrained width while it fades, which made the
    // dock balloon out over the stage and then snap back), keep the fading content at its own width
    // (no reflow) and pin the rail to the moving edge. The stage never moves (see freeRect).
    const shrinkToSlim = targetState === 'slim' && fromState === 'open';
    dock.dataset.state = targetState;
    dock.dataset.stage = String(DOCK_STAGES.indexOf(targetState) + 1);
    syncAvatar();
    syncHint();
    dock.classList.remove('is-closing');
    $('dockTrigger').setAttribute('aria-expanded', targetState === 'open' ? 'true' : 'false');

    if (targetState === 'open') {
      fitPages(null, false);
      syncRail(true);
      syncModeSw();
      if (fromKey) {
        requestAnimationFrame(() => {
          const target = document.querySelector('#rail .rail-btn.is-active') || closeAnchor();
          if (target) target.focus({ preventScroll: true });
        });
      }
    } else if (targetState === 'slim') {
      syncRail(true);
    }

    // end size, measured before .is-morphing (which keeps the fading card content in the layout)
    const toRect = (targetState === 'open' ? card : dock).getBoundingClientRect();
    const radFrom = fromState === 'closed' ? trigBox().borderRadius : fromState === 'slim' ? '20px' : '22px';
    const radTo = targetState === 'slim' ? '20px' : '22px';
    const sliding = (fromState === 'open' && targetState === 'slim') || (fromState === 'slim' && targetState === 'open');
    if (shrinkToSlim && mainW) cardMain.style.width = mainW + 'px';
    dock.classList.add('is-morphing');
    if (sliding) dock.classList.add('is-sliding');   // rail rides the moving edge, the card is clipped behind it

    if (targetState === 'open' && fromState === 'closed') {
      M.travel($('dockTrigger'), closeAnchor(), window.Pass ? Pass.miniHtml() : svg('sliders'));
      M.contentIn(cardMain, 60);
      M.contentIn($('rail'), 30);
    } else if (targetState === 'open' && fromState === 'slim') {
      M.contentIn(cardMain, 60);
    } else if (shrinkToSlim) {
      M.contentOut(cardMain);
    } else if (targetState === 'slim' && fromState === 'closed') {
      M.contentIn($('rail'), 30);
    }

    // fill: forwards + cancel on finish, so there is never a frame at the dock's natural width
    // while the end-of-morph classes are still on
    const a = dock.animate([
      { width: prevRect.width + 'px', height: prevRect.height + 'px', borderRadius: radFrom },
      { width: toRect.width + 'px', height: toRect.height + 'px', borderRadius: radTo }
    ], { duration: lv === 'full' ? 280 : 150, easing: M.settle, fill: 'forwards' });
    a.finished.then(() => {
      if (tok !== morphTok) return;   // a newer morph took over (it cleans up for itself)
      dock.classList.remove('is-morphing', 'is-sliding');
      cardMain.style.width = '';
      a.cancel();
    }, () => {});
  }
  function openDock(how) {
    if (dockHidden) showDock(true);
    if (dockState === 'open') {
      if (how !== 'hover' && !hoverOpen) pinned = true;   // a hover-opened card stays in hover mode
      return;
    }
    setDockState('open', { how });
  }
  // X / Esc / outside click: one stage down. Pro with Settings > Dock "Pass" folds the card
  // straight to the pass; forceIcon (Pro only) does the same.
  function closeDock(forceIcon) {
    const n = dockStage();
    if (n <= minStage()) return;
    const toPass = minStage() === 1 && n === 3 && (forceIcon === true || (ui.proDock || 'full') === 'icon');
    setStage(toPass ? 1 : n - 1);
  }

  // ---------- dock stages: 1 lanyard pass (Pro) · 2 thin rail · 3 card + rail ----------
  const proOn = (f) => !PRO_FEATURES[f] || hasPro(f);
  // Pro 1 (VIP badge) · Mid 2 (slim rail) · Base 3 (the card is locked open)
  const minStage = () => Math.min(...CAPS[tier].dockStages);
  const dockStage = () => Math.max(1, DOCK_STAGES.indexOf((dock && dock.dataset.state) || dockState) + 1);
  function dockEdge() {
    if (ui.dockPos === 'bottom') return 'bottom';
    return /left$/.test(ui.anchor) ? 'left' : 'right';
  }
  // [sign, axis]: a flick that way points at the stage (= grow)
  const towardStage = () => ({ right: [-1, 'x'], left: [1, 'x'], bottom: [-1, 'y'] })[dockEdge()];
  function setStage(n, opts) {
    n = Math.max(minStage(), Math.min(3, n));
    if (dockHidden) showDock(true);
    if (n === 3) { openDock((opts && opts.how) || 'click'); return; }
    setDockState(DOCK_STAGES[n - 1], opts);
  }
  function stepDock(d) { setStage(dockStage() + d); }
  // Pro: a strong flick of the pass away from the stage hides the dock for this session (never saved).
  // Always recoverable: Alt+D / Shift+D, the edge handle where it was, switching to Basic, or a reload.
  function hideDock(vx, vy, how) {
    if (dockHidden || !proOn('dockHide')) return;
    if (dockStage() !== minStage()) setDockState(DOCK_STAGES[minStage() - 1], { instant: true });
    dockHidden = true;
    const done = () => { if (!dockHidden) return; dock.hidden = true; dock.getAnimations().forEach((a) => a.cancel()); dock.style.transform = ''; syncHint(); layoutStage(); };
    Log.push('dock hidden (' + KEYS.dock.label + ' or the edge handle brings it back)' + (how ? ' \u00b7 ' + how : ''));
    toast('Dock hidden. ' + KEYS.dock.label + ' or the edge handle brings it back.');
    const lv = M.level();
    if (lv !== 'full' || !(vx || vy)) {
      if (lv === 'fade') dock.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' }).finished.then(done, done); else done();
      return;
    }
    const m = Math.hypot(vx, vy) || 1, k = Math.min(420, 180 + m * 120);
    dock.animate([{ transform: dock.style.transform || 'none', opacity: 1 }, { transform: 'translate(' + (vx / m) * k + 'px,' + (vy / m) * k + 'px) rotate(' + (vx > 0 ? 18 : -18) + 'deg) scale(0.8)', opacity: 0 }],
      { duration: 360, easing: 'cubic-bezier(0.2, 0.6, 0.35, 1)', fill: 'forwards' }).finished.then(done, done);
  }
  function showDock(quiet) {
    if (!dockHidden) return;
    dockHidden = false;
    dock.hidden = false;
    dock.getAnimations().forEach((a) => a.cancel());
    syncHint();
    layoutStage();
    // the way back brings the stage toolbar back too, when its rail switch is ON
    if (TB.restore() && !quiet) Log.push('toolbar back with the dock');
    const lv = M.level();
    if (lv === 'full') {
      const e = dockEdge(), o = e === 'right' ? 'translateX(70px)' : e === 'left' ? 'translateX(-70px)' : 'translateY(70px)';
      dock.animate([{ transform: o + ' scale(0.7)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 460, easing: M.springSoft });
    } else if (lv === 'fade') dock.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
    if (!quiet) Log.push('dock back');
  }
  // Nested tabs, always a way back in the opposite direction:
  //   right (#dockHint): the small handle on the edge where a hidden (flicked-away) dock was.
  //   left  (#tbHint):   the stage toolbar's own nested tab, while it is ON but flicked away and no rail
  //                      pad is on screen (dock at the VIP badge or hidden). Click = it flies back top-left.
  // Each one springs in from its screen edge when needed and slides back out when its thing returns.
  function showTab(h, on) {
    if ((h.dataset.on === 'true') === on) return;
    h.dataset.on = on ? 'true' : 'false';
    h.getAnimations().forEach((a) => a.cancel());
    const e = h.dataset.edge, off = e === 'left' ? 'translateX(-115%)' : e === 'bottom' ? 'translateY(115%)' : 'translateX(115%)';
    const lv = M.level();
    if (on) {
      h.hidden = false;
      if (lv === 'full') h.animate([{ transform: off }, { transform: 'translate(0,0) scale(1.06)', offset: 0.7 }, { transform: 'none' }], { duration: 460, delay: 80, easing: M.springSoft, fill: 'backwards' });
      else if (lv === 'fade') h.animate([{ opacity: 0 }], { duration: 150 });
      return;
    }
    if (lv === 'off' || h.hidden) { h.hidden = true; return; }
    const a = h.animate([{ transform: 'none', opacity: 1 }, { transform: lv === 'full' ? off : 'none', opacity: 0 }], { duration: lv === 'full' ? 220 : 120, easing: 'cubic-bezier(0.5, 0, 0.75, 0.3)', fill: 'forwards' });
    a.finished.then(() => { if (h.dataset.on !== 'true') h.hidden = true; a.cancel(); }, () => {});
  }
  const railPadOnScreen = () => !dockHidden && dockStage() >= 2 && !!document.querySelector('#railTools .tb-sw');
  function syncHint() {
    const h = $('dockHint');
    if (h) {
      const tb = ui.tbOut !== false && !TB.shown;
      h.title = 'Bring back the VIP badge' + (tb ? ' and the flicked-away stage toolbar (top-left)' : '') + ' (' + KEYS.dock.label + ' or ' + KEYS.dock.alt + ')';
      h.setAttribute('aria-label', h.title);
      h.dataset.edge = dockEdge();
      h.dataset.anchor = ui.dockPos === 'bottom' ? 'bottom-center' : ui.anchor;
      showTab(h, dockHidden);
    }
    const t = $('tbHint');
    if (t) {
      t.dataset.edge = (dockEdge() === 'left') ? 'right' : 'left';   // the toolbar moves off a left dock's side
      t.dataset.anchor = 'top';
      showTab(t, caps().toolbar && ui.tbOut !== false && !TB.shown && !railPadOnScreen());
    }
  }
  // Basic <-> Pro: Basic has no pass stage and no hiding, so bring the dock back to a visible stage.
  function dockModeChanged() {
    if (!proOn('dockHide') && dockHidden) showDock(true);
    TB.restore();   // a mode switch never leaves a parked toolbar behind (OFF stays off; its switch is on the rail)
    if (dockStage() < minStage()) setDockState(DOCK_STAGES[minStage() - 1]);
    syncDockTools();
  }
  function syncDockTools() {
    dock.dataset.pro = mode === 'pro' ? 'true' : 'false';
    dock.dataset.tier = tier;
    document.documentElement.dataset.tier = tier;
    dock.classList.toggle('has-stages', proOn('dockStages'));
    dock.classList.toggle('has-flick', proOn('dockFlick'));
    syncHint();
    syncAvatar();
  }
  // The round avatar at the top of the rail (the pass's photo). Click: from the expanded card it
  // collapses straight to the VIP badge (skips the slim rail); from the slim rail it expands to the card.
  // Shift+click: card -> slim rail, slim rail -> VIP badge. Basic (no badge): card <-> rail.
  // A card that hover opened from the slim rail: click keeps it open (pins it) instead of collapsing.
  // At stage 1 the badge itself carries the same photo, so a version of it is visible at every stage.
  const STAGE_NAMES = ['the VIP badge', 'the slim rail', 'the full card'];
  function avatarNext(rev) {
    const n = dockStage(), lo = minStage();
    if (n >= 3) return rev ? 2 : lo;
    if (n === 2) return rev && lo < 2 ? lo : 3;
    return 3;
  }
  function syncAvatar() {
    const b = $('railAvatar');
    if (!b) return;
    const keep = hoverOpen && dockStage() === 3;
    const to = avatarNext(false), up = to > dockStage(), alt = avatarNext(true);
    const label = keep ? 'Keep the full card open' : (up ? 'Expand to ' : 'Collapse to ') + STAGE_NAMES[to - 1];
    const altTxt = alt !== to ? ' (Shift+click: ' + STAGE_NAMES[alt - 1] + ')' : '';
    b.setAttribute('aria-label', label + altTxt);
    const tip = b.querySelector('.rail-tip');
    if (tip) tip.textContent = label;
    b.dataset.dir = keep || up ? 'up' : 'down';
  }
  function paintAvatar() {
    const b = $('railAvatar');
    if (!b) return;
    const face = window.Pass && Pass.faceHtml ? Pass.faceHtml() : svg('sliders');
    b.innerHTML = '<span class="ra-face">' + face + '</span><span class="rail-tip"></span>';
    syncAvatar();
  }

  // ---------- rail ----------
  function basicVars() {
    let f = vars.filter((v) => v.featured);
    if (!f.length) f = vars.filter((v) => !v.advanced);
    return f.slice(0, BASIC_CAP);
  }
  function hasCat(id) { return tierVars().some((v) => v.category === id); }
  function orderedCats() {
    const ord = Array.isArray(ui.railOrder) ? ui.railOrder : [];
    const idx = (id) => { const i = ord.indexOf(id); return i < 0 ? 100 + CAT_IDS.indexOf(id) : i; };
    return CATS.slice().sort((a, b) => idx(a.id) - idx(b.id));
  }
  const railHidden = () => (Array.isArray(ui.railHidden) ? ui.railHidden : []);
  function visibleCats() {
    if (hasPro('accordion')) return orderedCats().filter((c) => c.id !== 'interact' || hasCat('interact'));
    // Basic (t584u): every section that has controls, shown as open cards in one scrolling list
    return orderedCats().filter((c) => hasCat(c.id));
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
    railTools().forEach((t) => {
      if (t.id === 'new') tool('new', svg('plus'), 'New component', () => { openDock('click'); startNew(); });
      if (t.id === 'toolbar') {
        // XDJ-style ON/OFF pad (lit LED when ON); TB.syncRailBtn keeps the label and state current
        const b = tool('toolbar', '<i class="tbsw-led" aria-hidden="true"></i>' + svg('toolbar') + '<span class="tbsw-txt" aria-hidden="true">OFF</span>', 'Stage toolbar ON/OFF', () => TB.railClick());
        b.classList.add('tb-sw');
        TB.railButton(b);
      }
    });
    if (caps().settings) tool('settings', svg('gear'), 'Settings', () => { openDock('click'); go({ type: 'settings' }); });
    $('rail').classList.toggle('no-tools', !tools.children.length);
    requestAnimationFrame(() => syncRail(true));
  }
  function railKey(spec) {
    if (spec.type === 'cat') return spec.cat;
    if (spec.type === 'role') return byId[spec.id] ? byId[spec.id].category : 'color';
    if (spec.type === 'user') return 'settings';
    return spec.type;
  }
  function railIndex(spec) {
    const order = railCats().map((c) => c.id).concat(railTools().map((t) => t.id), ['settings']);
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
  // Tier change, live (no reload): the tier's own saved settings (Pro all, Mid a few, Base none), its controls,
  // header, footer, rail and dock stages. Values reload from what that tier keeps (Base / Mid: defaults).
  const TIER_BLURB = {
    free: (n) => n + ' controls, sections open, Reset only. Nothing is saved.',
    mid: (n) => n + ' controls in sections, hover key, toolbar, snapshot A, Copy changes.',
    pro: () => 'every control, in collapsible sections, plus snapshots and settings.'
  };
  let tierBusy = null;
  function setTier(next, opts) {
    if (!TIER_IDS.includes(next)) return Promise.resolve();
    if (opts && opts.plan) { plan = next; rawStore.set('tier', next); }
    if (tierRank(next) > tierRank(plan)) { plan = next; rawStore.set('tier', next); }
    try { if (tierRank(next) < tierRank(plan)) sessionStorage.setItem(TIER_PREVIEW, next); else sessionStorage.removeItem(TIER_PREVIEW); } catch (_) { /* ignore */ }
    if (next === tier) { syncModeSw(); if (Help.isOpen) Help.fill(); return Promise.resolve(); }
    tier = next;
    mode = tier === 'pro' ? 'pro' : 'basic';
    mem.clear();
    loadUiForTier();
    applyLook();
    M.enabled = ui.motion !== false;
    M.flickOn = ui.flick !== false;
    M.flickStrength = ui.flickStrength || 'normal';
    document.documentElement.classList.toggle('no-motion', !ui.motion);
    Help.hide(); Pop.hide(); Arc.close(true); TB.menuClose();
    if (!caps().toolbar) TB.close();
    syncDockTools();
    applyDockLayout();
    const id = def && def.id;
    const run = (id ? loadComponent(id, false) : Promise.resolve()).then(() => {
      dockModeChanged();
      initDockState();
      relayout();
      Log.push('tier ' + TIER[tier].label + (tier !== plan ? ' (preview)' : ''));
      toast(TIER[tier].label + (tier !== plan ? ' preview' : '') + ': ' + TIER_BLURB[tier](tierVars().length));
    });
    tierBusy = run;
    return run;
  }
  // old name kept for scripts / __lab: 'basic' = Base (free), 'pro' = Pro
  function setMode(m) { return setTier(m === 'pro' ? 'pro' : m === 'mid' ? 'mid' : 'free'); }
  // Dock on load / tier change: Pro and Mid open as Settings > Dock state says (Mid: expanded or slim rail);
  // Base is always the expanded card.
  function initDockState() {
    let st = 'open';
    if (tier !== 'free') {
      const pref = ui.proDock || 'full';
      st = pref === 'full' ? 'open' : (pref === 'icon' && proOn('dockStages')) ? 'closed' : 'slim';
    }
    setDockState(st, { instant: true, how: 'init', force: true });
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
    const basicCat = !hasPro('accordion') && spec.type === 'cat';
    if (basicCat && navStack.length === 1 && cur.type === 'cat' && Basic.list()) {
      navStack[0] = spec;
      Basic.scrollTo(spec.cat);
      syncRail();
      flashTip(spec.cat);
      return;
    }
    if (navStack.length === 1 && sameSpec(cur, spec)) { flashTip(railKey(spec)); return; }
    const dir = railIndex(spec) >= railIndex(cur) ? 1 : -1;
    navStack = [spec];
    renderPage(dir);
    if (proCat) Acc.focus(spec.cat, true);
    if (basicCat) Basic.scrollTo(spec.cat, true);
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
    if (!$('footLog')) return;
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
      if (!compactNow && $('footLog') && $('footLog').offsetHeight) logH = $('footLog').offsetHeight + 6;
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
    if (spec.type === 'cat') return 'All controls';
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
    // Pro home: no loose 'All controls' / count labels; the component title sits centred above the quick pill (dock.css)
    const home = spec.type === 'cat';
    // Both modes (t584u): the controls home has no page title / count row; header = tools row, centred name,
    // then the quick key row (Basic) or quick key + SNAPSHOTS row (Pro). Only the cards below scroll.
    $('cardHead').classList.toggle('is-home', home);
    const snapRow = $('snapRow');
    snapRow.innerHTML = '';
    const sb = home && hasPro('accordion') ? buildSnapBar() : null;
    if (sb) snapRow.appendChild(sb);
    snapRow.hidden = !sb;
    // Pro / Mid home: the quick key sits in the SNAPSHOTS row, so the head copy hides (dock.css)
    $('cardHead').classList.toggle('is-pro-home', !!sb);
    syncQuick();
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
    if (spec.type === 'cat') return Basic.build(inner);
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

  // ---------- Basic (t584u): every section as an OPEN card in one scrolling list (no accordion, no section menu,
  // no snapshots, no flip folds). Each section shows all its controls in plain mini cards. The rail scrolls to a
  // section and follows the scroll. ----------
  const Basic = (function () {
    let lock = 0;
    const list = () => pagesEl.querySelector('.page:not(.is-leaving) .basic-list');
    const sec = (cat) => { const l = list(); return l ? l.querySelector('.bsec[data-cat="' + cat + '"]') : null; };
    function fill(cat, bin) {
      const all = tierVars().filter((v) => v.category === cat);
      // Base: no palette presets row (each colour is its own 8-swatch line)
      if (cat === 'color' && tier !== 'free' && vars.some((v) => v.control === 'swatch-role')) bin.appendChild(buildPresets());
      const groups = groupsFor(all, cat);
      const bare = groups.length === 1 && groups[0].items.length <= 3;
      groups.forEach((g) => bin.appendChild(miniCard(g, bare, true)));
      return all.length;
    }
    function build(inner) {
      const wrapEl = el('div', 'basic-list');
      let total = 0, n = 0;
      visibleCats().forEach((c) => {
        const box = el('section', 'acc is-open bsec');
        box.dataset.cat = c.id;
        if (c.id === 'interact') box.classList.add('acc-interact');
        const head = el('div', 'acc-head bsec-head', svg(c.icon) + '<span class="acc-label">' + esc(c.label) + '</span><span class="acc-n"></span>');
        head.id = 'bsec-h-' + c.id;
        const body = el('div', 'acc-body');
        body.setAttribute('role', 'region');
        body.setAttribute('aria-labelledby', head.id);
        const bin = el('div', 'acc-inner');
        const k = fill(c.id, bin);
        head.querySelector('.acc-n').textContent = k;
        total += k; if (k) n++;
        body.appendChild(bin);
        box.append(head, body);
        wrapEl.appendChild(box);
      });
      inner.appendChild(wrapEl);
      inner.classList.add('is-acc', 'is-basic');
      requestAnimationFrame(() => {
        const page = wrapEl.closest('.page');
        if (page) page.addEventListener('scroll', () => spy(page), { passive: true });
      });
      return total + ' controls \u00b7 ' + n + ' sections';
    }
    function scrollTo(cat, instant) {
      const box = sec(cat);
      const page = box && box.closest('.page');
      if (!page) return;
      lock = Date.now() + 700;
      page.scrollTo({ top: Math.max(0, box.offsetTop), behavior: instant || M.level() !== 'full' ? 'auto' : 'smooth' });
    }
    function spy(page) {
      if (Date.now() < lock || navStack.length !== 1 || navStack[0].type !== 'cat') return;
      const l = list();
      if (!l) return;
      const all = [...l.querySelectorAll(':scope > .bsec')];
      let hit = all[0];
      all.forEach((b) => { if (b.offsetTop - page.scrollTop <= 24) hit = b; });
      if (page.scrollTop + page.clientHeight >= page.scrollHeight - 2) hit = all[all.length - 1];
      if (hit && hit.dataset.cat !== navStack[0].cat) { navStack[0] = { type: 'cat', cat: hit.dataset.cat }; syncRail(); }
    }
    return { build, list, scrollTo };
  })();

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
  // Card layouts named by the manifest ("layout": { "deck": [...], "pads": [...] }), not by component group names
  const isDeckGroup = (name) => !!(man && Array.isArray(man.deckGroups) && man.deckGroups.includes(name));
  const isPadGroup = (name) => !!(man && Array.isArray(man.padGroups) && man.padGroups.includes(name));
  const sigFirst = (items) => items.filter((v) => v.signature).concat(items.filter((v) => !v.signature));
  function groupsFor(list, cat) {
    const order = (man.groups && man.groups[cat]) || [];
    const map = new Map();
    list.forEach((v) => { const g = v.group || autoGroup(v); if (!map.has(g)) map.set(g, []); map.get(g).push(v); });
    const gs = [...map.entries()].map(([name, items], i) => ({ name, items: sigFirst(items), i }));
    const rank = (g) => (g.items.some((v) => v.signature && !v.advanced) ? -1000 : 0) + (order.includes(g.name) ? order.indexOf(g.name) : 500 + g.i);
    return gs.sort((a, b) => rank(a) - rank(b));
  }
  function buildFlipCard(spec) {
    const { frontTitle, frontItems, backTitle, backItems, group } = spec;
    const card = el('div', 'mini is-flip');
    if (group) card.dataset.group = group;
    const head = el('button', 'mini-head is-flip-head');
    head.type = 'button';
    head.setAttribute('aria-expanded', 'false');
    const titleEl = el('span', 'mini-flip-title', esc(frontTitle));
    const badge = el('span', 'flip-badge', svg('flip', 'flip-ico') + '<span class="flip-circle"></span>');
    head.append(titleEl, badge);
    card.appendChild(head);

    const stage = el('div', 'flip-stage');
    const rotor = el('div', 'flip-rotor');
    const faceA = el('div', 'flip-face is-front');
    const isPadsA = frontItems.length > 1 && frontItems.every((v) => v.control === 'switch' && (v.variant === 'pad' || v.control === 'pad'));
    const isDeckA = isDeckGroup(group) || (frontItems.some((v) => v.control === 'fader' || v.variant === 'channel' || v.variant === 'fader') && frontItems.some((v) => v.control === 'radial' || v.variant === 'master' || v.variant === 'gain'));
    const isDialsA = frontItems.length > 1 && frontItems.every((v) => v.control === 'radial');
    const bodyA = el('div', 'mini-body' + (isDialsA ? ' is-dials' : '') + (isPadsA ? ' is-pads' : '') + (isDeckA ? ' is-deck' : ''));
    frontItems.forEach((v) => bodyA.appendChild(ctlRow(v, { compact: true })));
    faceA.appendChild(bodyA);

    const faceB = el('div', 'flip-face is-back');
    const isPadsB = backItems.length > 1 && backItems.every((v) => v.control === 'switch' && (v.variant === 'pad' || v.control === 'pad'));
    const isDeckB = (backItems.some((v) => v.control === 'fader' || v.variant === 'channel' || v.variant === 'fader') && backItems.some((v) => v.control === 'radial' || v.variant === 'master' || v.variant === 'gain'));
    const isDialsB = backItems.length > 1 && backItems.every((v) => v.control === 'radial');
    const bodyB = el('div', 'mini-body' + (isDialsB ? ' is-dials' : '') + (isPadsB ? ' is-pads' : '') + (isDeckB ? ' is-deck' : ''));
    backItems.forEach((v) => bodyB.appendChild(ctlRow(v, { compact: true })));
    faceB.appendChild(bodyB);
    faceB.setAttribute('inert', '');

    rotor.append(faceA, faceB);
    stage.appendChild(rotor);
    card.appendChild(stage);

    let flipped = false;
    const syncFlipUi = () => {
      card.classList.toggle('is-flipped', flipped);
      head.classList.toggle('is-on', flipped);
      head.setAttribute('aria-expanded', flipped ? 'true' : 'false');
      titleEl.textContent = flipped ? backTitle : frontTitle;
      const count = flipped ? frontItems.length : backItems.length;
      badge.querySelector('.flip-circle').textContent = count;
      badge.classList.toggle('is-on', flipped);
      head.title = flipped ? 'Flip to ' + frontTitle + ' (' + frontItems.length + ' controls)' : 'Flip to ' + backTitle + ' (' + backItems.length + ' controls)';
      if (flipped) {
        faceA.setAttribute('inert', '');
        faceB.removeAttribute('inert');
      } else {
        faceB.setAttribute('inert', '');
        faceA.removeAttribute('inert');
      }
      const activeFace = flipped ? faceB : faceA;
      requestAnimationFrame(() => activeFace.querySelectorAll('.seg').forEach((sg) => syncSeg(sg, null, sg.dataset.value, true)));
    };
    head.addEventListener('click', () => {
      flipped = !flipped;
      syncFlipUi();
      if (M.level() === 'full') {
        titleEl.animate([{ opacity: 0, transform: 'translateY(2px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: M.easeOut });
      }
    });
    syncFlipUi();
    return card;
  }
  function miniCard(g, bare, inAdv) {
    const rawMore = inAdv ? [] : g.items.filter((v) => v.advanced);
    const foldSingle = !inAdv && (g.name === 'Opacity' || (rawMore.length === 1 && g.items.length <= 3 && g.items.every((v) => v.control === 'slider')));
    const lead = (inAdv || foldSingle) ? g.items : g.items.filter((v) => !v.advanced);
    const more = (inAdv || foldSingle) ? [] : rawMore;
    if (more.length) {
      return buildFlipCard({
        frontTitle: g.name,
        frontItems: lead,
        backTitle: g.name + ' \u00b7 Adv',
        backItems: more,
        backBadgeLabel: 'Advanced',
        group: g.name
      });
    }
    const card = el('div', 'mini' + (bare ? ' is-bare' : ''));
    card.dataset.group = g.name;
    if (!bare) card.appendChild(el('div', 'mini-head', '<span>' + esc(g.name) + '</span>'));
    const isDials = lead.length > 1 && lead.every((v) => v.control === 'radial');
    const isPads = isPadGroup(g.name) || (lead.length > 1 && lead.every((v) => v.control === 'switch' && (v.variant === 'pad' || v.control === 'pad')));
    const isDeck = isDeckGroup(g.name) || (lead.some((v) => v.control === 'fader' || v.variant === 'channel' || v.variant === 'fader') && lead.some((v) => v.control === 'radial' || v.variant === 'master' || v.variant === 'gain'));

    const faderItems = lead.filter((v) => v.control === 'fader' || v.variant === 'channel' || v.variant === 'fader');
    const topItems = lead.filter((v) => !faderItems.includes(v));
    // Mid audit fix (c): a lone fader beside top controls (Size: Cards + Card width) also gets its deck tile, centred
    if (topItems.length && (faderItems.length > 1 || (tier === 'mid' && faderItems.length === 1))) {
      const body = el('div', 'mini-body is-mixed-deck');
      const topArea = el('div', 'mini-deck-top');
      topItems.forEach((v) => topArea.appendChild(ctlRow(v, { compact: !bare })));
      body.appendChild(topArea);

      const faderArea = el('div', 'mini-deck-faders' + (faderItems.length === 2 ? ' is-2col' : faderItems.length === 1 ? ' is-single' : ''));
      faderItems.forEach((v, idx) => {
        v.deckCh = v.deckCh || (idx + 1);
        faderArea.appendChild(ctlRow(v, { compact: true }));
      });
      body.appendChild(faderArea);
      card.appendChild(body);
      return card;
    }

    const body = el('div', 'mini-body' + (isDials ? ' is-dials' : '') + (isPads ? ' is-pads' : '') + (isDeck ? ' is-deck' : '') + (isDeck && lead.length === 1 && tier === 'mid' ? ' is-single' : ''));
    lead.forEach((v) => body.appendChild(ctlRow(v, { compact: !bare })));
    card.appendChild(body);
    return card;
  }
  function fillPro(cat, inner) {
    const all = tierVars().filter((v) => v.category === cat);
    if (!all.length) { inner.appendChild(el('p', 'empty', 'No ' + (CATS.find((c) => c.id === cat) || {}).label + ' controls for this component.')); return { n: 0, adv: 0 }; }
    if (cat === 'color' && vars.some((v) => v.control === 'swatch-role')) inner.appendChild(buildPresets());
    const groups = groupsFor(all, cat);
    if (tier === 'mid') {   // Mid: plain cards, no flip / Advanced folds (those are Pro)
      const bareM = groups.length === 1 && groups[0].items.length <= 3;
      groups.forEach((g) => inner.appendChild(miniCard(g, bareM, true)));
      return { n: all.length, adv: 0 };
    }
    const front = groups.filter((g) => g.items.some((v) => !v.advanced));
    const back = groups.filter((g) => g.items.every((v) => v.advanced));
    const advN = all.filter((v) => v.advanced).length;
    // Pair a single trailing back (advanced) group onto a front group that has no advanced items of its own
    // (e.g. Interaction: Pointer <-> Touch & keys, Motion: Loop <-> Depth, Layout: Size <-> Depth).
    const pairedFrontIdx = back.length === 1 ? front.findIndex((g) => g.items.every((v) => !v.advanced)) : -1;
    const bare = front.length === 1 && front[0].items.length <= 3 && !back.length;
    front.forEach((g, idx) => {
      if (idx === pairedFrontIdx) {
        inner.appendChild(buildFlipCard({
          frontTitle: g.name,
          frontItems: g.items,
          backTitle: back[0].name,
          backItems: back[0].items,
          backBadgeLabel: back[0].name,
          group: g.name
        }));
      } else {
        inner.appendChild(miniCard(g, bare));
      }
    });
    const remBack = pairedFrontIdx >= 0 ? [] : back;
    // Pair remaining back (advanced) groups two-by-two into dual-sided 3D flip cards (e.g. Text fade <-> Shell dim, End fade <-> Border fill)
    for (let i = 0; i < remBack.length; i += 2) {
      const gA = remBack[i], gB = remBack[i + 1];
      if (gB) {
        inner.appendChild(buildFlipCard({
          frontTitle: gA.name,
          frontItems: gA.items,
          backTitle: gB.name,
          backItems: gB.items,
          backBadgeLabel: gB.name,
          group: gA.name
        }));
      } else {
        inner.appendChild(miniCard(gA, false, true));
      }
    }
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
    if (!hasPro('snapshots') || !caps().snapshots || !def) return null;
    const bar = el('div', 'snap-bar');
    // Pro home row (t577u): [interaction key + dropdown arrow] | SNAPSHOTS A B C, one centred row
    const qv = quickVar();
    if (qv) { const q = buildQuickCtl(); paintQuick(q, qv); bar.append(q, el('span', 'snap-sep')); }
    bar.appendChild(el('span', 'snap-tag', 'Snapshots'));
    const paint = () => {
      const snaps = store.get('snaps:' + def.id, {});
      bar.querySelectorAll('.snap-slot').forEach((b) => {
        const k = b.dataset.slot, s = snaps[k];
        b.classList.toggle('is-filled', !!s);
        b.title = s
          ? 'Slot ' + k + ' saved \u00b7 Click to load \u00b7 Shift+Click to overwrite \u00b7 Alt+Click or Right-click to clear'
          : 'Slot ' + k + ' empty \u00b7 Click to save current look' + (caps().snapshots === 1 ? ' (then Reset or change things and click ' + k + ' to compare)' : '');
      });
    };
    ['A', 'B', 'C'].slice(0, caps().snapshots).forEach((k) => {
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
        toast('Loaded snapshot ' + k + (caps().undo ? ' (Ctrl+Z undoes).' : '.'));
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
    { id: 'closed', label: 'All closed', icon: 'collapse', hint: 'Default. Every section starts closed' },
    { id: 'first', label: 'First open', icon: 'expand', hint: 'The first section starts open, the rest closed' },
    { id: 'remember', label: 'Remember', icon: 'remember', hint: 'Reopen what was open last time (per component)' }
  ];
  const Acc = (function () {
    let spyLock = 0;
    const list = () => pagesEl.querySelector('.page:not(.is-leaving) .acc-list');
    const secs = () => { const l = list(); return l ? [...l.querySelectorAll(':scope > .acc')] : []; };
    const sec = (cat) => { const l = list(); return l ? l.querySelector('.acc[data-cat="' + cat + '"]') : null; };
    const variant = () => (VARIANTS.some((x) => x.id === ui.accVariant) ? ui.accVariant : 'B');
    const openCats = () => secs().filter((x) => x.classList.contains('is-open')).map((x) => x.dataset.cat);
    // Responsive (Settings > Pro sections): one section open at a time, and the open one moves to the top.
    // Opening another or closing it puts every section back in its normal order.
    const responsive = () => ui.accResponsive === true;
    const single = () => variant() === 'D' || responsive();
    function persist() { if (def && ui.accCollapse === 'remember') store.set('accOpen:' + def.id, openCats()); }
    function initialOpen(focusCat, cats) {
      const nonEmpty = cats.filter((c) => c.n).map((c) => c.id);
      let open;
      if (ui.accCollapse === 'first') open = nonEmpty.slice(0, 1);
      else if (ui.accCollapse === 'remember') { const st = store.get('accOpen:' + def.id, null); open = Array.isArray(st) ? st.filter((id) => nonEmpty.includes(id)) : []; }
      else open = [];
      if (single() && open.length > 1) open = [open.includes(focusCat) ? focusCat : open[0]];
      return open;
    }
    // Normal order = the rail order the sections were built in (data-idx). Responsive: the open one first.
    function reorder() {
      const l = list();
      if (!l) return false;
      const all = secs();
      const nat = all.slice().sort((a, b) => +a.dataset.idx - +b.dataset.idx);
      const want = responsive() ? nat.filter((b) => b.classList.contains('is-open')).concat(nat.filter((b) => !b.classList.contains('is-open'))) : nat;
      if (want.every((b, i) => all[i] === b)) return false;
      want.forEach((b) => l.appendChild(b));
      return true;
    }
    function build(focusCat, inner) {
      const wrapEl = el('div', 'acc-list');
      wrapEl.dataset.variant = variant();

      const cats = visibleCats().map((c, i) => {
        const box = el('section', 'acc');
        box.dataset.cat = c.id;
        box.dataset.idx = String(i);
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
      if (responsive()) { const ob = cats.find((c) => open.includes(c.id)), firstAcc = wrapEl.querySelector(':scope > .acc'); if (ob && firstAcc !== ob.box) wrapEl.insertBefore(ob.box, firstAcc); }
      inner.appendChild(wrapEl);
      inner.classList.add('is-acc');
      requestAnimationFrame(() => {
        const page = wrapEl.closest('.page');
        if (page) page.addEventListener('scroll', () => spy(page), { passive: true });
      });
      const total = cats.reduce((a, c) => a + c.n, 0);
      return total + ' controls \u00b7 ' + cats.filter((c) => c.n).length + ' sections';
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
      const flip = (variant() === 'D' || responsive() || all.some((b, i) => b.dataset.idx !== String(i))) && M.level() === 'full';
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
      reorder();
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
      if (on) want = single() ? [cat] : want.concat([cat]);
      apply(want);
      if (on) { navStack[0] = { type: 'cat', cat }; syncRail(); }
      if (on && responsive()) scrollTo(cat);
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
      if (!COLLAPSE.some((x) => x.id === id)) return;
      ui.accCollapse = id; saveUi();
      const nat = secs().slice().sort((a, b) => +a.dataset.idx - +b.dataset.idx).filter((b) => +b.querySelector('.acc-n').textContent > 0).map((b) => b.dataset.cat);
      if (id === 'first') apply(nat.slice(0, 1));
      else if (id === 'closed') apply([]);
      else persist();
      Log.push('sections ' + COLLAPSE.find((x) => x.id === id).label.toLowerCase());
      syncPop();
    }
    function setResponsive(on) {
      ui.accResponsive = !!on; saveUi();
      const o = openCats();
      if (on && o.length > 1) apply([o.includes(navStack[0].cat) ? navStack[0].cat : o[0]]);
      else apply(o);
      Log.push('sections responsive ' + (on ? 'on (one open, moved to the top)' : 'off'));
      syncPop();
    }
    return { build, toggle, focus, list, setVariant, setCollapse, setResponsive, openCats, variant, get responsive() { return responsive(); } };
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
      const rb = el('button', 'pop-btn pop-resp', svg('up') + '<span>1 open at a time \u00b7 open one on top</span>');
      rb.type = 'button'; rb.dataset.accResp = '1';
      rb.title = 'Responsive: only the section you open stays open and moves to the top; closing it or opening another puts the order back';
      rb.setAttribute('role', 'menuitemcheckbox');
      rb.addEventListener('click', () => Acc.setResponsive(!ui.accResponsive));
      pop.appendChild(rb);
      pop.appendChild(el('div', 'pop-label', 'Motion'));
      const grid = el('div', 'pop-row pop-variants');
      VARIANTS.forEach((v) => {
        const b = el('button', 'pop-btn pop-var', '<b>' + v.id + '</b><span>' + esc(v.label) + '</span>');
        b.type = 'button'; b.dataset.variant = v.id; b.title = v.id + ' \u00b7 ' + v.hint;
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
      document.querySelectorAll('[data-acc-resp]').forEach((b) => { const on = ui.accResponsive === true; if (b.classList.contains('pop-btn')) b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
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
  // ---------- help (?) in the card header ----------
  // Hover, focus or tap shows a compact card; click pins it; Esc or an outside click closes it.
  // Pro: how the dock stages, the pass and the shortcuts work. Basic: what Pro adds + Switch to Pro.
  // Text is built from KEYS / PRO_FEATURES / Settings, so it can't drift from the code.
  const Help = (() => {
    let open = false, stuck = false, t = 0, quiet = false;
    const btn = () => $('helpBtn'), pop = () => $('helpPop');
    const li = (h) => '<li>' + h + '</li>';
    const k = (x) => '<kbd>' + esc(x) + '</kbd>';
    function zoomItems() {
      return li('Pad at the top-centre of the sandbox card (the locked screen; only its contents zoom, clipped at the card edge): \u2212 / + zoom (25% to 400%), the readout shows the view zoom, the frame icon resets to 100% and centres')
        + li('Toggle back: click the readout or press ' + k(KEYS.zoomToggle.label) + ' to switch 100% \u21c4 your last zoom')
        + li(k(KEYS.zoomIn.label) + ' / ' + k('=') + ' in \u00b7 ' + k('-') + ' out \u00b7 Ctrl+wheel or a pinch zooms at the cursor \u00b7 drag empty space or middle-drag to pan when zoomed in')
        + li('Screen only: the component\u2019s values, export and URL never change; it still reacts to hover, click, drag and keys at any zoom. Session only; ?reset = 100%. Hide the icons: Settings \u203a Viewport')
        + li('The screen is one solid colour (no dots, grid, border or frame lines) whose edge fades softly into a flat darker margin where the toolbar, dock and VIP badge sit; zoomed content fades out at the edge. Settings \u203a Viewport \u203a Margin tone');
    }
    function proItems() {
      const fl = ui.flick === false ? 'off (Settings \u203a Toolbar)' : (ui.flickStrength || 'normal');
      const hide = proOn('dockHide') && ui.dockFlickHide !== false;
      return '<p class="help-h">Dock</p><ul>'
        + li('Stages: <b>3</b> card + rail \u00b7 <b>2</b> thin rail \u00b7 <b>1</b> the all-access pass')
        + li('The pass: click, ' + k('Enter') + ' or ' + k(KEYS.dock.label) + ' = next stage \u00b7 Shift+click = full card')
        + li('Round avatar at the top of the rail: from the card, click collapses straight to the badge; from the slim rail, click expands to the card (Shift+click: card \u2192 slim rail, slim rail \u2192 badge) \u00b7 ' + (closeShown() ? '\u2715 folds the card one stage' : 'no \u2715 while hover to expand is on (turn it off in Settings \u203a Dock to get the \u2715 back)') + ' \u00b7 ' + k(KEYS.down.label) + ' one stage down \u00b7 ' + k(KEYS.dock.label) + ' or ' + k(KEYS.dock.alt) + ' next stage (wraps)')
        + (proOn('dockFlick') ? li('Flick (' + esc(fl) + '): the pass or the dock\u2019s inner edge toward the stage grows it; the edge toward the screen edge shrinks it. Gentle = one stage, strong = to the end') : '')
        + li(hide ? 'Hide: a strong flick of the pass away (to the edge, up or down) hides the dock until reload. Back: the arrow tab on that edge or ' + k(KEYS.dock.label) + ' brings back the badge AND a flicked-away toolbar (top-left), or reload'
          : 'Flick-to-hide is off (Settings \u203a Dock)')
        + (proOn('dockHover') ? li(ui.dockHover !== false ? 'Slim rail: rest the cursor on it and it grows to the card; move away and it folds back (not while you hold a control or a picker is open). Tap its empty space on touch. Click the avatar on a hover-opened card to keep it open' : 'Hover to expand the slim rail is off (Settings \u203a Dock)') : '')
        + li('Stage toolbar (top-left): any flick while it is closed sends it away; an open toolbar ignores flicks. With no rail pad on screen (VIP badge or hidden dock) it nests in its own tab on the left edge: click the tab to bring it back')
        + li('Toolbar pad on the rail, two-stage: flicked away or moved \u2192 click puts it back top-left; home \u2192 click turns it OFF; OFF \u2192 click turns it ON (LED lit = ON, pulsing = flicked away)')
        + li('Sections: start all closed (Settings \u203a Pro sections: All closed / First open / Remember). Responsive: one open at a time, moved to the top')
        + '</ul><p class="help-h">Shortcuts</p><ul>'
        + li(k(KEYS.pause.label) + ' pause / play \u00b7 Ctrl+Z / Ctrl+Y undo / redo in the card')
        + '</ul><p class="help-h">Sandbox zoom (view only)</p><ul>' + zoomItems()
        + '</ul><p class="help-h">Settings</p><ul>'
        + li('Gear on the rail \u203a Dock: dock state (expanded / slim rail / VIP badge), hover to expand slim rail, dock glass (Clear / Frosted / Solid: the outer panel is see-through, the section cards stay opaque), flick-to-hide \u00b7 Pro sections: default state, responsive \u00b7 Profile pass: name, role, access level')
        + '</ul>';
    }
    // Pro: the three tiers and how to switch (dev). Placeholders: UPGRADE = toast until UPGRADE_URL is set.
    function tierItems() {
      return '<p class="help-h">Tiers</p><ul>'
        + li('<b>' + esc(TIER.free.label) + '</b> \u00b7 <b>' + esc(TIER.mid.label) + '</b> \u00b7 <b>' + esc(TIER.pro.label) + '</b> (all access). The switch at the top-left steps down to preview ' + esc(TIER.free.label) + '; its UPGRADE button steps back up (' + esc(TIER.mid.label) + ', then ' + esc(TIER.pro.label) + ')')
        + li('Pick any tier (dev): Settings \u203a Tier (dev), ' + k('?tier=free|mid|pro') + ' in the URL, or ' + k('Alt+Shift+T') + ' (cycles). Tier is a setting for now: no licence check. Upgrade / purchase pages: coming soon')
        + '</ul>';
    }
    // Base / Mid: what this tier has, then what the next tiers add, then UPGRADE (placeholder)
    function lowItems() {
      const n = tierVars().length;
      const now = tier === 'free'
        ? li(n + ' controls: four colours (8 swatches each) and two fade pads, every section open (no folding)')
          + li('The card stays open (no slim rail, no badge). Rail icons jump to a section')
          + li('Reset (footer) puts every control back. Nothing is saved: a reload starts from the defaults')
          + li(k(KEYS.pause.label) + ' pause / play')
        : li(n + ' controls in sections. Settings \u203a Sections: default state (closed / first open) and Responsive (one open at a time, moved to the top)')
          + li('Hover key (top) turns the hover pause on / off; its arrow opens Interaction. Speed: 0.5\u00d7 / 1\u00d7 / 2\u00d7 pads')
          + li('Snapshot A: click saves the current look, click again loads it, so you can compare it with Reset or another change (Shift+click overwrites, right-click clears; this session only)')
          + li('Footer: Copy changes + Reset. Stage toolbar (top-left) with its ON / OFF pad on the rail')
          + li('Round avatar or ' + k(KEYS.dock.label) + ': card \u21c4 slim rail; rest the cursor on the slim rail to expand it')
          + li('Saved: the dock state and the two section settings only. Everything else resets on reload');
      const midAdds = tier === 'free'
        ? '<p class="help-h">' + esc(TIER.mid.label) + ' adds</p><ul>'
          + li('22 controls in folding sections (Responsive option), the Interaction section and the hover key')
          + li('Speed pads 0.5\u00d7 / 1\u00d7 / 2\u00d7, the stage toolbar, snapshot A, Copy changes, the slim rail, a short Settings list')
          + '</ul>'
        : '';
      return '<p class="help-h">' + esc(TIER[tier].label) + ' (this tier)</p><ul>' + now + '</ul>' + midAdds
        + '<p class="help-h">' + esc(TIER.pro.label) + ' adds</p><ul>'
        + li('Every control (with flip cards), snapshots A / B / C, \u2605 stars, My palette, custom hex colours')
        + li('Copy full working file, Undo / Redo, full Settings (toolbar, rail order, manifest tools, backup)')
        + li('The VIP badge stage, flicks, flick-to-hide, dock glass; everything is saved')
        + '</ul><p class="help-h">Sandbox zoom (view only)</p><ul>' + zoomItems()
        + '</ul>' + (tier === plan ? '' : '<p class="note">Previewing ' + esc(TIER[tier].label) + ': UPGRADE steps back up.</p>')
        + '<button type="button" class="help-pro">Upgrade (coming soon)</button>';
    }
    function fill() {
      const pro = tier === 'pro' || !PRO_FEATURES.helpIcon;
      pop().innerHTML = pro ? proItems() + tierItems() : lowItems();
      pop().dataset.kind = pro ? 'pro' : 'basic';
      const sw = pop().querySelector('.help-pro');
      if (sw) sw.addEventListener('click', () => { hide(); upgrade(); });
    }
    // never cover the footer: the card scrolls inside if space is short
    function place() {
      const p = pop(), foot = $('cardFoot').getBoundingClientRect(), top = p.getBoundingClientRect().top;
      p.style.maxHeight = Math.max(120, Math.floor((foot.height ? foot.top : innerHeight - 16) - top - 8)) + 'px';
    }
    function show(pin) {
      clearTimeout(t);
      if (pin) stuck = true;
      if (open) return;
      open = true;
      fill();
      pop().hidden = false;
      btn().setAttribute('aria-expanded', 'true');
      place();
      if (M.level() === 'full') pop().animate([{ opacity: 0, transform: 'translateY(-4px) scale(0.98)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: M.easeOut });
    }
    function hide(focusBtn) {
      clearTimeout(t);
      if (!open) return;
      open = false; stuck = false;
      pop().hidden = true;
      btn().setAttribute('aria-expanded', 'false');
      if (focusBtn) { quiet = true; btn().focus({ preventScroll: true }); quiet = false; }
    }
    function init() {
      const b = btn(), p = pop();
      b.innerHTML = svg('help');
      b.addEventListener('mouseenter', () => { clearTimeout(t); if (!open) t = setTimeout(() => show(false), 160); });
      const leave = () => { clearTimeout(t); if (open && !stuck) t = setTimeout(() => hide(false), 260); };
      b.addEventListener('mouseleave', leave);
      p.addEventListener('mouseenter', () => clearTimeout(t));
      p.addEventListener('mouseleave', leave);
      b.addEventListener('click', () => { if (open && stuck) hide(false); else show(true); });
      b.addEventListener('focus', () => { if (!quiet && b.matches(':focus-visible')) show(false); });
      b.addEventListener('blur', () => { setTimeout(() => { if (open && !stuck && !p.contains(document.activeElement)) hide(false); }, 0); });
    }
    return { init, show, hide, fill, get isOpen() { return open; }, contains: (x) => !!x && !!btn() && (pop().contains(x) || btn().contains(x)) };
  })();

  function syncHeadTools() {
    const showMore = hasPro('sectionMenu');
    $('moreBtn').classList.toggle('is-hidden', !showMore);
    $('moreBtn').tabIndex = showMore ? 0 : -1;
    if (!showMore) Pop.hide();
    const showX = closeShown();
    $('dockClose').classList.toggle('is-hidden', !showX);
    $('dockClose').tabIndex = showX ? 0 : -1;
    $('dockClose').setAttribute('aria-hidden', showX ? 'false' : 'true');
    if (Help.isOpen) Help.fill();
  }

  function quickVar() {
    if (!caps().interaction) return null;   // Base: no Interaction section, no hover key
    const ia = tierVars().filter((v) => v.category === 'interact');
    return ia.find((v) => v.interaction === 'hover' && v.options) || ia.find((v) => v.interaction === 'hover') || null;
  }
  // Quick hover control (t577u): the SAME interaction icon as the slim rail, as an on/off key (dim = off, glowing =
  // on) plus a small dropdown arrow that jumps to the Interaction section. Off = the option that leaves the helix
  // running ('play' / Keep); on = the last non-off value (default 'pause'). Same var, same setValue persistence.
  // One builder serves the Pro home snapshot row and the Basic head row; syncQuick paints every copy.
  let quickOnVal = null;
  const quickOff = (v) => {
    if (!v.options) return false;
    const o = v.options.find((x) => ['play', 'off', 'none', false].includes(x.value));
    return o ? o.value : v.options[0].value;
  };
  const quickIsOn = (v) => (v.options ? !same(P[v.id], quickOff(v)) : !!P[v.id]);
  function quickToggle() {
    const v = quickVar();
    if (!v) return;
    if (!v.options) { setValue(v.id, !P[v.id]); return; }
    if (quickIsOn(v)) { quickOnVal = P[v.id]; setValue(v.id, quickOff(v)); }
    else {
      const fallback = !same(v.default, quickOff(v)) ? v.default : (v.options.find((o) => !same(o.value, quickOff(v))) || v.options[0]).value;
      setValue(v.id, quickOnVal != null && !same(quickOnVal, quickOff(v)) ? quickOnVal : fallback);
    }
  }
  function buildQuickCtl() {
    const wrap = el('span', 'quick-ctl');
    const key = el('button', 'quick-key', svg('interact'));
    key.type = 'button';
    key.addEventListener('click', () => {
      quickToggle();
      if (M.level() === 'full') key.animate([{ transform: 'scale(0.9)' }, { transform: 'none' }], { duration: 220, easing: M.springSoft });
    });
    const goB = el('button', 'quick-go', svg('chev'));
    goB.type = 'button';
    goB.setAttribute('aria-label', 'Open Interaction section');
    goB.title = 'Open the Interaction section';
    goB.addEventListener('click', () => { openDock('click'); go({ type: 'cat', cat: 'interact' }); });
    wrap.append(key, goB);
    return wrap;
  }
  function paintQuick(wrap, v) {
    const key = wrap.querySelector('.quick-key');
    if (!key) return;
    const on = quickIsOn(v), val = fmt(v, P[v.id]);
    key.classList.toggle('is-on', on);
    key.setAttribute('aria-pressed', on ? 'true' : 'false');
    key.setAttribute('aria-label', v.label + ' (' + val + ')' + (on ? ': on. Press to turn off.' : ': off. Press to turn on.'));
    key.title = v.label + ': ' + val + (on ? ' \u00b7 click to turn off' : ' \u00b7 click to turn on');
  }
  function syncQuick() {
    const row = $('quickRow');
    if (!row) return;
    const v = def ? quickVar() : null;
    row.hidden = !v;
    if (!v) { row.innerHTML = ''; row.dataset.id = ''; document.querySelectorAll('.quick-ctl').forEach((w) => w.remove()); return; }
    if (row.dataset.id !== v.id) { row.dataset.id = v.id; quickOnVal = null; row.innerHTML = ''; row.appendChild(buildQuickCtl()); }
    document.querySelectorAll('.quick-ctl').forEach((w) => paintQuick(w, v));
  }

  // ---------- wire controls.js module ----------
  const controlsMod = window.Lab.initControls({
    el, esc, svg, M, S, BASIC_CAP,
    getDef: () => def, getVars: () => vars, getById: () => byId, getP: () => P, getUi: () => ui,
    hasPro, same, fmt, decimals, setValue,
    swatchesFor, allPresets, presetDots, applyPreset,
    userPalette, featuredOverrides, store, toast, push, buildSeg, syncSeg,
    getTier: () => tier
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

  // Settings > Tier (dev): your plan (any tier, no licence check). Mid and Pro both have it; Base has no Settings
  // (use ?tier=, Alt+Shift+T, or UPGRADE while previewing).
  function tierDevSection(inner) {
    section(inner, 'Tier (dev)');
    const ts = el('div', 'seg seg-sm');
    ts.dataset.set = 'tier';
    buildSeg(ts, TIER_IDS.map((id) => ({ value: id, label: TIER[id].label })), plan, (val) => {
      setTier(val, { plan: true }).then(() => { if (caps().settings) go({ type: 'settings' }); });
    }, { equal: true });
    inner.appendChild(setRow('Tier', ts, 'A setting for now (no licence). Also ?tier=free|mid|pro in the URL or Alt+Shift+T. ' + TIER.pro.label + '\u2019s switch previews ' + TIER.free.label + ' for this tab; UPGRADE steps back up. ?reset = defaults (' + TIER.pro.label + ').'));
  }
  // Mid: the short Settings list. Saved: Dock state, Default state, Responsive. Zoom pad + margin tone: this page only.
  function buildMidSettings(inner) {
    section(inner, 'Dock');
    const pds = el('div', 'seg seg-sm');
    pds.dataset.pro = 'dock';
    buildSeg(pds, [{ value: 'full', label: 'Expanded' }, { value: 'slim', label: 'Slim rail' }], ui.proDock === 'slim' ? 'slim' : 'full', (val) => {
      ui.proDock = val; saveUi();
      Log.push('dock start ' + val);
      toast('Dock state on load: ' + (val === 'slim' ? 'the slim rail' : 'expanded (card + rail)') + '.');
    }, { equal: true });
    inner.appendChild(setRow('Dock state', pds, 'How ' + TIER.mid.label + ' opens: Expanded = card + rail, Slim rail = the icon rail (rest the cursor on it to expand). Saved.'));
    section(inner, 'Sections');
    const col = el('div', 'seg seg-sm');
    col.dataset.acc = 'collapse';
    buildSeg(col, COLLAPSE.filter((c) => c.id !== 'remember').map((c) => ({ value: c.id, label: c.label })), ui.accCollapse === 'first' ? 'first' : 'closed', (val) => Acc.setCollapse(val), { equal: true });
    inner.appendChild(setRow('Default state', col, 'All closed (default) or First open. Saved.'));
    const respRow = switchRow('Responsive: 1 open at a time', () => ui.accResponsive === true, (on) => Acc.setResponsive(on),
      'On: only the section you open stays open and moves to the top. Off: several can be open, in their normal order. Saved.');
    const rsw = respRow.querySelector('.switch');
    if (rsw) rsw.dataset.accResp = '1';
    inner.appendChild(respRow);
    section(inner, 'Viewport');
    inner.appendChild(switchRow('Show zoom controls', () => ui.zoomCtl !== false, (on) => { ui.zoomCtl = on; saveUi(); Zoom.sync(); },
      'The sandbox view zoom pad (top-centre of the screen). Screen only. This page only (not saved in ' + TIER.mid.label + ').'));
    const mts = el('div', 'seg seg-sm');
    buildSeg(mts, [{ value: 'deep', label: 'Deep' }, { value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }], ui.marginTone || 'dark', (val) => { ui.marginTone = val; saveUi(); applyLook(); }, { equal: true });
    inner.appendChild(setRow('Margin tone', mts, 'The flat border around the screen. This page only (not saved in ' + TIER.mid.label + ').'));
    inner.appendChild(el('p', 'note', TIER.pro.label + ' adds: dock position and anchor, the VIP badge, hover / glass / flick settings, toolbar settings, palettes, rail order, manifest tools and backup.'));
    tierDevSection(inner);
    return def.title;
  }

  function buildSettings(inner) {
    if (tier !== 'pro') return buildMidSettings(inner);
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

    if (proOn('dockStages')) {
      const pds = el('div', 'seg seg-sm');
      pds.dataset.pro = 'dock';
      buildSeg(pds, [
        { value: 'full', label: 'Expanded' },
        { value: 'slim', label: 'Slim rail' },
        { value: 'icon', label: 'VIP badge' }
      ], ui.proDock || 'full', (val) => {
        ui.proDock = val;
        saveUi();
        Log.push('dock start ' + val);
        toast('Dock state on load: ' + (val === 'icon' ? 'the VIP badge (collapsed)' : val === 'slim' ? 'the slim rail' : 'expanded (card + rail)') + '.');
      }, { equal: true });
      inner.appendChild(setRow('Dock state', pds, 'How Pro opens: Expanded = card + rail, Slim rail = the vertical icon rail, VIP badge = collapsed to the lanyard pass. The card\u2019s X only shows while Hover to expand slim rail is off; with VIP badge it folds the card straight to the badge.'));
    }
    if (proOn('dockHover')) {
      inner.appendChild(switchRow('Hover to expand slim rail', () => ui.dockHover !== false, (on) => { ui.dockHover = on; saveUi(); syncHeadTools(); Log.push('dock hover ' + (on ? 'on' : 'off')); },
        'Rest the cursor on the slim rail and it grows to the full card; move away and it folds back to the slim rail. It stays open while you hold or drag a control, type, or have a picker or menu open. Touch: tap the rail\u2019s empty space to expand, tap outside to fold. Never changes the saved Dock state.'));
    }
    if (proOn('dockStages')) {
      const gls = el('div', 'seg seg-sm');
      buildSeg(gls, [{ value: 'clear', label: 'Clear' }, { value: 'frosted', label: 'Frosted' }, { value: 'solid', label: 'Solid' }], ui.glass || 'frosted', (val) => { ui.glass = val; saveUi(); applyLook(); }, { equal: true });
      inner.appendChild(setRow('Dock glass', gls, 'The expanded dock\u2019s outer panel is liquid glass so the sandbox shows through (Clear = most see-through, Solid = the old near-opaque panel). The section cards inside always stay opaque. Look only: no control value changes.'));
    }
    if (proOn('dockHide')) {
      inner.appendChild(switchRow('Allow flick-to-hide', () => ui.dockFlickHide !== false, (on) => { ui.dockFlickHide = on; saveUi(); },
        'A strong flick of the pass away from the stage hides the dock until reload (never saved). ' + KEYS.dock.label + ' (or ' + KEYS.dock.alt + '), the edge handle, switching to Basic, or a reload brings it back.'));
    }

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
    inner.appendChild(switchRow('Show zoom controls', () => ui.zoomCtl !== false, (on) => { ui.zoomCtl = on; saveUi(); Zoom.sync(); },
      'View zoom for the sandbox (top-centre of the screen): \u2212 / readout / + / fit. Screen only: the component\u2019s values, export and URL never change. Keys + \u2212 0, Ctrl+wheel or pinch to zoom, drag empty space (or middle-drag) to pan. Remembered for this session; ?reset = 100%.'));
    const mts = el('div', 'seg seg-sm');
    buildSeg(mts, [{ value: 'deep', label: 'Deep' }, { value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }], ui.marginTone || 'dark', (val) => { ui.marginTone = val; saveUi(); applyLook(); }, { equal: true });
    inner.appendChild(setRow('Margin tone', mts, 'The flat border around the screen, where the toolbar and dock sit. The screen itself stays one solid colour with no dots or grid; its size never changes.'));

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
      inner.appendChild(el('p', 'note tb-gestures', 'Gestures on the toolbar: click opens/closes all groups · Shift+click or \u2190/\u2192 one group · drag & release calmly to drop at a custom spot · while CLOSED (nested), ANY flick sends it away (arcade exit to the rail) · while OPEN, flicks are ignored (a release just drops it). Way back: the rail toolbar pad puts it back top-left; with a hidden dock, the edge tab or ' + KEYS.dock.label + ' brings back the badge and the toolbar together.'));
      const tbs = el('div', 'seg seg-sm');
      tbs.dataset.tb = 'start';
      buildSeg(tbs, [{ value: 'closed', label: 'Closed' }, { value: 'open', label: 'Open' }, { value: 'remember', label: 'Remember' }], ui.tbStart, (val) => { ui.tbStart = val; saveUi(); Log.push('toolbar start ' + val); }, { equal: true });
      inner.appendChild(setRow('Start state', tbs, 'How the toolbar opens when the lab loads. Remember reopens the groups you had open.'));
      inner.appendChild(switchRow('Outside click closes it', () => ui.tbAutoClose, (on) => { ui.tbAutoClose = on; saveUi(); }));
      inner.appendChild(switchRow('Flick physics', () => ui.flick, (on) => { ui.flick = on; M.flickOn = on; saveUi(); fs.querySelectorAll('.seg-btn').forEach((b) => { b.disabled = !on; }); }, 'Any flick of the closed toolbar sends it away to the rail. An open toolbar ignores flicks. Off = flicks never send it away. The rail toolbar pad is click-only (two-stage: recall top-left, then OFF).'));
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
      inner.appendChild(setRow('Default state', col, 'How the sections open: All closed (default), First open, or Remember (reopens what you had open, per component).'));
      const respRow = switchRow('Responsive: 1 open at a time', () => ui.accResponsive === true, (on) => Acc.setResponsive(on),
        'Only the section you open stays open and moves to the top. Opening another or closing it puts every section back in order, closed. Also in the \u22ee menu.');
      const rsw = respRow.querySelector('.switch');
      if (rsw) rsw.dataset.accResp = '1';
      inner.appendChild(respRow);
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
        dockPos: 'right', anchor: 'top-right', proDock: 'full', motion: true, paletteSource: 'project',
        view: '1600x770', open: true, accCollapse: 'closed', accResponsive: false, accVariant: 'B',
        tbOut: true, tbStart: 'closed', tbAutoClose: true, tbLast: [], flick: true, flickStrength: 'normal', dockFlickHide: true,
        railOrder: [], railHidden: [], toolOrder: [], toolHidden: []
      });
      saveUi();
      M.enabled = true;
      M.flickOn = true;
      M.flickStrength = 'normal';
      document.documentElement.classList.remove('no-motion');
      TB.resetPos();
      TB.setOut(true);
      syncHeadTools();
      relayout();
      go({ type: 'settings' });
      toast('Reset lab layout and settings to defaults.');
    });
    inner.appendChild(resetUiBtn);

    tierDevSection(inner);
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
  // Basic ignores Pro's hidden rail actions, so the toolbar ON/OFF switch can never be lost there.
  const toolHidden = () => (hasPro('railCustomize') && Array.isArray(ui.toolHidden) ? ui.toolHidden : []);
  // Rail actions this tier has: + New = Pro, toolbar pad = Mid + Pro (Base has no toolbar)
  const railTools = () => orderedTools().filter((t) => !toolHidden().includes(t.id) && (t.id !== 'new' || caps().newComponent) && (t.id !== 'toolbar' || caps().toolbar));

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
      syncRailBtn();
      Log.push('toolbar reset to default corner');
    }
    // Stage 1 of the rail pad: a toolbar that was dragged somewhere glides back to the top-left corner.
    function goHome() {
      const b = bar(), r0 = b.getBoundingClientRect();
      customPos = null;
      applyCustomPos();
      const r1 = b.getBoundingClientRect();
      if (M.level() === 'full' && (r0.left !== r1.left || r0.top !== r1.top)) {
        b.animate([{ transform: 'translate(' + (r0.left - r1.left) + 'px,' + (r0.top - r1.top) + 'px)' }, { transform: 'none' }], { duration: 460, easing: M.springSoft });
      }
      syncRailBtn();
      Log.push('toolbar back to the top-left corner');
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
        ? 'Close toolbar (Esc) · drag to move (flicks are ignored while open)'
        : 'Open toolbar · Shift+click or \u2192 opens one group · drag to move · any flick sends it away (the rail pad or the edge tab brings it back)';
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
    // The rail's toolbar button is a two-stage ON/OFF pad (XDJ pad, LED lit when ON). ON = ui.tbOut.
    // Stage 1 (recall): ON but parked (flicked / thrown away, LED pulses) or dragged off its corner ->
    // a click puts it back in the top-left corner. Stage 2: ON and home -> a click turns it OFF.
    // OFF -> a click turns it ON (it flies out to the top-left). The edge tab / Alt+D also recall it.
    function syncRailBtn() {
      if (!railBtn) return;
      const on = ui.tbOut !== false, away = on && !shown, moved = on && shown && !!customPos;
      railBtn.classList.toggle('is-on', on);
      railBtn.classList.toggle('is-away', away);
      railBtn.classList.toggle('is-moved', moved);
      railBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      const txt = railBtn.querySelector('.tbsw-txt');
      if (txt) txt.textContent = on ? 'ON' : 'OFF';
      const label = !on ? 'Stage toolbar: OFF \u00b7 click to turn on (top-left)'
        : away ? 'Stage toolbar: ON (flicked away) \u00b7 click to put it back top-left'
        : moved ? 'Stage toolbar: ON (moved) \u00b7 click to put it back top-left, click again to turn off'
        : 'Stage toolbar: ON \u00b7 click to turn off';
      railBtn.setAttribute('aria-label', label);
      const tip = railBtn.querySelector('.rail-tip');
      if (tip) tip.textContent = label;
      syncHint();   // the edge tab's tooltip names the toolbar only while it is flicked away
    }
    // Where the toolbar nests: the rail pad when it is on screen, otherwise its own tab on the screen
    // edge (#tbHint, measured even before it slides in), otherwise the VIP badge.
    function homeRect() {
      if (railBtn && railBtn.isConnected && !dockHidden && (dockOpen || (dock && dock.dataset.state === 'slim'))) {
        const r = railBtn.getBoundingClientRect();
        if (r.width) return r;
      }
      const th = $('tbHint');
      if (th) {
        const was = th.hidden;
        if (was) { th.style.visibility = 'hidden'; th.hidden = false; }
        const r = th.getBoundingClientRect();
        if (was) { th.hidden = true; th.style.visibility = ''; }
        if (r.width) return r;
      }
      const r = $('dockTrigger').getBoundingClientRect();
      return r.width ? r : null;
    }
    function flyOut(from, power, v, closed) {
      unhideRailToolbar();
      if (ui.tbOut === false) { ui.tbOut = true; saveUi(); }   // bringing it out always switches it ON
      const n = closed ? 0 : power >= 2 ? Infinity : 1;
      if (shown) { openN(n); syncRailBtn(); return; }
      open.clear();
      customPos = null;   // a toolbar coming back (rail pad, edge tab, Alt+D, Settings) always lands top-left
      applyCustomPos();
      paint([], true);
      shown = true;
      bar().dataset.out = 'true';
      syncSettingsSwitch();
      syncRailBtn();
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

    // Two-stage pad: OFF -> ON (flies out top-left) · ON but flicked away -> back top-left ·
    // ON but dragged elsewhere -> glides back top-left · ON and home -> OFF (flies home to the rail).
    function railClick() {
      const from = railBtn ? railBtn.getBoundingClientRect() : null;
      if (!shown) { flyOut(from, 2, 0); return; }
      if (customPos) { goHome(); return; }
      ui.tbOut = false; saveUi();
      flyHome();
      syncRailBtn();
      Log.push('toolbar OFF');
    }
    // Recovery (the dock's edge tab, Alt+D from a hidden dock, mode switches): only when the switch is ON.
    // It lands in the top-left corner (flyOut clears any old drop position).
    function restore() {
      if (!caps().toolbar || ui.tbOut === false || shown) return false;
      flyOut(homeRect(), 0, 0, true);
      return true;
    }
    function railButton(b) {
      railBtn = b;
      syncRailBtn();
      const LIM = 22;
      // Flicks on the pad only count while the dock is nested at the VIP badge (stage 1). The pad lives on
      // the rail (stages 2 and 3), so in practice it is click-only there: no false flicks while you use the rail.
      M.Flick(b, {
        enabled: () => dockStage() === 1,
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
        onRelease({ power, dx, dy, vx, vy }) {
          b.classList.remove('is-held');
          b.style.transform = '';
          // An OPEN toolbar ignores flicks entirely (no throw-away, no flick open/close): a release just
          // drops it where you let go. While it is NESTED (closed into its icon), ANY flick, in any
          // direction and of any strength, sends it away (arcade exit to the rail). The way back: the rail
          // pad (puts it back top-left), the edge tab or Alt+D (with a hidden dock), or Settings > Toolbar.
          // Settings > Toolbar > Flick physics OFF is the only thing that turns this off.
          const flickable = M.flickOn && !isOpen();
          if (flickable && power >= 1) {
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
          syncRailBtn();
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
      if (caps().toolbar && ui.tbOut !== false && !shown) { shown = true; bar().dataset.out = 'true'; bar().getAnimations().forEach((a) => a.cancel()); syncRailBtn(); }
      if (shown) paint([], true);
    }
    return {
      init, start, refresh, toggle, step, openN, closeN, flyOut, flyHome, dismiss, setOut, railClick, restore, syncRailBtn,
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
  // Picker names come from components/index.json (generated by tools/check-components.py; P1). Until it
  // loads, or if it is missing, the folder id is shown (and _template keeps its fixed label).
  let indexNames = {};
  const pickLabel = (id) => indexNames[id] || (id === '_template' ? 'Blank template' : id);
  function loadIndexNames() {
    return fetchText('components/index.json').then((t) => {
      if (!t) return;
      let doc = null;
      try { doc = JSON.parse(t); } catch (e) { console.warn('[lab] components/index.json: ' + e.message); return; }
      indexNames = {};
      ((doc && doc.components) || []).forEach((c) => { if (c && c.id && c.name) indexNames[c.id] = c.name; });
      buildPicker();
      if (def) { $('tbPickName').textContent = pickLabel(def.id); $('tbPick').title = 'Component: ' + pickLabel(def.id); }
    }).catch(() => { /* fallback: ids */ });
  }
  function buildPicker() {
    const sel = $('labPicker');
    sel.innerHTML = '';
    (window.LAB_REGISTRY || []).forEach((id) => {
      const o = el('option', null, esc(pickLabel(id)));
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
    loadIndexNames();
    $('labPicker').addEventListener('change', (e) => loadComponent(e.target.value, false));
    TB.init();
    Zoom.build();
    $('viewSeg').classList.add('seg-xs');
    $('viewSeg').querySelectorAll('.seg-btn').forEach((b) => { const v = VIEWS.find((x) => x.id === b.dataset.value); if (v) { b.title = v.w ? v.w + ' \u00d7 ' + v.h + ' viewport' : 'Fit the frame to the free space'; b.setAttribute('aria-label', b.title); } });
    viewPill = buildSeg($('viewSeg'), VIEWS.map((x) => ({ value: x.id, label: x.w ? String(x.w) : x.label })), ui.view, (val) => setView(val));
    buildModeSw($('modeSeg'));
    if (window.Pass) Pass.mount($('dockTrigger')); else $('dockTrigger').innerHTML = svg('sliders');
    paintAvatar();
    if (window.Pass && Pass.onChange) Pass.onChange(paintAvatar);
    $('railAvatar').addEventListener('click', (e) => {
      if (hoverOpen && dockStage() === 3 && !e.shiftKey) {   // hover-opened card: click pins it open
        hoverOpen = false; pinned = true; clearTimeout(leaveTimer);
        ui.open = true; saveUi();
        syncAvatar();
        Log.push('dock kept open');
        return;
      }
      const to = avatarNext(e.shiftKey);
      setStage(to);
      if (to === 1) $('dockTrigger').focus({ preventScroll: true });
      else requestAnimationFrame(syncAvatar);
    });
    $('railAvatar').addEventListener('pointerenter', syncAvatar);
    $('railAvatar').addEventListener('focus', syncAvatar);
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
          const next = ['undoBtn', 'resetBtn', 'fullBtn'].map($).find((x) => x && !x.disabled && !x.classList.contains('is-tier-off'));
          if (next) next.focus({ preventScroll: true });
        });
      });
    });

    $('backBtn').addEventListener('click', back);
    $('moreBtn').innerHTML = svg('dots');
    Help.init();
    $('moreBtn').addEventListener('click', (e) => { e.stopPropagation(); Pop.toggle(); });
    $('dockClose').addEventListener('click', () => { closeDock(); if (dockStage() === 1) $('dockTrigger').focus({ preventScroll: true }); });
    $('labPlay').addEventListener('click', () => { playing = !playing; syncTime(); writeHash(); });
    $('labScrub').addEventListener('input', (e) => { playing = false; offset = +e.target.value; syncTime(); writeHash(); });
    document.documentElement.classList.toggle('no-motion', !ui.motion);

    // Lab-side capture guards for scan-sourced interaction controls (Item 2.3)
    const scaler = $('stageScaler');
    // scan-sourced hover: the component's own frame (its real box, scaled with the view zoom),
    // not the whole scaler / viewport box around it
    frameEl.addEventListener('pointerenter', (e) => {
      scanHovering = true;
      scanHoverTouch = e.pointerType === 'touch';
    });
    frameEl.addEventListener('pointerleave', () => {
      scanHovering = false;
      scanHoverTouch = false;
    });
    scaler.addEventListener('pointerdown', (e) => {
      if (!def) return;
      const curP = activeParams();
      if (e.pointerType === 'touch') {
        scanHoverTouch = true;
        const sTo = scanIx('touch');
        if (sTo && curP[sTo.id] === 'ignore') {
          e.stopImmediatePropagation();
          return;
        }
      }
      const sDr = scanIx('drag');
      if (sDr && (curP[sDr.id] === 'ignore' || curP[sDr.id] === false)) {
        e.stopImmediatePropagation();
      }
    }, true);
    scaler.addEventListener('pointermove', (e) => {
      if (!def) return;
      const curP = activeParams();
      const sTo = scanIx('touch'), sDr = scanIx('drag');
      if (e.pointerType === 'touch' && sTo && curP[sTo.id] === 'ignore') {
        e.stopImmediatePropagation();
        return;
      }
      if (e.buttons !== 0 && sDr && (curP[sDr.id] === 'ignore' || curP[sDr.id] === false)) {
        e.stopImmediatePropagation();
      }
    }, true);
    scaler.addEventListener('wheel', (e) => {
      if (!def) return;
      const curP = activeParams();
      const sWh = scanIx('wheel');
      if (sWh && !curP[sWh.id]) {
        e.stopImmediatePropagation();
      }
    }, { capture: true, passive: true });
    scaler.addEventListener('click', (e) => {
      if (!def) return;
      const curP = activeParams();
      const sCl = scanIx('click');
      if (sCl && !curP[sCl.id]) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }, true);
    frameEl.addEventListener('keydown', (e) => {
      if (!def) return;
      const curP = activeParams();
      const sKy = scanIx('key');
      if (sKy && !def.animated && sKy.control === 'switch' && !curP[sKy.id]) {
        e.stopImmediatePropagation();
        return;
      }
      if (e.key === ' ' && sKy && sKy.control === 'switch' && def.animated && curP[sKy.id]) {
        const tag = (e.target && e.target.tagName || '').toLowerCase();
        if (!['input', 'textarea', 'select', 'button'].includes(tag)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          scanKbdPause = !scanKbdPause;
        }
      }
    }, true);

    const trig = $('dockTrigger');
    trig.setAttribute('aria-label', 'All-access pass: open the controls (' + KEYS.dock.label + ')');
    // Stage 1, the lanyard pass. Hover: lift + holo sheen (pass.css). Click / Enter / Space: next
    // stage (Shift+click = the full card). Pro flicks (Settings > Toolbar > Flick physics):
    //   toward the stage: gentle = next stage, strong = full card
    //   STRONG away from the stage (toward the edge, up or down): hide for this session, when
    //   Settings > Dock > Allow flick-to-hide is on. Anything gentler springs back.
    trig.addEventListener('click', (e) => setStage(e.shiftKey ? 3 : dockStage() + 1));
    const DLIM = 26;
    M.Flick(trig, {
      axis: 'xy',
      enabled: () => proOn('dockFlick') && dockStage() === 1,
      onMove(dx, full, dy) { if (full) dock.style.transform = 'translate(' + M.rubber(dx, DLIM).toFixed(1) + 'px,' + M.rubber(dy, DLIM).toFixed(1) + 'px)'; },
      onRelease({ dir, power, axis, dx, dy, vx, vy }) {
        const [g, ax] = towardStage();
        const toward = axis === ax && dir === g;
        if (power >= 2 && !toward && proOn('dockHide') && ui.dockFlickHide !== false) { hideDock(vx || dx / 200, vy || dy / 200, 'flick'); return; }
        M.snapBack(dock, M.rubber(dx, DLIM), 'xy', M.rubber(dy, DLIM));
        if (power && toward) setStage(power >= 2 ? 3 : dockStage() + 1);
      }
    });
    // Pro: the dock's inner edge (stages 2 and 3) steps stages: click toggles rail / card,
    // flick toward the stage grows (strong = card), toward the edge shrinks (strong = the pass).
    const edgeH = el('button', 'dock-edge');
    edgeH.id = 'dockEdge';
    edgeH.type = 'button';
    edgeH.tabIndex = -1;
    edgeH.setAttribute('aria-hidden', 'true');
    edgeH.title = 'Drag or flick: toward the stage grows, toward the edge shrinks. Click toggles rail / card.';
    dock.appendChild(edgeH);
    edgeH.addEventListener('click', () => setStage(dockStage() === 3 ? 2 : 3));
    M.Flick(edgeH, {
      axis: 'x',
      enabled: () => proOn('dockFlick') && dockEdge() !== 'bottom',
      onMove(d, full) { if (full) dock.style.transform = 'translateX(' + M.rubber(d, 22).toFixed(1) + 'px)'; },
      onRelease({ d, dir, power }) {
        M.snapBack(dock, M.rubber(d, 22));
        if (!power) return;
        const [g] = towardStage();
        if (dir === g) setStage(power >= 2 ? 3 : dockStage() + 1);
        else setStage(power >= 2 ? 1 : dockStage() - 1);
      }
    });
    // the way back from a hidden dock: a small handle on that edge
    const hint = el('button', 'dock-hint glass', svg('handle'));
    hint.id = 'dockHint';
    hint.type = 'button';
    hint.hidden = true;
    hint.setAttribute('aria-label', 'Show the controls (' + KEYS.dock.label + ')');
    hint.title = 'Show the controls (' + KEYS.dock.label + ' or ' + KEYS.dock.alt + ')';
    document.body.appendChild(hint);
    hint.addEventListener('click', () => { showDock(); setStage(minStage()); trig.focus({ preventScroll: true }); });
    // the stage toolbar's nested tab (left edge): only while it is ON, flicked away, and no rail pad shows
    const tbHint = el('button', 'dock-hint tb-hint glass', svg('toolbar'));
    tbHint.id = 'tbHint';
    tbHint.type = 'button';
    tbHint.hidden = true;
    tbHint.title = 'Bring back the stage toolbar (top-left)';
    tbHint.setAttribute('aria-label', tbHint.title);
    document.body.appendChild(tbHint);
    tbHint.addEventListener('click', () => { if (TB.restore()) Log.push('toolbar back (its tab)'); });
    syncHint();
    // Slim rail hover (Pro, Settings > Dock > Hover to expand slim rail, default ON): rest the cursor on
    // the slim rail and it grows to the card; move away and it folds back to the slim rail. Small
    // enter / leave delays so it is not twitchy; it never folds while a control is held or dragged,
    // a text field / select has focus, or the colour arc, popover or help card is open. Never saved:
    // the Dock state setting stays what it was. Touch: tap the rail's empty space to expand
    // (a rail icon opens its page as usual); tap outside folds it back.
    const hoverOn = () => proOn('dockHover') && ui.dockHover !== false && !dockHidden;
    const HOVER_IN = 240, HOVER_OUT = 420;
    const dockBusy = () => {
      if (dockPress || Arc.isOpen || Pop.isOpen || Help.isOpen) return true;
      const a = document.activeElement;
      return !!(a && dock.contains(a) && (a.tagName === 'SELECT' || a.tagName === 'TEXTAREA' || a.isContentEditable || (a.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'color', 'button'].includes(a.type))));
    };
    function scheduleHoverFold(ms) {
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(function check() {
        if (!hoverOpen || overDock || dockHidden || dockState !== 'open') return;
        if (dockBusy()) { leaveTimer = setTimeout(check, 300); return; }
        setStage(2, { how: 'hover' });
        Log.push('dock hover \u2192 slim rail');
      }, ms);
    }
    dock.addEventListener('pointerenter', (e) => {
      overDock = true;
      clearTimeout(leaveTimer);
      clearTimeout(hoverTimer);
      if (e.pointerType === 'touch' || !hoverOn() || dockStage() !== 2) return;
      hoverTimer = setTimeout(() => {
        if (!overDock || dockPress || !hoverOn() || dockStage() !== 2) return;
        setStage(3, { how: 'hover' });
        Log.push('dock hover \u2192 card');
      }, HOVER_IN);
    });
    dock.addEventListener('pointerleave', (e) => {
      overDock = false;
      clearTimeout(hoverTimer);
      if (e.pointerType !== 'touch' && hoverOpen) scheduleHoverFold(HOVER_OUT);
    });
    dock.addEventListener('pointerdown', () => { dockPress = true; clearTimeout(hoverTimer); if (dockOpen && !hoverOpen) pinned = true; });
    const pressEnd = () => {
      if (!dockPress) return;
      dockPress = false;
      if (hoverOpen && !overDock) scheduleHoverFold(HOVER_OUT);   // let go of a drag outside the card
    };
    document.addEventListener('pointerup', pressEnd, true);
    document.addEventListener('pointercancel', pressEnd, true);
    dock.addEventListener('focusin', () => { if (dockOpen && !hoverOpen) pinned = true; });
    // tap / click on the slim rail's empty space expands it (touch has no hover)
    dock.addEventListener('click', (e) => {
      if (!hoverOn() || dockStage() !== 2 || e.target.closest('button, a, input, select, textarea, [role="button"], [role="switch"]')) return;
      setStage(3);
    });

    document.addEventListener('pointerdown', (e) => {
      const t = e.target;
      if (Arc.isOpen && !Arc.contains(t) && !t.closest('.swatch-trigger')) Arc.close();
      if (Pop.isOpen && !Pop.contains(t)) Pop.hide();
      TB.outside(t);
      if (Help.isOpen && !Help.contains(t)) Help.hide();
      // outside click: the card folds to the rail (one stage)
      if (!dockOpen || dock.contains(t) || Arc.contains(t) || Help.contains(t) || t.closest('#stageBar') || t.closest('#tbMenu') || t.closest('#toast') || t.closest('#labFrame') || t.closest('#dockHint') || t.closest('#tbHint') || Zoom.claims(t)) return;
      setStage(2, hoverOpen ? { how: 'hover' } : undefined);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (Help.isOpen) { Help.hide(true); return; }
        if (TB.esc()) return;
        if (Pop.isOpen) { Pop.hide(true); return; }
        if (Arc.isOpen) { Arc.close(false, true); return; }
        // one stage down (never below Basic's rail; never hides)
        if (!dockHidden && dockStage() > minStage()) {
          stepDock(-1);
          if (dockStage() === 1) trig.focus({ preventScroll: true });
          return;
        }
        TB.close();
        return;
      }
      {
        const a = document.activeElement;
        const texty = a && (a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable || (a.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'color', 'button'].includes(a.type)));
        // Alt+Shift+T (dev): cycle the tier plan Base -> Mid -> Pro -> Base
        if (!texty && e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyT') {
          e.preventDefault();
          setTier(TIER_IDS[(tierRank(plan) + 1) % TIER_IDS.length], { plan: true });
          return;
        }
        // Alt+D (or Shift+D): next stage, wrapping from the card back to the lowest stage;
        // from a hidden dock, back to the pass. Never while typing.
        if (!texty && (KEYS.dock.test(e) || KEYS.dockAlt.test(e))) {
          e.preventDefault();
          if (dockHidden) { showDock(); setStage(minStage()); trig.focus({ preventScroll: true }); }
          else setStage(dockStage() >= 3 ? minStage() : dockStage() + 1);
          return;
        }
      }
      if ((e.ctrlKey || e.metaKey) && !e.altKey && /^[zy]$/i.test(e.key)) {
        const a = document.activeElement;
        const texty = a && (a.tagName === 'TEXTAREA' || a.isContentEditable || (a.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'color', 'button'].includes(a.type)));
        if (dockOpen && !texty && def && caps().undo) {
          e.preventDefault();
          const redo = e.key.toLowerCase() === 'y' || e.shiftKey;
          if (!(redo ? Hist.redo() : Hist.undo())) announce(redo ? 'Nothing to redo' : 'Nothing to undo');
        }
        return;
      }
      if (Zoom.key(e)) return;   // sandbox view zoom: + / = / - / 0 (never Ctrl / Cmd: that stays the browser's page zoom)
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
        // the componentLab:v2:* keys were already cleared at the top (before the tier was read): default tier = Pro
        Object.assign(ui, {
          dockPos: 'right', anchor: 'top-right', proDock: 'full', motion: true, paletteSource: 'project',
          view: '1600x770', open: true, accCollapse: 'closed', accResponsive: false, accVariant: 'B',
          tbOut: true, tbStart: 'closed', tbAutoClose: true, tbLast: [], flick: true, flickStrength: 'normal', dockFlickHide: true, dockHover: true, zoomCtl: true,
          railOrder: [], railHidden: [], toolOrder: [], toolHidden: []
        });
        delete ui.marginTone; delete ui.glass; applyLook();   // screen look back to defaults (dark margin, frosted glass)
        Zoom.clear();   // view zoom back to 100%
        rawStore.set('uiVer', 7);   // fresh defaults already match the latest migrations; don't re-run them on the next load
        url.searchParams.delete('reset');
      }
      url.searchParams.delete('tier');   // ?tier= was applied (and saved) at the top
      history.replaceState(null, '', url.pathname + url.search + url.hash);
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
      syncDockTools();
      initDockState();   // Pro / Mid: Settings > Dock state · Base: always the expanded card
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
  window.__lab = { openDock, closeDock, setDockState, Dock: { setStage, stepDock, hideDock, showDock, get stage() { return dockStage(); }, get hidden() { return dockHidden; }, edge: dockEdge, PRO_FEATURES, KEYS }, go, push, back, setMode, setTier, upgrade, TIER, CAPS, get tier() { return tier; }, get plan() { return plan; }, startNew, get state() { return { dockState, dockOpen, pinned, mode, tier, plan, shown: tierVars().map((v) => v.id), navStack: navStack.slice(), ui: Object.assign({}, ui), id: def && def.id, P: Object.assign({}, P), offset, rate: rateNow, playing, scan: man && man.scan, railCats: railCats().map((c) => c.id), sections: visibleCats().map((c) => c.id) }; }, Help: { show: () => Help.show(), hide: () => Help.hide(), get isOpen() { return Help.isOpen; } }, Arc, TB, setView, layoutStage, setValue, workingFile, changesText, Log, Acc, Pop, Hist, resetAll, runSelfTest };
  init();
})();
