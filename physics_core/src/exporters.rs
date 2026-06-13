//! Export modules for converting generated questions to various formats.
//!
//! Supports HTML (with MathJax), Markdown, plain text, and PDF-ready HTML
//! formats for printing, sharing, and further processing.

use crate::domain::GeneratedQuestion;

pub fn export_html(questions: &[GeneratedQuestion]) -> String {
    let mut html = String::new();
    html.push_str("<!DOCTYPE html>\n");
    html.push_str("<html><head><meta charset=\"utf-8\"><title>Physics Questions</title>\n");
    html.push_str(
        "<script src=\"https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js\"></script>\n",
    );
    html.push_str("<style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px}");
    html.push_str(".question{margin:20px 0;padding:15px;border:1px solid #ddd;border-radius:5px}");
    html.push_str(
        ".answer{color:green;font-weight:bold}.solution{margin-top:10px;color:#555}</style>\n",
    );
    html.push_str("</head><body><h1>Physics Questions</h1>\n");

    for (i, q) in questions.iter().enumerate() {
        html.push_str("<div class=\"question\">\n");
        html.push_str(&format!(
            "<p><strong>Question {}:</strong> {}</p>\n",
            i + 1,
            escape_html(&q.text)
        ));
        html.push_str(&format!(
            "<div class=\"answer\">Answer: {}</div>\n",
            escape_html(&q.answer)
        ));

        if let Some(ref choices) = q.choices {
            html.push_str("<div class=\"choices\">\n");
            for choice in choices {
                html.push_str(&format!("<div>- {}</div>\n", escape_html(choice)));
            }
            html.push_str("</div>\n");
        }

        html.push_str(&format!(
            "<div class=\"solution\">Solution: \\( {} \\)</div>\n",
            escape_html(&q.solution_text)
        ));
        html.push_str("</div>\n");
    }

    html.push_str("</body></html>");
    html
}

pub fn export_markdown(questions: &[GeneratedQuestion]) -> String {
    let mut md = String::new();
    md.push_str("# Physics Questions\n\n");

    for (i, q) in questions.iter().enumerate() {
        md.push_str(&format!("## Question {}\n\n", i + 1));
        md.push_str(&format!("{}\n\n", q.text));

        if let Some(ref choices) = q.choices {
            for choice in choices {
                md.push_str(&format!("- {}\n", choice));
            }
            md.push('\n');
        }

        md.push_str(&format!("**Answer:** {}\n\n", q.answer));
        md.push_str(&format!("**Solution:** \\( {}\\)\n\n", q.solution_text));
    }

    md
}

pub fn export_text(questions: &[GeneratedQuestion]) -> String {
    let mut text = String::new();
    text.push_str("PHYSICS QUESTIONS\n");
    text.push_str("=================\n\n");

    for (i, q) in questions.iter().enumerate() {
        text.push_str(&format!("Question {}:\n", i + 1));
        text.push_str(&format!("{}\n", q.text));

        if let Some(ref choices) = q.choices {
            for (j, choice) in choices.iter().enumerate() {
                let letter = (b'A' + j as u8) as char;
                text.push_str(&format!("  {}) {}\n", letter, choice));
            }
        }

        text.push_str(&format!("Answer: {}\n", q.answer));
        text.push_str(&format!("Solution: {}\n\n", q.solution_text));
    }

    text
}

pub fn export_pdf_html(questions: &[GeneratedQuestion]) -> String {
    let mut html = String::new();
    html.push_str("<!DOCTYPE html>\n");
    html.push_str("<html><head><meta charset=\"utf-8\"><title>Physics Questions</title>\n");
    html.push_str(
        "<script src=\"https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js\"></script>\n",
    );
    html.push_str("<style>");
    html.push_str("@page { margin: 2cm; size: A4; }");
    html.push_str(
        "body{font-family:sans-serif;font-size:12pt;line-height:1.6}",
    );
    html.push_str(
        ".question{margin:20px 0;padding:15px;border:1px solid #ccc;page-break-inside:avoid}",
    );
    html.push_str(".answer{color:green;font-weight:bold}");
    html.push_str(".solution{margin-top:10px;color:#555;font-style:italic}");
    html.push_str("</style>\n");
    html.push_str("</head><body><h1>Physics Questions</h1>\n");

    for (i, q) in questions.iter().enumerate() {
        html.push_str("<div class=\"question\">\n");
        html.push_str(&format!(
            "<p><strong>Question {}:</strong> {}</p>\n",
            i + 1,
            escape_html(&q.text)
        ));
        html.push_str(&format!(
            "<div class=\"answer\">Answer: {}</div>\n",
            escape_html(&q.answer)
        ));

        if let Some(ref choices) = q.choices {
            html.push_str("<div class=\"choices\">\n");
            for choice in choices {
                html.push_str(&format!("<div>- {}</div>\n", escape_html(choice)));
            }
            html.push_str("</div>\n");
        }

        html.push_str(&format!(
            "<div class=\"solution\">Solution: {}</div>\n",
            escape_html(&q.solution_text)
        ));
        html.push_str("</div>\n");
    }

    html.push_str("</body></html>");
    html
}

fn escape_html(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

/// Export questions as a JSON array.
pub fn export_json(questions: &[GeneratedQuestion]) -> String {
    serde_json::to_string_pretty(questions).unwrap_or_else(|_| "[]".to_string())
}

/// Export questions as CSV with columns for id, topic, skill, type, difficulty, text, answer, solution.
pub fn export_csv(questions: &[GeneratedQuestion]) -> String {
    let mut csv = String::from("id,topic_id,skill_id,type,difficulty,text,answer,solution,choices\n");

    for q in questions {
        let choices_str = q.choices.as_ref()
            .map(|c| c.join(" | "))
            .unwrap_or_default();

        let escaped_text = q.text.replace('"', "\"\"");
        let escaped_answer = q.answer.replace('"', "\"\"");
        let escaped_solution = q.solution_text.replace('"', "\"\"");
        let escaped_choices = choices_str.replace('"', "\"\"");

        csv.push_str(&format!(
            "\"{}\",\"{}\",\"{}\",\"{}\",{},\"{}\",\"{}\",\"{}\",\"{}\"\n",
            q.id,
            q.topic_id,
            q.skill_id,
            q.question_type,
            q.difficulty,
            escaped_text,
            escaped_answer,
            escaped_solution,
            escaped_choices,
        ));
    }

    csv
}

/// Export questions as LaTeX document with exam class.
pub fn export_latex(questions: &[GeneratedQuestion]) -> String {
    let mut latex = String::new();
    latex.push_str("\\documentclass[12pt]{exam}\n");
    latex.push_str("\\usepackage{amsmath}\n");
    latex.push_str("\\usepackage[margin=1in]{geometry}\n");
    latex.push_str("\\begin{document}\n");
    latex.push_str("\\title{Physics Questions}\n");
    latex.push_str("\\maketitle\n\n");

    latex.push_str("\\begin{questions}\n");

    for (i, q) in questions.iter().enumerate() {
        latex.push_str(&format!("\\question[{}] {}\n", q.difficulty, escape_latex(&q.text)));

        if let Some(ref choices) = q.choices {
            latex.push_str("\\begin{choices}\n");
            for choice in choices {
                latex.push_str(&format!("\\choice {}\n", escape_latex(choice)));
            }
            latex.push_str("\\end{choices}\n");
        }

        latex.push_str(&format!("\\begin{{solution}}\n{}\n\\end{{solution}}\n\n",
            escape_latex(&q.solution_text)));
    }

    latex.push_str("\\end{questions}\n");
    latex.push_str("\\end{document}\n");
    latex
}

fn escape_latex(text: &str) -> String {
    text.replace('\\', "\\textbackslash{}")
        .replace('&', "\\&")
        .replace('%', "\\%")
        .replace('$', "\\$")
        .replace('#', "\\#")
        .replace('_', "\\_")
        .replace('{', "\\{")
        .replace('}', "\\}")
        .replace('~', "\\textasciitilde{}")
        .replace('^', "\\textasciicircum{}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::SpecificationParser;
    use crate::generator::QuestionGenerator;

    #[test]
    fn test_html_export() {
        let input = r#"
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S1
Name: UA
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: MultipleChoice
Difficulty: 2
TextTemplate: A car accelerates from {v0} m/s to {v} m/s in {t} s.
AnswerExpression: (v - v0) / t
SolutionTemplate: Use a = (v - v0) / t
Var.v0: Type=double;Min=0;Max=20;Step=1
Var.v: Type=double;Min=20;Max=40;Step=1
Var.t: Type=double;Min=1;Max=10;Step=0.5
Distractor: (v + v0) / t
Distractor: v / t
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let gen = QuestionGenerator::new(spec.templates);
        let questions = gen.generate_batch(3, None, None, None, None, None);

        let html = export_html(&questions);
        assert!(html.contains("<!DOCTYPE html>"));
        assert!(html.to_lowercase().contains("mathjax"));
        assert!(html.contains("Question 1"));
    }

    #[test]
    fn test_markdown_export() {
        let input = r#"
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S2
Name: Free Fall
TopicId: T1

[TEMPLATE]
Id: Q2
TopicId: T1
SkillId: S2
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: A ball falls for {t} seconds.
AnswerExpression: 0.5 * 9.81 * t * t
SolutionTemplate: s = 0.5 * 9.81 * {t}^2
Var.t: Type=double;Min=1;Max=5;Step=0.5
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let gen = QuestionGenerator::new(spec.templates);
        let questions = gen.generate_batch(2, None, None, None, None, None);

        let md = export_markdown(&questions);
        assert!(md.contains("# Physics Questions"));
        assert!(md.contains("**Answer:**"));
    }

    #[test]
    fn test_text_export() {
        let input = r#"
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S2
Name: Free Fall
TopicId: T1

[TEMPLATE]
Id: Q2
TopicId: T1
SkillId: S2
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: A ball falls for {t} seconds.
AnswerExpression: 0.5 * 9.81 * t * t
SolutionTemplate: s = 0.5 * 9.81 * {t}^2
Var.t: Type=double;Min=1;Max=5;Step=0.5
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let gen = QuestionGenerator::new(spec.templates);
        let questions = gen.generate_batch(1, None, None, None, None, None);

        let text = export_text(&questions);
        assert!(text.contains("PHYSICS QUESTIONS"));
        assert!(text.contains("Answer:"));
    }

    #[test]
    fn test_json_export() {
        let input = r#"
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S1
Name: UA
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: Test {x}
AnswerExpression: x
SolutionTemplate: Solution
Var.x: Type=int;Min=1;Max=10
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let gen = QuestionGenerator::new(spec.templates);
        let questions = gen.generate_batch(2, None, None, None, None, None);

        let json = export_json(&questions);
        assert!(json.starts_with('['));
        assert!(json.contains("\"id\""));
        assert!(json.contains("\"topic_id\""));
        assert!(json.contains("\"text\""));
    }

    #[test]
    fn test_csv_export() {
        let input = r#"
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S1
Name: UA
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: Test {x}
AnswerExpression: x
SolutionTemplate: Solution
Var.x: Type=int;Min=1;Max=10
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let gen = QuestionGenerator::new(spec.templates);
        let questions = gen.generate_batch(1, None, None, None, None, None);

        let csv = export_csv(&questions);
        assert!(csv.starts_with("id,topic_id,skill_id,type,difficulty"));
        assert!(csv.contains("SA"));
    }

    #[test]
    fn test_latex_export() {
        let input = r#"
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S1
Name: UA
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: Test {x}
AnswerExpression: x
SolutionTemplate: Solution
Var.x: Type=int;Min=1;Max=10
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let gen = QuestionGenerator::new(spec.templates);
        let questions = gen.generate_batch(1, None, None, None, None, None);

        let latex = export_latex(&questions);
        assert!(latex.contains("\\documentclass"));
        assert!(latex.contains("\\begin{questions}"));
        assert!(latex.contains("\\begin{solution}"));
    }
}