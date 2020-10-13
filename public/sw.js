//Service worker Installing
self.addEventListener('install', (e) => {
	console.log('[Service Worker] Installing Service Worker....', e);
});

//Service worker activating
self.addEventListener('activate', (e) => {
	console.log('[Service Worker] Activating Service Worker....', e);
	return self.clients.claim();
});

//Fetching for data?
self.addEventListener('fetch', (e) => {
	e.respondWith(fetch(e.request));
});
