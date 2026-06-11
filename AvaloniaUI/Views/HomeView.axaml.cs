using System;
using Avalonia.Controls;
using Avalonia.Interactivity;
using AvaloniaUI.ViewModels;
using System.Reactive.Linq;

namespace AvaloniaUI.Views;

public partial class HomeView : UserControl
{
    public HomeView()
    {
        InitializeComponent();
        DataContextChanged += OnDataContextChanged;
    }

    private void OnDataContextChanged(object? sender, EventArgs e)
    {
        if (DataContext is HomeViewModel vm)
        {
            vm.LoadRecentSessionsCommand.Execute(System.Reactive.Unit.Default).Subscribe();
        }
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
