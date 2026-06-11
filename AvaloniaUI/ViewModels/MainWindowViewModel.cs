using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Reactive;
using System.Threading.Tasks;
using Core.Domain;
using Core.Interfaces;
using Core.Services;
using ReactiveUI;

using ReactiveUnit = System.Reactive.Unit;

namespace AvaloniaUI.ViewModels;

public class MainWindowViewModel : ViewModelBase, IActivatableViewModel
{
    private readonly QuestionGenerator? _questionGenerator;
    private readonly ILaTeXRenderer? _laTeXRenderer;
    private readonly ISpecificationLoader? _specificationLoader;
    private readonly SpecificationViewModel? _specificationViewModel;

    private string? _selectedTopicId;
    private string? _selectedSkillId;
    private decimal? _selectedDifficulty;
    private string? _selectedQuestionType;
    private string _questionText = string.Empty;
    private string _answerText = string.Empty;
    private string _solutionText = string.Empty;
    private string _solutionLaTeX = string.Empty;
    private bool _isSolutionVisible;
    private bool _isLoading;
    private string _statusMessage = "Ready — press Ctrl+N or click Generate to create a question";
    private IReadOnlyList<string> _choices = Array.Empty<string>();
    private bool _hasChoices;
    private bool _hasQuestion;
    private ObservableCollection<GeneratedQuestion> _history = new();
    private GeneratedQuestion? _currentQuestion;
    private IReadOnlyList<string> _availableTopics = Array.Empty<string>();
    private IReadOnlyList<string> _availableSkills = Array.Empty<string>();

    public MainWindowViewModel() : this(null, null, null, null) { }

    public MainWindowViewModel(
        QuestionGenerator? questionGenerator,
        ILaTeXRenderer? laTeXRenderer,
        ISpecificationLoader? specificationLoader,
        SpecificationViewModel? specificationViewModel = null)
    {
        _questionGenerator = questionGenerator;
        _laTeXRenderer = laTeXRenderer;
        _specificationLoader = specificationLoader;
        _specificationViewModel = specificationViewModel;

        Activator = new ViewModelActivator();
        Navigation = new NavigationViewModel(specificationViewModel, questionGenerator, new JsonPracticeResultRepository());

        GenerateCommand = ReactiveCommand.CreateFromTask(OnGenerate);
        ToggleSolutionCommand = ReactiveCommand.Create(OnToggleSolution);
        CopyToClipboardCommand = ReactiveCommand.CreateFromTask(OnCopyToClipboard);
        ExportCommand = ReactiveCommand.Create(OnExport);
        ClearHistoryCommand = ReactiveCommand.Create(OnClearHistory);

        LoadAvailableTopicsAndSkills();
    }

    public ViewModelActivator Activator { get; }

    public NavigationViewModel Navigation { get; }

    public string? SelectedTopicId
    {
        get => _selectedTopicId;
        set => this.RaiseAndSetIfChanged(ref _selectedTopicId, value);
    }

    public string? SelectedSkillId
    {
        get => _selectedSkillId;
        set => this.RaiseAndSetIfChanged(ref _selectedSkillId, value);
    }

    public decimal? SelectedDifficulty
    {
        get => _selectedDifficulty;
        set => this.RaiseAndSetIfChanged(ref _selectedDifficulty, value);
    }

    public string? SelectedQuestionType
    {
        get => _selectedQuestionType;
        set => this.RaiseAndSetIfChanged(ref _selectedQuestionType, value);
    }

    public string QuestionText
    {
        get => _questionText;
        set => this.RaiseAndSetIfChanged(ref _questionText, value);
    }

    public string AnswerText
    {
        get => _answerText;
        set => this.RaiseAndSetIfChanged(ref _answerText, value);
    }

    public string SolutionText
    {
        get => _solutionText;
        set => this.RaiseAndSetIfChanged(ref _solutionText, value);
    }

    public string SolutionLaTeX
    {
        get => _solutionLaTeX;
        set => this.RaiseAndSetIfChanged(ref _solutionLaTeX, value);
    }

    public bool IsSolutionVisible
    {
        get => _isSolutionVisible;
        set => this.RaiseAndSetIfChanged(ref _isSolutionVisible, value);
    }

    public bool IsLoading
    {
        get => _isLoading;
        set => this.RaiseAndSetIfChanged(ref _isLoading, value);
    }

    public string StatusMessage
    {
        get => _statusMessage;
        set => this.RaiseAndSetIfChanged(ref _statusMessage, value);
    }

    public IReadOnlyList<string> Choices
    {
        get => _choices;
        set => this.RaiseAndSetIfChanged(ref _choices, value);
    }

    public bool HasChoices
    {
        get => _hasChoices;
        set => this.RaiseAndSetIfChanged(ref _hasChoices, value);
    }

    public bool HasQuestion
    {
        get => _hasQuestion;
        set => this.RaiseAndSetIfChanged(ref _hasQuestion, value);
    }

    public string ToggleSolutionText => IsSolutionVisible ? "Hide Solution" : "Show Solution";

    public ObservableCollection<GeneratedQuestion> History
    {
        get => _history;
        set => this.RaiseAndSetIfChanged(ref _history, value);
    }

    public GeneratedQuestion? CurrentQuestion
    {
        get => _currentQuestion;
        set => this.RaiseAndSetIfChanged(ref _currentQuestion, value);
    }

    public IReadOnlyList<string> AvailableTopics
    {
        get => _availableTopics;
        set => this.RaiseAndSetIfChanged(ref _availableTopics, value);
    }

    public IReadOnlyList<string> AvailableSkills
    {
        get => _availableSkills;
        set => this.RaiseAndSetIfChanged(ref _availableSkills, value);
    }

    public ReactiveCommand<ReactiveUnit, ReactiveUnit> GenerateCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> ToggleSolutionCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> CopyToClipboardCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> ExportCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> ClearHistoryCommand { get; }

    private async Task OnGenerate()
    {
        if (_questionGenerator is null)
        {
            StatusMessage = "Question generator not configured.";
            return;
        }

        try
        {
            IsLoading = true;

            int? difficulty = SelectedDifficulty.HasValue ? (int)SelectedDifficulty.Value : null;
            var question = await Task.Run(() =>
                _questionGenerator.Generate(SelectedTopicId, SelectedSkillId, difficulty, SelectedQuestionType));

            if (question is null)
            {
                StatusMessage = "No matching template found. Try different filters.";
                QuestionText = string.Empty;
                AnswerText = string.Empty;
                SolutionText = string.Empty;
                SolutionLaTeX = string.Empty;
                Choices = Array.Empty<string>();
                HasChoices = false;
                HasQuestion = false;
                CurrentQuestion = null;
            }
            else
            {
                QuestionText = question.Text;
                AnswerText = question.Answer;
                SolutionText = question.SolutionText;
                SolutionLaTeX = question.SolutionLaTeX;
                Choices = question.Choices ?? Array.Empty<string>();
                HasChoices = question.Choices is { Count: > 0 };
                HasQuestion = true;
                CurrentQuestion = question;

                History.Insert(0, question);
                while (History.Count > 20)
                    History.RemoveAt(History.Count - 1);

                StatusMessage = "Question generated successfully.";
            }

            IsSolutionVisible = false;
            this.RaisePropertyChanged(nameof(ToggleSolutionText));
        }
        catch (Exception ex)
        {
            StatusMessage = $"Error: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    private void OnToggleSolution()
    {
        IsSolutionVisible = !IsSolutionVisible;
        this.RaisePropertyChanged(nameof(ToggleSolutionText));
    }

    private async Task OnCopyToClipboard()
    {
        if (CurrentQuestion is null)
            return;

        var text = QuestionText;
        if (HasChoices && Choices.Count > 0)
        {
            for (int i = 0; i < Choices.Count; i++)
                text += $"\n  {i + 1}. {Choices[i]}";
        }

        CopyToClipboardRequested?.Invoke(this, text);
        StatusMessage = "Question copied to clipboard.";
        await Task.CompletedTask;
    }

    public event EventHandler<string>? CopyToClipboardRequested;

    private void OnExport()
    {
        if (CurrentQuestion is null && History.Count == 0)
        {
            StatusMessage = "No questions to export.";
            return;
        }

        var questions = History.ToList();
        if (questions.Count == 0 && CurrentQuestion is not null)
        {
            questions.Add(CurrentQuestion);
        }

        ExportRequested?.Invoke(this, questions);
    }

    public event EventHandler<IReadOnlyList<Core.Domain.GeneratedQuestion>>? ExportRequested;

    private void OnClearHistory()
    {
        History.Clear();
        StatusMessage = "History cleared.";
    }

    private void LoadAvailableTopicsAndSkills()
    {
        if (_specificationLoader is null) return;
        try
        {
            var spec = _specificationLoader.Load("part_one.txt");
            AvailableTopics = spec.Topics.Select(t => t.Id).ToList();
            AvailableSkills = spec.Skills.Select(s => s.Id).ToList();
        }
        catch
        {
            AvailableTopics = Array.Empty<string>();
            AvailableSkills = Array.Empty<string>();
        }
    }
}
