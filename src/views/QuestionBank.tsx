/**
 * Question Bank view.
 *
 * Presents a browsable master-detail tree of the parsed specification
 * (Units → Topics → Skills → Templates) with inline question previews
 * and a lightweight export dialog.
 */
import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  Select,
  Input,
} from '../components/ui';
import { MathRenderer } from '../components/MathRenderer';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { cn } from '../lib/utils';
import { useSettingsStore } from '../stores/settingsStore';
import {
  parseSpecification,
  generateQuestion,
  generateBatch,
  exportQuestions,
  loadDefaultSpec,
} from '../services/physicsCore';
import type {
  Specification,
  QuestionTemplate,
  GeneratedQuestion,
  ExportFormat,
} from '../types/models';
import { ChevronRight, Download, BookOpen, Sparkles } from 'lucide-react';

/* ---------- config ---------- */

const EXPORT_FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'html', label: 'HTML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'text', label: 'Plain Text' },
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'latex', label: 'LaTeX' },
  { value: 'pdf', label: 'PDF' },
];

const EXPORT_EXTENSIONS: Record<ExportFormat, string> = {
  html: 'html',
  pdf: 'pdf',
  markdown: 'md',
  text: 'txt',
  json: 'json',
  csv: 'csv',
  latex: 'tex',
};

const EXPORT_MIME_TYPES: Record<ExportFormat, string> = {
  html: 'text/html',
  pdf: 'application/pdf',
  markdown: 'text/plain',
  text: 'text/plain',
  json: 'application/json',
  csv: 'text/csv',
  latex: 'text/plain',
};

/** Human-readable label for a question_type string. */
function questionTypeLabel(questionType: string): string {
  if (questionType === 'MultipleChoice') return 'Multiple Choice';
  if (questionType === 'ShortAnswer') return 'Short Answer';
  return questionType;
}

/* ---------- helpers ---------- */

function downloadText(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- main component ---------- */

export default function QuestionBank() {
  const specificationContent = useSettingsStore((s) => s.specificationContent);

  const [spec, setSpec] = useState<Specification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  // Preview state
  const [previewTemplate, setPreviewTemplate] = useState<QuestionTemplate | null>(
    null,
  );
  const [previewQuestion, setPreviewQuestion] = useState<GeneratedQuestion | null>(
    null,
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Export state
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('html');
  const [exportCountInput, setExportCountInput] = useState('10');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Load specification on mount (or when the stored spec changes).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const content = specificationContent || (await loadDefaultSpec());
        const parsed = await parseSpecification(content);
        if (!cancelled) {
          setSpec(parsed);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load specification.',
          );
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [specificationContent]);

  // Derived selection data.
  const selectedSkill =
    spec?.skills.find((s) => s.id === selectedSkillId) ?? null;
  const selectedTopic = selectedSkill
    ? (spec?.topics.find((t) => t.id === selectedSkill.topic_id) ?? null)
    : null;
  const selectedUnit = selectedTopic
    ? (spec?.units.find((u) => u.id === selectedTopic.unit_id) ?? null)
    : null;
  const templates = selectedSkillId
    ? (spec?.templates.filter((t) => t.skill_id === selectedSkillId) ?? [])
    : [];

  function toggleNode(id: string) {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelectSkill(skillId: string) {
    setSelectedSkillId(skillId);
  }

  async function handlePreview(template: QuestionTemplate) {
    if (!spec) return;
    setPreviewTemplate(template);
    setPreviewQuestion(null);
    setPreviewError(null);
    setPreviewLoading(true);
    try {
      const question = await generateQuestion(spec, {
        skillId: template.skill_id,
      });
      setPreviewQuestion(question);
    } catch (err) {
      setPreviewError(
        err instanceof Error ? err.message : 'Failed to generate question.',
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    setPreviewTemplate(null);
    setPreviewQuestion(null);
    setPreviewError(null);
  }

  async function handleExport() {
    if (!spec) return;
    const count = Math.max(1, Math.min(500, parseInt(exportCountInput, 10) || 1));
    setExportLoading(true);
    setExportError(null);
    try {
      const questions = await generateBatch(spec, count, {});
      const exported = await exportQuestions(questions, exportFormat);
      const ext = EXPORT_EXTENSIONS[exportFormat];
      downloadText(
        `questions.${ext}`,
        exported,
        EXPORT_MIME_TYPES[exportFormat],
      );
      setExportOpen(false);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setExportLoading(false);
    }
  }

  /* ---------- render: loading ---------- */

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3 text-neutral-500 dark:text-neutral-400">
          <Spinner size="lg" />
          <p className="text-sm">Loading specification…</p>
        </div>
      </div>
    );
  }

  /* ---------- render: error / empty spec ---------- */

  if (error || !spec || spec.units.length === 0) {
    return (
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title={error ? 'Could not load specification' : 'No specification loaded'}
          description={
            error ??
            'The specification does not contain any units. Load a specification file in Settings.'
          }
        />
      </div>
    );
  }

  /* ---------- render: main ---------- */

  return (
    <div className="mx-auto max-w-7xl animate-slide-up p-6 md:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 text-neutral-900 dark:text-neutral-100">
            Question Bank
          </h1>
          <p className="mt-1 text-body text-neutral-500 dark:text-neutral-400">
            Browse the specification tree and preview question templates.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setExportOpen(true)}
          leftIcon={<Download className="h-5 w-5" />}
        >
          Export Questions
        </Button>
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Tree panel */}
        <Card className="md:w-1/3 md:self-start">
          <CardHeader className="mb-2">
            <CardTitle className="text-h4">Specification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {spec.units.map((unit) => {
              const unitTopics = spec.topics.filter((t) => t.unit_id === unit.id);
              const unitExpanded = expandedNodes.has(unit.id);
              return (
                <div key={unit.id}>
                  <button
                    type="button"
                    onClick={() => toggleNode(unit.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold text-neutral-800 transition-colors duration-fast ease-standard hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-700"
                    aria-expanded={unitExpanded}
                  >
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-fast ease-standard',
                        unitExpanded && 'rotate-90',
                      )}
                    />
                    <span className="flex-1 truncate">{unit.name}</span>
                    <Badge variant="default">{unitTopics.length}</Badge>
                  </button>
                  {unitExpanded && (
                    <div className="ml-3 space-y-0.5 border-l border-neutral-200 pl-3 dark:border-neutral-700">
                      {unitTopics.map((topic) => {
                        const topicSkills = spec.skills.filter(
                          (s) => s.topic_id === topic.id,
                        );
                        const topicExpanded = expandedNodes.has(topic.id);
                        return (
                          <div key={topic.id}>
                            <button
                              type="button"
                              onClick={() => toggleNode(topic.id)}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-neutral-700 transition-colors duration-fast ease-standard hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                              aria-expanded={topicExpanded}
                            >
                              <ChevronRight
                                className={cn(
                                  'h-4 w-4 shrink-0 transition-transform duration-fast ease-standard',
                                  topicExpanded && 'rotate-90',
                                )}
                              />
                              <span className="flex-1 truncate">{topic.name}</span>
                              <Badge variant="default">{topicSkills.length}</Badge>
                            </button>
                            {topicExpanded && (
                              <div className="ml-3 space-y-0.5 border-l border-neutral-200 pl-3 dark:border-neutral-700">
                                {topicSkills.map((skill) => {
                                  const active = skill.id === selectedSkillId;
                                  const skillTemplates = spec.templates.filter(
                                    (t) => t.skill_id === skill.id,
                                  );
                                  return (
                                    <button
                                      key={skill.id}
                                      type="button"
                                      onClick={() => handleSelectSkill(skill.id)}
                                      className={cn(
                                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-fast ease-standard',
                                        active
                                          ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
                                          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700',
                                      )}
                                    >
                                      <span className="flex-1 truncate">
                                        {skill.name}
                                      </span>
                                      {skillTemplates.length > 0 && (
                                        <span className="text-xs text-neutral-400">
                                          {skillTemplates.length}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Detail panel */}
        <div className="md:w-2/3">
          {selectedSkill ? (
            <div className="animate-fade-in space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {selectedUnit && <span>{selectedUnit.name}</span>}
                    {selectedUnit && selectedTopic && <span>/</span>}
                    {selectedTopic && <span>{selectedTopic.name}</span>}
                  </div>
                  <CardTitle className="mt-1">{selectedSkill.name}</CardTitle>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {selectedSkill.description}
                  </p>
                </CardHeader>
              </Card>

              {templates.length === 0 ? (
                <Card>
                  <EmptyState
                    title="No templates"
                    description="This skill does not have any question templates."
                  />
                </Card>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className="transition-shadow duration-normal ease-standard hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                              {template.id}
                            </span>
                            <DifficultyBadge level={template.difficulty} size="sm" />
                            <Badge variant="info">
                              {questionTypeLabel(template.question_type)}
                            </Badge>
                          </div>
                          <p className="line-clamp-3 text-sm text-neutral-600 dark:text-neutral-300">
                            {template.text_template}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(template)}
                          leftIcon={<Sparkles className="h-4 w-4" />}
                          className="shrink-0"
                        >
                          Preview
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={<BookOpen className="h-12 w-12" />}
                title="Select a skill"
                description="Browse the specification tree and choose a skill to view its question templates."
              />
            </Card>
          )}
        </div>
      </div>

      {/* Preview modal */}
      <Modal
        open={previewTemplate !== null}
        onClose={closePreview}
        title="Question Preview"
        className="max-w-2xl"
        footer={
          <Button variant="outline" onClick={closePreview}>
            Close
          </Button>
        }
      >
        {previewLoading && (
          <div className="flex items-center justify-center gap-3 py-8 text-neutral-500 dark:text-neutral-400">
            <Spinner size="sm" />
            <span className="text-sm">Generating question…</span>
          </div>
        )}
        {!previewLoading && previewError && (
          <p className="text-sm text-error-600 dark:text-error-400">
            {previewError}
          </p>
        )}
        {!previewLoading && previewQuestion && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <DifficultyBadge level={previewQuestion.difficulty} size="sm" />
              <Badge variant="info">
                {questionTypeLabel(previewQuestion.question_type)}
              </Badge>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Question
              </p>
              <p className="text-body text-neutral-800 dark:text-neutral-100">
                {previewQuestion.text}
              </p>
            </div>
            {previewQuestion.choices && previewQuestion.choices.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Choices
                </p>
                <ul className="space-y-1">
                  {previewQuestion.choices.map((choice, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-neutral-700 dark:text-neutral-200"
                    >
                      <span className="mr-2 font-medium text-neutral-500">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {choice}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Answer
              </p>
              <p className="text-sm font-medium text-success-700 dark:text-success-300">
                {previewQuestion.answer}
              </p>
            </div>
            {previewQuestion.solution_text && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Solution
                </p>
                <p className="text-sm text-neutral-700 dark:text-neutral-200">
                  {previewQuestion.solution_text}
                </p>
              </div>
            )}
            {previewQuestion.solution_latex && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Solution (LaTeX)
                </p>
                <MathRenderer
                  tex={previewQuestion.solution_latex}
                  display
                  className="rounded-md bg-neutral-50 p-3 dark:bg-neutral-900"
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Export modal */}
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Questions"
        footer={
          <>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} isLoading={exportLoading}>
              Generate &amp; Download
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Generate a batch of questions from the current specification and
            download them in your chosen format.
          </p>
          <Select
            label="Format"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            options={EXPORT_FORMAT_OPTIONS}
          />
          <Input
            type="number"
            min={1}
            max={500}
            label="Number of questions"
            value={exportCountInput}
            onChange={(e) => setExportCountInput(e.target.value)}
            hint="Between 1 and 500 questions."
          />
          {exportError && (
            <p className="text-sm text-error-600 dark:text-error-400">
              {exportError}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
