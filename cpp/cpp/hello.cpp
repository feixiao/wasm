#include <cstdio>
#include <vector>

#include "fib.h"

extern "C" {
int new_fib();
int next_val(int fib_instance);
}

auto instances = std::vector<Fib>();

int next_val(int fib_instance) {
  printf("%s", __func__);
  return instances[fib_instance].next();
}

int new_fib() {
  instances.push_back(Fib());
  printf("%s", __func__);
  return instances.size() - 1;
}

int main() {
  int fib1 = new_fib();
  next_val(fib1);
  return 0;
}

// #include <iostream>

/*
int main() {
        Fib fib{};
        std::cout << fib.next() << std::endl;
        std::cout << fib.next() << std::endl;
        std::cout << fib.next() << std::endl;
        std::cout << fib.next() << std::endl;
        std::cout << fib.next() << std::endl;
        return 0;
}
*/
