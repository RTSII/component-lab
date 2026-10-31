// Component Lab auto-scan. Given a component's CSS / markup / JS it proposes a control manifest:
// CSS custom properties, colour literals, opacity values, animation/transition durations and
// UPPER_CASE numeric constants, each auto-categorised (color | surface | type | motion | rate | layout),
// plus a guessed component kind and "featured" picks per kind template. Also builds palettes.
(function () {
  'use strict';

  const COLOR_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
  const ctx = document.createElement('canvas').getContext('2d');

  // ---------- colour helpers ----------
  function parse(c) {
    if (!c) return null;
    ctx.fillStyle = '#010203';
    ctx.fillStyle = String(c).trim();
    const v = ctx.fillStyle;
    if (v === '#010203' && !/^#010203$/i.test(String(c).trim())) return null;
    if (v[0] === '#') {
      return {
        r: parseInt(v.slice(1, 3), 16),
        g: parseInt(v.slice(3, 5), 16),
        b: parseInt(v.slice(5, 7), 16),
        a: v.length === 9 ? +(parseInt(v.slice(7, 9), 16) / 255).toFixed(3) : 1
      };
    }
    const m = v.match(/[\d.]+/g);
    return m ? { r: +m[0], g: +m[1], b: +m[2], a: m[3] !== undefined ? +m[3] : 1 } : null;
  }
  const hx = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  function hex(c) { const p = typeof c === 'string' ? parse(c) : c; return p ? '#' + hx(p.r) + hx(p.g) + hx(p.b) : null; }
  const alphaOf = (c) => { const p = typeof c === 'string' ? parse(c) : c; return p ? +(p.a != null ? p.a : 1).toFixed(3) : 1; };
  function hsl(c) {
    const p = parse(c); if (!p) return { h: 0, s: 0, l: 0 };
    const r = p.r / 255, g = p.g / 255, b = p.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return { h, s, l };
  }
  function mix(a, b, t) { const p = parse(a), q = parse(b); return hex({ r: p.r + (q.r - p.r) * t, g: p.g + (q.g - p.g) * t, b: p.b + (q.b - p.b) * t }); }
  function dist(a, b) { const p = parse(a), q = parse(b); return Math.hypot(p.r - q.r, p.g - q.g, p.b - q.b); }
  function hueName(h, s, l) {
    if (s < 0.18) return l > 0.6 ? 'Ice' : 'Mono';
    const names = [[15, 'Red'], [45, 'Amber'], [70, 'Yellow'], [160, 'Green'], [200, 'Cyan'], [250, 'Blue'], [295, 'Violet'], [335, 'Pink'], [361, 'Red']];
    return names.find(([max]) => h < max)[1];
  }

  // ---------- CSS parsing (flat; good enough for component CSS) ----------
  function rules(css) {
    const out = [];
    const text = String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(text))) {
      const sel = m[1].trim().replace(/^.*@[^{]*$/, '').trim();
      if (!sel || /^(\d+(\.\d+)?%|from|to)(\s*,\s*(\d+(\.\d+)?%|from|to))*$/.test(sel)) continue;
      const decls = [];
      m[2].split(';').forEach((d) => {
        const i = d.indexOf(':');
        if (i < 0) return;
        decls.push({ prop: d.slice(0, i).trim().toLowerCase(), value: d.slice(i + 1).trim() });
      });
      out.push({ sel, decls });
    }
    return out;
  }

  // Palette: colour custom properties first (in file order), then literals; near-duplicates merged.
  function palette(cssTexts, max) {
    const found = [];
    (cssTexts || []).forEach((t) => {
      rules(t).forEach((r) => r.decls.forEach((d) => {
        if (d.prop.startsWith('--')) { const c = d.value.match(COLOR_RE); if (c && c[0] === d.value.trim()) found.push({ c: hex(c[0]), w: 0 }); }
      }));
    });
    (cssTexts || []).forEach((t) => {
      rules(t).forEach((r) => r.decls.forEach((d) => {
        if (d.prop.startsWith('--')) return;
        (d.value.match(COLOR_RE) || []).forEach((c) => found.push({ c: hex(c), w: 1 }));
      }));
    });
    const out = [];
    found.forEach(({ c }) => { if (c && !out.some((o) => dist(o, c) < 18)) out.push(c); });
    return out.slice(0, max || 16);
  }

  // Rank palette colours for a colour role (best first).
  function rankFor(role, pal) {
    const score = (c) => {
      const { s, l } = hsl(c);
      switch (role) {
        case 'surface': case 'surface2': return (1 - l) * 2 + (l < 0.25 ? 1 : 0) + s * 0.2;
        case 'text': return l * 2 + (l > 0.75 ? 1 : 0) - s * 0.3;
        case 'muted': return 1 - Math.abs(l - 0.68) * 2 - Math.abs(s - 0.35);
        case 'danger': { const h = hsl(c).h; return (h > 330 || h < 15 ? 2 : 0) + s; }
        default: return s * 2 - Math.abs(l - 0.52) * 2 + (l > 0.2 && l < 0.85 ? 0.5 : 0);
      }
    };
    return pal.slice().sort((a, b) => score(b) - score(a));
  }

  // Whole-palette presets: one per vivid hue in the palette, plus Mono. Each maps roles -> colours.
  function presets(pal) {
    const vivid = [];
    pal.forEach((c) => {
      const p = hsl(c);
      if (p.s > 0.55 && p.l > 0.3 && p.l < 0.75 && !vivid.some((v) => Math.min(Math.abs(hsl(v).h - p.h), 360 - Math.abs(hsl(v).h - p.h)) < 22)) vivid.push(c);
    });
    const danger = rankFor('danger', pal)[0] || '#ff3860';
    const out = vivid.slice(0, 5).map((c) => {
      const p = hsl(c);
      return {
        id: 'p-' + c.slice(1), name: hueName(p.h, p.s, p.l),
        colors: { accent: c, border: c, glow: c, text: mix(c, '#ffffff', 0.78), muted: mix(c, '#8a93a0', 0.55),
          surface: mix(c, '#000000', 0.8), surface2: mix(c, '#000000', 0.93), danger: dist(danger, c) < 60 ? '#ffd319' : danger }
      };
    });
    out.push({ id: 'p-mono', name: 'Mono', colors: { accent: '#e8eaee', border: '#c9ced8', glow: '#ffffff', text: '#f5f6f8', muted: '#9097a3', surface: '#1b1d22', surface2: '#101114', danger: '#ff5a5a' } });
    return out;
  }
  // A user palette (4-6 colours) -> role map.
  function rolesFrom(colors) {
    const pal = colors.filter(Boolean).map(hex);
    if (!pal.length) return null;
    const pick = (role) => rankFor(role, pal)[0];
    const acc = pick('accent');
    const rest = pal.filter((c) => c !== acc);
    return { accent: acc, border: acc, glow: rankFor('accent', rest)[0] || acc, text: pick('text'), muted: pick('muted'), surface: pick('surface'), surface2: mix(pick('surface'), '#000', 0.5), danger: pick('danger') };
  }

  // ---------- categorising ----------
  const human = (s) => String(s).replace(/^--/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase());
  const idOf = (s) => String(s).replace(/^--/, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toUpperCase();

  function roleOf(name, prop) {
    const n = (name + ' ' + (prop || '')).toLowerCase();
    if (/danger|error|red|zero|warn/.test(n)) return 'danger';
    if (/glow|shadow/.test(n)) return 'glow';
    if (/border|line|stroke|outline|edge/.test(n)) return 'border';
    if (/bg|background|fill|surface|panel|glass|card/.test(n)) return 'surface';
    if (/dim|muted|sub|label|secondary/.test(n)) return 'muted';
    if (/text|ink|fg|title|heading|^color/.test(n) || prop === 'color') return 'text';
    return 'accent';
  }
  function categoryOf(name, prop) {
    const n = (name + ' ' + (prop || '')).toLowerCase();
    if (/opac|alpha|blur|shadow|glow|fade|backdrop/.test(n)) return 'surface';
    if (/font|size_?text|text|letter|tracking|line-?height|weight|fs\b/.test(n)) return 'type';
    if (/eas|curve|spring|bounce|delay|direction|motion|style/.test(n)) return 'motion';
    if (/speed|rate|cycle|dur|duration|time|interval|step|tilt|freq|period/.test(n)) return 'rate';
    return 'layout';
  }
  function sliderRange(value, unit, cat) {
    const v = Math.abs(value);
    if (cat === 'surface' && !unit && v <= 1) return { min: 0, max: 1, step: 0.01 };
    if (unit === 's') return { min: 0, max: Math.max(2, v * 4), step: 0.05 };
    if (unit === 'ms') return { min: 0, max: Math.max(2000, v * 4), step: 10 };
    if (unit === 'deg') return { min: -180, max: 180, step: 1 };
    if (unit === 'em' || unit === 'rem') return { min: 0, max: Math.max(2, v * 3), step: 0.01 };
    const max = v === 0 ? 100 : v < 1 ? 1 : v < 10 ? Math.ceil(v * 4) : Math.ceil(v * 3);
    const step = max <= 1 ? 0.01 : max <= 10 ? 0.1 : 1;
    return { min: value < 0 ? -max : 0, max, step };
  }

  // ---------- kind ----------
  function guessKind(markup, css, js) {
    const t = (markup || '') + ' ' + (css || '');
    const classes = ((markup || '').match(/class="([^"]*)"/g) || []).join(' ').toLowerCase();
    const texts = ((markup || '').replace(/<[^>]+>/g, ' ').match(/\w+/g) || []).length;
    if (/<nav\b|role="navigation"|\bnav\b|navbar|menu|tabs?\b/.test(classes + ' ' + (markup || '').slice(0, 400))) return 'nav';
    if ((/@keyframes/.test(css || '') || /requestAnimationFrame|<canvas/.test((js || '') + (markup || ''))) && (/bg|background|backdrop|aurora|rain|particles|canvas/.test(classes + (markup || '')) || texts < 4)) return 'animated-background';
    if (/<h1\b|hero|banner|jumbotron/.test(t.toLowerCase())) return 'hero';
    if (((markup || '').match(/<li\b/g) || []).length >= 3 || /\blist\b|rows?\b/.test(classes)) return 'list';
    if (/^\s*(<!--[\s\S]*?-->\s*)*<(button|a)\b/i.test(markup || '') && texts < 6) return 'button';
    return 'card';
  }

  const KIND_TEMPLATES = {
    card: { color: 3, surface: 2, type: 1, motion: 1 },
    'animated-background': { color: 3, surface: 2, rate: 1 },
    nav: { color: 3, surface: 1, type: 1, layout: 1, motion: 1 },
    hero: { color: 3, surface: 1, type: 2, layout: 1, motion: 1 },
    list: { color: 2, surface: 1, type: 1, layout: 2 },
    button: { color: 3, surface: 1, type: 1, layout: 1, motion: 1 }
  };
  const ROLE_PRIORITY = ['accent', 'text', 'surface', 'border', 'glow', 'muted', 'surface2', 'danger'];

  function pickFeatured(vars, kind) {
    const tpl = KIND_TEMPLATES[kind] || KIND_TEMPLATES.card;
    vars.forEach((v) => { v.featured = false; });
    const pri = (v) => {
      let p = v.master ? -10 : 0;
      if (v.category === 'color') p += ROLE_PRIORITY.indexOf(v.role || 'accent');
      if (v.category === 'surface' && /opac|alpha/i.test(v.id)) p -= 2;
      if (v.advanced) p += 20;
      return p;
    };
    let total = 0;
    Object.keys(tpl).forEach((cat) => {
      vars.filter((v) => v.category === cat).sort((a, b) => pri(a) - pri(b)).slice(0, tpl[cat]).forEach((v) => {
        if (total < 8) { v.featured = true; total++; }
      });
    });
    // top up from anything left so Basic is never empty
    if (total < 4) vars.filter((v) => !v.featured && !v.advanced).slice(0, 4 - total).forEach((v) => { v.featured = true; total++; });
    return vars;
  }


  // ---------- interaction scan ----------
  // Looks for cursor / touch / keyboard behaviour in component.js and the CSS. Comments are
  // stripped first; a click listener whose only job is preventDefault() (the lab's link guard)
  // does not count. Returns [{ kind, label, evidence, line }] in a fixed order.
  const stripJs = (t) => String(t || '').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
  const stripCss = (t) => String(t || '').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const INTERACTIONS = [
    { kind: 'hover', label: 'hover', re: /['"`](pointerenter|pointerleave|mouseenter|mouseleave|mouseover|mouseout)['"`]|\bon(mouseenter|mouseover|pointerenter)\s*=/ },
    { kind: 'drag', label: 'drag', re: /['"`](pointerdown|mousedown|dragstart)['"`]/ },
    { kind: 'wheel', label: 'wheel / scroll', re: /['"`](wheel|scroll)['"`]|\bonwheel\s*=/ },
    { kind: 'click', label: 'click', re: /['"`](click|dblclick)['"`]/ },
    { kind: 'key', label: 'keyboard', re: /['"`](keydown|keyup|focusin|focusout)['"`]/ },
    { kind: 'touch', label: 'touch', re: /['"`](touchstart|touchend)['"`]|pointerType\s*[!=]==?\s*['"`]touch|matchMedia\(\s*['"`]\(hover:\s*none/ }
  ];
  function lineOf(text, idx) { return text.slice(0, idx).split('\n').length; }
  function interactions(opts) {
    const js = stripJs(opts.js), css = stripCss(opts.css), markup = String(opts.markup || '');
    const hasMove = /['"`](pointermove|mousemove|touchmove|drag)['"`]|\bon(pointermove|mousemove|touchmove)\s*=/.test(js);
    const out = [];
    INTERACTIONS.forEach((it) => {
      let m, hit = null;
      if (it.kind !== 'drag' || hasMove) {
        const re = new RegExp(it.re.source, 'g');
        while ((m = re.exec(js))) {
          if (it.kind === 'click') {
            // ignore addEventListener('click', e => e.preventDefault()) and post-drag click-suppression guards
            const tail = js.slice(m.index, m.index + 240);
            const fn = tail.match(/^['"`]click['"`]\s*,\s*(?:function\s*\([^)]*\)|\(?\s*\w*\s*\)?\s*=>)\s*(\{[\s\S]*?\}|[^,)]+)/);
            if (fn && /(?:preventDefault|stopPropagation)/.test(fn[1])) {
              const rest = fn[1]
                .replace(/\bif\s*\([^)]*\)/g, '')
                .replace(/\breturn\b/g, '')
                .replace(/\b\w+\.(?:preventDefault|stopPropagation|stopImmediatePropagation)\(\)/g, '')
                .replace(/\b\w*drag\w*\s*=\s*(?:false|0)\b/gi, '')
                .replace(/[\s;{}()]+/g, '');
              if (!rest) continue;
            }
          }
          hit = { kind: it.kind, label: it.label, evidence: 'component.js:' + lineOf(js, m.index) + ' ' + m[0].replace(/['"`]/g, '').trim(), line: lineOf(js, m.index) };
          break;
        }
      }
      if (!hit && it.kind === 'drag' && /\bdraggable\s*=\s*['"]?true/i.test(markup)) hit = { kind: 'drag', label: 'drag', evidence: 'markup draggable="true"', line: 0 };
      if (!hit && it.kind === 'key') {
        const fv = css.match(/[^{}]*:(?:focus-visible|focus-within)[^{]*\{/);
        if (/tabindex=/.test(markup) && /focus/.test(js)) hit = { kind: 'key', label: 'keyboard', evidence: 'markup tabindex + focus', line: 0 };
        else if (fv) hit = { kind: 'key', label: 'keyboard', evidence: 'CSS ' + fv[0].replace(/\{$/, '').trim().split(',')[0].trim(), line: 0 };
      }
      if (hit) out.push(hit);
    });
    const cssNoMedia = css.replace(/@media[^{]*\{/g, '');
    const hoverCss = cssNoMedia.match(/[^{}]*:hover[^{]*\{/);
    if (hoverCss) out.push({ kind: 'hover-css', label: 'hover styles', evidence: 'CSS ' + hoverCss[0].replace(/\{$/, '').trim().split(',')[0].trim(), line: 0 });
    if (!out.some((x) => x.kind === 'touch') && /touch-action\s*:\s*none/.test(css) && out.some((x) => x.kind === 'drag')) out.push({ kind: 'touch', label: 'touch', evidence: 'CSS touch-action: none', line: 0 });
    return out;
  }
  // Detected behaviour -> a control with sensible options (category "interact").
  function interactionVars(found, animated) {
    const vs = [];
    found.forEach((f) => {
      const base = { category: 'interact', interaction: f.kind, source: 'scan', where: f.evidence };
      if (f.kind === 'hover') vs.push(Object.assign(base, animated
        ? { id: 'IX_HOVER', core: 'IX_HOVER', label: 'On hover', short: 'Hover', control: 'segmented', default: 'pause', options: [{ value: 'play', label: 'Keep' }, { value: 'pause', label: 'Pause' }, { value: 'slow', label: 'Slow' }, { value: 'fast', label: 'Fast' }], note: 'read P.IX_HOVER in component.js; return a rate() multiplier from mount()' }
        : { id: 'IX_HOVER', core: 'IX_HOVER', label: 'Hover reaction', short: 'Hover', control: 'switch', default: true, note: 'read P.IX_HOVER in your pointerenter handler' }));
      else if (f.kind === 'hover-css') vs.push(Object.assign(base, { id: 'IX_HOVER_CSS', label: 'Hover styles', short: 'Hover styles', control: 'switch', default: true, note: 'lab switches the :hover rules on or off; no code needed' }));
      else if (f.kind === 'drag') vs.push(Object.assign(base, { id: 'IX_DRAG', core: 'IX_DRAG', label: 'On drag', short: 'Drag', control: 'segmented', default: animated ? 'scrub' : 'on', options: animated ? [{ value: 'scrub', label: 'Spin' }, { value: 'ignore', label: 'Ignore' }] : [{ value: 'on', label: 'Drag' }, { value: 'ignore', label: 'Ignore' }], note: 'read P.IX_DRAG in the pointerdown handler' }));
      else if (f.kind === 'wheel') vs.push(Object.assign(base, { id: 'IX_WHEEL', label: 'On wheel', short: 'Wheel', control: 'segmented', default: 'scroll', options: [{ value: 'scroll', label: 'Scroll' }, { value: 'ignore', label: 'Ignore' }], note: 'read P.IX_WHEEL in the wheel handler' }));
      else if (f.kind === 'click') vs.push(Object.assign(base, { id: 'IX_CLICK', label: 'On click', short: 'Click', control: 'segmented', default: 'act', options: [{ value: 'act', label: 'Act' }, { value: 'ignore', label: 'Ignore' }], note: 'read P.IX_CLICK in the click handler' }));
      else if (f.kind === 'key') vs.push(Object.assign(base, animated
        ? { id: 'IX_KEY', core: 'IX_KEY', was: 'KEY_PAUSE', label: 'Keyboard focus pauses', short: 'Focus pauses', control: 'switch', default: true, advanced: true, note: 'read P.IX_KEY in focusin' }
        : { id: 'IX_KEY', core: 'IX_KEY', was: 'KEYS', label: 'Keyboard', short: 'Keys', control: 'switch', default: true, advanced: true, note: 'read P.IX_KEY in the key handler' }));
      else if (f.kind === 'touch') vs.push(Object.assign(base, { id: 'IX_TOUCH', core: 'IX_TOUCH', label: 'Touch', short: 'Touch', control: 'segmented', default: 'hover', options: [{ value: 'hover', label: 'Same as hover' }, { value: 'ignore', label: 'Ignore' }], advanced: true, note: 'check e.pointerType === "touch" and read P.IX_TOUCH' }));
    });
    return vs;
  }

  // ---------- core@1 ids (P1) ----------
  // Scanned controls use the shared core ids (components/_core/core.json) when they match a core control, so a
  // scanned component's values, snapshots and links line up with every manifest component. Matching is by the
  // CSS custom property a core control drives (opts.core, loaded by the lab) and a small synonym list for
  // legacy / JS names. Every rename is recorded in the result's "aliases" (old -> new) so data saved under an
  // older scan id moves over once.
  const CORE_SYNONYMS = {
    SPEED: 'MOTION_SPEED', TEMPO: 'MOTION_SPEED', EASE: 'MOTION_EASING', EASING: 'MOTION_EASING',
    GLOW: 'GLOW_STRENGTH', GLOW_K: 'GLOW_STRENGTH', RADIUS: 'RADIUS', R: 'RADIUS', BLUR: 'BLUR',
    W: 'SIZE_W', WIDTH: 'SIZE_W', H: 'SIZE_H', HEIGHT: 'SIZE_H', PAD: 'SPACE_PAD', PADDING: 'SPACE_PAD',
    GAP: 'SPACE_GAP', LIFT: 'HOVER_LIFT', PERSPECTIVE: 'DEPTH_PERSPECTIVE', TYPE_K: 'SCALE_TEXT', FW: 'WEIGHT',
    TRACK: 'TRACKING', FILL_OP: 'OPACITY_FILL', BORDER_OP: 'OPACITY_BORDER', INTENSITY: 'MOTION_INTENSITY',
    HOVER: 'IX_HOVER', DRAG: 'IX_DRAG', TOUCH: 'IX_TOUCH', KEYS: 'IX_KEY', KEY_PAUSE: 'IX_KEY',
    WHEEL: 'IX_WHEEL', CLICK: 'IX_CLICK', HOVER_FX: 'IX_HOVER_CSS'
  };
  function coreMap(core) {
    const byCss = {}, ids = new Set();
    if (core) (core.controls || []).concat(core.optional || []).forEach((c) => { ids.add(c.id); if (c.css) byCss[c.css] = c.id; });
    return { byCss, ids };
  }
  function coreIdFor(id, cssProp, cm) {
    if (cssProp && cm.byCss[cssProp]) return cm.byCss[cssProp];
    const syn = CORE_SYNONYMS[id];
    if (syn && (!cm.ids.size || cm.ids.has(syn) || /^IX_/.test(syn))) return syn;
    return null;
  }
  // old scan ids (before core@1) for the interaction / speed controls, recorded as aliases
  const LEGACY_SCAN_IDS = { IX_HOVER: 'HOVER', IX_DRAG: 'DRAG', IX_TOUCH: 'TOUCH', IX_WHEEL: 'WHEEL', IX_CLICK: 'CLICK', IX_HOVER_CSS: 'HOVER_FX', MOTION_SPEED: 'SPEED' };

  // ---------- main ----------
  // opts: { id, cssFiles: [{name, text}], markup, js, legacyParams, animated, core (components/_core/core.json) }
  function analyze(opts) {
    const vars = [];
    const seen = new Set();
    const cm = coreMap(opts.core);
    const aliases = {};
    const add = (v) => {
      const cid = v.source === 'scan' ? null : coreIdFor(v.id, v.css, cm);
      if (cid && cid !== v.id) {
        if (seen.has(cid)) { if (!seen.has(v.id)) aliases[v.id] = cid; return null; }   // same core control already found
        aliases[v.id] = cid;
        if (v.note) v.note = v.note.split('P.' + v.id).join('P.' + cid);
        v.id = cid;
      }
      if (cid) v.core = cid;
      if (seen.has(v.id)) return null; seen.add(v.id); vars.push(v); return v;
    };
    const uniq = (base) => { let id = base, n = 2; while (seen.has(id)) id = base + '_' + (n++); return id; };
    const cssAll = (opts.cssFiles || []).map((f) => f.text).join('\n');
    const notes = [];

    // 1) legacy params from Lab.register({ params }) keep working as sliders
    (opts.legacyParams || []).forEach((p) => {
      const cat = categoryOf(p.name, '');
      add({ id: p.name, label: p.label || human(p.name), category: cat, control: 'slider', min: p.min, max: p.max, step: p.step, default: p.default, where: p.where, advanced: cat === 'rate' });
    });

    // 2) CSS custom properties (bound live with style.setProperty on the frame)
    const colorLits = new Map(); // hex@alpha -> { hex, alpha, binds, props }
    const durations = [];
    rules(cssAll).forEach((r) => {
      r.decls.forEach((d) => {
        if (d.prop.startsWith('--')) {
          const val = d.value.trim();
          const c = val.match(COLOR_RE);
          if (c && c[0] === val) {
            const p = parse(val), a = alphaOf(p);
            add(Object.assign(
              { id: idOf(d.prop), label: human(d.prop), category: 'color', control: 'swatch-role', role: roleOf(d.prop), default: hex(p), css: d.prop, source: 'css-var' },
              a < 1 ? { alpha: a } : {}
            ));
            return;
          }
          const n = val.match(/^(-?\d*\.?\d+)(px|rem|em|s|ms|deg|%)?$/);
          if (n) {
            const cat = categoryOf(d.prop, '');
            const unit = n[2] || '';
            add(Object.assign({ id: idOf(d.prop), label: human(d.prop), category: cat, control: 'slider', default: +n[1], unit, css: d.prop, source: 'css-var' }, sliderRange(+n[1], unit, cat)));
          }
          return;
        }
        if (/var\(/.test(d.value)) return;
        // colour literals: one control per distinct colour+alpha, bound to every place it is used
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
        if (d.prop === 'opacity' && /^\d*\.?\d+$/.test(d.value)) {
          add({ id: uniq(idOf(r.sel.split(/[\s,>+~]/).pop() + '_OPACITY')), label: human(r.sel.split(/[\s,]/).pop().replace(/^[.#]/, '')) + ' opacity', category: 'surface', control: 'slider', min: 0, max: 1, step: 0.01, default: +d.value, bind: [{ sel: r.sel, prop: 'opacity', tpl: '{v}' }], source: 'css' });
        }
        if (/^(animation(-duration)?|transition(-duration)?)$/.test(d.prop)) {
          const m = d.value.match(/(^|\s)(\d*\.?\d+)(ms|s)\b/);
          if (m) durations.push({ sel: r.sel, prop: d.prop, value: d.value, n: +m[2], unit: m[3], lit: m[2] + m[3] });
        }
        if (d.prop === 'border-radius' && /^\d+px$/.test(d.value)) {
          add({ id: uniq(idOf(r.sel.split(/[\s,]/).pop() + '_RADIUS')), label: human(r.sel.split(/[\s,]/).pop().replace(/^[.#]/, '')) + ' radius', category: 'layout', control: 'slider', min: 0, max: 48, step: 1, unit: 'px', default: parseInt(d.value, 10), bind: [{ sel: r.sel, prop: 'border-radius', tpl: '{v}' }], source: 'css' });
        }
        if (d.prop === 'font-size' && /^\d*\.?\d+(px|rem)$/.test(d.value)) {
          const unit = d.value.endsWith('rem') ? 'rem' : 'px';
          add({ id: uniq(idOf(r.sel.split(/[\s,]/).pop() + '_FONT')), label: human(r.sel.split(/[\s,]/).pop().replace(/^[.#]/, '')) + ' size', category: 'type', control: 'slider', min: unit === 'px' ? 8 : 0.5, max: unit === 'px' ? 64 : 4, step: unit === 'px' ? 1 : 0.05, unit, default: parseFloat(d.value), bind: [{ sel: r.sel, prop: 'font-size', tpl: '{v}' }], source: 'css' });
        }
      });
    });
    let ci = 0;
    colorLits.forEach((e) => {
      const h = e.hex;
      const prop = e.props[0];
      const role = roleOf('', prop.replace('background-color', 'background'));
      const what = { color: 'Text', background: 'Fill', 'background-color': 'Fill', border: 'Border', 'border-color': 'Border', 'box-shadow': 'Glow', 'text-shadow': 'Text glow', fill: 'Fill', stroke: 'Stroke', outline: 'Outline' }[prop] || human(prop);
      const where = e.binds && e.binds[0] ? human(e.binds[0].sel.split(',')[0].trim().split(/[\s>+~]/).pop().replace(/^[.#]/, '').replace(/:.*$/, '')) : '';
      add(Object.assign(
        { id: 'COLOR_' + (++ci), label: (where ? where + ' ' + what.toLowerCase() : what + ' colour ' + ci), category: 'color', control: 'swatch-role', role, default: h, bind: e.binds, source: 'css-literal' },
        e.alpha < 1 ? { alpha: e.alpha } : {}
      ));
    });

    // 3) durations -> individual rate controls (Advanced) + one Speed master
    durations.forEach((d, i) => {
      const v = add({ id: 'DUR_' + (i + 1), label: human(d.sel.split(/[\s,]/).pop().replace(/^[.#]/, '')) + ' ' + d.prop.split('-')[0] + ' (' + d.unit + ')', category: 'rate', control: 'slider', default: d.n, unit: d.unit, advanced: true, speedScaled: true, bind: [{ sel: d.sel, prop: d.prop, tpl: d.value.replace(d.lit, '{v}') }], source: 'css' });
      if (v) Object.assign(v, sliderRange(d.n, d.unit, 'rate'));
    });
    if (durations.length && !vars.some((x) => x.master === 'speed') && !seen.has('MOTION_SPEED')) {
      add({ id: 'MOTION_SPEED', core: 'MOTION_SPEED', label: 'Speed', category: 'rate', control: 'slider', min: 0.25, max: 3, step: 0.05, default: 1, unit: '×', master: 'speed' });
    }

    // 4) UPPER_CASE numeric constants in JS (passed to render as P.NAME; wire them in mount/render)
    const jsRe = /\b(?:const|let|var)\s+([A-Z][A-Z0-9_]{1,})\s*=\s*(-?\d*\.?\d+)\s*[;,\n]/g;
    let jm;
    while ((jm = jsRe.exec(opts.js || ''))) {
      const cat = categoryOf(jm[1], '');
      add(Object.assign({ id: jm[1], label: human(jm[1]), category: cat, control: 'slider', default: +jm[2], advanced: cat === 'rate', source: 'js-const', note: 'read as P.' + jm[1] + ' in render()' }, sliderRange(+jm[2], '', cat)));
    }

    // 5) cursor / touch / keyboard behaviour -> Interaction controls (only when found)
    const found = interactions({ js: opts.js, css: cssAll, markup: opts.markup });
    interactionVars(found, !!opts.animated || /requestAnimationFrame/.test(opts.js || '')).forEach(add);
    if (!found.length) notes.push('No cursor, touch or keyboard behaviour found, so there is no Interaction section.');

    const kind = guessKind(opts.markup, cssAll, opts.js);
    pickFeatured(vars, kind);
    // a hover behaviour is the most visible interaction: feature it in Basic (replaces the last pick)
    const hv = vars.find((v) => v.category === 'interact' && v.interaction === 'hover');
    if (hv && !hv.featured) { const f = vars.filter((v) => v.featured); if (f.length >= 8) f[f.length - 1].featured = false; hv.featured = true; }
    if (!vars.length) notes.push('Scan found nothing to tune. Add a manifest.json (see README).');
    vars.forEach((v) => {
      const was = v.was || LEGACY_SCAN_IDS[v.id];
      if (was && !seen.has(was) && !aliases[was]) aliases[was] = v.id;
    });
    return { version: 2, core: opts.core ? (opts.core.id || 'core') + '@' + (opts.core.version || 1) : null, kind, title: opts.title, auto: true, generated: new Date().toISOString(), vars, aliases, notes };
  }

  window.Scan = { analyze, CORE_SYNONYMS, coreIdFor, interactions, interactionVars, palette, presets, rolesFrom, rankFor, pickFeatured, guessKind, hex, alphaOf, hsl, mix, rules, KIND_TEMPLATES };
})();
