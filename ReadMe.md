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

##### 使用自定义HTML模板
```shell
mkdir html_template
cd html_template
```
+ 准备C代码
    ```C
    #include <stdio.h>

    int main(int argc, char ** argv) {
        printf("Hello World\n");    
    }
    ```
+ 获取HTML版本
```shell
cp ~/emscripten/src/shell_minimal.html shell_minimal.html
```
+ 生成代码
```shell
emcc -o hello.html hello.c -O3 -s WASM=1 --shell-file shell_minimal.html
```

#### 参考资料
+ [webassembly](https://webassembly.org/)
+ [webassembly firefox](https://developer.mozilla.org/zh-CN/docs/WebAssembly)
+ [emscripten](https://emscripten.org/)
+ [webassembly-examples](https://github.com/mdn/webassembly-examples)