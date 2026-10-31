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
    const tierNow = () => (ctx.getTier ? ctx.getTier() : 'pro');   // 'free' | 'mid' | 'pro' (lab.js TIER)

    // Same snapping as <input type=range>: steps counted from min, clamped to [min, max].
    function snapStep(raw, min, max, step) {
      const st = step || 1;
      let val = Number(raw);
      if (!isFinite(val)) val = min;
      val = min + Math.round((val - min) / st) * st;
      val = Math.min(max, Math.max(min, val));
      return +val.toFixed(Math.max(decimals(st), decimals(min)));
    }

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
      const isTempoDeck = (v.master === 'speed' || v.control === 'tempo' || v.variant === 'tempo') && (hasPro('tempoDeck') || v.control === 'tempo' || v.variant === 'tempo');
      // Mid: Speed as a real slider (its own range / step) with three preset pads under it (0.5x / 1x / 2x, only
      // the ones inside its range) instead of the tempo deck (audit must-fix a)
      const isRatePads = !isTempoDeck && v.master === 'speed' && v.control === 'slider' && tierNow() === 'mid';
      const isVertFader = !isTempoDeck && (v.control === 'fader' || v.variant === 'fader' || v.variant === 'volume' || v.variant === 'channel');
      const isFxUnit = (v.control === 'fx' || v.widget === 'fx-unit' || (v.variant === 'fx' && v.control !== 'swatch-role')) && (hasPro('accordion') || v.control === 'fx' || v.variant === 'fx');
      const isPadSwitch = v.control === 'switch' && (v.variant === 'pad' || v.control === 'pad' || v.variant === 'button');
      const isPadBtn = !isPadSwitch && (v.control === 'pad' || v.variant === 'pad' || v.variant === 'button');
      if ((v.control === 'slider' || v.control === 'radial' || isTempoDeck || isVertFader || isFxUnit)) wireClickToType(v, out);
      head.append(lab, out);
      if (hasPro('starCurate')) head.appendChild(starBtn(v));
      row.appendChild(head);
      const uid = 'c-' + v.id;

      if (isRatePads) {
        row.classList.add('ctl-rate-pads');
        lab.htmlFor = uid;
        const r = el('input', 'range');
        Object.assign(r, { type: 'range', id: uid, min: v.min, max: v.max, step: v.step, value: P[v.id] });
        const paint = () => r.style.setProperty('--p', ((r.value - v.min) / (v.max - v.min || 1) * 100).toFixed(2) + '%');
        paint();
        r.addEventListener('input', () => { setValue(v.id, r.value, { quiet: true }); paint(); if (!out.querySelector('.val-in')) out.textContent = fmt(v, getP()[v.id]); });
        row.appendChild(r);
        const seg = el('div', 'seg seg-sm');
        seg.setAttribute('role', 'radiogroup');
        seg.setAttribute('aria-label', v.label + ' presets');
        const pads = [0.5, 1, 2].filter((x) => x >= v.min && x <= v.max).map((x) => ({ value: x, label: x + '\u00d7' }));
        buildSeg(seg, pads, P[v.id], (val) => { setValue(v.id, val, { quiet: true }); out.textContent = fmt(v, getP()[v.id]); }, { equal: true });
        row.appendChild(seg);
      } else if (isTempoDeck) {
        row.classList.add('ctl-tempo-deck');
        row.appendChild(tempoDeckEl(v, out));
      } else if (isVertFader) {
        row.classList.add('ctl-vert-fader');
        row.appendChild(faderEl(v, out));
      } else if (isFxUnit) {
        row.classList.add('ctl-fx-cell');
        head.remove();
        row.appendChild(fxUnitEl(v, out));
      } else if (isPadSwitch) {
        row.classList.add('ctl-pad-cell');
        head.remove();
        row.appendChild(padSwitchEl(v));
      } else if (isPadBtn && v.control === 'switch') {
        row.classList.add('ctl-pad-btn');
        out.remove();
        row.appendChild(padBtnEl(v));
      } else if (v.control === 'slider') {
        lab.htmlFor = uid;
        const r = el('input', 'range');
        Object.assign(r, { type: 'range', id: uid, min: v.min, max: v.max, step: v.step, value: P[v.id] });
        const paint = () => r.style.setProperty('--p', ((r.value - v.min) / (v.max - v.min || 1) * 100).toFixed(2) + '%');
        paint();
        r.addEventListener('input', () => { setValue(v.id, r.value, { quiet: true }); paint(); if (!out.querySelector('.val-in')) out.textContent = fmt(v, getP()[v.id]); });
        row.appendChild(r);
      } else if (v.control === 'swatch-role') {
        const line = el('div', 'swatch-line');
        const t = tierNow();
        if (t === 'free') {
          // Base: one line of 8 swatches (default first, then the best palette matches); no colour page
          const chips = el('div', 'chips chips-8');
          swatchesFor(v, 8).forEach((c) => chips.appendChild(chip(v, c)));
          line.appendChild(chips);
          row.appendChild(line);
          return row;
        }
        if ((t === 'mid' || !hasPro('accordion')) && M.level() === 'full') {
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
        out.remove();
        const isCompact = (v.variant === 'compact' || compact);
        const s = el('select', 'lab-select' + (isCompact ? ' is-compact' : ''));
        s.id = uid;
        v.options.forEach((o) => { const op = el('option', null, esc(o.label)); op.value = o.value; s.appendChild(op); });
        s.value = String(P[v.id]);
        s.addEventListener('change', () => setValue(v.id, s.value));
        if (isCompact) {
          head.insertBefore(s, head.querySelector('.star'));
          row.classList.add('ctl-inline', 'ctl-select-inline');
        } else {
          row.appendChild(s);
        }
      }
      // Deck caption: the manifest's deckLabel first ("MASTER" / "CH 1" / "CH 2"), then the generic variant / channel rule
      if (v.deckLabel) {
        row.appendChild(el('div', 'xdj-deck-sub', esc(v.deckLabel)));
      } else if (v.variant === 'master' || v.variant === 'gain') {
        row.appendChild(el('div', 'xdj-deck-sub', 'MASTER'));
      } else if (isVertFader && v.deckCh === 2) {
        row.appendChild(el('div', 'xdj-deck-sub', 'CH 2'));
      } else if (isVertFader && (v.deckCh === 1 || v.variant === 'channel')) {
        row.appendChild(el('div', 'xdj-deck-sub', 'CH 1'));
      }
      return row;
    }

    // Pioneer XDJ-XZ / DDJ-Controller style vertical Tempo Deck
    function tempoDeckEl(v, out) {
      const deck = el('div', 'tempo-deck');
      const min = v.min != null ? v.min : 0.25;
      const max = v.max != null ? v.max : 3;
      const defVal = v.default != null ? v.default : 1;
      const step = v.step || 0.05;
      const span = (max - min) || 1;
      // Linear mapping, exactly like the original range slider: bottom = min, top = max, evenly in between.
      // (Styling only: the default is NOT forced to the middle; its RESET LED / detent sit where the default really is.)
      const valToNorm = (val) => (Math.min(max, Math.max(min, Number(val))) - min) / span;
      const normToVal = (n) => min + Math.min(1, Math.max(0, n)) * span;
      const defPct = Math.min(100, Math.max(0, ((defVal - min) / span) * 100));

      // 19 XDJ-XZ silkscreen ticks spread evenly over the travel (majors at the ends and the middle of travel)
      let ticksHtml = '';
      for (let i = 0; i <= 18; i++) {
        const p = (i / 18) * 100;
        const isMajor = i === 0 || i === 9 || i === 18;
        ticksHtml += '<span class="xdj-tick' + (isMajor ? ' is-major' : '') + '" style="top:' + p.toFixed(2) + '%"><i></i><i></i></span>';
      }

      const pt = (cx, cy, a, r) => [(cx + r * Math.sin(a * Math.PI / 180)).toFixed(2), (cy - r * Math.cos(a * Math.PI / 180)).toFixed(2)];
      const arc = (cx, cy, a1, a2, r) => {
        if (a2 - a1 < 0.5) return '';
        const p1 = pt(cx, cy, a1, r), p2 = pt(cx, cy, a2, r);
        return 'M' + p1.join(' ') + ' A' + r + ' ' + r + ' 0 ' + (a2 - a1 > 180 ? 1 : 0) + ' 1 ' + p2.join(' ');
      };
      // XDJ-XZ On-Jog Display iconic left & right glowing blue/cyan side-wing arcs
      const leftWing = arc(56, 56, 222, 318, 28.5);
      const rightWing = arc(56, 56, 42, 138, 28.5);

      deck.innerHTML =
        '<div class="xdj-platter-col">' +
          '<div class="xdj-Model-bar">' +
            '<span class="xdj-badge">PIONEER DJ \u00b7 XDJ-XZ</span>' +
            '<button type="button" class="xdj-mt" title="Master Tempo indicator">MT</button>' +
          '</div>' +
          '<div class="xdj-jog" tabindex="0" role="slider" aria-label="' + esc(v.label) + ' jog wheel">' +
            '<svg viewBox="0 0 112 112" aria-hidden="true">' +
              '<circle class="xdj-jog-silver" cx="56" cy="56" r="53"/>' +
              '<circle class="xdj-jog-outer" cx="56" cy="56" r="50.5"/>' +
              '<circle class="xdj-jog-dimples" cx="56" cy="56" r="47.8"/>' +
              '<circle class="xdj-jog-platter" cx="56" cy="56" r="43.5"/>' +
              '<circle class="xdj-jog-groove" cx="56" cy="56" r="39.5"/>' +
              '<path class="xdj-jog-range"/>' +
              '<path class="xdj-jog-arc"/>' +
              '<circle class="xdj-jog-screen" cx="56" cy="56" r="33"/>' +
              '<path class="xdj-jog-wing" d="' + leftWing + '"/>' +
              '<path class="xdj-jog-wing" d="' + rightWing + '"/>' +
              '<g class="xdj-jog-rotor">' +
                '<line class="xdj-jog-marker" x1="56" y1="13.5" x2="56" y2="21.5"/>' +
                '<circle class="xdj-jog-cue" cx="56" cy="25.5" r="1.6"/>' +
              '</g>' +
              '<circle class="xdj-jog-screen-rim" cx="56" cy="56" r="33"/>' +
            '</svg>' +
            '<div class="xdj-lcd">' +
              '<span class="xdj-lcd-kicker">TEMPO</span>' +
              '<strong class="xdj-lcd-val"></strong>' +
              '<span class="xdj-lcd-pct"></span>' +
            '</div>' +
          '</div>' +
          '<div class="xdj-btns">' +
            '<button type="button" class="xdj-btn xdj-nudge-dn" title="Pitch bend down (-' + step + ')" aria-label="Decrease tempo">&minus;</button>' +
            '<button type="button" class="xdj-btn xdj-reset" title="TEMPO RESET (' + fmt(v, defVal) + ')">' +
              '<i class="xdj-led"></i><span>RESET</span>' +
            '</button>' +
            '<button type="button" class="xdj-btn xdj-nudge-up" title="Pitch bend up (+' + step + ')" aria-label="Increase tempo">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="xdj-fader-col">' +
          '<div class="xdj-fader-head"><span class="xdj-fader-title">TEMPO</span></div>' +
          '<div class="xdj-fader-pole"><span>+</span><small>' + esc(fmt(v, max)) + '</small></div>' +
          '<div class="xdj-fader" tabindex="0" role="slider" aria-label="' + esc(v.label) + ' vertical tempo fader" aria-valuemin="' + min + '" aria-valuemax="' + max + '">' +
            '<div class="xdj-scale">' + ticksHtml + '</div>' +
            '<span class="xdj-zero-led" title="TEMPO RESET LED (default ' + esc(fmt(v, defVal)) + ')" style="top:' + (100 - defPct).toFixed(2) + '%"></span>' +
            '<span class="xdj-detent-mark" style="top:' + (100 - defPct).toFixed(2) + '%"></span>' +
            '<div class="xdj-slot">' +
              '<div class="xdj-fill"></div>' +
            '</div>' +
            '<div class="xdj-cap">' +
              '<span class="xdj-cap-grip"></span>' +
              '<span class="xdj-cap-line"></span>' +
              '<span class="xdj-cap-grip"></span>' +
            '</div>' +
          '</div>' +
          '<div class="xdj-fader-pole"><span>&minus;</span><small>' + esc(fmt(v, min)) + '</small></div>' +
        '</div>';

      const jog = deck.querySelector('.xdj-jog');
      const fader = deck.querySelector('.xdj-fader');
      const cap = deck.querySelector('.xdj-cap');
      const fill = deck.querySelector('.xdj-fill');
      const lcdVal = deck.querySelector('.xdj-lcd-val');
      const lcdPct = deck.querySelector('.xdj-lcd-pct');
      const resetBtn = deck.querySelector('.xdj-reset');
      const mtBadge = deck.querySelector('.xdj-mt');
      const jogRange = deck.querySelector('.xdj-jog-range');
      const jogArc = deck.querySelector('.xdj-jog-arc');
      const jogRotor = deck.querySelector('.xdj-jog-rotor');

      jogRange.setAttribute('d', arc(56, 56, -135, 135, 43));

      const put = (raw) => {
        setValue(v.id, snapStep(raw, min, max, step), { quiet: true });
        paint();
        if (out && !out.querySelector('.val-in')) out.textContent = fmt(v, getP()[v.id]);
      };

      const paint = () => {
        const cur = Number(getP()[v.id]);
        const norm = valToNorm(cur);
        const topPct = (1 - norm) * 100;
        const zeroTop = 100 - defPct;
        cap.style.top = topPct.toFixed(2) + '%';
        const fTop = Math.min(topPct, zeroTop);
        const fH = Math.max(1.5, Math.abs(topPct - zeroTop));
        fill.style.top = fTop.toFixed(2) + '%';
        fill.style.height = fH.toFixed(2) + '%';

        const ang = -135 + norm * 270;
        jogArc.setAttribute('d', arc(56, 56, -135, ang, 43));
        jogRotor.setAttribute('transform', 'rotate(' + ang.toFixed(1) + ' 56 56)');

        lcdVal.textContent = fmt(v, cur);
        const deltaPct = ((cur - defVal) / (defVal || 1)) * 100;
        const sign = deltaPct > 0.05 ? '+' : '';
        lcdPct.textContent = sign + deltaPct.toFixed(1) + '%';

        const atDef = same(cur, defVal);
        resetBtn.classList.toggle('is-zero', atDef);
        mtBadge.classList.toggle('is-active', !atDef);
        deck.classList.toggle('is-modified', !atDef);
        const zeroLed = deck.querySelector('.xdj-zero-led');
        if (zeroLed) zeroLed.classList.toggle('is-on', atDef);

        fader.setAttribute('aria-valuenow', cur);
        fader.setAttribute('aria-valuetext', fmt(v, cur));
        jog.setAttribute('aria-valuenow', cur);
        jog.setAttribute('aria-valuetext', fmt(v, cur));
      };

      // Vertical Fader pointer drag
      const fromFaderEvent = (e) => {
        const r = fader.getBoundingClientRect();
        const norm = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / Math.max(20, r.height)));
        put(normToVal(norm));
      };
      fader.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        fader.focus({ preventScroll: true });
        fader.setPointerCapture(e.pointerId);
        fader.classList.add('is-drag');
        fromFaderEvent(e);
        const mv = (ev) => fromFaderEvent(ev);
        const up = () => {
          fader.classList.remove('is-drag');
          fader.removeEventListener('pointermove', mv);
          fader.removeEventListener('pointerup', up);
          fader.removeEventListener('pointercancel', up);
        };
        fader.addEventListener('pointermove', mv);
        fader.addEventListener('pointerup', up);
        fader.addEventListener('pointercancel', up);
      });
      fader.addEventListener('dblclick', (e) => { e.stopPropagation(); put(defVal); });

      // Jog wheel drag (supports both vertical drag & circular platter spin)
      jog.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        jog.focus({ preventScroll: true });
        jog.setPointerCapture(e.pointerId);
        jog.classList.add('is-drag');
        const startVal = Number(getP()[v.id]);
        const y0 = e.clientY;
        const r = jog.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        let lastAng = Math.atan2(e.clientX - cx, -(e.clientY - cy)) * 180 / Math.PI;
        let accumDeg = 0;
        const mv = (ev) => {
          const dx = ev.clientX - cx, dy = ev.clientY - cy;
          const dist = Math.hypot(dx, dy);
          const fine = ev.shiftKey ? 0.25 : 1;
          if (dist > 22) {
            const curAng = Math.atan2(dx, -dy) * 180 / Math.PI;
            let dAng = curAng - lastAng;
            if (dAng > 180) dAng -= 360;
            if (dAng < -180) dAng += 360;
            lastAng = curAng;
            accumDeg += dAng * fine;
            put(startVal + (accumDeg / 270) * span);
          } else {
            const dyDrag = (y0 - ev.clientY) * fine;
            put(startVal + (dyDrag / 130) * span);
          }
        };
        const up = () => {
          jog.classList.remove('is-drag');
          jog.removeEventListener('pointermove', mv);
          jog.removeEventListener('pointerup', up);
          jog.removeEventListener('pointercancel', up);
        };
        jog.addEventListener('pointermove', mv);
        jog.addEventListener('pointerup', up);
        jog.addEventListener('pointercancel', up);
      });
      jog.addEventListener('dblclick', (e) => { e.stopPropagation(); put(defVal); });

      // Keyboard & wheel on both fader and jog
      const onKey = (e) => {
        const st = step * (e.shiftKey ? 5 : 1);
        const k = { ArrowUp: st, ArrowRight: st, ArrowDown: -st, ArrowLeft: -st }[e.key];
        if (k != null) { e.preventDefault(); put(Number(getP()[v.id]) + k); }
        else if (e.key === 'Home') { e.preventDefault(); put(min); }
        else if (e.key === 'End') { e.preventDefault(); put(max); }
      };
      const onWheel = (e) => {
        if (document.activeElement !== fader && document.activeElement !== jog && !deck.matches(':hover')) return;
        e.preventDefault();
        const dir = e.deltaY < 0 ? 1 : -1;
        put(Number(getP()[v.id]) + dir * step * (e.shiftKey ? 0.5 : 1));
      };
      fader.addEventListener('keydown', onKey);
      jog.addEventListener('keydown', onKey);
      fader.addEventListener('wheel', onWheel, { passive: false });
      jog.addEventListener('wheel', onWheel, { passive: false });

      // Hardware deck buttons
      resetBtn.addEventListener('click', () => put(defVal));
      deck.querySelector('.xdj-nudge-dn').addEventListener('click', () => put(Number(getP()[v.id]) - step));
      deck.querySelector('.xdj-nudge-up').addEventListener('click', () => put(Number(getP()[v.id]) + step));

      deck._paint = paint;
      paint();
      return deck;
    }

    // Standalone vertical mixer channel fader (for future controls with control: 'fader' or variant: 'fader'/'volume')
    function faderEl(v, out) {
      const wrap = el('div', 'mixer-fader-wrap');
      const min = v.min != null ? v.min : 0;
      const max = v.max != null ? v.max : 1;
      const defVal = v.default != null ? v.default : min;
      const step = v.step || 0.01;
      const span = (max - min) || 1;
      // Linear like the original range slider. Marks sit at the TRUE value positions:
      // the default mark where the default really is, the "0" light where value 0 really is (bipolar ranges only).
      const isBipolar = min < 0 && max > 0;
      const defTop = 100 - Math.min(100, Math.max(0, ((defVal - min) / span) * 100));
      const zeroTop = isBipolar ? (max / span) * 100 : null;   // distance from the top of travel to value 0
      let ticksHtml = '';
      for (let i = 0; i <= 8; i++) {
        const p = i * 12.5;
        const isZero = isBipolar && Math.abs(p - zeroTop) < 0.01;
        ticksHtml += '<span class="xdj-tick' + (isZero ? ' is-zero is-major' : (i === 0 || i === 4 || i === 8 ? ' is-major' : '')) + '" style="top:' + p + '%"><i></i><i></i></span>';
      }
      wrap.innerHTML =
        '<div class="xdj-fader is-channel" tabindex="0" role="slider" aria-label="' + esc(v.label) + '" aria-valuemin="' + min + '" aria-valuemax="' + max + '">' +
          '<div class="xdj-scale">' + ticksHtml + '</div>' +
          (isBipolar ? '<span class="xdj-zero-led" title="0" style="top:' + zeroTop.toFixed(2) + '%"></span>' : '') +
          '<span class="xdj-detent-mark" title="Default ' + esc(fmt(v, defVal)) + '" style="top:' + defTop.toFixed(2) + '%"></span>' +
          '<div class="xdj-slot"><div class="xdj-fill"></div></div>' +
          '<div class="xdj-cap"><span class="xdj-cap-grip"></span><span class="xdj-cap-line"></span><span class="xdj-cap-grip"></span></div>' +
        '</div>';
      const fader = wrap.querySelector('.xdj-fader');
      const cap = wrap.querySelector('.xdj-cap');
      const fill = wrap.querySelector('.xdj-fill');
      const zeroLed = wrap.querySelector('.xdj-zero-led');
      const put = (raw) => {
        setValue(v.id, snapStep(raw, min, max, step), { quiet: true });
        paint();
        if (out && !out.querySelector('.val-in')) out.textContent = fmt(v, getP()[v.id]);
      };
      const paint = () => {
        const cur = Number(getP()[v.id]);
        const norm = Math.min(1, Math.max(0, (cur - min) / span));
        const topPct = (1 - norm) * 100;
        cap.style.top = topPct.toFixed(2) + '%';
        if (isBipolar) {
          const zeroPct = zeroTop;
          if (topPct <= zeroPct) {
            fill.style.top = topPct.toFixed(2) + '%';
            fill.style.height = (zeroPct - topPct).toFixed(2) + '%';
          } else {
            fill.style.top = zeroPct + '%';
            fill.style.height = (topPct - zeroPct).toFixed(2) + '%';
          }
          if (zeroLed) zeroLed.classList.toggle('is-on', Math.abs(cur) < Math.max(1e-6, step / 2));
        } else {
          fill.style.top = topPct.toFixed(2) + '%';
          fill.style.height = (norm * 100).toFixed(2) + '%';
        }
        fader.setAttribute('aria-valuenow', cur);
        fader.setAttribute('aria-valuetext', fmt(v, cur));
      };
      const fromEv = (e) => {
        const r = fader.getBoundingClientRect();
        const norm = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / Math.max(20, r.height)));
        put(min + norm * span);
      };
      fader.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        fader.focus({ preventScroll: true });
        fader.setPointerCapture(e.pointerId);
        fader.classList.add('is-drag');
        fromEv(e);
        const mv = (ev) => fromEv(ev);
        const up = () => { fader.classList.remove('is-drag'); fader.removeEventListener('pointermove', mv); fader.removeEventListener('pointerup', up); fader.removeEventListener('pointercancel', up); };
        fader.addEventListener('pointermove', mv);
        fader.addEventListener('pointerup', up);
        fader.addEventListener('pointercancel', up);
      });
      fader.addEventListener('keydown', (e) => {
        const cur = Number(getP()[v.id]);
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
          e.preventDefault(); put(cur + step * (e.shiftKey ? 10 : 1));
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
          e.preventDefault(); put(cur - step * (e.shiftKey ? 10 : 1));
        } else if (e.key === 'PageUp') {
          e.preventDefault(); put(cur + step * 10);
        } else if (e.key === 'PageDown') {
          e.preventDefault(); put(cur - step * 10);
        } else if (e.key === 'Home') {
          e.preventDefault(); put(min);
        } else if (e.key === 'End') {
          e.preventDefault(); put(max);
        }
      });
      fader.addEventListener('dblclick', () => put(defVal));
      wrap._paint = paint;
      paint();
      return wrap;
    }

    // Pioneer XDJ-XZ Backlit Silicone Performance Pad for boolean toggles (Fades / FX switches)
    function padSwitchEl(v) {
      const pad = el('button', 'xdj-perf-pad');
      pad.type = 'button';
      pad.setAttribute('role', 'switch');
      pad.dataset.id = v.id;

      // Pad caption from the manifest (padTitle / padSub), else the short label
      const titleText = v.padTitle || v.short || v.label;
      const subText = v.padSub || 'Toggle';

      pad.title = (v.hint || v.label) + '\n' + v.id + '\nClick to toggle';
      pad.innerHTML =
        '<div class="xdj-pad-led"></div>' +
        '<div class="xdj-pad-body">' +
          '<span class="xdj-pad-title">' + esc(titleText) + '</span>' +
          '<span class="xdj-pad-sub">' + esc(subText) + '</span>' +
          '<span class="xdj-pad-state"><i class="xdj-pad-dot"></i><span class="xdj-pad-txt">ON</span></span>' +
        '</div>';

      if (hasPro('starCurate')) {
        const star = starBtn(v);
        star.classList.add('xdj-pad-star');
        pad.appendChild(star);
      }

      const paint = () => {
        const on = !!getP()[v.id];
        pad.classList.toggle('is-on', on);
        pad.setAttribute('aria-checked', on ? 'true' : 'false');
        const txt = pad.querySelector('.xdj-pad-txt');
        if (txt) txt.textContent = on ? 'ON' : 'OFF';
      };

      pad.addEventListener('click', (e) => {
        if (e.target.closest('.star-btn')) return;
        setValue(v.id, !getP()[v.id]);
        paint();
      });

      // Original switch rows reset on a label double-click; the pad keeps that (double-click = default).
      pad.addEventListener('dblclick', (e) => {
        if (e.target.closest('.star-btn, .star')) return;
        setValue(v.id, v.default);
        paint();
      });

      pad._paint = paint;
      paint();
      return pad;
    }

    // Pioneer XDJ-XZ Beat FX / Sound Color FX Unit
    // Combines illuminated Beat FX ON/OFF stomp button + LEVEL / DEPTH rotary dial + 4 performance depth pads
    function fxUnitEl(v, out) {
      const min = v.min != null ? v.min : 0;
      const max = v.max != null ? v.max : 3;
      const step = v.step || 0.05;
      const defVal = v.default != null ? v.default : 1;
      let lastNonZero = defVal || 1;

      const unit = el('div', 'xdj-fx-unit');

      // Top row: Beat FX ON/OFF button + Level/Depth dial column
      const topRow = el('div', 'xdj-fx-row');

      // Iconic illuminated BEAT FX ON/OFF circular button
      const fxBtn = el('button', 'xdj-fx-btn');
      fxBtn.type = 'button';
      fxBtn.setAttribute('role', 'switch');
      fxBtn.title = 'BEAT FX ON/OFF \u00b7 Click to bypass / engage glow';
      fxBtn.innerHTML =
        '<div class="xdj-fx-btn-bezel">' +
          '<div class="xdj-fx-btn-lens">' +
            '<span class="xdj-fx-btn-kicker">BEAT FX</span>' +
            '<span class="xdj-fx-btn-state">ON/OFF</span>' +
          '</div>' +
        '</div>';

      // Dial column
      const col = el('div', 'xdj-fx-col');
      const colHead = el('div', 'xdj-fx-col-head');
      const colLabel = el('span', 'xdj-fx-col-label', 'LEVEL / DEPTH');
      colLabel.title = v.id + (v.css ? '  ' + v.css : '') + '\nDouble-click to reset';
      colLabel.addEventListener('dblclick', () => put(defVal));
      colHead.append(colLabel, out);
      if (hasPro('starCurate')) colHead.appendChild(starBtn(v));

      // Dial: uses variant "fx"
      const dialObj = Object.assign({}, v, { variant: 'fx', label: 'Glow level' });
      const dial = dialEl(dialObj, out);

      col.append(colHead, dial);
      topRow.append(fxBtn, col);

      // Quick-depth preset pads row: [ OFF ] [ 0.5× ] [ 1.0× ] [ 2.0× ]
      const padsRow = el('div', 'xdj-fx-pads');
      const presets = [
        { val: 0, label: 'OFF' },
        { val: 0.5, label: '0.5\u00d7' },
        { val: 1.0, label: '1.0\u00d7' },
        { val: 2.0, label: '2.0\u00d7' }
      ];
      const padBtns = presets.map((p) => {
        const pBtn = el('button', 'xdj-fx-pad', '<span class="xdj-fx-pad-led"></span><span class="xdj-fx-pad-lbl">' + p.label + '</span>');
        pBtn.type = 'button';
        pBtn.dataset.val = String(p.val);
        pBtn.title = 'Set glow to ' + p.label;
        pBtn.addEventListener('click', () => put(p.val));
        padsRow.appendChild(pBtn);
        return pBtn;
      });

      const put = (val) => {
        val = snapStep(val, min, max, step);
        if (val > 0) lastNonZero = val;
        setValue(v.id, val, { quiet: true });
        paint();
        if (out && !out.querySelector('.val-in')) out.textContent = fmt(v, getP()[v.id]);
        if (dial._paint) dial._paint();
      };

      fxBtn.addEventListener('click', () => {
        const cur = Number(getP()[v.id]);
        if (cur > 0) {
          lastNonZero = cur;
          put(0);
        } else {
          put(lastNonZero || defVal);
        }
      });

      const paint = () => {
        const cur = Number(getP()[v.id]);
        const on = cur > 0;
        fxBtn.classList.toggle('is-on', on);
        fxBtn.setAttribute('aria-checked', on ? 'true' : 'false');
        const st = fxBtn.querySelector('.xdj-fx-btn-state');
        if (st) st.textContent = on ? 'ON' : 'OFF';
        padBtns.forEach((pBtn) => {
          const pVal = Number(pBtn.dataset.val);
          const active = Math.abs(cur - pVal) < 0.02;
          pBtn.classList.toggle('is-active', active);
        });
      };

      dial.addEventListener('input', () => {
        const cur = Number(getP()[v.id]);
        if (cur > 0) lastNonZero = cur;
        paint();
      });

      unit.append(topRow, padsRow);
      unit._paint = paint;
      paint();
      return unit;
    }

    // Backlit DJ performance pad button (for future controls with control: 'pad' or variant: 'pad'/'button')
    function padBtnEl(v) {
      const btn = el('button', 'mixer-pad', '<i class="mixer-pad-led"></i><span class="mixer-pad-lbl">' + esc(v.short || v.label) + '</span>');
      btn.type = 'button';
      btn.setAttribute('role', 'switch');
      const paint = () => {
        const on = !!getP()[v.id];
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
      };
      btn.addEventListener('click', () => { setValue(v.id, !getP()[v.id]); paint(); });
      btn._paint = paint;
      paint();
      return btn;
    }

    // New-age DJ Mixer EQ (High / Mid / Low Freq) Rotary Potentiometer
    // Uniform 68x68 size & styling across Text fade, Shell dim, Turn; supports v.variant ('eq' | 'gain' | 'fx') for future controls.
    function dialEl(v, out) {
      const variant = v.variant || 'eq';
      const fullCircle = v.variant === 'compass' || (v.min === 0 && v.max >= 360);
      const a0 = fullCircle ? v.min : -135;
      const span = fullCircle ? Math.min(359.9, v.max - v.min) : 270;
      const vSpan = (v.max - v.min) || 1;
      const angOf = (val) => a0 + (Math.min(1, Math.max(0, (Number(val) - v.min) / vSpan))) * span;
      const pt = (a, r) => [(34 + r * Math.sin(a * Math.PI / 180)).toFixed(2), (34 - r * Math.cos(a * Math.PI / 180)).toFixed(2)];
      const arc = (a1, a2, r) => {
        if (a2 - a1 < 0.5) return '';
        const p1 = pt(a1, r), p2 = pt(a2, r);
        return 'M' + p1.join(' ') + ' A' + r + ' ' + r + ' 0 ' + (a2 - a1 > 180 ? 1 : 0) + ' 1 ' + p2.join(' ');
      };

      // XDJ-XZ silkscreened white split C-arc scale (with 12 o'clock center detent notch) + 11 EQ ticks
      const silkscreenL = fullCircle ? '' : arc(a0, -7, 28.6);
      const silkscreenR = fullCircle ? '' : arc(7, a0 + span, 28.6);
      let ticksSvg = '';
      const tickCount = 10;
      for (let i = 0; i <= tickCount; i++) {
        const a = a0 + (i / tickCount) * span;
        const isMajor = i === 0 || i === 5 || i === tickCount;
        const pIn = pt(a, isMajor ? 26.8 : 28.2);
        const pOut = pt(a, isMajor ? 31.8 : 30.6);
        ticksSvg += '<line class="dial-tick' + (isMajor ? ' is-major' : '') + '" x1="' + pIn[0] + '" y1="' + pIn[1] + '" x2="' + pOut[0] + '" y2="' + pOut[1] + '"/>';
      }
      const defAng = angOf(v.default != null ? v.default : v.min);
      const defPt = pt(defAng, 30.2);

      const d = el('div', 'dial dial-mixer');
      d.dataset.variant = variant;
      d.tabIndex = 0;
      d.setAttribute('role', 'slider');
      d.setAttribute('aria-label', v.label);
      d.setAttribute('aria-valuemin', v.min);
      d.setAttribute('aria-valuemax', v.max);
      d.title = 'Drag up/down or turn around rim \u00b7 Shift for fine \u00b7 Double-click to reset';
      d.innerHTML =
        '<svg viewBox="0 0 68 68" aria-hidden="true">' +
          (silkscreenL ? '<path class="dial-silk" d="' + silkscreenL + '"/><path class="dial-silk" d="' + silkscreenR + '"/>' : '') +
          '<g class="dial-ticks">' + ticksSvg + '</g>' +
          '<circle class="dial-def" cx="' + defPt[0] + '" cy="' + defPt[1] + '" r="1.4"/>' +
          '<path class="dial-range"/>' +
          '<path class="dial-arc"/>' +
          '<circle class="dial-well" cx="34" cy="34" r="22.4"/>' +
          '<circle class="dial-skirt" cx="34" cy="34" r="20.4"/>' +
          '<g class="dial-rotor">' +
            '<circle class="dial-knurl" cx="34" cy="34" r="19.5"/>' +
            '<circle class="dial-cap" cx="34" cy="34" r="15.8"/>' +
            '<circle class="dial-cap-rim" cx="34" cy="34" r="15.8"/>' +
            '<line class="dial-needle-glow" x1="34" y1="30" x2="34" y2="14.2"/>' +
            '<line class="dial-needle" x1="34" y1="30" x2="34" y2="14.2"/>' +
            '<circle class="dial-hub" cx="34" cy="34" r="2.2"/>' +
          '</g>' +
        '</svg>';

      const rangeEl = d.querySelector('.dial-range');
      const arcEl = d.querySelector('.dial-arc');
      const rotorEl = d.querySelector('.dial-rotor');
      rangeEl.setAttribute('d', arc(a0, a0 + span, 25));

      const paint = () => {
        const P = getP();
        const cur = P[v.id];
        const a = angOf(cur);
        arcEl.setAttribute('d', arc(a0, a, 25));
        rotorEl.setAttribute('transform', 'rotate(' + a.toFixed(1) + ' 34 34)');
        d.classList.toggle('is-modified', !same(cur, v.default));
        d.setAttribute('aria-valuenow', cur);
        d.setAttribute('aria-valuetext', fmt(v, cur));
      };
      const put = (val) => {
        setValue(v.id, snapStep(val, v.min, v.max, v.step || 1), { quiet: true });
        paint();
        if (out && !out.querySelector('.val-in')) out.textContent = fmt(v, getP()[v.id]);
        d.dispatchEvent(new Event('input', { bubbles: true }));
      };
      const fromAngle = (e) => {
        const r = d.getBoundingClientRect();
        let a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
        if (fullCircle) {
          a = (a + 360) % 360;
          if (a < v.min || a > v.max) { const mid = (v.max + (360 - v.max + v.min) / 2) % 360; a = a > v.max && a < mid ? v.max : v.min; }
          put(a);
        } else {
          put(v.min + ((Math.min(135, Math.max(-135, a)) + 135) / 270) * vSpan);
        }
      };
      d.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        d.focus({ preventScroll: true });
        d.setPointerCapture(e.pointerId);
        d.classList.add('is-drag');
        const r = d.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dist0 = Math.hypot(e.clientX - cx, e.clientY - cy);
        // Clicking the outer LED scale ring jumps directly to that angle; grabbing the knob cap uses smooth mixer drag
        if (dist0 > r.width * 0.34) fromAngle(e);
        const startVal = Number(getP()[v.id]);
        const x0 = e.clientX, y0 = e.clientY;
        const mv = (ev) => {
          const dx = ev.clientX - x0, dy = y0 - ev.clientY;
          const distNow = Math.hypot(ev.clientX - cx, ev.clientY - cy);
          if (distNow > r.width * 0.36 && Math.abs(dx) > Math.abs(dy) * 1.15) {
            fromAngle(ev);
          } else {
            const sensitivity = ev.shiftKey ? 320 : 120;
            put(startVal + ((dy + dx * 0.35) / sensitivity) * vSpan);
          }
        };
        const upf = () => {
          d.classList.remove('is-drag');
          d.removeEventListener('pointermove', mv);
          d.removeEventListener('pointerup', upf);
          d.removeEventListener('pointercancel', upf);
        };
        d.addEventListener('pointermove', mv);
        d.addEventListener('pointerup', upf);
        d.addEventListener('pointercancel', upf);
      });
      d.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        put(v.default);
      });
      d.addEventListener('wheel', (e) => {
        if (document.activeElement !== d && !d.matches(':hover')) return;
        e.preventDefault();
        const st = (v.step || 1) * (e.shiftKey ? 0.5 : 1);
        put(Number(getP()[v.id]) + (e.deltaY < 0 ? st : -st));
      }, { passive: false });
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
        const td = row.querySelector('.tempo-deck');
        if (td && td._paint) td._paint();
        const mf = row.querySelector('.mixer-fader-wrap');
        if (mf && mf._paint) mf._paint();
        const mp = row.querySelector('.mixer-pad');
        if (mp && mp._paint) mp._paint();
        const pp = row.querySelector('.xdj-perf-pad');
        if (pp && pp._paint) pp._paint();
        const ufx = row.querySelector('.xdj-fx-unit');
        if (ufx && ufx._paint) ufx._paint();
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
      actions.append(reset);
      if (hasPro('customColour')) actions.append(customBtn);   // custom hex: Pro
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

