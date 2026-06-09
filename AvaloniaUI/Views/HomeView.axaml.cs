using Avalonia.Controls;
using Avalonia.Interactivity;
using AvaloniaUI.ViewModels;

namespace AvaloniaUI.Views;

public partial class HomeView : UserControl
{
    public HomeView()
    {
        InitializeComponent();
    }

    private void StartMentalPractice_Click(object? sender, RoutedEventArgs e)
    {
        NavigateTo("MentalPractice");
    }

    private void StartFocusedPractice_Click(object? sender, RoutedEventArgs e)
    {
        NavigateTo("FocusedPractice");
    }

    private void NavigateTo(string viewKey)
    {
        if (TopLevel.GetTopLevel(this) is Window window
            && window.DataContext is MainWindowViewModel vm)
        {
            vm.Navigation.Navigate(viewKey);
        }
    }
}
