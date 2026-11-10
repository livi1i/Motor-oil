import http.server, pathlib, urllib.parse, mimetypes, os
ROOT=pathlib.Path(__file__).resolve().parent
class Handler(http.server.BaseHTTPRequestHandler):
 def do_HEAD(self):self.serve(False)
 def do_GET(self):self.serve(True)
 def serve(self,body):
  relative=urllib.parse.unquote(urllib.parse.urlsplit(self.path).path).lstrip('/') or 'index.html'
  if not(relative in ('index.html','robots.txt','data/research/locations.json') or relative.startswith(('src/','public/','assets/images/','assets/videos/'))):self.send_error(404);return
  target=(ROOT/relative).resolve()
  if not target.is_relative_to(ROOT) or not target.is_file():self.send_error(404);return
  clean=target.relative_to(ROOT).as_posix()
  if not(clean in ('index.html','robots.txt','data/research/locations.json') or clean.startswith(('src/','public/','assets/images/','assets/videos/'))):self.send_error(404);return
  size=target.stat().st_size;start=0;end=size-1;partial=False
  range_header=self.headers.get('Range','')
  if range_header.startswith('bytes='):
   try:
    spec=range_header[6:].split(',')[0];a,b=spec.split('-',1);start=int(a) if a else max(0,size-int(b));end=min(int(b),size-1) if b and a else size-1
    if start>=size or start>end:raise ValueError()
    partial=True
   except ValueError:self.send_response(416);self.send_header('Content-Range',f'bytes */{size}');self.end_headers();return
  self.send_response(206 if partial else 200);self.send_header('Content-Type',mimetypes.guess_type(str(target))[0] or 'application/octet-stream');self.send_header('Content-Length',str(end-start+1));self.send_header('Accept-Ranges','bytes');self.send_header('Cache-Control','no-cache');self.send_header('X-Robots-Tag','noindex, nofollow')
  if partial:self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
  self.end_headers()
  if body:
   try:
    with target.open('rb') as file:
     file.seek(start);remaining=end-start+1
     while remaining:
      data=file.read(min(65536,remaining))
      if not data:break
      self.wfile.write(data);remaining-=len(data)
   except (BrokenPipeError,ConnectionResetError,ConnectionAbortedError):pass
 def log_message(self,*args):pass
http.server.ThreadingHTTPServer(('127.0.0.1',57005),Handler).serve_forever()
