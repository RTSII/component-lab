"""Serve the Component Lab and let "+ New" and "Save manifest" work.

Usage (from the component-lab folder):
    python serve.py            # http://127.0.0.1:5179
    python serve.py 5179 --open
    python serve.py 8090       # another port (use one if 5179 is busy)

Same as "python -m http.server", plus two endpoints. Listens on 127.0.0.1 only.
    POST /api/new       {name, kind, palette, title}  -> runs new-component.py create()
    POST /api/manifest  {id, manifest}                -> writes components/<id>/manifest.json
Standard library only.
"""
import http.server
import importlib.util
import json
import os
import re
import sys
import webbrowser

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("new_component", os.path.join(HERE, "new-component.py"))
new_component = importlib.util.module_from_spec(spec)
spec.loader.exec_module(new_component)
ID_RE = re.compile(r"^[a-z0-9_][a-z0-9_-]{0,40}$")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=HERE, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "/api/" in str(args[0] if args else "") or (len(args) > 1 and str(args[1])[:1] in "45"):
            super().log_message(fmt, *args)

    def reply(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        port = self.server.server_port
        host = self.headers.get("Host", "")
        origin = self.headers.get("Origin", "")
        allowed_hosts = ("127.0.0.1:%d" % port, "localhost:%d" % port)
        allowed_origins = ("http://127.0.0.1:%d" % port, "http://localhost:%d" % port)
        if host not in allowed_hosts or (origin and origin not in allowed_origins):
            return self.reply(403, {"ok": False, "error": "Forbidden origin"})
        path = self.path.rstrip("/")
        try:
            n = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(n) or b"{}")
            if path == "/api/new":
                name = body.get("name", "")
                palette = body.get("palette") if isinstance(body.get("palette"), dict) else None
                new_component.create(name, body.get("kind") or "card", palette, body.get("title"))
                return self.reply(200, {"ok": True, "name": name})
            if path == "/api/manifest":
                cid = body.get("id", "")
                man = body.get("manifest")
                if cid == "_template":
                    raise ValueError("Template is read-only; use + New to create a component.")
                if not ID_RE.match(cid) or not os.path.isdir(os.path.join(HERE, "components", cid)):
                    raise ValueError("No component folder components/%s" % cid)
                if not isinstance(man, dict) or not isinstance(man.get("vars"), list):
                    raise ValueError("manifest must be an object with a vars list")
                with open(os.path.join(HERE, "components", cid, "manifest.json"), "w", encoding="utf-8", newline="\n") as f:
                    json.dump(man, f, indent=2)
                    f.write("\n")
                return self.reply(200, {"ok": True})
            self.send_error(404)
        except ValueError as e:
            self.reply(400, {"ok": False, "error": str(e)})
        except Exception as e:
            self.reply(500, {"ok": False, "error": str(e)})


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--open"]
    open_browser = "--open" in sys.argv[1:]
    port = int(args[0]) if args else 5179
    url = "http://127.0.0.1:%d/" % port
    try:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler)
    except OSError:
        print("Port %d is busy (another copy of the lab may already be running there)." % port)
        print("Open %s or run: python serve.py %d" % (url, port + 1))
        if open_browser:
            webbrowser.open(url)
            sys.exit(0)
        sys.exit(1)
    print("Component Lab: %s  (Ctrl+C to stop)" % url)
    if open_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()
