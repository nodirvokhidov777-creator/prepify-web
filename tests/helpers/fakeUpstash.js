import http from 'node:http';

/**
 * A tiny in-memory server implementing the subset of Upstash's REST protocol
 * the app uses (POST a JSON-array command, Bearer auth, {result}/{error}).
 * It lets tests exercise the real HTTP client, including failure modes.
 */
export async function startFakeUpstash({ token = 'fake-upstash-token-for-tests' } = {}) {
  const data = new Map();
  const log = [];
  const state = { mode: 'ok' }; // ok | http500 | garbage | error-payload | hang

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      if (state.mode === 'hang') return; // never answer
      if (state.mode === 'http500') { res.writeHead(500); return res.end('internal error'); }
      if (state.mode === 'error-payload') {
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ error: 'ERR something internal: db-password-hunter2' }));
      }
      if (state.mode === 'garbage') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<html>not json</html>'); }
      if (req.headers.authorization !== `Bearer ${token}`) {
        res.writeHead(401, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Unauthorized' }));
      }
      let command;
      try { command = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch {
        res.writeHead(400, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ error: 'ERR invalid command' }));
      }
      log.push(command.map(String));
      const [name, key, ...rest] = command;
      let result;
      switch (String(name).toUpperCase()) {
        case 'GET': result = data.has(key) ? data.get(key) : null; break;
        case 'SET': {
          const flags = rest.slice(1).map((x) => String(x).toUpperCase());
          if (flags.includes('NX') && data.has(key)) result = null;
          else { data.set(key, String(rest[0])); result = 'OK'; }
          break;
        }
        case 'DEL': result = data.delete(key) ? 1 : 0; break;
        case 'INCR': { const n = Number(data.get(key) ?? 0) + 1; data.set(key, String(n)); result = n; break; }
        case 'EXPIRE': result = data.has(key) ? 1 : 0; break;
        default:
          res.writeHead(400, { 'content-type': 'application/json' });
          return res.end(JSON.stringify({ error: `ERR unknown command '${name}'` }));
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ result }));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`, token, data, log, state,
    close: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve); }),
  };
}
