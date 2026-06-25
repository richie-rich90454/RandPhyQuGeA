#!/usr/bin/env bash
# Build the physics_core Rust crate to WASM for the web fallback.
# Outputs to src/wasm/ (consumed by src/services/physicsCore.ts).
set -euo pipefail

# Run from the scripts/ directory so the ../ paths resolve to the project root.
cd "$(dirname "$0")"

wasm-pack build ../physics_core --target web --out-dir ../src/wasm
