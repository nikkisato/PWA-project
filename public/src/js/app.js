var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll(
  '.enable-notifications'
);

if (!window.Promise) {
  window.Promise = Promise;
}

//Checking if service worker is available
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(() => {
      console.log('Service worker registered!');
    })
    .catch((err) => {
      console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt fired');
  e.preventDefault();
  deferredPrompt = e;
  return false;
});

function displayConfirmNotification() {
  if ('serviceWorker' in navigator) {
    var options = {
      body: 'You successfully subscribed to our Notification service!',
      icon: '/src/images/icons/app-icon-96x96.png',
      image: '/src/images/sf-boat.jpg',
      dir: 'ltr',
      lang: 'en-US',
      vibrate: [100, 50, 200],
      badge: '/src/images/icons/app-icon-96x96.png',
      tag: 'confirm-notification',
      renotify: true,
      actions: [
        { action: 'confirm', title: 'Okay', icon: '/src/images/sf-boat.jpg' },
        { action: 'cancel', title: 'Cancel', icon: '/src/images/sf-boat.jpg' },
      ],
    };
    navigator.serviceWorker.ready.then((swreg) => {
      swreg.showNotification('Successfully subscribed', options);
    });
  }
}

function configPushSub() {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  var reg;
  navigator.serviceWorker.ready
    .then((swreg) => {
      reg = swreg;
      return swreg.pushManager.getSubscription();
    })
    .then((sub) => {
      if (sub === null) {
        //Create a new subscription
        var vapidPublicKey =
          'BExo2PfaTCWLx2z2hiddkM4f1PgD3sBroxaPaDdRDTQ2SL6JaxxHTzri0V40fTdZUdLjaaHbFwpRiwk5Lry-dY8';
        var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey,
        });
      } else {
        //we have a subscription
      }
    })
    .then((newSub) => {
      return fetch(
        'https://pwa-udemy-68dcb.firebaseio.com/subscriptions.json',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(newSub),
        }
      );
    })
    .then((res) => {
      if (res.ok) {
        displayConfirmNotification();
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

function askForNotificationPermission() {
  Notification.requestPermission((result) => {
    console.log('User Choice', result);
    if (result !== 'granted') {
      console.log('No Notification permission granted!');
    } else {
      configPushSub();
      //displayConfirmNotification();
    }
  });
}

if ('Notification' in window) {
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = 'inline-block';
    enableNotificationsButtons[i].addEventListener(
      'click',
      askForNotificationPermission
    );
  }
}
