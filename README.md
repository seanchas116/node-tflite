# node-tflite

TensorFlow Lite (2.2) bindings for Node.js

## Supported Platforms

- [x] macOS
- [x] Windows
- [x] Linux

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

## Examples

- [BlazeFace face detection in Electron](https://github.com/seanchas116/node-tflite/tree/master/examples/electron-mediapipe-face)
  - Uses the BlazeFace model from [MediaPipe](https://github.com/google/mediapipe)
  - It runs in 60 FPS in MacBook Pro 16'' 2019, which is faster than [BlazeFace TF.js demo](https://storage.googleapis.com/tfjs-models/demos/blazeface/index.html)

## Benchmark

TODO

## Develop

### Setup

```
npm install
```

### Test

```
npm test
```

### Build .js and .d.ts

```
npm run dist
```

### How to build tensorflowlite_c library

- [Configure tensorflow](https://www.tensorflow.org/install/source)
- `bazel build //tensorflow/lite/c:tensorflowlite_c`
