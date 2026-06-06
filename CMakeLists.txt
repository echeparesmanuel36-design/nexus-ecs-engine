cmake_minimum_required(VERSION 3.12)
project(NexusEcsEngine CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(MSVC)
    add_compile_options(/O2 /Oi /arch:AVX2)
else()
    add_compile_options(-O3 -march=native -pthread)
endif()

add_executable(nexus_engine main.cpp)
