var CACHE_STATIC_NAME = 'static-v15';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';
var STATIC_FILES = [
	'/',
	'/index.html',
	'/offline.html',
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
];

//function trimCache(cacheName, maxItems) {
//	caches.open(cacheName).then((cache) => {
//		cache.keys().then((keys) => {
//			if (keys.length > maxItems) {
//				cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
//			}
//		});
//	});
//}

//Service worker Installing
self.addEventListener('install', (e) => {
	console.log('[Service Worker] Installing Service Worker....', e);
	//1. opens the caches
	e.waitUntil(
		caches.open(CACHE_STATIC_NAME).then((cache) => {
			console.log('[SERVICE WORKER] PRECACHING APP SHELL');
			//2.input the url we want to fetch from

			//4 add all file paths to precache
			cache.addAll([STATIC_FILES]);
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

function isInArray(string, array) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] === string) {
			return true;
		}
	}
}

//Cache then network & dynamic caching
self.addEventListener('fetch', (e) => {
	var url = 'https://httpbin.org/get';

	if (e.request.url.indexOf(url) > -1) {
		e.respondWith(
			caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
				return fetch(e.request).then((res) => {
					//trimCache(CACHE_DYNAMIC_NAME, 3);
					cache.put(e.request, res.clone());
					return res;
				});
			})
		);
	} else if (isInArray(e.request.url, STATIC_FILES)) {
		e.respondWith(caches.match(e.request));
	} else {
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
							return caches.open(CACHE_STATIC_NAME).then((cache) => {
								if (e.request.headers.get('accept').includes('text/html')) {
									return cache.match('/offline.html');
								}
							});
						});
				}
			})
		);
	}
});

//self.addEventListener('fetch', (e) => {
//	//3.responses with everything in the caches
//	//requests are keys
//	e.respondWith(
//		caches.match(e.request).then((response) => {
//			if (response) {
//				return response;
//			} else {
//				return fetch(e.request)
//					.then((res) => {
//						caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
//							cache.put(e.request.url, res.clone());
//							return res;
//						});
//					})
//					.catch((err) => {
//						return caches.open(CACHE_STATIC_NAME).then((cache) => {
//							return cache.match('/offline.html');
//						});
//					});
//			}
//		})
//	);
//});

//Network with cache fallback
//self.addEventListener('fetch', (e) => {
//    e.respondWith(
//		fetch(e.request).then((res) {
//			return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
//				cache.put(e.request.url, res.clone())
//				return res;
//			})
//		}).catch((err) => {
//            return caches.match(e.request).
//        })
//    );
//});

//cache only strategy
//self.addEventListener('fetch', (e) => {
//	e.respondWith(caches.match(e.request));
//});

//network only strategy
//self.addEventListener('fetch', (e) => {
//	e.respondWith(fetch(e.request));
//});
