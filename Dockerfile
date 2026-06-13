FROM rust:1.80-slim-bookworm AS rust-builder
WORKDIR /app
COPY physics_core/ physics_core/
RUN cd physics_core && cargo build --release

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=rust-builder /app/physics_core/target/release/ ./
CMD ["./physics_core"]