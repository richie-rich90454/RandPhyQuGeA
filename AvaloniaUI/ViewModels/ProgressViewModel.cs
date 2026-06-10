using Core.Interfaces;
using ReactiveUI;

namespace AvaloniaUI.ViewModels;

public class ProgressViewModel : ViewModelBase
{
    private readonly IPracticeResultRepository? _resultRepository;
    private string _title = "Progress";

    public ProgressViewModel() { }

    public ProgressViewModel(IPracticeResultRepository? resultRepository)
    {
        _resultRepository = resultRepository;
    }

    public string Title
    {
        get => _title;
        set => this.RaiseAndSetIfChanged(ref _title, value);
    }
}
