const captureVideoButton = document.querySelector(".screenshot .capture-button");
const captureStopButton = document.querySelector(".screenshot .stop-button");
const cssFiltersButton = document.querySelector(".screenshot .cssfilters-apply");
const filterSelect = document.querySelector('select#filter');
const screenshotButton = document.querySelector(".screenshot .screenshot-button");

const video = document.querySelector(".screenshot video");
const img = document.querySelector(".screenshot img");

const canvas = document.createElement("canvas");

const contraints = {
    video: true,
    //audio: true
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
        cssFiltersButton.disabled = true;
        captureStopButton.disabled = true;

        window.stream.getTracks().forEach(function(track) {
            track.stop();
        });
    }
}

/*
filterSelect.onchange = function() {
    video.className = filterSelect.value;
};
*/

//cssFiltersButton.onclick = video.onclick = function () {
cssFiltersButton.onclick = function() {
    video.className = filterSelect.value;
};

screenshotButton.onclick = function() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    // Other browsers will fall backto image/png
    img.src = canvas.toDataURL("image/webp");
    img.className = filterSelect.value;
}

function handleSuccess(stream) {
    captureVideoButton.disabled = true;
    captureStopButton.disabled = false;
    cssFiltersButton.disabled = false;
    screenshotButton.disabled = false;

    window.stream = stream; // make stream available to console
    video.srcObject = stream;
}

function handleError(error) {
    console.error("Erro: ", error);
}