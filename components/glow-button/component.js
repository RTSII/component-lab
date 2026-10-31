// Glow button (component #2, P1): the proof component for the core@1 base template. A single call-to-action
// button with a neon edge, a hover sheen and an optional icon. Built from components/_template with
// new-component.py: manifest.json inherits the core controls (colours, opacity, glow, radius, text scale,
// speed, easing and the IX_* interaction slots), hides the two that do not apply to a button (SIZE_W: a
// button sizes to its label; IX_DRAG: a button is not dragged), and adds its own extras (Button group).
// Every control with a "css" key is a CSS custom property the lab sets on the frame; this file only wires
// the interaction slots and the extras that switch markup (icon, sheen, pulse ring). No helix code.
Lab.register({
  title: 'Glow button',
  css: ['style.css'],
  markup: 'markup.html',
  animated: false,
  frames: {
    '1600x770': { w: 360, h: 200 },
    '1366x768': { w: 340, h: 180 }
  },

  mount(frame, ctx) {
    const host = frame.querySelector('.gb-host') || frame;
    host.innerHTML =
      '<button class="gb" type="button">' +
      '<span class="gb-sheen" aria-hidden="true"></span>' +
      '<span class="gb-label">Start quiz</span>' +
      '<span class="gb-icon" aria-hidden="true"></span>' +
      '</button>';
    const btn = host.querySelector('.gb');
    const ICONS = {
      none: '',
      arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
      plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
    };
    let P = (ctx && ctx.params) || {};
    let icon = null;

    // ---- core interaction slots (mode "fx"): IX_HOVER / IX_PRESS / IX_TOUCH / IX_KEY ----
    // A touch either behaves like hover + press (default) or is ignored (no hover/press styles, no click).
    const onDown = (e) => {
      if (e.pointerType === 'touch' && P.IX_TOUCH === 'ignore') { host.dataset.touchOff = '1'; return; }
      delete host.dataset.touchOff;
      if (e.pointerType === 'touch') host.dataset.touching = '1';
    };
    const onUp = () => { delete host.dataset.touching; };
    const onClick = (e) => {
      e.preventDefault();
      if (host.dataset.touchOff) return;
      btn.classList.remove('is-fired');
      void btn.offsetWidth;            // restart the click flash
      btn.classList.add('is-fired');
    };
    btn.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    btn.addEventListener('click', onClick);

    const sync = () => {
      const d = host.dataset;
      const set = (k, v) => { if (d[k] !== v) d[k] = v; };
      set('hover', String(P.IX_HOVER || 'none'));
      set('press', String(P.IX_PRESS || 'none'));
      set('key', P.IX_KEY === false ? 'off' : 'on');
      set('sheen', P.BTN_SHEEN === false ? 'off' : 'on');
      set('pulse', P.BTN_PULSE ? 'on' : 'off');
      set('case', String(P.BTN_CASE || 'normal'));
      const ic = String(P.BTN_ICON || 'arrow');
      if (ic !== icon) { icon = ic; host.querySelector('.gb-icon').innerHTML = ICONS[ic] || ''; set('icon', ic); }
      btn.tabIndex = P.IX_KEY === false ? -1 : 0;
    };
    sync();
    return {
      render(params) { P = params || P; sync(); },
      destroy() {
        btn.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        btn.removeEventListener('click', onClick);
      }
    };
  }
});
