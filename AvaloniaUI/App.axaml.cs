using System;
using System.Collections.Generic;
using System.Reactive.Linq;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using Avalonia.Styling;
using AvaloniaUI.ViewModels;
using Core.Domain;
using Core.Exporters;
using Core.Interfaces;
using Core.Parsing;
using Core.Services;
using LaTeX.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AvaloniaUI;

public partial class App : Application
{
    private ResourceDictionary? _lightThemeResources;
    private ResourceDictionary? _darkThemeResources;
    private ServiceProvider? _serviceProvider;

    public static AppTheme CurrentTheme { get; private set; } = AppTheme.System;

    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
        LoadThemeResources();
        ApplyTheme(CurrentTheme);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            _serviceProvider = ConfigureServices();

            var (viewModel, specViewModel, repository) = CreateViewModel();

            // Set the window first so Avalonia has a main window
            desktop.MainWindow = new MainWindow(viewModel);

            // Then load spec asynchronously �?the window will show a loading state
            _ = InitializeSpecAsync(specViewModel, repository, viewModel);
        }

        base.OnFrameworkInitializationCompleted();
    }

    private static ServiceProvider ConfigureServices()
    {
        var services = new ServiceCollection();

        // Logging
        services.AddLogging(builder =>
        {
            builder.AddDebug();
            builder.SetMinimumLevel(LogLevel.Debug);
        });

        // Random seed: fixed in DEBUG for reproducibility, random in RELEASE
#if DEBUG
        var seed = 42;
#else
        var seed = Environment.TickCount;
#endif
        services.AddSingleton<IRandomValueGenerator>(_ => new SeededRandomGenerator(seed));

        services.AddSingleton<IExpressionEvaluator, NCalcEvaluator>();
        services.AddSingleton<ITemplateRepository>(_ => new InMemoryTemplateRepository(new List<QuestionTemplate>()));
        services.AddSingleton<IDistractorGenerator, CommonMistakeDistractorGenerator>();
        services.AddSingleton<ILaTeXRenderer, DummyRenderer>();
        services.AddSingleton<IPracticeResultRepository, JsonPracticeResultRepository>();
        services.AddSingleton<ISpecificationLoader, PartOneTextLoader>();

        // Solution builders
        services.AddSingleton<PlainTextSolutionBuilder>();
        services.AddSingleton<LaTeXSolutionBuilder>();

        // Question generator (depends on ISolutionBuilder �?register as the primary builder)
        services.AddSingleton<ISolutionBuilder, PlainTextSolutionBuilder>();
        services.AddSingleton<QuestionGenerator>();

        // Exporters
        services.AddSingleton<IQuestionExporter, TextExporter>();
        services.AddSingleton<IQuestionExporter, MarkdownExporter>();
        services.AddSingleton<IQuestionExporter, HtmlExporter>();
        services.AddSingleton<IQuestionExporter, PdfExporter>();

        return services.BuildServiceProvider();
    }

    private async Task InitializeSpecAsync(SpecificationViewModel specViewModel, InMemoryTemplateRepository repository, MainWindowViewModel mainWindowViewModel)
    {
        try
        {
            await specViewModel.EnsureLoadedAsync();
            repository.AddRange(specViewModel.GetLoadedTemplates());
        }
        catch (Exception ex)
        {
            var logger = _serviceProvider?.GetService<ILogger<App>>();
            logger?.LogError(ex, "Failed to load specification");
            mainWindowViewModel.HasLoadError = true;
            mainWindowViewModel.LoadErrorMessage = $"Failed to load specification: {ex.Message}";
        }
    }

    /// <summary>
    /// Switches the application theme between Light, Dark, and System.
    /// </summary>
    public static void SwitchTheme(AppTheme theme)
    {
        CurrentTheme = theme;
        if (Application.Current is App app)
        {
            app.ApplyTheme(theme);
        }
    }

    private void LoadThemeResources()
    {
        _lightThemeResources = (ResourceDictionary)AvaloniaXamlLoader.Load(
            new Uri("avares://AvaloniaUI/Styles/LightTheme.axaml"));
        _darkThemeResources = (ResourceDictionary)AvaloniaXamlLoader.Load(
            new Uri("avares://AvaloniaUI/Styles/DarkTheme.axaml"));
    }

    private void ApplyTheme(AppTheme theme)
    {
        var actualTheme = theme switch
        {
            AppTheme.Light => ThemeVariant.Light,
            AppTheme.Dark => ThemeVariant.Dark,
            _ => ThemeVariant.Default
        };

        RequestedThemeVariant = actualTheme;

        // Swap semantic brush resources based on theme
        var resources = Current?.Resources;
        if (resources is null) return;

        // Determine if we should use dark resources
        // For System theme, check the actual OS theme
        bool useDark = theme == AppTheme.Dark ||
            (theme == AppTheme.System && ActualThemeVariant == ThemeVariant.Dark);

        var themeResources = useDark ? _darkThemeResources : _lightThemeResources;

        if (themeResources is not null)
        {
            foreach (var key in themeResources.Keys)
            {
                resources[key] = themeResources[key];
            }
        }
    }

    private (MainWindowViewModel mainWindowViewModel, SpecificationViewModel specViewModel, InMemoryTemplateRepository repository) CreateViewModel()
    {
        var repository = (InMemoryTemplateRepository)_serviceProvider!.GetRequiredService<ITemplateRepository>();
        var questionGenerator = _serviceProvider.GetRequiredService<QuestionGenerator>();
        var latexRenderer = _serviceProvider.GetRequiredService<ILaTeXRenderer>();
        var loader = _serviceProvider.GetRequiredService<ISpecificationLoader>();
        var specViewModel = new SpecificationViewModel(loader);

        return (new MainWindowViewModel(questionGenerator, latexRenderer, loader, specViewModel), specViewModel, repository);
    }
}

/// <summary>
/// Available application themes.
/// </summary>
public enum AppTheme
{
    System,
    Light,
    Dark
}
