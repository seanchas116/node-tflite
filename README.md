# node-tflite

TensorFlow Lite bindings for Node.js

## Supported Platforms

- [x] macOS
- [x] Windows
- [ ] Linux

## Install

```
npm install node-tflite
```

## Use

```js
import { Interpreter } from "node-tflite";

const modelData = fs.readFileSync(modelPath);
const interpreter = new Interpreter(modelData);

interpreter.allocateTensors();

interpreter.inputs[0].copyFrom(inputData);

interpreter.invoke();

interpreter.outputs[0].copyTo(outputData);
```

## Benchmark

TODO

## Develop

### Build .js and .d.ts

```
npm run dist
```

### How to build tflite

- [Configure tensorflow](https://www.tensorflow.org/install/source)
- `bazel build //tensorflow/lite/c:tensorflowlite_c`
