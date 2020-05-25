const addon = require("bindings")("node_tflite");

const types = [
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
] as const;

export type Type = typeof types[number];

export interface InterpreterOptions {
  numThreads?: number;
}

export class Interpreter {
  private _interpreter: any;
  private _allocated = false;

  get allocated() {
    return this._allocated;
  }

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
    this._allocated = false;
  }

  allocateTensors() {
    this._interpreter.allocateTensors();
    this._allocated = true;
  }

  invoke() {
    if (!this._allocated) {
      throw new Error(
        `Tensor is not yet allocated. Call allocateTensors() before calling invoke().`
      );
    }
    this._interpreter.invoke();
  }
}

export class Tensor {
  private _interpreter: Interpreter;
  private _tensor: any;

  constructor(interpreter: Interpreter, _tensor: any) {
    this._interpreter = interpreter;
    this._tensor = _tensor;
  }

  get interpreter(): Interpreter {
    return this._interpreter;
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

  get byteSize(): number {
    return this._tensor.byteSize();
  }

  copyFrom(data: ArrayBufferView) {
    if (this.byteSize != data.buffer.byteLength) {
      throw new Error("data size does not match");
    }
    if (!this.interpreter.allocated) {
      throw new Error(
        `Tensor is not yet allocated. Call allocateTensors() before calling copyFrom().`
      );
    }
    this._tensor.copyFromBuffer(Buffer.from(data.buffer));
  }

  copyTo(data: ArrayBufferView) {
    if (this.byteSize != data.buffer.byteLength) {
      throw new Error("data size does not match");
    }
    if (!this.interpreter.allocated) {
      throw new Error(
        `Tensor is not yet allocated. Call allocateTensors() before calling copyTo().`
      );
    }
    this._tensor.copyToBuffer(Buffer.from(data.buffer));
  }
}
