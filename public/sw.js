importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v25';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';
var STATIC_FILES = [
	'/',
	'/index.html',
	'/offline.html',
	'/src/js/app.js',
	'/src/js/feed.js',
	'/src/js/idb.js',
	'/src/js/promise.js',
	'/src/js/fetch.js',
	'/src/js/material.min.js',
	'/src/css/app.css',
	'/src/css/feed.css',
	'/src/images/main-image.jpg',
	'https://fonts.googleapis.com/css?family=Roboto:400,700',
	//'https://fonts.googleapis.com/icon?family=Material+Icons',
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

//function isInArray(string, array) {
//	var cachePath;
//	if (string.indexOf(self.origin) === 0) {
//		// request targets domain where we serve the page from (i.e. NOT a CDN)
//		console.log('matched ', string);
//		cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
//	} else {
//		cachePath = string; // store the full request (for CDNs)
//	}
//	return array.indexOf(cachePath) > -1;
//}

//Cache then network & dynamic caching
self.addEventListener('fetch', function (event) {
	var url = 'https://pwa-udemy-68dcb.firebaseio.com/posts';

	if (event.request.url.indexOf(url) > -1) {
		event.respondWith(
			fetch(event.request).then(function (res) {
				var clonedRes = res.clone();
				clearAllData('posts')
					.then(function () {
						return clonedRes.json();
					})
					.then(function (data) {
						for (var key in data) {
							writeData('posts', data[key]);
						}
					});
				return res;
			})
		);
	} else if (isInArray(event.request.url, STATIC_FILES)) {
		event.respondWith(caches.match(event.request));
	} else {
		event.respondWith(
			caches.match(event.request).then(function (response) {
				if (response) {
					return response;
				} else {
					return fetch(event.request)
						.then(function (res) {
							return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
								// trimCache(CACHE_DYNAMIC_NAME, 3);
								cache.put(event.request.url, res.clone());
								return res;
							});
						})
						.catch(function (err) {
							return caches.open(CACHE_STATIC_NAME).then(function (cache) {
								if (event.request.headers.get('accept').includes('text/html')) {
									return cache.match('/offline.html');
								}
							});
						});
				}
			})
		);
	}
});

//OLD CODE
////Cache then network & dynamic caching
//self.addEventListener('fetch', (e) => {
//	var url = 'https://pwa-udemy-68dcb.firebaseio.com/posts';

//	if (e.request.url.indexOf(url) > -1) {
//		e.respondWith(
//			fetch(e.request).then((res) => {
//				var clonedRes = res.clone();
//				clearAllData('posts')
//					.then(() => {
//						return clonedRes.json();
//					})
//					.then((data) => {
//						for (var key in data) {
//							writeData('posts', data[key]);
//						}
//					});
//				return res;
//			})
//			//caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
//			//return fetch(e.request).then((res) => {
//			//trimCache(CACHE_DYNAMIC_NAME, 3);
//			//cache.put(e.request, res.clone());
//			//return res;
//			//});
//			//})
//		);
//	} else if (isInArray(e.request.url, STATIC_FILES)) {
//		e.respondWith(caches.match(e.request));
//	} else {
//		e.respondWith(
//			caches.match(e.request).then((response) => {
//				if (response) {
//					return response;
//				} else {
//					return fetch(e.request)
//						.then((res) => {
//							caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
//								cache.put(e.request.url, res.clone());
//								return res;
//							});
//						})
//						.catch((err) => {
//							return caches.open(CACHE_STATIC_NAME).then((cache) => {
//								if (e.request.headers.get('accept').includes('text/html')) {
//									return cache.match('/offline.html');
//								}
//							});
//						});
//				}
//			})
//		);
//	}
//});

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
