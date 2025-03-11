## WebAssembly 快速入门


### 推荐优秀的资料[cppwasm-book](https://github.com/3dgen/cppwasm-book)

#### 编译 Emscripten
+ OSX or Ubuntu
```shell
wget https://codeload.github.com/emscripten-core/emsdk/zip/refs/tags/4.0.4 -o emsdk-4.0.4.zip
cd emsdk
./emsdk install latest
./emsdk activate latest

source ./emsdk_env.sh
source "/Users/frank/wk/forbuild/emsdk-4.0.4/emsdk_env.sh"

#echo 'source "/Users/frank/wk/forbuild/emsdk-4.0.4/emsdk_env.sh"' >> $HOME/.zprofile
```
+ Windows10
```shell
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
.\emsdk.bat install latest
.\emsdk.bat activate latest
.\emsdk_env.bat
# 添加相应的路径和环境变量

```
#### [1: 编译并运行一个简单的程序](./hello/ReadMe.md)
#### [2: 使用自定义HTML模板](./html_template/ReadMe.md)
#### [3: 调用一个定义在C中的自定义方法](./call/ReadMe.md)
#### [4: 加载和运行WebAssembly代码](./load/ReadMe.md)
#### [5: 从C++编译WebAssembly的实用指南]()
##### 完整例子
+   [基于WASM的H265 Web播放器](https://github.com/sonysuqin/WasmVideoPlayer)

#### 参考资料
+ [webassembly](https://webassembly.org/)
+ [webassembly firefox](https://developer.mozilla.org/zh-CN/docs/WebAssembly)
+ [emscripten](https://emscripten.org/)
+ [webassembly-examples](https://github.com/mdn/webassembly-examples)
+ [《从C++编译WebAssembly的实用指南》](https://www.yuque.com/metroluffy/fe-notes/compiling-from-c-to-webassembly-a-guide)
+ [modern-wasm-starter](https://github.com/TheLartians/modern-wasm-starter/tree/master)