# Build the physics_core Rust crate to WASM for the web fallback.
# Outputs to src/wasm/ (consumed by src/services/physicsCore.ts).

# Run from the scripts/ directory so the ../ paths resolve to the project root.
Push-Location -Path $PSScriptRoot
try {
    wasm-pack build ../physics_core --target web --out-dir ../src/wasm
} finally {
    Pop-Location
}
