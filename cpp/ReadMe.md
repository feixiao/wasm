## 从C++编译WebAssembly的实用指南

##### Set the CMAKE Toolchain
```shell
export CMAKE_TOOLCHAIN_FILE=/home/user/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake
```

##### Compile to WASM (default)
```shell
cd build  
emcmake cmake ../cpp
make
```

##### Compile to JS
```shell
cd build  
emcmake cmake ../cpp -DJS_ONLY=ON  
make
```


### 参考资料
+ [《Compile C++ to WebAssembly and JavaScript using Emscripten and CMake》](https://gist.github.com/ericoporto/8ce679ecb862a12795156d31f3ecac49)