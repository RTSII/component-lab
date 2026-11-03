#!/usr/bin/env python3
"""Check components before they are imported into the Component Lab (report only, nothing is installed).

  python tools/import-component.py PATH [PATH ...] [--json]

PATH can be:
  - one component folder            (contains component.js)
  - a folder of component folders   (batch: every sub-folder with a component.js is checked)
  - a .zip with one or more component folders inside (read in memory, never extracted)

For each component it reports a verdict:
  READY       passes every check; copy the folder to components/<id>/ and run tools/check-components.py
  NEEDS WORK  loads, but has warnings (no manifest, legacy schema, unmapped CSS vars, ...)
  BLOCKED     must not be imported as is (missing component.js, bad id, id taken, licence marker,
              unsafe code such as network calls or eval, manifest errors)

The required folder layout is documented in docs/COMPONENT-IMPORT.md. Exit code: 0 when nothing is
BLOCKED, 1 otherwise. This tool never writes into components/.
"""
import importlib.util
import io
import json
import os
import re
import sys
import zipfile

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMP = os.path.join(HERE, "components")

_spec = importlib.util.spec_from_file_location("check_components", os.path.join(HERE, "tools", "check-components.py"))
checker = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(checker)

NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,40}$")   # same rule as new-component.py
ALLOWED_EXT = (".js", ".css", ".html", ".json", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif",
               ".woff", ".woff2", ".md", ".txt")
TEXT_EXT = (".js", ".css", ".html", ".json", ".svg", ".md", ".txt")
MAX_FILE = 512 * 1024
MAX_TOTAL = 4 * 1024 * 1024
MAX_FILES = 60

# component.js runs inside the lab page (new Function), so anything that reaches out or evaluates code is blocked
UNSAFE = [
    (re.compile(r"\bfetch\s*\("), "network call fetch()"),
    (re.compile(r"\bXMLHttpRequest\b"), "network call XMLHttpRequest"),
    (re.compile(r"\bWebSocket\b|\bEventSource\b"), "network socket"),
    (re.compile(r"\bnavigator\.sendBeacon\b"), "network beacon"),
    (re.compile(r"\beval\s*\("), "eval()"),
    (re.compile(r"\bnew\s+Function\b"), "new Function()"),
    (re.compile(r"(?<![\w.])import\s*\("), "dynamic import()"),
    (re.compile(r"^\s*import\s.+\sfrom\s|^\s*export\s", re.M), "ES module import/export (components are plain scripts)"),
    (re.compile(r"\bdocument\.cookie\b"), "cookie access"),
    (re.compile(r"\b(localStorage|sessionStorage|indexedDB)\b"), "browser storage (the lab owns storage)"),
    (re.compile(r"\bpostMessage\s*\("), "postMessage"),
    (re.compile(r"\b(window\.)?(top|parent|opener)\.location\b|\blocation\.(href|assign|replace)\b"), "page navigation"),
]
EXTERNAL_URL = re.compile(r"""(?:src|href|url)\s*[=(]\s*["']?\s*(?:https?:)?//""", re.I)
CSS_IMPORT_URL = re.compile(r"@import\s+(?:url\()?\s*[\"']?(?:https?:)?//", re.I)
REG_RE = re.compile(r"\bLab\.register\s*\(")
CSS_LIST_RE = re.compile(r"\bcss\s*:\s*\[([^\]]*)\]")
MARKUP_RE = re.compile(r"\bmarkup\s*:\s*['\"]([^'\"]+)['\"]")
VAR_USE_RE = re.compile(r"var\(\s*(--[\w-]+)")


class Source:
    """A component's files, from a folder or from a zip (read in memory)."""

    def __init__(self, label, files):
        self.label = label
        self.files = files            # {relative path: bytes}

    def text(self, rel):
        b = self.files.get(rel)
        return None if b is None else b.decode("utf-8", errors="replace")


def from_folder(path):
    files = {}
    for root, dirs, names in os.walk(path):
        dirs[:] = [d for d in dirs if d not in (".git", "node_modules")]
        for n in names:
            p = os.path.join(root, n)
            rel = os.path.relpath(p, path).replace(os.sep, "/")
            if os.path.islink(p):
                files[rel] = None     # flagged below
                continue
            with open(p, "rb") as f:
                files[rel] = f.read(MAX_TOTAL + 1)
    return files


def collect(paths):
    """Expand the arguments into (id, Source) pairs."""
    out, problems = [], []
    for arg in paths:
        if os.path.isfile(arg) and arg.lower().endswith(".zip"):
            try:
                z = zipfile.ZipFile(arg)
            except zipfile.BadZipFile:
                problems.append("%s: not a valid zip" % arg)
                continue
            groups = {}
            for info in z.infolist():
                if info.is_dir():
                    continue
                name = info.filename.replace("\\", "/")
                if name.startswith("/") or ".." in name.split("/") or ":" in name.split("/")[0]:
                    problems.append("%s: unsafe path %r in zip (skipped)" % (arg, name))
                    continue
                if name.startswith("__MACOSX/"):
                    continue
                parts = name.split("/")
                if parts[-1] == "component.js":
                    groups.setdefault("/".join(parts[:-1]), {})
            if not groups:
                problems.append("%s: no component.js found in the zip" % arg)
                continue
            for prefix in sorted(groups):
                files = {}
                pre = prefix + "/" if prefix else ""
                for info in z.infolist():
                    name = info.filename.replace("\\", "/")
                    if info.is_dir() or not name.startswith(pre) or ".." in name.split("/"):
                        continue
                    rel = name[len(pre):]
                    files[rel] = z.read(info) if info.file_size <= MAX_TOTAL else b"\0" * (MAX_TOTAL + 1)
                cid = prefix.split("/")[-1] if prefix else os.path.splitext(os.path.basename(arg))[0]
                out.append((cid, Source("%s!%s" % (arg, prefix or "/"), files)))
        elif os.path.isdir(arg):
            if os.path.isfile(os.path.join(arg, "component.js")) or os.path.isfile(os.path.join(arg, "manifest.json")):
                out.append((os.path.basename(os.path.abspath(arg)), Source(arg, from_folder(arg))))
            else:
                subs = [d for d in sorted(os.listdir(arg)) if os.path.isdir(os.path.join(arg, d)) and not d.startswith(".")]
                found = [d for d in subs if os.path.isfile(os.path.join(arg, d, "component.js")) or os.path.isfile(os.path.join(arg, d, "manifest.json"))]
                if not found:
                    problems.append("%s: no component folders found (a component folder holds component.js)" % arg)
                for d in found:
                    p = os.path.join(arg, d)
                    out.append((d, Source(p, from_folder(p))))
        else:
            problems.append("%s: not found (give a folder or a .zip)" % arg)
    return out, problems


def core_css_map(core):
    m = {}
    for cc in core.get("controls", []) + core.get("optional", []):
        if cc.get("css"):
            m[cc["css"]] = cc["id"]
    return m


def analyze(cid, src, core, taken, batch_ids):
    errs, warns, notes = [], [], []
    files = src.files

    # --- id ---
    if cid.startswith("_"):
        errs.append("id %r: names starting with _ are reserved (_core, _template)" % cid)
    elif not NAME_RE.match(cid):
        errs.append("id %r: use lowercase letters, numbers and dashes (rename the folder)" % cid)
    if cid in taken:
        errs.append("id %r already exists in components/ (rename, or this would replace it)" % cid)
    if batch_ids.count(cid) > 1:
        errs.append("id %r appears more than once in this batch" % cid)

    # --- files ---
    total = 0
    for rel, b in files.items():
        if b is None:
            errs.append("%s: symlinks are not allowed" % rel)
            continue
        total += len(b)
        ext = os.path.splitext(rel)[1].lower()
        if ext not in ALLOWED_EXT:
            errs.append("%s: file type %s is not allowed in a component" % (rel, ext or "(none)"))
        if len(b) > MAX_FILE:
            warns.append("%s: %d KB (over %d KB)" % (rel, len(b) // 1024, MAX_FILE // 1024))
    if len(files) > MAX_FILES:
        warns.append("%d files (over %d)" % (len(files), MAX_FILES))
    if total > MAX_TOTAL:
        errs.append("component is %d KB in total (limit %d KB)" % (total // 1024, MAX_TOTAL // 1024))

    js = src.text("component.js")
    if js is None:
        errs.append("component.js is missing (required)")
        js = ""
    elif not REG_RE.search(js):
        errs.append("component.js never calls Lab.register({...})")
    if "style.css" not in files:
        warns.append("style.css is missing (recommended; core controls are CSS custom properties)")

    css_names = []
    mcss = CSS_LIST_RE.search(js)
    if mcss:
        css_names = re.findall(r"['\"]([^'\"]+)['\"]", mcss.group(1))
        for n in css_names:
            if n not in files:
                errs.append("component.js lists css %r but the file is missing" % n)
    elif js:
        warns.append("component.js has no css: [...] list (no stylesheet will be loaded)")
    mm = MARKUP_RE.search(js)
    if mm and mm.group(1) not in files:
        errs.append("component.js names markup %r but the file is missing" % mm.group(1))

    # --- safety + licence ---
    for rel, b in files.items():
        if b is None or os.path.splitext(rel)[1].lower() not in TEXT_EXT:
            continue
        t = b.decode("utf-8", errors="replace")
        if checker.LICENSE_MARKERS.search(t):
            errs.append("%s: licence marker %r (licensed code stays in the private vault)" % (rel, checker.LICENSE_MARKERS.search(t).group(0)))
        if rel.endswith((".js", ".html", ".svg")):
            for rx, what in UNSAFE:
                if rx.search(t):
                    errs.append("%s: %s" % (rel, what))
            if re.search(r"<script\b", t, re.I) and not rel.endswith(".js"):
                errs.append("%s: inline <script> (code belongs in component.js)" % rel)
        if EXTERNAL_URL.search(t) or CSS_IMPORT_URL.search(t):
            errs.append("%s: loads something from an external URL (bundle assets locally)" % rel)

    # --- manifest + core mapping ---
    css_text = "\n".join(src.text(n) or "" for n in (css_names or ["style.css"]))
    used_vars = sorted(set(VAR_USE_RE.findall(css_text)))
    cmap = core_css_map(core)
    mapped = [v for v in used_vars if v in cmap]
    mt = src.text("manifest.json")
    man = None
    extras_css = set()
    if mt is None:
        warns.append("manifest.json is missing: the lab will auto-scan it (works, but no core@1 mapping, tiers or tags)")
    else:
        try:
            man = json.loads(mt)
        except ValueError as e:
            errs.append("manifest.json: JSON error (%s)" % e)
    if man is not None:
        if man.get("schema") != 3:
            warns.append("manifest.json is schema %s; schema 3 (inherits core@1) is the standard" % man.get("schema", 2))
        else:
            meta = man.get("meta") or {}
            if meta.get("id") not in (None, cid):
                errs.append("manifest meta.id %r does not match the folder name %r" % (meta.get("id"), cid))
            if meta.get("license") == "licensed-private":
                errs.append("manifest licence is licensed-private (not for this public repo)")
            if not meta.get("license"):
                warns.append("manifest has no meta.license (original, MIT, ...)")
            src_meta = meta.get("source") or {}
            if meta.get("license") not in (None, "original") and not src_meta.get("url"):
                warns.append("open-source licence but no meta.source.url (provenance)")
            m_errs, m_warns = [], []
            try:
                checker.check_manifest(cid, man, core, m_errs, m_warns)
                errs.extend(m_errs)
                warns.extend(m_warns)
            except Exception as e:   # a broken manifest must not stop the batch
                errs.append("manifest.json could not be checked (%s)" % e)
            for e in man.get("extras") or []:
                if isinstance(e, dict) and e.get("css"):
                    extras_css.add(e["css"])
            hidden = set(((man.get("core") or {}).get("hide")) or [])
            notes.append("core controls: %d shown, %d hidden; extras: %d" % (
                len([c for c in core.get("controls", []) if c["id"] not in hidden]), len(hidden), len(man.get("extras") or [])))
    declared = set(re.findall(r"(--[\w-]+)\s*:", css_text))      # set inside the CSS itself (derived values)
    in_js = set(re.findall(r"--[\w-]+", js))                        # set by component.js
    for e in (man or {}).get("extras") or []:
        if isinstance(e, dict):
            for k in (e.get("cssMap") or {}).values() if isinstance(e.get("cssMap"), dict) else []:
                extras_css.add(k)
    unmapped = [v for v in used_vars if v not in cmap and v not in extras_css and v not in declared and v not in in_js]
    if mapped:
        notes.append("CSS vars on core controls: " + ", ".join("%s=%s" % (v, cmap[v]) for v in mapped))
    if unmapped:
        warns.append("CSS vars with no control (fixed values unless added as extras): " + ", ".join(unmapped[:12]) + (" ..." if len(unmapped) > 12 else ""))

    verdict = "BLOCKED" if errs else ("NEEDS WORK" if warns else "READY")
    return {"id": cid, "source": src.label, "verdict": verdict, "errors": errs, "warnings": warns, "notes": notes,
            "files": sorted(files)}


def main(argv):
    as_json = "--json" in argv
    paths = [a for a in argv if not a.startswith("--")]
    if not paths:
        print(__doc__.strip())
        return 2
    core = checker.load_json(checker.CORE_PATH)
    taken = {d for d in os.listdir(COMP) if os.path.isdir(os.path.join(COMP, d))}
    items, problems = collect(paths)
    ids = [cid for cid, _ in items]
    results = [analyze(cid, src, core, taken, ids) for cid, src in items]
    if as_json:
        print(json.dumps({"problems": problems, "components": results}, indent=2))
    else:
        for p in problems:
            print("!! " + p)
        for r in results:
            print("%-10s %s  (%s)" % (r["verdict"], r["id"], r["source"]))
            for e in r["errors"]:
                print("   error   " + e)
            for w in r["warnings"]:
                print("   warn    " + w)
            for n in r["notes"]:
                print("   note    " + n)
        counts = {v: sum(1 for r in results if r["verdict"] == v) for v in ("READY", "NEEDS WORK", "BLOCKED")}
        print("import-component: %d checked: %d ready, %d need work, %d blocked%s" % (
            len(results), counts["READY"], counts["NEEDS WORK"], counts["BLOCKED"],
            (", %d problem(s)" % len(problems)) if problems else ""))
    return 1 if problems or any(r["verdict"] == "BLOCKED" for r in results) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
