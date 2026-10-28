// Blank component template (v2). New components are copies of this folder (Lab: + New, or
// python new-component.py my-name --kind card). The kind comes from manifest.json; every
// control in manifest.json with a "css" key is a CSS custom property the lab sets on the frame,
// so style.css does the work and render() can stay empty. Replace markup/CSS with your own.
Lab.register({
  title: 'Blank template',
  css: ['style.css'],
  markup: 'markup.html',
  animated: false,          // CSS animations run on their own; true adds play/pause + scrub
  frames: {                 // overridden by manifest.json "frames" (set per kind)
    '1600x770': { w: 420, h: 320 },
    '1366x768': { w: 380, h: 300 }
  },

  mount(frame, ctx) {
    const kind = (ctx && ctx.manifest && ctx.manifest.kind) || 'card';
    const KINDS = {
      card: '<article class="cmp cmp-card"><span class="cmp-badge">New</span><h3 class="cmp-title">Card title</h3>' +
        '<p class="cmp-text">Short supporting text that wraps onto a second line.</p><button class="cmp-btn" type="button">Action</button></article>',
      nav: '<nav class="cmp cmp-nav"><a class="is-active">Home</a><a>Study</a><a>Quiz</a><a>Stats</a></nav>',
      hero: '<section class="cmp cmp-hero"><p class="cmp-eyebrow">PTCE 2026</p><h1 class="cmp-title">Headline goes here</h1>' +
        '<p class="cmp-text">One line of supporting text.</p><button class="cmp-btn" type="button">Get started</button></section>',
      'animated-background': '<div class="cmp cmp-bg"><i class="b1"></i><i class="b2"></i><i class="b3"></i><span class="cmp-bg-label">Background</span></div>',
      list: '<ul class="cmp cmp-list"><li><i></i><span>Medications</span><b>82%</b></li><li><i></i><span>Safety</span><b>64%</b></li>' +
        '<li><i></i><span>Order entry</span><b>71%</b></li><li><i></i><span>Federal law</span><b>0%</b></li></ul>',
      button: '<button class="cmp cmp-btn cmp-solo" type="button">Start quiz</button>'
    };
    const host = frame.querySelector('.cmp-host') || frame;
    host.innerHTML = KINDS[kind] || KINDS.card;
    host.dataset.kind = kind;
    host.addEventListener('click', (e) => e.preventDefault());
    // Interaction (optional, not forced): the Interaction section and its rail icon appear only
    // once manifest.json has vars with "category": "interact". Example for a hover pause:
    //   manifest: { "id": "HOVER", "category": "interact", "interaction": "hover", "control": "segmented",
    //               "default": "pause", "options": [{"value":"play","label":"Keep"},{"value":"pause","label":"Pause"}] }
    //   here:     let over = false;
    //             host.addEventListener('pointerenter', () => { over = true; });
    //             host.addEventListener('pointerleave', () => { over = false; });
    //             return { render() {}, rate(P) { return over && P.HOVER === 'pause' ? 0 : 1; } };
    // rate() scales the lab clock (animated: true); ctx.time.nudge(d) moves it (drag to scrub).
    // CSS :hover rules need no code: add { "id": "HOVER_FX", "category": "interact",
    // "interaction": "hover-css", "control": "switch", "default": true } and the lab toggles them.
    return { render() {}, destroy() {} };
  }
});
