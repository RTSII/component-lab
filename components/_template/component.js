// Blank component template (schema 3, core@1). New components are copies of this folder (Lab: + New, or
// python new-component.py my-name --kind card --category cards --tags purpose:card,feel:neon).
// manifest.json inherits the core control set from components/_core/core.json: 4 core colours, opacity,
// glow, radius, text scale, speed, easing, width and the 5 interaction slots (IX_HOVER, IX_PRESS, IX_DRAG,
// IX_TOUCH, IX_KEY). Every control with a "css" key is a CSS custom property the lab sets on the frame, so
// style.css does the visual work; this file only wires the interaction slots. Replace markup / CSS freely.
Lab.register({
  title: 'Blank template',
  css: ['style.css'],
  markup: 'markup.html',
  animated: false,          // CSS animations run on their own; true adds play/pause + scrub (then use interaction mode "rate")
  frames: {                 // overridden by manifest.json "frames" (set per kind)
    '1600x770': { w: 420, h: 320 },
    '1366x768': { w: 380, h: 300 }
  },

  mount(frame, ctx) {
    const kind = (ctx && ctx.manifest && ctx.manifest.kind) || 'card';
    const KINDS = {
      card: '<article class="cmp cmp-card" tabindex="0"><span class="cmp-badge">New</span><h3 class="cmp-title">Card title</h3>' +
        '<p class="cmp-text">Short supporting text that wraps onto a second line.</p><button class="cmp-btn" type="button">Action</button></article>',
      nav: '<nav class="cmp cmp-nav"><a class="is-active" href="#">Home</a><a href="#">Study</a><a href="#">Quiz</a><a href="#">Stats</a></nav>',
      hero: '<section class="cmp cmp-hero" tabindex="0"><p class="cmp-eyebrow">PTCE 2026</p><h1 class="cmp-title">Headline goes here</h1>' +
        '<p class="cmp-text">One line of supporting text.</p><button class="cmp-btn" type="button">Get started</button></section>',
      'animated-background': '<div class="cmp cmp-bg"><i class="b1"></i><i class="b2"></i><i class="b3"></i><span class="cmp-bg-label">Background</span></div>',
      list: '<ul class="cmp cmp-list" tabindex="0"><li><i></i><span>Medications</span><b>82%</b></li><li><i></i><span>Safety</span><b>64%</b></li>' +
        '<li><i></i><span>Order entry</span><b>71%</b></li><li><i></i><span>Federal law</span><b>0%</b></li></ul>',
      button: '<button class="cmp cmp-btn cmp-solo" type="button">Start quiz</button>'
    };
    const host = frame.querySelector('.cmp-host');
    if (host && !host.children.length) {
      host.innerHTML = KINDS[kind] || KINDS.card;
      host.dataset.kind = kind;
    }
    const root = host || frame;
    root.addEventListener('click', (e) => e.preventDefault());

    // ---- the 5 core interaction slots (interaction mode "fx": visual reactions, no clock) ----
    // IX_HOVER none | lift | glow | both   -> data-hover, CSS :hover rules in style.css
    // IX_PRESS none | press | glow         -> data-press, CSS :active rules
    // IX_DRAG  none | tilt                 -> pointer drag tilts the element (--tilt-x / --tilt-y)
    // IX_TOUCH hover | ignore              -> a touch either acts like hover/press or is ignored
    // IX_KEY   true | false                -> keyboard focus shows the hover state + a focus ring
    let P = (ctx && ctx.params) || {};
    let drag = null;
    const target = () => root.querySelector('.cmp');
    const touchIgnored = (e) => e.pointerType === 'touch' && P.IX_TOUCH === 'ignore';
    root.addEventListener('pointerdown', (e) => {
      if (touchIgnored(e)) { root.dataset.touchOff = '1'; return; }
      delete root.dataset.touchOff;
      if (P.IX_DRAG !== 'tilt' || !target()) return;
      drag = { x: e.clientX, y: e.clientY };
      try { root.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    });
    root.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const el = target();
      const k = 0.12;   // degrees per px, clamped to +/- 14deg
      el.style.setProperty('--tilt-x', Math.max(-14, Math.min(14, -(e.clientY - drag.y) * k)) + 'deg');
      el.style.setProperty('--tilt-y', Math.max(-14, Math.min(14, (e.clientX - drag.x) * k)) + 'deg');
    });
    const endDrag = () => {
      if (!drag) return;
      drag = null;
      const el = target();
      if (el) { el.style.removeProperty('--tilt-x'); el.style.removeProperty('--tilt-y'); }
    };
    root.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', endDrag);

    const sync = () => {
      const d = root.dataset;
      const set = (k, v) => { if (d[k] !== v) d[k] = v; };
      set('hover', String(P.IX_HOVER || 'none'));
      set('press', String(P.IX_PRESS || 'none'));
      set('drag', String(P.IX_DRAG || 'none'));
      set('key', P.IX_KEY === false ? 'off' : 'on');
    };
    sync();
    return {
      render(params) { P = params || P; sync(); },
      destroy() { endDrag(); }
    };
  }
});
