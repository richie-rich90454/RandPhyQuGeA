/**
 * Focused Practice view.
 *
 * Two-phase flow:
 *  - Phase 1 (configuration): load the specification, let the user pick a
 *    unit/topic/skill (cascading, all optional), a difficulty range, a
 *    question count, and a question type, then start a session.
 *  - Phase 2 (question flow): present each generated question, accept an
 *    answer, show correctness feedback with the correct answer and the
 *    LaTeX solution, then advance. When the last question is answered the
 *    results are persisted to the progress store and the user is routed to
 *    the session summary.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select, type SelectOption } from '../components/ui/Select';
import { Slider } from '../components/ui/Slider';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { MathRenderer } from '../components/MathRenderer';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { cn } from '../lib/utils';
import { usePracticeStore } from '../stores/practiceStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useProgressStore } from '../stores/progressStore';
import {
  generateBatch,
  loadDefaultSpec,
  parseSpecification,
} from '../services/physicsCore';
import type { Specification } from '../types/models';

const ALL = 'all';

const QUESTION_TYPE_OPTIONS: SelectOption[] = [
  { value: ALL, label: 'All Types' },
  { value: 'MultipleChoice', label: 'Multiple Choice' },
  { value: 'ShortAnswer', label: 'Short Answer' },
];

/**
 * Split a string on `$...$` delimiters and render the math segments with
 * KaTeX. Plain text segments are returned as-is.
 */
function renderTextWithMath(text: string): ReactNode {
  if (!text) return null;
  const parts = text.split(/(\$[^$]+\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
      return <MathRenderer key={index} tex={part.slice(1, -1)} />;
    }
    return <span key={index}>{part}</span>;
  });
}

export default function FocusedPractice() {
  const navigate = useNavigate();

  const specificationContent = useSettingsStore((s) => s.specificationContent);
  const defaultDifficulties = useSettingsStore((s) => s.defaultDifficulties);
  const defaultQuestionCount = useSettingsStore((s) => s.defaultQuestionCount);
  const addResults = useProgressStore((s) => s.addResults);

  const {
    questions,
    currentIndex,
    isActive,
    isFinished,
    userAnswer,
    selectedChoiceIndex,
    showFeedback,
    lastResult,
    startSession,
    setUserAnswer,
    selectChoice,
    submitAnswer,
    advanceQuestion,
    resetSession,
  } = usePracticeStore();

  const [spec, setSpec] = useState<Specification | null>(null);
  const [isLoadingSpec, setIsLoadingSpec] = useState(true);
  const [specError, setSpecError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedUnitId, setSelectedUnitId] = useState<string>(ALL);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(ALL);
  const [selectedSkillId, setSelectedSkillId] = useState<string>(ALL);
  const [difficultyRange, setDifficultyRange] = useState<[number, number]>(
    () => {
      if (defaultDifficulties.length > 0) {
        return [
          Math.min(...defaultDifficulties),
          Math.max(...defaultDifficulties),
        ];
      }
      return [1, 7];
    },
  );
  const [questionCount, setQuestionCount] = useState<number>(
    defaultQuestionCount,
  );
  const [questionType, setQuestionType] = useState<string>(ALL);

  // Guards against persisting the same session's results more than once.
  const hasPersistedRef = useRef(false);

  // Load (and parse) the specification once on mount, or when the user
  // changes the active spec in settings.
  useEffect(() => {
    let cancelled = false;
    async function loadSpec() {
      setIsLoadingSpec(true);
      setSpecError(null);
      try {
        const raw =
          specificationContent.trim().length > 0
            ? specificationContent
            : await loadDefaultSpec();
        const parsed = await parseSpecification(raw);
        if (!cancelled) {
          setSpec(parsed);
        }
      } catch (err) {
        if (!cancelled) {
          setSpecError(
            err instanceof Error
              ? err.message
              : 'Failed to load the specification.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSpec(false);
        }
      }
    }
    loadSpec();
    return () => {
      cancelled = true;
    };
  }, [specificationContent]);

  // Reset the persistence guard whenever a new session becomes active.
  useEffect(() => {
    if (isActive) {
      hasPersistedRef.current = false;
    }
  }, [isActive]);

  // On finish, persist results once and route to the session summary.
  useEffect(() => {
    if (isFinished && !hasPersistedRef.current) {
      hasPersistedRef.current = true;
      addResults(questions.length > 0 ? usePracticeStore.getState().results : []);
      navigate('/session-summary');
    }
  }, [isFinished, addResults, navigate, questions.length]);

  const unitOptions = useMemo<SelectOption[]>(
    () => [
      { value: ALL, label: 'All Units' },
      ...(spec?.units ?? []).map((u) => ({ value: u.id, label: u.name })),
    ],
    [spec],
  );

  const topicOptions = useMemo<SelectOption[]>(() => {
    const topics = spec?.topics ?? [];
    const filtered =
      selectedUnitId === ALL
        ? topics
        : topics.filter((t) => t.unit_id === selectedUnitId);
    return [
      { value: ALL, label: 'All Topics' },
      ...filtered.map((t) => ({ value: t.id, label: t.name })),
    ];
  }, [spec, selectedUnitId]);

  const skillOptions = useMemo<SelectOption[]>(() => {
    const skills = spec?.skills ?? [];
    const filtered =
      selectedTopicId === ALL
        ? skills
        : skills.filter((s) => s.topic_id === selectedTopicId);
    return [
      { value: ALL, label: 'All Skills' },
      ...filtered.map((s) => ({ value: s.id, label: s.name })),
    ];
  }, [spec, selectedTopicId]);

  function handleUnitChange(e: ChangeEvent<HTMLSelectElement>) {
    setSelectedUnitId(e.target.value);
    setSelectedTopicId(ALL);
    setSelectedSkillId(ALL);
  }

  function handleTopicChange(e: ChangeEvent<HTMLSelectElement>) {
    setSelectedTopicId(e.target.value);
    setSelectedSkillId(ALL);
  }

  function handleCountChange(e: ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    if (Number.isNaN(value)) return;
    setQuestionCount(Math.min(50, Math.max(1, Math.floor(value))));
  }

  async function handleStart() {
    if (!spec) return;
    setIsGenerating(true);
    setSpecError(null);
    try {
      const generated = await generateBatch(spec, questionCount, {
        topicId: selectedTopicId !== ALL ? selectedTopicId : undefined,
        skillId: selectedSkillId !== ALL ? selectedSkillId : undefined,
        minDifficulty: difficultyRange[0],
        maxDifficulty: difficultyRange[1],
        questionType: questionType !== ALL ? questionType : undefined,
      });
      if (generated.length === 0) {
        setSpecError(
          'No questions could be generated with the current filters. Try widening your selection.',
        );
        return;
      }
      startSession(spec, generated, 'Focused');
    } catch (err) {
      setSpecError(
        err instanceof Error ? err.message : 'Failed to generate questions.',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleExit() {
    resetSession();
    navigate('/practice');
  }

  // Phase: finished — brief spinner while we persist and navigate away.
  if (isFinished) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" className="text-primary-600" />
      </div>
    );
  }

  // Phase: active question flow.
  if (isActive) {
    const question = questions[currentIndex];
    const progress =
      questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
    const choices = question?.choices ?? [];
    const isMultipleChoice =
      question?.question_type === 'MultipleChoice' && choices.length > 0;
    const correctChoiceIndex = isMultipleChoice
      ? choices.findIndex((c) => c === question.answer)
      : -1;
    const canSubmit = isMultipleChoice
      ? selectedChoiceIndex >= 0
      : userAnswer.trim().length > 0;
    const isLastQuestion = currentIndex + 1 >= questions.length;

    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <ProgressBar value={progress} />
          </div>
          <Button variant="ghost" size="sm" onClick={handleExit}>
            Exit
          </Button>
        </div>

        {question && (
          <Card key={currentIndex} className="animate-slide-up space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <DifficultyBadge level={question.difficulty} size="sm" />
              <Badge variant="info">
                {isMultipleChoice ? 'Multiple Choice' : 'Short Answer'}
              </Badge>
            </div>

            <div className="text-base leading-relaxed text-neutral-900 dark:text-neutral-100">
              {renderTextWithMath(question.text)}
            </div>

            {isMultipleChoice ? (
              <div className="space-y-2">
                {choices.map((choice, index) => {
                  const isSelected = index === selectedChoiceIndex;
                  const isCorrect = index === correctChoiceIndex;
                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={showFeedback}
                      onClick={() => selectChoice(index)}
                      className={cn(
                        'w-full rounded-md border px-4 py-3 text-left text-sm transition-colors',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                        !showFeedback &&
                          isSelected &&
                          'border-primary-500 bg-primary-50 dark:bg-primary-900/30',
                        !showFeedback &&
                          !isSelected &&
                          'border-neutral-300 hover:border-primary-400 dark:border-neutral-600 dark:hover:border-primary-500',
                        showFeedback &&
                          isCorrect &&
                          'border-success-500 bg-success-50 dark:bg-success-900/30',
                        showFeedback &&
                          !isCorrect &&
                          isSelected &&
                          'border-error-500 bg-error-50 dark:bg-error-900/30',
                        showFeedback &&
                          !isCorrect &&
                          !isSelected &&
                          'border-neutral-300 opacity-60 dark:border-neutral-600',
                      )}
                    >
                      {renderTextWithMath(choice)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer..."
                disabled={showFeedback}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSubmit && !showFeedback) {
                    submitAnswer();
                  }
                }}
              />
            )}

            {showFeedback && lastResult && (
              <div
                className={cn(
                  'space-y-2 rounded-md border p-4',
                  lastResult.isCorrect
                    ? 'border-success-500 bg-success-50 dark:bg-success-900/30'
                    : 'border-error-500 bg-error-50 dark:bg-error-900/30',
                )}
              >
                <p
                  className={cn(
                    'font-semibold',
                    lastResult.isCorrect
                      ? 'text-success-700 dark:text-success-300'
                      : 'text-error-700 dark:text-error-300',
                  )}
                >
                  {lastResult.isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
                <div className="text-sm text-neutral-700 dark:text-neutral-200">
                  <span className="font-medium">Correct answer: </span>
                  {renderTextWithMath(lastResult.correctAnswer)}
                </div>
                {question.solution_latex ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      Solution
                    </p>
                    <MathRenderer
                      tex={question.solution_latex}
                      display
                      className="text-sm"
                    />
                  </div>
                ) : question.solution_text ? (
                  <div className="text-sm text-neutral-700 dark:text-neutral-200">
                    <span className="font-medium">Solution: </span>
                    {renderTextWithMath(question.solution_text)}
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex justify-end">
              {!showFeedback ? (
                <Button onClick={submitAnswer} disabled={!canSubmit}>
                  Check
                </Button>
              ) : (
                <Button onClick={advanceQuestion}>
                  {isLastQuestion ? 'Finish' : 'Next'}
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Phase: configuration.
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-h1 font-bold text-neutral-900 dark:text-neutral-100">
        Focused Practice
      </h1>

      <Card className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-h2 font-semibold text-neutral-900 dark:text-neutral-100">
            Configure your session
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Pick a unit, topic, and skill to focus on, then set your difficulty
            range and question count.
          </p>
        </div>

        {specError && (
          <div className="rounded-md border border-error-500 bg-error-50 p-3 text-sm text-error-700 dark:bg-error-900/30 dark:text-error-300">
            {specError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Unit"
            value={selectedUnitId}
            onChange={handleUnitChange}
            options={unitOptions}
            disabled={isLoadingSpec || isGenerating}
          />
          <Select
            label="Topic"
            value={selectedTopicId}
            onChange={handleTopicChange}
            options={topicOptions}
            disabled={isLoadingSpec || isGenerating}
          />
          <Select
            label="Skill"
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            options={skillOptions}
            disabled={isLoadingSpec || isGenerating}
          />
          <Select
            label="Question Type"
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
            options={QUESTION_TYPE_OPTIONS}
            disabled={isLoadingSpec || isGenerating}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Difficulty Range: {difficultyRange[0]} – {difficultyRange[1]}
          </label>
          <Slider
            min={1}
            max={7}
            value={difficultyRange}
            onChange={setDifficultyRange}
          />
        </div>

        <Input
          label="Number of Questions"
          type="number"
          min={1}
          max={50}
          value={questionCount}
          onChange={handleCountChange}
          hint="Between 1 and 50 questions."
          disabled={isGenerating}
        />

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleStart}
            isLoading={isGenerating}
            disabled={!spec || isLoadingSpec}
          >
            Start Practice
          </Button>
        </div>
      </Card>
    </div>
  );
}
