using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Reactive;
using System.Reactive.Disposables;
using System.Threading;
using System.Threading.Tasks;
using Core.Domain;
using Core.Interfaces;
using Core.Parsing;
using ReactiveUI;

using ReactiveUnit = System.Reactive.Unit;
using DomainUnit = Core.Domain.Unit;

namespace AvaloniaUI.ViewModels;

public class SpecificationViewModel : ViewModelBase, IDisposable
{
    private readonly ISpecificationLoader _loader;
    private FileSystemWatcher? _watcher;
    private Timer? _debounceTimer;
    private readonly object _debounceLock = new();

    private bool _isDisposed;
    private bool _isLoaded;
    private string _errorMessage = string.Empty;
    private bool _isLoading;
    private Specification? _specification;
    private string _specFilePath = Path.Combine(AppContext.BaseDirectory, "Data", "part_one.txt");
    private readonly SemaphoreSlim _loadLock = new(1, 1);

    public SpecificationViewModel(ISpecificationLoader loader)
    {
        _loader = loader;

        Units = new ObservableCollection<DomainUnit>();
        Topics = new ObservableCollection<Topic>();
        Skills = new ObservableCollection<Skill>();
        Templates = new ObservableCollection<QuestionTemplate>();
        UnitNodes = new ObservableCollection<UnitNode>();

        var canRetry = this.WhenAnyValue(x => x.ErrorMessage, msg => !string.IsNullOrEmpty(msg));
        LoadCommand = ReactiveCommand.CreateFromTask(LoadSpecification);
        RetryCommand = ReactiveCommand.CreateFromTask(LoadSpecification, canRetry);
    }

    public bool IsLoaded
    {
        get => _isLoaded;
        set => this.RaiseAndSetIfChanged(ref _isLoaded, value);
    }

    public string ErrorMessage
    {
        get => _errorMessage;
        set => this.RaiseAndSetIfChanged(ref _errorMessage, value);
    }

    public bool IsLoading
    {
        get => _isLoading;
        set => this.RaiseAndSetIfChanged(ref _isLoading, value);
    }

    public Specification? Specification
    {
        get => _specification;
        set => this.RaiseAndSetIfChanged(ref _specification, value);
    }

    public string SpecFilePath
    {
        get => _specFilePath;
        set
        {
            var old = _specFilePath;
            this.RaiseAndSetIfChanged(ref _specFilePath, value);
            if (old != value)
            {
                StopWatching();
                StartWatching();
            }
        }
    }

    public ObservableCollection<DomainUnit> Units { get; }
    public ObservableCollection<Topic> Topics { get; }
    public ObservableCollection<Skill> Skills { get; }
    public ObservableCollection<QuestionTemplate> Templates { get; }
    public ObservableCollection<UnitNode> UnitNodes { get; }

    // Summary statistics
    private int _totalUnits;
    private int _totalTopics;
    private int _totalSkills;
    private int _totalTemplates;
    private int _overallMinDifficulty;
    private int _overallMaxDifficulty;
    private double _overallAvgDifficulty;
    private int _totalMcCount;
    private int _totalSaCount;

    public int TotalUnits { get => _totalUnits; set => this.RaiseAndSetIfChanged(ref _totalUnits, value); }
    public int TotalTopics { get => _totalTopics; set => this.RaiseAndSetIfChanged(ref _totalTopics, value); }
    public int TotalSkills { get => _totalSkills; set => this.RaiseAndSetIfChanged(ref _totalSkills, value); }
    public int TotalTemplates { get => _totalTemplates; set => this.RaiseAndSetIfChanged(ref _totalTemplates, value); }
    public int OverallMinDifficulty { get => _overallMinDifficulty; set => this.RaiseAndSetIfChanged(ref _overallMinDifficulty, value); }
    public int OverallMaxDifficulty { get => _overallMaxDifficulty; set => this.RaiseAndSetIfChanged(ref _overallMaxDifficulty, value); }
    public double OverallAvgDifficulty { get => _overallAvgDifficulty; set => this.RaiseAndSetIfChanged(ref _overallAvgDifficulty, value); }
    public int TotalMcCount { get => _totalMcCount; set => this.RaiseAndSetIfChanged(ref _totalMcCount, value); }
    public int TotalSaCount { get => _totalSaCount; set => this.RaiseAndSetIfChanged(ref _totalSaCount, value); }

    public ReactiveCommand<ReactiveUnit, ReactiveUnit> LoadCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> RetryCommand { get; }

    public void StartWatching()
    {
        if (_watcher != null)
            return;

        var fullPath = Path.GetFullPath(SpecFilePath);
        var directory = Path.GetDirectoryName(fullPath);
        var fileName = Path.GetFileName(fullPath);

        if (string.IsNullOrEmpty(directory) || !Directory.Exists(directory))
            return;

        _watcher = new FileSystemWatcher(directory, fileName)
        {
            NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.Size
        };

        _watcher.Changed += OnFileChanged;
        _watcher.EnableRaisingEvents = true;
    }

    public void StopWatching()
    {
        if (_watcher != null)
        {
            _watcher.EnableRaisingEvents = false;
            _watcher.Changed -= OnFileChanged;
            _watcher.Dispose();
            _watcher = null;
        }
    }

    private void OnFileChanged(object sender, FileSystemEventArgs e)
    {
        if (_isDisposed) return;
        lock (_debounceLock)
        {
            _debounceTimer?.Dispose();
            _debounceTimer = new Timer(_ => DebouncedReload(), null, TimeSpan.FromSeconds(1), Timeout.InfiniteTimeSpan);
        }
    }

    private void DebouncedReload()
    {
        if (_isDisposed) return;
        lock (_debounceLock)
        {
            _debounceTimer?.Dispose();
            _debounceTimer = null;
        }

        RxApp.MainThreadScheduler.Schedule(ReactiveUnit.Default, (_, _) =>
        {
            _ = LoadSpecificationSafe();
            return Disposable.Empty;
        });
    }

    private async Task LoadSpecificationSafe()
    {
        try
        {
            await LoadSpecification();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Failed to reload specification: {ex.Message}");
            ErrorMessage = $"Failed to reload specification: {ex.Message}";
        }
    }

    private async Task LoadSpecification()
    {
        await _loadLock.WaitAsync();
        try
        {
            IsLoading = true;
            ErrorMessage = string.Empty;

            try
            {
                if (!File.Exists(SpecFilePath))
                {
                    ErrorMessage = $"Specification file not found: {SpecFilePath}";
                    IsLoaded = false;
                    return;
                }

                var spec = await Task.Run(() => _loader.Load(SpecFilePath));

                Specification = spec;

                // Batch-populate collections to minimize layout invalidations
                Units.Clear();
                foreach (var unit in spec.Units)
                    Units.Add(unit);

                Topics.Clear();
                foreach (var topic in spec.Topics)
                    Topics.Add(topic);

                Skills.Clear();
                foreach (var skill in spec.Skills)
                    Skills.Add(skill);

                Templates.Clear();
                foreach (var template in spec.Templates)
                    Templates.Add(template);

                // Build hierarchy last — this populates UnitNodes which triggers ApplyFilters
                BuildHierarchy(spec);

                IsLoaded = true;
            }
            catch (ParseException ex)
            {
                var errorLines = ex.Errors.Select(e => $"Line {e.LineNumber}: {e.Message}");
                ErrorMessage = $"Parse error: {string.Join(Environment.NewLine, errorLines)}";
                IsLoaded = false;
            }
            catch (FileNotFoundException ex)
            {
                ErrorMessage = $"File not found: {ex.Message}";
                IsLoaded = false;
            }
            catch (IOException ex)
            {
                ErrorMessage = $"I/O error reading specification: {ex.Message}";
                IsLoaded = false;
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Error loading specification: {ex.Message}";
                IsLoaded = false;
            }
            finally
            {
                IsLoading = false;
            }
        }
        finally
        {
            _loadLock.Release();
        }
    }

    private static bool IsMcType(string questionType) =>
        questionType.StartsWith("MC", StringComparison.OrdinalIgnoreCase) ||
        questionType.Equals("MultipleChoice", StringComparison.OrdinalIgnoreCase);

    private static bool IsSaType(string questionType) =>
        questionType.StartsWith("SA", StringComparison.OrdinalIgnoreCase) ||
        questionType.Equals("ShortAnswer", StringComparison.OrdinalIgnoreCase);

    private void BuildHierarchy(Specification spec)
    {
        // Build the entire hierarchy off-screen first, then set in one shot
        var skillNodes = spec.Skills.Select(s => new SkillNode(s)).ToList();
        var topicNodes = spec.Topics.Select(t => new TopicNode(t)).ToList();
        var unitNodes = spec.Units.Select(u => new UnitNode(u)).ToList();

        var templatesBySkill = spec.Templates.GroupBy(t => t.SkillId).ToDictionary(g => g.Key, g => g.ToList());

        foreach (var skillNode in skillNodes)
        {
            if (templatesBySkill.TryGetValue(skillNode.Id, out var templates))
            {
                foreach (var template in templates)
                    skillNode.Templates.Add(new TemplateNode(template));
            }
            skillNode.TemplateCount = skillNode.Templates.Count;
            skillNode.McCount = skillNode.Templates.Count(t => IsMcType(t.QuestionType));
            skillNode.SaCount = skillNode.Templates.Count(t => IsSaType(t.QuestionType));

            if (skillNode.Templates.Count > 0)
            {
                skillNode.MinDifficulty = skillNode.Templates.Min(t => t.Difficulty);
                skillNode.MaxDifficulty = skillNode.Templates.Max(t => t.Difficulty);
                skillNode.AvgDifficulty = skillNode.Templates.Average(t => t.Difficulty);
            }
        }

        var skillNodesByTopic = skillNodes.GroupBy(s => s.TopicId).ToDictionary(g => g.Key, g => g.ToList());

        foreach (var topicNode in topicNodes)
        {
            if (skillNodesByTopic.TryGetValue(topicNode.Id, out var skills))
            {
                foreach (var skill in skills)
                    topicNode.Skills.Add(skill);
            }
            topicNode.TemplateCount = topicNode.Skills.Sum(s => s.TemplateCount);
            topicNode.McCount = topicNode.Skills.Sum(s => s.McCount);
            topicNode.SaCount = topicNode.Skills.Sum(s => s.SaCount);

            var allTemplates = topicNode.Skills.SelectMany(s => s.Templates).ToList();
            if (allTemplates.Count > 0)
            {
                topicNode.MinDifficulty = allTemplates.Min(t => t.Difficulty);
                topicNode.MaxDifficulty = allTemplates.Max(t => t.Difficulty);
                topicNode.AvgDifficulty = allTemplates.Average(t => t.Difficulty);
            }
        }

        var topicNodesByUnit = topicNodes.GroupBy(t => t.UnitId).ToDictionary(g => g.Key, g => g.ToList());

        foreach (var unitNode in unitNodes)
        {
            if (topicNodesByUnit.TryGetValue(unitNode.Id, out var topics))
            {
                foreach (var topic in topics)
                    unitNode.Topics.Add(topic);
            }
            unitNode.TemplateCount = unitNode.Topics.Sum(t => t.TemplateCount);
            unitNode.McCount = unitNode.Topics.Sum(t => t.McCount);
            unitNode.SaCount = unitNode.Topics.Sum(t => t.SaCount);

            var allTemplates = unitNode.Topics.SelectMany(t => t.Skills).SelectMany(s => s.Templates).ToList();
            if (allTemplates.Count > 0)
            {
                unitNode.MinDifficulty = allTemplates.Min(t => t.Difficulty);
                unitNode.MaxDifficulty = allTemplates.Max(t => t.Difficulty);
                unitNode.AvgDifficulty = allTemplates.Average(t => t.Difficulty);
            }
        }

        // Batch-add all unit nodes at once to fire only ONE CollectionChanged
        UnitNodes.Clear();
        foreach (var unitNode in unitNodes)
            UnitNodes.Add(unitNode);

        // Compute summary statistics
        TotalUnits = unitNodes.Count;
        TotalTopics = unitNodes.Sum(u => u.Topics.Count);
        TotalSkills = unitNodes.Sum(u => u.Topics.Sum(t => t.Skills.Count));
        TotalTemplates = unitNodes.Sum(u => u.TemplateCount);
        TotalMcCount = unitNodes.Sum(u => u.McCount);
        TotalSaCount = unitNodes.Sum(u => u.SaCount);

        var allSpecTemplates = unitNodes.SelectMany(u => u.Topics.SelectMany(t => t.Skills.SelectMany(s => s.Templates))).ToList();
        if (allSpecTemplates.Count > 0)
        {
            OverallMinDifficulty = allSpecTemplates.Min(t => t.Difficulty);
            OverallMaxDifficulty = allSpecTemplates.Max(t => t.Difficulty);
            OverallAvgDifficulty = allSpecTemplates.Average(t => t.Difficulty);
        }
    }

    public IReadOnlyList<QuestionTemplate> GetLoadedTemplates() => Templates.ToList();

    public async Task EnsureLoadedAsync()
    {
        if (!IsLoaded)
        {
            await LoadSpecification();
        }
    }

    public void Dispose()
    {
        if (_isDisposed) return;
        lock (_debounceLock)
        {
            StopWatching();
            _debounceTimer?.Dispose();
            _debounceTimer = null;
        }
        _isDisposed = true;
        GC.SuppressFinalize(this);
    }
}
