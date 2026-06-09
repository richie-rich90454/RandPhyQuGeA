using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Reactive;
using System.Threading.Tasks;
using Core.Domain;
using Core.Interfaces;
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

        LoadCommand = ReactiveCommand.CreateFromTask(LoadSpecification);
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

    private async Task LoadSpecification()
    {
        IsLoading = true;
        ErrorMessage = string.Empty;

        try
        {
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
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
            IsLoaded = false;
        }
        finally
        {
            IsLoading = false;
        }
    }
}
