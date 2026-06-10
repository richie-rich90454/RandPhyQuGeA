using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Reactive;
using System.Text;
using Core.Services;
using ReactiveUI;

using ReactiveUnit = System.Reactive.Unit;

namespace AvaloniaUI.ViewModels;

public class SessionSummaryViewModel : ViewModelBase
{
    private readonly ObservableCollection<QuestionResultItem> _questionResults;
    private readonly NavigationViewModel? _navigationViewModel;
    private readonly SpecificationViewModel? _specificationViewModel;
    private readonly QuestionGenerator? _questionGenerator;

    // Previous session comparison
    private SessionSummaryViewModel? _previousSession;

    public SessionSummaryViewModel() : this(new List<QuestionResultItem>(), null, null, null) { }

    public SessionSummaryViewModel(
        List<QuestionResultItem> results,
        NavigationViewModel? navigationViewModel = null,
        SpecificationViewModel? specificationViewModel = null,
        QuestionGenerator? questionGenerator = null)
    {
        _questionResults = new ObservableCollection<QuestionResultItem>(results);
        _navigationViewModel = navigationViewModel;
        _specificationViewModel = specificationViewModel;
        _questionGenerator = questionGenerator;

        PracticeAgainCommand = ReactiveCommand.Create(OnPracticeAgain);
        ReviewMistakesCommand = ReactiveCommand.Create(OnReviewMistakes, this.WhenAnyValue(x => x.HasMistakes));
        ExportCommand = ReactiveCommand.Create(OnExport);
        BackToHomeCommand = ReactiveCommand.Create(OnBackToHome);
    }

    // ─── Score Properties ────────────────────────────────────────────────

    public int TotalQuestions => _questionResults.Count;

    public int CorrectCount => _questionResults.Count(r => r.WasCorrect);

    public int IncorrectCount => _questionResults.Count(r => !r.WasCorrect);

    public string ScoreText => TotalQuestions > 0
        ? $"{CorrectCount}/{TotalQuestions}"
        : "0/0";

    public double AccuracyPercent => TotalQuestions > 0
        ? Math.Round(CorrectCount * 100.0 / TotalQuestions, 1)
        : 0;

    public string AccuracyText => TotalQuestions > 0
        ? $"{AccuracyPercent:F0}%"
        : "—";

    public bool HasMistakes => IncorrectCount > 0;

    // ─── Time Statistics ─────────────────────────────────────────────────

    public double TotalTimeSeconds => _questionResults.Sum(r => r.TimeTakenSeconds);

    public string TotalTimeText => FormatTime(TotalTimeSeconds);

    public double AvgTimeSeconds => TotalQuestions > 0
        ? TotalTimeSeconds / TotalQuestions
        : 0;

    public string AvgTimeText => TotalQuestions > 0
        ? FormatTime(AvgTimeSeconds)
        : "—";

    public double FastestTimeSeconds => _questionResults.Count > 0
        ? _questionResults.Min(r => r.TimeTakenSeconds)
        : 0;

    public string FastestTimeText => _questionResults.Count > 0
        ? FormatTime(FastestTimeSeconds)
        : "—";

    public double SlowestTimeSeconds => _questionResults.Count > 0
        ? _questionResults.Max(r => r.TimeTakenSeconds)
        : 0;

    public string SlowestTimeText => _questionResults.Count > 0
        ? FormatTime(SlowestTimeSeconds)
        : "—";

    // ─── Speed Rating ────────────────────────────────────────────────────

    public string SpeedRating => ComputeSpeedRating();

    public string SpeedRatingIcon => SpeedRating switch
    {
        "Lightning" => "⚡",
        "Fast" => "★",
        "Steady" => "⏳",
        "Careful" => "🧠",
        _ => ""
    };

    private string ComputeSpeedRating()
    {
        if (TotalQuestions == 0) return "—";
        var avgTime = TotalTimeSeconds / TotalQuestions;
        if (avgTime < 5) return "Lightning";
        if (avgTime < 15) return "Fast";
        if (avgTime < 30) return "Steady";
        return "Careful";
    }

    // ─── Streak Properties ───────────────────────────────────────────────

    public int CurrentStreak => ComputeCurrentStreak();

    public int BestStreak => ComputeBestStreak();

    private int ComputeCurrentStreak()
    {
        var streak = 0;
        for (int i = _questionResults.Count - 1; i >= 0; i--)
        {
            if (_questionResults[i].WasCorrect)
                streak++;
            else
                break;
        }
        return streak;
    }

    private int ComputeBestStreak()
    {
        var best = 0;
        var current = 0;
        foreach (var r in _questionResults)
        {
            if (r.WasCorrect)
            {
                current++;
                if (current > best) best = current;
            }
            else
            {
                current = 0;
            }
        }
        return best;
    }

    // ─── Question Results ────────────────────────────────────────────────

    public ObservableCollection<QuestionResultItem> QuestionResults => _questionResults;

    // ─── Session Comparison ──────────────────────────────────────────────

    public SessionSummaryViewModel? PreviousSession
    {
        get => _previousSession;
        set => this.RaiseAndSetIfChanged(ref _previousSession, value);
    }

    public bool HasPreviousSession => _previousSession is not null;

    public string PreviousAccuracyText => _previousSession?.AccuracyText ?? "—";

    public string PreviousTotalTimeText => _previousSession?.TotalTimeText ?? "—";

    public string PreviousSpeedRating => _previousSession?.SpeedRating ?? "—";

    public string PreviousBestStreakText => _previousSession?.BestStreak.ToString() ?? "—";

    public string AccuracyDiffText => ComputeDiffText(AccuracyPercent, _previousSession?.AccuracyPercent ?? 0, "%");

    public string TimeDiffText => ComputeDiffText(TotalTimeSeconds, _previousSession?.TotalTimeSeconds ?? 0, "s", invert: true);

    private string ComputeDiffText(double current, double previous, string unit, bool invert = false)
    {
        if (_previousSession is null || previous == 0) return "";
        var diff = current - previous;
        var isPositive = invert ? diff < 0 : diff > 0;
        var sign = diff >= 0 ? "+" : "";
        var color = isPositive ? "improvement" : "decline";
        return $"{sign}{diff:F1}{unit}";
    }

    // ─── Commands ────────────────────────────────────────────────────────

    public ReactiveCommand<ReactiveUnit, ReactiveUnit> PracticeAgainCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> ReviewMistakesCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> ExportCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> BackToHomeCommand { get; }

    // ─── Command Handlers ────────────────────────────────────────────────

    private void OnPracticeAgain()
    {
        _navigationViewModel?.Navigate("MentalPractice");
    }

    private void OnReviewMistakes()
    {
        var mistakes = _questionResults.Where(r => !r.WasCorrect).ToList();
        if (mistakes.Count == 0) return;

        // Navigate to Focused Practice with mistake topics
        _navigationViewModel?.Navigate("FocusedPractice");
    }

    private void OnExport()
    {
        var sb = new StringBuilder();
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine("         SESSION SUMMARY REPORT        ");
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine();
        sb.AppendLine($"Date: {DateTime.Now:yyyy-MM-dd HH:mm}");
        sb.AppendLine();
        sb.AppendLine($"Score: {ScoreText} ({AccuracyText})");
        sb.AppendLine($"Speed Rating: {SpeedRatingIcon} {SpeedRating}");
        sb.AppendLine($"Best Streak: {BestStreak}");
        sb.AppendLine();
        sb.AppendLine("─── Time Statistics ───");
        sb.AppendLine($"Total Time:    {TotalTimeText}");
        sb.AppendLine($"Average Time:  {AvgTimeText}");
        sb.AppendLine($"Fastest Time:  {FastestTimeText}");
        sb.AppendLine($"Slowest Time:  {SlowestTimeText}");
        sb.AppendLine();
        sb.AppendLine("─── Question Breakdown ───");
        sb.AppendLine();

        for (int i = 0; i < _questionResults.Count; i++)
        {
            var r = _questionResults[i];
            var status = r.WasCorrect ? "✓" : "✗";
            sb.AppendLine($"  {status} Q{i + 1}: {r.QuestionText}");
            sb.AppendLine($"     Your Answer: {r.UserAnswer}");
            if (!r.WasCorrect)
                sb.AppendLine($"     Correct Answer: {r.CorrectAnswer}");
            sb.AppendLine($"     Time: {FormatTime(r.TimeTakenSeconds)}");
            sb.AppendLine();
        }

        sb.AppendLine("═══════════════════════════════════════");

        ExportText = sb.ToString();
        this.RaisePropertyChanged(nameof(ExportText));
        this.RaisePropertyChanged(nameof(HasExportText));
    }

    private void OnBackToHome()
    {
        _navigationViewModel?.Navigate("Home");
    }

    // ─── Export ──────────────────────────────────────────────────────────

    private string _exportText = string.Empty;

    public string ExportText
    {
        get => _exportText;
        set => this.RaiseAndSetIfChanged(ref _exportText, value);
    }

    public bool HasExportText => !string.IsNullOrEmpty(ExportText);

    // ─── Helpers ─────────────────────────────────────────────────────────

    private static string FormatTime(double seconds)
    {
        if (seconds < 60)
            return $"{seconds:F1}s";
        var mins = (int)(seconds / 60);
        var secs = seconds % 60;
        return $"{mins}m {secs:F0}s";
    }
}

public class QuestionResultItem : ViewModelBase
{
    private string _questionText;
    private string _userAnswer;
    private string _correctAnswer;
    private double _timeTakenSeconds;
    private bool _wasCorrect;

    public QuestionResultItem(string questionText, string userAnswer, string correctAnswer, double timeTakenSeconds, bool wasCorrect)
    {
        _questionText = questionText;
        _userAnswer = userAnswer;
        _correctAnswer = correctAnswer;
        _timeTakenSeconds = timeTakenSeconds;
        _wasCorrect = wasCorrect;
    }

    public string QuestionText
    {
        get => _questionText;
        set => this.RaiseAndSetIfChanged(ref _questionText, value);
    }

    public string UserAnswer
    {
        get => _userAnswer;
        set => this.RaiseAndSetIfChanged(ref _userAnswer, value);
    }

    public string CorrectAnswer
    {
        get => _correctAnswer;
        set => this.RaiseAndSetIfChanged(ref _correctAnswer, value);
    }

    public double TimeTakenSeconds
    {
        get => _timeTakenSeconds;
        set
        {
            this.RaiseAndSetIfChanged(ref _timeTakenSeconds, value);
            this.RaisePropertyChanged(nameof(TimeTakenText));
        }
    }

    public string TimeTakenText => FormatTime(_timeTakenSeconds);

    public bool WasCorrect
    {
        get => _wasCorrect;
        set => this.RaiseAndSetIfChanged(ref _wasCorrect, value);
    }

    private static string FormatTime(double seconds)
    {
        if (seconds < 60)
            return $"{seconds:F1}s";
        var mins = (int)(seconds / 60);
        var secs = seconds % 60;
        return $"{mins}m {secs:F0}s";
    }
}
