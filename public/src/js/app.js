var deferredPrompt;

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

var promise = new Promise((resolve, reject) => {
	setTimeout(() => {
		resolve('This is executed once timer is done');
		reject({ code: 500, message: 'An error Occurred!' });
		//console.log('This is executed once timer is done');
	}, 3000);
});

var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://httpbin.org/ip');
xhr.responseType = 'json';
xhr.onload = () => {
	console.log(xhr.response);
};
xhr.onerror = () => {
	console.log('Error');
};
xhr.send();
//Get request
fetch('https://httpbin.org/ip')
	.then((response) => {
		console.log(response);
		return response.json();
	})
	.then((data) => {
		console.log(data);
	})
	.catch((err) => {
		console.log(err);
	});

//Post request
fetch('https://httpbin.org/post', {
	method: 'GET',
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
		//add authorization in here
	},
	mode: 'cors',
	body: JSON.stringify({ message: 'does this work' }),
})
	.then((response) => {
		console.log(response);
		return response.json();
	})
	.then((data) => {
		console.log(data);
	})
	.catch((err) => {
		console.log(err);
	});

promise
	.then(
		(text) => {
			return text;
		},
		(err) => {
			console.log(err.code, err.message);
		}
	)
	.then((newText) => {
		console.log(newText);
	})
	.catch((err) => {
		console.log(err.code, err.message);
	});

console.log('This is executed right after setTimeout()');
