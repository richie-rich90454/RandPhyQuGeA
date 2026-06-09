using Core.Domain;

namespace Core.Interfaces;

public interface ISpecificationLoader
{
    Specification Load(string filePath);
    Task<Specification> LoadAsync(string filePath, CancellationToken cancellationToken = default);
}
