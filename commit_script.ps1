# Resilient commit script - continues past errors
$ErrorActionPreference = "Continue"

function Commit {
    param([string]$Message, [string[]]$Paths)
    try {
        if ($Paths.Count -gt 0) {
            git add @Paths 2>$null
        }
        $staged = git diff --cached --name-only 2>$null
        if ($staged) {
            git commit -m $Message 2>$null
            $count = (git rev-list --count HEAD) + 1
            Write-Host "  [$count] $Message"
        } else {
            Write-Host "  SKIP: $Message"
        }
    } catch {
        Write-Host "  ERROR: $Message - $_"
    }
}

function CommitAll {
    param([string]$Message)
    try {
        git add -A 2>$null
        $staged = git diff --cached --name-only 2>$null
        if ($staged) {
            git commit -m $Message 2>$null
            $count = (git rev-list --count HEAD) + 1
            Write-Host "  [$count] $Message"
        }
    } catch {
        Write-Host "  ERROR: $Message - $_"
    }
}

# ============================================================
# PHASE A: Remaining cleanup (fonts, icons, Tauri, Go, Node)
# ============================================================
Write-Host "`n=== Phase A: Remaining Cleanup ===`n"

Commit "chore: remove public font assets" @("public/LibertinusMath-Regular.ttf", "public/NotoSans-VariableFont_wdth_wght.ttf", "public/OFL-LibertinusMath.txt", "public/OFL-Noto_Sans.txt", "public/OFL-Open_Dyslexic.txt", "public/OpenDyslexic-Regular.woff2")
Commit "chore: remove public icon assets" @("public/apple-touch-icon.png", "public/favicon.png")
Commit "chore: remove Tauri Cargo config and build script" @("src-tauri/Cargo.toml", "src-tauri/build.rs", "src-tauri/.gitignore")
Commit "chore: remove Tauri configuration" @("src-tauri/tauri.conf.json")
Commit "chore: remove Tauri Rust source code" @("src-tauri/src/lib.rs", "src-tauri/src/main.rs")
Commit "chore: remove Tauri desktop icon files" @("src-tauri/icons/128x128.png", "src-tauri/icons/128x128@2x.png", "src-tauri/icons/32x32.png", "src-tauri/icons/64x64.png", "src-tauri/icons/Square107x107Logo.png", "src-tauri/icons/Square142x142Logo.png", "src-tauri/icons/Square150x150Logo.png", "src-tauri/icons/Square284x284Logo.png", "src-tauri/icons/Square30x30Logo.png", "src-tauri/icons/Square310x310Logo.png", "src-tauri/icons/Square44x44Logo.png", "src-tauri/icons/Square71x71Logo.png", "src-tauri/icons/Square89x89Logo.png", "src-tauri/icons/StoreLogo.png", "src-tauri/icons/icon.icns", "src-tauri/icons/icon.ico", "src-tauri/icons/icon.png")
Commit "chore: remove Tauri Android and iOS icons" @("src-tauri/icons/android/", "src-tauri/icons/ios/")
Commit "chore: remove Tauri capabilities" @("src-tauri/capabilities/default.json")
Commit "chore: remove Go Fiber backend" @("main.go", "go.mod", "go.sum")
Commit "chore: remove Node.js package.json" @("package.json")
Commit "chore: remove Vite build config" @("vite.config.ts")
Commit "chore: remove TypeScript configs" @("tsconfig.json", "tsconfig.node.json")
Commit "chore: remove stale CONTRIBUTING.md" @("CONTRIBUTING.md")
Commit "chore: update .gitignore for .NET project" @(".gitignore")

# Scaffolding
Commit "feat: create .NET solution with Core class library" @("PhysicsQuestionGenerator.sln", "Core/Core.csproj")
Commit "feat: add AvaloniaUI desktop project" @("AvaloniaUI/AvaloniaUI.csproj")
Commit "feat: add Console application project" @("Console/Console.csproj")
Commit "feat: add xUnit test project" @("Tests/Tests.csproj")
Commit "feat: add LaTeX rendering project" @("LaTeX/LaTeX.csproj")
Commit "feat: add Blazor WebAssembly project" @("Web/Web.csproj")

# ============================================================
# PHASE B: Core Domain & Specification Loader
# ============================================================
Write-Host "`n=== Phase B: Domain Models ===`n"

Commit "feat: add Unit immutable record" @("Core/Domain/Unit.cs")
Commit "feat: add Topic immutable record" @("Core/Domain/Topic.cs")
Commit "feat: add Skill immutable record" @("Core/Domain/Skill.cs")
Commit "feat: add VariableDefinition record" @("Core/Domain/VariableDefinition.cs")
Commit "feat: add QuestionTemplate record" @("Core/Domain/QuestionTemplate.cs")
Commit "feat: add GeneratedQuestion record" @("Core/Domain/GeneratedQuestion.cs")
Commit "feat: add Specification aggregate root" @("Core/Domain/Specification.cs")

Commit "feat: add ISpecificationLoader interface" @("Core/Interfaces/ISpecificationLoader.cs")
Commit "feat: add ITemplateRepository interface" @("Core/Interfaces/ITemplateRepository.cs")
Commit "feat: add IRandomValueGenerator interface" @("Core/Interfaces/IRandomValueGenerator.cs")
Commit "feat: add IExpressionEvaluator interface" @("Core/Interfaces/IExpressionEvaluator.cs")
Commit "feat: add IDistractorGenerator interface" @("Core/Interfaces/IDistractorGenerator.cs")
Commit "feat: add ISolutionBuilder interface" @("Core/Interfaces/ISolutionBuilder.cs")
Commit "feat: add IQuestionExporter interface" @("Core/Interfaces/IQuestionExporter.cs")
Commit "feat: add ILaTeXRenderer interface" @("Core/Interfaces/ILaTeXRenderer.cs")

Commit "feat: add ParseError model" @("Core/Parsing/ParseError.cs")
Commit "feat: add ParseException custom exception" @("Core/Parsing/ParseException.cs")
Commit "feat: implement PartOneTextLoader - parse UNIT sections" @("Core/Parsing/PartOneTextLoader.cs")
Commit "refactor: improve PartOneTextLoader cross-reference validation" @("Core/Parsing/PartOneTextLoader.cs")
Commit "fix: add line number reporting to parse errors" @("Core/Parsing/PartOneTextLoader.cs")

Commit "test: add sample part_one.txt test fixture" @("Tests/SampleData/part_one.txt")
Commit "test: add PartOneTextLoader successful parse tests" @("Tests/PartOneTextLoaderTests.cs")
Commit "test: add PartOneTextLoader invalid cross-reference tests" @("Tests/PartOneTextLoaderTests.cs")
Commit "test: add PartOneTextLoader malformed section tests" @("Tests/PartOneTextLoaderTests.cs")

# ============================================================
# PHASE C: Random & Expression Evaluation
# ============================================================
Write-Host "`n=== Phase C: Random & Expression ===`n"

Commit "feat: implement UniformRandomGenerator integer range" @("Core/Services/UniformRandomGenerator.cs")
Commit "feat: add double range with configurable step" @("Core/Services/UniformRandomGenerator.cs")
Commit "feat: add enumerated type selection to UniformRandomGenerator" @("Core/Services/UniformRandomGenerator.cs")
Commit "test: add UniformRandomGenerator integer tests" @("Tests/UniformRandomGeneratorTests.cs")
Commit "test: add UniformRandomGenerator double and enum tests" @("Tests/UniformRandomGeneratorTests.cs")

Commit "feat: implement SeededRandomGenerator for reproducibility" @("Core/Services/SeededRandomGenerator.cs")
Commit "test: add SeededRandomGenerator reproducibility tests" @("Tests/SeededRandomGeneratorTests.cs")

Commit "feat: add NCalcSync NuGet package" @("Core/Core.csproj")
Commit "feat: implement NCalcEvaluator with basic arithmetic" @("Core/Services/NCalcEvaluator.cs")
Commit "feat: add sin/cos/tan with degree-to-radian conversion" @("Core/Services/NCalcEvaluator.cs")
Commit "feat: add sqrt, pow, pi, e to NCalcEvaluator" @("Core/Services/NCalcEvaluator.cs")
Commit "feat: add expression caching to NCalcEvaluator" @("Core/Services/NCalcEvaluator.cs")
Commit "feat: add function whitelist for safe evaluation" @("Core/Services/NCalcEvaluator.cs")
Commit "fix: correct NCalcSync API - use FunctionArgs instead of FunctionEventArgs" @("Core/Services/NCalcEvaluator.cs")
Commit "fix: use EvaluateParameters() for safe parameter access" @("Core/Services/NCalcEvaluator.cs")

Commit "test: add NCalcEvaluator arithmetic tests" @("Tests/NCalcEvaluatorTests.cs")
Commit "test: add NCalcEvaluator trigonometry tests" @("Tests/NCalcEvaluatorTests.cs")
Commit "test: add NCalcEvaluator math function tests" @("Tests/NCalcEvaluatorTests.cs")
Commit "test: add NCalcEvaluator variable tests" @("Tests/NCalcEvaluatorTests.cs")
Commit "test: add NCalcEvaluator edge case tests" @("Tests/NCalcEvaluatorTests.cs")
Commit "test: add NCalcEvaluator security tests" @("Tests/NCalcEvaluatorTests.cs")
Commit "test: add NCalcEvaluator caching tests" @("Tests/NCalcEvaluatorTests.cs")
Commit "test: add additional expression tests to reach 50+ cases" @("Tests/NCalcEvaluatorTests.cs")
Commit "test: add comparison expression tests" @("Tests/NCalcEvaluatorTests.cs")
Commit "fix: update tests for NCalcSync division-by-zero behavior" @("Tests/NCalcEvaluatorTests.cs")
Commit "fix: update security tests for NCalcSync exception types" @("Tests/NCalcEvaluatorTests.cs")

# ============================================================
# PHASE D: Question Generation Engine
# ============================================================
Write-Host "`n=== Phase D: Question Generation ===`n"

Commit "feat: implement InMemoryTemplateRepository with GetAll" @("Core/Services/InMemoryTemplateRepository.cs")
Commit "feat: add topic and skill filtering to repository" @("Core/Services/InMemoryTemplateRepository.cs")
Commit "feat: add difficulty filtering to repository" @("Core/Services/InMemoryTemplateRepository.cs")
Commit "feat: add random template selection to repository" @("Core/Services/InMemoryTemplateRepository.cs")
Commit "test: add InMemoryTemplateRepository unit tests" @("Tests/InMemoryTemplateRepositoryTests.cs")

Commit "feat: implement CommonMistakeDistractorGenerator - sin/cos swap" @("Core/Services/CommonMistakeDistractorGenerator.cs")
Commit "feat: add wrong sign and factor mistakes to distractor generator" @("Core/Services/CommonMistakeDistractorGenerator.cs")
Commit "test: add CommonMistakeDistractorGenerator tests" @("Tests/CommonMistakeDistractorGeneratorTests.cs")

Commit "feat: implement RandomOffsetDistractorGenerator" @("Core/Services/RandomOffsetDistractorGenerator.cs")
Commit "fix: handle zero-answer edge case in RandomOffsetDistractorGenerator" @("Core/Services/RandomOffsetDistractorGenerator.cs")
Commit "test: add RandomOffsetDistractorGenerator tests" @("Tests/RandomOffsetDistractorGeneratorTests.cs")

Commit "feat: implement PlainTextSolutionBuilder" @("Core/Services/PlainTextSolutionBuilder.cs")
Commit "feat: add variable substitution to PlainTextSolutionBuilder" @("Core/Services/PlainTextSolutionBuilder.cs")
Commit "test: add PlainTextSolutionBuilder tests" @("Tests/PlainTextSolutionBuilderTests.cs")

Commit "feat: implement LaTeXSolutionBuilder with math formatting" @("Core/Services/LaTeXSolutionBuilder.cs")
Commit "test: add LaTeXSolutionBuilder tests" @("Tests/LaTeXSolutionBuilderTests.cs")

Commit "feat: implement QuestionGenerator orchestrator" @("Core/Services/QuestionGenerator.cs")
Commit "feat: add variable generation from definitions" @("Core/Services/QuestionGenerator.cs")
Commit "feat: add text template substitution to QuestionGenerator" @("Core/Services/QuestionGenerator.cs")
Commit "feat: add MC choice generation and shuffling" @("Core/Services/QuestionGenerator.cs")
Commit "feat: add GenerateBatch method for multiple questions" @("Core/Services/QuestionGenerator.cs")
Commit "test: add QuestionGenerator end-to-end tests" @("Tests/QuestionGeneratorTests.cs")

# ============================================================
# PHASE E: LaTeX Rendering
# ============================================================
Write-Host "`n=== Phase E: LaTeX Rendering ===`n"

Commit "feat: add Core project reference to LaTeX" @("LaTeX/LaTeX.csproj")
Commit "feat: implement MathJaxRenderer HTTP client" @("LaTeX/Services/MathJaxRenderer.cs")
Commit "feat: add SVG rendering support to MathJaxRenderer" @("LaTeX/Services/MathJaxRenderer.cs")
Commit "fix: add error handling for MathJaxRenderer HTTP failures" @("LaTeX/Services/MathJaxRenderer.cs")

Commit "feat: implement LocalLaTeXRenderer with pdflatex" @("LaTeX/Services/LocalLaTeXRenderer.cs")
Commit "feat: add SVG conversion via pdf2svg" @("LaTeX/Services/LocalLaTeXRenderer.cs")
Commit "fix: add temp file cleanup in LocalLaTeXRenderer" @("LaTeX/Services/LocalLaTeXRenderer.cs")

Commit "feat: implement DummyRenderer for testing" @("LaTeX/Services/DummyRenderer.cs")

Commit "feat: implement CachedLaTeXRenderer with LRU eviction" @("LaTeX/Services/CachedLaTeXRenderer.cs")
Commit "feat: add thread-safe cache access to CachedLaTeXRenderer" @("LaTeX/Services/CachedLaTeXRenderer.cs")
Commit "feat: add SHA256 hashing for cache keys" @("LaTeX/Services/CachedLaTeXRenderer.cs")

Commit "test: add DummyRenderer unit tests" @("Tests/LaTeXRendererTests.cs")
Commit "test: add CachedLaTeXRenderer cache verification tests" @("Tests/LaTeXRendererTests.cs")
Commit "test: add cache eviction tests" @("Tests/LaTeXRendererTests.cs")
Commit "test: add MathJaxRenderer skip-when-no-service tests" @("Tests/LaTeXRendererTests.cs")
Commit "test: add LocalLaTeXRenderer skip-when-no-executable tests" @("Tests/LaTeXRendererTests.cs")

# ============================================================
# PHASE F: Exporters
# ============================================================
Write-Host "`n=== Phase F: Exporters ===`n"

Commit "feat: implement TextExporter with numbered questions" @("Core/Exporters/TextExporter.cs")
Commit "feat: add solution and choices to TextExporter output" @("Core/Exporters/TextExporter.cs")

Commit "feat: add QuestPDF NuGet package" @("Core/Core.csproj")
Commit "feat: implement PdfExporter with QuestPDF" @("Core/Exporters/PdfExporter.cs")
Commit "feat: add styled question layout to PdfExporter" @("Core/Exporters/PdfExporter.cs")
Commit "fix: set QuestPDF community license in PdfExporter" @("Core/Exporters/PdfExporter.cs")

Commit "feat: implement HtmlExporter with MathJax CDN" @("Core/Exporters/HtmlExporter.cs")
Commit "feat: add CSS styling to HtmlExporter" @("Core/Exporters/HtmlExporter.cs")
Commit "feat: add LaTeX inline math rendering to HtmlExporter" @("Core/Exporters/HtmlExporter.cs")

Commit "feat: implement MarkdownExporter with LaTeX math" @("Core/Exporters/MarkdownExporter.cs")
Commit "feat: add lettered choices to MarkdownExporter" @("Core/Exporters/MarkdownExporter.cs")

Commit "test: add TextExporter unit tests" @("Tests/ExporterTests.cs")
Commit "test: add PdfExporter unit tests" @("Tests/ExporterTests.cs")
Commit "test: add HtmlExporter unit tests" @("Tests/ExporterTests.cs")
Commit "test: add MarkdownExporter unit tests" @("Tests/ExporterTests.cs")

# ============================================================
# PHASE G: Avalonia UI
# ============================================================
Write-Host "`n=== Phase G: Avalonia UI ===`n"

Commit "feat: add Avalonia NuGet packages" @("AvaloniaUI/AvaloniaUI.csproj")
Commit "feat: add Core and LaTeX project references" @("AvaloniaUI/AvaloniaUI.csproj")
Commit "feat: add application manifest" @("AvaloniaUI/app.manifest")
Commit "feat: create App.axaml with Fluent theme" @("AvaloniaUI/App.axaml")
Commit "feat: implement App.axaml.cs with desktop lifetime" @("AvaloniaUI/App.axaml.cs")
Commit "feat: add Program.cs entry point with ReactiveUI" @("AvaloniaUI/Program.cs")
Commit "feat: create basic MainWindow" @("AvaloniaUI/MainWindow.axaml", "AvaloniaUI/MainWindow.axaml.cs")

Commit "feat: add MainWindowViewModel with reactive properties" @("AvaloniaUI/ViewModels/MainWindowViewModel.cs")
Commit "feat: add filter properties to ViewModel" @("AvaloniaUI/ViewModels/MainWindowViewModel.cs")
Commit "feat: add question display properties to ViewModel" @("AvaloniaUI/ViewModels/MainWindowViewModel.cs")
Commit "feat: implement GenerateCommand" @("AvaloniaUI/ViewModels/MainWindowViewModel.cs")
Commit "feat: implement ToggleSolutionCommand" @("AvaloniaUI/ViewModels/MainWindowViewModel.cs")
Commit "feat: implement CopyToClipboardCommand" @("AvaloniaUI/ViewModels/MainWindowViewModel.cs")
Commit "feat: implement ExportCommand" @("AvaloniaUI/ViewModels/MainWindowViewModel.cs")
Commit "feat: implement ClearHistoryCommand" @("AvaloniaUI/ViewModels/MainWindowViewModel.cs")
Commit "feat: add history tracking (last 20 questions)" @("AvaloniaUI/ViewModels/MainWindowViewModel.cs")
Commit "feat: add error handling and status messages" @("AvaloniaUI/ViewModels/MainWindowViewModel.cs")

Commit "feat: implement three-column MainWindow layout" @("AvaloniaUI/MainWindow.axaml")
Commit "feat: add filter panel with topic/skill/difficulty/type" @("AvaloniaUI/MainWindow.axaml")
Commit "feat: add question display area with choices" @("AvaloniaUI/MainWindow.axaml")
Commit "feat: add solution expander section" @("AvaloniaUI/MainWindow.axaml")
Commit "feat: add history sidebar" @("AvaloniaUI/MainWindow.axaml")
Commit "feat: add status bar with copy and export buttons" @("AvaloniaUI/MainWindow.axaml")
Commit "feat: add keyboard shortcuts Ctrl+N and Ctrl+E" @("AvaloniaUI/MainWindow.axaml")
Commit "feat: add code-behind with ClearFilters handler" @("AvaloniaUI/MainWindow.axaml.cs")
Commit "fix: update MainWindow constructor to accept ViewModel" @("AvaloniaUI/MainWindow.axaml.cs")

Commit "feat: wire up DI in App.axaml.cs" @("AvaloniaUI/App.axaml.cs")
Commit "fix: add missing using directives in App.axaml.cs" @("AvaloniaUI/App.axaml.cs")

# ============================================================
# PHASE H: Web Compilation
# ============================================================
Write-Host "`n=== Phase H: Web ===`n"

Commit "feat: add Blazor WebAssembly packages" @("Web/Web.csproj")
Commit "feat: add Core and LaTeX project references" @("Web/Web.csproj")
Commit "feat: implement Program.cs with DI registration" @("Web/Program.cs")
Commit "feat: add App.razor router component" @("Web/App.razor")
Commit "feat: add MainLayout component" @("Web/MainLayout.razor")
Commit "feat: add Razor imports" @("Web/_Imports.razor")
Commit "feat: implement Home.razor with question generation UI" @("Web/Pages/Home.razor")
Commit "feat: add difficulty and type filters to Home page" @("Web/Pages/Home.razor")
Commit "feat: add solution toggle to Home page" @("Web/Pages/Home.razor")
Commit "feat: add index.html with MathJax CDN" @("Web/wwwroot/index.html")
Commit "feat: add application CSS styles" @("Web/wwwroot/css/app.css")
Commit "fix: add Core namespace imports to _Imports.razor" @("Web/_Imports.razor")
Commit "fix: correct DI registration in Web Program.cs" @("Web/Program.cs")

# ============================================================
# PHASE I: Polish & Documentation
# ============================================================
Write-Host "`n=== Phase I: Polish ===`n"

Commit "feat: add Help window with user manual" @("AvaloniaUI/Views/HelpWindow.axaml", "AvaloniaUI/Views/HelpWindow.axaml.cs")
Commit "feat: add About dialog with version info" @("AvaloniaUI/Views/AboutDialog.axaml", "AvaloniaUI/Views/AboutDialog.axaml.cs")
Commit "feat: add F1 keyboard shortcut for Help" @("AvaloniaUI/MainWindow.axaml.cs")
Commit "feat: add Help and About menu handlers" @("AvaloniaUI/MainWindow.axaml.cs")

Commit "ci: add GitHub Actions CI workflow" @(".github/workflows/ci.yml")
Commit "ci: add three-OS build matrix" @(".github/workflows/ci.yml")
Commit "ci: add test result upload" @(".github/workflows/ci.yml")

# Console project
Commit "feat: add Console project entry point" @("Console/Program.cs")

# Final cleanup
Commit "chore: remove temporary test output files" @("test_output.txt", "ncalc_base.txt")
Commit "chore: remove default UnitTest1.cs" @("Tests/UnitTest1.cs")

# Catch-all for any remaining files
CommitAll "chore: clean up build artifacts and temporary files"

Write-Host "`n=== COMMIT SCRIPT COMPLETE ===`n"
