#!/usr/bin/env python3
import subprocess
import sys
from pathlib import Path

def run_cpp_tests():
    print("Running C++ tests...")
    project_root = Path(__file__).parent.parent
    test_dir = project_root / 'tests' / 'cpp'
    test_files = list(test_dir.glob('*.cpp'))
    if not test_files:
        print("No test files found in tests/cpp/")
        return False
    test_exe = project_root / 'build' / 'test_runner.exe'
    test_exe.parent.mkdir(exist_ok=True)
    cmd = [
        'g++',
        '-std=c++20',
        '-o', str(test_exe)
    ] + [str(f) for f in test_files]
    print(f"Compiling: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, check=True, cwd=project_root)
        print("Compilation successful.")
        print("Running tests...")
        subprocess.run([str(test_exe)], check=True)
        print("All tests passed.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Test failed: {e}")
        return False

def main():
    success = run_cpp_tests()
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()