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
        set => this.RaiseAndSetIfChanged(ref _selectedItem, value);
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
}
