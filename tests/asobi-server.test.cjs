const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const zlib = require('node:zlib');

async function startTestServer() {
  const { createAppServer } = await import('../server.js');
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, port };
}

function request(port, reqPath, headers = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, path: reqPath, method, headers },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

test('server.js serves gzip-compressed assets with Vary, ETag, 304, and nosniff', async () => {
  const { server, port } = await startTestServer();
  try {
    const plain = await request(port, '/evolution.css', { 'accept-encoding': 'identity' });
    assert.equal(plain.status, 200);
    assert.equal(plain.headers['x-content-type-options'], 'nosniff');
    assert.equal(plain.headers['content-encoding'], undefined);
    assert.match(String(plain.headers['vary'] || ''), /Accept-Encoding/i);
    assert.ok(plain.headers.etag, 'ETag header should be set');

    const gz = await request(port, '/evolution.css', { 'accept-encoding': 'gzip, deflate' });
    assert.equal(gz.status, 200);
    assert.equal(gz.headers['content-encoding'], 'gzip');
    assert.ok(gz.body.length < plain.body.length * 0.4, 'gzip should significantly shrink CSS');
    assert.equal(zlib.gunzipSync(gz.body).toString('utf8'), plain.body.toString('utf8'));

    const notModified = await request(port, '/evolution.css', {
      'if-none-match': plain.headers.etag,
      'accept-encoding': 'gzip',
    });
    assert.equal(notModified.status, 304);
    assert.equal(notModified.body.length, 0);

    const headRes = await request(port, '/evolution.css', { 'accept-encoding': 'gzip' }, 'HEAD');
    assert.equal(headRes.status, 200);
    assert.equal(headRes.headers['content-encoding'], 'gzip');
    assert.equal(headRes.body.length, 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('server.js normalizes /asobi-pocket prefix and blocks path traversal', async () => {
  const { server, port } = await startTestServer();
  try {
    const canonical = await request(port, '/asobi-pocket/');
    assert.equal(canonical.status, 200);
    assert.match(canonical.body.toString('utf8'), /あそびポケット/);

    const fallbackIcon = await request(port, '/assets/pocket-192.png');
    assert.equal(fallbackIcon.status, 200);
    assert.equal(fallbackIcon.headers['content-type'], 'image/png');

    const traversal = await request(port, '/..%2f..%2fpackage.json');
    assert.equal(traversal.status, 403);

    const missing = await request(port, '/definitely-not-a-real-file-12345.html');
    assert.equal(missing.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
