// Local preview: node scripts/dev.mjs <data-dir> [port]  serves public/ and the data directory at /data/
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public'), data = path.resolve(process.argv[2] || 'data'), port = Number(process.argv[3]) || 8750;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html';
  const f = u.startsWith('/data/') ? path.join(data, u.slice(6)) : path.join(root, u);
  if (!f.startsWith(root) && !f.startsWith(data)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end('not found'); } res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(b); });
}).listen(port, () => console.log('http://localhost:' + port));
