var deferredPrompt;

//Checking if service worker is available
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/sw.js').then(() => {
		console.log('Service worker registered!');
	});
}

window.addEventListener('beforeinstallprompt', (e) => {
	console.log('beforeinstallprompt fired');
	e.preventDefault();
	deferredPrompt = e;
	return false;
});
