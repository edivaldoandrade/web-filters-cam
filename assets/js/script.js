"use strict";

const canvas = document.querySelector('canvas');
const img = document.querySelector("img");
const recordedVideo = document.querySelector('video#recorded');

const captureVideoButton = document.querySelector("button#capture-button");
const captureStopButton = document.querySelector("button#stop-button");

const filterSelect = document.querySelector('select#filter');

const screenshotButton = document.querySelector("button#screenshot-button");
const downloadImg = document.querySelector("a#download-image");
const downloadImgButton = document.querySelector("button#donwload-img-button");

const recordButton = document.querySelector('button#record');
const playButton = document.querySelector('button#play');
const downloadVideoButton = document.querySelector('button#download-video');
const saveVideoButton= document.querySelector('button#salvar-video');

const videoCaptured = document.querySelector(".video-captured");
const imageCaptured = document.querySelector(".image-captured");

const contraints = {
    video: true
};


let mediaRecorder;
let recordedBlobs;

// filtros css
let filterIndex = 0;
const filters = [
    "grayscale",
    "sepia",
    "blur",
    "brightness",
    "contrast",
    "hue-rotate",
    "hue-rotate2",
    "hue-rotate3",
    "saturate",
    "invert",
    "",
];

/* 
 **************************************
 */

captureVideoButton.onclick = function() {
    navigator.mediaDevices
        .getUserMedia(contraints)
        .then(handleSuccess)
        .catch(handleError);
}

captureStopButton.onclick = function() {
    if (window.stream) {
        captureVideoButton.disabled = false;
        screenshotButton.disabled = true;
        captureStopButton.disabled = true;
        recordButton.disabled = true;

        window.stream.getTracks().forEach(function(track) {
            track.stop();
        });
        main(-1);
    }
}

filterSelect.onchange = function() {
    canvas.className = filterSelect.value;
}

screenshotButton.onclick = function() {
    canvas.getContext("2d");

    img.src = downloadImg.href = canvas.toDataURL("image/png");
    img.className = filterSelect.value;
    imageCaptured.className = "col-lg-6 pb-2";
    downloadImgButton.disabled = false;
}

recordButton.addEventListener('click', () => {
    if (recordButton.textContent === 'Iniciar Gravação') {
        startRecording();
        captureStopButton.disabled = true;
    } else {
        stopRecording();
        recordButton.textContent = 'Iniciar Gravação';
        captureStopButton.disabled = false;
        playButton.disabled = false;
        downloadVideoButton.disabled = false;
        saveVideoButton.disabled=false;
    }
});

playButton.addEventListener('click', () => {
    const superBuffer = new Blob(recordedBlobs);
    recordedVideo.src = null;
    recordedVideo.srcObject = null;
    recordedVideo.src = window.URL.createObjectURL(superBuffer);
    recordedVideo.controls = true;
    recordedVideo.className = filterSelect.value;
    recordedVideo.play();
});

downloadVideoButton.addEventListener('click', () => {
    const blob = new Blob(recordedBlobs, { type: 'video/mp4' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'yoha-video.mp4';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
   
});

saveVideoButton.addEventListener('click', () => {
    const blob = new Blob(recordedBlobs, { type: 'video/mp4' });
    saveVideo(blob);
});



/*
 ************************* 
 */

function handleDataAvailable(event) {
    console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

// iniciar Gravação
function startRecording() {
    recordedBlobs = [];
    try {
        mediaRecorder = new MediaRecorder(canvas.captureStream());
    } catch (e0) {
        console.error('Unable to create MediaRecorder with options Object: ', e0);
        errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;

        return;
    }

    console.log('Created MediaRecorder', mediaRecorder);
    recordButton.textContent = 'Parar Gravação';
    playButton.disabled = true;
    downloadVideoButton.disabled = true;
    saveVideoButton.disabled=true;
    mediaRecorder.onstop = (event) => {
        console.log('Recorder stopped: ', event);
        console.log('Recorded Blobs: ', recordedBlobs);
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(100);
    console.log('MediaRecorder started', mediaRecorder);
}

// Parar Gravação
function stopRecording() {
    mediaRecorder.stop();
    videoCaptured.className = "col-lg-6 pb-2";
    recordedVideo.controls = true;
}

function handleSuccess(stream) {
    captureVideoButton.disabled = true;
    captureStopButton.disabled = false;
    screenshotButton.disabled = false;
    recordButton.disabled = false;

    main(0);
    stream = canvas.captureStream();
    window.stream = stream;
}

function handleError(error) {
    if (error.name === 'ConstraintNotSatisfiedError') {
        const v = contraints.video;
        errorMsg(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
    } else if (error.name === 'PermissionDeniedError') {
        errorMsg('Permissions have not been granted to use your camera and ' +
            'microphone, you need to allow the page access to your devices in ');
    }
    errorMsg(`getUserMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
    const errorElement = document.querySelector('#errorMsg');
    errorElement.innerHTML += `<p>${msg}</p>`;
    if (typeof error !== 'undefined') {
        console.error(error);
        alert(error);
    }
}

function saveVideo(bob){
    firebase.auth().onAuthStateChanged(function(user) {
        if (user){
            
            firebase.firestore().collection("count").doc("count").get()
            .then((doc) => {
            
            let id=(+doc.data().id)
                    ++id;
                    var storage = firebase.storage();
            storage.ref().child('videos/'+id+'.mp4')
            .put(bob)
            .then(function(snapshot) {
                snapshot.ref.getDownloadURL().then(function(downloadURL) {

                    firebase.firestore().collection("videos").add({
                        uid: user.uid,
                        url: downloadURL
                    }).then(() => {
                        alert("Video salvo com Sucesso")
                    });
                    firebase.firestore().collection("count").doc("count").set({
                       id:id
                    })
                  });
            });
               
            });
        
            
        }
        
    });
    


}

