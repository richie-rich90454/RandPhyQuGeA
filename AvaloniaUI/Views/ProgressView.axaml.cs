using System;
using System.Reactive.Disposables;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Interactivity;
using Avalonia.Media;
using AvaloniaUI.ViewModels;
using ReactiveUI;

namespace AvaloniaUI.Views;

public partial class ProgressView : UserControl, IViewFor<ProgressViewModel>
{
    public ProgressView()
    {
        InitializeComponent();

        this.WhenActivated(d =>
        {
            if (DataContext is ProgressViewModel vm)
            {
                vm.LoadCommand.Execute().Subscribe().DisposeWith(d);

                vm.ConfirmClear.RegisterHandler(async interaction =>
                {
                    var result = await ShowConfirmDialog("Clear Progress", interaction.Input);
                    interaction.SetOutput(result);
                }).DisposeWith(d);
            }
        });
    }

    private async Task<bool> ShowConfirmDialog(string title, string message)
    {
        var tcs = new TaskCompletionSource<bool>();

        var overlay = new Border
        {
            Background = new SolidColorBrush(Color.FromArgb(128, 0, 0, 0)),
            HorizontalAlignment = HorizontalAlignment.Stretch,
            VerticalAlignment = VerticalAlignment.Stretch,
            ZIndex = 1000
        };

        var dialog = new Border
        {
            Background = Brushes.White,
            CornerRadius = new CornerRadius(12),
            Padding = new Thickness(32),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            MinWidth = 360,
            MaxWidth = 440,
            BoxShadow = new BoxShadows(new BoxShadow { Color = Colors.Black, BlurX = 16, BlurY = 16, SpreadX = 0, SpreadY = 0, OffsetX = 0, OffsetY = 4 })
        };

        var noButton = new Button
        {
            Content = "Cancel",
            Padding = new Thickness(16, 10),
            CornerRadius = new CornerRadius(8),
            Background = new SolidColorBrush(Color.FromRgb(0xF0, 0xF0, 0xF0)),
            Foreground = Brushes.Black,
        };

        var yesButton = new Button
        {
            Content = "Clear",
            Padding = new Thickness(16, 10),
            CornerRadius = new CornerRadius(8),
            Background = Brushes.Red,
            Foreground = Brushes.White,
            FontWeight = FontWeight.SemiBold,
        };

        noButton.Click += (s, e) =>
        {
            RemoveOverlay();
            tcs.TrySetResult(false);
        };

        yesButton.Click += (s, e) =>
        {
            RemoveOverlay();
            tcs.TrySetResult(true);
        };

        dialog.Child = new StackPanel
        {
            Spacing = 20,
            Children =
            {
                new TextBlock { Text = title, FontSize = 20, FontWeight = FontWeight.Bold },
                new TextBlock { Text = message, FontSize = 14, TextWrapping = TextWrapping.Wrap },
                new StackPanel
                {
                    Orientation = Orientation.Horizontal,
                    Spacing = 12,
                    HorizontalAlignment = HorizontalAlignment.Right,
                    Children = { noButton, yesButton }
                }
            }
        };

        overlay.Child = dialog;

        var parent = this.VisualParent as Panel ?? this.Parent as Panel;
        if (parent is not null)
        {
            parent.Children.Add(overlay);
        }
        else
        {
            tcs.TrySetResult(false);
        }

        void RemoveOverlay()
        {
            var p = this.VisualParent as Panel ?? this.Parent as Panel;
            p?.Children.Remove(overlay);
        }

        return await tcs.Task;
    }

    ProgressViewModel? IViewFor<ProgressViewModel>.ViewModel
    {
        get => DataContext as ProgressViewModel;
        set => DataContext = value;
    }

    object? IViewFor.ViewModel
    {
        get => DataContext;
        set => DataContext = value;
    }
}
