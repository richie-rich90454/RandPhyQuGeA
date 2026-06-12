using System.Reflection;
using Avalonia.Controls;
using Avalonia.Interactivity;

namespace AvaloniaUI.Views;

public partial class AboutDialog : Window
{
    public string AppVersion { get; } =
        Assembly.GetEntryAssembly()?.GetName().Version?.ToString() ?? "1.0.0";

    public AboutDialog()
    {
        InitializeComponent();
        DataContext = this;
    }

    private void OK_Click(object? sender, RoutedEventArgs e)
    {
        Close();
    }
}
