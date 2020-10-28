var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({ origin: true });
var webpush = require('web-push');
var privateVapidKey = process.env.PRIVATEVAPIDKEY;

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
        webpush.setVapidDetails(
          'mailto:nikkisatopdx@gmail.com',
          'BExo2PfaTCWLx2z2hiddkM4f1PgD3sBroxaPaDdRDTQ2SL6JaxxHTzri0V40fTdZUdLjaaHbFwpRiwk5Lry-dY8',
          privateVapidKey
        );
        return admin
          .database()
          .ref('subscriptions')
          .once('value')
          .then((subscriptions) => {
            subscriptions.forEach((sub) => {
              var pushConfig = {
                endpoint: sub.val().endpoint,
                keys: {
                  auth: sub.val().keys.auth,
                  p256dh: sub.val().keys.p256dh,
                },
              };
              webpush
                .sendNotification(
                  pushConfig,
                  JSON.stringify({
                    title: 'New Post',
                    content: 'New Post Added!',
                    openUrl: '/help',
                  })
                )
                .catch((err) => {
                  console.log(err);
                });
            });
            response
              .status(201)
              .json({ message: 'Data stored', id: request.body.id });
          });
      })
      .catch((err) => {
        response.status(500).json({ error: err });
      });
  });
});
