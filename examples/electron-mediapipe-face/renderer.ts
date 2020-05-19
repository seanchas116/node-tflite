import { Interpreter } from "node-tflite";
import fs from "fs";
import path from "path";

const faceModelPath = path.resolve(__dirname, "face_detection_front.tflite");

function canvasToRGBFloat(context: CanvasRenderingContext2D) {
  const { width, height } = context.canvas;
  const data = context.getImageData(0, 0, width, height);

  const rgbFloat = new Float32Array(width * height * 3);

  for (let i = 0; i < width * height; ++i) {
    rgbFloat[i * 3] = data.data[i * 4] / 255;
    rgbFloat[i * 3 + 1] = data.data[i * 4 + 1] / 255;
    rgbFloat[i * 3 + 2] = data.data[i * 4 + 2] / 255;
  }

  return rgbFloat;
}

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

  const inputCanvas = document.createElement("canvas");
  inputCanvas.width = 128;
  inputCanvas.height = 128;
  const inputContext = inputCanvas.getContext("2d")!;

  const interpreter = new Interpreter(fs.readFileSync(faceModelPath));
  interpreter.allocateTensors();

  const updateCanvas = () => {
    inputContext.drawImage(video, 0, 0, inputCanvas.width, inputCanvas.height);
    const rgbFloat = canvasToRGBFloat(inputContext);

    interpreter.inputs[0].copyFrom(rgbFloat);
    interpreter.invoke();

    const coordinatesData = new Float32Array(896 * 16);
    const scoreData = new Float32Array(896);

    interpreter.outputs[0].copyTo(coordinatesData);
    interpreter.outputs[1].copyTo(scoreData);

    console.log(coordinatesData);
    console.log(scoreData);

    requestAnimationFrame(updateCanvas);
  };
  updateCanvas();
};

init();
