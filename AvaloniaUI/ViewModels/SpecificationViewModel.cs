using System;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Reactive;
using System.Threading.Tasks;
using Core.Domain;
using Core.Interfaces;
using Core.Parsing;
using ReactiveUI;

using ReactiveUnit = System.Reactive.Unit;
using DomainUnit = Core.Domain.Unit;

namespace AvaloniaUI.ViewModels;

public class SpecificationViewModel : ViewModelBase
{
    private readonly ISpecificationLoader _loader;

    private bool _isLoaded;
    private string _errorMessage = string.Empty;
    private bool _isLoading;
    private Specification? _specification;
    private string _specFilePath = "part_one.txt";

    public SpecificationViewModel(ISpecificationLoader loader)
    {
        _loader = loader;

        Units = new ObservableCollection<DomainUnit>();
        Topics = new ObservableCollection<Topic>();
        Skills = new ObservableCollection<Skill>();
        Templates = new ObservableCollection<QuestionTemplate>();

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
        set => this.RaiseAndSetIfChanged(ref _specFilePath, value);
    }

    public ObservableCollection<DomainUnit> Units { get; }
    public ObservableCollection<Topic> Topics { get; }
    public ObservableCollection<Skill> Skills { get; }
    public ObservableCollection<QuestionTemplate> Templates { get; }

    public ReactiveCommand<ReactiveUnit, ReactiveUnit> LoadCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> RetryCommand { get; }

    private async Task LoadSpecification()
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
}
