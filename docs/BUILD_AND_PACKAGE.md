# Build, Run, and Package Guide

Complete guide for building, running, and packaging the Physics Question Generator application.

## Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) or later
- (Optional) An IDE: Visual Studio 2022, JetBrains Rider, or VS Code with C# Dev Kit
- (Optional for installer packaging) InnoSetup (Windows), WiX Toolset (Windows), or `appimagetool` (Linux)

Verify your SDK installation:

```bash
dotnet --version
```

---

## 1. Development Mode

### Restore and Build

```bash
# Restore all NuGet packages
dotnet restore PhysicsQuestionGenerator.sln

# Build the entire solution (Debug configuration is default)
dotnet build PhysicsQuestionGenerator.sln

# Build a specific project
dotnet build AvaloniaUI/AvaloniaUI.csproj
dotnet build Web/Web.csproj
```

### Run the Desktop App (AvaloniaUI)

```bash
# Run in Debug mode (default)
dotnet run --project AvaloniaUI

# Run with hot reload — automatically restarts on code changes
dotnet watch --project AvaloniaUI
```

### Run the Web App (Blazor WASM)

```bash
dotnet run --project Web
```

Then open `https://localhost:5001` in your browser.

### Run Tests

```bash
# Run all tests
dotnet test Tests/Tests.csproj

# Run with verbose output
dotnet test Tests/Tests.csproj --verbosity normal

# Run with code coverage
dotnet test Tests/Tests.csproj --collect:"XPlat Code Coverage"
```

### Specification File Setup

The application reads physics question specifications from `part_one.txt`. Place this file in the `specifications/` directory (gitignored):

```
specifications/
  part_one.txt
```

Example specification format:

```
[UNIT id:kinematics name:Kinematics]
[TOPIC id:proj-motion name:Projectile Motion unit:kinematics]
[SKILL id:calc-trajectory name:Calculate Trajectory topic:proj-motion]
[TEMPLATE id:t1 skill:calc-trajectory type:MC difficulty:3 ...]
```

---

## 2. Production Mode (Local)

### Run in Release Configuration

```bash
# Run the desktop app with Release optimizations
dotnet run --project AvaloniaUI -c Release
```

Release mode differences from Debug:
- Compiled with optimizations enabled (`/optimize`)
- No debug symbols in output
- Significantly better runtime performance
- Smaller memory footprint

### Publish for Local Execution

Framework-dependent publish produces optimized binaries that require .NET 8 runtime on the target machine:

```bash
# Publish desktop app (framework-dependent, cross-platform)
dotnet publish AvaloniaUI/AvaloniaUI.csproj -c Release -o ./publish/desktop

# Run the published app
./publish/desktop/AvaloniaUI
```

---

## 3. Portable Packaging

Portable packages are self-contained directories or single files that run without requiring .NET to be pre-installed on the target machine.

### Runtime Identifiers (RIDs)

Use the appropriate RID for your target platform:

| Platform | RID |
|----------|-----|
| Windows x64 | `win-x64` |
| Windows ARM64 | `win-arm64` |
| Linux x64 | `linux-x64` |
| Linux ARM64 | `linux-arm64` |
| macOS x64 (Intel) | `osx-x64` |
| macOS ARM64 (Apple Silicon) | `osx-arm64` |

### Framework-Dependent Portable

Smallest output, requires .NET 8 runtime on the target machine:

```bash
dotnet publish AvaloniaUI/AvaloniaUI.csproj -c Release -o ./publish/portable
```

Output size: ~5-10 MB. The user must have .NET 8 installed.

### Self-Contained Portable

Includes the .NET runtime — no .NET installation required on the target machine:

```bash
dotnet publish AvaloniaUI/AvaloniaUI.csproj \
  -c Release \
  -r win-x64 \
  --self-contained \
  -o ./publish/portable-win-x64
```

Output size: ~60-80 MB. Runs on any matching platform without prerequisites.

### Single-File Executable

Bundles everything into a single executable file:

```bash
dotnet publish AvaloniaUI/AvaloniaUI.csproj \
  -c Release \
  -r win-x64 \
  --self-contained \
  -p:PublishSingleFile=true \
  -o ./publish/single-file-win-x64
```

Output size: ~60-80 MB as a single `.exe` (Windows) or binary (Linux/macOS).

### Trimmed Single-File (Smallest)

Removes unused .NET assemblies to reduce size. **Caution**: trimming can break reflection-heavy dependencies. Test thoroughly after trimming.

```bash
dotnet publish AvaloniaUI/AvaloniaUI.csproj \
  -c Release \
  -r win-x64 \
  --self-contained \
  -p:PublishSingleFile=true \
  -p:PublishTrimmed=true \
  -o ./publish/trimmed-win-x64
```

Output size: ~15-25 MB. Test all features after publishing with trimming enabled.

### ReadyToRun (Faster Startup)

Compiles .NET assemblies to native code for faster startup at the cost of larger output:

```bash
dotnet publish AvaloniaUI/AvaloniaUI.csproj \
  -c Release \
  -r win-x64 \
  --self-contained \
  -p:PublishSingleFile=true \
  -p:PublishReadyToRun=true \
  -o ./publish/r2r-win-x64
```

### Cross-Platform Publish Examples

```bash
# Windows x64
dotnet publish AvaloniaUI/AvaloniaUI.csproj -c Release -r win-x64 --self-contained -p:PublishSingleFile=true -o ./publish/win-x64

# Linux x64
dotnet publish AvaloniaUI/AvaloniaUI.csproj -c Release -r linux-x64 --self-contained -p:PublishSingleFile=true -o ./publish/linux-x64

# macOS Apple Silicon
dotnet publish AvaloniaUI/AvaloniaUI.csproj -c Release -r osx-arm64 --self-contained -p:PublishSingleFile=true -o ./publish/osx-arm64
```

---

## 4. Installer Packaging

Installer packages provide a native installation experience with shortcuts, file associations, and proper uninstallation.

### Windows — InnoSetup (Recommended)

1. Publish the app as a self-contained single-file executable:

   ```bash
   dotnet publish AvaloniaUI/AvaloniaUI.csproj \
     -c Release \
     -r win-x64 \
     --self-contained \
     -p:PublishSingleFile=true \
     -o ./publish/win-x64
   ```

2. Install [InnoSetup](https://jrsoftware.org/isinfo.php).

3. Create an InnoSetup script (`installer/setup.iss`):

   ```iss
   [Setup]
   AppName=Physics Question Generator
   AppVersion=1.0.0
   AppPublisher=RandPhyQuGeA
   DefaultDirName={autopf}\PhysicsQuestionGenerator
   DefaultGroupName=Physics Question Generator
   OutputBaseFilename=PhysicsQuestionGenerator-1.0.0-setup
   Compression=lzma2/ultra64
   SolidCompression=yes
   ArchitecturesAllowed=x64compatible
   ArchitecturesInstallIn64BitMode=x64compatible

   [Files]
   Source: "..\publish\win-x64\AvaloniaUI.exe"; DestDir: "{app}"; Flags: ignoreversion
   Source: "..\publish\win-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs

   [Icons]
   Name: "{group}\Physics Question Generator"; Filename: "{app}\AvaloniaUI.exe"
   Name: "{autodesktop}\Physics Question Generator"; Filename: "{app}\AvaloniaUI.exe"

   [Run]
   Filename: "{app}\AvaloniaUI.exe"; Description: "Launch Physics Question Generator"; Flags: nowait postinstall skipifsilent
   ```

4. Build the installer:

   ```bash
   iscc installer/setup.iss
   ```

   Output: `PhysicsQuestionGenerator-1.0.0-setup.exe`

### Windows — WiX Toolset (MSI)

1. Publish the app as self-contained:

   ```bash
   dotnet publish AvaloniaUI/AvaloniaUI.csproj \
     -c Release -r win-x64 --self-contained \
     -p:PublishSingleFile=true -o ./publish/win-x64
   ```

2. Install [WiX Toolset v4](https://wixtoolset.org/).

3. Create a WiX source file (`installer/Product.wxs`) referencing the published files using `heat.exe` to harvest.

4. Build the MSI:

   ```bash
   wix build installer/Product.wxs -o ./publish/PhysicsQuestionGenerator-1.0.0.msi
   ```

### macOS — App Bundle and DMG

1. Publish the app:

   ```bash
   dotnet publish AvaloniaUI/AvaloniaUI.csproj \
     -c Release -r osx-arm64 --self-contained \
     -p:PublishSingleFile=true -o ./publish/osx-arm64
   ```

2. Create the `.app` bundle structure:

   ```bash
   mkdir -p "publish/PhysicsQuestionGenerator.app/Contents/MacOS"
   mkdir -p "publish/PhysicsQuestionGenerator.app/Contents/Resources"
   cp publish/osx-arm64/AvaloniaUI "publish/PhysicsQuestionGenerator.app/Contents/MacOS/"
   ```

3. Create `Info.plist` at `publish/PhysicsQuestionGenerator.app/Contents/Info.plist`:

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
     <key>CFBundleName</key>
     <string>Physics Question Generator</string>
     <key>CFBundleDisplayName</key>
     <string>Physics Question Generator</string>
     <key>CFBundleIdentifier</key>
     <string>com.randphyqugea.physicsquestiongenerator</string>
     <key>CFBundleVersion</key>
     <string>1.0.0</string>
     <key>CFBundleExecutable</key>
     <string>AvaloniaUI</string>
     <key>CFBundlePackageType</key>
     <string>APPL</string>
   </dict>
   </plist>
   ```

4. Create the DMG:

   ```bash
   hdiutil create -volname "Physics Question Generator" \
     -srcfolder "publish/PhysicsQuestionGenerator.app" \
     -ov -format UDZO \
     "publish/PhysicsQuestionGenerator-1.0.0.dmg"
   ```

### Linux — AppImage

1. Publish the app:

   ```bash
   dotnet publish AvaloniaUI/AvaloniaUI.csproj \
     -c Release -r linux-x64 --self-contained \
     -p:PublishSingleFile=true -o ./publish/linux-x64
   ```

2. Create the AppDir structure:

   ```bash
   mkdir -p publish/appimage/PhysicsQuestionGenerator.AppDir/usr/bin
   mkdir -p publish/appimage/PhysicsQuestionGenerator.AppDir/usr/share/applications
   mkdir -p publish/appimage/PhysicsQuestionGenerator.AppDir/usr/share/icons/hicolor/256x256/apps

   cp -r publish/linux-x64/* publish/appimage/PhysicsQuestionGenerator.AppDir/usr/bin/
   ```

3. Create `AppRun` at `publish/appimage/PhysicsQuestionGenerator.AppDir/AppRun`:

   ```bash
   #!/bin/bash
   SELF=$(readlink -f "$0")
   HERE=${SELF%/*}
   exec "${HERE}/usr/bin/AvaloniaUI" "$@"
   ```

   ```bash
   chmod +x publish/appimage/PhysicsQuestionGenerator.AppDir/AppRun
   ```

4. Create `publish/appimage/PhysicsQuestionGenerator.AppDir/PhysicsQuestionGenerator.desktop`:

   ```ini
   [Desktop Entry]
   Name=Physics Question Generator
   Exec=AvaloniaUI
   Icon=physics-question-generator
   Type=Application
   Categories=Education;Science;
   ```

5. Download [appimagetool](https://github.com/AppImage/AppImageKit/releases) and build:

   ```bash
   ./appimagetool-x86_64.AppImage publish/appimage/PhysicsQuestionGenerator.AppDir \
     publish/PhysicsQuestionGenerator-1.0.0-x86_64.AppImage
   ```

---

## 5. Web (Blazor WASM) Publishing

### Publish for Deployment

```bash
dotnet publish Web/Web.csproj -c Release -o ./publish/web
```

The `publish/web/wwwroot/` directory contains the complete static site. Deploy it to any static file server (GitHub Pages, Azure Static Web Apps, Nginx, etc.).

### Key Considerations

- Blazor WASM runs entirely client-side — no server-side .NET runtime required
- The `_framework/blazor.webassembly.js` bootstrapper loads the app
- Configure proper MIME types on your web server:
  - `.wasm` → `application/wasm`
  - `.dll` → `application/octet-stream`
  - `.blat` → `application/octet-stream`
  - `.dat` → `application/octet-stream`

---

## Quick Reference

| Task | Command |
|------|---------|
| Restore | `dotnet restore PhysicsQuestionGenerator.sln` |
| Build (Debug) | `dotnet build PhysicsQuestionGenerator.sln` |
| Build (Release) | `dotnet build PhysicsQuestionGenerator.sln -c Release` |
| Run desktop (Debug) | `dotnet run --project AvaloniaUI` |
| Run desktop (Release) | `dotnet run --project AvaloniaUI -c Release` |
| Hot reload | `dotnet watch --project AvaloniaUI` |
| Run web | `dotnet run --project Web` |
| Run tests | `dotnet test Tests/Tests.csproj` |
| Publish portable (self-contained) | `dotnet publish AvaloniaUI -c Release -r win-x64 --self-contained -o ./publish/portable` |
| Publish single-file | `dotnet publish AvaloniaUI -c Release -r win-x64 --self-contained -p:PublishSingleFile=true -o ./publish/single` |
| Publish trimmed | `dotnet publish AvaloniaUI -c Release -r win-x64 --self-contained -p:PublishSingleFile=true -p:PublishTrimmed=true -o ./publish/trimmed` |
| Publish web | `dotnet publish Web -c Release -o ./publish/web` |
