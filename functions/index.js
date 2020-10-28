var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({ origin: true });
var webpush = require('web-push');
var privateVapidKey = process.env.PRIVATEVAPIDKEY;
var formidable = require('formidable');
var fs = require('fs');
var UUID = require('uuid-v4');

var serviceAccount = require('./pwa-udemy-key.json');

var gcConfig = {
  projectId: 'pwa-udemy-68dcb',
  keyFilename: 'pwa-udemy-key.json',
};

var gcs = require('@google-cloud/storage')(config);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwa-udemy-68dcb.firebaseio.com/',
});
exports.storePostData = functions.https.onRequest((request, response) => {
  cors(request, response, function () {
    var uuid = UUID();
    var formData = new formidable.IncomingForm();
    formData.parse(request, (err, fields, files) => {
      fs.rename(files.file.path, '/tmp/' + files.file.name);
      var bucket = gcs.bucket('pwa-udemy-68dcb.appspot.com');

      bucket.upload(
        '/tmp/' + files.file.name,
        {
          uploadType: 'media',
          metadata: {
            metadata: {
              contentType: files.file.type,
              firebaseStorageDownloadTokens: uuid,
            },
          },
        },
        (err, file) => {
          if (!err) {
            admin
              .database()
              .ref('posts')
              .push({
                id: fields.id,
                title: fields.title,
                location: fields.location,
                image:
                  'https://firebasestorage.googleapis.com/v0/b/' +
                  bucket.name +
                  '/o/' +
                  encodeURIComponent(file.name) +
                  '?alt=media&token=' +
                  uuid,
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
                      .json({ message: 'Data stored', id: fields.id });
                  });
              })
              .catch((err) => {
                response.status(500).json({ error: err });
              });
          } else
            (err) => {
              console.log(err);
            };
        }
      );
    });
  });
});
