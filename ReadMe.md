## WebAssembly 快速入门

#### 编译 Emscripten
```shell
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest

source ./emsdk_env.sh
```
#### 编译并运行一个简单的程序
```shell
mkdir hello

// hello.c
#include <stdio.h>

int main(int argc, char ** argv) { 
    printf("Hello, world!\n");
}


emcc hello.c -s WASM=1 -o hello.html

emrun --no_browser --port 8080 .

# 浏览访问localhost:8080
```


#### 参考资料
+ [webassembly](https://webassembly.org/)
+ [webassembly firefox](https://developer.mozilla.org/zh-CN/docs/WebAssembly)
+ [emscripten](https://emscripten.org/)