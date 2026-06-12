using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Reactive;
using System.Reactive.Linq;
using System.Threading.Tasks;
using AvaloniaUI.Controls;
using AvaloniaUI.Services;
using Core.Domain;
using Core.Interfaces;
using Core.Services;
using ReactiveUI;

using ReactiveUnit = System.Reactive.Unit;

namespace AvaloniaUI.ViewModels;

public class FocusedPracticeViewModel : ViewModelBase, IDisposable
{
    private bool _isDisposed;

    private readonly SpecificationViewModel _specificationViewModel;
    private readonly QuestionGenerator _questionGenerator;
    private readonly IPracticeResultRepository? _resultRepository;
    private readonly NavigationViewModel? _navigationViewModel;
    private readonly SoundService? _soundService;

    // Per-question tracking for session summary
    private readonly List<QuestionResultItem> _questionResultsList = new();

    // Scope item event handler tracking for proper unsubscription
    private readonly List<(ScopeCheckItem item, System.ComponentModel.PropertyChangedEventHandler handler)> _scopeHandlers = new();

    // Scope selection state
    private bool _isSelectingScope = true;
    private int _minDifficulty = 1;
    private int _maxDifficulty = 10;
    private string _questionType = "Mixed";
    private int _questionCount = 10;
    private string _selectedScopeDescription = string.Empty;
    private ObservableCollection<ScopeCheckItem> _scopeItems = new();

    // Practice session state
    private ObservableCollection<GeneratedQuestion> _questions = new();
    private int _currentQuestionIndex = -1;
    private bool _isSolutionVisible;
    private string _selectedAnswer = string.Empty;
    private string _shortAnswer = string.Empty;
    private bool _isAnswerSubmitted;
    private bool _isCorrect;
    private int _answeredCount;

    // Confirmation dialog
    private bool _isEndConfirmationVisible;

    // Concurrency guard
    private bool _isGenerating;

    private string _errorMessage = string.Empty;

    public FocusedPracticeViewModel(SpecificationViewModel specificationViewModel, QuestionGenerator questionGenerator, IPracticeResultRepository? resultRepository = null, NavigationViewModel? navigationViewModel = null, int questionCount = 10, int minDifficulty = 1, int maxDifficulty = 10, string questionType = "Mixed", SoundService? soundService = null)
    {
        _specificationViewModel = specificationViewModel;
        _questionGenerator = questionGenerator;
        _resultRepository = resultRepository;
        _navigationViewModel = navigationViewModel;
        _questionCount = questionCount;
        _minDifficulty = minDifficulty;
        _maxDifficulty = maxDifficulty;
        _questionType = questionType;
        _soundService = soundService;

        var canStartPractice = this.WhenAnyValue(
            x => x.IsSelectingScope,
            x => x.SelectedScopeDescription,
            x => x.IsGenerating,
            (isSelecting, desc, generating) => isSelecting && !string.IsNullOrEmpty(desc) && !generating);

        StartPracticeCommand = ReactiveCommand.CreateFromTask(OnStartPractice, canStartPractice);
        ShowSolutionCommand = ReactiveCommand.Create(OnShowSolution);
        NextQuestionCommand = ReactiveCommand.Create(OnNextQuestion);
        EndSessionCommand = ReactiveCommand.Create(OnEndSession);
        ConfirmEndSessionCommand = ReactiveCommand.Create(OnConfirmEndSession);
        CancelEndSessionCommand = ReactiveCommand.Create(OnCancelEndSession);
        SubmitAnswerCommand = ReactiveCommand.Create(OnSubmitAnswer);
        SelectAnswerCommand = ReactiveCommand.Create<string>(OnSelectAnswer);
        ViewSummaryCommand = ReactiveCommand.Create(OnViewSummary);
        CopyQuestionCommand = ReactiveCommand.Create(OnCopyQuestion);
        CopyAnswerCommand = ReactiveCommand.Create(OnCopyAnswer);
        CopyFullCommand = ReactiveCommand.Create(OnCopyFull);

        _ = InitializeAsyncSafe();
    }

    private async Task InitializeAsyncSafe()
    {
        try
        {
            await InitializeScopeItemsAsync();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Failed to initialize focused practice: {ex.Message}");
            ErrorMessage = $"Failed to initialize: {ex.Message}";
        }
    }

    // ─── Scope Selection Properties ──────────────────────────────────

    public bool IsSelectingScope
    {
        get => _isSelectingScope;
        set => this.RaiseAndSetIfChanged(ref _isSelectingScope, value);
    }

    public ObservableCollection<ScopeCheckItem> ScopeItems
    {
        get => _scopeItems;
        set => this.RaiseAndSetIfChanged(ref _scopeItems, value);
    }

    public int MinDifficulty
    {
        get => _minDifficulty;
        set
        {
            this.RaiseAndSetIfChanged(ref _minDifficulty, value);
            if (_maxDifficulty < value)
                MaxDifficulty = value;
        }
    }

    public int MaxDifficulty
    {
        get => _maxDifficulty;
        set
        {
            this.RaiseAndSetIfChanged(ref _maxDifficulty, value);
            if (_minDifficulty > value)
                MinDifficulty = value;
        }
    }

    public string QuestionType
    {
        get => _questionType;
        set => this.RaiseAndSetIfChanged(ref _questionType, value);
    }

    public int QuestionCount
    {
        get => _questionCount;
        set => this.RaiseAndSetIfChanged(ref _questionCount, value);
    }

    public string SelectedScopeDescription
    {
        get => _selectedScopeDescription;
        set => this.RaiseAndSetIfChanged(ref _selectedScopeDescription, value);
    }

    // ─── Practice Session Properties ─────────────────────────────────

    public ObservableCollection<GeneratedQuestion> Questions
    {
        get => _questions;
        set => this.RaiseAndSetIfChanged(ref _questions, value);
    }

    public int CurrentQuestionIndex
    {
        get => _currentQuestionIndex;
        set
        {
            this.RaiseAndSetIfChanged(ref _currentQuestionIndex, value);
            this.RaisePropertyChanged(nameof(CurrentQuestion));
            this.RaisePropertyChanged(nameof(QuestionHasLaTeX));
            this.RaisePropertyChanged(nameof(SolutionHasLaTeX));
            this.RaisePropertyChanged(nameof(IsMcQuestion));
            this.RaisePropertyChanged(nameof(IsLastQuestion));
            this.RaisePropertyChanged(nameof(ProgressText));
            this.RaisePropertyChanged(nameof(ProgressPercent));
        }
    }

    public GeneratedQuestion? CurrentQuestion =>
        CurrentQuestionIndex >= 0 && CurrentQuestionIndex < Questions.Count
            ? Questions[CurrentQuestionIndex]
            : null;

    public bool QuestionHasLaTeX => CurrentQuestion is not null && LaTeXImage.ContainsLaTeX(CurrentQuestion.Text);

    public bool SolutionHasLaTeX => CurrentQuestion is not null && LaTeXImage.ContainsLaTeX(CurrentQuestion.SolutionLaTeX);

    public bool IsMcQuestion => CurrentQuestion?.Choices is { Count: > 0 };

    public bool IsLastQuestion => CurrentQuestionIndex >= Questions.Count - 1;

    public string ProgressText => Questions.Count > 0
        ? $"Question {CurrentQuestionIndex + 1} of {Questions.Count}"
        : string.Empty;

    public double ProgressPercent => Questions.Count > 0
        ? (double)(CurrentQuestionIndex + 1) / Questions.Count * 100.0
        : 0;

    public bool IsSolutionVisible
    {
        get => _isSolutionVisible;
        set => this.RaiseAndSetIfChanged(ref _isSolutionVisible, value);
    }

    public string SelectedAnswer
    {
        get => _selectedAnswer;
        set => this.RaiseAndSetIfChanged(ref _selectedAnswer, value);
    }

    public string ShortAnswer
    {
        get => _shortAnswer;
        set => this.RaiseAndSetIfChanged(ref _shortAnswer, value);
    }

    public bool IsAnswerSubmitted
    {
        get => _isAnswerSubmitted;
        set => this.RaiseAndSetIfChanged(ref _isAnswerSubmitted, value);
    }

    public bool IsCorrect
    {
        get => _isCorrect;
        set => this.RaiseAndSetIfChanged(ref _isCorrect, value);
    }

    public int AnsweredCount
    {
        get => _answeredCount;
        set => this.RaiseAndSetIfChanged(ref _answeredCount, value);
    }

    public bool IsEndConfirmationVisible
    {
        get => _isEndConfirmationVisible;
        set => this.RaiseAndSetIfChanged(ref _isEndConfirmationVisible, value);
    }

    public bool IsGenerating
    {
        get => _isGenerating;
        set => this.RaiseAndSetIfChanged(ref _isGenerating, value);
    }

    public string ErrorMessage
    {
        get => _errorMessage;
        set => this.RaiseAndSetIfChanged(ref _errorMessage, value);
    }

    private bool _isSessionOver;

    public bool IsSessionOver
    {
        get => _isSessionOver;
        set => this.RaiseAndSetIfChanged(ref _isSessionOver, value);
    }

    // ─── Commands ────────────────────────────────────────────────────

    public ReactiveCommand<ReactiveUnit, ReactiveUnit> StartPracticeCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> ShowSolutionCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> NextQuestionCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> EndSessionCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> ConfirmEndSessionCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> CancelEndSessionCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> SubmitAnswerCommand { get; }
    public ReactiveCommand<string, ReactiveUnit> SelectAnswerCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> ViewSummaryCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> CopyQuestionCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> CopyAnswerCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> CopyFullCommand { get; }

    public event EventHandler<string>? CopyToClipboardRequested;

    // ─── Scope Selection Logic ───────────────────────────────────────

    /// <summary>
    /// Pre-selects scope items matching the given skill and topic IDs.
    /// </summary>
    public void SetScope(string[]? skillIds, string[]? topicIds)
    {
        if (skillIds is null && topicIds is null) return;

        var skillIdSet = skillIds is not null ? new HashSet<string>(skillIds) : null;
        var topicIdSet = topicIds is not null ? new HashSet<string>(topicIds) : null;

        foreach (var item in ScopeItems)
        {
            if (skillIdSet is not null && item.Level == "Skill" && skillIdSet.Contains(item.Id))
            {
                item.IsChecked = true;
            }
            if (topicIdSet is not null && item.Level == "Topic" && topicIdSet.Contains(item.Id))
            {
                item.IsChecked = true;
            }
        }

        UpdateScopeDescription();
    }

    private async Task InitializeScopeItemsAsync()
    {
        // Unsubscribe old handlers
        foreach (var (item, handler) in _scopeHandlers)
            item.PropertyChanged -= handler;
        _scopeHandlers.Clear();

        ScopeItems.Clear();

        if (!_specificationViewModel.IsLoaded)
        {
            await _specificationViewModel.EnsureLoadedAsync();
        }

        foreach (var unit in _specificationViewModel.UnitNodes)
        {
            var unitItem = new ScopeCheckItem(unit.Name, unit.Id, "Unit", null);
            ScopeItems.Add(unitItem);

            foreach (var topic in unit.Topics)
            {
                var topicItem = new ScopeCheckItem(topic.Name, topic.Id, "Topic", unit.Id);
                ScopeItems.Add(topicItem);

                foreach (var skill in topic.Skills)
                {
                    var skillItem = new ScopeCheckItem(skill.Name, skill.Id, "Skill", topic.Id);
                    ScopeItems.Add(skillItem);
                }
            }
        }

        foreach (var item in ScopeItems)
        {
            System.ComponentModel.PropertyChangedEventHandler handler = (s, e) =>
            {
                if (e.PropertyName == nameof(ScopeCheckItem.IsChecked))
                    UpdateScopeDescription();
            };
            item.PropertyChanged += handler;
            _scopeHandlers.Add((item, handler));
        }

        UpdateScopeDescription();
    }

    private void UpdateScopeDescription()
    {
        var checkedSkills = ScopeItems.Where(i => i.Level == "Skill" && i.IsChecked).ToList();
        var checkedTopics = ScopeItems.Where(i => i.Level == "Topic" && i.IsChecked).ToList();

        var skillCount = checkedSkills.Count;
        var topicCount = checkedTopics.Count;

        if (skillCount == 0 && topicCount == 0)
        {
            SelectedScopeDescription = string.Empty;
            return;
        }

        var estimatedQuestions = QuestionCount == 0 ? skillCount * 3 : Math.Min(QuestionCount, skillCount * 5);
        SelectedScopeDescription = $"{topicCount} topic{(topicCount != 1 ? "s" : "")}, {skillCount} skill{(skillCount != 1 ? "s" : "")}, ~{estimatedQuestions} question{(estimatedQuestions != 1 ? "s" : "")}";
    }

    // ─── Practice Session Logic ──────────────────────────────────────

    private async Task OnStartPractice()
    {
        var selectedSkillIds = ScopeItems
            .Where(i => i.Level == "Skill" && i.IsChecked)
            .Select(i => i.Id)
            .ToList();

        if (selectedSkillIds.Count == 0)
            return;

        IsGenerating = true;
        try
        {
            var targetCount = QuestionCount == 0 ? selectedSkillIds.Count * 3 : QuestionCount;
            string? qType = QuestionType == "Mixed" ? null : QuestionType;

            // Capture skill parent IDs for the background thread
            var skillParentMap = ScopeItems
                .Where(i => i.Level == "Skill" && i.IsChecked)
                .ToDictionary(i => i.Id, i => i.ParentId);

            var minDiff = MinDifficulty;
            var maxDiff = MaxDifficulty;

            // Generate ALL questions in a single background task — no sequential UI-thread hops
            var questions = await Task.Run(() =>
            {
                var results = new List<GeneratedQuestion>();
                var rng = new Random();

                // First pass: one question per selected skill
                foreach (var skillId in selectedSkillIds)
                {
                    var parentId = skillParentMap.GetValueOrDefault(skillId);
                    for (int attempt = 0; attempt < 3; attempt++)
                    {
                        var question = _questionGenerator.Generate(parentId, skillId, minDiff, maxDiff, qType);
                        if (question is not null)
                        {
                            results.Add(question);
                            break;
                        }
                    }
                }

                // Second pass: fill up to target count
                if (results.Count < targetCount)
                {
                    for (int i = results.Count; i < targetCount; i++)
                    {
                        var skillId = selectedSkillIds[rng.Next(selectedSkillIds.Count)];
                        var parentId = skillParentMap.GetValueOrDefault(skillId);
                        var question = _questionGenerator.Generate(parentId, skillId, minDiff, maxDiff, qType);
                        if (question is not null)
                            results.Add(question);
                    }
                }

                return results;
            });

            Questions.Clear();
            foreach (var q in questions)
                Questions.Add(q);

            CurrentQuestionIndex = Questions.Count > 0 ? 0 : -1;
            IsSelectingScope = false;
            IsSessionOver = false;
            IsSolutionVisible = false;
            SelectedAnswer = string.Empty;
            ShortAnswer = string.Empty;
            IsAnswerSubmitted = false;
            AnsweredCount = 0;
            _questionResultsList.Clear();
        }
        finally
        {
            IsGenerating = false;
        }
    }

    private void OnShowSolution()
    {
        IsSolutionVisible = true;
    }

    private void OnNextQuestion()
    {
        if (CurrentQuestionIndex < Questions.Count - 1)
        {
            CurrentQuestionIndex++;
            IsSolutionVisible = false;
            SelectedAnswer = string.Empty;
            ShortAnswer = string.Empty;
            IsAnswerSubmitted = false;
        }
    }

    private void OnEndSession()
    {
        IsEndConfirmationVisible = true;
    }

    private void OnConfirmEndSession()
    {
        IsEndConfirmationVisible = false;
        IsSessionOver = true;

        if (_questionResultsList.Count == 0)
        {
            // No results — navigate to Home instead of stale view
            _navigationViewModel?.Navigate("Home");
            return;
        }

        // Navigate to session summary
        if (_navigationViewModel is not null)
        {
            var summary = new SessionSummaryViewModel(
                _questionResultsList.ToList(),
                _navigationViewModel);
            _navigationViewModel.NavigateToSessionSummary(summary);
        }
    }

    private void OnCancelEndSession()
    {
        IsEndConfirmationVisible = false;
    }

    private void OnViewSummary()
    {
        if (_navigationViewModel is not null && _questionResultsList.Count > 0)
        {
            var summary = new SessionSummaryViewModel(
                _questionResultsList.ToList(),
                _navigationViewModel);
            _navigationViewModel.NavigateToSessionSummary(summary);
        }
    }

    private void OnSelectAnswer(string answer)
    {
        if (IsAnswerSubmitted) return;
        SelectedAnswer = answer;
    }

    private void OnSubmitAnswer()
    {
        if (CurrentQuestion is null) return;

        IsAnswerSubmitted = true;
        AnsweredCount++;

        if (CurrentQuestion.Choices is { Count: > 0 })
        {
            IsCorrect = AreAnswersEquivalent(SelectedAnswer ?? "", CurrentQuestion.Answer);
        }
        else
        {
            IsCorrect = AreAnswersEquivalent(ShortAnswer.Trim(), CurrentQuestion.Answer);
        }

        // Play sound feedback
        if (IsCorrect)
            _soundService?.PlayCorrect();
        else
            _soundService?.PlayIncorrect();

        // Track result for session summary
        var userAnswer = CurrentQuestion.Choices is { Count: > 0 } ? SelectedAnswer ?? "" : ShortAnswer.Trim();
        _questionResultsList.Add(new QuestionResultItem(
            CurrentQuestion.Text,
            userAnswer,
            CurrentQuestion.Answer,
            0,
            IsCorrect,
            CurrentQuestion.TopicId,
            CurrentQuestion.SkillId));

        // Save result to repository
        if (_resultRepository is not null)
        {
            var result = new PracticeResult
            {
                QuestionId = CurrentQuestion.Id,
                TopicId = CurrentQuestion.TopicId,
                SkillId = CurrentQuestion.SkillId,
                IsCorrect = IsCorrect,
                TimeTaken = TimeSpan.Zero,
                UserAnswer = userAnswer,
                Timestamp = DateTime.UtcNow,
                Mode = PracticeMode.Focused,
                Difficulty = CurrentQuestion?.Difficulty ?? 0
            };
            _ = SaveResultAsync(result);
        }
    }

    /// <summary>
    /// Compares two answers, handling numerical equivalence (e.g., "3.14" == "3.1400").
    /// </summary>
    private static bool AreAnswersEquivalent(string userAnswer, string correctAnswer)
    {
        if (string.Equals(userAnswer, correctAnswer, StringComparison.OrdinalIgnoreCase))
            return true;

        if (double.TryParse(userAnswer, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var userVal) &&
            double.TryParse(correctAnswer, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var correctVal))
        {
            if (Math.Abs(userVal - correctVal) < 1e-6)
                return true;
            if (correctVal != 0 && Math.Abs((userVal - correctVal) / correctVal) < 1e-4)
                return true;
            if (Math.Abs(userVal) < 1e-10 && Math.Abs(correctVal) < 1e-10)
                return true;
        }

        return false;
    }

    private async Task SaveResultAsync(PracticeResult result)
    {
        try
        {
            await _resultRepository!.SaveAsync(result);
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Failed to save practice result: {ex.Message}");
            ErrorMessage = $"Failed to save result: {ex.Message}";
        }
    }

    // ─── Clipboard Copy Logic ──────────────────────────────────────────

    private void OnCopyQuestion()
    {
        if (CurrentQuestion is null) return;
        CopyToClipboardRequested?.Invoke(this, CurrentQuestion.Text);
    }

    private void OnCopyAnswer()
    {
        if (CurrentQuestion is null) return;
        CopyToClipboardRequested?.Invoke(this, CurrentQuestion.Answer);
    }

    private void OnCopyFull()
    {
        if (CurrentQuestion is null) return;

        var sb = new System.Text.StringBuilder();
        sb.AppendLine(CurrentQuestion.Text);

        if (CurrentQuestion.Choices is { Count: > 0 })
        {
            var letter = 'A';
            foreach (var choice in CurrentQuestion.Choices)
            {
                sb.AppendLine($"  {letter}) {choice}");
                letter++;
            }
        }

        sb.AppendLine();
        sb.AppendLine($"Answer: {CurrentQuestion.Answer}");
        sb.AppendLine();
        sb.AppendLine(CurrentQuestion.SolutionText);

        CopyToClipboardRequested?.Invoke(this, sb.ToString());
    }

    public void Dispose()
    {
        if (_isDisposed) return;

        foreach (var (item, handler) in _scopeHandlers)
            item.PropertyChanged -= handler;
        _scopeHandlers.Clear();

        _isDisposed = true;
        GC.SuppressFinalize(this);
    }
}

public class ScopeCheckItem : ViewModelBase
{
    private bool _isChecked;
    private string _name;
    private string _id;
    private string _level;
    private string? _parentId;

    public ScopeCheckItem(string name, string id, string level, string? parentId)
    {
        _name = name;
        _id = id;
        _level = level;
        _parentId = parentId;
    }

    public string Name
    {
        get => _name;
        set => this.RaiseAndSetIfChanged(ref _name, value);
    }

    public string Id
    {
        get => _id;
        set => this.RaiseAndSetIfChanged(ref _id, value);
    }

    public string Level
    {
        get => _level;
        set => this.RaiseAndSetIfChanged(ref _level, value);
    }

    public string? ParentId
    {
        get => _parentId;
        set => this.RaiseAndSetIfChanged(ref _parentId, value);
    }

    public bool IsChecked
    {
        get => _isChecked;
        set => this.RaiseAndSetIfChanged(ref _isChecked, value);
    }
}
