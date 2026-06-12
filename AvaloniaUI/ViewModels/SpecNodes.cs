using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using Core.Domain;

namespace AvaloniaUI.ViewModels;

public sealed class UnitNode : INotifyPropertyChanged
{
    public string Id { get; }
    public string Name { get; }
    public string Description { get; }
    public List<TopicNode> Topics { get; } = new();

    private int _templateCount;
    public int TemplateCount
    {
        get => _templateCount;
        set => SetField(ref _templateCount, value);
    }

    private int _minDifficulty;
    public int MinDifficulty
    {
        get => _minDifficulty;
        set => SetField(ref _minDifficulty, value);
    }

    private int _maxDifficulty;
    public int MaxDifficulty
    {
        get => _maxDifficulty;
        set => SetField(ref _maxDifficulty, value);
    }

    private double _avgDifficulty;
    public double AvgDifficulty
    {
        get => _avgDifficulty;
        set => SetField(ref _avgDifficulty, value);
    }

    private int _mcCount;
    public int McCount
    {
        get => _mcCount;
        set => SetField(ref _mcCount, value);
    }

    private int _saCount;
    public int SaCount
    {
        get => _saCount;
        set => SetField(ref _saCount, value);
    }

    public UnitNode(Unit unit)
    {
        Id = unit.Id;
        Name = unit.Name;
        Description = unit.Description;
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));

    private bool SetField<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value)) return false;
        field = value;
        OnPropertyChanged(propertyName);
        return true;
    }
}

public sealed class TopicNode : INotifyPropertyChanged
{
    public string Id { get; }
    public string Name { get; }
    public string Description { get; }
    public string UnitId { get; }
    public List<SkillNode> Skills { get; } = new();

    private int _templateCount;
    public int TemplateCount
    {
        get => _templateCount;
        set => SetField(ref _templateCount, value);
    }

    private int _minDifficulty;
    public int MinDifficulty
    {
        get => _minDifficulty;
        set => SetField(ref _minDifficulty, value);
    }

    private int _maxDifficulty;
    public int MaxDifficulty
    {
        get => _maxDifficulty;
        set => SetField(ref _maxDifficulty, value);
    }

    private double _avgDifficulty;
    public double AvgDifficulty
    {
        get => _avgDifficulty;
        set => SetField(ref _avgDifficulty, value);
    }

    private int _mcCount;
    public int McCount
    {
        get => _mcCount;
        set => SetField(ref _mcCount, value);
    }

    private int _saCount;
    public int SaCount
    {
        get => _saCount;
        set => SetField(ref _saCount, value);
    }

    public TopicNode(Topic topic)
    {
        Id = topic.Id;
        Name = topic.Name;
        Description = topic.Description;
        UnitId = topic.UnitId;
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));

    private bool SetField<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value)) return false;
        field = value;
        OnPropertyChanged(propertyName);
        return true;
    }
}

public sealed class SkillNode : INotifyPropertyChanged
{
    public string Id { get; }
    public string Name { get; }
    public string Description { get; }
    public string TopicId { get; }
    public List<TemplateNode> Templates { get; } = new();

    private int _templateCount;
    public int TemplateCount
    {
        get => _templateCount;
        set => SetField(ref _templateCount, value);
    }

    private int _minDifficulty;
    public int MinDifficulty
    {
        get => _minDifficulty;
        set => SetField(ref _minDifficulty, value);
    }

    private int _maxDifficulty;
    public int MaxDifficulty
    {
        get => _maxDifficulty;
        set => SetField(ref _maxDifficulty, value);
    }

    private double _avgDifficulty;
    public double AvgDifficulty
    {
        get => _avgDifficulty;
        set => SetField(ref _avgDifficulty, value);
    }

    private int _mcCount;
    public int McCount
    {
        get => _mcCount;
        set => SetField(ref _mcCount, value);
    }

    private int _saCount;
    public int SaCount
    {
        get => _saCount;
        set => SetField(ref _saCount, value);
    }

    public string DifficultyLevel => AvgDifficulty switch
    {
        <= 3 => "Easy",
        <= 6 => "Medium",
        _ => "Hard"
    };

    public SkillNode(Skill skill)
    {
        Id = skill.Id;
        Name = skill.Name;
        Description = skill.Description;
        TopicId = skill.TopicId;
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));

    private bool SetField<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value)) return false;
        field = value;
        OnPropertyChanged(propertyName);
        return true;
    }
}

public sealed class TemplateNode
{
    public string Id { get; }
    public string TextTemplate { get; }
    public string QuestionType { get; }
    public int Difficulty { get; }
    public string AnswerExpression { get; }

    public TemplateNode(QuestionTemplate template)
    {
        Id = template.Id;
        TextTemplate = template.TextTemplate;
        QuestionType = template.QuestionType;
        Difficulty = template.Difficulty;
        AnswerExpression = template.AnswerExpression;
    }
}
