#!/usr/bin/env python3
"""キャッシュなしのローカル開発サーバー"""
from http.server import HTTPServer, SimpleHTTPRequestHandler

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        pass  # ログを抑制

if __name__ == "__main__":
    server = HTTPServer(("", 8081), NoCacheHandler)
    print("サーバー起動: http://localhost:8080")
    server.serve_forever()
