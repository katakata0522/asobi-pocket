import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, 'my-webservice/asobi-pocket');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createSolidPng(width, height, r, g, b) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const row = Buffer.alloc(1 + width * 3);
  row[0] = 0;
  for (let x = 0; x < width; x++) {
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  const idat = zlib.deflateSync(raw);

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const FALLBACK_SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<rect width="64" height="64" rx="16" fill="#E54B36"/>' +
  '<rect x="14" y="14" width="15" height="15" rx="4" fill="#FFFDF8"/>' +
  '<rect x="35" y="14" width="15" height="15" rx="4" fill="#FFFDF8" opacity="0.9"/>' +
  '<rect x="14" y="35" width="15" height="15" rx="4" fill="#FFFDF8" opacity="0.9"/>' +
  '<rect x="35" y="35" width="15" height="15" rx="4" fill="#FFD166"/>' +
  '</svg>',
  'utf8'
);

const FALLBACK_ASSETS = new Map([
  ['/assets/pocket-mark.svg', { contentType: 'image/svg+xml', body: () => FALLBACK_SVG }],
  ['/assets/pocket-192.png', { contentType: 'image/png', body: () => createSolidPng(192, 192, 0xe5, 0x4b, 0x36) }],
  ['/assets/pocket-512.png', { contentType: 'image/png', body: () => createSolidPng(512, 512, 0xe5, 0x4b, 0x36) }],
  ['/assets/share-card.png', { contentType: 'image/png', body: () => createSolidPng(1200, 630, 0xf8, 0xf6, 0xef) }],
]);

const fallbackCache = new Map();

export function createAppServer(rootDir = APP_ROOT) {
  return http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Method Not Allowed');
      return;
    }

    let pathname;
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      pathname = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad Request');
      return;
    }

    // Normalize requests with /asobi-pocket prefix if accessed via canonical path
    if (pathname === '/asobi-pocket' || pathname.startsWith('/asobi-pocket/')) {
      pathname = pathname.slice('/asobi-pocket'.length) || '/';
    }

    const resolvedPath = path.resolve(rootDir, '.' + pathname);
    if (resolvedPath !== rootDir && !resolvedPath.startsWith(rootDir + path.sep)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    let targetFile = resolvedPath;
    if (fs.existsSync(targetFile) && fs.statSync(targetFile).isDirectory()) {
      if (!pathname.endsWith('/')) {
        res.writeHead(301, { Location: pathname + '/' });
        res.end();
        return;
      }
      targetFile = path.join(targetFile, 'index.html');
    }

    if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
      const ext = path.extname(targetFile).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const body = fs.readFileSync(targetFile);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': body.length,
        'Cache-Control': 'no-cache',
      });
      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end(body);
      }
      return;
    }

    // In-memory fallback for gitignored icon/OGP assets so PWA/SW boot cleanly without committing media
    const fallbackSpec = FALLBACK_ASSETS.get(pathname);
    if (fallbackSpec) {
      let body = fallbackCache.get(pathname);
      if (!body) {
        body = fallbackSpec.body();
        fallbackCache.set(pathname, body);
      }
      res.writeHead(200, {
        'Content-Type': fallbackSpec.contentType,
        'Content-Length': body.length,
        'Cache-Control': 'no-cache',
      });
      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end(body);
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const server = createAppServer();
  server.listen(PORT, HOST, () => {
    console.log(`Asobi Pocket server listening at http://${HOST}:${PORT}`);
  });
}
