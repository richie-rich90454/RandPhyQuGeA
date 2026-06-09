using Avalonia.Controls;
using AvaloniaUI.ViewModels;

namespace AvaloniaUI.Views;

public class ViewLocator
{
    public static Control? Resolve(ViewModelBase viewModel)
    {
        var name = viewModel.GetType().FullName!
            .Replace("ViewModel", "View", System.StringComparison.Ordinal);
        var type = System.Type.GetType(name);

        if (type is not null)
        {
            return (Control)System.Activator.CreateInstance(type)!;
        }

        return new TextBlock { Text = "Not Found: " + name };
    }
}
