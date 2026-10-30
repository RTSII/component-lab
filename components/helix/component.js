// PTCB26 home helix for the Component Lab.
// The layout math is initHelix()/layout() from js/home.js (v109), with each constant
// read from the params object instead. At the default values it is the same math.
Lab.register({
  id: 'helix',
  title: 'PTCB26 home helix',
  css: ['style.css'],
  markup: 'markup.html',
  animated: true,
  cycleParam: 'CYCLE',
  defaultOffset: 0.5,
  // Real #hxHelix column size measured in Chrome at each locked viewport.
  frames: {
    '1600x770': { w: 341, h: 614, vars: { '--lab-num-fs': '19.2px', '--lab-card-h': '92px' } },
    '1366x768': { w: 291, h: 577, vars: { '--lab-num-fs': '16.8px', '--lab-card-h': '92px' } }
  },
  // Controls live in manifest.json (v2 control model). Every id there arrives here as P.<ID>.
  // Colour / opacity / type controls with a "css" key are applied by the lab as CSS custom
  // properties on the frame; the rest are read below.
  //
  // Interaction (category "interact" in manifest.json), the same behaviour as js/home.js v109:
  //   HOVER      pointer over a card: play | pause (home.js) | slow | fast. "Over a card" is the
  //              browser's own hit test at the pointer (each card's clipped, transformed, rendered
  //              shape; hidden back cards are pointer-events: none), so it tracks exactly what is on
  //              screen at any lab view zoom / pan, never the empty space of the (zoomed) column.
  //   DRAG       vertical drag spins the helix (scrub) | ignore
  //   TOUCH      touch acts like hover (hover) | ignore
  //   KEY_PAUSE  Tab focus on a card brings it to the front and pauses
  // The lab (and the exported runner) owns the clock: rate() scales playback, ctx.time.nudge()
  // moves it for drags, ctx.time.offset is read for bring-to-front.

  mount(frame, ctx) {
    const time = (ctx && ctx.time) || { nudge() {}, offset: 0 };
    const root = frame.querySelector('.hx-helix');
    const stage = root.querySelector('.hx-helix-stage');
    const samples = Array.from(stage.querySelectorAll('.hx-helix-card')).map((c) => c.cloneNode(true));
    let cards = [];

    const wrap = (v) => ((v % 1) + 1) % 1;
    const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

    const NS = 'http://www.w3.org/2000/svg';
    const CUT = 10;
    function buildEdge(card) {
      let svg = card.querySelector('.hx-helix-edge');
      if (!svg) {
        svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'hx-helix-edge');
        svg.setAttribute('aria-hidden', 'true');
        for (let k = 0; k < 4; k++) {
          const p = document.createElementNS(NS, 'path');
          p.setAttribute('pathLength', '100');
          svg.appendChild(p);
        }
        card.appendChild(svg);
      }
      const w = card.offsetWidth, h = card.offsetHeight, i = 1, c = CUT;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      const d = [
        'M' + w / 2 + ' ' + i + 'H' + (w - i) + 'V' + h / 2,
        'M' + w / 2 + ' ' + (h - i) + 'H' + (w - c) + 'L' + (w - i) + ' ' + (h - c) + 'V' + h / 2,
        'M' + w / 2 + ' ' + i + 'H' + c + 'L' + i + ' ' + c + 'V' + h / 2,
        'M' + w / 2 + ' ' + (h - i) + 'H' + i + 'V' + h / 2
      ];
      svg.querySelectorAll('path').forEach((p, k) => p.setAttribute('d', d[k]));
    }
    const ro = window.ResizeObserver ? new ResizeObserver(() => cards.forEach(buildEdge)) : null;

    // Rebuild the card list when the count changes, cycling through the sample cards.
    function setCount(n) {
      if (cards.length === n) return;
      if (ro) ro.disconnect();
      stage.innerHTML = '';
      cards = [];
      for (let i = 0; i < n; i++) {
        const card = samples[i % samples.length].cloneNode(true);
        card.draggable = false;
        stage.appendChild(card);
        cards.push(card);
      }
      cards.forEach((card) => {
        buildEdge(card);
        if (ro) ro.observe(card);
        const num = card.querySelector('.hx-helix-num');
        if (num) num.classList.toggle('is-zero', /^\s*(—|-|0+(\.0+)?%?)?\s*$/.test(num.textContent));
      });
    }

    // Easing between card slots (EASING control). Linear = the original constant motion.
    const easeSlot = {
      linear: (f) => f,
      glide: (f) => (f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2),
      snap: (f) => { const c = 1.9, t = Math.min(1, f * 1.35); return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
    };

    let lastP = (ctx && ctx.params) || {};
    function render(P, offset) {
      lastP = P;
      setCount(Math.max(1, Math.round(P.N)));
      frame.style.setProperty('--lab-perspective', P.PERSPECTIVE + 'px');
      frame.style.setProperty('--lab-card-w', P.CARD_W + 'px');
      const n = cards.length;
      // Masters: Intensity scales the turn, twist, wave and depth scaling together (1 = original).
      const I = P.INTENSITY === undefined ? 1 : P.INTENSITY;
      const STEP = P.STEP * I, TILT = P.TILT * I, WAVE = P.WAVE * I;
      const SCALE_MIN = 1 - (1 - P.SCALE_MIN) * Math.min(I, 1 / Math.max(0.0001, 1 - P.SCALE_MIN));
      const ease = easeSlot[P.EASING] || easeSlot.linear;
      const o = offset * n;
      const slot = Math.floor(o);
      offset = (slot + ease(o - slot)) / n;
      const borderFill = (absT) => Math.min(1, Math.max(0, (P.FILL_EMPTY_AT - absT) / (P.FILL_EMPTY_AT - P.FILL_FULL_AT)));

      // ---- layout() from js/home.js v109, constants -> P.* ----
      // offsetWidth/Height (not getBoundingClientRect) so the lab's fit-to-stage scale does not change the math.
      const rect = { width: stage.offsetWidth, height: stage.offsetHeight };
      const travel = Math.max(rect.height * P.TRAVEL, 1);
      const cardW = cards[0].offsetWidth || 0;
      const room = (rect.width - cardW) / 2;
      const radius = Math.max(0, Math.min(rect.width * P.RADIUS_FRAC, P.RADIUS_MAX, room - P.RADIUS_PAD));
      const span = n / 2;
      const sp = travel / n;
      for (let i = 0; i < n; i++) {
        const u = wrap(i / n + offset);
        const t = (u - 0.5) * n;
        const absT = Math.abs(t);
        const deg = t * STEP;
        const absDeg = Math.abs(deg);
        const th = deg * Math.PI / 180;
        const x = Math.sin(th) * radius;
        const y = sp * (t + WAVE * Math.sin(t * Math.PI / span));
        const depth = (Math.cos(th) + 1) / 2;
        const scale = SCALE_MIN + (1 - SCALE_MIN) * depth;
        const body = 1 - (1 - P.BACK_OPACITY) * smooth(P.BACK_FADE_A, P.BACK_FADE_B, absDeg);
        const opacity = body * (P.END_FADE_ON === false ? 1 : 1 - smooth(P.END_FADE_A, P.END_FADE_B, absT));
        const card = cards[i];
        card.style.transform = 'translate(-50%, -50%) translate(' + x.toFixed(2) + 'px, ' + y.toFixed(2) +
          'px) rotateY(' + (TILT * deg).toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
        card.style.opacity = opacity.toFixed(3);
        card.style.zIndex = String(100 + Math.round(Math.cos(th) * 50));
        card.style.setProperty('--tx', (P.TEXT_FADE_ON === false ? 1 : 1 - smooth(P.TEXT_FADE_A, P.TEXT_FADE_B, absDeg)).toFixed(3));
        card.style.setProperty('--bp', borderFill(absT).toFixed(3));
        card.style.pointerEvents = absDeg > 70 || opacity < 0.42 ? 'none' : 'auto';
      }
    }

    // Links in the sample cards go nowhere in the lab.
    root.addEventListener('click', (e) => e.preventDefault());

    // ---- interaction (home.js v109 handlers, switchable from the Interaction controls) ----
    const DRAG_PX = 8;
    const HOVER_RATE = { play: 1, pause: 0, slow: 0.35, fast: 1.8 };
    let inside = false, hoverTouch = false, dragging = false, dragMoved = false, kbdPause = false;
    let lastY = 0, startY = 0, rateNow = 1, ptrX = 0, ptrY = 0;

    // Hover = the pointer is on a real card. Client coordinates + elementFromPoint, re-checked every
    // frame, so it stays exact while cards move under a still pointer and under any view scale /
    // pan / 3D transform (no offset math to convert). Anything drawn over the card (dock, toolbar)
    // or clipped away by the stage edge is not the card, so it does not count.
    const track = (e) => { ptrX = e.clientX; ptrY = e.clientY; };
    root.addEventListener('pointerenter', (e) => { inside = true; hoverTouch = e.pointerType === 'touch'; track(e); });
    root.addEventListener('pointermove', track, { passive: true });
    root.addEventListener('pointerleave', () => { inside = false; });
    function overCard() {
      if (!inside) return false;
      const hit = document.elementFromPoint(ptrX, ptrY);
      const card = hit && hit.closest && hit.closest('.hx-helix-card');
      return !!(card && root.contains(card));
    }

    function onPointerMove(e) {
      if (!dragging) return;
      const dy = e.clientY - lastY;
      lastY = e.clientY;
      if (!dy) return;
      // screen-space height, so the drag tracks the finger even when the lab scales the stage
      const travel = Math.max(stage.getBoundingClientRect().height * (lastP.TRAVEL || 0.94), 1);
      time.nudge(dy / travel);
      if (Math.abs(e.clientY - startY) > DRAG_PX) dragMoved = true;
    }
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      root.classList.remove('is-dragging');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    }
    root.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || lastP.DRAG === 'ignore') return;
      if (e.pointerType === 'touch' && lastP.TOUCH === 'ignore') return;
      dragging = true;
      dragMoved = false;
      lastY = startY = e.clientY;
      root.classList.add('is-dragging');
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointercancel', endDrag);
    });
    root.addEventListener('click', (e) => {
      if (!dragMoved) return;
      e.preventDefault();
      e.stopPropagation();
      dragMoved = false;
    }, true);

    function bringToFront(card) {
      const i = cards.indexOf(card), n = cards.length;
      if (i < 0) return;
      const current = wrap(time.offset);
      let delta = wrap(0.5 - i / n) - current;
      if (delta > 0.5) delta -= 1;
      if (delta < -0.5) delta += 1;
      time.nudge(delta);
    }
    root.addEventListener('focusin', (e) => {
      if (lastP.KEY_PAUSE === false) return;
      const card = e.target.closest('.hx-helix-card');
      if (!card || !root.contains(card) || !card.matches(':focus-visible')) return;
      kbdPause = true;
      bringToFront(card);
    });
    root.addEventListener('focusout', (e) => {
      if (root.contains(e.relatedTarget)) return;
      kbdPause = false;
    });

    // Playback multiplier for this frame. Eased (~80ms) so slow / fast do not jolt.
    function rate(P, dt) {
      const hovering = overCard();
      let target = 1;
      if (dragging) target = 0;
      else if (kbdPause && P.KEY_PAUSE !== false) target = 0;
      else if (hovering && !(hoverTouch && P.TOUCH === 'ignore')) target = HOVER_RATE[P.HOVER] !== undefined ? HOVER_RATE[P.HOVER] : 0;
      if (target === 0) rateNow = 0; // pause is immediate, as on the site
      else rateNow += (target - rateNow) * Math.min(1, (dt || 0.016) * 12);
      return rateNow;
    }

    return {
      render,
      rate,
      get hovering() { return overCard(); },
      destroy() { if (ro) ro.disconnect(); endDrag(); }
    };
  }
});
