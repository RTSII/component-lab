"""Check every component manifest and regenerate the library index.

Usage (from the component-lab folder):
    python tools/check-components.py           # check + regenerate components/index.json and registry.js
    python tools/check-components.py --check   # check only, write nothing (exit 1 on errors)

What it checks (schema 3 = core@1 + overrides + extras; schema 2 = legacy "vars" list, checked lightly):
  - required meta fields, kind / category / license / status / tags from components/_core/core.json
  - unique control ids; extras never reuse a core id (core or optional); overrides only on known core ids
    and only whitelisted keys; aliases point at real controls
  - ranges: min < max, step > 0, default inside [min, max]; option defaults are one of the options
  - fade pairs in order: a control with "pair": "<B>" has default(A) <= default(B)
  - tier budget: Free <= 6 controls, Free + Mid <= 22 (core.json "budget")
  - licence guard: no "licensed-private" component and no licensed / Aceternity source in the public tree
    (components/ and lab/); those live in the private vault only
Writes (unless --check): components/index.json (library index) and components/registry.js (picker order:
existing order kept, new folders appended, _template last). Runs from serve.py at start and from
new-component.py after a scaffold. Standard library only.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMP = os.path.join(HERE, "components")
CORE_PATH = os.path.join(COMP, "_core", "core.json")
ID_RE = re.compile(r"^[A-Z][A-Z0-9_]*$")
NAME_RE = re.compile(r"^(_template|[a-z0-9][a-z0-9-]{0,40})$")
TEXT_EXT = (".js", ".css", ".html", ".json", ".svg", ".mjs", ".ts", ".tsx", ".jsx")
# Markers of licensed / third-party paid code that must never sit in the public repo
LICENSE_MARKERS = re.compile(r"aceternity|ui\.aceternity\.com|licensed-private|all rights reserved", re.I)
TIER_IN = {"free": "free", "mid": "mid", "pro": "pro", "ga": "free", "vip": "mid"}
SECTIONS_LEGACY = {"color", "interact", "surface", "type", "motion", "rate", "layout"}


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def check_control(cid, v, where, errs):
    """Range / default / options sanity on one control (resolved or raw)."""
    mn, mx, st, d = v.get("min"), v.get("max"), v.get("step"), v.get("default")
    if num(mn) and num(mx) and not mn < mx:
        errs.append("%s %s: min %s must be < max %s" % (where, cid, mn, mx))
    if st is not None and (not num(st) or st <= 0):
        errs.append("%s %s: step %r must be > 0" % (where, cid, st))
    if num(d) and num(mn) and num(mx) and not (mn - 1e-9 <= d <= mx + 1e-9):
        errs.append("%s %s: default %s outside %s..%s" % (where, cid, d, mn, mx))
    opts = v.get("options")
    if isinstance(opts, list) and opts and d is not None:
        vals = [o.get("value") if isinstance(o, dict) else o for o in opts]
        if d not in vals and str(d) not in [str(x) for x in vals]:
            errs.append("%s %s: default %r is not one of its options" % (where, cid, d))


def resolve(man, core):
    """Python twin of lab/manifest.js resolve(), enough for checks and the index (id, tier, section, values)."""
    c = man.get("core") or {}
    hide, opt = set(c.get("hide") or []), c.get("opt") or []
    ov = c.get("override") or {}
    picks = c.get("freePicks") or core.get("defaultFreePicks") or []
    mode = (c.get("interaction") or {}).get("mode")
    out = []
    for cc in core.get("controls", []) + [o for o in core.get("optional", []) if o["id"] in opt]:
        if cc["id"] in hide:
            continue
        v = dict(cc)
        if mode and isinstance(cc.get("modes"), dict) and mode in cc["modes"]:
            v.update(cc["modes"][mode])
        for k, x in (ov.get(cc["id"]) or {}).items():
            if x is None:
                v.pop(k, None)
            else:
                v[k] = x
        v["_core"] = True
        out.append(v)
    for e in man.get("extras") or []:
        out.append(dict(e))
    for v in out:
        v["tier"] = TIER_IN.get(v.get("tier"), "pro")
        if v.get("id") in picks:
            v["tier"] = "free"
    return out


def check_manifest(cid, man, core, errs, warns):
    where = "components/%s/manifest.json" % cid
    if man.get("schema") != 3:
        warns.append("%s: legacy schema %s (vars list); move it to schema 3 (core@1) when touched" % (where, man.get("schema", 2)))
        seen = set()
        for v in man.get("vars") or []:
            vid = v.get("id")
            if vid in seen:
                errs.append("%s: duplicate id %s" % (where, vid))
            seen.add(vid)
            check_control(vid, v, where, errs)
        return man.get("vars") or []
    meta = man.get("meta") or {}
    for k in ("id", "name", "version", "kind", "category", "license", "status"):
        if not meta.get(k):
            errs.append("%s: meta.%s is required" % (where, k))
    if meta.get("id") and meta["id"] != cid and cid != "_template":
        errs.append("%s: meta.id %r does not match the folder" % (where, meta["id"]))
    if man.get("inherits") != core.get("ref"):
        errs.append("%s: inherits must be %r" % (where, core.get("ref")))
    if meta.get("category") and meta["category"] not in core.get("categories", []):
        errs.append("%s: unknown category %r" % (where, meta["category"]))
    if meta.get("license") and meta["license"] not in core.get("licenses", []):
        errs.append("%s: unknown license %r" % (where, meta["license"]))
    if meta.get("license") == "licensed-private":
        errs.append("%s: licensed-private components stay in the private vault, not the public repo" % where)
    if meta.get("status") and meta["status"] not in core.get("statuses", []):
        errs.append("%s: unknown status %r" % (where, meta["status"]))
    vocab = core.get("tagVocab", {})
    for group, tags in (meta.get("tags") or {}).items():
        if group not in vocab:
            errs.append("%s: unknown tag group %r" % (where, group))
            continue
        for t in tags or []:
            if t not in vocab[group]:
                errs.append("%s: unknown %s tag %r (add it to core.json tagVocab first)" % (where, group, t))
    core_ids = {c["id"] for c in core.get("controls", []) + core.get("optional", [])}
    c = man.get("core") or {}
    wl = set(core.get("overrideWhitelist", []))
    for oid, o in (c.get("override") or {}).items():
        if oid not in core_ids:
            errs.append("%s: override for unknown core control %s" % (where, oid))
        for k in o or {}:
            if k not in wl:
                errs.append("%s: override %s.%s is not an overridable key" % (where, oid, k))
    for x in (c.get("hide") or []) + (c.get("opt") or []):
        if x not in core_ids:
            errs.append("%s: core.hide/opt names unknown core control %s" % (where, x))
    widgets = set(core.get("widgets", []))
    seen = set()
    for e in man.get("extras") or []:
        eid = e.get("id", "")
        if not ID_RE.match(eid):
            errs.append("%s: extra id %r must be UPPER_SNAKE" % (where, eid))
        if eid in core_ids:
            errs.append("%s: extra %s clashes with a core control name (use the core control + an override)" % (where, eid))
        if eid in seen:
            errs.append("%s: duplicate extra id %s" % (where, eid))
        seen.add(eid)
        for k in ("label", "section", "tier", "widget"):
            if e.get(k) in (None, ""):
                errs.append("%s: extra %s needs %s" % (where, eid, k))
        if e.get("widget") and e["widget"] not in widgets:
            errs.append("%s: extra %s has unknown widget %r" % (where, eid, e["widget"]))
        if e.get("section") and e["section"] not in core.get("sectionOrder", []):
            errs.append("%s: extra %s has unknown section %r" % (where, eid, e["section"]))
        if e.get("tier") and e["tier"] not in TIER_IN:
            errs.append("%s: extra %s has unknown tier %r" % (where, eid, e["tier"]))
    vars_ = resolve(man, core)
    ids = [v.get("id") for v in vars_]
    for d in sorted({i for i in ids if ids.count(i) > 1}):
        errs.append("%s: duplicate control id %s" % (where, d))
    by = {v.get("id"): v for v in vars_}
    for v in vars_:
        check_control(v.get("id"), v, where, errs)
        b = v.get("pair")
        if b:
            if b not in by:
                errs.append("%s: %s pairs with missing control %s" % (where, v["id"], b))
            elif num(v.get("default")) and num(by[b].get("default")) and v["default"] > by[b]["default"]:
                errs.append("%s: fade pair %s (%s) must not start after %s (%s)" % (where, v["id"], v["default"], b, by[b]["default"]))
    for old, new in (man.get("aliases") or {}).items():
        if new not in by:
            errs.append("%s: alias %s -> %s points at no control" % (where, old, new))
        if old in by:
            errs.append("%s: alias %s is still a live control id" % (where, old))
    bud = core.get("budget", {})
    nf = sum(1 for v in vars_ if v["tier"] == "free")
    nm = sum(1 for v in vars_ if v["tier"] in ("free", "mid"))
    if "free" in bud and nf > bud["free"]:
        errs.append("%s: Free has %d controls (budget %d)" % (where, nf, bud["free"]))
    if "mid" in bud and nm > bud["mid"]:
        errs.append("%s: Mid has %d controls (budget %d)" % (where, nm, bud["mid"]))
    return vars_


def license_guard(errs):
    for top in ("components", "lab"):
        base = os.path.join(HERE, top)
        for root, dirs, files in os.walk(base):
            dirs[:] = [d for d in dirs if d not in ("node_modules", ".git", "fonts")]
            for fn in files:
                if not fn.endswith(TEXT_EXT):
                    continue
                p = os.path.join(root, fn)
                rel = os.path.relpath(p, HERE).replace(os.sep, "/")
                if rel == "components/_core/core.json":
                    continue   # lists the licence names on purpose
                try:
                    with open(p, encoding="utf-8", errors="ignore") as f:
                        txt = f.read()
                except OSError:
                    continue
                m = LICENSE_MARKERS.search(txt)
                if m:
                    errs.append("%s: licence marker %r found; licensed code belongs in the private vault" % (rel, m.group(0)))


def write_if_changed(path, text):
    old = None
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            old = f.read()
    if old != text:
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(text)
        return True
    return False


def registry_order():
    """Existing registry order, then any new component folders, _template last."""
    reg = os.path.join(COMP, "registry.js")
    order = []
    if os.path.exists(reg):
        with open(reg, encoding="utf-8") as f:
            order = re.findall(r"'([^']+)'", f.read().split("[", 1)[-1])
    folders = sorted(d for d in os.listdir(COMP) if os.path.isfile(os.path.join(COMP, d, "manifest.json")) and NAME_RE.match(d))
    out = [d for d in order if d in folders and d != "_template"]
    out += [d for d in folders if d not in out and d != "_template"]
    if "_template" in folders:
        out.append("_template")
    return out


def run(write=True, quiet=False):
    errs, warns = [], []
    try:
        core = load_json(CORE_PATH)
    except (OSError, ValueError) as e:
        print("ERROR components/_core/core.json:", e)
        return 1
    cids = [c["id"] for c in core.get("controls", []) + core.get("optional", [])]
    for d in sorted({i for i in cids if cids.count(i) > 1}):
        errs.append("core.json: duplicate core id %s" % d)
    for cc in core.get("controls", []) + core.get("optional", []):
        check_control(cc["id"], cc, "core.json", errs)
    order = registry_order()
    index = []
    for cid in order:
        try:
            man = load_json(os.path.join(COMP, cid, "manifest.json"))
        except ValueError as e:
            errs.append("components/%s/manifest.json: JSON error %s" % (cid, e))
            continue
        vars_ = check_manifest(cid, man, core, errs, warns)
        meta = man.get("meta") or {}
        tiers = {"free": 0, "mid": 0, "pro": 0}
        for v in vars_:
            tiers[TIER_IN.get(v.get("tier"), "pro")] += 1
        index.append({
            "id": cid, "name": meta.get("name") or man.get("title") or cid, "schema": man.get("schema", 2),
            "version": meta.get("version"), "kind": meta.get("kind") or man.get("kind"), "category": meta.get("category"),
            "tags": meta.get("tags") or {}, "license": meta.get("license"), "status": meta.get("status"),
            "inherits": man.get("inherits"), "controls": {"free": tiers["free"], "mid": tiers["free"] + tiers["mid"], "pro": len(vars_)},
            "thumbnail": meta.get("thumbnail"), "updated": meta.get("updated")})
    license_guard(errs)
    if write and not errs:
        changed = write_if_changed(os.path.join(COMP, "index.json"), json.dumps({
            "$comment": "GENERATED by tools/check-components.py from components/*/manifest.json. Do not edit by hand.",
            "core": core.get("ref"), "components": index}, indent=2) + "\n")
        reg = ("// GENERATED by tools/check-components.py (also run by serve.py and new-component.py).\n"
               "// Components shown in the picker, in order. One folder per id under components/.\n"
               "// To reorder, move a line here; the order is kept on the next run. New folders are appended.\n"
               "window.LAB_REGISTRY = [\n" + "".join("  '%s',\n" % c for c in order) + "];\n")
        changed = write_if_changed(os.path.join(COMP, "registry.js"), reg) or changed
        if changed and not quiet:
            print("Updated components/index.json and components/registry.js")
    for w in warns:
        if not quiet:
            print("warn ", w)
    for e in errs:
        print("ERROR", e)
    if not quiet or errs:
        print("check-components: %d component(s), %d error(s), %d warning(s)" % (len(index), len(errs), len(warns)))
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(run(write="--check" not in sys.argv[1:]))
