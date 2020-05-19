import { Interpreter } from "node-tflite";

const init = async () => {
  const video = document.createElement("video");
  video.width = 640;
  video.height = 480;
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      width: { ideal: video.width },
      height: { ideal: video.height },
    },
  });
  video.srcObject = stream;
  video.play();

  const videoCanvas = document.createElement("canvas");
  videoCanvas.width = video.width;
  videoCanvas.height = video.height;
  const context = videoCanvas.getContext("2d")!;

  const updateCanvas = () => {
    context.drawImage(video, 0, 0);
    requestAnimationFrame(updateCanvas);
  };
  updateCanvas();
};

init();
