using ReactiveUI;

namespace AvaloniaUI.ViewModels;

public class HomeViewModel : ViewModelBase
{
    private string _welcomeTitle = "Physics Question Generator";
    private string _welcomeDescription = "Generate practice questions from specification files with LaTeX support and multiple export formats.";

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
}
