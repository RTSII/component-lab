// Home Dashboard Dynamic Telemetry & Course Linker
(function () {
  'use strict';

  function esc(s) {
    return (window.App && App.Util && App.Util.escapeHtml)
      ? App.Util.escapeHtml(String(s || ''))
      : String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async function loadCourseMeta() {
    try {
      if (!window.App || !App.Util || !App.Storage) return;
      const course = await App.Util.fetchJSON('data/course.json');
      const progress = App.Storage.getCourseProgress();
      const doneSet = new Set(progress.completed || []);

      let totalLessons = 0;
      let completedLessons = 0;
      const domainStats = {};
      let firstUnfinishedLesson = null;
      let lastLessonObj = null;

      (course.modules || []).forEach(m => {
        const dom = m.domain || 'Medications';
        if (!domainStats[dom]) {
          domainStats[dom] = { completed: 0, total: 0 };
        }
        (m.lessons || []).forEach(l => {
          totalLessons++;
          domainStats[dom].total++;
          const done = doneSet.has(l.id);
          if (done) {
            completedLessons++;
            domainStats[dom].completed++;
          } else if (!firstUnfinishedLesson) {
            firstUnfinishedLesson = { lesson: l, module: m };
          }
          if (progress.lastLesson === l.id) {
            lastLessonObj = { lesson: l, module: m };
          }
        });
      });

      // Update total lesson count & completed count
      const totalEl = document.getElementById('hxLessonTotal');
      if (totalEl) totalEl.textContent = String(totalLessons);

      const lessonsEl = document.getElementById('homeLessons');
      if (lessonsEl) lessonsEl.textContent = String(completedLessons);

      // Percentage calculation
      const pct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const pctEl = document.getElementById('hxCoursePct');
      if (pctEl) {
        pctEl.innerHTML = `${pct}<small>%</small>`;
      }

      // Reactor ring arc progress
      const ringProg = document.getElementById('hxRingProg');
      if (ringProg) {
        ringProg.style.setProperty('--pct', String(pct));
      }

      // Next-lesson info line. The hero always opens the course home.
      const target = lastLessonObj || firstUnfinishedLesson;
      const nextEl = document.getElementById('hxCourseNext');
      const ctaEl = document.getElementById('hxCourseCtaText');
      const courseLink = document.getElementById('hxCourseLink');
      const kickerEl = document.getElementById('hxCourseKicker');

      if (courseLink) courseLink.href = 'course.html';

      if (target && target.lesson) {
        if (kickerEl) kickerEl.textContent = completedLessons > 0 ? 'Continue Training' : 'Start Here';
        if (nextEl) {
          nextEl.innerHTML = `<span>NEXT</span> ${esc(target.module.title)}: ${esc(target.lesson.title)}`;
        }
        if (ctaEl) ctaEl.textContent = 'Open Course';
      }

      // Per-domain progress indicators
      const domainsEl = document.getElementById('hxDomains');
      if (domainsEl) {
        const domList = [
          { key: 'Medications', label: 'Medications' },
          { key: 'Patient Safety and Quality Assurance', label: 'Patient Safety' },
          { key: 'Order Entry and Processing', label: 'Order Entry' },
          { key: 'Federal Requirements', label: 'Federal' }
        ];

        domainsEl.innerHTML = domList.map(d => {
          const s = domainStats[d.key] || { completed: 0, total: 1 };
          const p = s.total ? Math.round((s.completed / s.total) * 100) : 0;
          return `
            <div class="hx-dom">
              <span class="hx-dom-name"><span class="hx-dom-label">${esc(d.label)}</span><em>${s.completed}/${s.total}</em></span>
              <span class="hx-dom-bar"><i style="--p:${p}"></i></span>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.warn('Course metadata load note:', err);
    }
  }

  function loadAuxTelemetry() {
    if (!window.App || !App.Storage) return;
    const p = App.Storage.read();

    // Flashcards stats (cards due today)
    const flashData = document.getElementById('hxFlashData');
    if (flashData) {
      const reviewedCount = p.flashcards?.reviewed?.length || 0;
      const knownCount = p.flashcards?.known?.length || 0;
      if (reviewedCount > 0) {
        flashData.innerHTML = `<b>${knownCount}</b> mastered / <b>${reviewedCount}</b> seen`;
      } else {
        flashData.textContent = 'No cards due';
      }
    }
  }

  // Vertical helix. Cards travel downward: u = 0 is the top, u = 1 is the bottom.
  // Auto motion increases offset so each card's u grows and it moves down, then wraps.
  function initHelix() {
    const root = document.getElementById('hxHelix');
    if (!root) return;
    const stage = root.querySelector('.hx-helix-stage');
    const cards = Array.from(root.querySelectorAll('.hx-helix-card'));
    const n = cards.length;
    if (!stage || !n) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const CYCLE = 26;
    const DRAG_PX = 8;
    let reduce = motion.matches;
    let offset = 0.5;
    let hovering = false;
    let dragging = false;
    let dragMoved = false;
    let kbdPause = false;
    let lastY = 0;
    let startY = 0;
    let lastT = 0;
    let raf = 0;

    const wrap = (v) => ((v % 1) + 1) % 1;
    const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
    // Border fills slowly as a card travels from the top into the middle, stays full there, then drains toward the bottom.
    const borderFill = (absT) => Math.min(1, Math.max(0, (3.4 - absT) / 3.2));

    // Per-card SVG border (four quarter paths) sized to the card; rebuilt when the card size changes.
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
        'M' + w / 2 + ' ' + i + 'H' + (w - i) + 'V' + h / 2,                                        // top middle -> right middle
        'M' + w / 2 + ' ' + (h - i) + 'H' + (w - c) + 'L' + (w - i) + ' ' + (h - c) + 'V' + h / 2,   // bottom middle -> right middle
        'M' + w / 2 + ' ' + i + 'H' + c + 'L' + i + ' ' + c + 'V' + h / 2,                          // top middle -> left middle
        'M' + w / 2 + ' ' + (h - i) + 'H' + i + 'V' + h / 2                                        // bottom middle -> left middle
      ];
      svg.querySelectorAll('path').forEach((p, k) => p.setAttribute('d', d[k]));
    }
    cards.forEach(buildEdge);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => cards.forEach(buildEdge));
      cards.forEach((c) => ro.observe(c));
    }

    // Numbers read red when there is nothing yet (0, 0%, or a dash), neon blue otherwise.
    cards.forEach((card) => {
      const num = card.querySelector('.hx-helix-num');
      if (!num) return;
      const mark = () => num.classList.toggle('is-zero', /^\s*(—|-|0+(\.0+)?%?)?\s*$/.test(num.textContent));
      mark();
      new MutationObserver(mark).observe(num, { childList: true, characterData: true, subtree: true });
    });

    // Helix model (after the Framer Helix3DCarousel): t is the card's slot distance from the front, -n/2..n/2.
    // Each slot turns STEP degrees around the helix, so 8 cards make one full turn, and every card is turned
    // to face outward from the axis: it enters at the top on the left with its right side nearer, passes flat at
    // the front, then twists with its left side nearer (larger) and right side farther (smaller) as it goes down.
    // The text fades out as the face turns away (TEXT_FADE_A..B degrees); the back half of the helix is drawn as
    // dim, textless glass shells (BACK_OPACITY, 0 hides them) and everything is gone before the loop wraps.
    const STEP = 44;
    const TEXT_FADE_A = 52, TEXT_FADE_B = 86;
    const BACK_OPACITY = 0.3;
    const END_FADE_A = 3.0, END_FADE_B = 3.85;
    const TILT = 1;
    function layout() {
      const rect = stage.getBoundingClientRect();
      const travel = Math.max(rect.height * 0.94, 1);
      const cardW = cards[0].offsetWidth || 0;
      const room = (rect.width - cardW) / 2;
      const radius = Math.max(0, Math.min(rect.width * 0.26, 84, room - 6));
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
        const y = sp * (t + 0.3 * Math.sin(t * Math.PI / span));
        const depth = (Math.cos(th) + 1) / 2;
        const scale = 0.56 + 0.44 * depth;
        const body = 1 - (1 - BACK_OPACITY) * smooth(70, 110, absDeg);
        const opacity = body * (1 - smooth(END_FADE_A, END_FADE_B, absT));
        const card = cards[i];
        card.style.transform = 'translate(-50%, -50%) translate(' + x.toFixed(2) + 'px, ' + y.toFixed(2) +
          'px) rotateY(' + (TILT * deg).toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
        card.style.opacity = opacity.toFixed(3);
        card.style.zIndex = String(100 + Math.round(Math.cos(th) * 50));
        card.style.setProperty('--tx', (1 - smooth(TEXT_FADE_A, TEXT_FADE_B, absDeg)).toFixed(3));
        card.style.setProperty('--bp', borderFill(absT).toFixed(3));
        card.style.pointerEvents = absDeg > 70 || opacity < 0.42 ? 'none' : 'auto';
      }
    }

    function frame(t) {
      const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
      lastT = t;
      if (!reduce && !hovering && !dragging && !kbdPause) offset += dt / CYCLE;
      layout();
      raf = requestAnimationFrame(frame);
    }

    function bringToFront(card) {
      const i = cards.indexOf(card);
      if (i < 0) return;
      const current = wrap(offset);
      const desired = wrap(0.5 - i / n);
      let delta = desired - current;
      if (delta > 0.5) delta -= 1;
      if (delta < -0.5) delta += 1;
      offset += delta;
      layout();
    }

    if (motion.addEventListener) {
      motion.addEventListener('change', (e) => { reduce = e.matches; });
    }

    root.addEventListener('pointerenter', () => { hovering = true; });
    root.addEventListener('pointerleave', () => { hovering = false; });
    cards.forEach((card) => { card.draggable = false; });

    function onPointerMove(e) {
      if (!dragging) return;
      const dy = e.clientY - lastY;
      lastY = e.clientY;
      if (!dy) return;
      const travel = Math.max(stage.getBoundingClientRect().height * 0.94, 1);
      offset += dy / travel;
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
      if (e.button !== 0) return;
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
    root.addEventListener('focusin', (e) => {
      const card = e.target.closest('.hx-helix-card');
      if (!card || !root.contains(card) || !card.matches(':focus-visible')) return;
      kbdPause = true;
      bringToFront(card);
    });
    root.addEventListener('focusout', (e) => {
      if (root.contains(e.relatedTarget)) return;
      kbdPause = false;
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        lastT = 0;
      } else {
        raf = requestAnimationFrame(frame);
      }
    });

    layout();
    raf = requestAnimationFrame(frame);
  }

  // Step --hx-fit down until the desktop frame fits the window. The grid
  // already fills 100dvh; this only shrinks type, padding, and gaps.
  function initFit() {
    const root = document.body;
    const wide = window.matchMedia('(min-width: 900px)');
    const STEPS = [1, 0.96, 0.92, 0.88, 0.84, 0.8, 0.76, 0.72];
    const SKIP = '.hx-tagline, .hx-helix, .hx-helix *';

    function pagePast() {
      const se = document.scrollingElement || document.documentElement;
      const main = document.querySelector('main');
      function px(el) {
        if (!el) return 0;
        return el.scrollHeight - el.clientHeight;
      }
      return Math.max(px(se), px(document.body), px(main));
    }

    function cardPast() {
      let past = 0;
      document.querySelectorAll('.hx-course, .hx-flash, .hx-notes, .hx-dash-core').forEach((card) => {
        const box = card.getBoundingClientRect();
        if (box.height < 2) return;
        card.querySelectorAll('h1, h2, p, .hx-go, .hx-domains, .hx-cta, .hx-icon, .hx-data, .dash-core-content').forEach((el) => {
          if (el.closest(SKIP) || el.offsetParent === null) return;
          const r = el.getBoundingClientRect();
          past = Math.max(past, r.bottom - box.bottom, box.top - r.top);
        });
      });
      return past;
    }

    function fit() {
      if (!wide.matches) {
        root.style.removeProperty('--hx-fit');
        applyHomeRainMask();
        return;
      }
      let chosen = STEPS[STEPS.length - 1];
      for (let i = 0; i < STEPS.length; i++) {
        root.style.setProperty('--hx-fit', String(STEPS[i]));
        void root.offsetHeight;
        if (pagePast() <= 0.5 && cardPast() <= 1) {
          chosen = STEPS[i];
          break;
        }
      }
      root.style.setProperty('--hx-fit', String(chosen));
      void root.offsetHeight;
      applyHomeRainMask();
    }

    window.addEventListener('resize', fit);
    if (wide.addEventListener) wide.addEventListener('change', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    fit();
    return fit;
  }

  // Reveal the shared rain canvas only inside the home cards and the dashboard ring.
  // Gaps, the header, the footer, and the helix column stay the plain dark field.
  function applyHomeRainMask() {
    const canvas = document.getElementById('matrixRain');
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(box.width));
    const h = Math.max(1, Math.round(box.height));
    const ox = box.left;
    const oy = box.top;
    const shapes = [];

    function cutOf(el) {
      const n = parseFloat(getComputedStyle(el).getPropertyValue('--hx-cut'));
      return Number.isFinite(n) ? n : 16;
    }

    document.querySelectorAll('.hx-course, .hx-flash, .hx-notes').forEach((el) => {
      const rect = el.getBoundingClientRect();
      const x = rect.left - ox;
      const y = rect.top - oy;
      const rw = rect.width;
      const rh = rect.height;
      if (rw < 2 || rh < 2) return;
      const cut = Math.min(cutOf(el), rw / 2, rh / 2);
      let pts;
      if (el.classList.contains('hx-flash')) {
        const tab = Math.min(140, rw);
        const step = Math.min(155, rw);
        const lip = Math.min(12, rh / 2);
        pts = [
          [x, y],
          [x + tab, y],
          [x + step, y + lip],
          [x + rw, y + lip],
          [x + rw, y + rh - cut],
          [x + rw - cut, y + rh],
          [x, y + rh]
        ];
      } else {
        pts = [
          [x + cut, y],
          [x + rw, y],
          [x + rw, y + rh - cut],
          [x + rw - cut, y + rh],
          [x, y + rh],
          [x, y + cut]
        ];
      }
      shapes.push('<polygon points="' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '"/>');
    });

    const ring = document.querySelector('.hx-dash-core .dash-r-ring');
    const svg = ring && ring.ownerSVGElement;
    const ctm = svg && svg.getScreenCTM && svg.getScreenCTM();
    if (ctm) {
      const cx = parseFloat(ring.getAttribute('cx')) || 100;
      const cy = parseFloat(ring.getAttribute('cy')) || 100;
      const radius = parseFloat(ring.getAttribute('r')) || 94;
      const pt = svg.createSVGPoint();
      pt.x = cx;
      pt.y = cy;
      const c = pt.matrixTransform(ctm);
      pt.x = cx + radius;
      const edge = pt.matrixTransform(ctm);
      const rad = Math.hypot(edge.x - c.x, edge.y - c.y);
      if (rad >= 4) {
        shapes.push('<circle cx="' + (c.x - ox).toFixed(1) + '" cy="' + (c.y - oy).toFixed(1) + '" r="' + rad.toFixed(1) + '"/>');
      }
    }

    const markup = shapes.length
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" fill="white">' + shapes.join('') + '</svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"></svg>';
    const mask = 'url("data:image/svg+xml,' + encodeURIComponent(markup) + '")';
    canvas.style.maskImage = mask;
    canvas.style.webkitMaskImage = mask;
    canvas.style.maskRepeat = 'no-repeat';
    canvas.style.webkitMaskRepeat = 'no-repeat';
    canvas.style.maskSize = '100% 100%';
    canvas.style.webkitMaskSize = '100% 100%';
    canvas.style.maskPosition = '0 0';
    canvas.style.webkitMaskPosition = '0 0';
    canvas.style.maskMode = 'alpha';
  }

  function initRainMask() {
    if (!document.getElementById('matrixRain')) return;
    let queued = false;
    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        applyHomeRainMask();
      });
    }
    const ro = new ResizeObserver(schedule);
    const grid = document.querySelector('.hx-grid');
    if (grid) ro.observe(grid);
    document.querySelectorAll('.hx-course, .hx-flash, .hx-notes, .hx-dash-core, .dash-reactor').forEach((el) => {
      ro.observe(el);
    });
    window.addEventListener('resize', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    applyHomeRainMask();
  }

  function init() {
    const refit = initFit();
    initRainMask();
    loadCourseMeta().then(refit);
    loadAuxTelemetry();
    initHelix();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
