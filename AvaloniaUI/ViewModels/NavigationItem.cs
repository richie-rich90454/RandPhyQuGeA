namespace AvaloniaUI.ViewModels;

public class NavigationItem
{
    public string Label { get; }
    public string Icon { get; }
    public string ViewKey { get; }

    public NavigationItem(string label, string icon, string viewKey)
    {
        Label = label;
        Icon = icon;
        ViewKey = viewKey;
    }
}
