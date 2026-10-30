  let style = STYLE;
  const inner = (n, st) => {
    const e = I[n];
    if (!e) return '';
    return e.s[e.fixed || st || style] || e.s[STYLE] || e.s[Object.keys(e.s)[0]];
  };
  // <svg class="ico mi" data-i="name"> using currentColor; same box as the old hand-drawn icons
  const svg = (n, cls) => '<svg class="ico mi' + (cls ? ' ' + cls : '') + '" data-i="' + n + '" viewBox="' + ((I[n] && I[n].vb) || '0 0 24 24') + '" aria-hidden="true">' + inner(n) + '</svg>';
  // switch every rendered icon to another style in place (no rebuild)
  function setStyle(st, root) {
    if (STYLES.indexOf(st) < 0) st = STYLE;
    style = st;
    (root || document).querySelectorAll('svg.mi[data-i]').forEach((s) => { s.innerHTML = inner(s.dataset.i); });
    return st;
  }
  window.LabIcons = { STYLE, STYLES, I, svg, inner, setStyle, has: (n) => !!I[n], get style() { return style; } };
})();
