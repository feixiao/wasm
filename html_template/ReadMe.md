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