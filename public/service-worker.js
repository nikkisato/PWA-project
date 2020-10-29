importScripts('workbox-sw.prod.v2.1.3.js');
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'google-fonts',
    cacheExpiration: {
      maxEntries: 3,
      maxAgeSeconds: 60 * 60 * 24 * 30,
    },
  })
);
workboxSW.router.registerRoute(
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  workboxSW.strategies.staleWhileRevalidate({ cacheName: 'material-css' })
);

workboxSW.router.registerRoute(
  /.*(?:firebasestorage\.googleapis)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({ cacheName: 'post-images' })
);

workboxSW.router.registerRoute(
  'https://pwa-udemy-68dcb.firebaseio.com/posts.json',
  function (args) {
    return fetch(args.event.request).then((res) => {
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
    });
  }
);

workboxSW.router.registerRoute(
  function (routeData) {
    return routeData.event.request.headers.get('accept').includes('text/html');
  },
  function (args) {
    return caches.match(args.event.request).then((response) => {
      if (response) {
        console.log('RESPONSE 96', response);
        return response;
      } else {
        return fetch(args.event.request)
          .then((res) => {
            console.log('res', res);
            return caches.open('dynamic').then((cache) => {
              cache.put(args.event.request.url, res.clone());
              console.log('cache', cache);
              return res;
            });
          })
          .catch((err) => {
            console.log('error', err);
            return caches.open('static').then((cache) => {
              if (
                args.event.request.headers.get('accept').includes('text/html')
              ) {
                return cache.match('/offline.html');
              }
            });
          });
      }
    });
  }
);

workboxSW.precache([
  {
    url: 'favicon.ico',
    revision: '2cab47d9e04d664d93c8d91aec59e812',
  },
  {
    url: 'index.html',
    revision: '37b19a286f0d43d07462421dac007498',
  },
  {
    url: 'manifest.json',
    revision: '5d1c41b093c88766fc78bd8057fb9c98',
  },
  {
    url: 'src/css/app.css',
    revision: 'cc00e6ce1f123079990583defbd0e31a',
  },
  {
    url: 'src/css/feed.css',
    revision: '63b387e86f77cd124b794c4f6b7e60fc',
  },
  {
    url: 'src/css/help.css',
    revision: '1c6d81b27c9d423bece9869b07a7bd73',
  },
  {
    url: 'src/images/main-image-lg.jpg',
    revision: '31b19bffae4ea13ca0f2178ddb639403',
  },
  {
    url: 'src/images/main-image-sm.jpg',
    revision: 'c6bb733c2f39c60e3c139f814d2d14bb',
  },
  {
    url: 'src/images/main-image.jpg',
    revision: '5c66d091b0dc200e8e89e56c589821fb',
  },
  {
    url: 'src/images/sf-boat.jpg',
    revision: '0f282d64b0fb306daf12050e812d6a19',
  },
  {
    url: 'src/js/app.min.js',
    revision: 'a8373e0f221666afcc06c7f4f70931c4',
  },
  {
    url: 'src/js/feed.min.js',
    revision: '143224b3de6a5b9b010fad1cd824db53',
  },
  {
    url: 'src/js/fetch.min.js',
    revision: '32590119a06bf9ade8026dd12baa695e',
  },
  {
    url: 'src/js/idb.min.js',
    revision: 'ea82c8cec7e6574ed535bee7878216e0',
  },
  {
    url: 'src/js/material.min.js',
    revision: 'd1f34655395e312efea2aba39528019e',
  },
  {
    url: 'src/js/promise.min.js',
    revision: '7be19d2e97926f498f2668e055e26b22',
  },
  {
    url: 'src/js/utility.min.js',
    revision: 'b8d564012f399b8f3dfc85814a4b13a8',
  },
]);

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
