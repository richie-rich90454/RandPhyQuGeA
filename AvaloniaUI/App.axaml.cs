using System.Collections.Generic;
using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using AvaloniaUI.ViewModels;
using Core.Domain;
using Core.Interfaces;
using Core.Parsing;
using Core.Services;
using LaTeX.Services;

namespace AvaloniaUI;

public partial class App : Application
{
    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
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
