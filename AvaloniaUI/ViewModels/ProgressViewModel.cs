using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Reactive;
using System.Reactive.Linq;
using System.Reactive.Threading.Tasks;
using System.Threading.Tasks;
using Core.Domain;
using Core.Interfaces;
using ReactiveUI;
using ReactiveUnit = System.Reactive.Unit;

namespace AvaloniaUI.ViewModels;

public class ProgressViewModel : ViewModelBase
{
    private readonly IPracticeResultRepository? _resultRepository;
    private readonly SpecificationViewModel? _specificationViewModel;
    private string _title = "Progress";
    private int _totalSessions;
    private int _totalQuestions;
    private double _overallAccuracy;
    private string _averageTimeText = "\u2014";
    private int _bestStreak;
    private int _currentStreak;
    private bool _isLoading;
    private bool _hasData;
    private bool _isLoaded;
    private ObservableCollection<RecentSessionItem> _recentResults = new();
    private ObservableCollection<TopicPerformanceItem> _topicPerformances = new();
    private ObservableCollection<DifficultyBarItem> _difficultyBars = new();
    private ObservableCollection<CalendarWeekItem> _calendarWeeks = new();

    public ProgressViewModel()
    {
        LoadCommand = ReactiveCommand.CreateFromTask(LoadDataAsync);
        RefreshCommand = ReactiveCommand.CreateFromTask(RefreshDataAsync);
        ClearCommand = ReactiveCommand.CreateFromTask(ClearDataAsync);
        ConfirmClear = new Interaction<string, bool>();
    }

    public ProgressViewModel(IPracticeResultRepository? resultRepository, SpecificationViewModel? specificationViewModel = null)
    {
        _resultRepository = resultRepository;
        _specificationViewModel = specificationViewModel;

        LoadCommand = ReactiveCommand.CreateFromTask(LoadDataAsync);
        RefreshCommand = ReactiveCommand.CreateFromTask(RefreshDataAsync);
        ClearCommand = ReactiveCommand.CreateFromTask(ClearDataAsync);
        ConfirmClear = new Interaction<string, bool>();
    }

    public string Title
    {
        get => _title;
        set => this.RaiseAndSetIfChanged(ref _title, value);
    }

    public int TotalSessions
    {
        get => _totalSessions;
        set => this.RaiseAndSetIfChanged(ref _totalSessions, value);
    }

    public int TotalQuestions
    {
        get => _totalQuestions;
        set => this.RaiseAndSetIfChanged(ref _totalQuestions, value);
    }

    public double OverallAccuracy
    {
        get => _overallAccuracy;
        set
        {
            this.RaiseAndSetIfChanged(ref _overallAccuracy, value);
            this.RaisePropertyChanged(nameof(OverallAccuracyText));
        }
    }

    public string OverallAccuracyText => _overallAccuracy > 0 ? $"{_overallAccuracy:F0}%" : "\u2014";

    public string AverageTimeText
    {
        get => _averageTimeText;
        set => this.RaiseAndSetIfChanged(ref _averageTimeText, value);
    }

    public int BestStreak
    {
        get => _bestStreak;
        set => this.RaiseAndSetIfChanged(ref _bestStreak, value);
    }

    public int CurrentStreak
    {
        get => _currentStreak;
        set => this.RaiseAndSetIfChanged(ref _currentStreak, value);
    }

    public bool IsLoading
    {
        get => _isLoading;
        set => this.RaiseAndSetIfChanged(ref _isLoading, value);
    }

    public bool HasData
    {
        get => _hasData;
        set => this.RaiseAndSetIfChanged(ref _hasData, value);
    }

    public ObservableCollection<RecentSessionItem> RecentResults
    {
        get => _recentResults;
        set => this.RaiseAndSetIfChanged(ref _recentResults, value);
    }

    public ObservableCollection<TopicPerformanceItem> TopicPerformances
    {
        get => _topicPerformances;
        set => this.RaiseAndSetIfChanged(ref _topicPerformances, value);
    }

    public ObservableCollection<DifficultyBarItem> DifficultyBars
    {
        get => _difficultyBars;
        set => this.RaiseAndSetIfChanged(ref _difficultyBars, value);
    }

    public ObservableCollection<CalendarWeekItem> CalendarWeeks
    {
        get => _calendarWeeks;
        set => this.RaiseAndSetIfChanged(ref _calendarWeeks, value);
    }

    public ReactiveCommand<ReactiveUnit, ReactiveUnit> LoadCommand { get; }

    public ReactiveCommand<ReactiveUnit, ReactiveUnit> RefreshCommand { get; }

    public ReactiveCommand<ReactiveUnit, ReactiveUnit> ClearCommand { get; }

    public bool NeedsReload => !_isLoaded;

    public Interaction<string, bool> ConfirmClear { get; }

    private async Task LoadDataAsync()
    {
        if (_isLoaded) return;
        await LoadDataCoreAsync();
    }

    private async Task RefreshDataAsync()
    {
        _isLoaded = false;
        await LoadDataCoreAsync();
    }

    private async Task LoadDataCoreAsync()
    {
        if (_resultRepository is null) return;

        IsLoading = true;
        try
        {
            var results = await _resultRepository.LoadAsync();

            if (results.Count == 0)
            {
                HasData = false;
                TotalSessions = 0;
                TotalQuestions = 0;
                OverallAccuracy = 0;
                AverageTimeText = "\u2014";
                BestStreak = 0;
                CurrentStreak = 0;
                RecentResults.Clear();
                TopicPerformances.Clear();
                DifficultyBars.Clear();
                CalendarWeeks.Clear();
                _isLoaded = true;
                return;
            }

            HasData = true;

            // Basic statistics
            TotalQuestions = results.Count;
            var correctCount = results.Count(r => r.IsCorrect);
            OverallAccuracy = TotalQuestions > 0
                ? Math.Round(correctCount * 100.0 / TotalQuestions, 1)
                : 0;

            var avgTimeSeconds = results.Average(r => r.TimeTaken.TotalSeconds);
            AverageTimeText = FormatTime(avgTimeSeconds);

            // Sessions (group by date)
            var sessions = results
                .GroupBy(r => r.Timestamp.Date)
                .OrderByDescending(g => g.Key)
                .ToList();
            TotalSessions = sessions.Count;

            // Streaks
            var sortedResults = results.OrderBy(r => r.Timestamp).ToList();
            BestStreak = ComputeBestStreak(sortedResults);
            CurrentStreak = ComputeCurrentStreak(sortedResults);

            // Recent sessions
            RecentResults.Clear();
            foreach (var item in sessions.Take(10).Select(g =>
            {
                var total = g.Count();
                var correct = g.Count(r => r.IsCorrect);
                return new RecentSessionItem
                {
                    Date = g.Key,
                    DateText = g.Key.ToString("MMM dd, yyyy"),
                    ScoreText = $"{correct}/{total}",
                    Accuracy = total > 0 ? Math.Round(correct * 100.0 / total, 1) : 0,
                    AccuracyText = total > 0 ? $"{correct * 100.0 / total:F0}%" : "\u2014",
                    TimeText = FormatTime(g.Sum(r => r.TimeTaken.TotalSeconds)),
                    QuestionCount = total,
                    CorrectCount = correct
                };
            }))
            {
                RecentResults.Add(item);
            }

            // Topic performance
            ComputeTopicPerformance(results);

            // Difficulty distribution
            ComputeDifficultyDistribution(results);

            // Calendar
            ComputeCalendar(results);
            _isLoaded = true;
        }
        finally
        {
            IsLoading = false;
        }
    }

    private async Task ClearDataAsync()
    {
        if (_resultRepository is null) return;

        try
        {
            var confirmed = await ConfirmClear.Handle(
                "Are you sure you want to clear all progress data? This action cannot be undone.").FirstAsync();
            if (!confirmed) return;
        }
        catch
        {
            return;
        }

        await _resultRepository.ClearAsync();
        _isLoaded = false;
        await LoadDataCoreAsync();
    }

    private void ComputeTopicPerformance(IReadOnlyList<PracticeResult> results)
    {
        var topicNames = new Dictionary<string, string>();
        if (_specificationViewModel is not null)
        {
            foreach (var topic in _specificationViewModel.Topics)
                topicNames[topic.Id] = topic.Name;
        }

        var topicGroups = results
            .GroupBy(r => r.TopicId)
            .OrderByDescending(g => g.Count())
            .ToList();

        var maxCount = topicGroups.Count > 0 ? topicGroups.Max(g => g.Count()) : 1;

        TopicPerformances.Clear();
        foreach (var item in topicGroups.Select(g =>
        {
            var total = g.Count();
            var correct = g.Count(r => r.IsCorrect);
            var name = topicNames.TryGetValue(g.Key, out var n) ? n : g.Key;
            return new TopicPerformanceItem
            {
                TopicName = name,
                TotalQuestions = total,
                CorrectQuestions = correct,
                Accuracy = total > 0 ? Math.Round(correct * 100.0 / total, 1) : 0,
                AccuracyText = total > 0 ? $"{correct * 100.0 / total:F0}%" : "\u2014",
                BarWidth = maxCount > 0 ? (double)total / maxCount * 200 : 0
            };
        }))
        {
            TopicPerformances.Add(item);
        }
    }

    private void ComputeDifficultyDistribution(IReadOnlyList<PracticeResult> results)
    {
        var difficultyGroups = results
            .Where(r => r.Difficulty > 0)
            .GroupBy(r => r.Difficulty)
            .OrderBy(g => g.Key)
            .ToDictionary(g => g.Key, g => g.Count());

        var maxCount = difficultyGroups.Count > 0 ? difficultyGroups.Values.Max() : 1;

        var bars = new List<DifficultyBarItem>();
        for (int d = 1; d <= 10; d++)
        {
            var count = difficultyGroups.TryGetValue(d, out var c) ? c : 0;
            bars.Add(new DifficultyBarItem
            {
                Difficulty = d,
                Count = count,
                BarWidth = maxCount > 0 ? (double)count / maxCount * 200 : 0,
                Label = d switch
                {
                    <= 3 => "Easy",
                    <= 6 => "Medium",
                    _ => "Hard"
                },
                ColorKey = d switch
                {
                    <= 3 => "BadgeEasyBrush",
                    <= 6 => "BadgeMediumBrush",
                    _ => "BadgeHardBrush"
                }
            });
        }

        DifficultyBars.Clear();
        foreach (var bar in bars)
        {
            DifficultyBars.Add(bar);
        }
    }

    private void ComputeCalendar(IReadOnlyList<PracticeResult> results)
    {
        var today = DateTime.UtcNow.Date;
        var startDate = today.AddDays(-(7 * 12) - (int)today.DayOfWeek);

        var dateCounts = results
            .GroupBy(r => r.Timestamp.Date)
            .ToDictionary(g => g.Key, g => g.Count());

        var maxCount = dateCounts.Count > 0 ? dateCounts.Values.Max() : 1;

        var weeks = new List<CalendarWeekItem>();
        var current = startDate;
        while (current <= today)
        {
            var week = new CalendarWeekItem();
            for (int day = 0; day < 7; day++)
            {
                var date = current.AddDays(day);
                var count = dateCounts.TryGetValue(date, out var c) ? c : 0;
                var intensity = count switch
                {
                    0 => 0,
                    <= 5 => 1,
                    <= 15 => 2,
                    <= 30 => 3,
                    _ => 4
                };
                week.Days.Add(new CalendarDayItem
                {
                    Date = date,
                    QuestionCount = count,
                    IntensityLevel = intensity,
                    Tooltip = count > 0 ? $"{date:MMM dd}: {count} questions" : $"{date:MMM dd}: No practice"
                });
            }
            weeks.Add(week);
            current = current.AddDays(7);
        }

        CalendarWeeks.Clear();
        foreach (var week in weeks.TakeLast(12))
        {
            CalendarWeeks.Add(week);
        }
    }

    private static int ComputeBestStreak(List<PracticeResult> results)
    {
        var best = 0;
        var current = 0;
        foreach (var r in results)
        {
            if (r.IsCorrect)
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

    private static int ComputeCurrentStreak(List<PracticeResult> results)
    {
        var streak = 0;
        for (int i = results.Count - 1; i >= 0; i--)
        {
            if (results[i].IsCorrect)
                streak++;
            else
                break;
        }
        return streak;
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

public class RecentSessionItem : ViewModelBase
{
    public DateTime Date { get; init; }
    public string DateText { get; init; } = string.Empty;
    public string ScoreText { get; init; } = string.Empty;
    public double Accuracy { get; init; }
    public string AccuracyText { get; init; } = string.Empty;
    public string TimeText { get; init; } = string.Empty;
    public int QuestionCount { get; init; }
    public int CorrectCount { get; init; }
}

public class TopicPerformanceItem : ViewModelBase
{
    public string TopicName { get; init; } = string.Empty;
    public int TotalQuestions { get; init; }
    public int CorrectQuestions { get; init; }
    public double Accuracy { get; init; }
    public string AccuracyText { get; init; } = string.Empty;
    public double BarWidth { get; init; }
}

public class DifficultyBarItem : ViewModelBase
{
    public int Difficulty { get; init; }
    public int Count { get; init; }
    public double BarWidth { get; init; }
    public string Label { get; init; } = string.Empty;
    public string ColorKey { get; init; } = "BadgeMediumBrush";
}

public class CalendarDayItem : ViewModelBase
{
    public DateTime Date { get; init; }
    public int QuestionCount { get; init; }
    public int IntensityLevel { get; init; }
    public string Tooltip { get; init; } = string.Empty;
    public bool HasActivity => QuestionCount > 0;
}

public class CalendarWeekItem : ViewModelBase
{
    public ObservableCollection<CalendarDayItem> Days { get; init; } = new();
}
