# Physics Question Generator

A cross-platform physics practice question generator built with .NET 8, Avalonia UI, and Blazor WebAssembly.

## Features

- Generate physics questions from specification files (`part_one.txt`)
- Multiple choice and short answer question types
- LaTeX math rendering (MathJax / local pdflatex)
- Export to PDF, HTML, Markdown, and plain text
- Desktop app (Windows/macOS/Linux) and web (WASM)

## Quick Start

```bash
# Restore and build
dotnet restore PhysicsQuestionGenerator.sln
dotnet build PhysicsQuestionGenerator.sln

# Run tests
dotnet test Tests/Tests.csproj

# Run desktop app
dotnet run --project AvaloniaUI

# Run web app
dotnet run --project Web
```

## Specification File

Place your `part_one.txt` in `specifications/` (gitignored). Format:

```
[UNIT id:kinematics name:Kinematics]
[TOPIC id:proj-motion name:Projectile Motion unit:kinematics]
[SKILL id:calc-trajectory name:Calculate Trajectory topic:proj-motion]
[TEMPLATE id:t1 skill:calc-trajectory type:MC difficulty:3 ...]
```

## Architecture

| Project | Description |
|---------|-------------|
| **Core** | Headless domain models, services, exporters |
| **LaTeX** | LaTeX rendering (MathJax, pdflatex, caching) |
| **AvaloniaUI** | Cross-platform desktop app |
| **Web** | Blazor WebAssembly app |
| **Console** | CLI entry point |
| **Tests** | xUnit test suite |

## License

MIT
