# ---- Rust Builder Stage ----
FROM rust:1.80-slim-bookworm AS rust-builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests first for dependency caching
COPY physics_core/Cargo.toml physics_core/Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release 2>/dev/null || true
RUN rm -rf src

# Copy actual source
COPY physics_core/ ./
RUN cargo build --release

# ---- Flutter Builder Stage ----
FROM debian:bookworm-slim AS flutter-builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    unzip \
    xz-utils \
    libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

# Install Flutter
ARG FLUTTER_VERSION=3.24.0
RUN git clone https://github.com/flutter/flutter.git -b stable --depth 1 /flutter
ENV PATH="/flutter/bin:${PATH}"

COPY physics_app/ physics_app/
RUN cd physics_app && flutter pub get
RUN cd physics_app && flutter build web --release

# ---- Runtime Stage ----
FROM debian:bookworm-slim AS runtime
LABEL org.opencontainers.image.title="RandPhyQuGeA"
LABEL org.opencontainers.image.description="Physics Question Generator with Rust and Flutter"
LABEL org.opencontainers.image.source="https://github.com/randphyqugea/physics-question-generator"
LABEL org.opencontainers.image.licenses="MIT"

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Rust binaries
COPY --from=rust-builder /app/target/release/physics_core /app/physics_core
COPY --from=flutter-builder /app/physics_app/build/web /app/web

# Add a non-root user
RUN useradd -m -u 1000 -s /bin/bash appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD test -f /app/physics_core || exit 1

EXPOSE 8080
CMD ["./physics_core"]