# Release Process

## Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Creating a Release

1. Update `CHANGELOG.md` with the new version's changes
2. Update the version in `AvaloniaUI/Views/AboutDialog.axaml` and project files
3. Commit: `chore: bump version to x.y.z`
4. Tag: `git tag -a vx.y.z -m "Release x.y.z"`
5. Push: `git push origin main --tags`
6. Create a GitHub Release from the tag with changelog notes

## CI/CD

- All pushes to `main` and `develop` trigger the build pipeline
- Pull requests to `main` trigger build and test
- Tags matching `v*` trigger release builds

## Artifacts

- Windows: MSI installer
- macOS: DMG
- Linux: AppImage
- Web: Blazor WASM deployment package
