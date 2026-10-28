// Component Lab v2 controls, radial dial, gooey colour arc, role page, and hold-to-confirm button.
// Plain IIFE sharing window.Lab (initialized by lab/lab.js via Lab.initControls).
(function () {
  'use strict';

  window.Lab = window.Lab || {};

  window.Lab.initControls = function (ctx) {
    const {
      el, esc, svg, M, S, BASIC_CAP,
      getDef, getVars, getById, getP, getUi,
      hasPro, same, fmt, decimals, setValue,
      swatchesFor, allPresets, presetDots, applyPreset,
      userPalette, featuredOverrides, store, toast, push, buildSeg, syncSeg
    } = ctx;

    function buildPresets() {
      const wrapEl = el('div', 'presets');
      wrapEl.appendChild(el('div', 'ctl-label sub', 'Palettes from this project'));
      const row = el('div', 'preset-row');
      allPresets().forEach((p) => {
        const b = el('button', 'preset', '<span class="preset-dots">' + presetDots(p).map((c) => '<i style="background:' + c + '"></i>').join('') + '</span><span>' + esc(p.name) + '</span>');
        b.type = 'button';
        b.title = p.colors ? 'Apply ' + p.name + ' to every colour' : 'Back to the component\u2019s own colours';
        b.addEventListener('click', () => applyPreset(p));
        row.appendChild(b);
      });
      wrapEl.appendChild(row);
      return wrapEl;
    }

    function starBtn(v) {
      const b = el('button', 'star' + (v.featured ? ' is-on' : ''), svg('star'));
      b.type = 'button';
      b.setAttribute('aria-pressed', v.featured ? 'true' : 'false');
      b.title = v.featured ? 'Featured in Basic (click to remove)' : 'Feature in Basic';
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const vars = getVars(), def = getDef();
        const count = vars.filter((x) => x.featured).length;
        if (!v.featured && count >= BASIC_CAP) { toast('Basic holds ' + BASIC_CAP + ' controls. Unstar one first.'); return; }
        v.featured = !v.featured;
        const ov = featuredOverrides();
        ov[v.id] = v.featured;
        store.set('featured:' + def.id, ov);
        b.classList.toggle('is-on', v.featured);
        b.setAttribute('aria-pressed', v.featured ? 'true' : 'false');
        b.title = v.featured ? 'Featured in Basic (click to remove)' : 'Feature in Basic';
        toast(v.featured ? v.label + ' is now in Basic (' + (count + 1) + '/' + BASIC_CAP + ').' : v.label + ' removed from Basic.');
      });
      return b;
    }

    function wireClickToType(v, out) {
      out.classList.add('is-editable');
      out.title = 'Click to type an exact value';
      out.addEventListener('click', (e) => {
        e.stopPropagation();
        if (out.querySelector('.val-in')) return;
        const P = getP();
        const inp = el('input', 'val-in');
        Object.assign(inp, { type: 'number', step: v.step || 1, min: v.min, max: v.max, value: P[v.id] });
        out.textContent = '';
        out.appendChild(inp);
        inp.focus();
        inp.select();
        let done = false;
        const finish = (commit) => {
          if (done) return;
          done = true;
          if (commit && inp.value !== '' && !isNaN(Number(inp.value))) {
            const st = v.step || 1;
            let val = Number(inp.value);
            if (v.min != null) val = Math.max(v.min, val);
            if (v.max != null) val = Math.min(v.max, val);
            val = +val.toFixed(decimals(st));
            setValue(v.id, val);
          }
          out.textContent = fmt(v, getP()[v.id]);
        };
        inp.addEventListener('keydown', (ke) => {
          if (ke.key === 'Enter') { ke.preventDefault(); finish(true); }
          else if (ke.key === 'Escape') { ke.preventDefault(); finish(false); }
        });
        inp.addEventListener('blur', () => finish(true));
      });
    }

    function ctlRow(v, opts) {
      const P = getP();
      const compact = !!(opts && opts.compact);
      const sigOn = v.signature && hasPro('signatureMarks');
      const row = el('div', 'ctl ctl-' + v.control + (compact ? ' is-compact' : '') + (sigOn ? ' is-sig' : ''));
      row.dataset.id = v.id;
      const head = el('div', 'ctl-head');
      const lab = el('label', 'ctl-label', (sigOn ? svg('sig', 'sig-ico') : '') + esc(compact && v.short ? v.short : v.label));
      if (sigOn) row.title = 'Signature feature of this component';
      const tipExtra = [v.where, v.hint || v.note].filter(Boolean).join(' \u00b7 ');
      lab.title = (tipExtra ? tipExtra + '\n' : '') + v.id + (v.css ? '  ' + v.css : '') + '\nDouble-click to reset';
      lab.addEventListener('dblclick', () => setValue(v.id, v.default));
      const out = el('span', 'ctl-val', esc(fmt(v, P[v.id])));
      if (v.control === 'slider' || v.control === 'radial') wireClickToType(v, out);
      head.append(lab, out);
      if (hasPro('starCurate')) head.appendChild(starBtn(v));
      row.appendChild(head);
      const uid = 'c-' + v.id;

      if (v.control === 'slider') {
        lab.htmlFor = uid;
        const r = el('input', 'range');
        Object.assign(r, { type: 'range', id: uid, min: v.min, max: v.max, step: v.step, value: P[v.id] });
        const paint = () => r.style.setProperty('--p', ((r.value - v.min) / (v.max - v.min || 1) * 100).toFixed(2) + '%');
        paint();
        r.addEventListener('input', () => { setValue(v.id, r.value, { quiet: true }); paint(); if (!out.querySelector('.val-in')) out.textContent = fmt(v, getP()[v.id]); });
        row.appendChild(r);
      } else if (v.control === 'swatch-role') {
        const line = el('div', 'swatch-line');
        if (!hasPro('accordion') && M.level() === 'full') {
          const trig = el('button', 'swatch-trigger', '<span class="sw" style="background:' + P[v.id] + '"></span><span class="sw-hex">' + esc(String(P[v.id]).toUpperCase()) + '</span>');
          trig.type = 'button';
          trig.setAttribute('aria-haspopup', 'true');
          trig.setAttribute('aria-label', v.label + ': pick a colour');
          trig.addEventListener('click', (e) => { e.stopPropagation(); Arc.toggle(trig, v); });
          line.appendChild(trig);
          out.textContent = '';
        } else {
          const chips = el('div', 'chips');
          swatchesFor(v, compact ? 4 : 6).forEach((c) => chips.appendChild(chip(v, c)));
          line.appendChild(chips);
        }
        const more = el('button', 'icon-btn more-btn', svg('chev'));
        more.type = 'button';
        more.setAttribute('aria-label', 'All colours for ' + v.label);
        more.title = 'All colours';
        more.addEventListener('click', () => push({ type: 'role', id: v.id }));
        line.appendChild(more);
        row.appendChild(line);
      } else if (v.control === 'switch') {
        const sw = el('button', 'switch', '<span class="knob"></span>');
        sw.type = 'button'; sw.id = uid;
        sw.setAttribute('role', 'switch');
        sw.setAttribute('aria-checked', P[v.id] ? 'true' : 'false');
        sw.setAttribute('aria-label', v.label);
        sw.addEventListener('click', () => setValue(v.id, !getP()[v.id]));
        head.insertBefore(sw, out.nextSibling);
        out.remove();
        row.classList.add('ctl-inline');
      } else if (v.control === 'segmented') {
        const seg = el('div', 'seg seg-sm');
        seg.setAttribute('role', 'radiogroup');
        seg.setAttribute('aria-label', v.label);
        buildSeg(seg, v.options.map((o) => ({ value: o.value, label: o.label })), P[v.id], (val) => setValue(v.id, val, { quiet: true }) || (out.textContent = fmt(v, getP()[v.id])), { equal: true });
        row.appendChild(seg);
      } else if (v.control === 'radial') {
        row.appendChild(dialEl(v, out));
      } else if (v.control === 'select') {
        lab.htmlFor = uid;
        const s = el('select', 'lab-select');
        s.id = uid;
        v.options.forEach((o) => { const op = el('option', null, esc(o.label)); op.value = o.value; s.appendChild(op); });
        s.value = String(P[v.id]);
        s.addEventListener('change', () => setValue(v.id, s.value));
        row.appendChild(s);
      }
      return row;
    }

    function dialEl(v, out) {
      const isDeg = v.unit === '°';
      const d = el('div', 'dial');
      d.tabIndex = 0;
      d.setAttribute('role', 'slider');
      d.setAttribute('aria-label', v.label);
      d.setAttribute('aria-valuemin', v.min);
      d.setAttribute('aria-valuemax', v.max);
      d.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="dial-face" cx="32" cy="32" r="27"/><path class="dial-range"/><path class="dial-arc"/><line class="dial-needle" x1="32" y1="32" x2="32" y2="14"/><circle class="dial-hub" cx="32" cy="32" r="3.2"/></svg>';
      const a0 = isDeg ? v.min : -135, span = isDeg ? Math.min(359.9, v.max - v.min) : 270;
      const angOf = (val) => (isDeg ? Number(val) : a0 + ((val - v.min) / (v.max - v.min || 1)) * span);
      const pt = (a, r) => [(32 + r * Math.sin(a * Math.PI / 180)).toFixed(2), (32 - r * Math.cos(a * Math.PI / 180)).toFixed(2)];
      const arc = (a1, a2, r) => { if (a2 - a1 < 0.5) return ''; const p1 = pt(a1, r), p2 = pt(a2, r); return 'M' + p1.join(' ') + ' A' + r + ' ' + r + ' 0 ' + (a2 - a1 > 180 ? 1 : 0) + ' 1 ' + p2.join(' '); };
      const paint = () => {
        const P = getP();
        const a = angOf(P[v.id]);
        d.querySelector('.dial-range').setAttribute('d', arc(a0, a0 + span, 24));
        d.querySelector('.dial-arc').setAttribute('d', arc(a0, a, 24));
        const tip = pt(a, 18), n = d.querySelector('.dial-needle');
        n.setAttribute('x2', tip[0]); n.setAttribute('y2', tip[1]);
        d.setAttribute('aria-valuenow', P[v.id]);
        d.setAttribute('aria-valuetext', fmt(v, P[v.id]));
      };
      const put = (val) => {
        const st = v.step || 1;
        val = Math.min(v.max, Math.max(v.min, Math.round(val / st) * st));
        setValue(v.id, +val.toFixed(decimals(st)), { quiet: true });
        paint();
        if (out && !out.querySelector('.val-in')) out.textContent = fmt(v, getP()[v.id]);
      };
      const fromEvent = (e) => {
        const r = d.getBoundingClientRect();
        let a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
        if (isDeg) {
          a = (a + 360) % 360;
          if (a < v.min || a > v.max) { const mid = (v.max + (360 - v.max + v.min) / 2) % 360; a = a > v.max && a < mid ? v.max : v.min; }
          put(a);
        } else put(v.min + ((Math.min(135, Math.max(-135, a)) + 135) / 270) * (v.max - v.min));
      };
      d.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        d.focus({ preventScroll: true });
        d.setPointerCapture(e.pointerId);
        d.classList.add('is-drag');
        fromEvent(e);
        const mv = (ev) => fromEvent(ev);
        const upf = () => { d.classList.remove('is-drag'); d.removeEventListener('pointermove', mv); d.removeEventListener('pointerup', upf); d.removeEventListener('pointercancel', upf); };
        d.addEventListener('pointermove', mv);
        d.addEventListener('pointerup', upf);
        d.addEventListener('pointercancel', upf);
      });
      d.addEventListener('keydown', (e) => {
        const st = (v.step || 1) * (e.shiftKey ? 10 : 1);
        const k = { ArrowUp: st, ArrowRight: st, ArrowDown: -st, ArrowLeft: -st }[e.key];
        if (k != null) { e.preventDefault(); put(Number(getP()[v.id]) + k); }
        else if (e.key === 'Home') { e.preventDefault(); put(v.min); }
        else if (e.key === 'End') { e.preventDefault(); put(v.max); }
      });
      d._paint = paint;
      paint();
      return d;
    }

    function chip(v, c) {
      const P = getP();
      const b = el('button', 'chip' + (same(P[v.id], c) ? ' is-on' : ''));
      b.type = 'button';
      b.style.setProperty('--c', c);
      b.dataset.c = c;
      b.title = c.toUpperCase() + (same(c, v.default) ? ' (default)' : '');
      b.setAttribute('aria-label', v.label + ' ' + c);
      b.addEventListener('click', () => setValue(v.id, c));
      return b;
    }

    function syncRow(id) {
      const byId = getById(), P = getP();
      const v = byId[id];
      if (!v) return;
      document.querySelectorAll('.ctl[data-id="' + id + '"]').forEach((row) => {
        const out = row.querySelector('.ctl-val');
        if (out && !row.querySelector('.swatch-trigger') && !out.querySelector('.val-in')) out.textContent = fmt(v, P[id]);
        const r = row.querySelector('input.range');
        if (r) { r.value = P[id]; r.style.setProperty('--p', ((P[id] - v.min) / (v.max - v.min || 1) * 100).toFixed(2) + '%'); }
        const sw = row.querySelector('.switch');
        if (sw) sw.setAttribute('aria-checked', P[id] ? 'true' : 'false');
        const seg = row.querySelector('.seg');
        if (seg) syncSeg(seg, null, P[id]);
        const sel = row.querySelector('select');
        if (sel) sel.value = String(P[id]);
        const dl = row.querySelector('.dial');
        if (dl && dl._paint) dl._paint();
        const trig = row.querySelector('.swatch-trigger');
        if (trig) { trig.querySelector('.sw').style.background = P[id]; trig.querySelector('.sw-hex').textContent = String(P[id]).toUpperCase(); }
        row.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', same(c.dataset.c, P[id])));
        const hexIn = row.querySelector('.hex-in');
        if (hexIn && document.activeElement !== hexIn) hexIn.value = String(P[id]).toUpperCase();
        const col = row.querySelector('input[type=color]');
        if (col) col.value = P[id];
      });
    }

    function buildRole(id, inner) {
      const byId = getById(), P = getP(), ui = getUi();
      const v = byId[id];
      if (!v) return '';
      const row = el('div', 'ctl ctl-role');
      row.dataset.id = id;
      const head = el('div', 'ctl-head');
      head.append(el('span', 'ctl-label', 'Current'), el('span', 'ctl-val', esc(String(P[id]).toUpperCase())));
      row.appendChild(head);
      const cur = el('div', 'role-current', '<span class="sw-big" style="background:' + P[id] + '"></span><span class="role-note">' + esc(v.role) + ' role · ' + esc(v.id) + '</span>');
      row.appendChild(cur);
      const src = ui.paletteSource === 'user' && userPalette() ? 'My palette' : 'Project palette';
      row.appendChild(el('div', 'ctl-label sub', src + ', best matches first'));
      const chips = el('div', 'chips chips-wrap');
      swatchesFor(v, 18).forEach((c) => chips.appendChild(chip(v, c)));
      row.appendChild(chips);
      const actions = el('div', 'role-actions');
      const reset = el('button', 'link-btn', 'Use default (' + esc(String(v.default).toUpperCase()) + ')');
      reset.type = 'button';
      reset.addEventListener('click', () => setValue(id, v.default));
      const customBtn = el('button', 'link-btn', 'Custom…');
      customBtn.type = 'button';
      actions.append(reset, customBtn);
      row.appendChild(actions);
      const custom = el('div', 'custom-box');
      const colIn = el('input', 'color-in');
      colIn.type = 'color'; colIn.value = P[id]; colIn.setAttribute('aria-label', 'Colour picker');
      const hexIn = el('input', 'hex-in');
      hexIn.type = 'text'; hexIn.value = String(P[id]).toUpperCase(); hexIn.maxLength = 7; hexIn.spellcheck = false; hexIn.setAttribute('aria-label', 'Hex value');
      colIn.addEventListener('input', () => setValue(id, colIn.value));
      hexIn.addEventListener('input', () => { const h = /^#?[0-9a-f]{6}$/i.test(hexIn.value.trim()) ? S.hex('#' + hexIn.value.trim().replace('#', '')) : null; hexIn.classList.toggle('is-bad', !h); if (h) setValue(id, h); });
      custom.append(colIn, hexIn);
      row.appendChild(custom);
      customBtn.addEventListener('click', () => { custom.classList.toggle('is-open'); if (custom.classList.contains('is-open')) hexIn.focus(); });
      const syncBig = () => { cur.querySelector('.sw-big').style.background = getP()[id]; head.querySelector('.ctl-val').textContent = String(getP()[id]).toUpperCase(); };
      row.addEventListener('click', () => requestAnimationFrame(syncBig));
      row.addEventListener('input', () => requestAnimationFrame(syncBig));
      inner.appendChild(row);
      return v.category === 'color' ? 'Colour' : '';
    }

    const Arc = (function () {
      let node = null, owner = null, v = null;
      const R = 60, N = 6;
      const span = () => [-58, 58];
      function pts() {
        const out = [];
        const [A0, A1] = span();
        for (let i = 0; i < N; i++) { const a = (A0 + (A1 - A0) * (i / (N - 1))) * Math.PI / 180; out.push({ x: Math.cos(a) * R, y: Math.sin(a) * R }); }
        return out;
      }
      function open(trig, variable) {
        close(true);
        const P = getP();
        owner = trig; v = variable;
        const r = trig.querySelector('.sw').getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        node = el('div', 'arc');
        node.style.left = cx + 'px';
        node.style.top = cy + 'px';
        node.setAttribute('role', 'listbox');
        node.setAttribute('aria-label', v.label + ' colours');
        const goo = el('div', 'arc-goo');
        const topL = el('div', 'arc-top');
        goo.appendChild(el('span', 'arc-blob arc-core'));
        const colors = swatchesFor(v, N);
        const P2 = pts();
        const full = M.level() === 'full';
        colors.forEach((c, i) => {
          const p = P2[i];
          const blob = el('span', 'arc-blob');
          goo.appendChild(blob);
          const dot = el('button', 'arc-dot' + (same(c, P[v.id]) ? ' is-on' : ''));
          dot.type = 'button';
          dot.style.setProperty('--c', c);
          dot.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
          dot.title = c.toUpperCase() + (same(c, v.default) ? ' (default)' : '');
          dot.setAttribute('role', 'option');
          dot.setAttribute('aria-label', c);
          dot.addEventListener('click', (e) => {
            e.stopPropagation();
            setValue(v.id, c);
            if (node) node.querySelectorAll('.arc-dot').forEach((d) => d.classList.toggle('is-on', d === dot));
            setTimeout(() => close(false, true), 140);
          });
          topL.appendChild(dot);
          if (full) {
            blob.animate([{ transform: 'translate(0,0) scale(0.6)' }, { transform: 'translate(' + p.x + 'px,' + p.y + 'px) scale(1)' }], { duration: 520, delay: i * 28, easing: M.spring, fill: 'both' });
            dot.animate([{ transform: 'translate(' + p.x * 0.4 + 'px,' + p.y * 0.4 + 'px) scale(0.4)', opacity: 0 }, { transform: 'translate(' + p.x + 'px,' + p.y + 'px) scale(1)', opacity: 1 }], { duration: 480, delay: 60 + i * 28, easing: M.spring, fill: 'both' });
          } else blob.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
        });
        const center = el('span', 'arc-center');
        center.style.background = P[v.id];
        topL.appendChild(center);
        node.append(goo, topL);
        document.body.appendChild(node);
        trig.classList.add('is-open');
        trig.setAttribute('aria-expanded', 'true');
        const first = topL.querySelector('.arc-dot.is-on') || topL.querySelector('.arc-dot');
        if (first) first.focus({ preventScroll: true });
      }
      function close(instant, focusOwner) {
        if (!node) return;
        const n = node, t = owner;
        node = null; owner = null; v = null;
        if (t) {
          t.classList.remove('is-open');
          t.setAttribute('aria-expanded', 'false');
          if (focusOwner) t.focus({ preventScroll: true });
        }
        if (instant || M.level() !== 'full') { n.remove(); return; }
        n.classList.add('is-closing');
        const blobs = n.querySelectorAll('.arc-blob:not(.arc-core)');
        n.querySelectorAll('.arc-dot').forEach((d) => d.animate([{ opacity: 1 }, { opacity: 0, transform: 'translate(0,0) scale(0.3)' }], { duration: 200, easing: M.easeOut, fill: 'forwards' }));
        const anims = [...blobs].map((b) => b.animate([{}, { transform: 'translate(0,0) scale(0.5)' }], { duration: 240, easing: M.settle, fill: 'forwards' }));
        Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(() => n.remove());
      }
      return {
        open, close,
        toggle(trig, variable) { if (node && owner === trig) close(false, true); else open(trig, variable); },
        get isOpen() { return !!node; },
        contains(t) { return !!node && node.contains(t); }
      };
    })();

    function holdButton(label, ms, fn) {
      const b = el('button', 'hold-btn', '<span class="hold-fill"></span><span class="hold-label">' + esc(label) + '</span>');
      b.type = 'button';
      b.title = 'Press and hold';
      const fill = b.querySelector('.hold-fill');
      let a = null;
      const start = (e) => {
        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        if (e.type === 'keydown') { e.preventDefault(); if (e.repeat) return; }
        if (a) return;
        b.classList.add('is-holding');
        a = fill.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: ms, easing: 'linear', fill: 'forwards' });
        a.finished.then(() => {
          a = null;
          b.classList.remove('is-holding');
          b.classList.add('is-done');
          fn();
          setTimeout(() => { b.classList.remove('is-done'); fill.getAnimations().forEach((x) => x.cancel()); }, 900);
        }).catch(() => {});
      };
      const stop = () => {
        if (!a) return;
        const cur = a;
        a = null;
        b.classList.remove('is-holding');
        const p = Number(getComputedStyle(fill).transform.split(',')[0].replace('matrix(', '')) || 0;
        cur.cancel();
        fill.animate([{ transform: 'scaleX(' + p + ')' }, { transform: 'scaleX(0)' }], { duration: 220, easing: M.easeOut });
      };
      b.addEventListener('pointerdown', start);
      b.addEventListener('keydown', start);
      ['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur'].forEach((ev) => b.addEventListener(ev, stop));
      return b;
    }

    return { buildPresets, starBtn, ctlRow, dialEl, chip, syncRow, buildRole, Arc, holdButton };
  };
})();

