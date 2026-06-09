using ReactiveUI;

namespace AvaloniaUI.ViewModels;

public class ProgressViewModel : ViewModelBase
{
    private string _title = "Progress";

    public string Title
    {
        get => _title;
        set => this.RaiseAndSetIfChanged(ref _title, value);
    }
}
