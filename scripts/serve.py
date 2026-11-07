"""Static dev server for previews and Playwright. Larger backlog than http.server's default of 5."""
import http.server
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True


if __name__ == "__main__":
    with Server(("127.0.0.1", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
        print(f"serving on http://localhost:{PORT}")
        httpd.serve_forever()
