
source "/Users/frank/wk/forbuild/emsdk-4.0.4/emsdk_env.sh"
CMAKE_TOOLCHAIN_FILE=/home/user/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake


rm build/ -rf
mkdir build
cd build 
emcmake cmake ../cpp -DJS_ONLY=ON
make
cp -rf  ../cpp/public/hello.js ../web/gen/hello.js

emcmake cmake ../cpp -DJS_ONLY=OFF
make 
cp -rf  ../cpp/public/hello.wasm.js ../web/gen/hello.wasm.js
cp -rf  ../cpp/public/hello.wasm.wasm ../web/gen/hello.wasm.wasm