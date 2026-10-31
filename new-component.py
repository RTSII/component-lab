"""Make a new lab component from the blank template (schema 3, inherits core@1).

Usage (from the component-lab folder):
    python new-component.py quiz-mode-button
    python new-component.py quiz-mode-button --kind button --category buttons \
        --tags purpose:button,interaction:hover,feel:neon --license original
    kinds: card, nav, hero, animated-background, list, button  (components/_template/kinds.json)
    categories / tags / licences: components/_core/core.json (categories, tagVocab, licenses)

Copies components/_template/ to components/<name>/ and writes its manifest.json: meta (id, name, kind,
category, tags, licence, status draft, dates), the kind's frame size, starred controls and default
overrides, and an optional palette (swatch defaults by role). The new component inherits every core
control, including the 5 interaction slots (IX_HOVER / IX_PRESS / IX_DRAG / IX_TOUCH / IX_KEY) that the
template's component.js already wires, and its CSS is centred in the frame. Then it runs
tools/check-components.py, which validates the manifest and regenerates components/index.json and
components/registry.js; if the check fails the new folder is removed. The lab's "+ New" stepper calls
create() through serve.py. Licensed code never goes in this public tree (--license licensed-private is
refused). Standard library only.
"""
import datetime
import importlib.util
import io
import json
import os
import re
import shutil
import sys
from contextlib import redirect_stdout

HERE = os.path.dirname(os.path.abspath(__file__))
COMP = os.path.join(HERE, "components")
TEMPLATE = os.path.join(COMP, "_template")
CORE = os.path.join(COMP, "_core", "core.json")
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,40}$")
HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def kinds():
    return _load(os.path.join(TEMPLATE, "kinds.json"))["kinds"]


def _checker():
    spec = importlib.util.spec_from_file_location("check_components", os.path.join(HERE, "tools", "check-components.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def parse_tags(spec, core):
    """'purpose:card,feel:neon' (group:tag) or 'card,neon' (group looked up in core.json tagVocab)."""
    vocab = core.get("tagVocab", {})
    out = {}
    if not spec:
        return out
    items = spec if isinstance(spec, list) else [t for t in re.split(r"[,\s]+", str(spec)) if t]
    for item in items:
        if ":" in item:
            g, t = item.split(":", 1)
        else:
            t = item
            g = next((k for k, tags in vocab.items() if t in tags), None)
            if not g:
                raise ValueError("Unknown tag %r. Add it to core.json tagVocab or use group:tag." % t)
        if g not in vocab or t not in vocab[g]:
            raise ValueError("Unknown tag %s:%s (core.json tagVocab)." % (g, t))
        out.setdefault(g, [])
        if t not in out[g]:
            out[g].append(t)
    return out


def create(name, kind="card", palette=None, title=None, category=None, tags=None, license="original"):
    if not NAME_RE.match(name or ""):
        raise ValueError("Use lowercase letters, numbers and dashes only (e.g. quiz-mode-button).")
    all_kinds = kinds()
    if kind not in all_kinds:
        raise ValueError("Unknown kind %r. Use one of: %s" % (kind, ", ".join(all_kinds)))
    core = _load(CORE)
    k = all_kinds[kind]
    category = category or k.get("category") or "created"
    if category not in core.get("categories", []):
        raise ValueError("Unknown category %r. Use one of: %s" % (category, ", ".join(core.get("categories", []))))
    license = license or "original"
    if license not in core.get("licenses", []):
        raise ValueError("Unknown licence %r. Use one of: %s" % (license, ", ".join(core.get("licenses", []))))
    if license == "licensed-private":
        raise ValueError("Licensed components stay in the private vault, not this public repo.")
    tag_map = parse_tags(tags, core)
    dest = os.path.join(COMP, name)
    if os.path.exists(dest):
        raise ValueError("components/%s already exists." % name)
    title = (title or name.replace("-", " ").capitalize()).strip()[:60]
    today = datetime.date.today().isoformat()

    shutil.copytree(TEMPLATE, dest, ignore=shutil.ignore_patterns("kinds.json"))
    try:
        js = os.path.join(dest, "component.js")
        with open(js, encoding="utf-8") as f:
            src = f.read()
        src = src.replace("title: 'Blank template'", "title: %s" % json.dumps(title), 1)
        with open(js, "w", encoding="utf-8", newline="\n") as f:
            f.write(src)

        mpath = os.path.join(dest, "manifest.json")
        man = _load(mpath)
        man["meta"].update({
            "id": name, "name": title, "version": "0.1.0", "kind": kind, "category": category,
            "tags": tag_map or ({"purpose": [kind]} if kind in core.get("tagVocab", {}).get("purpose", []) else {}),
            "license": license, "status": "draft", "created": today, "updated": today,
            "source": {"origin": "original" if license == "original" else "open-source", "author": "Rob", "url": None, "vaultId": None, "note": ""}})
        man["frames"] = k.get("frames", man.get("frames"))
        c = man.setdefault("core", {})
        core_ids = {cc["id"] for cc in core.get("controls", [])}
        c["hide"] = [h for h in (k.get("hide") or []) if h in core_ids and h not in (c.get("freePicks") or [])]
        ov = {}
        featured = set(k.get("featured", []))
        resolved_ids = [cc["id"] for cc in core.get("controls", []) if cc["id"] not in c["hide"]] + list(c.get("opt") or [])
        for cid in resolved_ids:
            if cid in featured:
                ov.setdefault(cid, {})["featured"] = True
        for cid, val in (k.get("defaults") or {}).items():
            ov.setdefault(cid, {})["default"] = val
        if palette:
            for cc in core.get("controls", []) + core.get("optional", []):
                if cc["id"] in resolved_ids and cc.get("widget") == "swatches":
                    role = cc.get("role")
                    if role in palette and HEX_RE.match(str(palette[role])):
                        ov.setdefault(cc["id"], {})["default"] = palette[role].lower()
        keep = {kk: vv for kk, vv in (c.get("override") or {}).items() if kk not in ov and set(vv) - {"featured"}}
        for kk, vv in keep.items():
            ov[kk] = {a: b for a, b in vv.items() if a != "featured"}
        c["override"] = ov
        with open(mpath, "w", encoding="utf-8", newline="\n") as f:
            json.dump(man, f, indent=2)
            f.write("\n")

        buf = io.StringIO()
        with redirect_stdout(buf):
            rc = _checker().run(write=True)
        if rc:
            raise ValueError("check-components failed:\n" + buf.getvalue())
    except Exception:
        shutil.rmtree(dest, ignore_errors=True)
        try:
            with redirect_stdout(io.StringIO()):
                _checker().run(write=True)   # drop the half-made folder from registry / index again
        except Exception:
            pass
        raise
    return dest


def _opt(args, flag, default=None):
    if flag in args:
        i = args.index(flag)
        if i + 1 >= len(args):
            print(__doc__)
            sys.exit(1)
        val = args[i + 1]
        del args[i:i + 2]
        return val
    return default


if __name__ == "__main__":
    args = sys.argv[1:]
    kind = _opt(args, "--kind", "card")
    category = _opt(args, "--category")
    tags = _opt(args, "--tags")
    lic = _opt(args, "--license", "original")
    title = _opt(args, "--title")
    if len(args) != 1:
        print(__doc__)
        sys.exit(1)
    try:
        path = create(args[0], kind, None, title, category, tags, lic)
    except ValueError as e:
        print("Error:", e)
        sys.exit(1)
    print("Created", path, "(checked; registry.js and index.json updated)")
    print("Refresh the lab and pick it, or open: http://127.0.0.1:5179/#c=" + args[0])
