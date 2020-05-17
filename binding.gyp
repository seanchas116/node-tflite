{
  "targets": [
    {
      "target_name": "tflitejs",
      "sources": [ "index.cc" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}