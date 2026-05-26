const http = require('http');
const https = require('https');
const zlib = require('zlib');

const STATIONS = {
  '530': 'http://202.70.33.41:4030/api/dashboard/stationinfo/530',
  '531': 'http://202.70.33.41:4030/api/dashboard/stationinfo/531'
};

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // CORS - бүх домэйнаас хандах зөвшөөрөл
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date() }));
    return;
  }

  // Station routes: /530 or /531
  const match = req.url.match(/^\/(\d+)/);
  const stationId = match ? match[1] : null;
  const target = stationId ? STATIONS[stationId] : null;

  if (!target) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Station not found. Use /530 or /531' }));
    return;
  }

  console.log(`[${new Date().toLocaleTimeString()}] Станц ${stationId} дата татаж байна...`);

  const url = new URL(target);
  const options = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Origin': 'http://202.70.33.41',
      'Referer': 'http://202.70.33.41/',
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const enc = proxyRes.headers['content-encoding'];
    if (enc === 'gzip') {
      proxyRes.pipe(zlib.createGunzip()).pipe(res);
    } else {
      proxyRes.pipe(res);
    }
  });

  proxyReq.on('error', (e) => {
    console.error('Алдаа:', e.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  });

  proxyReq.end();
});

server.listen(PORT, () => {
  console.log(`✅ Proxy сервер ажиллаж байна: port ${PORT}`);
  console.log(`📊 Дархан: /530`);
  console.log(`📊 Шарын гол: /531`);
});
