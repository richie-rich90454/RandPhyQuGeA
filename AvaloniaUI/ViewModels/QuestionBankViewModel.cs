using ReactiveUI;

namespace AvaloniaUI.ViewModels;

public class QuestionBankViewModel : ViewModelBase
{
    private string _title = "Question Bank";

    public string Title
    {
        get => _title;
        set => this.RaiseAndSetIfChanged(ref _title, value);
    }
}
