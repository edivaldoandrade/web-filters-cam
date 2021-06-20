const mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
let mediaRecorder;
let recordedBlobs;
let sourceBuffer;

const canvas = document.querySelector('canvas');
const video = document.querySelector('video');
const recordButton = document.querySelector('button#record');
const playButton = document.querySelector('button#play');
const downloadButton = document.querySelector('button#download');
const filterSelect = document.querySelector('select#filter');
const video_captured = document.querySelector(".video-captured");

recordButton.onclick = toggleRecording;
playButton.onclick = play;
downloadButton.onclick = download;

// captura de frames do canvas
const stream = canvas.captureStream();

// filtros
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


filterSelect.onchange = function() {
    video.className = filterSelect.value;
    canvas.className = filterSelect.value;
};

function handleSourceOpen(event) {
    sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
}

function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

function handleStop(event) {
    const superBuffer = new Blob(recordedBlobs, { type: 'video/webm' });
    video.src = window.URL.createObjectURL(superBuffer);
}

// Mudar estado de iniciar/parar Gravação
function toggleRecording() {
    if (recordButton.textContent === 'Iniciar Gravação') {
        startRecording();
    } else {
        stopRecording();
        recordButton.textContent = 'Iniciar Gravação';
        playButton.disabled = false;
        downloadButton.disabled = false;
    }
}

// iniciar Gravação
function startRecording() {
    let options = { mimeType: 'video/webm' };
    recordedBlobs = [];
    try {
        mediaRecorder = new MediaRecorder(stream, options);
    } catch (e0) {
        console.log('Unable to create MediaRecorder with options Object: ', e0);
        try {
            options = { mimeType: 'video/webm,codecs=vp9' };
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e1) {
            console.log('Unable to create MediaRecorder with options Object: ', e1);
            try {
                options = 'video/vp8'; // Chrome 47
                mediaRecorder = new MediaRecorder(stream, options);
            } catch (e2) {
                return;
            }
        }
    }
    recordButton.textContent = 'Parar';
    playButton.disabled = true;
    downloadButton.disabled = true;
    mediaRecorder.onstop = handleStop;
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(100);
}

// Parar Gravação
function stopRecording() {
    mediaRecorder.stop();
    console.log('Recorded Blobs: ', recordedBlobs);
    video_captured.className = "col-lg-6";
    video.controls = true;
}

// Reproduzir video
function play() {
    const superBuffer = new Blob(recordedBlobs);
    video.src = null;
    video.srcObject = null;
    video.src = window.URL.createObjectURL(superBuffer);
    video.controls = true;
    video.className = filterSelect.value;
    video.play();
}

// Download do video
function download() {
    const blob = new Blob(recordedBlobs, { type: 'video/webm' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'video.mp4';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}








/*

Antigo
---------------------------------------------------------------------------------------------------------------------------------------------

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
    //screenshotButton.disabled = false;
    recordButton.disabled = false;

    console.log('getUserMedia() got stream:', stream);

    window.stream = stream; // make stream available to console
    video.srcObject = stream;
}

function handleError(error) {
    console.error("Erro: ", error);
}*/