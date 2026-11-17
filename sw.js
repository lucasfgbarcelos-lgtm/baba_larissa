// Troque a versão ao publicar mudanças para atualizar o cache nos celulares
const V = 'rotina-bebe-v1';
const ASSETS = [
  './', './index.html', './styles.css', './app.js', './manifest.webmanifest',
  './vendor/jspdf.umd.min.js', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res.ok) caches.open(V).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => hit || caches.match('./index.html'));
      return hit || net;
    })
  );
});
