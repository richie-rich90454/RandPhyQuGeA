using System.Globalization;
using Core.Domain;
using Core.Interfaces;

namespace Core.Parsing;

public sealed class PartOneTextLoader : ISpecificationLoader
{
    public Specification Load(string filePath)
    {
        var lines = File.ReadAllLines(filePath);
        return Parse(lines);
    }

    public async Task<Specification> LoadAsync(string filePath, CancellationToken cancellationToken = default)
    {
        var lines = await File.ReadAllLinesAsync(filePath, cancellationToken);
        return Parse(lines);
    }

    private static Specification Parse(string[] lines)
    {
        var errors = new List<ParseError>();
        var units = new List<Unit>();
        var topics = new List<Topic>();
        var skills = new List<Skill>();
        var templates = new List<QuestionTemplate>();

        string? currentSection = null;
        var currentBlock = new Dictionary<string, List<string>>();

        for (int i = 0; i < lines.Length; i++)
        {
            var rawLine = lines[i];
            var line = rawLine.Trim();
            var lineNumber = i + 1;

            if (string.IsNullOrEmpty(line) || line.StartsWith("//"))
                continue;

            if (line.StartsWith('[') && line.EndsWith(']'))
            {
                if (currentSection != null && currentBlock.Count > 0)
                {
                    ProcessBlock(currentSection, currentBlock, lineNumber - 1, units, topics, skills, templates, errors);
                }

                currentSection = line[1..^1].ToUpperInvariant();
                currentBlock = new Dictionary<string, List<string>>();
                continue;
            }

            if (currentSection == null)
            {
                errors.Add(new ParseError(lineNumber, "Content found before any section header."));
                continue;
            }

            var colonIndex = line.IndexOf(':');
            if (colonIndex < 0)
            {
                errors.Add(new ParseError(lineNumber, "Expected key:value pair."));
                continue;
            }

            var key = line[..colonIndex].Trim();
            var value = line[(colonIndex + 1)..].Trim();

            if (!currentBlock.TryGetValue(key, out var list))
            {
                list = new List<string>();
                currentBlock[key] = list;
            }
            list.Add(value);
        }

        if (currentSection != null && currentBlock.Count > 0)
        {
            ProcessBlock(currentSection, currentBlock, lines.Length, units, topics, skills, templates, errors);
        }

        ValidateCrossReferences(units, topics, skills, templates, errors);

        if (errors.Count > 0)
        {
            throw new ParseException(errors);
        }

        return new Specification(units, topics, skills, templates);
    }

    private static void ProcessBlock(
        string section,
        Dictionary<string, List<string>> block,
        int lineNumber,
        List<Unit> units,
        List<Topic> topics,
        List<Skill> skills,
        List<QuestionTemplate> templates,
        List<ParseError> errors)
    {
        try
        {
            switch (section)
            {
                case "UNIT":
                    var unit = ParseUnit(block);
                    if (unit != null) units.Add(unit);
                    break;
                case "TOPIC":
                    var topic = ParseTopic(block);
                    if (topic != null) topics.Add(topic);
                    break;
                case "SKILL":
                    var skill = ParseSkill(block);
                    if (skill != null) skills.Add(skill);
                    break;
                case "TEMPLATE":
                    var template = ParseTemplate(block);
                    if (template != null) templates.Add(template);
                    break;
                default:
                    errors.Add(new ParseError(lineNumber, $"Unknown section [{section}]."));
                    break;
            }
        }
        catch (Exception ex)
        {
            errors.Add(new ParseError(lineNumber, ex.Message));
        }
    }

    private static Unit? ParseUnit(Dictionary<string, List<string>> block)
    {
        var id = GetSingle(block, "Id");
        var name = GetSingle(block, "Name");
        var description = GetSingle(block, "Description");
        if (id == null || name == null) return null;
        return new Unit(id, name, description ?? string.Empty);
    }

    private static Topic? ParseTopic(Dictionary<string, List<string>> block)
    {
        var id = GetSingle(block, "Id");
        var name = GetSingle(block, "Name");
        var unitId = GetSingle(block, "UnitId");
        var description = GetSingle(block, "Description");
        if (id == null || name == null || unitId == null) return null;
        return new Topic(id, name, unitId, description ?? string.Empty);
    }

    private static Skill? ParseSkill(Dictionary<string, List<string>> block)
    {
        var id = GetSingle(block, "Id");
        var name = GetSingle(block, "Name");
        var topicId = GetSingle(block, "TopicId");
        var description = GetSingle(block, "Description");
        if (id == null || name == null || topicId == null) return null;
        return new Skill(id, name, topicId, description ?? string.Empty);
    }

    private static QuestionTemplate? ParseTemplate(Dictionary<string, List<string>> block)
    {
        var id = GetSingle(block, "Id");
        var topicId = GetSingle(block, "TopicId");
        var skillId = GetSingle(block, "SkillId");
        var questionType = GetSingle(block, "QuestionType");
        var difficultyStr = GetSingle(block, "Difficulty");
        var textTemplate = GetSingle(block, "TextTemplate");
        var answerExpression = GetSingle(block, "AnswerExpression");
        var solutionTemplate = GetSingle(block, "SolutionTemplate");

        if (id == null || topicId == null || skillId == null || questionType == null || difficultyStr == null || textTemplate == null || answerExpression == null)
            return null;

        if (!int.TryParse(difficultyStr, out var difficulty))
            throw new FormatException($"Invalid Difficulty value '{difficultyStr}'. Expected integer.");

        var variableDefinitions = ParseVariableDefinitions(block);
        var distractorExpressions = GetMultiple(block, "Distractor");

        return new QuestionTemplate(
            id,
            topicId,
            skillId,
            questionType,
            difficulty,
            textTemplate,
            answerExpression,
            solutionTemplate ?? string.Empty,
            variableDefinitions,
            distractorExpressions
        );
    }

    private static IReadOnlyList<VariableDefinition> ParseVariableDefinitions(Dictionary<string, List<string>> block)
    {
        var result = new List<VariableDefinition>();
        var keys = block.Keys.Where(k => k.StartsWith("Var.", StringComparison.OrdinalIgnoreCase)).ToList();

        foreach (var key in keys)
        {
            var name = key[4..]; // after "Var."
            var parts = block[key];
            foreach (var part in parts)
            {
                var vd = ParseVariableDefinition(name, part);
                if (vd != null) result.Add(vd);
            }
        }

        return result;
    }

    private static VariableDefinition? ParseVariableDefinition(string name, string value)
    {
        // Format: Type=double;Min=1;Max=10;Step=1
        // or Type=enum;Values=A,B,C
        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var segment in value.Split(';'))
        {
            var trimmed = segment.Trim();
            if (string.IsNullOrEmpty(trimmed)) continue;
            var eq = trimmed.IndexOf('=');
            if (eq < 0) continue;
            dict[trimmed[..eq].Trim()] = trimmed[(eq + 1)..].Trim();
        }

        if (!dict.TryGetValue("Type", out var type))
            return null;

        double? min = null, max = null, step = null;
        if (dict.TryGetValue("Min", out var minStr) && double.TryParse(minStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var minVal))
            min = minVal;
        if (dict.TryGetValue("Max", out var maxStr) && double.TryParse(maxStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var maxVal))
            max = maxVal;
        if (dict.TryGetValue("Step", out var stepStr) && double.TryParse(stepStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var stepVal))
            step = stepVal;

        IReadOnlyList<string>? enumValues = null;
        if (dict.TryGetValue("Values", out var valuesStr))
        {
            enumValues = valuesStr.Split(',').Select(v => v.Trim()).Where(v => !string.IsNullOrEmpty(v)).ToList();
        }

        return new VariableDefinition(name, type, min, max, step, enumValues);
    }

    private static string? GetSingle(Dictionary<string, List<string>> block, string key)
    {
        var match = block.Keys.FirstOrDefault(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
        if (match == null) return null;
        var values = block[match];
        return values.Count > 0 ? values[0] : null;
    }

    private static IReadOnlyList<string> GetMultiple(Dictionary<string, List<string>> block, string key)
    {
        var match = block.Keys.FirstOrDefault(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
        if (match == null) return Array.Empty<string>();
        return block[match].AsReadOnly();
    }

    private static void ValidateCrossReferences(
        List<Unit> units,
        List<Topic> topics,
        List<Skill> skills,
        List<QuestionTemplate> templates,
        List<ParseError> errors)
    {
        var unitIds = new HashSet<string>(units.Select(u => u.Id));
        var topicIds = new HashSet<string>(topics.Select(t => t.Id));
        var skillIds = new HashSet<string>(skills.Select(s => s.Id));

        foreach (var topic in topics)
        {
            if (!unitIds.Contains(topic.UnitId))
            {
                errors.Add(new ParseError(0, $"Topic '{topic.Id}' references unknown Unit '{topic.UnitId}'."));
            }
        }

        foreach (var skill in skills)
        {
            if (!topicIds.Contains(skill.TopicId))
            {
                errors.Add(new ParseError(0, $"Skill '{skill.Id}' references unknown Topic '{skill.TopicId}'."));
            }
        }

        foreach (var template in templates)
        {
            if (!topicIds.Contains(template.TopicId))
            {
                errors.Add(new ParseError(0, $"Template '{template.Id}' references unknown Topic '{template.TopicId}'."));
            }
            if (!skillIds.Contains(template.SkillId))
            {
                errors.Add(new ParseError(0, $"Template '{template.Id}' references unknown Skill '{template.SkillId}'."));
            }
        }
    }
}
