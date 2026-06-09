using Avalonia.Controls;
using Avalonia.Interactivity;

namespace AvaloniaUI.Views;

public partial class AboutDialog : Window
{
    public AboutDialog()
    {
        InitializeComponent();
    }

    private void OK_Click(object? sender, RoutedEventArgs e)
    {
        Close();
    }
}
