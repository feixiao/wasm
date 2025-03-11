project (client)
cmake_minimum_required(VERSION 3.5.1)
option(JS_ONLY "Compiles to native JS (No WASM)" OFF)

add_definitions(-std=c++11 -O3)
include_directories(include)

file(GLOB SOURCES *.cpp)

set(exports 
	  _new_fib 
	  _next_val
	)

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/public")
add_executable(hello ${SOURCES})

if(JS_ONLY)
	message(STATUS "Setting compilation target to native JavaScript")
	set(CMAKE_EXECUTABLE_SUFFIX ".js")
	set_target_properties(hello PROPERTIES LINK_FLAGS "-s WASM=0 -s EXPORTED_FUNCTIONS='[_new_fib,_next_val]'")
else()
	message(STATUS "Setting compilation target to WASM")
	set(CMAKE_EXECUTABLE_SUFFIX ".wasm.js")
	set_target_properties(hello PROPERTIES LINK_FLAGS "-s WASM=1 -s EXPORTED_FUNCTIONS='[_new_fib,_next_val]'")
endif()

# 怎么生成测试web 
# 让 Emscripten 生成 HTML
set_target_properties(hello PROPERTIES
    OUTPUT_NAME "wasm_project"
    SUFFIX ".html"  # 让 Emscripten 直接生成 HTML
)

# 传递 Emscripten 编译参数
target_compile_options(hello PRIVATE 
    "-o wasm_project.html"  # 直接生成 HTML
)