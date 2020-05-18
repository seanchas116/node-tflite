import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { Interpreter } from "../";

const modelPath = path.resolve(__dirname, "mobilenet_v1_1.0_224_quant.tflite");
const labelsPath = path.resolve(__dirname, "labels_mobilenet_quant_v1_224.txt");
const imagePath = path.resolve(__dirname, "dog.png");

const labels = fs.readFileSync(labelsPath, { encoding: "utf-8" }).split("\n");

function createInterpreter() {
  const modelData = fs.readFileSync(modelPath);
  return new Interpreter(modelData);
}

async function getImageInput(size: number) {
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  const image = await loadImage(imagePath);
  context.drawImage(image, 0, 0, size, size);
  const data = context.getImageData(0, 0, size, size);

  const inputData = new Uint8Array(size * size * 3);

  for (let i = 0; i < size * size; ++i) {
    inputData[i * 3] = data.data[i * 4];
    inputData[i * 3 + 1] = data.data[i * 4 + 1];
    inputData[i * 3 + 2] = data.data[i * 4 + 2];
  }

  return inputData;
}

describe("Interpreter", () => {
  describe("constructor", () => {
    test("throws if model data is wrong", () => {
      expect(() => new Interpreter(new Uint8Array([1, 2, 3]))).toThrowError();
    });
  });
  describe("inputs", () => {
    test("return input tensors", () => {
      const interpreter = createInterpreter();
      const inputs = interpreter.inputs;
      expect(inputs.length).toBe(1);
      const input = inputs[0];
      expect(input.dims).toEqual([1, 224, 224, 3]);
      expect(input.type).toBe("UInt8");
      expect(input.byteSize).toBe(224 * 224 * 3);
    });
  });
  describe("outputs", () => {
    test("return output tensors", () => {
      const interpreter = createInterpreter();
      const outputs = interpreter.outputs;
      expect(outputs.length).toBe(1);
      const output = outputs[0];
      expect(output.dims).toEqual([1, 1001]);
      expect(output.type).toBe("UInt8");
      expect(output.byteSize).toBe(1001);
    });
  });
  describe("invoke", () => {
    test("runs model", async () => {
      const interpreter = createInterpreter();
      interpreter.allocateTensors();

      const inputData = await getImageInput(224);
      interpreter.inputs[0].copyFrom(inputData);

      interpreter.invoke();

      const outputData = new Uint8Array(1001);
      interpreter.outputs[0].copyTo(outputData);

      const maxIndex = outputData.indexOf(Math.max(...Array.from(outputData)));
      expect(labels[maxIndex]).toBe("otterhound");
    });
  });
});

describe("Tensor", () => {
  describe("copyTo", () => {
    test("throws if tensor is not allocated", async () => {
      const interpreter = createInterpreter();
      const inputData = await getImageInput(224);

      expect(() => interpreter.inputs[0].copyFrom(inputData)).toThrowError();
    });
    test("throws if size is different", () => {
      const interpreter = createInterpreter();
      interpreter.allocateTensors();

      expect(() =>
        interpreter.inputs[0].copyFrom(new Uint8Array([1, 2, 3]))
      ).toThrowError();
    });
  });

  describe("copyFrom", () => {
    test("throws if tensor is not allocated", async () => {
      const interpreter = createInterpreter();
      const outputData = new Uint8Array(1001);
      expect(() => interpreter.outputs[0].copyTo(outputData)).toThrowError();
    });
    test("throws if size is different", () => {
      const interpreter = createInterpreter();
      interpreter.allocateTensors();

      const outputData = new Uint8Array(10);
      expect(() => interpreter.inputs[0].copyFrom(outputData)).toThrowError();
    });
  });
});
