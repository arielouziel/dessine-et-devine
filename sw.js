/* Service worker : le jeu marche hors ligne.
   Stratégie « stale-while-revalidate » : on sert la copie en cache tout de suite,
   et on la met à jour en arrière-plan. Après un git push, la nouvelle version
   s'affiche au lancement suivant, sans rien changer ici. */
const CACHE = "dd-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !fonts) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch: req.mode === "navigate" });
      const fresh = fetch(req)
        .then(res => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; })
        .catch(() => hit);
      return hit || fresh;
    })
  );
});
