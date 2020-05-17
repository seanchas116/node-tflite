#include "tensorflow/lite/c/c_api.h"
#include <napi.h>

class Interpreter : public Napi::ObjectWrap<Interpreter> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(
        env, "Interpreter",
        {
            InstanceMethod("getInputTensorCount",
                           &Interpreter::GetInputTensorCount),
            InstanceMethod("getInputTesor", &Interpreter::GetInputTensor),
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

    int length = info.Length();

    if (length < 2) {
      Napi::TypeError::New(env, "2 arguments expected")
          .ThrowAsJavaScriptException();
    }

    if (!info[0].IsBuffer()) {
      Napi::TypeError::New(env, "Buffer expected").ThrowAsJavaScriptException();
      return;
    }
    if (!info[1].IsObject()) {
      Napi::TypeError::New(env, "Object expected").ThrowAsJavaScriptException();
      return;
    }

    Napi::Buffer<uint8_t> $buffer = info[0].As<Napi::Buffer<uint8_t>>();
    Napi::Object $options = info[1].As<Napi::Object>();

    Napi::Number $numThreads = $options.Get("numThreads").As<Napi::Number>();

    auto options = TfLiteInterpreterOptionsCreate();
    TfLiteInterpreterOptionsSetNumThreads(options, $numThreads.Int32Value());

    auto model = TfLiteModelCreate($buffer.Data(), $buffer.Length());
    _interpreter = TfLiteInterpreterCreate(model, options);

    TfLiteModelDelete(model);
    TfLiteInterpreterOptionsDelete(options);
  }

  ~Interpreter() { TfLiteInterpreterDelete(_interpreter); }

private:
  static Napi::FunctionReference constructor;

  Napi::Value GetInputTensorCount(const Napi::CallbackInfo &info);
  Napi::Value GetInputTensor(const Napi::CallbackInfo &info);
  Napi::Value ResizeInputTensor(const Napi::CallbackInfo &info);
  Napi::Value AllocateTensors(const Napi::CallbackInfo &info);
  Napi::Value Invoke(const Napi::CallbackInfo &info);
  Napi::Value GetOutputTensorCount(const Napi::CallbackInfo &info);
  Napi::Value GetOutputTensor(const Napi::CallbackInfo &info);

  TfLiteInterpreter *_interpreter;
};

Napi::String Method(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  return Napi::String::New(env, "world");
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "hello"),
              Napi::Function::New(env, Method));
  return exports;
}

NODE_API_MODULE(hello, Init)
