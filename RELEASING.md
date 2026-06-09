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

For detailed build, run, and packaging instructions, see [docs/BUILD_AND_PACKAGE.md](docs/BUILD_AND_PACKAGE.md).

### Portable Packages

Self-contained single-file executables that run without .NET installed:

```bash
# Windows x64
dotnet publish AvaloniaUI -c Release -r win-x64 --self-contained -p:PublishSingleFile=true -o ./publish/win-x64

# Linux x64
dotnet publish AvaloniaUI -c Release -r linux-x64 --self-contained -p:PublishSingleFile=true -o ./publish/linux-x64

# macOS Apple Silicon
dotnet publish AvaloniaUI -c Release -r osx-arm64 --self-contained -p:PublishSingleFile=true -o ./publish/osx-arm64
```

### Installer Packages

| Platform | Format | Tooling |
|----------|--------|---------|
| Windows | EXE installer | InnoSetup (recommended) or WiX (MSI) |
| macOS | DMG | `hdiutil` + `.app` bundle |
| Linux | AppImage | `appimagetool` |
| Web | Static files | `dotnet publish Web -c Release` |

See [docs/BUILD_AND_PACKAGE.md](docs/BUILD_AND_PACKAGE.md) for complete step-by-step instructions.
