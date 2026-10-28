// Component Lab motion system. One consistent set of curves and helpers, no dependencies.
// Everything is element.animate() or CSS transitions; the velocity pill uses a tiny rAF spring.
(function () {
  'use strict';

  const SPRING_LINEAR = 'linear(0, 0.0603, 0.2033, 0.3821, 0.5633, 0.7258, 0.8584, 0.9574, 1.0242, 1.0634, 1.0809, 1.0828, 1.0747, 1.0613, 1.046, 1.0313, 1.0186, 1.0085, 1.0012, 0.9965, 0.994, 0.9931, 0.9933, 0.9941, 0.9953, 0.9966, 0.9978, 0.9988, 1)';
  const hasLinear = window.CSS && CSS.supports('transition-timing-function', SPRING_LINEAR);
  const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  // Damped spring sampled into a CSS linear() curve. zeta < 1 overshoots; 0.72 peaks near 3%,
  // which is the soft morph used by the Pro section motion B (and its inner folds).
  function springCurve(zeta, n) {
    const w = -Math.log(0.001) / zeta, wd = w * Math.sqrt(1 - zeta * zeta), pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(i === n ? 1 : +(1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + (zeta * w / wd) * Math.sin(wd * t))).toFixed(4));
    }
    return 'linear(' + pts.join(', ') + ')';
  }
  const SPRING_SOFT = springCurve(0.72, 40);

  const M = {
    spring: hasLinear ? SPRING_LINEAR : 'cubic-bezier(0.34, 1.4, 0.64, 1)',
    springSoft: hasLinear ? SPRING_SOFT : 'cubic-bezier(0.3, 1.18, 0.5, 1)',
    settle: 'cubic-bezier(0.22, 1, 0.36, 1)',
    easeOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
    enabled: true, // Settings > Animations
    // 'full' | 'fade' (prefers-reduced-motion) | 'off' (motion switched off in Settings)
    level() { return !M.enabled ? 'off' : (mq.matches ? 'fade' : 'full'); },
    done() { return Promise.resolve(); }
  };
  document.documentElement.style.setProperty('--spring', M.spring);
  document.documentElement.style.setProperty('--settle', M.settle);
  document.documentElement.style.setProperty('--spring-soft', M.springSoft);
  document.documentElement.style.setProperty('--ease-out', M.easeOut);

  const finished = (a) => a.finished.catch(() => {});

  // Content in: opacity + translateY(4px) + blur(8px) -> 0 over ~200ms.
  M.contentIn = function (el, delay) {
    const lv = M.level();
    if (!el || lv === 'off') return M.done();
    if (lv === 'fade') return finished(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, delay: delay || 0, easing: 'linear', fill: 'backwards' }));
    return finished(el.animate([
      { opacity: 0, transform: 'translateY(4px)', filter: 'blur(8px)' },
      { opacity: 1, transform: 'none', filter: 'blur(0px)' }
    ], { duration: 200, delay: delay || 0, easing: M.easeOut, fill: 'backwards' }));
  };
  M.contentOut = function (el) {
    const lv = M.level();
    if (!el || lv === 'off') return M.done();
    if (lv === 'fade') return finished(el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' }));
    return finished(el.animate([
      { opacity: 1, transform: 'none', filter: 'blur(0px)' },
      { opacity: 0, transform: 'translateY(4px)', filter: 'blur(8px)' }
    ], { duration: 180, easing: M.easeOut, fill: 'forwards' }));
  };

  // Sliding panel: new page slides in from the side of travel (+/-36px, spring ~560ms),
  // old page fades and slides the other way (~200ms).
  M.slide = function (oldEl, newEl, dir) {
    const lv = M.level();
    dir = dir < 0 ? -1 : 1;
    if (lv === 'off') return M.done();
    if (lv === 'fade') {
      newEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
      return finished(oldEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' }));
    }
    newEl.animate([
      { opacity: 0, transform: 'translateX(' + 36 * dir + 'px)' },
      { opacity: 1, transform: 'none' }
    ], { duration: 560, easing: M.spring });
    newEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: M.easeOut, composite: 'replace' });
    return finished(oldEl.animate([
      { opacity: 1, transform: 'none', filter: 'blur(0px)' },
      { opacity: 0, transform: 'translateX(' + -36 * dir + 'px)', filter: 'blur(2px)' }
    ], { duration: 200, easing: M.easeOut, fill: 'forwards' }));
  };

  // Height spring between two measured heights (Stepper-style viewport).
  M.height = function (el, from, to) {
    const lv = M.level();
    el.getAnimations().forEach((a) => { if (a.__height) a.cancel(); });
    el.style.height = to + 'px';
    if (lv === 'off' || Math.abs(from - to) < 1) return M.done();
    const a = el.animate([{ height: from + 'px' }, { height: to + 'px' }],
      lv === 'fade' ? { duration: 150, easing: M.settle } : { duration: 560, easing: M.spring });
    a.__height = true;
    return finished(a);
  };

  // FLIP an icon from one element to another (trigger icon -> close button).
  M.travel = function (fromEl, toEl, html, opts) {
    if (!fromEl || !toEl || M.level() !== 'full') return M.done();
    const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    if (!a.width || !b.width) return M.done();
    const ghost = document.createElement('div');
    ghost.className = 'travel-ghost';
    ghost.innerHTML = html;
    Object.assign(ghost.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    document.body.appendChild(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const s = b.width / a.width;
    const anim = ghost.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ') rotate(' + ((opts && opts.rotate) || 90) + 'deg)', opacity: 0.2 }
    ], { duration: 300, easing: M.settle, fill: 'forwards' });
    return finished(anim).then(() => ghost.remove());
  };

  // ---- Velocity pill: one highlight that glides to the selected item on a spring.
  // Fast travel stretches it (up to 1.25) and blurs it (up to 1.5px); at rest 1 / 0px.
  const K = 420, C = 34, MASS = 0.8;
  const lerp = (x, xs, ys) => {
    if (x <= xs[0]) return ys[0];
    for (let i = 1; i < xs.length; i++) {
      if (x <= xs[i]) { const t = (x - xs[i - 1]) / (xs[i] - xs[i - 1]); return ys[i - 1] + (ys[i] - ys[i - 1]) * t; }
    }
    return ys[ys.length - 1];
  };
  class VelocityPill {
    constructor(pill, axis) {
      this.pill = pill;
      this.axis = axis || 'x';
      this.pos = null; this.size = 0; this.v = 0; this.target = 0; this.tsize = 0; this.raf = 0;
      this.tick = this.tick.bind(this);
    }
    moveTo(btn, instant) {
      if (!btn) { this.pill.style.opacity = '0'; return; }
      this.pill.style.opacity = '1';
      const x = this.axis === 'x';
      this.target = x ? btn.offsetLeft : btn.offsetTop;
      this.tsize = x ? btn.offsetWidth : btn.offsetHeight;
      if (x) { this.pill.style.top = btn.offsetTop + 'px'; this.pill.style.height = btn.offsetHeight + 'px'; }
      else { this.pill.style.left = btn.offsetLeft + 'px'; this.pill.style.width = btn.offsetWidth + 'px'; }
      if (this.pos === null || instant || M.level() !== 'full') {
        cancelAnimationFrame(this.raf); this.raf = 0;
        this.pos = this.target; this.size = this.tsize; this.v = 0;
        this.paint(1, 0);
        return;
      }
      if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
    }
    tick(now) {
      const dt = Math.min(0.034, Math.max(0.001, (now - this.last) / 1000));
      this.last = now;
      const n = 4, hstep = dt / n;
      for (let i = 0; i < n; i++) {
        const f = -K * (this.pos - this.target) - C * this.v;
        this.v += (f / MASS) * hstep;
        this.pos += this.v * hstep;
        this.size += (this.tsize - this.size) * Math.min(1, hstep * 22);
      }
      const speed = Math.abs(this.v) / Math.max(1, this.tsize); // items per second
      const k = lerp(speed, [0, 3, 12], [1, 1.08, 1.25]);
      const blur = lerp(speed, [0, 3, 12], [0, 0.4, 1.5]);
      if (Math.abs(this.pos - this.target) < 0.25 && Math.abs(this.v) < 4) {
        this.pos = this.target; this.size = this.tsize; this.v = 0; this.raf = 0;
        this.paint(1, 0);
        return;
      }
      this.paint(k, blur);
      this.raf = requestAnimationFrame(this.tick);
    }
    paint(k, blur) {
      const s = this.pill.style;
      if (this.axis === 'x') { s.width = this.size + 'px'; s.transform = 'translateX(' + this.pos.toFixed(2) + 'px) scaleX(' + k.toFixed(3) + ')'; }
      else { s.height = this.size + 'px'; s.transform = 'translateY(' + this.pos.toFixed(2) + 'px) scaleY(' + k.toFixed(3) + ')'; }
      s.filter = blur > 0.02 ? 'blur(' + blur.toFixed(2) + 'px)' : 'none';
    }
  }
  M.VelocityPill = VelocityPill;

  // Gliding indicator (step tiles): FLIP a box from its old rect to a new one on the spring.
  M.glide = function (el, left, top, width, height) {
    const prev = { l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight, shown: el.style.opacity === '1' };
    Object.assign(el.style, { left: left + 'px', top: top + 'px', width: width + 'px', height: height + 'px', opacity: '1' });
    if (!prev.shown || M.level() !== 'full') return;
    el.animate([
      { transform: 'translate(' + (prev.l - left) + 'px,' + (prev.t - top) + 'px)', width: prev.w + 'px', height: prev.h + 'px' },
      { transform: 'none', width: width + 'px', height: height + 'px' }
    ], { duration: 560, easing: M.spring });
  };

  // ---------- Flick physics (shared) ----------
  // One gesture model for every flickable control (rail toolbar button, the nested toolbar):
  // a press that moves less than `slop` px is a click/tap; more is a drag that follows the finger
  // with a rubber band, and on release the last ~90 ms of motion give a velocity (px/ms).
  // power 0 = no flick (snap back), 1 = gentle flick, 2 = strong flick. Settings › Flick physics
  // switches it off (clicks still work) and picks Light / Normal / Heavy (how hard you must flick).
  M.FLICK_LEVELS = {
    light:  { min: 0.22, strong: 0.75, dist: 40, far: 120 },
    normal: { min: 0.35, strong: 1.10, dist: 60, far: 170 },
    heavy:  { min: 0.55, strong: 1.60, dist: 85, far: 230 }
  };
  M.flickOn = true;
  M.flickStrength = 'normal';
  // Rubber band: follows 1:1 near zero, then resists towards +/-limit.
  M.rubber = function (x, limit) { return limit * Math.tanh(x / limit); };
  M.flickPower = function (dx, vx) {
    const L = M.FLICK_LEVELS[M.flickStrength] || M.FLICK_LEVELS.normal;
    const sp = Math.abs(vx), d = Math.abs(dx);
    if (sp >= L.strong || d >= L.far) return 2;
    if (sp >= L.min || d >= L.dist) return 1;
    return 0;
  };
  M.Flick = function (el, o) {
    o = o || {};
    const slop = o.slop || 6, axis = o.axis || 'x';
    let st = null, eatClick = false;
    const down = (e) => {
      if (!M.flickOn || e.button !== 0 || (o.enabled && !o.enabled())) return;
      st = { id: e.pointerId, x0: e.clientX, y0: e.clientY, drag: false, s: [{ x: e.clientX, y: e.clientY, t: e.timeStamp }] };
      try { el.setPointerCapture(e.pointerId); } catch (_) {}   // keep tracking past the button edge
    };
    const move = (e) => {
      if (!st || e.pointerId !== st.id) return;
      const dx = e.clientX - st.x0, dy = e.clientY - st.y0;
      if (!st.drag) {
        if (axis === 'xy') { if (Math.hypot(dx, dy) < slop) return; } else {
          const main = axis === 'x' ? Math.abs(dx) : Math.abs(dy), cross = axis === 'x' ? Math.abs(dy) : Math.abs(dx);
          if (main < slop || main < cross) { if (cross > slop * 2) st = null; return; }
        }
        st.drag = true;
        el.classList.add('is-flicking');
        if (o.onStart) o.onStart();
      }
      e.preventDefault();
      st.s.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
      while (st.s.length > 2 && e.timeStamp - st.s[0].t > 90) st.s.shift();
      if (o.onMove) o.onMove(axis === 'y' ? dy : dx, M.level() === 'full', dy);
    };
    const up = (e) => {
      if (!st || e.pointerId !== st.id) return;
      const s = st; st = null;
      if (!s.drag) return;              // a plain click: let the click handler run
      el.classList.remove('is-flicking');
      eatClick = true;                  // a drag never also counts as a click
      setTimeout(() => { eatClick = false; }, 0);
      const a = s.s[0], b = s.s[s.s.length - 1], dt = Math.max(1, b.t - a.t);
      const stale = e.timeStamp - b.t > 90;
      const dx = e.clientX - s.x0, dy = e.clientY - s.y0;
      const vx = stale ? 0 : (b.x - a.x) / dt, vy = stale ? 0 : (b.y - a.y) / dt;
      // 'xy': the dominant axis of the throw decides the direction
      const ax = axis === 'xy' ? (Math.abs(vx) + Math.abs(dx) / 300 >= Math.abs(vy) + Math.abs(dy) / 300 ? 'x' : 'y') : axis;
      const d = ax === 'x' ? dx : dy, v = ax === 'x' ? vx : vy;
      const power = (e.type === 'pointercancel' || stale) ? 0 : axis === 'xy' ? M.flickPower(Math.hypot(dx, dy), Math.hypot(vx, vy)) : M.flickPower(d, v);
      const dir = Math.sign(Math.abs(v) > 0.05 ? v : d) || 1;
      if (o.onRelease) o.onRelease({ d, v, dir, power, axis: ax, dx, dy, vx, vy });
    };
    const click = (e) => { if (eatClick) { eatClick = false; e.stopImmediatePropagation(); e.preventDefault(); } };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', click, true);
    el.style.touchAction = axis === 'xy' ? 'none' : axis === 'x' ? 'pan-y' : 'pan-x';
    return { destroy() { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('click', click, true); } };
  };
  // Spring an element back from a dragged offset (rubber band release).
  M.snapBack = function (el, from, axis, fromY) {
    el.style.transform = '';
    if ((!from && !fromY) || M.level() !== 'full') return;
    const t = (v) => (axis === 'xy' ? 'translate(' + v + 'px,' + (fromY || 0) + 'px)' : (axis === 'y' ? 'translateY(' : 'translateX(') + v + 'px)');
    el.animate([{ transform: t(from) }, { transform: 'none' }], { duration: 420, easing: M.spring });
  };

  window.Motion = M;
})();
