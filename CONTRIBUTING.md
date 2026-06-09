# Contributing to Physics Question Generator

Thank you for your interest in contributing! This document provides guidelines and instructions.

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Open a new issue using the **Bug Report** template
3. Include steps to reproduce, expected vs actual behavior, and environment details

### Suggesting Features

1. Open a new issue using the **Feature Request** template
2. Describe the use case and expected behavior

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes with clear, focused commits
4. Ensure all tests pass: `dotnet test Tests/Tests.csproj`
5. Follow the project's code style (see below)
6. Open a pull request using the **PR template**

## Development Setup

```bash
git clone https://github.com/your-username/RandPhyQuGeA.git
cd RandPhyQuGeA
dotnet restore PhysicsQuestionGenerator.sln
dotnet build PhysicsQuestionGenerator.sln
```

## Code Style

- **C# conventions**: Follow the [C# Coding Conventions](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- **Naming**: PascalCase for public members, camelCase for private fields and parameters
- **Immutable models**: Use `record` types for domain objects
- **Interfaces**: Prefix with `I` (e.g., `IQuestionGenerator`)
- **No static state**: Use dependency injection throughout
- **Headless core**: UI projects must not contain business logic

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `test:` adding or updating tests
- `refactor:` code restructuring
- `chore:` maintenance tasks

## Project Structure

```
Core/           # Headless domain logic (no UI dependencies)
LaTeX/          # LaTeX rendering services
AvaloniaUI/     # Desktop application
Web/            # Blazor WebAssembly application
Console/        # CLI entry point
Tests/          # xUnit test suite
```

## Questions?

Open an issue with the **Question** label and we'll help you out.
