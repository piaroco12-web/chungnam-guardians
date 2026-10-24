"""충남 수호대 로컬 실행. Python 3만 있으면 된다."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Timer
import webbrowser

root = Path(__file__).resolve().parent
server = None
for port in range(8765, 8785):
    try:
        server = ThreadingHTTPServer(('127.0.0.1', port), partial(SimpleHTTPRequestHandler, directory=str(root)))
        break
    except OSError:
        continue
if server is None:
    raise SystemExit('사용할 수 있는 포트가 없습니다. 다른 실행 창을 닫고 다시 시작하세요.')
url = f'http://127.0.0.1:{server.server_port}/'
print(f'충남 수호대 실행: {url}\n이 창을 열어 두세요. 종료: Ctrl+C')
Timer(0.5, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
