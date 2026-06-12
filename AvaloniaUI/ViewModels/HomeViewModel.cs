using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Reactive;
using System.Threading.Tasks;
using Core.Interfaces;
using ReactiveUI;

using ReactiveUnit = System.Reactive.Unit;

namespace AvaloniaUI.ViewModels;

public class HomeViewModel : ViewModelBase
{
    private readonly IPracticeResultRepository? _resultRepository;
    private string _welcomeTitle = "Physics Question Generator";
    private string _welcomeDescription = "Generate practice questions from specification files with LaTeX support and multiple export formats.";
    private string _dailyQuote = string.Empty;
    private string _dailyQuoteAuthor = string.Empty;
    private ObservableCollection<HomeRecentSessionItem> _recentSessions = new();
    private bool _hasRecentSessions;
    private string _errorMessage = string.Empty;

    private static readonly (string Quote, string Author)[] Quotes =
    {
        ("The important thing is not to stop questioning.", "Albert Einstein"),
        ("Physics is experience, arranged in economical order.", "Ernst Mach"),
        ("In physics, you don't have to go around making trouble for yourself — nature does it for you.", "Frank Wilczek"),
        ("The universe is under no obligation to make sense to you.", "Neil deGrasse Tyson"),
        ("What we know is a drop, what we don't know is an ocean.", "Isaac Newton"),
        ("The good thing about science is that it's true whether or not you believe in it.", "Neil deGrasse Tyson"),
        ("Imagination is more important than knowledge.", "Albert Einstein"),
        ("Nothing happens until something moves.", "Albert Einstein"),
        ("Physics is like sex: sure, it may give some practical results, but that's not why we do it.", "Richard Feynman"),
        ("If you can't explain it simply, you don't understand it well enough.", "Albert Einstein"),
    };

    public HomeViewModel() : this(null) { }

    public HomeViewModel(IPracticeResultRepository? resultRepository)
    {
        _resultRepository = resultRepository;

        var today = DateTime.UtcNow.DayOfYear;
        var (quote, author) = Quotes[today % Quotes.Length];
        _dailyQuote = quote;
        _dailyQuoteAuthor = author;

        LoadRecentSessionsCommand = ReactiveCommand.CreateFromTask(LoadRecentSessionsAsync);
    }

    public string WelcomeTitle
    {
        get => _welcomeTitle;
        set => this.RaiseAndSetIfChanged(ref _welcomeTitle, value);
    }

    public string WelcomeDescription
    {
        get => _welcomeDescription;
        set => this.RaiseAndSetIfChanged(ref _welcomeDescription, value);
    }

    public string DailyQuote => _dailyQuote;

    public string DailyQuoteAuthor => $"— {_dailyQuoteAuthor}";

    public ObservableCollection<HomeRecentSessionItem> RecentSessions
    {
        get => _recentSessions;
        set => this.RaiseAndSetIfChanged(ref _recentSessions, value);
    }

    public bool HasRecentSessions
    {
        get => _hasRecentSessions;
        set => this.RaiseAndSetIfChanged(ref _hasRecentSessions, value);
    }

    public string ErrorMessage
    {
        get => _errorMessage;
        set => this.RaiseAndSetIfChanged(ref _errorMessage, value);
    }

    public ReactiveCommand<ReactiveUnit, ReactiveUnit> LoadRecentSessionsCommand { get; }

    private async Task LoadRecentSessionsAsync()
    {
        if (_resultRepository is null) return;

        try
        {
            var results = await _resultRepository.LoadAsync();

            var sessions = results
                .GroupBy(r => r.Timestamp.Date)
                .OrderByDescending(g => g.Key)
                .Take(5)
                .Select(g =>
                {
                    var total = g.Count();
                    var correct = g.Count(r => r.IsCorrect);
                    return new HomeRecentSessionItem
                    {
                        DateText = g.Key.ToString("MMM dd, yyyy"),
                        ScoreText = $"{correct}/{total}",
                        AccuracyText = total > 0 ? $"{correct * 100.0 / total:F0}%" : "—"
                    };
                })
                .ToList();

            RecentSessions = new ObservableCollection<HomeRecentSessionItem>(sessions);
            HasRecentSessions = sessions.Count > 0;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Failed to load recent sessions: {ex.Message}");
            ErrorMessage = $"Failed to load recent sessions: {ex.Message}";
        }
    }
}

public class HomeRecentSessionItem : ViewModelBase
{
    public string DateText { get; init; } = string.Empty;
    public string ScoreText { get; init; } = string.Empty;
    public string AccuracyText { get; init; } = string.Empty;
}
