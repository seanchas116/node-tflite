{
  "targets": [
    {
      "target_name": "tflitejs",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [ "index.cc" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "tflite/include"
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
    }
  ]
}