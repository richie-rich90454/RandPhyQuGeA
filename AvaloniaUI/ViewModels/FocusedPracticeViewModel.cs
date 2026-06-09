using ReactiveUI;

namespace AvaloniaUI.ViewModels;

public class FocusedPracticeViewModel : ViewModelBase
{
    private string _title = "Focused Practice";

    public string Title
    {
        get => _title;
        set => this.RaiseAndSetIfChanged(ref _title, value);
    }
}
