var CACHE_STATIC_NAME = 'static-v4';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';

//Service worker Installing
self.addEventListener('install', (e) => {
	console.log('[Service Worker] Installing Service Worker....', e);
	//1. opens the caches
	e.waitUntil(
		caches.open(CACHE_STATIC_NAME).then((cache) => {
			console.log('[SERVICE WORKER] PRECACHING APP SHELL');
			//2.input the url we want to fetch from

			//4 add all file paths to precache
			cache.addAll([
				'/',
				'/index.html',
				'/src/js/app.js',
				'/src/js/feed.js',
				'/src/js/promise.js',
				'/src/js/fetch.js',
				'/src/js/material.min.js',
				'/src/css/app.css',
				'/src/css/feed.css',
				'/src/images/main-image.jpg',
				'https://fonts.googleapis.com/css?family=Roboto:400,700',
				'https://fonts.googleapis.com/icon?family=Material+Icons',
				'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
			]);
		})
	);
});

//Service worker activating
self.addEventListener('activate', (e) => {
	console.log('[Service Worker] Activating Service Worker....', e);
	//5 clean up cache
	e.waitUntil(
		caches.keys().then((keyList) => {
			return Promise.all(
				keyList.map((key) => {
					if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
						console.log('[SERVICE WORKER] removing old cache.', key);
						return caches.delete(key);
					}
				})
			);
		})
	);
	return self.clients.claim();
});

//Fetching for data?
self.addEventListener('fetch', (e) => {
	//3.responses with everything in the caches
	//requests are keys
	e.respondWith(
		caches.match(e.request).then((response) => {
			if (response) {
				return response;
			} else {
				return fetch(e.request)
					.then((res) => {
						caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
							cache.put(e.request.url, res.clone());
							return res;
						});
					})
					.catch((err) => {
						console.log(err);
					});
			}
		})
	);
});
