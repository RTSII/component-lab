"""Make a new lab component from the blank template.

Usage (from the component-lab folder):
    python new-component.py quiz-mode-button
    python new-component.py quiz-mode-button --kind hero
    kinds: card, nav, hero, animated-background, list, button

Copies components/_template/ to components/<name>/, writes its manifest.json for the
kind (featured controls, frame size, defaults) and an optional palette, sets its title,
and adds <name> to components/registry.js. The lab's "+ New" stepper calls create()
through serve.py. Standard library only.
"""
import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
COMP = os.path.join(HERE, "components")
TEMPLATE = os.path.join(COMP, "_template")
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,40}$")
HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def kinds():
    with open(os.path.join(TEMPLATE, "kinds.json"), encoding="utf-8") as f:
        return json.load(f)["kinds"]


def create(name, kind="card", palette=None, title=None):
    if not NAME_RE.match(name or ""):
        raise ValueError("Use lowercase letters, numbers and dashes only (e.g. quiz-mode-button).")
    all_kinds = kinds()
    if kind not in all_kinds:
        raise ValueError("Unknown kind %r. Use one of: %s" % (kind, ", ".join(all_kinds)))
    dest = os.path.join(COMP, name)
    if os.path.exists(dest):
        raise ValueError("components/%s already exists." % name)
    title = (title or name.replace("-", " ").capitalize()).strip()[:60]

    shutil.copytree(TEMPLATE, dest, ignore=shutil.ignore_patterns("kinds.json"))
    try:
        js = os.path.join(dest, "component.js")
        with open(js, encoding="utf-8") as f:
            src = f.read()
        src = src.replace("title: 'Blank template'", "title: %s" % json.dumps(title), 1)
        with open(js, "w", encoding="utf-8", newline="\n") as f:
            f.write(src)

        k = all_kinds[kind]
        mpath = os.path.join(dest, "manifest.json")
        with open(mpath, encoding="utf-8") as f:
            man = json.load(f)
        man["kind"] = kind
        man["title"] = title
        man["frames"] = k.get("frames", man.get("frames"))
        defaults = k.get("defaults", {})
        for v in man["vars"]:
            v["featured"] = v["id"] in k["featured"]
            if v["id"] in defaults:
                v["default"] = defaults[v["id"]]
            role = v.get("role")
            if palette and v.get("control") == "swatch-role" and role in palette and HEX_RE.match(str(palette[role])):
                v["default"] = palette[role].lower()
        with open(mpath, "w", encoding="utf-8", newline="\n") as f:
            json.dump(man, f, indent=2)
            f.write("\n")

        reg = os.path.join(COMP, "registry.js")
        with open(reg, encoding="utf-8") as f:
            text = f.read()
        if "'%s'" % name not in text:
            text = text.replace("];", "  '%s',\n];" % name, 1)
            with open(reg, "w", encoding="utf-8", newline="\n") as f:
                f.write(text)
    except Exception:
        shutil.rmtree(dest, ignore_errors=True)
        raise
    return dest


if __name__ == "__main__":
    args = sys.argv[1:]
    kind = "card"
    if "--kind" in args:
        i = args.index("--kind")
        if i + 1 >= len(args):
            print(__doc__)
            sys.exit(1)
        kind = args[i + 1]
        del args[i:i + 2]
    if len(args) != 1:
        print(__doc__)
        sys.exit(1)
    try:
        path = create(args[0], kind)
    except ValueError as e:
        print("Error:", e)
        sys.exit(1)
    print("Created", path)
    print("Refresh the lab and pick it, or open: http://127.0.0.1:5179/#c=" + args[0])
