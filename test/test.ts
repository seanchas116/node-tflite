import fs from "fs";
import { Interpreter } from "../";
import path from "path";

const modelPath = path.resolve(__dirname, "mobilenet_v1_1.0_224_quant.tflite");

function createInterpreter() {
  const modelData = fs.readFileSync(modelPath);
  return new Interpreter(modelData);
}

describe("Interpreter", () => {
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
});
