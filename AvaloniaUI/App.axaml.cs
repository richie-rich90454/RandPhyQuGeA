using System;
using System.Collections.Generic;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using Avalonia.Styling;
using AvaloniaUI.ViewModels;
using Core.Domain;
using Core.Interfaces;
using Core.Parsing;
using Core.Services;
using LaTeX.Services;

namespace AvaloniaUI;

public partial class App : Application
{
    private ResourceDictionary? _lightThemeResources;
    private ResourceDictionary? _darkThemeResources;

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
            var viewModel = CreateViewModel();
            desktop.MainWindow = new MainWindow(viewModel);
        }

        base.OnFrameworkInitializationCompleted();
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

        var themeResources = IsDarkTheme(actualTheme) ? _darkThemeResources : _lightThemeResources;

        if (themeResources is not null)
        {
            foreach (var key in themeResources.Keys)
            {
                resources[key] = themeResources[key];
            }
        }
    }

    private static bool IsDarkTheme(ThemeVariant variant)
    {
        return variant == ThemeVariant.Dark;
    }

    private static MainWindowViewModel CreateViewModel()
    {
        var random = new SeededRandomGenerator(42);
        var evaluator = new NCalcEvaluator();
        var loader = new PartOneTextLoader();
        var repository = new InMemoryTemplateRepository(new List<QuestionTemplate>());
        var distractorGenerator = new CommonMistakeDistractorGenerator(evaluator);
        var solutionBuilder = new PlainTextSolutionBuilder();
        var questionGenerator = new QuestionGenerator(repository, random, evaluator, distractorGenerator, solutionBuilder);
        var latexRenderer = new DummyRenderer();

        return new MainWindowViewModel(questionGenerator, latexRenderer, loader);
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
