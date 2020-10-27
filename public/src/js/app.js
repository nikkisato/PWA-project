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
		};
		navigator.serviceWorker.ready.then((swreg) => {
			swreg.showNotification('Successfully subscribed (From SW)', options);
		});
	}
}

function askForNotificationPermission() {
	Notification.requestPermission((result) => {
		console.log('User Choice', result);
		if (result !== 'granted') {
			console.log('No Notification permission granted!');
		} else {
			displayConfirmNotification();
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
