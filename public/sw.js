importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v48';
var CACHE_DYNAMIC_NAME = 'dynamic-v3';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/utility.js',
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

//Service worker Installing
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      console.log('[Service Worker] Precaching App Shell');
      cache.addAll(STATIC_FILES);
    })
  );
});

//Service worker Activate
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] ACTIVATING SERVICE WORKER ....', event);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] REMOVING OLD CACHE.', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

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
        console.log('REZZ', res);
        return res;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log('event.request', event.request);
        return caches.match(event.request);
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          console.log('RESPONSE 96', response);
          return response;
        } else {
          return fetch(event.request)
            .then((res) => {
              console.log('res', res);
              return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
                if ('POST' !== event.request.method) {
                  cache.put(event.request.url, res.clone());
                }
                //cache.put(event.request.url, res.clone());
                console.log('cache', cache);
                return res;
              });
            })
            .catch((err) => {
              console.log('error', err);
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

self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background syncing', event);
  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new Posts');
    event.waitUntil(
      readAllData('sync-posts').then((data) => {
        for (var dt of data) {
          var postData = new FormData();
          postData.append('id', dt.id);
          postData.append('title', dt.title);
          postData.append('location', dt.location);
          postData.append('rawLocationLat', dt.rawLocation.lat);
          postData.append('rawLocationLng', dt.rawLocation.lng);
          postData.append('file', dt.picture, dt.id + '.png');

          fetch(
            'https://us-central1-pwa-udemy-68dcb.cloudfunctions.net/storePostData',
            {
              method: 'POST',
              body: postData,
            }
          )
            .then((res) => {
              console.log('Sent data', res);
              if (res.ok) {
                res.json().then((resData) => {
                  deleteItemFromData('sync-posts', resData.id);
                });
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

self.addEventListener('notificationclick', (event) => {
  var notification = event.notification;
  var action = event.action;
  console.log(notification);
  if (action === 'confirm') {
    console.log('Confirm was chosen');
    notification.close();
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll().then((clis) => {
        var client = clis.find((c) => {
          return c.visibilityState === 'visible';
        });
        if (client !== undefined) {
          client.navigate(notification.data.url);
          client.focus();
        } else {
          clients.openWindow(notification.data.url);
        }
        notification.close();
      })
    );
  }
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification was closed', event);
});

self.addEventListener('push', (event) => {
  console.log('Push Notification received', event);

  var data = {
    title: 'New!',
    content: 'Something new happened!',
    openUrl: '/',
  };

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  var options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl,
    },
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
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

//function trimCache(cacheName, maxItems) {
//	caches.open(cacheName).then((cache) => {
//		cache.keys().then((keys) => {
//			if (keys.length > maxItems) {
//				cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
//			}
//		});
//	});
//}
//function isInArray(string, array) {
//	for (var i = 0; i < array.length; i++) {
//		if (array[i] === string) {
//			return true;
//		}
//	}
//}

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
