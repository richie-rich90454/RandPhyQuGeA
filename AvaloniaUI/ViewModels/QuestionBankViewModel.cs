using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Reactive;
using System.Reactive.Disposables;
using System.Threading.Tasks;
using ReactiveUI;

namespace AvaloniaUI.ViewModels;

public class QuestionBankViewModel : ViewModelBase, IDisposable
{
    private readonly SpecificationViewModel _specViewModel;
    private readonly NavigationViewModel? _navigationViewModel;
    private readonly CompositeDisposable _subscriptions = new();

    public QuestionBankViewModel(SpecificationViewModel specViewModel) : this(specViewModel, null) { }

    public QuestionBankViewModel(SpecificationViewModel specViewModel, NavigationViewModel? navigationViewModel)
    {
        _specViewModel = specViewModel;
        _navigationViewModel = navigationViewModel;

        FilteredUnitNodes = new ObservableCollection<UnitNode>();

        _subscriptions.Add(this.WhenAnyValue(x => x.SearchText)
            .Subscribe(_ => ApplyFilters()));

        _subscriptions.Add(this.WhenAnyValue(
            x => x.FilterEasy,
            x => x.FilterMedium,
            x => x.FilterHard,
            x => x.FilterMC,
            x => x.FilterSA)
            .Subscribe(_ => ApplyFilters()));

        _subscriptions.Add(this.WhenAnyValue(x => x.SelectedItem)
            .Subscribe(_ => this.RaisePropertyChanged(nameof(PracticeContextText))));

        // Listen for IsLoaded changes instead of every CollectionChanged — avoids O(N²) during spec load
        _subscriptions.Add(this.WhenAnyValue(x => x.SpecViewModel.IsLoaded)
            .Subscribe(loaded => { if (loaded) ApplyFilters(); }));

        var canStartPractice = this.WhenAnyValue(x => x.SelectedItem, sel => sel is SkillNode or TopicNode or UnitNode);
        StartPracticeCommand = ReactiveCommand.Create(OnStartPractice, canStartPractice);

        LoadSpecCommand = ReactiveCommand.Create(OnLoadSpec);
    }

    public SpecificationViewModel SpecViewModel => _specViewModel;

    public ObservableCollection<UnitNode> UnitNodes => _specViewModel.UnitNodes;

    public ObservableCollection<UnitNode> FilteredUnitNodes { get; }

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

    public string PracticeContextText => SelectedItem switch
    {
        SkillNode skill => $"Practice: {skill.Name} ({skill.TemplateCount} templates)",
        TopicNode topic => $"Practice: {topic.Name} ({topic.Skills.Count} skills, {topic.TemplateCount} templates)",
        UnitNode unit => $"Practice: {unit.Name} ({unit.Topics.Sum(t => t.Skills.Count)} skills, {unit.TemplateCount} templates)",
        _ => string.Empty
    };

    public ReactiveCommand<Unit, Unit> StartPracticeCommand { get; }

    public ReactiveCommand<Unit, Unit> LoadSpecCommand { get; }

    private void OnLoadSpec()
    {
        _specViewModel.LoadCommand.Execute();
    }

    private void OnStartPractice()
    {
        string[]? skillIds = null;
        string[]? topicIds = null;

        switch (SelectedItem)
        {
            case SkillNode skill:
                skillIds = new[] { skill.Id };
                break;
            case TopicNode topic:
                topicIds = new[] { topic.Id };
                skillIds = topic.Skills.Select(s => s.Id).ToArray();
                break;
            case UnitNode unit:
                topicIds = unit.Topics.Select(t => t.Id).ToArray();
                skillIds = unit.Topics.SelectMany(t => t.Skills.Select(s => s.Id)).ToArray();
                break;
        }

        _navigationViewModel?.NavigateToFocusedPractice(skillIds, topicIds);
    }

    private void ApplyFilters()
    {
        FilteredUnitNodes.Clear();

        var search = SearchText?.Trim() ?? string.Empty;
        var hasSearch = !string.IsNullOrEmpty(search);

        foreach (var unit in UnitNodes)
        {
            var filteredUnit = FilterUnit(unit, search, hasSearch);
            if (filteredUnit is not null)
                FilteredUnitNodes.Add(filteredUnit);
        }
    }

    private UnitNode? FilterUnit(UnitNode unit, string search, bool hasSearch)
    {
        // Check if unit matches search
        var unitMatchesSearch = !hasSearch ||
            unit.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
            unit.Description.Contains(search, StringComparison.OrdinalIgnoreCase);

        // Filter topics
        var filteredTopics = unit.Topics
            .Select(topic => FilterTopic(topic, search, hasSearch))
            .Where(t => t is not null)
            .Cast<TopicNode>()
            .ToList();

        // Include unit if it matches search directly or has matching children
        if (unitMatchesSearch || filteredTopics.Count > 0)
        {
            // If unit matches search directly, include all its (filtered) children
            if (unitMatchesSearch && !hasSearch)
            {
                // No search active, include all with type/difficulty filters
                var allFilteredTopics = unit.Topics
                    .Select(t => FilterTopic(t, string.Empty, false))
                    .Where(t => t is not null)
                    .Cast<TopicNode>()
                    .ToList();

                var result = new UnitNode(new Core.Domain.Unit(unit.Id, unit.Name, unit.Description));
                foreach (var topic in allFilteredTopics)
                    result.Topics.Add(topic);
                result.TemplateCount = allFilteredTopics.Sum(t => t.TemplateCount);
                result.McCount = allFilteredTopics.Sum(t => t.McCount);
                result.SaCount = allFilteredTopics.Sum(t => t.SaCount);
                result.MinDifficulty = allFilteredTopics.Count > 0 ? allFilteredTopics.Min(t => t.MinDifficulty) : 0;
                result.MaxDifficulty = allFilteredTopics.Count > 0 ? allFilteredTopics.Max(t => t.MaxDifficulty) : 0;
                result.AvgDifficulty = allFilteredTopics.Count > 0 ? allFilteredTopics.Average(t => t.AvgDifficulty) : 0;
                return result;
            }

            if (filteredTopics.Count > 0 || unitMatchesSearch)
            {
                var result = new UnitNode(new Core.Domain.Unit(unit.Id, unit.Name, unit.Description));
                foreach (var topic in unitMatchesSearch && hasSearch
                    ? unit.Topics.Select(t => FilterTopic(t, string.Empty, false)).Where(t => t is not null).Cast<TopicNode>()
                    : filteredTopics)
                    result.Topics.Add(topic);
                result.TemplateCount = result.Topics.Sum(t => t.TemplateCount);
                result.McCount = result.Topics.Sum(t => t.McCount);
                result.SaCount = result.Topics.Sum(t => t.SaCount);
                result.MinDifficulty = result.Topics.Count > 0 ? result.Topics.Min(t => t.MinDifficulty) : 0;
                result.MaxDifficulty = result.Topics.Count > 0 ? result.Topics.Max(t => t.MaxDifficulty) : 0;
                result.AvgDifficulty = result.Topics.Count > 0 ? result.Topics.Average(t => t.AvgDifficulty) : 0;
                return result;
            }
        }

        return null;
    }

    private TopicNode? FilterTopic(TopicNode topic, string search, bool hasSearch)
    {
        var topicMatchesSearch = !hasSearch ||
            topic.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
            topic.Description.Contains(search, StringComparison.OrdinalIgnoreCase);

        var filteredSkills = topic.Skills
            .Where(s => MatchesSkillFilter(s) && (!hasSearch || topicMatchesSearch ||
                s.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                s.Description.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                s.Templates.Any(t => t.TextTemplate.Contains(search, StringComparison.OrdinalIgnoreCase))))
            .ToList();

        if (topicMatchesSearch || filteredSkills.Count > 0)
        {
            var result = new TopicNode(new Core.Domain.Topic(topic.Id, topic.Name, topic.UnitId, topic.Description));
            var skillsToAdd = topicMatchesSearch && hasSearch
                ? topic.Skills.Where(MatchesSkillFilter).ToList()
                : filteredSkills;
            foreach (var skill in skillsToAdd)
                result.Skills.Add(skill);
            result.TemplateCount = result.Skills.Sum(s => s.TemplateCount);
            result.McCount = result.Skills.Sum(s => s.McCount);
            result.SaCount = result.Skills.Sum(s => s.SaCount);
            result.MinDifficulty = result.Skills.Count > 0 ? result.Skills.Min(s => s.MinDifficulty) : 0;
            result.MaxDifficulty = result.Skills.Count > 0 ? result.Skills.Max(s => s.MaxDifficulty) : 0;
            result.AvgDifficulty = result.Skills.Count > 0 ? result.Skills.Average(s => s.AvgDifficulty) : 0;
            return result;
        }

        return null;
    }

    private bool MatchesSkillFilter(SkillNode skill)
    {
        // Difficulty filter
        var difficultyLevel = skill.DifficultyLevel;
        var passesDifficulty = difficultyLevel switch
        {
            "Easy" => FilterEasy,
            "Medium" => FilterMedium,
            "Hard" => FilterHard,
            _ => true
        };

        if (!passesDifficulty) return false;

        // Question type filter
        var hasMc = skill.McCount > 0;
        var hasSa = skill.SaCount > 0;

        if (FilterMC && FilterSA) return true;
        if (FilterMC && hasMc) return true;
        if (FilterSA && hasSa) return true;

        return !FilterMC && !FilterSA;
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

    public void Dispose()
    {
        _subscriptions.Dispose();
    }
}
