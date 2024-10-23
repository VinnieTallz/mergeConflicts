let audioCtx, sourceNode, destination, mediaRecorder;
let audioChunks = [];

function startRecording() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Capture audio output from the current tab
    chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
        if (!stream) {
            console.error("Failed to capture audio.");
            return;
        }

        sourceNode = audioCtx.createMediaStreamSource(stream);
        destination = audioCtx.createMediaStreamDestination();
        sourceNode.connect(destination);
        sourceNode.connect(audioCtx.destination); // Optional: for playback

        mediaRecorder = new MediaRecorder(destination.stream);
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            if (audioChunks.length > 0) {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioURL = URL.createObjectURL(audioBlob);

                // Create a link to download the recorded audio
                const downloadLink = document.createElement('a');
                downloadLink.href = audioURL;
                downloadLink.download = 'recorded-audio.webm';

                // Append link to the document to make it clickable, then click it
                document.body.appendChild(downloadLink);
                downloadLink.click();

                // Remove the link after triggering the download
                document.body.removeChild(downloadLink);

                console.log("Audio download link triggered.");
            } else {
                console.warn("No audio data captured.");
            }

            audioChunks = []; // Clear for next recording
        };

        audioChunks = [];
        mediaRecorder.start();
        console.log("Recording started...");
    });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        console.log("Recording stopped.");
    }
}
