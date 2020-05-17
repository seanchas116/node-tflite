{
    "targets": [
        {
            "target_name": "tflitejs",
            "cflags!": ["-fno-exceptions"],
            "cflags_cc!": ["-fno-exceptions"],
            "sources": ["index.cc"],
            "include_dirs": [
                "<!@(node -p \"require('node-addon-api').include\")",
                "tflite/include"
            ],
            'defines': ['NAPI_DISABLE_CPP_EXCEPTIONS'],
            "conditions": [
                ['OS=="mac"', {
                    "libraries": [
                        "<(module_root_dir)/tflite/osx_x86_64/libtensorflowlite_c.dylib",
                        "-Wl,-rpath,@loader_path"
                    ],
                    "copies":[{
                        "destination": "./build/Release",
                        "files": ["<(module_root_dir)/tflite/osx_x86_64/libtensorflowlite_c.dylib"],
                    }],
                }],
                ['OS=="win"', {
                    "libraries": ["<(module_root_dir)/tflite/windows_x86_64/tensorflowlite_c.dll.if.lib"],
                    "copies":[{
                        "destination": "./build/Release",
                        "files": ["<(module_root_dir)/tflite/windows_x86_64/tensorflowlite_c.dll"],
                    }],
                }],
            ],
        },
    ],
}
