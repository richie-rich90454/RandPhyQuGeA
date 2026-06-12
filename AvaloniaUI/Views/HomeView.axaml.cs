using System;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Interactivity;
using AvaloniaUI.ViewModels;
using System.Reactive.Linq;

namespace AvaloniaUI.Views;

public partial class HomeView : UserControl
{
    private IDisposable? _loadSubscription;

    public HomeView()
    {
        InitializeComponent();
        DataContextChanged += OnDataContextChanged;
    }

    private void OnDataContextChanged(object? sender, EventArgs e)
    {
        _loadSubscription?.Dispose();
        _loadSubscription = null;

        if (DataContext is HomeViewModel vm)
        {
            _loadSubscription = vm.LoadRecentSessionsCommand.Execute(System.Reactive.Unit.Default).Subscribe();
        }
    }

    protected override void OnDetachedFromVisualTree(VisualTreeAttachmentEventArgs e)
    {
        base.OnDetachedFromVisualTree(e);
        _loadSubscription?.Dispose();
        _loadSubscription = null;
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
