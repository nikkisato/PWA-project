var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({ origin: true });
var webpush = require('web-push');
var privateVapidKey = process.env.PRIVATEVAPIDKEY;
var Busboy = require('busboy');
var fs = require('fs');
var UUID = require('uuid-v4');
var os = require('os');

var serviceAccount = require('./pwa-udemy-key.json');

const { Storage } = require('@google-cloud/storage');

const gcs = new Storage({
  projectId: 'pwa-udemy-68dcb',
  keyFilename: 'pwa-udemy-key.json',
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwa-udemy-68dcb.firebaseio.com/',
});

exports.storePostData = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    var uuid = UUID();
    var busboy = new Busboy({ headers: request.headers });
    let upload;
    const fields = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      console.log(
        `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
      );
      const filepath = path.join(os.tmpdir(), filename);
      upload = { file: filepath, type: mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on('field', function (
      fieldname,
      val,
      fieldnameTruncated,
      valTruncated,
      encoding,
      mimetype
    ) {
      fields[fieldname] = val;
    });

    busboy.on('finish', () => {
      var bucket = gcs.bucket('pwa-udemy-68dcb.appspot.com');
      bucket.upload(
        upload.file,
        {
          uploadType: 'media',
          metadata: {
            metadata: {
              contentType: upload.type,
              firebaseStorageDownloadTokens: uuid,
            },
          },
        },
        (err, uploadedFile) => {
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
                  encodeURIComponent(uploadedFile.name) +
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
    busboy.end(request.rawBody);
  });
});
