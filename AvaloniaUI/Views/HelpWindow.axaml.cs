using Avalonia.Controls;
using Avalonia.Interactivity;

namespace AvaloniaUI.Views;

public partial class HelpWindow : Window
{
    public HelpWindow()
    {
        InitializeComponent();
    }

    private void Close_Click(object? sender, RoutedEventArgs e)
    {
        Close();
    }
}
