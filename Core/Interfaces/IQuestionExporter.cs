using Core.Domain;

namespace Core.Interfaces;

public interface IQuestionExporter
{
    void Export(IEnumerable<GeneratedQuestion> questions, Stream output);
}
