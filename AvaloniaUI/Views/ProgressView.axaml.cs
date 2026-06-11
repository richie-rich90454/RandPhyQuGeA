using System;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.VisualTree;
using AvaloniaUI.ViewModels;

namespace AvaloniaUI.Views;

public partial class ProgressView : UserControl
{
    private IDisposable? _clearSubscription;

    public ProgressView()
    {
        InitializeComponent();
        DataContextChanged += OnDataContextChanged;
    }

    private void OnDataContextChanged(object? sender, EventArgs e)
    {
        _clearSubscription?.Dispose();
        _clearSubscription = null;

        if (DataContext is ProgressViewModel vm)
        {
            if (vm.NeedsReload)
            {
                vm.LoadCommand.Execute().Subscribe();
            }

            _clearSubscription = vm.ConfirmClear.RegisterHandler(async interaction =>
            {
                var confirmed = await ShowConfirmDialog(interaction.Input);
                interaction.SetOutput(confirmed);
            });
        }
    }

    private async Task<bool> ShowConfirmDialog(string message)
    {
        var window = new Window
        {
            Title = "Clear Progress",
            Width = 400,
            Height = 180,
            WindowStartupLocation = WindowStartupLocation.CenterOwner,
            CanResize = false,
            Background = Application.Current?.FindResource("CardBackgroundBrush") as IBrush ?? Brushes.White
        };

        var tcs = new TaskCompletionSource<bool>();

        var cancelBtn = new Button
        {
            Content = "Cancel",
            Padding = new Avalonia.Thickness(16, 8),
            CornerRadius = new Avalonia.CornerRadius(6),
            Background = Application.Current?.FindResource("Neutral20Brush") as IBrush,
            Foreground = Application.Current?.FindResource("TextPrimaryBrush") as IBrush
        };
        cancelBtn.Click += (_, _) =>
        {
            tcs.TrySetResult(false);
            window.Close();
        };

        var clearBtn = new Button
        {
            Content = "Clear",
            Padding = new Avalonia.Thickness(16, 8),
            CornerRadius = new Avalonia.CornerRadius(6),
            Background = Application.Current?.FindResource("ErrorBrush") as IBrush,
            Foreground = Brushes.White
        };
        clearBtn.Click += (_, _) =>
        {
            tcs.TrySetResult(true);
            window.Close();
        };

        window.Content = new StackPanel
        {
            Margin = new Avalonia.Thickness(24),
            Spacing = 20,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                new TextBlock
                {
                    Text = message,
                    TextWrapping = TextWrapping.Wrap,
                    FontSize = 14,
                    Foreground = Application.Current?.FindResource("TextPrimaryBrush") as IBrush
                },
                new StackPanel
                {
                    Orientation = Orientation.Horizontal,
                    HorizontalAlignment = HorizontalAlignment.Right,
                    Spacing = 8,
                    Children = { cancelBtn, clearBtn }
                }
            }
        };

        var owner = this.FindAncestorOfType<Window>();
        if (owner is not null)
        {
            await window.ShowDialog(owner);
        }
        else
        {
            window.Show();
            await tcs.Task;
        }

        return await tcs.Task;
    }
}
