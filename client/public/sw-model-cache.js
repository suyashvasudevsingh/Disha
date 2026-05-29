self.addEventListener('install', (ev) => {
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(self.clients.claim());
});

async function notifyClients(msg) {
  const all = await self.clients.matchAll({ includeUncontrolled: true });
  for (const c of all) {
    c.postMessage(msg);
  }
}

self.addEventListener('message', async (ev) => {
  const data = ev.data;
  if (!data || !data.type) return;
  if (data.type === 'CACHE_MODEL') {
    const { url, name } = data;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('fetch-failed');
      const respClone = resp.clone();

      // stream to measure progress
      const reader = resp.body?.getReader();
      const contentLength = Number(resp.headers.get('Content-Length')) || 0;
      let loaded = 0;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          loaded += value?.length || 0;
          await notifyClients({ type: 'CACHE_PROGRESS', name, loaded, total: contentLength });
        }
      }

      // store in CacheStorage for offline fetch
      const cache = await caches.open('models-cache-v1');
      await cache.put(url, respClone);
      await notifyClients({ type: 'CACHE_COMPLETE', name, url });
    } catch (err) {
      await notifyClients({ type: 'CACHE_ERROR', name, message: String(err) });
    }
  }
});
