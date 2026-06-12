using Avalonia.Controls;
using Avalonia.Controls.Presenters;
using Avalonia.Input;
using Avalonia.Interactivity;
using Avalonia.VisualTree;
using AvaloniaUI.ViewModels;
using System;

using ReactiveUnit = System.Reactive.Unit;

namespace AvaloniaUI.Views;

public partial class FocusedPracticeView : UserControl
{
    private static readonly string[] ChoiceLetters = { "A", "B", "C", "D", "E", "F", "G", "H" };

    public FocusedPracticeView()
    {
        InitializeComponent();

        var combo = this.FindControl<ComboBox>("QuestionCountCombo");
        if (combo is not null)
        {
            combo.SelectionChanged += OnQuestionCountChanged;
        }

        DataContextChanged += OnDataContextChanged;
    }

    private void OnDataContextChanged(object? sender, EventArgs e)
    {
        if (DataContext is FocusedPracticeViewModel vm)
        {
            vm.CopyToClipboardRequested -= OnCopyToClipboardRequested;
            vm.CopyToClipboardRequested += OnCopyToClipboardRequested;
        }
    }

    private async void OnCopyToClipboardRequested(object? sender, string text)
    {
        var topLevel = TopLevel.GetTopLevel(this);
        if (topLevel is not null)
        {
            var clipboard = topLevel.Clipboard;
            if (clipboard is not null)
            {
                await clipboard.SetTextAsync(text);
            }
        }
    }

    private void OnQuestionCountChanged(object? sender, SelectionChangedEventArgs e)
    {
        if (DataContext is FocusedPracticeViewModel vm && sender is ComboBox combo)
        {
            var index = combo.SelectedIndex;
            vm.QuestionCount = index switch
            {
                0 => 5,
                1 => 10,
                2 => 15,
                3 => 20,
                4 => 0, // All
                _ => 10
            };
        }
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

        if (mcBtn is not null)
        {
            mcBtn.Classes.Remove("type-selected");
            mcBtn.Classes.Remove("secondary");
            if (selected == "MC") mcBtn.Classes.Add("type-selected");
            else mcBtn.Classes.Add("secondary");
        }
        if (saBtn is not null)
        {
            saBtn.Classes.Remove("type-selected");
            saBtn.Classes.Remove("secondary");
            if (selected == "SA") saBtn.Classes.Add("type-selected");
            else saBtn.Classes.Add("secondary");
        }
        if (mixedBtn is not null)
        {
            mixedBtn.Classes.Remove("type-selected");
            mixedBtn.Classes.Remove("secondary");
            if (selected == "Mixed") mixedBtn.Classes.Add("type-selected");
            else mixedBtn.Classes.Add("secondary");
        }
    }

    // ─── MC Answer Selection ─────────────────────────────────────────

    private void OnChoiceCardLoaded(object? sender, global::Avalonia.Interactivity.RoutedEventArgs e)
    {
        // Set the choice letter (A, B, C, D...) based on the item index
        if (sender is Border border)
        {
            var itemsControl = border.FindAncestorOfType<ItemsControl>();
            if (itemsControl is not null)
            {
                // Find the index by iterating containers
                var index = -1;
                for (int i = 0; i < itemsControl.ItemCount; i++)
                {
                    var container = itemsControl.ContainerFromIndex(i);
                    if (container is ContentPresenter cp && cp.Child == border)
                    {
                        index = i;
                        break;
                    }
                }

                if (index >= 0 && index < ChoiceLetters.Length)
                {
                    var letterText = border.FindControl<TextBlock>("ChoiceLetter");
                    if (letterText is not null)
                        letterText.Text = ChoiceLetters[index];
                }
            }
        }
    }

    private void OnMcChoiceClick(object? sender, PointerPressedEventArgs e)
    {
        if (DataContext is not FocusedPracticeViewModel vm) return;
        if (vm.IsAnswerSubmitted) return;

        // Walk up from the clicked element to find the ItemsControl
        if (sender is Border border)
        {
            var itemsControl = border.FindAncestorOfType<ItemsControl>();
            if (itemsControl is not null && vm.CurrentQuestion?.Choices is { Count: > 0 })
            {
                // Find the index by iterating containers
                var index = -1;
                for (int i = 0; i < vm.CurrentQuestion.Choices.Count; i++)
                {
                    var container = itemsControl.ContainerFromIndex(i);
                    if (container is ContentPresenter cp && cp.Child is Border childBorder && childBorder == border)
                    {
                        index = i;
                        break;
                    }
                }

                if (index >= 0 && index < vm.CurrentQuestion.Choices.Count)
                {
                    vm.SelectedAnswer = vm.CurrentQuestion.Choices[index];
                }
            }
        }
    }

    private void OnChoiceKeyDown(object? sender, KeyEventArgs e)
    {
        if (e.Key != Key.Enter && e.Key != Key.Space) return;
        if (DataContext is not FocusedPracticeViewModel vm) return;
        if (vm.IsAnswerSubmitted) return;

        if (sender is Border border)
        {
            var itemsControl = border.FindAncestorOfType<ItemsControl>();
            if (itemsControl is not null && vm.CurrentQuestion?.Choices is { Count: > 0 })
            {
                var index = -1;
                for (int i = 0; i < vm.CurrentQuestion.Choices.Count; i++)
                {
                    var container = itemsControl.ContainerFromIndex(i);
                    if (container is ContentPresenter cp && cp.Child is Border childBorder && childBorder == border)
                    {
                        index = i;
                        break;
                    }
                }

                if (index >= 0 && index < vm.CurrentQuestion.Choices.Count)
                {
                    vm.SelectedAnswer = vm.CurrentQuestion.Choices[index];
                    e.Handled = true;
                }
            }
        }
    }

    private void OnMcConfirmClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is FocusedPracticeViewModel vm && !vm.IsAnswerSubmitted)
        {
            vm.SubmitAnswerCommand.Execute(System.Reactive.Unit.Default);
        }
    }

    // ─── SA Answer Submission ─────────────────────────────────────────

    private void OnSaAnswerKeyDown(object? sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter && DataContext is FocusedPracticeViewModel vm && !vm.IsAnswerSubmitted)
        {
            vm.SubmitAnswerCommand.Execute(System.Reactive.Unit.Default);
            e.Handled = true;
        }
    }

    private void OnSaSubmitClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is FocusedPracticeViewModel vm && !vm.IsAnswerSubmitted)
        {
            vm.SubmitAnswerCommand.Execute(System.Reactive.Unit.Default);
        }
    }
}
