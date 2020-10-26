var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({ origin: true });
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.storePostData = functions.https.onRequest((request, response) => {
	cors((request, response) => {
		admin.database().ref("posts").push({
			id: request.body.id,
			title: request.body.title,
			location: request.body.location,
			image: request.body.image
		}).then(() => {
			response.status(201).json({message: "Data stored", id: request.body.id})
		}).catch((err) => {
			response.status(500).json({error: err})
		})
	}
	//functions.logger.info('Hello logs!', { structuredData: true });
	//response.send('Hello from Firebase!');
});
