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
    // section "component" = the component's own controls: shown in Layout, ranked first there (componentGroup)
    if (v.section !== undefined) { if (v.section === 'component') v.componentGroup = true; v.category = v.section === 'component' || v.section === 'type' ? 'layout' : v.section; delete v.section; }
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
        if (o.section !== undefined) { v.category = o.section === 'type' ? 'layout' : o.section; }
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

  // ---------- kinds (components/_template/kinds.json) ----------
  // The blank template set up as one kind. JS twin of tools/check-components.py apply_kind() (the two must
  // stay in step; tools/test/resolve-test.js compares them for every kind). Pure: returns a new manifest.
  // kindId is passed explicitly because kinds.json entries are keyed by id and carry no "id" field.
  const BODY_COLOURS = ['COLOR_BORDER', 'COLOR_FILL', 'COLOR_FILL_2'];
  function applyKindSpec(m, kindId, spec, core) {
    const man = clone(m);
    spec = spec || {};
    core = core || { controls: [], optional: [] };
    man.meta = man.meta || {};
    man.meta.kind = kindId;
    if (spec.frames && Object.keys(spec.frames).length) man.frames = clone(spec.frames);
    const c = man.core = man.core || {};
    if (Array.isArray(spec.opt)) c.opt = spec.opt.slice();
    if (Array.isArray(spec.freePicks)) c.freePicks = spec.freePicks.slice();
    const baseIds = (core.controls || []).map((x) => x.id);
    const picks = c.freePicks || [];
    c.hide = (spec.hide || []).filter((h) => baseIds.includes(h) && !picks.includes(h));
    const resolvedIds = baseIds.filter((i) => !c.hide.includes(i)).concat((c.opt || []).filter((i) => !baseIds.includes(i)));
    const ov = {};
    const featured = new Set(spec.featured || []);
    resolvedIds.forEach((id) => { if (featured.has(id)) (ov[id] = ov[id] || {}).featured = true; });
    Object.keys(spec.defaults || {}).forEach((id) => { (ov[id] = ov[id] || {}).default = clone(spec.defaults[id]); });
    const cg = spec.colorGroup;
    const coreBody = ((core.groups && core.groups.color) || ['Card'])[0];
    if (typeof cg === 'string' && cg && cg !== coreBody) {
      BODY_COLOURS.forEach((id) => { if (resolvedIds.includes(id)) (ov[id] = ov[id] || {}).group = cg; });
      const order = ((man.groups && man.groups.color) || (core.groups && core.groups.color) || []).slice();
      man.groups = man.groups || {};
      man.groups.color = [cg].concat(order.filter((g) => g !== coreBody && g !== cg));
    }
    Object.keys(c.override || {}).forEach((id) => {
      const rest = Object.assign({}, c.override[id] || {});
      delete rest.featured;
      if (!Object.keys(rest).length) return;
      ov[id] = id in ov ? Object.assign(rest, ov[id]) : rest;
    });
    c.override = ov;
    return man;
  }

  // ---------- Pro section layout (pure; lab.js groupsFor() / fillPro() and tools/test use these) ----------
  // Groups of one section in display order: component-section groups first (componentGroup flag), then groups
  // with a front-face signature control, then the manifest / core order list, then the rest as they appear.
  function orderGroups(list, order, autoGroup) {
    order = order || [];
    const sigFirst = (items) => items.filter((v) => v.signature).concat(items.filter((v) => !v.signature));
    const map = new Map();
    list.forEach((v) => { const g = v.group || (autoGroup ? autoGroup(v) : 'Other'); if (!map.has(g)) map.set(g, []); map.get(g).push(v); });
    const gs = [...map.entries()].map(([name, items], i) => ({ name, items: sigFirst(items), i }));
    const rank = (g) => (g.items.some((v) => v.componentGroup) ? -2000 : 0) + (g.items.some((v) => v.signature && !v.advanced) ? -1000 : 0) +
      (order.includes(g.name) ? order.indexOf(g.name) : 500 + g.i);
    return gs.sort((a, b) => rank(a) - rank(b));
  }
  // Which all-advanced ("back") group flips onto which all-front group, per section. Keyed by section because
  // group names repeat across sections (Size in Layout and helix extras, Glow in Color and Surface). A manifest can add
  // or replace pairs with "flipPairs": { "<section>": { "<front group>": "<back group>" } }.
  const FLIP_PAIRS = {
    surface: { Shape: 'Effects' },
    interact: { Pointer: 'Touch & keys' },
    motion: { Loop: 'Depth' }
  };
  // Card plan for one Pro section: [{ type: 'flip', front, back } | { type: 'mini', group, inAdv }].
  // 1) explicit pairs for this section (a front group with no advanced items of its own + a back group);
  // 2) if none matched, the original rule: a single back group flips onto the first all-front group;
  // 3) any backs left pair two by two (e.g. Text fade <-> Shell dim); a lone leftover is an Advanced card.
  function flipPlan(groups, cat, pairs) {
    const map = Object.assign({}, FLIP_PAIRS[cat] || {}, (pairs && pairs[cat]) || {});
    const allFront = (g) => g.items.every((v) => !v.advanced);
    const front = groups.filter((g) => g.items.some((v) => !v.advanced));
    let back = groups.filter((g) => g.items.every((v) => v.advanced));
    const partner = new Map();
    Object.keys(map).forEach((fn) => {
      const f = front.find((g) => g.name === fn && allFront(g) && !partner.has(g));
      const b = back.find((g) => g.name === map[fn]);
      if (f && b) { partner.set(f, b); back = back.filter((x) => x !== b); }
    });
    if (!partner.size && back.length === 1) {
      const f = front.find(allFront);
      if (f) { partner.set(f, back[0]); back = []; }
    }
    const out = front.map((g) => (partner.has(g) ? { type: 'flip', front: g, back: partner.get(g) } : { type: 'mini', group: g }));
    for (let i = 0; i < back.length; i += 2) {
      if (back[i + 1]) out.push({ type: 'flip', front: back[i], back: back[i + 1] });
      else out.push({ type: 'mini', group: back[i], inAdv: true });
    }
    return out;
  }

  const api = { resolve, renameKeys, sourceForSave, widgetOf, applyKindSpec, orderGroups, flipPlan, FLIP_PAIRS, WIDGET, TIER_MAP };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LabManifest = api;
})(typeof window !== 'undefined' ? window : globalThis);
