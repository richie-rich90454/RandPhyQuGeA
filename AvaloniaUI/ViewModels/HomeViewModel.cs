using ReactiveUI;

namespace AvaloniaUI.ViewModels;

public class HomeViewModel : ViewModelBase
{
    private string _welcomeTitle = "Physics Question Generator";
    private string _welcomeDescription = "Generate practice questions from specification files with LaTeX support and multiple export formats.";
    private string _dailyQuote = string.Empty;
    private string _dailyQuoteAuthor = string.Empty;

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

    public HomeViewModel()
    {
        var today = System.DateTime.UtcNow.DayOfYear;
        var (quote, author) = Quotes[today % Quotes.Length];
        _dailyQuote = quote;
        _dailyQuoteAuthor = author;
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
}
