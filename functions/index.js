var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({ origin: true });

var serviceAccount = require('./pwa-udemy-key.json');
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://pwa-udemy-68dcb.firebaseio.com/',
});
exports.storePostData = functions.https.onRequest((request, response) => {
	cors(request, response, function () {
		admin
			.database()
			.ref('posts')
			.push({
				id: request.body.id,
				title: request.body.title,
				location: request.body.location,
				image: request.body.image,
			})
			.then(() => {
				response
					.status(201)
					.json({ message: 'Data stored', id: request.body.id });
			})
			.catch((err) => {
				response.status(500).json({ error: err });
			});
	});
});
