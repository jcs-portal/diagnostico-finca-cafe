// Service Worker — Diagnóstico de Finca Café
// Fase C: instalable + offline + sync

const CACHE    = 'dfc-v1';
const API_HOST = 'https://doc-comite-finanzas-production.up.railway.app';
const SCOPE    = '/diagnostico-finca-cafe/';
const STATIC   = [
  SCOPE,
  SCOPE + 'index.html',
  SCOPE + 'manifest.json',
  SCOPE + 'icons/icon-192.png',
  SCOPE + 'icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js',
  'https://unpkg.com/docx@9.7.1/dist/index.umd.cjs',
];

// ── IndexedDB helpers ─────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('dfc-queue', 1);
    req.onupgradeneeded = e =>
      e.target.result.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}
async function enqueue(method, url, headers, body) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readwrite');
    tx.objectStore('pending').add({ method, url, headers, body, ts: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror    = e => reject(e.target.error);
  });
}
async function allPending() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction('pending', 'readonly').objectStore('pending').getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}
async function dequeue(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readwrite');
    tx.objectStore('pending').delete(id);
    tx.oncomplete = resolve;
    tx.onerror    = e => reject(e.target.error);
  });
}
async function broadcastCount() {
  const q = await allPending();
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach(c => c.postMessage({ type: 'DFC_QUEUE', count: q.length }));
}

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(STATIC))
      .catch(() => {})
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Archivos estáticos propios (GitHub Pages) y CDNs — cache-first
  if (url.origin === self.location.origin || url.href.startsWith('https://cdnjs.') || url.href.startsWith('https://unpkg.com/')) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // API GET del backend — network-first con caché de respaldo por usuario
  if (url.origin === API_HOST && url.pathname.startsWith('/api/') && req.method === 'GET') {
    event.respondWith(networkFirstWithCache(req));
    return;
  }

  // API escrituras del backend — intentar red; si falla → cola
  if (url.origin === API_HOST && url.pathname.startsWith('/api/') && req.method !== 'GET') {
    event.respondWith(networkOrQueue(req));
    return;
  }

  event.respondWith(fetch(req));
});

// ── Estrategias ───────────────────────────────────────────────────────────────
async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function networkFirstWithCache(req) {
  const code     = req.headers.get('X-Code') || 'anon';
  const cacheKey = new Request(req.url + '#' + code);
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(cacheKey, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(cacheKey);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'Sin conexión', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function networkOrQueue(req) {
  const bodyText = await req.clone().text();
  const hdrs = {};
  req.headers.forEach((v, k) => { hdrs[k] = v; });
  try {
    const res = await fetch(req);
    broadcastCount();
    return res;
  } catch {
    await enqueue(req.method, req.url, hdrs, bodyText);
    await broadcastCount();
    let syntheticBody = {};
    try { syntheticBody = JSON.parse(bodyText || '{}'); } catch {}
    if (!syntheticBody.id) {
      syntheticBody.id = 'OFFLINE-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    }
    syntheticBody._queued = true;
    return new Response(JSON.stringify(syntheticBody),
      { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}

// ── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'dfc-sync') event.waitUntil(replayQueue());
});

// ── Mensajes desde la app ─────────────────────────────────────────────────────
self.addEventListener('message', async event => {
  if (event.data?.type === 'DFC_SYNC_NOW') await replayQueue();
  if (event.data?.type === 'DFC_GET_COUNT') broadcastCount();
});

// ── Reproducir cola ───────────────────────────────────────────────────────────
async function replayQueue() {
  const queue = await allPending();
  let synced = 0;
  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method:  item.method,
        headers: item.headers,
        body:    item.body || undefined,
      });
      if (res.ok || res.status < 500) {
        await dequeue(item.id);
        synced++;
      }
    } catch {
      break;
    }
  }
  await broadcastCount();
  if (synced > 0) {
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    clients.forEach(c => c.postMessage({ type: 'DFC_SYNCED', count: synced }));
  }
}
