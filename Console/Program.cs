using Core.Domain;
using Core.Exporters;
using Core.Interfaces;
using Core.Parsing;
using Core.Services;
using LaTeX.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Console;

class Program
{
    private static ServiceProvider _serviceProvider = null!;
    private static CancellationTokenSource _cts = null!;
    private static List<GeneratedQuestion> _sessionQuestions = new();

    static async Task Main(string[] args)
    {
        _cts = new CancellationTokenSource();
        System.Console.CancelKeyPress += (_, e) =>
        {
            e.Cancel = true;
            _cts.Cancel();
            System.Console.WriteLine("\nShutting down...");
        };

        try
        {
            var specPath = GetSpecPath(args);
            ConfigureServices(specPath);

            System.Console.WriteLine("=== Physics Question Generator ===");
            System.Console.WriteLine();

            await RunInteractiveLoop();
        }
        catch (OperationCanceledException)
        {
            System.Console.WriteLine("Operation cancelled.");
        }
        catch (Exception ex)
        {
            System.Console.WriteLine($"Fatal error: {ex.Message}");
        }
        finally
        {
            _serviceProvider?.Dispose();
        }
    }

    private static string GetSpecPath(string[] args)
    {
        for (int i = 0; i < args.Length - 1; i++)
        {
            if (args[i] == "--spec" || args[i] == "-s")
                return args[i + 1];
        }
        return Path.Combine("Data", "part_one.txt");
    }

    private static void ConfigureServices(string specPath)
    {
        var services = new ServiceCollection();

        services.AddLogging(builder =>
        {
            builder.AddConsole();
            builder.SetMinimumLevel(LogLevel.Warning);
        });

        services.AddSingleton<IRandomValueGenerator, UniformRandomGenerator>();
        services.AddSingleton<IExpressionEvaluator, NCalcEvaluator>();
        services.AddSingleton<ITemplateRepository>(_ => new InMemoryTemplateRepository(new List<QuestionTemplate>()));
        services.AddSingleton<IDistractorGenerator, CommonMistakeDistractorGenerator>();
        services.AddSingleton<ILaTeXRenderer, DummyRenderer>();
        services.AddSingleton<ISpecificationLoader, PartOneTextLoader>();
        services.AddSingleton<ISolutionBuilder, PlainTextSolutionBuilder>();
        services.AddSingleton<QuestionGenerator>();

        services.AddSingleton<TextExporter>();
        services.AddSingleton<MarkdownExporter>();
        services.AddSingleton<HtmlExporter>();

        _serviceProvider = services.BuildServiceProvider();

        LoadSpecification(specPath);
    }

    private static void LoadSpecification(string specPath)
    {
        try
        {
            if (!File.Exists(specPath))
            {
                System.Console.WriteLine($"Warning: Specification file not found at '{specPath}'.");
                System.Console.WriteLine("You can specify a different path with --spec <path>.");
                System.Console.WriteLine("The application will run but no templates are available.");
                System.Console.WriteLine();
                return;
            }

            var loader = _serviceProvider.GetRequiredService<ISpecificationLoader>();
            var repository = (InMemoryTemplateRepository)_serviceProvider.GetRequiredService<ITemplateRepository>();

            var spec = loader.Load(specPath);
            repository.AddRange(spec.Templates);

            System.Console.WriteLine($"Loaded {spec.Templates.Count} templates from '{specPath}'.");
            System.Console.WriteLine($"  Topics: {spec.Topics.Count}, Skills: {spec.Skills.Count}, Units: {spec.Units.Count}");
            System.Console.WriteLine();
        }
        catch (ParseException ex)
        {
            System.Console.WriteLine($"Error parsing specification file: {ex.Message}");
            System.Console.WriteLine("The application will run but no templates are available.");
            System.Console.WriteLine();
        }
        catch (Exception ex)
        {
            System.Console.WriteLine($"Error loading specification: {ex.Message}");
            System.Console.WriteLine("The application will run but no templates are available.");
            System.Console.WriteLine();
        }
    }

    private static async Task RunInteractiveLoop()
    {
        while (!_cts.IsCancellationRequested)
        {
            System.Console.WriteLine("[G] Generate question  [B] Batch generate  [E] Export  [Q] Quit");
            System.Console.Write("> ");
            var input = await ReadLineAsync();

            if (input is null) break;

            switch (input.ToUpperInvariant())
            {
                case "G":
                    await HandleGenerate();
                    break;
                case "B":
                    await HandleBatchGenerate();
                    break;
                case "E":
                    await HandleExport();
                    break;
                case "Q":
                    System.Console.WriteLine("Goodbye!");
                    return;
                default:
                    System.Console.WriteLine("Unknown command. Please enter G, B, E, or Q.");
                    break;
            }

            System.Console.WriteLine();
        }
    }

    private static async Task HandleGenerate()
    {
        var (topicId, skillId, minDifficulty, maxDifficulty, questionType) = PromptFilters();

        try
        {
            var generator = _serviceProvider.GetRequiredService<QuestionGenerator>();
            var question = generator.Generate(topicId, skillId, minDifficulty, maxDifficulty, questionType);

            if (question is null)
            {
                System.Console.WriteLine("No matching template found. Try different filters.");
                return;
            }

            _sessionQuestions.Add(question);
            DisplayQuestion(question);
        }
        catch (Exception ex)
        {
            System.Console.WriteLine($"Error generating question: {ex.Message}");
        }
    }

    private static async Task HandleBatchGenerate()
    {
        System.Console.Write("How many questions? ");
        var countInput = await ReadLineAsync();
        if (!int.TryParse(countInput, out int count) || count <= 0)
        {
            System.Console.WriteLine("Invalid count. Please enter a positive number.");
            return;
        }

        if (count > 100)
        {
            System.Console.WriteLine("Maximum batch size is 100. Using 100.");
            count = 100;
        }

        var (topicId, skillId, minDifficulty, maxDifficulty, questionType) = PromptFilters();

        try
        {
            var generator = _serviceProvider.GetRequiredService<QuestionGenerator>();
            var questions = generator.GenerateBatch(count, topicId, skillId, minDifficulty, maxDifficulty, questionType);

            if (questions.Count == 0)
            {
                System.Console.WriteLine("No questions generated. Try different filters.");
                return;
            }

            _sessionQuestions.AddRange(questions);

            System.Console.WriteLine($"\nGenerated {questions.Count}/{count} questions:\n");
            for (int i = 0; i < questions.Count; i++)
            {
                DisplayQuestion(questions[i], i + 1);
            }
        }
        catch (Exception ex)
        {
            System.Console.WriteLine($"Error generating questions: {ex.Message}");
        }
    }

    private static async Task HandleExport()
    {
        if (_sessionQuestions.Count == 0)
        {
            System.Console.WriteLine("No questions to export. Generate some questions first.");
            return;
        }

        System.Console.WriteLine("Export format: [T]ext  [M]arkdown  [H]tml");
        System.Console.Write("> ");
        var formatInput = await ReadLineAsync();

        IQuestionExporter exporter = formatInput?.ToUpperInvariant() switch
        {
            "T" => _serviceProvider.GetRequiredService<TextExporter>(),
            "M" => _serviceProvider.GetRequiredService<MarkdownExporter>(),
            "H" => _serviceProvider.GetRequiredService<HtmlExporter>(),
            _ => null!
        };

        if (exporter is null)
        {
            System.Console.WriteLine("Invalid format. Please enter T, M, or H.");
            return;
        }

        var extension = formatInput!.ToUpperInvariant() switch
        {
            "T" => ".txt",
            "M" => ".md",
            "H" => ".html",
            _ => ".txt"
        };

        var fileName = $"questions_{DateTime.Now:yyyyMMdd_HHmmss}{extension}";
        System.Console.Write($"Output file (default: {fileName}): ");
        var fileInput = await ReadLineAsync();
        var outputPath = string.IsNullOrWhiteSpace(fileInput) ? fileName : fileInput;

        try
        {
            await using var stream = File.Create(outputPath);
            exporter.Export(_sessionQuestions, stream);
            System.Console.WriteLine($"Exported {_sessionQuestions.Count} questions to '{outputPath}'.");
        }
        catch (Exception ex)
        {
            System.Console.WriteLine($"Error exporting: {ex.Message}");
        }
    }

    private static (string? topicId, string? skillId, int? minDifficulty, int? maxDifficulty, string? questionType) PromptFilters()
    {
        System.Console.WriteLine("Filters (press Enter to skip):");

        System.Console.Write("  Topic ID: ");
        var topicId = ReadLineAsync().GetAwaiter().GetResult();
        topicId = string.IsNullOrWhiteSpace(topicId) ? null : topicId.Trim();

        System.Console.Write("  Skill ID: ");
        var skillId = ReadLineAsync().GetAwaiter().GetResult();
        skillId = string.IsNullOrWhiteSpace(skillId) ? null : skillId.Trim();

        System.Console.Write("  Min difficulty (1-5): ");
        var minInput = ReadLineAsync().GetAwaiter().GetResult();
        int? minDifficulty = int.TryParse(minInput, out var min) ? min : null;

        System.Console.Write("  Max difficulty (1-5): ");
        var maxInput = ReadLineAsync().GetAwaiter().GetResult();
        int? maxDifficulty = int.TryParse(maxInput, out var max) ? max : null;

        System.Console.Write("  Question type (MC/SA): ");
        var typeInput = ReadLineAsync().GetAwaiter().GetResult();
        string? questionType = string.IsNullOrWhiteSpace(typeInput) ? null : typeInput.Trim().ToUpperInvariant();

        return (topicId, skillId, minDifficulty, maxDifficulty, questionType);
    }

    private static void DisplayQuestion(GeneratedQuestion question, int? index = null)
    {
        var prefix = index.HasValue ? $"Q{index.Value}" : "Q";
        System.Console.WriteLine($"--- {prefix} [{question.QuestionType}] Difficulty {question.Difficulty} ---");
        System.Console.WriteLine($"  {question.Text}");
        System.Console.WriteLine($"  Answer: {question.Answer}");

        if (question.Choices is { Count: > 0 })
        {
            var label = 'A';
            foreach (var choice in question.Choices)
            {
                System.Console.WriteLine($"    {label}) {choice}");
                label++;
            }
        }

        System.Console.WriteLine($"  Solution: {question.SolutionText}");
        System.Console.WriteLine();
    }

    private static async Task<string?> ReadLineAsync()
    {
        if (_cts.IsCancellationRequested)
            return null;

        try
        {
            var readTask = Task.Run(() => System.Console.ReadLine(), _cts.Token);
            return await readTask;
        }
        catch (OperationCanceledException)
        {
            return null;
        }
    }
}
