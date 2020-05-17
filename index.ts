var addon = require("bindings")("tflitejs");

export type Type =
  | "NoType"
  | "Float32"
  | "Int32"
  | "UInt8"
  | "Int64"
  | "String"
  | "Bool"
  | "Int16"
  | "Complex64"
  | "Int8"
  | "Float16";

export const types: Type[] = [
  "NoType",
  "Float32",
  "Int32",
  "UInt8",
  "Int64",
  "String",
  "Bool",
  "Int16",
  "Complex64",
  "Int8",
  "Float16",
];

export interface InterpreterOptions {
  numThreads?: number;
}

export class Interpreter {
  private _interpreter: any;

  constructor(model: ArrayBufferView, options: InterpreterOptions = {}) {
    this._interpreter = new addon.Interpreter(
      Buffer.from(model.buffer),
      options
    );
  }

  get inputs(): Tensor[] {
    const count = this._interpreter.getInputTensorCount();
    const inputs: Tensor[] = [];
    for (let i = 0; i < count; ++i) {
      inputs.push(new Tensor(this, this._interpreter.getInputTensor(i)));
    }
    return inputs;
  }

  get outputs(): Tensor[] {
    const count = this._interpreter.getOutputTensorCount();
    const inputs: Tensor[] = [];
    for (let i = 0; i < count; ++i) {
      inputs.push(new Tensor(this, this._interpreter.getOutputTensor(i)));
    }
    return inputs;
  }

  resizeInputTensor(inputIndex: number, dims: number[]) {
    this._interpreter.resizeInputTensor(inputIndex, dims);
  }

  allocateTensors() {
    this._interpreter.allocateTensors();
  }

  invoke() {
    this._interpreter.invoke();
  }
}

export class Tensor {
  interpreter: Interpreter;
  private _tensor: any;

  constructor(interpreter: Interpreter, _tensor: any) {
    this.interpreter = interpreter;
    this._tensor = _tensor;
  }

  get type(): Type {
    return types[this._tensor.type()];
  }

  get name(): string {
    return this._tensor.name();
  }

  get dims(): number[] {
    return this._tensor.dims();
  }

  copyFrom(data: ArrayBufferView) {
    this._tensor.copyFromBuffer(Buffer.from(data.buffer));
  }

  copyTo(data: ArrayBufferView) {
    this._tensor.copyToBuffer(Buffer.from(data.buffer));
  }
}
