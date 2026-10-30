// Component Lab profile pass. The closed dock is a small backstage / DJ-access pass instead of a round
// button: slot punch, photo window, tier tag, barcode, status LED and a holo sheen that follows the
// pointer. The same markup renders the large preview in Settings > Profile. No dependencies.
//
//   Pass.miniHtml()      the 56 x 76 pass (also used as the travel ghost when the dock morphs)
//   Pass.fullHtml()      the large pass for the Settings preview
//   Pass.mount(button)   renders into #dockTrigger, tracks the pointer, re-renders on change
//   Pass.set(patch)      update + save the profile ({ name, role, tier, accent, type, glyph, chars, image })
//   Pass.fileToDataUrl(file)  centre-crop to 160 x 160 and return a small JPEG data URL
(function () {
  'use strict';

  const KEY = 'componentLab:v2:profile';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Access levels. `short` is what fits on the mini pass.
  const TIERS = [
    { id: 'guest', label: 'Guest', short: 'GST', line: 'GUEST LIST' },
    { id: 'vip', label: 'VIP', short: 'VIP', line: 'VIP LOUNGE' },
    { id: 'backstage', label: 'Backstage', short: 'BKST', line: 'BACKSTAGE' },
    { id: 'crew', label: 'Crew', short: 'CREW', line: 'CREW / TECH' },
    { id: 'dj', label: 'DJ', short: 'DJ', line: 'ARTIST / DJ' },
    { id: 'all', label: 'All access', short: 'ALL', line: 'ALL ACCESS' }
  ];
  // Colours from the project tokens (project/tokens.css): neon blue, pink, violet, green, amber.
  const ACCENTS = ['#00e5ff', '#ff2a6d', '#b967ff', '#00ff41', '#ffd319'];

  // Designs: 32 x 32, stroked with currentColor (the pass accent).
  const DESIGNS = [
    { id: 'vinyl', label: 'Vinyl', svg: '<circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="7.5" opacity=".55"/><circle cx="16" cy="16" r="2.2"/><path d="M6.5 11a11 11 0 0 1 6-5" opacity=".7"/>' },
    { id: 'jog', label: 'Jog wheel', svg: '<circle cx="16" cy="16" r="12.5"/><circle cx="16" cy="16" r="4.5"/><path d="M16 3.5v5M16 23.5v5M3.5 16h5M23.5 16h5" opacity=".6"/><path d="M16 16l5.5-5.5"/>' },
    { id: 'headset', label: 'Cans', svg: '<path d="M6 19v-3a10 10 0 0 1 20 0v3"/><rect x="4.5" y="18" width="6" height="9" rx="2.4"/><rect x="21.5" y="18" width="6" height="9" rx="2.4"/>' },
    { id: 'eq', label: 'Equalizer', svg: '<path d="M7 25V15M12 25V8M17 25V12M22 25V5M27 25V17" stroke-width="2.6"/>' },
    { id: 'wave', label: 'Waveform', svg: '<path d="M3 16h3l2-7 3 14 3-18 3 20 3-13 2 4h5"/>' },
    { id: 'fader', label: 'Faders', svg: '<path d="M9 5v22M16 5v22M23 5v22" opacity=".45"/><rect x="6.5" y="17" width="5" height="4.5" rx="1.2"/><rect x="13.5" y="8" width="5" height="4.5" rx="1.2"/><rect x="20.5" y="13" width="5" height="4.5" rx="1.2"/>' },
    { id: 'chip', label: 'Chip', svg: '<rect x="8" y="8" width="16" height="16" rx="2.5"/><rect x="12.5" y="12.5" width="7" height="7" rx="1"/><path d="M12 4v4M16 4v4M20 4v4M12 24v4M16 24v4M20 24v4M4 12h4M4 16h4M4 20h4M24 12h4M24 16h4M24 20h4" opacity=".65"/>' },
    { id: 'bolt', label: 'Bolt', svg: '<path d="M18 3L7 18h8l-2 11 12-16h-8z"/>' }
  ];
  const design = (id) => DESIGNS.find((d) => d.id === id) || DESIGNS[0];
  const tier = (id) => TIERS.find((t) => t.id === id) || TIERS[1];

  const DEFAULTS = { name: 'Rob', role: 'Lab crew', tier: 'vip', accent: '#00e5ff', type: 'glyph', glyph: 'vinyl', chars: 'R', image: '', serial: 0 };

  function load() {
    let p = {};
    try { p = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { p = {}; }
    const out = Object.assign({}, DEFAULTS, p);
    if (!out.serial) out.serial = 1 + Math.floor(Math.random() * 9998);
    return out;
  }
  let profile = load();
  const listeners = [];
  let host = null;

  function save() { try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch (e) { /* private mode or quota */ } }

  // The picture inside the photo window. A photo type without an image yet falls back to the design.
  function face() {
    if (profile.type === 'image' && profile.image) return '<img src="' + esc(profile.image) + '" alt="" draggable="false">';
    if (profile.type === 'text' && String(profile.chars).trim()) return '<b>' + esc(String(profile.chars).trim().slice(0, 3).toUpperCase()) + '</b>';
    return '<svg viewBox="0 0 32 32" aria-hidden="true">' + design(profile.glyph).svg + '</svg>';
  }
  const accentStyle = () => '--pa:' + esc(profile.accent) + ';';

  function miniHtml() {
    const t = tier(profile.tier);
    return '<span class="pass-mini" style="' + accentStyle() + '">'
      + '<i class="pm-slot"></i><i class="pm-led"></i>'
      + '<span class="pm-photo">' + face() + '</span>'
      + '<span class="pm-tier">' + esc(t.short) + '</span>'
      + '<i class="pm-bars"></i>'
      + '<i class="pm-sheen"></i></span>';
  }

  function fullHtml() {
    const t = tier(profile.tier);
    const serial = String(profile.serial).padStart(4, '0');
    return '<div class="pass-full" style="' + accentStyle() + '">'
      + '<div class="pf-top"><span>COMPONENT LAB</span><span class="pf-year">2026</span></div>'
      + '<i class="pm-slot pf-slot"></i><i class="pm-led"></i>'
      + '<div class="pm-photo pf-photo">' + face() + '</div>'
      + '<div class="pf-name">' + esc(profile.name || 'Unnamed') + '</div>'
      + '<div class="pf-role">' + esc(profile.role || '') + '</div>'
      + '<div class="pf-tier">' + esc(t.line) + '</div>'
      + '<i class="pf-holo"></i>'
      + '<div class="pf-foot"><i class="pm-bars pf-bars"></i><span>No. ' + serial + '</span></div>'
      + '<i class="pm-sheen"></i></div>';
  }

  function paintHost() {
    if (!host) return;
    host.innerHTML = miniHtml();
    host.title = 'Controls · ' + (profile.name || 'Profile') + ' · ' + tier(profile.tier).label;
    document.documentElement.style.setProperty('--pass-accent', profile.accent);
  }

  function set(patch) {
    Object.keys(patch || {}).forEach((k) => { if (k in DEFAULTS) profile[k] = patch[k]; });
    if (patch && patch.accent) profile.accent = ACCENTS.includes(patch.accent) ? patch.accent : profile.accent;
    save();
    paintHost();
    listeners.forEach((fn) => { try { fn(profile); } catch (e) { /* ignore */ } });
  }
  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    profile = load();
    save();
    paintHost();
    listeners.forEach((fn) => { try { fn(profile); } catch (e) { /* ignore */ } });
  }

  // Point the sheen at the pointer (the pass reads --mx / --my).
  function track(btn) {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', ((e.clientX - r.left) / (r.width || 1) * 100).toFixed(1) + '%');
      btn.style.setProperty('--my', ((e.clientY - r.top) / (r.height || 1) * 100).toFixed(1) + '%');
    });
    btn.addEventListener('pointerleave', () => { btn.style.removeProperty('--mx'); btn.style.removeProperty('--my'); });
  }
  function mount(btn) { host = btn; track(btn); paintHost(); }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('Pick an image file.')); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const S = 160, c = document.createElement('canvas');
        c.width = c.height = S;
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        c.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, S, S);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.84));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
      img.src = url;
    });
  }

  window.Pass = {
    TIERS, ACCENTS, DESIGNS, miniHtml, fullHtml, mount, set, reset, fileToDataUrl,
    get profile() { return Object.assign({}, profile); },
    onChange(fn) { listeners.push(fn); }
  };
})();
