"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tensor = exports.Interpreter = void 0;
var addon = require("bindings")("node_tflite");
var types = [
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
var Interpreter = /** @class */ (function () {
    function Interpreter(model, options) {
        if (options === void 0) { options = {}; }
        this._allocated = false;
        this._interpreter = new addon.Interpreter(Buffer.from(model.buffer), options);
    }
    Object.defineProperty(Interpreter.prototype, "allocated", {
        get: function () {
            return this._allocated;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Interpreter.prototype, "inputs", {
        get: function () {
            var count = this._interpreter.getInputTensorCount();
            var inputs = [];
            for (var i = 0; i < count; ++i) {
                inputs.push(new Tensor(this, this._interpreter.getInputTensor(i)));
            }
            return inputs;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Interpreter.prototype, "outputs", {
        get: function () {
            var count = this._interpreter.getOutputTensorCount();
            var inputs = [];
            for (var i = 0; i < count; ++i) {
                inputs.push(new Tensor(this, this._interpreter.getOutputTensor(i)));
            }
            return inputs;
        },
        enumerable: false,
        configurable: true
    });
    Interpreter.prototype.resizeInputTensor = function (inputIndex, dims) {
        this._interpreter.resizeInputTensor(inputIndex, dims);
        this._allocated = false;
    };
    Interpreter.prototype.allocateTensors = function () {
        this._interpreter.allocateTensors();
        this._allocated = true;
    };
    Interpreter.prototype.invoke = function () {
        if (!this._allocated) {
            throw new Error("Tensor is not yet allocated. Call allocateTensors() before calling invoke().");
        }
        this._interpreter.invoke();
    };
    return Interpreter;
}());
exports.Interpreter = Interpreter;
var Tensor = /** @class */ (function () {
    function Tensor(interpreter, _tensor) {
        this._interpreter = interpreter;
        this._tensor = _tensor;
    }
    Object.defineProperty(Tensor.prototype, "interpreter", {
        get: function () {
            return this._interpreter;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Tensor.prototype, "type", {
        get: function () {
            return types[this._tensor.type()];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Tensor.prototype, "name", {
        get: function () {
            return this._tensor.name();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Tensor.prototype, "dims", {
        get: function () {
            return this._tensor.dims();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Tensor.prototype, "byteSize", {
        get: function () {
            return this._tensor.byteSize();
        },
        enumerable: false,
        configurable: true
    });
    Tensor.prototype.copyFrom = function (data) {
        if (this.byteSize != data.buffer.byteLength) {
            throw new Error("data size does not match");
        }
        if (!this.interpreter.allocated) {
            throw new Error("Tensor is not yet allocated. Call allocateTensors() before calling copyFrom().");
        }
        this._tensor.copyFromBuffer(Buffer.from(data.buffer));
    };
    Tensor.prototype.copyTo = function (data) {
        if (this.byteSize != data.buffer.byteLength) {
            throw new Error("data size does not match");
        }
        if (!this.interpreter.allocated) {
            throw new Error("Tensor is not yet allocated. Call allocateTensors() before calling copyTo().");
        }
        this._tensor.copyToBuffer(Buffer.from(data.buffer));
    };
    return Tensor;
}());
exports.Tensor = Tensor;
