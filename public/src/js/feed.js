var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');
var closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
);
var sharedMomentsArea = document.querySelector('#shared-moments');

function initializeMedia() {
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};
  }
  if (!(`getUserMedia` in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = (constraints) => {
      var getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not Implemented'));
      }
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch((err) => {
      imagePickerArea.style.display = 'block';
      console.log(err);
    });
}

captureButton.addEventListener('click', (event) => {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';
  var context = canvasElement.getContext('2d');
  context.drawImage(
    videoPlayer,
    0,
    0,
    canvas.width,
    videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width)
  );
  videoPlayer.srcObject.getVideoTracks().forEach((track) => {
    track.stop();
  });
});

function openCreatePostModal() {
  //createPostArea.style.display = 'block';
  //setTimeout(() => {
  imagePickerArea.style.display = 'none';
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'none';
  createPostArea.style.transform = 'translateY(0)';
  initializeMedia();
  //}, 1);

  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }

  //how to unregister a service worker
  //if ('serviceWorker' in navigator) {
  //	navigator.serviceWorker.getRegistrations().then((registrations) => {
  //		for (var i = 0; i < registrations.length; i++) {
  //			registrations[i].unregister();
  //		}
  //	});
  //}
}

function closeCreatePostModal() {
  //createPostArea.style.display = 'none';
  createPostArea.style.transform = 'translateY(100vh)';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);
//allows to save assets in cache on demand
//function onSaveButtonClicked(e) {
//	console.log('clicked');
//	if ('caches' in window) {
//		caches.open('user-requested').then((cache) => {
//			cache.add('https://httpbin.org.get');
//			cache.add('/src/images/sf-boat.jpg');
//		});
//	}
//}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}
function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  //cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'black';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  //var cardSaveButton = document.createElement('button');
  //cardSaveButton.textContent = 'Save';
  //cardSupportingText.addEventListener('click', onSaveButtonClicked);
  //cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (var i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}
var url = 'https://pwa-udemy-68dcb.firebaseio.com/posts.json';
var networkDataReceived = false;

fetch(url)
  .then((res) => {
    return res.json();
  })
  .then((data) => {
    networkDataReceived = true;
    console.log('From web', data);
    var dataArray = [];
    for (var key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

if ('indexedDB' in window) {
  readAllData('posts').then((data) => {
    if (!networkDataReceived) {
      console.log('From cache', data);
      updateUI(data);
    }
  });
}
//caches
//	.match(url)
//	.then((response) => {
//		if (response) {
//			return response.json();
//		}
//	})
//	.then((data) => {
//		if (!networkDataReceived) {
//			var dataArray = [];
//			for (var key in data) {
//				dataArray.push(data[key]);
//			}
//			updateUI(dataArray);
//		}
//		console.log('from cache', data);
//	});

function sendData() {
  fetch(
    //'https://us-central1-pwa-udemy-68dcb.cloudfunctions.net/storePostData',
    'https://pwa-udemy-68dcb.firebaseio.com/posts.json',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        image:
          'https://firebasestorage.googleapis.com/v0/b/pwa-udemy-68dcb.appspot.com/o/sf-boat.jpg?alt=media&token=932e3373-f395-4ad4-968d-bc874662f8c0',
      }),
    }
  ).then((res) => {
    console.log('Sent data', res);
    updateUI();
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please enter valid data!');
    return;
  }

  closeCreatePostModal();

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((sw) => {
      var post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
      };
      writeData('sync-posts', post)
        .then(() => {
          return sw.sync.register('sync-new-posts');
        })
        .then(() => {
          var snackbarContainer = document.querySelector('#confirmation-toast');
          var data = { message: 'Your Post was saved for Syncing! ' };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  } else {
    sendData();
  }
});
