using System.Globalization;
using System.Text.RegularExpressions;
using Core.Domain;
using Core.Interfaces;

namespace Core.Services;

public class QuestionGenerator
{
    private readonly ITemplateRepository _templateRepository;
    private readonly IRandomValueGenerator _random;
    private readonly IExpressionEvaluator _evaluator;
    private readonly IDistractorGenerator _distractorGenerator;
    private readonly ISolutionBuilder _solutionBuilder;
    private readonly Random _shuffleRandom = new();

    public QuestionGenerator(
        ITemplateRepository templateRepository,
        IRandomValueGenerator random,
        IExpressionEvaluator evaluator,
        IDistractorGenerator distractorGenerator,
        ISolutionBuilder solutionBuilder)
    {
        _templateRepository = templateRepository;
        _random = random;
        _evaluator = evaluator;
        _distractorGenerator = distractorGenerator;
        _solutionBuilder = solutionBuilder;
    }

    public GeneratedQuestion? Generate(string? topicId = null, string? skillId = null, int? difficulty = null, string? questionType = null)
    {
        var template = GetRandomTemplate(topicId, skillId, difficulty, questionType);
        if (template is null)
            return null;

        var variables = GenerateVariables(template.VariableDefinitions);
        var text = SubstituteVariables(template.TextTemplate, variables);
        var answerValue = _evaluator.Evaluate(template.AnswerExpression, variables);
        var answer = FormatAnswer(answerValue);

        IReadOnlyList<string>? choices = null;
        if (template.QuestionType == "MC")
        {
            var distractors = _distractorGenerator.Generate(answer, template, variables).ToList();
            var allChoices = new List<string>(distractors) { answer };
            Shuffle(allChoices);
            choices = allChoices;
        }

        var solutionText = _solutionBuilder.BuildPlainText(template, variables);
        var solutionLaTeX = _solutionBuilder.BuildLaTeX(template, variables);

        return new GeneratedQuestion(
            Id: Guid.NewGuid().ToString("N"),
            TopicId: template.TopicId,
            SkillId: template.SkillId,
            QuestionType: template.QuestionType,
            Difficulty: template.Difficulty,
            Text: text,
            Answer: answer,
            Choices: choices,
            SolutionText: solutionText,
            SolutionLaTeX: solutionLaTeX,
            Variables: variables
        );
    }

    public IReadOnlyList<GeneratedQuestion> GenerateBatch(int count, string? topicId = null, string? skillId = null, int? difficulty = null, string? questionType = null)
    {
        var results = new List<GeneratedQuestion>();
        for (int i = 0; i < count; i++)
        {
            var question = Generate(topicId, skillId, difficulty, questionType);
            if (question is not null)
                results.Add(question);
        }
        return results;
    }

    private QuestionTemplate? GetRandomTemplate(string? topicId, string? skillId, int? difficulty, string? questionType)
    {
        IReadOnlyList<QuestionTemplate> candidates;

        if (!string.IsNullOrEmpty(topicId) && !string.IsNullOrEmpty(skillId))
        {
            candidates = _templateRepository.GetByTopic(topicId)
                .Where(t => t.SkillId == skillId)
                .ToList();
        }
        else if (!string.IsNullOrEmpty(topicId))
        {
            candidates = _templateRepository.GetByTopic(topicId);
        }
        else if (!string.IsNullOrEmpty(skillId))
        {
            candidates = _templateRepository.GetBySkill(skillId);
        }
        else
        {
            candidates = _templateRepository.GetAll();
        }

        if (difficulty.HasValue)
            candidates = candidates.Where(t => t.Difficulty == difficulty.Value).ToList();

        if (!string.IsNullOrEmpty(questionType))
            candidates = candidates.Where(t => t.QuestionType == questionType).ToList();

        if (candidates.Count == 0)
            return null;

        var index = _random.NextInt(0, candidates.Count - 1);
        return candidates[index];
    }

    private Dictionary<string, object> GenerateVariables(IReadOnlyList<VariableDefinition> definitions)
    {
        var variables = new Dictionary<string, object>();
        foreach (var def in definitions)
        {
            object value = def.Type switch
            {
                "int" => _random.NextInt((int)def.Min!, (int)def.Max!),
                "double" => _random.NextDouble(def.Min!.Value, def.Max!.Value, def.Step ?? 1.0),
                "enum" => _random.NextFromSet(def.EnumValues!),
                _ => throw new NotSupportedException($"Variable type '{def.Type}' is not supported.")
            };
            variables[def.Name] = value;
        }
        return variables;
    }

    private static string SubstituteVariables(string template, IReadOnlyDictionary<string, object> variables)
    {
        return Regex.Replace(template, @"\{(\w+)\}", match =>
        {
            var varName = match.Groups[1].Value;
            return variables.TryGetValue(varName, out var value) ? FormatVariableValue(value) : match.Value;
        });
    }

    private static string FormatVariableValue(object value)
    {
        if (value is double d)
            return d.ToString("G", CultureInfo.InvariantCulture);
        return value.ToString() ?? string.Empty;
    }

    private static string FormatAnswer(double value)
    {
        var formatted = value.ToString("F4", CultureInfo.InvariantCulture);
        formatted = formatted.TrimEnd('0');
        if (formatted.EndsWith('.'))
            formatted = formatted[..^1];
        return formatted;
    }

    private void Shuffle<T>(List<T> list)
    {
        for (int i = list.Count - 1; i > 0; i--)
        {
            int j = _shuffleRandom.Next(i + 1);
            (list[i], list[j]) = (list[j], list[i]);
        }
    }
}
