importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v27';
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
	e.waitUntil(
		caches.open(CACHE_STATIC_NAME).then((cache) => {
			console.log('[SERVICE WORKER] PRECACHING APP SHELL');
			cache.addAll([STATIC_FILES]);
		})
	);
});

//Service worker activating
self.addEventListener('activate', (e) => {
	console.log('[Service Worker] Activating Service Worker....', e);

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

//function isInArray(string, array) {
//	for (var i = 0; i < array.length; i++) {
//		if (array[i] === string) {
//			return true;
//		}
//	}
//}

function isInArray(string, array) {
	var cachePath;
	if (string.indexOf(self.origin) === 0) {
		// request targets domain where we serve the page from (i.e. NOT a CDN)
		console.log('matched ', string);
		cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
	} else {
		cachePath = string; // store the full request (for CDNs)
	}
	return array.indexOf(cachePath) > -1;
}

//Cache then network & dynamic caching
self.addEventListener('fetch', (event) => {
	var url = 'https://pwa-udemy-68dcb.firebaseio.com/posts';

	if (event.request.url.indexOf(url) > -1) {
		event.respondWith(
			fetch(event.request).then((res) => {
				var clonedRes = res.clone();
				clearAllData('posts')
					.then(() => {
						return clonedRes.json();
					})
					.then((data) => {
						for (var key in data) {
							writeData('posts', data[key]);
						}
					});
				return res;
			})
		);
	} else if (isInArray(event.request.url, STATIC_FILES)) {
		event.respondWith(
			fetch(event.request).catch(() => {
				return caches.match(event.request);
			})
		);
	} else {
		event.respondWith(
			caches.match(event.request).then((response) => {
				if (response) {
					return response;
				} else {
					return fetch(event.request)
						.then((res) => {
							return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
								cache.put(event.request.url, res.clone());
								return res;
							});
						})
						.catch((err) => {
							return caches.open(CACHE_STATIC_NAME).then((cache) => {
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

self.addEventListener('sync', (e) => {
	console.log('[Service Worker] Background syncing', e);
	if (e.tag === 'sync-new-posts') {
		console.log('[Service Worker] Syncing new Posts');
		e.waitUntil(
			readAllData('sync-posts').then((data) => {
				for (var dt of data) {
					fetch('https://pwa-udemy-68dcb.firebaseio.com/posts.json', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Accept: 'application/json',
						},
						body: JSON.stringify({
							id: dt.id,
							title: dt.title,
							location: dt.location,
							image:
								'https://firebasestorage.googleapis.com/v0/b/pwa-udemy-68dcb.appspot.com/o/sf-boat.jpg?alt=media&token=932e3373-f395-4ad4-968d-bc874662f8c0',
						}),
					})
						.then((res) => {
							console.log('Sent data', res);
							if (res.ok) {
								deleteItemFromData('sync-posts', dt.id); // Isn't working correctly!
							}
						})
						.catch((err) => {
							console.log('Error while sending data', err);
						});
				}
			})
		);
	}
});

//self.addEventListener('sync', (e) => {
//	console.log('[SERVICE WORKER] Background syncing', e);

//	if (e.tag === 'sync-new-posts') {
//		console.log('[SERVICE WORKER] Syncing new Posts');
//		e.waitUntil(
//			readAllData('sync-posts').then((data) => {
//				for (var dt of data) {
//					fetch('https://pwa-udemy-68dcb.firebaseio.com/posts.json', {
//						method: 'POST',
//						headers: {
//							'Content-Type': 'application/json',
//							Accept: 'application/json',
//						},
//						body: JSON.stringify({
//							id: dt.id,
//							title: dt.title,
//							location: dt.location,
//							image:
//								'https://firebasestorage.googleapis.com/v0/b/pwa-udemy-68dcb.appspot.com/o/sf-boat.jpg?alt=media&token=932e3373-f395-4ad4-968d-bc874662f8c0',
//						}),
//					})
//						.then((res) => {
//							console.log('Sent data', res);
//							if (res.ok) {
//								deleteItemFromData('sync-posts', dt.id);
//							}
//						})
//						.catch((err) => {
//							console.log('Error while sending data', err);
//						});
//				}
//			})
//		);
//	}
//});

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
