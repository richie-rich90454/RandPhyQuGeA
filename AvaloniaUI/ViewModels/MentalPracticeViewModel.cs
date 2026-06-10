using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reactive;
using System.Reactive.Concurrency;
using System.Reactive.Linq;
using System.Threading.Tasks;
using Core.Domain;
using Core.Interfaces;
using Core.Services;
using ReactiveUI;

using ReactiveUnit = System.Reactive.Unit;

namespace AvaloniaUI.ViewModels;

public class MentalPracticeViewModel : ViewModelBase
{
    private readonly SpecificationViewModel? _specificationViewModel;
    private readonly QuestionGenerator? _questionGenerator;
    private readonly IPracticeResultRepository? _resultRepository;
    private readonly NavigationViewModel? _navigationViewModel;

    // State machine
    private bool _isInSetup = true;
    private bool _isInPractice;
    private bool _isInFeedback;
    private bool _isSessionOver;
    private bool _isPaused;
    private bool _isCountdown;
    private bool _isTransitioning;

    // Current question
    private GeneratedQuestion? _currentQuestion;
    private int _currentQuestionIndex;
    private string _currentAnswer = string.Empty;
    private bool? _lastAnswerCorrect;

    // Timer
    private readonly Stopwatch _questionStopwatch = new();
    private readonly Stopwatch _sessionStopwatch = new();
    private TimeSpan _questionTimer;
    private TimeSpan _sessionTimer;
    private IDisposable? _timerSubscription;

    // Per-question tracking
    private readonly List<QuestionResultItem> _questionResultsList = new();

    // Scoring
    private int _currentStreak;
    private int _bestStreak;
    private int _questionsAnswered;
    private int _correctCount;
    private double _totalAnswerTimeSeconds;

    // Settings
    private string _selectedScope = "All Topics";
    private string? _selectedUnitId;
    private int _selectedQuestionCount = 10;
    private bool _isEndlessMode;

    // Countdown
    private int _countdownValue = 3;

    // Question queue
    private List<GeneratedQuestion> _questionQueue = new();

    // Feedback
    private string _feedbackMessage = string.Empty;

    // Scope options
    private List<string> _scopeOptions = new() { "All Topics" };
    private List<ScopeItem> _unitScopeItems = new();

    public MentalPracticeViewModel() : this(null, null, null, null) { }

    public MentalPracticeViewModel(SpecificationViewModel? specificationViewModel, QuestionGenerator? questionGenerator, IPracticeResultRepository? resultRepository = null, NavigationViewModel? navigationViewModel = null)
    {
        _specificationViewModel = specificationViewModel;
        _questionGenerator = questionGenerator;
        _resultRepository = resultRepository;
        _navigationViewModel = navigationViewModel;

        var canStart = this.WhenAnyValue(
            x => x.IsInSetup,
            x => x.QuestionGeneratorAvailable,
            (setup, available) => setup && available);

        var canAnswer = this.WhenAnyValue(x => x.IsInPractice);
        var canPause = this.WhenAnyValue(x => x.IsInPractice, x => x.IsPaused, (p, paused) => p && !paused);
        var canResume = this.WhenAnyValue(x => x.IsInPractice, x => x.IsPaused, (p, paused) => p && paused);
        var canGiveUp = this.WhenAnyValue(x => x.IsInPractice);
        var canEnd = this.WhenAnyValue(
            x => x.IsInPractice, x => x.IsInFeedback, x => x.IsSessionOver,
            (p, f, over) => (p || f) && !over);

        StartCommand = ReactiveCommand.CreateFromTask(OnStart, canStart);
        AnswerCommand = ReactiveCommand.Create<string>(OnAnswer, canAnswer);
        PauseCommand = ReactiveCommand.Create(OnPause, canPause);
        ResumeCommand = ReactiveCommand.Create(OnResume, canResume);
        GiveUpCommand = ReactiveCommand.Create(OnGiveUp, canGiveUp);
        EndSessionCommand = ReactiveCommand.Create(OnEndSession, canEnd);
        SelectQuestionCountCommand = ReactiveCommand.Create<int>(OnSelectQuestionCount);

        LoadScopeOptions();
    }

    private bool QuestionGeneratorAvailable => _questionGenerator is not null;

    // ─── State Properties ───────────────────────────────────────────────

    public bool IsInSetup
    {
        get => _isInSetup;
        set => this.RaiseAndSetIfChanged(ref _isInSetup, value);
    }

    public bool IsInPractice
    {
        get => _isInPractice;
        set => this.RaiseAndSetIfChanged(ref _isInPractice, value);
    }

    public bool IsInFeedback
    {
        get => _isInFeedback;
        set => this.RaiseAndSetIfChanged(ref _isInFeedback, value);
    }

    public bool IsSessionOver
    {
        get => _isSessionOver;
        set => this.RaiseAndSetIfChanged(ref _isSessionOver, value);
    }

    public bool IsPaused
    {
        get => _isPaused;
        set => this.RaiseAndSetIfChanged(ref _isPaused, value);
    }

    public bool IsCountdown
    {
        get => _isCountdown;
        set => this.RaiseAndSetIfChanged(ref _isCountdown, value);
    }

    public bool IsTransitioning
    {
        get => _isTransitioning;
        set => this.RaiseAndSetIfChanged(ref _isTransitioning, value);
    }

    // ─── Question Properties ────────────────────────────────────────────

    public GeneratedQuestion? CurrentQuestion
    {
        get => _currentQuestion;
        set
        {
            this.RaiseAndSetIfChanged(ref _currentQuestion, value);
            this.RaisePropertyChanged(nameof(QuestionText));
            this.RaisePropertyChanged(nameof(IsMultipleChoice));
            this.RaisePropertyChanged(nameof(Choices));
            this.RaisePropertyChanged(nameof(ChoiceItems));
            this.RaisePropertyChanged(nameof(HasChoices));
        }
    }

    public string QuestionText => CurrentQuestion?.Text ?? string.Empty;

    public bool IsMultipleChoice => CurrentQuestion?.QuestionType == "MC";

    public IReadOnlyList<string> Choices => CurrentQuestion?.Choices ?? Array.Empty<string>();

    public IReadOnlyList<ChoiceItem> ChoiceItems
    {
        get
        {
            if (CurrentQuestion?.Choices is not { Count: > 0 } choices)
                return Array.Empty<ChoiceItem>();
            var letters = new[] { "A", "B", "C", "D", "E", "F", "G", "H" };
            var keys = new[] { "1", "2", "3", "4", "5", "6", "7", "8" };
            return choices.Select((c, i) => new ChoiceItem(i, letters[i], keys[i], c)).ToList();
        }
    }

    public bool HasChoices => CurrentQuestion?.Choices is { Count: > 0 };

    public int CurrentQuestionIndex
    {
        get => _currentQuestionIndex;
        set => this.RaiseAndSetIfChanged(ref _currentQuestionIndex, value);
    }

    public string CurrentAnswer
    {
        get => _currentAnswer;
        set => this.RaiseAndSetIfChanged(ref _currentAnswer, value);
    }

    public bool? LastAnswerCorrect
    {
        get => _lastAnswerCorrect;
        set => this.RaiseAndSetIfChanged(ref _lastAnswerCorrect, value);
    }

    // ─── Timer Properties ───────────────────────────────────────────────

    public TimeSpan QuestionTimer
    {
        get => _questionTimer;
        set
        {
            this.RaiseAndSetIfChanged(ref _questionTimer, value);
            this.RaisePropertyChanged(nameof(QuestionTimerText));
            this.RaisePropertyChanged(nameof(QuestionTimerBrushKey));
        }
    }

    public string QuestionTimerText
    {
        get
        {
            var t = QuestionTimer;
            if (t.TotalHours >= 1)
                return $"{(int)t.TotalHours}:{t.Minutes:D2}:{t.Seconds:D2}";
            return $"{t.Minutes:D2}:{t.Seconds:D2}";
        }
    }

    public string QuestionTimerBrushKey
    {
        get
        {
            var seconds = QuestionTimer.TotalSeconds;
            if (seconds >= 60) return "TimerCriticalBrush";
            if (seconds >= 30) return "TimerWarningBrush";
            return "TimerNormalBrush";
        }
    }

    public TimeSpan SessionTimer
    {
        get => _sessionTimer;
        set
        {
            this.RaiseAndSetIfChanged(ref _sessionTimer, value);
            this.RaisePropertyChanged(nameof(SessionTimerText));
        }
    }

    public string SessionTimerText
    {
        get
        {
            var t = SessionTimer;
            if (t.TotalHours >= 1)
                return $"{(int)t.TotalHours}:{t.Minutes:D2}:{t.Seconds:D2}";
            return $"{t.Minutes:D2}:{t.Seconds:D2}";
        }
    }

    // ─── Scoring Properties ─────────────────────────────────────────────

    public int CurrentStreak
    {
        get => _currentStreak;
        set
        {
            this.RaiseAndSetIfChanged(ref _currentStreak, value);
            this.RaisePropertyChanged(nameof(HasStreak));
            this.RaisePropertyChanged(nameof(HasFireStreak));
        }
    }

    public int BestStreak
    {
        get => _bestStreak;
        set => this.RaiseAndSetIfChanged(ref _bestStreak, value);
    }

    public bool HasStreak => CurrentStreak > 0;

    public bool HasFireStreak => CurrentStreak > 3;

    public int QuestionsAnswered
    {
        get => _questionsAnswered;
        set => this.RaiseAndSetIfChanged(ref _questionsAnswered, value);
    }

    public int CorrectCount
    {
        get => _correctCount;
        set
        {
            this.RaiseAndSetIfChanged(ref _correctCount, value);
            this.RaisePropertyChanged(nameof(AccuracyText));
        }
    }

    public string AccuracyText => QuestionsAnswered > 0
        ? $"{CorrectCount * 100.0 / QuestionsAnswered:F0}%"
        : "—";

    public string SpeedRating => ComputeSpeedRating();

    private string ComputeSpeedRating()
    {
        if (QuestionsAnswered == 0) return "—";
        var avgTime = _totalAnswerTimeSeconds / QuestionsAnswered;
        if (avgTime < 5) return "Lightning";
        if (avgTime < 15) return "Fast";
        if (avgTime < 30) return "Steady";
        return "Careful";
    }

    public string SpeedRatingIcon => SpeedRating switch
    {
        "Lightning" => "⚡",
        "Fast" => "★",
        "Steady" => "⏳",
        "Careful" => "🧠",
        _ => ""
    };

    // ─── Settings Properties ────────────────────────────────────────────

    public string SelectedScope
    {
        get => _selectedScope;
        set => this.RaiseAndSetIfChanged(ref _selectedScope, value);
    }

    public string? SelectedUnitId
    {
        get => _selectedUnitId;
        set => this.RaiseAndSetIfChanged(ref _selectedUnitId, value);
    }

    public int SelectedQuestionCount
    {
        get => _selectedQuestionCount;
        set => this.RaiseAndSetIfChanged(ref _selectedQuestionCount, value);
    }

    public bool IsEndlessMode
    {
        get => _isEndlessMode;
        set => this.RaiseAndSetIfChanged(ref _isEndlessMode, value);
    }

    // ─── Countdown ──────────────────────────────────────────────────────

    public int CountdownValue
    {
        get => _countdownValue;
        set => this.RaiseAndSetIfChanged(ref _countdownValue, value);
    }

    // ─── Feedback ───────────────────────────────────────────────────────

    public string FeedbackMessage
    {
        get => _feedbackMessage;
        set => this.RaiseAndSetIfChanged(ref _feedbackMessage, value);
    }

    // ─── Scope Options ──────────────────────────────────────────────────

    public List<string> ScopeOptions
    {
        get => _scopeOptions;
        set => this.RaiseAndSetIfChanged(ref _scopeOptions, value);
    }

    public List<ScopeItem> UnitScopeItems
    {
        get => _unitScopeItems;
        set => this.RaiseAndSetIfChanged(ref _unitScopeItems, value);
    }

    // ─── Progress ───────────────────────────────────────────────────────

    public string ProgressText => IsEndlessMode
        ? $"Q{QuestionsAnswered + 1}"
        : $"{CurrentQuestionIndex + 1}/{SelectedQuestionCount}";

    // ─── Commands ───────────────────────────────────────────────────────

    public ReactiveCommand<ReactiveUnit, ReactiveUnit> StartCommand { get; }
    public ReactiveCommand<string, ReactiveUnit> AnswerCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> PauseCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> ResumeCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> GiveUpCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> EndSessionCommand { get; }
    public ReactiveCommand<int, ReactiveUnit> SelectQuestionCountCommand { get; }

    // ─── Private Methods ────────────────────────────────────────────────

    private void LoadScopeOptions()
    {
        if (_specificationViewModel is null) return;

        var options = new List<string> { "All Topics" };
        var unitItems = new List<ScopeItem>();

        foreach (var unit in _specificationViewModel.Units)
        {
            var label = $"{unit.Name}";
            options.Add(label);
            unitItems.Add(new ScopeItem(unit.Id, label));
        }

        ScopeOptions = options;
        UnitScopeItems = unitItems;
    }

    private async Task OnStart()
    {
        if (_questionGenerator is null) return;

        // Reset state
        _questionQueue.Clear();
        CurrentQuestion = null;
        CurrentQuestionIndex = 0;
        QuestionsAnswered = 0;
        CorrectCount = 0;
        CurrentStreak = 0;
        BestStreak = 0;
        _totalAnswerTimeSeconds = 0;
        LastAnswerCorrect = null;
        CurrentAnswer = string.Empty;
        FeedbackMessage = string.Empty;

        // Pre-generate questions
        string? topicId = ResolveTopicId();
        var count = IsEndlessMode ? 50 : SelectedQuestionCount;
        _questionQueue = (await Task.Run(() =>
            _questionGenerator.GenerateBatch(count, topicId))).ToList();

        if (_questionQueue.Count == 0) return;

        // Transition to countdown
        IsInSetup = false;
        IsCountdown = true;
        CountdownValue = 3;

        // Run countdown
        for (int i = 3; i >= 1; i--)
        {
            CountdownValue = i;
            await Task.Delay(800);
        }

        CountdownValue = 0; // GO!
        await Task.Delay(400);

        IsCountdown = false;
        IsInPractice = true;

        // Start session timer
        _sessionStopwatch.Restart();
        StartTimerLoop();

        // Show first question
        ShowNextQuestion();
    }

    private string? ResolveTopicId()
    {
        if (SelectedScope == "All Topics") return null;

        // Find the unit that matches the selected scope
        var unitItem = UnitScopeItems.FirstOrDefault(u => u.Label == SelectedScope);
        if (unitItem is not null)
        {
            SelectedUnitId = unitItem.Id;
            // Get first topic from this unit
            if (_specificationViewModel is not null)
            {
                var unit = _specificationViewModel.Units.FirstOrDefault(u => u.Id == unitItem.Id);
                if (unit is not null)
                {
                    var topics = _specificationViewModel.Topics.Where(t => t.UnitId == unit.Id).ToList();
                    if (topics.Count > 0) return topics[0].Id;
                }
            }
        }

        return null;
    }

    private void ShowNextQuestion()
    {
        if (CurrentQuestionIndex >= _questionQueue.Count)
        {
            // Try to generate more for endless mode
            if (IsEndlessMode && _questionGenerator is not null)
            {
                string? topicId = ResolveTopicId();
                var more = _questionGenerator.GenerateBatch(10, topicId);
                _questionQueue.AddRange(more);
            }

            if (CurrentQuestionIndex >= _questionQueue.Count)
            {
                EndSession();
                return;
            }
        }

        CurrentQuestion = _questionQueue[CurrentQuestionIndex];
        CurrentAnswer = string.Empty;
        LastAnswerCorrect = null;
        FeedbackMessage = string.Empty;
        IsInFeedback = false;
        IsInPractice = true;

        this.RaisePropertyChanged(nameof(ProgressText));

        // Start question timer
        _questionStopwatch.Restart();
    }

    private void OnAnswer(string answer)
    {
        if (CurrentQuestion is null || IsInFeedback) return;

        var isCorrect = CheckAnswer(answer);
        RecordAnswer(isCorrect, _questionStopwatch.Elapsed.TotalSeconds);

        LastAnswerCorrect = isCorrect;
        FeedbackMessage = isCorrect ? "Correct!" : $"Incorrect. Answer: {CurrentQuestion.Answer}";

        IsInPractice = false;
        IsInFeedback = true;

        // Auto-advance after 2 seconds
        _ = AutoAdvanceAsync();
    }

    private bool CheckAnswer(string answer)
    {
        if (CurrentQuestion is null) return false;

        if (IsMultipleChoice && CurrentQuestion.Choices is { Count: > 0 })
        {
            // answer is the index (0-based) as string
            if (int.TryParse(answer, out var index) && index >= 0 && index < CurrentQuestion.Choices.Count)
            {
                return string.Equals(
                    CurrentQuestion.Choices[index].Trim(),
                    CurrentQuestion.Answer.Trim(),
                    StringComparison.OrdinalIgnoreCase);
            }
            return false;
        }

        // Short answer: compare trimmed, case-insensitive
        return string.Equals(answer.Trim(), CurrentQuestion.Answer.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    private void RecordAnswer(bool correct, double timeSeconds)
    {
        QuestionsAnswered++;
        _totalAnswerTimeSeconds += timeSeconds;

        if (correct)
        {
            CorrectCount++;
            CurrentStreak++;
            if (CurrentStreak > BestStreak) BestStreak = CurrentStreak;
        }
        else
        {
            CurrentStreak = 0;
        }

        this.RaisePropertyChanged(nameof(SpeedRating));
        this.RaisePropertyChanged(nameof(SpeedRatingIcon));
        this.RaisePropertyChanged(nameof(ProgressText));

        // Save result to repository
        if (_resultRepository is not null && CurrentQuestion is not null)
        {
            var result = new PracticeResult
            {
                QuestionId = CurrentQuestion.Id,
                TopicId = CurrentQuestion.TopicId,
                SkillId = CurrentQuestion.SkillId,
                IsCorrect = correct,
                TimeTaken = TimeSpan.FromSeconds(timeSeconds),
                UserAnswer = correct ? CurrentQuestion.Answer : (IsMultipleChoice ? _currentAnswer : _currentAnswer),
                Timestamp = DateTime.UtcNow,
                Mode = PracticeMode.Mental
            };
            _ = _resultRepository.SaveAsync(result);
        }
    }

    private async Task AutoAdvanceAsync()
    {
        await Task.Delay(1500);

        if (IsSessionOver || IsPaused) return;

        IsTransitioning = true;
        await Task.Delay(300); // Brief fade-out

        CurrentQuestionIndex++;

        if (!IsEndlessMode && CurrentQuestionIndex >= SelectedQuestionCount)
        {
            EndSession();
        }
        else
        {
            ShowNextQuestion();
        }

        IsTransitioning = false;
    }

    private void OnPause()
    {
        IsPaused = true;
        _questionStopwatch.Stop();
        _sessionStopwatch.Stop();
    }

    private void OnResume()
    {
        IsPaused = false;
        _questionStopwatch.Start();
        _sessionStopwatch.Start();
    }

    private void OnGiveUp()
    {
        if (CurrentQuestion is null) return;

        RecordAnswer(false, _questionStopwatch.Elapsed.TotalSeconds);

        LastAnswerCorrect = false;
        FeedbackMessage = $"Given up. Answer: {CurrentQuestion.Answer}";

        IsInPractice = false;
        IsInFeedback = true;

        _ = AutoAdvanceAsync();
    }

    private void OnEndSession()
    {
        EndSession();
    }

    private void OnSelectQuestionCount(int count)
    {
        if (count == -1)
        {
            IsEndlessMode = true;
        }
        else
        {
            IsEndlessMode = false;
            SelectedQuestionCount = count;
        }
    }

    private void EndSession()
    {
        StopTimerLoop();
        _questionStopwatch.Stop();
        _sessionStopwatch.Stop();

        IsInPractice = false;
        IsInFeedback = false;
        IsSessionOver = true;
        IsPaused = false;

        this.RaisePropertyChanged(nameof(SpeedRating));
        this.RaisePropertyChanged(nameof(SpeedRatingIcon));
    }

    private void StartTimerLoop()
    {
        _timerSubscription = Observable.Interval(TimeSpan.FromMilliseconds(100), RxApp.MainThreadScheduler)
            .Subscribe(_ =>
            {
                if (!IsPaused)
                {
                    QuestionTimer = _questionStopwatch.Elapsed;
                    SessionTimer = _sessionStopwatch.Elapsed;
                }
            });
    }

    private void StopTimerLoop()
    {
        _timerSubscription?.Dispose();
        _timerSubscription = null;
    }
}

public sealed class ScopeItem
{
    public string Id { get; }
    public string Label { get; }

    public ScopeItem(string id, string label)
    {
        Id = id;
        Label = label;
    }
}

public sealed class ChoiceItem
{
    public int Index { get; }
    public string Letter { get; }
    public string KeyHint { get; }
    public string Text { get; }

    public ChoiceItem(int index, string letter, string keyHint, string text)
    {
        Index = index;
        Letter = letter;
        KeyHint = keyHint;
        Text = text;
    }
}
