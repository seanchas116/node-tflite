import { Interpreter } from "node-tflite";
import fs from "fs";
import path from "path";

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

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function generateAnchors(width: number, height: number): [number, number][] {
  const outputSpec = {
    strides: [8, 16] as const,
    anchors: [2, 6] as const,
  };

  const anchors: [number, number][] = [];
  for (let i = 0; i < outputSpec.strides.length; i++) {
    const stride = outputSpec.strides[i];
    const gridRows = Math.floor((height + stride - 1) / stride);
    const gridCols = Math.floor((width + stride - 1) / stride);
    const anchorsNum = outputSpec.anchors[i];

    for (let gridY = 0; gridY < gridRows; gridY++) {
      const anchorY = stride * (gridY + 0.5);

      for (let gridX = 0; gridX < gridCols; gridX++) {
        const anchorX = stride * (gridX + 0.5);
        for (let n = 0; n < anchorsNum; n++) {
          anchors.push([anchorX, anchorY]);
        }
      }
    }
  }

  return anchors;
}

class FaceDetector {
  private inputSize = 128;
  private inputCanvas: HTMLCanvasElement;
  private inputContext: CanvasRenderingContext2D;
  private interpreter: Interpreter;
  private anchors = generateAnchors(this.inputSize, this.inputSize);

  constructor() {
    this.inputCanvas = document.createElement("canvas");
    this.inputCanvas.width = this.inputSize;
    this.inputCanvas.height = this.inputSize;
    this.inputContext = this.inputCanvas.getContext("2d")!;

    const faceModelPath = path.resolve(
      __dirname,
      "face_detection_front.tflite"
    );
    this.interpreter = new Interpreter(fs.readFileSync(faceModelPath));
    this.interpreter.allocateTensors();
  }

  detect(input: HTMLVideoElement) {
    this.inputContext.drawImage(input, 0, 0, this.inputSize, this.inputSize);
    const rgbFloat = canvasToRGBFloat(this.inputContext);

    this.interpreter.inputs[0].copyFrom(rgbFloat);
    this.interpreter.invoke();

    const coordinatesData = new Float32Array(896 * 16);
    const scoreData = new Float32Array(896);

    this.interpreter.outputs[0].copyTo(coordinatesData);
    this.interpreter.outputs[1].copyTo(scoreData);

    for (let i = 0; i < scoreData.length; ++i) {
      scoreData[i] = sigmoid(scoreData[i]);
    }
  }
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

  const faceDetector = new FaceDetector();

  const animate = () => {
    faceDetector.detect(video);

    requestAnimationFrame(animate);
  };
  animate();
};

init();
