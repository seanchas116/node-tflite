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
      console.log(interpreter.inputs.map((i) => i.dims));
      expect(true).toBe(false);
    });
  });
});
