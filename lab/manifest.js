// Component Lab manifest loader (schema 3). Turns a schema-3 manifest (meta + "inherits": "core@1" + core
// hide / opt / override / freePicks + extras + aliases) into the flat control list the lab renders (the same
// shape schema-2 "vars" always had), so the rest of the lab never needs to know which component it is.
// Schema-2 manifests pass through unchanged. Pure functions: also loads in Node for tools/tests.
(function (root) {
  'use strict';

  const TIER_MAP = { free: 'ga', mid: 'vip', pro: 'pro', ga: 'ga', vip: 'vip' };
  const TIER_RANK = { ga: 0, vip: 1, pro: 2 };
  // widget (manifest field) -> the lab's renderer (control + variant). An explicit control / variant wins.
  const WIDGET = {
    swatches: { control: 'swatch-role' },
    'seg-pads': { control: 'segmented' },
    pad: { control: 'switch', variant: 'pad' },
    switch: { control: 'switch' },
    'h-slider': { control: 'slider' },
    knob: { control: 'radial' },
    'v-fader': { control: 'fader', variant: 'channel' },
    'fx-unit': { control: 'slider', variant: 'fx' },
    'tempo-deck': { control: 'slider' },
    select: { control: 'select' },
    'select-compact': { control: 'select', variant: 'compact' }
  };
  const DEFAULT_WHITELIST = ['label', 'short', 'min', 'max', 'step', 'default', 'unit', 'options', 'css', 'tier', 'group', 'section',
    'widget', 'variant', 'deckLabel', 'pair', 'padTitle', 'padSub', 'role', 'hint', 'where', 'note', 'featured', 'advanced',
    'signature', 'master', 'timeRole', 'interaction', 'cssMap', 'alpha', 'bind'];
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // lab var -> widget name (used by the scaffold / checker and for schema-2 vars)
  function widgetOf(v) {
    if (v.widget) return v.widget;
    if (v.control === 'swatch-role') return 'swatches';
    if (v.control === 'segmented') return 'seg-pads';
    if (v.control === 'switch') return v.variant === 'pad' ? 'pad' : 'switch';
    if (v.control === 'radial') return 'knob';
    if (v.control === 'fader') return 'v-fader';
    if (v.control === 'select') return v.variant === 'compact' ? 'select-compact' : 'select';
    if (v.control === 'slider') return v.variant === 'fx' ? 'fx-unit' : v.master === 'speed' ? 'tempo-deck' : 'h-slider';
    return v.control || 'h-slider';
  }

  // one schema-3 control -> one lab var
  function toVar(src, mode) {
    const v = clone(src);
    if (v.modes) {
      const md = v.modes[mode] || v.modes.rate || Object.values(v.modes)[0];
      if (md) { if (md.options && v.options === undefined) v.options = clone(md.options); if (v.default === undefined) v.default = md.default; }
      delete v.modes;
    }
    if (v.section !== undefined) { v.category = v.section === 'component' ? 'layout' : v.section; delete v.section; }
    if (v.tier !== undefined) v.tier = TIER_MAP[v.tier] || v.tier;
    const w = v.widget && WIDGET[v.widget];
    if (w) {
      if (!v.control) v.control = w.control;
      if (w.variant && v.variant === undefined) v.variant = w.variant;
    }
    delete v.optional;
    return v;
  }

  // Apply a whitelisted override; a null value removes the key (so a component can drop a core unit / short).
  function applyOverride(v, ov, whitelist, notes, id) {
    Object.keys(ov || {}).forEach((k) => {
      if (!whitelist.includes(k)) { notes.push(id + ': override "' + k + '" ignored (not in the core whitelist)'); return; }
      if (ov[k] === null) delete v[k];
      else v[k] = clone(ov[k]);
    });
  }

  function resolve(m, core) {
    if (!m || m.schema !== 3) return m;
    core = core || { controls: [], optional: [] };
    const notes = [];
    const meta = m.meta || {};
    const c = m.core || {};
    const mode = (c.interaction && c.interaction.mode) || (m.animated ? 'rate' : 'fx');
    const hide = new Set(c.hide || []);
    const opt = c.opt || [];
    const ov = c.override || {};
    const whitelist = core.overrideWhitelist || DEFAULT_WHITELIST;
    const coreIds = new Set((core.controls || []).concat(core.optional || []).map((x) => x.id));
    const vars = [];
    const pushCore = (cc) => {
      const raw = Object.assign({}, cc);
      const v = toVar(raw, mode);
      v.core = cc.id;
      v.widget = cc.widget;
      if (ov[cc.id]) {
        const o = ov[cc.id];
        if (o.section !== undefined) { v.category = o.section; }
        const rest = Object.assign({}, o); delete rest.section;
        if (rest.tier !== undefined) rest.tier = TIER_MAP[rest.tier] || rest.tier;
        if (rest.widget && WIDGET[rest.widget]) {
          const w = WIDGET[rest.widget];
          v.control = w.control;
          if (rest.variant === undefined) { if (w.variant) v.variant = w.variant; else delete v.variant; }
        }
        applyOverride(v, rest, whitelist, notes, cc.id);
      }
      vars.push(v);
    };
    (core.controls || []).forEach((cc) => { if (!hide.has(cc.id)) pushCore(cc); });
    (core.optional || []).forEach((cc) => { if (opt.includes(cc.id) && !hide.has(cc.id)) pushCore(cc); });
    Object.keys(ov).forEach((id) => { if (!coreIds.has(id)) notes.push('override for unknown core control ' + id + ' ignored'); });
    (m.extras || []).forEach((e) => {
      if (coreIds.has(e.id)) notes.push('extra ' + e.id + ' reuses a reserved core id; skipped');
      else vars.push(toVar(e, mode));
    });
    // Free = the 4 core colours + 2 picks; Free controls are never on a flip-card back (Pro never hides what Free shows)
    const picks = c.freePicks || core.defaultFreePicks || [];
    vars.forEach((v) => {
      if (picks.includes(v.id)) v.tier = 'ga';
      if (v.tier === 'ga') v.advanced = false;
      if (!v.widget) v.widget = widgetOf(v);
    });
    // Step B renames: old id -> new id. Each renamed control remembers its old id for one release of exports.
    const aliases = m.aliases || {};
    const was = {};
    Object.keys(aliases).forEach((old) => { was[aliases[old]] = old; });
    vars.forEach((v) => { if (was[v.id]) v.was = was[v.id]; v._featured0 = !!v.featured; });
    // order: explicit "order" list first (a component keeps its own card order), the rest after, as listed
    let list = vars;
    if (Array.isArray(m.order) && m.order.length) {
      const idx = (v) => { const i = m.order.indexOf(v.id); return i < 0 ? 1e6 + vars.indexOf(v) : i; };
      list = vars.slice().sort((a, b) => idx(a) - idx(b));
    }
    // inside each section + group: Free first, then Mid, then Pro (stable; the slots the group uses stay put)
    const buckets = new Map();
    list.forEach((v, i) => { const k = (v.category || '') + '\u0000' + (v.group || ''); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(i); });
    const sorted = list.slice();
    buckets.forEach((slots) => {
      const items = slots.map((i) => list[i]);
      const rank = (v) => (v.tier in TIER_RANK ? TIER_RANK[v.tier] : 1);
      const ord = items.map((v, i) => ({ v, i })).sort((a, b) => rank(a.v) - rank(b.v) || a.i - b.i).map((x) => x.v);
      slots.forEach((s, j) => { sorted[s] = ord[j]; });
    });
    list = sorted;
    // the clock: role flags replace manifest.time { cycle, speed, direction }
    const find = (fn) => { const v = list.find(fn); return v ? v.id : null; };
    const time = m.time || {
      cycle: find((v) => v.timeRole === 'cycle'),
      speed: find((v) => v.master === 'speed'),
      direction: find((v) => v.timeRole === 'direction')
    };
    const groups = Object.assign({}, core.groups || {}, m.groups || {});
    const out = {
      schema: 3,
      meta: clone(meta),
      kind: meta.kind || m.kind || 'card',
      title: meta.name || m.title,
      paletteFrom: m.paletteFrom,
      frames: m.frames,
      animated: m.animated,
      time,
      groups,
      deckGroups: (m.layout && m.layout.deck) || [],
      padGroups: (m.layout && m.layout.pads) || [],
      aliases: clone(aliases),
      vars: list,
      source: clone(m)
    };
    if (!out.paletteFrom) delete out.paletteFrom;
    if (!out.frames) delete out.frames;
    if (notes.length) out.loaderNotes = notes;
    return out;
  }

  // Old ids -> new ids inside a { ID: value } object. Returns { obj, changed }. Idempotent: a new id that is
  // already present wins over the old one.
  function renameKeys(obj, aliases) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { obj, changed: false };
    let changed = false;
    const out = {};
    Object.keys(obj).forEach((k) => {
      const nk = aliases[k];
      if (nk) { changed = true; if (!(nk in obj)) out[nk] = obj[k]; }
      else out[k] = obj[k];
    });
    return { obj: changed ? out : obj, changed };
  }

  // Save to disk for schema 3: the source manifest, with any star (featured) changes written back.
  function sourceForSave(man) {
    const src = clone(man.source);
    (man.vars || []).forEach((v) => {
      if (!!v.featured === !!v._featured0) return;
      if (v.core) {
        src.core = src.core || {};
        src.core.override = src.core.override || {};
        src.core.override[v.id] = Object.assign(src.core.override[v.id] || {}, { featured: !!v.featured });
      } else {
        const e = (src.extras || []).find((x) => x.id === v.id);
        if (e) e.featured = !!v.featured;
      }
    });
    return src;
  }

  const api = { resolve, renameKeys, sourceForSave, widgetOf, WIDGET, TIER_MAP };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LabManifest = api;
})(typeof window !== 'undefined' ? window : globalThis);
