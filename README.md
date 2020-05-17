# tflite-js

TensorFlow Lite for JavaScript (unofficial)

## Supported Platforms

- Node
  - [x] macOS
  - [ ] Windows
  - [ ] Linux
- WebAssembly
  - [ ] MVP
  - [ ] Threads
  - [ ] Threads + SIMD

## Install

```
npm install tflitejs
```

## Use

```js
import { Interpreter } from "tflitejs";

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
