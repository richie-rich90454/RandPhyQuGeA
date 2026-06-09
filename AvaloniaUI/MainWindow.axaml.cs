using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;
using AvaloniaUI.ViewModels;

namespace AvaloniaUI;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        KeyDown += (s, e) =>
        {
            if (e.Key == Key.F1)
            {
                var helpWindow = new Views.HelpWindow();
                helpWindow.Show(this);
            }
        };
    }

    public MainWindow(MainWindowViewModel viewModel) : this()
    {
        DataContext = viewModel;
    }

    private void ClearFilters_Click(object? sender, RoutedEventArgs e)
    {
        if (DataContext is MainWindowViewModel vm)
        {
            vm.SelectedTopicId = null;
            vm.SelectedSkillId = null;
            vm.SelectedDifficulty = null;
            vm.SelectedQuestionType = null;
        }
    }

    private void Help_Click(object? sender, RoutedEventArgs e)
    {
        var helpWindow = new Views.HelpWindow();
        helpWindow.Show(this);
    }

    private void About_Click(object? sender, RoutedEventArgs e)
    {
        var aboutDialog = new Views.AboutDialog();
        aboutDialog.ShowDialog(this);
    }
}
