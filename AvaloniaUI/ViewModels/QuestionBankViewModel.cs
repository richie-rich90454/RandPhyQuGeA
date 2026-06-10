using System;
using System.Collections.ObjectModel;
using System.Linq;
using ReactiveUI;

namespace AvaloniaUI.ViewModels;

public class QuestionBankViewModel : ViewModelBase
{
    private readonly SpecificationViewModel _specViewModel;

    public QuestionBankViewModel(SpecificationViewModel specViewModel)
    {
        _specViewModel = specViewModel;
    }

    public SpecificationViewModel SpecViewModel => _specViewModel;

    public ObservableCollection<UnitNode> UnitNodes => _specViewModel.UnitNodes;

    public bool HasData => _specViewModel.IsLoaded && _specViewModel.UnitNodes.Count > 0;

    private object? _selectedItem;
    public object? SelectedItem
    {
        get => _selectedItem;
        set
        {
            this.RaiseAndSetIfChanged(ref _selectedItem, value);
            UpdateDetailProperties();
        }
    }

    // Detail panel properties
    private string _detailTitle = string.Empty;
    public string DetailTitle
    {
        get => _detailTitle;
        set => this.RaiseAndSetIfChanged(ref _detailTitle, value);
    }

    private string _detailDescription = string.Empty;
    public string DetailDescription
    {
        get => _detailDescription;
        set => this.RaiseAndSetIfChanged(ref _detailDescription, value);
    }

    private string _detailDifficultyRange = string.Empty;
    public string DetailDifficultyRange
    {
        get => _detailDifficultyRange;
        set => this.RaiseAndSetIfChanged(ref _detailDifficultyRange, value);
    }

    private string _detailQuestionTypes = string.Empty;
    public string DetailQuestionTypes
    {
        get => _detailQuestionTypes;
        set => this.RaiseAndSetIfChanged(ref _detailQuestionTypes, value);
    }

    private string _detailTemplateCount = string.Empty;
    public string DetailTemplateCount
    {
        get => _detailTemplateCount;
        set => this.RaiseAndSetIfChanged(ref _detailTemplateCount, value);
    }

    private ObservableCollection<TemplateNode> _detailTemplates = new();
    public ObservableCollection<TemplateNode> DetailTemplates
    {
        get => _detailTemplates;
        set => this.RaiseAndSetIfChanged(ref _detailTemplates, value);
    }

    private bool _hasSelection;
    public bool HasSelection
    {
        get => _hasSelection;
        set => this.RaiseAndSetIfChanged(ref _hasSelection, value);
    }

    private bool _isSkillSelected;
    public bool IsSkillSelected
    {
        get => _isSkillSelected;
        set => this.RaiseAndSetIfChanged(ref _isSkillSelected, value);
    }

    private string _searchText = string.Empty;
    public string SearchText
    {
        get => _searchText;
        set => this.RaiseAndSetIfChanged(ref _searchText, value);
    }

    private bool _filterEasy = true;
    public bool FilterEasy
    {
        get => _filterEasy;
        set => this.RaiseAndSetIfChanged(ref _filterEasy, value);
    }

    private bool _filterMedium = true;
    public bool FilterMedium
    {
        get => _filterMedium;
        set => this.RaiseAndSetIfChanged(ref _filterMedium, value);
    }

    private bool _filterHard = true;
    public bool FilterHard
    {
        get => _filterHard;
        set => this.RaiseAndSetIfChanged(ref _filterHard, value);
    }

    private bool _filterMC = true;
    public bool FilterMC
    {
        get => _filterMC;
        set => this.RaiseAndSetIfChanged(ref _filterMC, value);
    }

    private bool _filterSA = true;
    public bool FilterSA
    {
        get => _filterSA;
        set => this.RaiseAndSetIfChanged(ref _filterSA, value);
    }

    private void UpdateDetailProperties()
    {
        HasSelection = SelectedItem is not null;
        IsSkillSelected = SelectedItem is SkillNode;

        DetailTemplates.Clear();

        switch (SelectedItem)
        {
            case UnitNode unit:
                DetailTitle = unit.Name;
                DetailDescription = unit.Description;
                DetailDifficultyRange = unit.MinDifficulty > 0
                    ? $"Difficulty: {unit.MinDifficulty}–{unit.MaxDifficulty} (avg {unit.AvgDifficulty:F1})"
                    : "No templates";
                DetailQuestionTypes = $"MC: {unit.McCount}, SA: {unit.SaCount}";
                DetailTemplateCount = $"{unit.TemplateCount} templates";
                break;

            case TopicNode topic:
                DetailTitle = topic.Name;
                DetailDescription = topic.Description;
                DetailDifficultyRange = topic.MinDifficulty > 0
                    ? $"Difficulty: {topic.MinDifficulty}–{topic.MaxDifficulty} (avg {topic.AvgDifficulty:F1})"
                    : "No templates";
                DetailQuestionTypes = $"MC: {topic.McCount}, SA: {topic.SaCount}";
                DetailTemplateCount = $"{topic.TemplateCount} templates";
                break;

            case SkillNode skill:
                DetailTitle = skill.Name;
                DetailDescription = skill.Description;
                DetailDifficultyRange = skill.MinDifficulty > 0
                    ? $"Difficulty: {skill.MinDifficulty}–{skill.MaxDifficulty} (avg {skill.AvgDifficulty:F1})"
                    : "No templates";
                DetailQuestionTypes = $"MC: {skill.McCount}, SA: {skill.SaCount}";
                DetailTemplateCount = $"{skill.TemplateCount} templates";
                foreach (var template in skill.Templates)
                    DetailTemplates.Add(template);
                break;

            default:
                DetailTitle = string.Empty;
                DetailDescription = string.Empty;
                DetailDifficultyRange = string.Empty;
                DetailQuestionTypes = string.Empty;
                DetailTemplateCount = string.Empty;
                break;
        }
    }
}
