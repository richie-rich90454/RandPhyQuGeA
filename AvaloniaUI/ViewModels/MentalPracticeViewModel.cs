using ReactiveUI;

namespace AvaloniaUI.ViewModels;

public class MentalPracticeViewModel : ViewModelBase
{
    private string _title = "Mental Practice";

    public string Title
    {
        get => _title;
        set => this.RaiseAndSetIfChanged(ref _title, value);
    }
}
