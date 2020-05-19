#include "tensorflow/lite/c/c_api.h"
#include <napi.h>

class Tensor : public Napi::ObjectWrap<Tensor> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(
        env, "Tensor",
        {
            InstanceMethod("type", &Tensor::Type),
            InstanceMethod("dims", &Tensor::Dims),
            InstanceMethod("byteSize", &Tensor::ByteSize),
            InstanceMethod("copyFromBuffer", &Tensor::CopyFromBuffer),
            InstanceMethod("copyToBuffer", &Tensor::CopyToBuffer),
        });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Tensor", func);
    return exports;
  }

  Tensor(const Napi::CallbackInfo &info) : Napi::ObjectWrap<Tensor>(info) {}

private:
  friend class Interpreter;
  static Napi::FunctionReference constructor;

  Napi::Value Type(const Napi::CallbackInfo &info) {
    return Napi::Number::New(info.Env(), TfLiteTensorType(_tensor));
  }

  Napi::Value Dims(const Napi::CallbackInfo &info) {
    auto $dims = Napi::Array::New(info.Env());
    auto numDims = TfLiteTensorNumDims(_tensor);
    for (int i = 0; i < numDims; ++i) {
      auto dim = TfLiteTensorDim(_tensor, i);
      $dims[i] = Napi::Number::New(info.Env(), dim);
    }
    return $dims;
  }

  Napi::Value ByteSize(const Napi::CallbackInfo &info) {
    return Napi::Number::New(info.Env(), TfLiteTensorByteSize(_tensor));
  }

  Napi::Value Name(const Napi::CallbackInfo &info) {
    return Napi::String::New(info.Env(), TfLiteTensorName(_tensor));
  }

  Napi::Value CopyFromBuffer(const Napi::CallbackInfo &info) {
    Napi::Buffer<uint8_t> $buffer = info[0].As<Napi::Buffer<uint8_t>>();
    if (TfLiteTensorCopyFromBuffer(const_cast<TfLiteTensor *>(_tensor),
                                   $buffer.Data(),
                                   $buffer.Length()) != kTfLiteOk) {
      Napi::Error::New(info.Env(), "CopyFromBuffer failed")
          .ThrowAsJavaScriptException();
    }
    return Napi::Value();
  }

  Napi::Value CopyToBuffer(const Napi::CallbackInfo &info) {
    Napi::Buffer<uint8_t> $buffer = info[0].As<Napi::Buffer<uint8_t>>();
    if (TfLiteTensorCopyToBuffer(_tensor, $buffer.Data(), $buffer.Length()) !=
        kTfLiteOk) {
      Napi::Error::New(info.Env(), "CopyToBuffer failed")
          .ThrowAsJavaScriptException();
    }
    return Napi::Value();
  }

  const TfLiteTensor *_tensor = nullptr;
};

Napi::FunctionReference Tensor::constructor;

class Interpreter : public Napi::ObjectWrap<Interpreter> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(
        env, "Interpreter",
        {
            InstanceMethod("getInputTensorCount",
                           &Interpreter::GetInputTensorCount),
            InstanceMethod("getInputTensor", &Interpreter::GetInputTensor),
            InstanceMethod("resizeInputTensor",
                           &Interpreter::ResizeInputTensor),
            InstanceMethod("allocateTensors", &Interpreter::AllocateTensors),
            InstanceMethod("invoke", &Interpreter::Invoke),
            InstanceMethod("getOutputTensorCount",
                           &Interpreter::GetOutputTensorCount),
            InstanceMethod("getOutputTensor", &Interpreter::GetOutputTensor),
        });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Interpreter", func);
    return exports;
  }

  Interpreter(const Napi::CallbackInfo &info)
      : Napi::ObjectWrap<Interpreter>(info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    Napi::Buffer<uint8_t> $buffer = info[0].As<Napi::Buffer<uint8_t>>();
    Napi::Object $options = info[1].As<Napi::Object>();

    int numThreads = 0;
    if ($options.Has("numThreads")) {
      numThreads = $options.Get("numThreads").As<Napi::Number>().Int32Value();
    }

    auto options = TfLiteInterpreterOptionsCreate();
    if (0 < numThreads) {
      TfLiteInterpreterOptionsSetNumThreads(options, numThreads);
    }

    _modelData = std::vector<uint8_t>($buffer.Data(), $buffer.Data() + $buffer.Length());
    auto model = TfLiteModelCreate(_modelData.data(), _modelData.size());
    _interpreter = TfLiteInterpreterCreate(model, options);
    if (!_interpreter) {
      Napi::Error::New(info.Env(), "Failed to create Interpreter")
          .ThrowAsJavaScriptException();
      return;
    }

    TfLiteModelDelete(model);
    TfLiteInterpreterOptionsDelete(options);
  }

  ~Interpreter() { TfLiteInterpreterDelete(_interpreter); }

private:
  static Napi::FunctionReference constructor;

  Napi::Value GetInputTensorCount(const Napi::CallbackInfo &info) {
    return Napi::Number::New(
        info.Env(), TfLiteInterpreterGetInputTensorCount(_interpreter));
  }

  Napi::Value GetInputTensor(const Napi::CallbackInfo &info) {
    auto index = info[0].As<Napi::Number>().Int32Value();

    auto $tensor = Tensor::constructor.New({});
    auto tensor = Tensor::Unwrap($tensor);
    tensor->_tensor = TfLiteInterpreterGetInputTensor(_interpreter, index);
    return $tensor;
  }

  Napi::Value ResizeInputTensor(const Napi::CallbackInfo &info) {
    Napi::Number $inputIndex = info[0].As<Napi::Number>();
    Napi::Array $inputDims = info[1].As<Napi::Array>();
    int inputDimsSize = $inputDims.Length();
    std::vector<int> inputDims;
    for (int i = 0; i < inputDimsSize; ++i) {
      inputDims.push_back(
          Napi::Value($inputDims[i]).As<Napi::Number>().Int32Value());
    }
    if (TfLiteInterpreterResizeInputTensor(
            _interpreter, $inputIndex.Int32Value(), inputDims.data(),
            inputDims.size()) != kTfLiteOk) {
      Napi::Error::New(info.Env(), "ResizeInputTensor failed")
          .ThrowAsJavaScriptException();
    }
    return Napi::Value();
  }

  Napi::Value AllocateTensors(const Napi::CallbackInfo &info) {
    if (TfLiteInterpreterAllocateTensors(_interpreter) != kTfLiteOk) {
      Napi::Error::New(info.Env(), "AllocateTensors failed")
          .ThrowAsJavaScriptException();
    }
    return Napi::Value();
  }

  Napi::Value Invoke(const Napi::CallbackInfo &info) {
    if (TfLiteInterpreterInvoke(_interpreter) != kTfLiteOk) {
      Napi::Error::New(info.Env(), "Invoke failed")
          .ThrowAsJavaScriptException();
    }
    return Napi::Value();
  }

  Napi::Value GetOutputTensorCount(const Napi::CallbackInfo &info) {
    return Napi::Number::New(
        info.Env(), TfLiteInterpreterGetOutputTensorCount(_interpreter));
  }

  Napi::Value GetOutputTensor(const Napi::CallbackInfo &info) {
    auto index = info[0].As<Napi::Number>().Int32Value();

    auto $tensor = Tensor::constructor.New({});
    auto tensor = Tensor::Unwrap($tensor);
    tensor->_tensor = TfLiteInterpreterGetOutputTensor(_interpreter, index);
    return $tensor;
  }

  std::vector<uint8_t> _modelData;
  TfLiteInterpreter *_interpreter = nullptr;
};

Napi::FunctionReference Interpreter::constructor;

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  Interpreter::Init(env, exports);
  Tensor::Init(env, exports);
  return exports;
}

NODE_API_MODULE(node_tflite, InitAll)
