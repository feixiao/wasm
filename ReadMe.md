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

#### 使用自定义HTML模板
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

#### 调用一个定义在C中的自定义方法
```shell
mkdir call
cd call
```
+ 准备C代码
```C
#include <stdio.h>
#include <emscripten/emscripten.h>

int main(int argc, char ** argv) {
    printf("Hello World\n");
}

#ifdef __cplusplus
extern "C" {
#endif

int EMSCRIPTEN_KEEPALIVE myFunction(int argc, char ** argv) {
  printf("我的函数已被调用\n");
}

#ifdef __cplusplus
}
#endif
```
默认情况下，Emscripten 生成的代码只会调用 main() 函数，其它的函数将被视为无用代码。在一个函数名之前添加 EMSCRIPTEN_KEEPALIVE 能够防止这样的事情发生。你需要导入 emscripten.h 库来使用 EMSCRIPTEN_KEEPALIVE。

+ 生成代码
```
emcc -o hello.html hello.c -O3 -s WASM=1 -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall']" --shell-file shell_minimal.html
```
+ hello.html添加如下代码
```javascript
      <button class="mybutton">运行我的函数</button>
        <script>
            document.querySelector('.mybutton').addEventListener('click', function(){
            alert('检查控制台');
            var result = Module.ccall('myFunction', // name of C function 
                         null, // return type
                         null, // argument types
                         null); // arguments
         });
        </script>
```

#### 完整例子
+   [基于WASM的H265 Web播放器](https://github.com/sonysuqin/WasmVideoPlayer)

#### 参考资料
+ [webassembly](https://webassembly.org/)
+ [webassembly firefox](https://developer.mozilla.org/zh-CN/docs/WebAssembly)
+ [emscripten](https://emscripten.org/)
+ [webassembly-examples](https://github.com/mdn/webassembly-examples)