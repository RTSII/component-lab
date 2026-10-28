// Component Lab v2 export, manifest serialization, standalone HTML working file, and localStorage backup/restore.
// Plain IIFE sharing window.Lab (initialized by lab/lab.js via Lab.initExport).
(function () {
  'use strict';

  window.Lab = window.Lab || {};

  window.Lab.initExport = function (ctx) {
    const {
      $, el, esc, KEY, store, toast, fetchText,
      getDef, getMan, getVars, getP, getUi, getOffset, getPlaying, getBindStyle,
      changedVars, interactVars, fmt, cssVal, frameKeyFor, wrap,
      flashOk, announce, Log, reloadAfterImport
    } = ctx;

    function manifestForExport() {
      const out = JSON.parse(JSON.stringify(getMan()));
      delete out.auto;
      delete out.notes;
      delete out.scan;
      delete out.generated;
      delete out.sig;
      (out.vars || []).forEach((v) => {
        if (v._genOpts) { delete v.options; delete v._genOpts; }
      });
      return out;
    }

    async function saveManifest() {
      const def = getDef(), man = getMan();
      if (!def) return;
      if (def.id === '_template') {
        toast('Template is read-only; use + New to create a component.');
        return;
      }
      try {
        const r = await fetch('api/manifest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: def.id, manifest: manifestForExport() }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) throw new Error(j.error || 'HTTP ' + r.status);
        man.auto = false;
        store.del('featured:' + def.id);
        store.del('manifest:' + def.id);
        toast('Saved components/' + def.id + '/manifest.json');
      } catch (e) {
        toast('Could not save (' + e.message + '). Is the lab running from serve.py? Export JSON works anywhere.', 6000);
      }
    }

    async function copyText(text) {
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
        const ta = el('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
        ta.remove();
      }
      window.__lastCopy = text;
      if (!ok) console.log(text);
      return ok;
    }

    function interactionText() {
      const ia = interactVars(), P = getP();
      if (!ia.length) return '';
      return 'Interaction: ' + ia.map((v) => (v.short || v.label).toLowerCase() + ' = ' + fmt(v, P[v.id]).toLowerCase() + ' [' + v.id + ']').join(', ');
    }

    function changesText() {
      const def = getDef(), P = getP(), ch = changedVars();
      const lines = ['Component Lab: ' + def.title + ' (' + def.id + '), ' + ch.length + ' changed'];
      lines.push('Files: components/' + def.id + '/ (' + ['manifest.json'].concat(def.css || [], def.markup ? [def.markup] : [], ['component.js']).join(', ') + ')');
      ch.forEach((v) => lines.push('- ' + v.label + ' [' + v.id + (v.css ? ' ' + v.css : '') + ']: ' + fmt(v, v.default) + ' -> ' + fmt(v, P[v.id])));
      const it = interactionText();
      if (it) lines.push(it);
      lines.push('Link: ' + location.href);
      return lines.join('\n');
    }

    async function copyChanges() {
      const ch = changedVars();
      if (!ch.length) return;
      const ok = await copyText(changesText());
      flashOk($('copyBtn'), ok);
      Log.push(ok ? 'copied ' + ch.length + ' change' + (ch.length === 1 ? '' : 's') : 'copy blocked (text in console)', ok ? 'ok' : 'bad');
      announce(ok ? 'Copied ' + ch.length + ' changes' : 'Copy blocked by the browser');
      if (!ok) toast('Copy blocked by the browser; text is in the console.');
    }

    async function workingFile() {
      const def = getDef(), vars = getVars(), P = getP(), ui = getUi();
      const offset = getOffset(), playing = getPlaying(), bindStyle = getBindStyle();
      const base = 'components/' + def.id + '/';
      const cssFiles = await Promise.all((def.css || []).map(async (f) => ({ name: f, text: (await fetchText(base + f)) || '' })));
      const markup = def.markup ? (await fetchText(base + def.markup)) || '' : '';
      const js = (await fetchText(base + 'component.js')) || '';
      const f = def.frames[frameKeyFor(ui.view)];
      const decl = ['width: ' + f.w + 'px', 'height: ' + f.h + 'px'];
      Object.entries(f.vars || {}).forEach(([k, v]) => decl.push(k + ': ' + v));
      vars.forEach((v) => { if (v.css) decl.push(v.css + ': ' + cssVal(v)); });
      const binds = bindStyle ? bindStyle.textContent : '';
      const ch = changedVars();
      const params = {};
      vars.forEach((v) => { params[v.id] = P[v.id]; });
      const stamp = new Date();
      const safe = (t) => String(t).replace(/<\/(script|style)/gi, '<\\/$1');
      const out = [
        '<!doctype html>',
        '<!--',
        '  Component Lab working file: ' + def.title + ' (' + def.id + ')',
        '  Source: components/' + def.id + '/ (' + (def.css || []).concat(def.markup ? [def.markup] : [], ['component.js']).join(', ') + ')',
        '  Frame: ' + frameKeyFor(ui.view) + ' (' + f.w + ' x ' + f.h + ')',
        '  Exported: ' + stamp.getFullYear() + '-' + String(stamp.getMonth() + 1).padStart(2, '0') + '-' + String(stamp.getDate()).padStart(2, '0') + ' ' + stamp.toTimeString().slice(0, 8) + ' (local time)',
        '  ' + (ch.length ? ch.length + ' changed from defaults:' : 'No changes from defaults.'),
        ch.map((v) => '    - ' + v.label + ' [' + v.id + (v.css ? ' ' + v.css : '') + ']: ' + fmt(v, v.default) + ' -> ' + fmt(v, P[v.id])).join('\n'),
        (interactionText() ? '  ' + interactionText() + '\n  (component.js reads these from LAB_PARAMS; the runner applies its rate() and time hooks.)' : '  Interaction: none in this component.'),
        '  Every value below (CSS custom properties on .lab-frame and LAB_PARAMS) is the live lab state.',
        '  Open this file in Chrome to see it run on its own.',
        '-->',
        '<html lang="en">',
        '<head>',
        '<meta charset="utf-8">',
        '<title>' + esc(def.title) + ' (working file)</title>',
        '<link rel="stylesheet" href="lab/fonts/fonts.css">',
        '<style>',
        'html, body { margin: 0; height: 100%; background: #07090d; color: #e9edf3; font: 13px/1.4 system-ui, sans-serif; }',
        '.lab-frame { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }',
        '</style>'
      ];
      const hv = vars.find((x) => x.interaction === 'hover-css');
      const hoverOff = (t) => (hv && !P[hv.id] ? t.replace(/:hover/g, ':hover:not(*)') : t);
      cssFiles.forEach((c) => out.push('<style data-file="' + esc(c.name) + '">\n' + safe(hoverOff(c.text)).trim() + '\n</style>'));
      out.push('<style data-file="lab-values">\n/* current lab values */\n.lab-frame[data-component="' + def.id + '"] {\n  ' + decl.join(';\n  ') + ';\n}\n' + (binds ? safe(binds) + '\n' : '') + '</style>');
      out.push('</head>', '<body>');
      out.push('<div class="lab-frame" id="labFrame" data-component="' + esc(def.id) + '">\n' + markup.trim() + '\n</div>');
      out.push('<script>\n// Lab shim: component.js calls Lab.register(); the runner below mounts it with these values.\nwindow.LAB_PARAMS = ' + safe(JSON.stringify(params, null, 2)) + ';\nwindow.LAB_MANIFEST = ' + safe(JSON.stringify(manifestForExport())) + ';\nwindow.Lab = { register: function (d) { window.LAB_DEF = d; }, get params() { return window.LAB_PARAMS; } };\n</script>');
      out.push('<script data-file="component.js">\n' + safe(js).trim() + '\n</script>');
      const tm = def.time || {};
      out.push('<script>\n// Runner: same loop as the lab (cycle / speed / direction, plus the interaction hooks:\n// inst.rate() scales playback for hover pause / slow / fast; time.nudge() lets drag spin it).\n(function () {\n  var P = window.LAB_PARAMS, d = window.LAB_DEF, frame = document.getElementById("labFrame");\n  var T = ' + JSON.stringify({ cycle: tm.cycle || null, speed: tm.speed || null, direction: tm.direction || null }) + ', animated = ' + (!!def.animated) + ', offset = ' + (+wrap(offset).toFixed(4)) + ', playing = ' + (!!def.animated && playing) + ', last = 0;\n  var time = { nudge: function (x) { offset += x; }, get offset() { return offset; }, set offset(v) { offset = v; }, get playing() { return playing; } };\n  var inst = (d && d.mount && d.mount(frame, { params: P, manifest: window.LAB_MANIFEST, time: time })) || {};\n  function tick(t) {\n    var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;\n    if (inst.render) {\n      if (animated && playing) {\n        var cyc = T.cycle && P[T.cycle] ? P[T.cycle] : 10, spd = T.speed && P[T.speed] !== undefined ? P[T.speed] : 1, dir = T.direction && P[T.direction] !== undefined ? Number(P[T.direction]) || 1 : 1;\n        var k = inst.rate ? Number(inst.rate(P, dt)) : 1; if (!isFinite(k)) k = 1;\n        offset += (dt / Math.max(0.1, cyc)) * spd * dir * k;\n      }\n      inst.render(P, ((offset % 1) + 1) % 1);\n    }\n    requestAnimationFrame(tick);\n  }\n  requestAnimationFrame(tick);\n})();\n</script>');
      out.push('</body>', '</html>', '');
      return out.join('\n');
    }

    async function copyFull() {
      const text = await workingFile();
      const ok = await copyText(text);
      flashOk($('fullBtn'), ok);
      Log.push(ok ? 'copied full file (' + Math.round(text.length / 1024) + ' KB)' : 'copy blocked (text in console)', ok ? 'ok' : 'bad');
      announce(ok ? 'Copied the full working file' : 'Copy blocked by the browser');
      if (!ok) toast('Copy blocked by the browser; the file is in the console.');
    }

    function exportLabData() {
      const dump = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(KEY)) {
            try { dump[k] = JSON.parse(localStorage.getItem(k)); } catch (_) { dump[k] = localStorage.getItem(k); }
          }
        }
      } catch (e) {
        toast('Could not read localStorage: ' + e.message, 5000);
        return;
      }
      const blob = new Blob([JSON.stringify(dump, null, 2) + '\n'], { type: 'application/json' });
      const a = el('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'component-lab-backup.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      Log.push('exported lab backup (' + Object.keys(dump).length + ' keys)');
      toast('Exported ' + Object.keys(dump).length + ' lab storage keys to component-lab-backup.json.');
    }

    function importLabData() {
      const inp = el('input');
      inp.type = 'file';
      inp.accept = '.json,application/json';
      inp.addEventListener('change', async () => {
        const file = inp.files && inp.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid backup object');
          let count = 0;
          Object.entries(data).forEach(([k, v]) => {
            if (k.startsWith(KEY)) {
              localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
              count++;
            }
          });
          if (!count) throw new Error('No componentLab:v2:* keys found in file');
          Log.push('imported lab backup (' + count + ' keys)');
          toast('Restored ' + count + ' lab storage keys.');
          if (reloadAfterImport) reloadAfterImport();
        } catch (e) {
          toast('Import failed: ' + e.message, 6000);
        }
      });
      inp.click();
    }

    return { manifestForExport, saveManifest, copyText, interactionText, changesText, copyChanges, workingFile, copyFull, exportLabData, importLabData };
  };
})();
