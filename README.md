# node-tflite

TensorFlow Lite bindings for Node.js

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
