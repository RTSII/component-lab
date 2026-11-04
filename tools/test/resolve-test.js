#!/usr/bin/env node
// Resolver regression test (Node, no dependencies). Run from the component-lab folder:
//   node tools/test/resolve-test.js            # compare against tools/test/resolve-baseline.json
//   node tools/test/resolve-test.js --write    # (re)write the baseline (only on purpose, e.g. a new reviewed change)
// For helix and glow-button it resolves the manifest with lab/manifest.js, then builds the Pro section layout
// (groups in order + which cards flip onto which) the same way lab.js fillPro() does. helix must be
// byte-identical to the baseline; glow-button may differ only in the reviewed, intended paths listed in
// ALLOWED below. It also resolves components/_template once per kind in kinds.json (applyKindSpec) and fails
// on loader notes, duplicate ids, tier-budget overruns or a kind that does not round-trip, and checks that the
// JS applyKindSpec matches the Python apply_kind() in tools/check-components.py.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const LM = require(path.join(ROOT, 'lab', 'manifest.js'));
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const core = read('components/_core/core.json');
const BASELINE = path.join(__dirname, 'resolve-baseline.json');

// --- copy of lab.js autoGroup() (only used for vars with no group; core controls all carry one) ---
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
    case 'motion': return v.master === 'speed' || v.speedScaled || /SPEED|TEMPO|CYCLE|DUR|DIRECTION/.test(id) ? 'Timing' : 'Movement';
    default:
      if (/RADIUS|ROUND/.test(id)) return 'Radius';
      if (/PAD|GAP|MARGIN|TRAVEL|SPACE/.test(id)) return 'Spacing';
      if (/^N$|COUNT|W$|WIDTH|H$|HEIGHT|SIZE/.test(id)) return 'Size';
      return 'Shape';
  }
}
// --- the pre-blank-core (fda87c8) group order + flip pairing, kept here as the reference ---
function legacyGroups(list, order) {
  const sigFirst = (items) => items.filter((v) => v.signature).concat(items.filter((v) => !v.signature));
  const map = new Map();
  list.forEach((v) => { const g = v.group || autoGroup(v); if (!map.has(g)) map.set(g, []); map.get(g).push(v); });
  const gs = [...map.entries()].map(([name, items], i) => ({ name, items: sigFirst(items), i }));
  const rank = (g) => (g.items.some((v) => v.signature && !v.advanced) ? -1000 : 0) + (order.includes(g.name) ? order.indexOf(g.name) : 500 + g.i);
  return gs.sort((a, b) => rank(a) - rank(b));
}
function legacyPlan(groups) {
  const front = groups.filter((g) => g.items.some((v) => !v.advanced));
  const back = groups.filter((g) => g.items.every((v) => v.advanced));
  const pf = back.length === 1 ? front.findIndex((g) => g.items.every((v) => !v.advanced)) : -1;
  const out = [];
  front.forEach((g, i) => { if (i === pf) out.push({ type: 'flip', front: g, back: back[0] }); else out.push({ type: 'mini', group: g }); });
  const rem = pf >= 0 ? [] : back;
  for (let i = 0; i < rem.length; i += 2) {
    if (rem[i + 1]) out.push({ type: 'flip', front: rem[i], back: rem[i + 1] });
    else out.push({ type: 'mini', group: rem[i], inAdv: true });
  }
  return out;
}
// describe a plan the way the dock renders it (miniCard folds / own-Adv flips included)
function describe(plan) {
  const ids = (g) => g.items.map((v) => v.id + (v.advanced ? '*' : '')).join(',');
  return plan.map((p) => {
    if (p.type === 'flip') return 'FLIP ' + p.front.name + '(' + ids(p.front) + ') <-> ' + p.back.name + '(' + ids(p.back) + ')';
    const g = p.group;
    const more = p.inAdv ? [] : g.items.filter((v) => v.advanced);
    const fold = !p.inAdv && (g.name === 'Opacity' || (more.length === 1 && g.items.length <= 3 && g.items.every((v) => v.control === 'slider')));
    if (more.length && !fold) return 'FLIP ' + g.name + '(' + g.items.filter((v) => !v.advanced).map((v) => v.id).join(',') + ') <-> ' + g.name + ' \u00b7 Adv(' + more.map((v) => v.id + '*').join(',') + ')';
    return 'CARD ' + g.name + '(' + ids(g) + ')';
  });
}
const hasNew = typeof LM.orderGroups === 'function' && typeof LM.flipPlan === 'function';
function layoutOf(r, useLegacy) {
  const out = {};
  const cats = [];
  r.vars.forEach((v) => { if (!cats.includes(v.category)) cats.push(v.category); });
  cats.forEach((cat) => {
    const list = r.vars.filter((v) => v.category === cat);
    const order = (r.groups && r.groups[cat]) || [];
    const groups = useLegacy || !hasNew ? legacyGroups(list, order) : LM.orderGroups(list, order, autoGroup);
    const plan = useLegacy || !hasNew ? legacyPlan(groups) : LM.flipPlan(groups, cat, r.flipPairs);
    out[cat] = { groups: groups.map((g) => g.name), cards: describe(plan) };
  });
  return out;
}
function snapshot(id, useLegacy) {
  const r = LM.resolve(read('components/' + id + '/manifest.json'), core);
  const tiers = { free: 0, mid: 0, pro: r.vars.length };
  r.vars.forEach((v) => { if (v.tier === 'ga') tiers.free++; if (v.tier !== 'pro') tiers.mid++; });
  return { resolved: r, counts: tiers, layout: layoutOf(r, useLegacy) };
}
// diff two JSON values -> list of 'path' strings
function diff(a, b, p, out) {
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    new Set(Object.keys(a).concat(Object.keys(b))).forEach((k) => diff(a[k], b[k], p + '.' + k, out));
  } else if (Array.isArray(a) && Array.isArray(b) && a.length === b.length && !p.endsWith('.cards') && !p.endsWith('.groups')) {
    a.forEach((x, i) => diff(x, b[i], p + '[' + (x && x.id ? x.id : i) + ']', out));
  } else out.push(p);
  return out;
}

const COMPONENTS = ['helix', 'glow-button'];
// glow-button paths that are allowed to change (each one is a reviewed, intended change; see CHANGELOG-blank-core.md)
const ALLOWED = [
  /^glow-button\.resolved\.vars\[(WEIGHT|TRACKING)\]\.advanced$/,                        // S4: Style on the Type flip back
  /^glow-button\.resolved\.vars\[(COLOR_BORDER|COLOR_FILL)\]\.group$/,                   // S10: colour group named "Button"
  /^glow-button\.resolved\.groups\.color(\[\d+\])?$/,
  /^glow-button\.resolved\.source\.(core\.override\.(COLOR_BORDER|COLOR_FILL)\.group|groups)$/,
  /^glow-button\.resolved\.vars\[BTN_[A-Z_]+\]\.componentGroup$/,                        // S11: component-section flag
  /^glow-button\.layout\.(type|surface|color|layout)\.(cards|groups)$/                   // the visible effect of the three above
];

function fail(msg) { console.log('FAIL ' + msg); process.exitCode = 1; }

if (process.argv.includes('--write')) {
  const base = {};
  COMPONENTS.forEach((id) => { base[id] = snapshot(id, true); });
  fs.writeFileSync(BASELINE, JSON.stringify(base, null, 1) + '\n');
  console.log('wrote ' + path.relative(ROOT, BASELINE) + ' (legacy layout rules)');
  process.exit(0);
}

const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
COMPONENTS.forEach((id) => {
  const now = snapshot(id, false);
  const d = diff(base[id], now, id, []);
  if (id === 'helix') {
    if (d.length) fail('helix changed: ' + d.join(', '));
    else console.log('ok   helix: resolved output + Pro layout byte-identical to baseline (' + now.counts.free + '/' + now.counts.mid + '/' + now.counts.pro + ')');
  } else {
    const bad = d.filter((p) => !ALLOWED.some((re) => re.test(p)));
    if (bad.length) fail(id + ' changed outside the allowed paths: ' + bad.join(', '));
    else console.log('ok   ' + id + ': ' + (d.length ? d.length + ' intended change(s) only' : 'byte-identical to baseline') + ' (' + now.counts.free + '/' + now.counts.mid + '/' + now.counts.pro + ')');
    if (process.argv.includes('-v')) Object.keys(now.layout).forEach((c) => console.log('       ' + c + ': ' + now.layout[c].cards.join(' | ')));
  }
});

// every kind on the blank template
if (typeof LM.applyKindSpec === 'function') {
  const tpl = read('components/_template/manifest.json');
  const kinds = read('components/_template/kinds.json').kinds;
  let py = null;
  try {
    py = JSON.parse(execFileSync(process.env.PYTHON || 'python3', [path.join(ROOT, 'tools', 'check-components.py'), '--kinds-json'], { encoding: 'utf8' }));
  } catch (e) {
    try { py = JSON.parse(execFileSync('python', [path.join(ROOT, 'tools', 'check-components.py'), '--kinds-json'], { encoding: 'utf8' })); } catch (_) { console.log('skip Python apply_kind parity (python not found)'); }
  }
  const bud = core.budget || {};
  Object.keys(kinds).forEach((k) => {
    const m = LM.applyKindSpec(tpl, k, kinds[k], core);
    const r = LM.resolve(m, core);
    const ids = r.vars.map((v) => v.id);
    const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    const nf = r.vars.filter((v) => v.tier === 'ga').length, nm = r.vars.filter((v) => v.tier !== 'pro').length;
    const errs = [];
    if (r.kind !== k) errs.push('kind is ' + r.kind);
    if (r.loaderNotes) errs.push('notes: ' + r.loaderNotes.join('; '));
    if (dup.length) errs.push('duplicate ids ' + dup.join(','));
    if (bud.free && nf > bud.free) errs.push('Free ' + nf + ' > ' + bud.free);
    if (bud.mid && nm > bud.mid) errs.push('Free+Mid ' + nm + ' > ' + bud.mid);
    if (py && JSON.stringify(py[k]) !== JSON.stringify(m)) errs.push('JS applyKindSpec differs from Python apply_kind');
    if (errs.length) fail('kind ' + k + ': ' + errs.join(' | '));
    else console.log('ok   kind ' + k.padEnd(20) + nf + '/' + nm + '/' + r.vars.length + '  colour group: ' + (r.vars.find((v) => v.id === 'COLOR_FILL') || {}).group);
  });
} else console.log('skip kinds (LabManifest.applyKindSpec not present yet)');
if (!process.exitCode) console.log('resolve-test: all checks passed');
