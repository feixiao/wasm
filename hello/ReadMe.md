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