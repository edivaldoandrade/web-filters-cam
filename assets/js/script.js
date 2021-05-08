'use strict';

let mediaRecorder;
let recordedBlobs;

const video = document.querySelector("video");
const img = document.querySelector("img");
const canvas = document.createElement("canvas");
const recordedVideo = document.querySelector('.recorded');

const captureVideoButton = document.querySelector(".capture-button");
const captureStopButton = document.querySelector(".stop-button");
const filterSelect = document.querySelector('select#filter');
const screenshotButton = document.querySelector(".screenshot-button");
const image_captured = document.querySelector(".image-captured");
const video_captured = document.querySelector(".video-captured");
const download_img = document.querySelector(".download-image");
const download_img_button = document.querySelector(".donwload-img-button");
const recordButton = document.querySelector('.record');
const playButton = document.querySelector('.play');
const downloadButton = document.querySelector('.download-video');

const contraints = {
    video: true,
    audio: true
};

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


/**
 * 
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
    }
}

filterSelect.onchange = function() {
    video.className = filterSelect.value;
};

screenshotButton.onclick = function() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    // Other browsers will fall backto image/png
    img.src = canvas.toDataURL("image/png");
    img.className = filterSelect.value;
    image_captured.className = "col-lg-6";
    download_img.href = canvas.toDataURL("image/png");
    download_img_button.disabled = false;
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
        downloadButton.disabled = false;
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

downloadButton.addEventListener('click', () => {
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


/*

 */


function handleDataAvailable(event) {
    console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

function startRecording() {
    recordedBlobs = [];

    try {
        mediaRecorder = new MediaRecorder(window.stream);
    } catch (e) {
        console.error('Exception while creating MediaRecorder:', e);
        errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
        return;
    }

    console.log('Created MediaRecorder', mediaRecorder);
    recordButton.textContent = 'Parar Gravação';
    playButton.disabled = true;
    downloadButton.disabled = true;
    mediaRecorder.onstop = (event) => {
        console.log('Recorder stopped: ', event);
        console.log('Recorded Blobs: ', recordedBlobs);
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
    mediaRecorder.stop();
    video_captured.className = "col-lg-6";

}

function handleSuccess(stream) {
    captureVideoButton.disabled = true;
    captureStopButton.disabled = false;
    screenshotButton.disabled = false;
    recordButton.disabled = false;

    console.log('getUserMedia() got stream:', stream);

    window.stream = stream; // make stream available to console
    video.srcObject = stream;
}

function handleError(error) {
    console.error("Erro: ", error);
}