import { Interpreter } from "node-tflite";
import fs from "fs";
import path from "path";

async function init() {
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

  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  canvas.width = 640;
  canvas.height = 480;
  const context = canvas.getContext("2d")!;
  context.strokeStyle = "red";
  context.lineWidth = 2;

  const animate = () => {
    const rect = faceDetector.detect(video);

    context.drawImage(video, 0, 0);
    if (rect) {
      context.strokeRect(
        rect[0],
        rect[1],
        rect[2] - rect[0],
        rect[3] - rect[1]
      );
    }

    requestAnimationFrame(animate);
  };
  animate();
}

init();

type Box = [number, number, number, number]; // left, top, right, bottom

class FaceDetector {
  private inputSize = 128;
  private inputCanvas: HTMLCanvasElement;
  private inputContext: CanvasRenderingContext2D;
  private interpreter: Interpreter;
  private anchors = this.generateAnchors(this.inputSize, this.inputSize);

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

  detect(input: CanvasImageSource): Box | undefined {
    this.inputContext.drawImage(input, 0, 0, this.inputSize, this.inputSize);
    const rgbFloat = canvasToRGBFloat(this.inputContext);

    this.interpreter.inputs[0].copyFrom(rgbFloat);
    this.interpreter.invoke();

    const coordinatesData = new Float32Array(this.anchors.length * 16);
    const scoreData = new Float32Array(this.anchors.length);

    this.interpreter.outputs[0].copyTo(coordinatesData);
    this.interpreter.outputs[1].copyTo(scoreData);

    for (let i = 0; i < this.anchors.length; ++i) {
      scoreData[i] = sigmoid(scoreData[i]);
    }

    const maxScore = Math.max(...Array.from(scoreData));
    if (maxScore < 0.75) {
      return;
    }

    // Find up to 1 faces
    const bestIndex = scoreData.indexOf(maxScore);

    const centerX =
      coordinatesData[bestIndex * 16] + this.anchors[bestIndex][0];
    const centerY =
      coordinatesData[bestIndex * 16 + 1] + this.anchors[bestIndex][1];
    const width = coordinatesData[bestIndex * 16 + 2];
    const height = coordinatesData[bestIndex * 16 + 3];
    const left = centerX - width / 2;
    const top = centerY - height / 2;
    const right = left + width;
    const bottom = top + height;

    return [
      (left / this.inputSize) * (input.width as number),
      (top / this.inputSize) * (input.height as number),
      (right / this.inputSize) * (input.width as number),
      (bottom / this.inputSize) * (input.height as number),
    ];
  }

  private generateAnchors(width: number, height: number): [number, number][] {
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
}

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
