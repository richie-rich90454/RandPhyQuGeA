using Avalonia;
using Avalonia.Controls;
using Avalonia.Interactivity;
using Avalonia.Media;
using AvaloniaUI.ViewModels;

namespace AvaloniaUI.Views;

public partial class FocusedPracticeView : UserControl
{
    public FocusedPracticeView()
    {
        InitializeComponent();
    }

    private void OnQuestionTypeMCClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is FocusedPracticeViewModel vm)
        {
            vm.QuestionType = "MC";
            UpdateQuestionTypeButtons("MC");
        }
    }

    private void OnQuestionTypeSAClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is FocusedPracticeViewModel vm)
        {
            vm.QuestionType = "SA";
            UpdateQuestionTypeButtons("SA");
        }
    }

    private void OnQuestionTypeMixedClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is FocusedPracticeViewModel vm)
        {
            vm.QuestionType = "Mixed";
            UpdateQuestionTypeButtons("Mixed");
        }
    }

    private void UpdateQuestionTypeButtons(string selected)
    {
        var mcBtn = this.FindControl<Button>("BtnTypeMC");
        var saBtn = this.FindControl<Button>("BtnTypeSA");
        var mixedBtn = this.FindControl<Button>("BtnTypeMixed");

        var app = Application.Current;
        if (app is null) return;

        var activeBrush = app.FindResource("BadgeMCBrush") as IBrush;
        var inactiveBrush = app.FindResource("Neutral10Brush") as IBrush;
        var activeFg = app.FindResource("TextOnPrimaryBrush") as IBrush;
        var inactiveFg = app.FindResource("TextPrimaryBrush") as IBrush;

        if (mcBtn is not null)
        {
            mcBtn.Background = selected == "MC" ? activeBrush : inactiveBrush;
            mcBtn.Foreground = selected == "MC" ? activeFg : inactiveFg;
            mcBtn.FontWeight = selected == "MC" ? FontWeight.SemiBold : FontWeight.Normal;
        }
        if (saBtn is not null)
        {
            saBtn.Background = selected == "SA" ? activeBrush : inactiveBrush;
            saBtn.Foreground = selected == "SA" ? activeFg : inactiveFg;
            saBtn.FontWeight = selected == "SA" ? FontWeight.SemiBold : FontWeight.Normal;
        }
        if (mixedBtn is not null)
        {
            mixedBtn.Background = selected == "Mixed" ? activeBrush : inactiveBrush;
            mixedBtn.Foreground = selected == "Mixed" ? activeFg : inactiveFg;
            mixedBtn.FontWeight = selected == "Mixed" ? FontWeight.SemiBold : FontWeight.Normal;
        }
    }
}
