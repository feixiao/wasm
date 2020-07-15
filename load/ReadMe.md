## 加载和运行WebAssembly代码
WebAssembly还没有和<script type='module'>或ES6的import语句集成，也就是说，当前还没有内置的方式让浏览器为你获取模块。当前唯一的方式就是创建一个包含你的WebAssembly模块二进制代码的 ArrayBuffer 并且使用WebAssembly.instantiate()编译它。


#### 准备simple.wasm和simple.wat
simple.wasm可以由simple.wat转换而来。
```shell
wat2wasm simple.wat -o simple.wasm
```
+ simple.wat的内容以及解读
```shell
(module
  (func $i (import "imports" "imported_func") (param i32))
  (func (export "exported_func")
    i32.const 42
    call $i))

```
















#### 参考资料
+ [加载和运行WebAssembly代码](https://developer.mozilla.org/zh-CN/docs/WebAssembly/Loading_and_running)