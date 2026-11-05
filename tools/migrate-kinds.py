"""One-way migration: components/_template/kinds.json (hide lists) -> components/_kinds/ (one folder per kind).

Usage (from the component-lab folder):  python tools/migrate-kinds.py [--force]

For every kind it resolves the template with the old hide list, drops controls that do nothing for that kind's
markup (tools/check-components.py dead_controls), and writes:
  components/_kinds/kinds.json          index: picker order
  components/_kinds/<kind>/kind.json    label, desc, category, frames, featured, defaults, show (+ colorGroup, freePicks)
  components/_kinds/<kind>/markup.html  the kind's starter markup (was the KINDS table in _template/component.js)
The old kinds.json stays in place; loaders read _kinds/ first and fall back to it (docs/HIERARCHY.md 3.2).
Standard library only. Refuses to overwrite an existing _kinds/ unless --force.
"""
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("chk", os.path.join(HERE, "tools", "check-components.py"))
chk = importlib.util.module_from_spec(spec)
spec.loader.exec_module(chk)


def main():
    if os.path.exists(chk.KINDS_INDEX) and "--force" not in sys.argv[1:]:
        print("components/_kinds/ already exists (use --force to rebuild it from _template/kinds.json)")
        return 1
    core = chk.load_json(chk.CORE_PATH)
    tpl = chk.load_json(os.path.join(chk.TEMPLATE_DIR, "manifest.json"))
    legacy = chk.load_json(chk.KINDS_PATH).get("kinds") or {}
    src = chk.template_sources()
    os.makedirs(chk.KINDS_DIR, exist_ok=True)
    for kid, k in legacy.items():
        markup = chk.kind_markup(kid, src["component.js"]) if not os.path.exists(os.path.join(chk.KINDS_DIR, kid, "markup.html")) else None
        if markup is None:
            with open(os.path.join(chk.KINDS_DIR, kid, "markup.html"), encoding="utf-8") as f:
                markup = f.read()
        vars_ = chk.resolve(chk.apply_kind(tpl, kid, k, core), core)
        dead = set(chk.dead_controls(vars_, src["style.css"], src["component.js"], markup))
        show = [v["id"] for v in vars_ if v["id"] not in dead]
        out = {"label": k.get("label"), "desc": k.get("desc"), "category": k.get("category"), "frames": k.get("frames")}
        out["featured"] = [x for x in k.get("featured") or [] if x in show]
        d = {a: b for a, b in (k.get("defaults") or {}).items() if a in show}
        if d:
            out["defaults"] = d
        out["show"] = show
        for extra in ("colorGroup", "freePicks"):
            if extra in k:
                out[extra] = k[extra]
        os.makedirs(os.path.join(chk.KINDS_DIR, kid), exist_ok=True)
        with open(os.path.join(chk.KINDS_DIR, kid, "kind.json"), "w", encoding="utf-8", newline="\n") as f:
            f.write(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
        with open(os.path.join(chk.KINDS_DIR, kid, "markup.html"), "w", encoding="utf-8", newline="\n") as f:
            f.write(markup.rstrip("\n") + "\n")
        print("%-20s show %2d, dropped (did nothing): %s" % (kid, len(show), ", ".join(sorted(dead)) or "-"))
    with open(chk.KINDS_INDEX, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps({"$comment": "Kinds for New component, in picker order. Each kind is a folder here with kind.json "
                            "(show = the exact core controls it supports) and markup.html. Add a kind: add a folder + its id below.",
                            "order": list(legacy.keys())}, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
