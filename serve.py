#!/usr/bin/env python3
"""Serve the site locally for previewing.

The pages fetch their data with JavaScript, which browsers block on file://
URLs, so opening the .html files directly won't work — you need a server.

This one sends no-cache headers. Plain `python3 -m http.server` lets the
browser hold on to stale CSS, JSON and video, which makes edits look like
they did nothing.

    python3 serve.py          # http://localhost:8000
    python3 serve.py 8080     # pick another port
"""

import functools
import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PORT = 8000


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    # Strip conditional-request headers so a stale copy can never 304 through.
    def send_head(self):
        for header in ("If-Modified-Since", "If-None-Match"):
            if header in self.headers:
                del self.headers[header]
        return super().send_head()


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    port = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            sys.exit(f"Not a port number: {sys.argv[1]}")

    handler = functools.partial(NoCacheHandler, directory=ROOT)
    try:
        with Server(("0.0.0.0", port), handler) as httpd:
            print(
                f"Serving the site at http://localhost:{port}  (Ctrl+C to stop)",
                flush=True,
            )
            httpd.serve_forever()
    except OSError as err:
        sys.exit(f"Couldn't listen on port {port}: {err}")
    except KeyboardInterrupt:
        print()


if __name__ == "__main__":
    main()
