import http.server, socketserver, os

PORT = 8099
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # serve Syllabusplus/

class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path in ('/', '/index.html'):
            self.path = '/hub.html'
        return super().do_GET()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), H) as httpd:
    print(f"serving hub on {PORT}")
    httpd.serve_forever()
