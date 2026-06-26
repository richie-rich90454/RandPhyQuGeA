import {useState, useCallback, useEffect} from 'react';
import {Modal} from '../ui';
import {MathText} from '../MathText';
import {useUiStore} from '../../stores/uiStore';
import {useSpecStore} from '../../stores/specStore';
import {generateBatch} from '../../services/physicsCore';
import type {GeneratedQuestion} from '../../types/models';
/** Question count options for the worksheet. */
const COUNT_OPTIONS = [5, 10, 20, 30] as const;
/** Difficulty options for the worksheet. */
const DIFFICULTY_OPTIONS: {value: 'easy' | 'medium' | 'hard' | 'mixed'; label: string}[] = [
	{value: 'easy', label: 'Easy'},
	{value: 'medium', label: 'Medium'},
	{value: 'hard', label: 'Hard'},
	{value: 'mixed', label: 'Mixed (random)'}
];
/** Scope options for the worksheet. */
const SCOPE_OPTIONS: {value: string; label: string}[] = [
	{value: 'simple', label: 'Simple Math'},
	{value: 'algebra', label: 'Algebra'},
	{value: 'precalc', label: 'Precalculus'},
	{value: 'calc', label: 'Calculus'},
	{value: 'all', label: 'All'}
];
/** Difficulty range mapping for worksheet generation. */
const DIFFICULTY_RANGES: Record<'easy' | 'medium' | 'hard', {minDifficulty: number; maxDifficulty: number}> = {
	easy: {minDifficulty: 1, maxDifficulty: 2},
	medium: {minDifficulty: 3, maxDifficulty: 5},
	hard: {minDifficulty: 6, maxDifficulty: 7}
};
/**
 * Build a standalone HTML worksheet document from generated questions.
 *
 * When `includeAnswerKey` is false the answer and solution sections are
 * omitted so the printed worksheet has blank space for student work.
 */
function buildWorksheetHtml(questions: GeneratedQuestion[], includeAnswerKey: boolean): string {
	const parts: string[] = [];
	parts.push('<!DOCTYPE html>\n<html><head><meta charset="utf-8">');
	parts.push('<title>Physics Worksheet</title>');
	parts.push('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css">');
	parts.push('<script src="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.js"></script>');
	parts.push('<script src="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/contrib/auto-render.min.js"></script>');
	parts.push(
		'<script>document.addEventListener("DOMContentLoaded",function(){renderMathInElement(document.body,{delimiters:[{left:"$$",right:"$$",display:true},{left:"\\\\[",right:"\\\\]",display:true},{left:"\\\\(",right:"\\\\)",display:false},{left:"$",right:"$",display:false}]});});</script>'
	);
	parts.push('<style>');
	parts.push('body{font-family:"Noto Sans",sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#1e293b}');
	parts.push('h1{text-align:center;margin-bottom:8px}');
	parts.push('.worksheet-meta{text-align:center;color:#64748b;margin-bottom:24px;font-size:0.9rem}');
	parts.push('.question{margin:16px 0;padding:12px;border:1px solid #e2e8f0;border-radius:6px;page-break-inside:avoid}');
	parts.push('.question-number{font-weight:bold;margin-right:8px}');
	parts.push('.answer{color:#0DBC79;font-weight:bold;margin-top:8px}');
	parts.push('.solution{margin-top:6px;color:#64748b;font-size:0.9rem}');
	parts.push('.choices{margin-top:6px;margin-left:20px}');
	parts.push('@media print{body{padding:0}.question{border:none}}');
	parts.push('</style></head><body>');
	parts.push('<h1>Physics Worksheet</h1>');
	parts.push(`<div class="worksheet-meta">${questions.length} questions &middot; Generated ${new Date().toLocaleDateString()}</div>`);
	for (const [i, q] of questions.entries()) {
		parts.push('<div class="question">');
		parts.push(`<p><span class="question-number">${i + 1}.</span> ${escapeHtml(q.text)}</p>`);
		if (q.choices !== undefined) {
			parts.push('<div class="choices">');
			for (const [j, choice] of q.choices.entries()) {
				parts.push(`<div>${String.fromCharCode(65 + j)}. ${escapeHtml(choice)}</div>`);
			}
			parts.push('</div>');
		}
		if (includeAnswerKey) {
			parts.push(`<div class="answer">Answer: ${escapeHtml(q.answer)}</div>`);
			if (q.solution_text) {
				parts.push(`<div class="solution">Solution: ${escapeHtml(q.solution_text)}</div>`);
			}
		} else {
			parts.push('<div class="answer">&nbsp;</div>');
		}
		parts.push('</div>');
	}
	parts.push('</body></html>');
	return parts.join('');
}
function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
/** Check whether a unit matches a scope keyword by id or name. */
function scopeMatchesUnit(scope: string, unit: {id: string; name: string}): boolean {
	const haystack = `${unit.id} ${unit.name}`.toLowerCase();
	if (scope === 'simple') return haystack.includes('simple') || haystack.includes('math');
	if (scope === 'algebra') return haystack.includes('algebra');
	if (scope === 'precalc') return haystack.includes('precalc') || haystack.includes('pre-calc');
	if (scope === 'calc') return haystack.includes('calc') && !haystack.includes('precalc') && !haystack.includes('pre-calc');
	return true;
}
/**
 * Print worksheet overlay mapped to `#print-modal`.
 *
 * Renders worksheet options (question count, topic, scope, difficulty,
 * answer-key toggle), generates a batch of questions on demand, shows a
 * numbered preview, and opens the browser print dialog via a standalone
 * HTML document. The topic dropdown is populated from the loaded
 * specification; "All topics" generates across every topic.
 */
export function PrintModal() {
	const isOpen = useUiStore(state => state.activeModal === 'print');
	const closeModal = useUiStore(state => state.closeModal);
	const specification = useSpecStore(state => state.specification);
	const [questionCount, setQuestionCount] = useState<number>(10);
	const [topicId, setTopicId] = useState<string>('all');
	const [scope, setScope] = useState<string>('all');
	const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
	const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(true);
	const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
	const [isGenerating, setIsGenerating] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		setTopicId('all');
	}, [scope]);
	const handleGenerate = useCallback(async () => {
		if (!specification) {
			setError('No specification loaded.');
			return;
		}
		setIsGenerating(true);
		setError(null);
		try {
			const options = difficulty === 'mixed' ? {topicId: topicId === 'all' ? undefined : topicId} : {topicId: topicId === 'all' ? undefined : topicId, ...DIFFICULTY_RANGES[difficulty]};
			const batch = await generateBatch(specification, questionCount, options);
			setQuestions(batch);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			setError(`Failed to generate worksheet: ${message}`);
			setQuestions([]);
		} finally {
			setIsGenerating(false);
		}
	}, [specification, questionCount, topicId, difficulty]);
	const handlePrint = useCallback(() => {
		if (questions.length === 0) return;
		const html = buildWorksheetHtml(questions, includeAnswerKey);
		const printWindow = window.open('', '_blank');
		if (!printWindow) {
			setError('Pop-up blocked. Please allow pop-ups to print the worksheet.');
			return;
		}
		printWindow.document.open();
		printWindow.document.write(html);
		printWindow.document.close();
		printWindow.focus();
		printWindow.print();
	}, [questions, includeAnswerKey]);
	const topicOptions = specification
		? specification.topics
				.filter(topic => {
					if (scope === 'all') return true;
					const unit = specification.units.find(u => u.id === topic.unit_id);
					return unit !== undefined && scopeMatchesUnit(scope, unit);
				})
				.map(topic => {
					const unit = specification.units.find(u => u.id === topic.unit_id);
					return {value: topic.id, label: `${unit?.name ?? 'Unknown'} — ${topic.name}`};
				})
		: [];
	return (
		<Modal
			open={isOpen}
			onClose={closeModal}
			modalId="print-modal"
			title="Print Worksheet"
			titleId="print-title"
			ariaLabel="Print worksheet"
			footer={
				<>
					<button type="button" className="secondary-button" onClick={closeModal}>
						Close
					</button>
					{questions.length > 0 && (
						<button type="button" className="primary-button" onClick={handlePrint} disabled={isGenerating}>
							Print Worksheet
						</button>
					)}
				</>
			}
		>
			<div className="print-options">
				<div className="setting-item">
					<label htmlFor="print-question-count">Number of questions</label>
					<select id="print-question-count" className="scope-select" value={questionCount} onChange={event => setQuestionCount(Number(event.target.value))}>
						{COUNT_OPTIONS.map(count => (
							<option key={count} value={count}>
								{count}
							</option>
						))}
					</select>
				</div>
				<div className="setting-item">
					<label htmlFor="print-topic">Topic</label>
					<select id="print-topic" className="scope-select" value={topicId} onChange={event => setTopicId(event.target.value)}>
						<option value="all">All topics (from selected scope)</option>
						{topicOptions.map(option => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
				<div className="setting-item">
					<label htmlFor="print-scope">Topic scope</label>
					<select id="print-scope" className="scope-select" value={scope} onChange={event => setScope(event.target.value)}>
						{SCOPE_OPTIONS.map(option => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
				<div className="setting-item">
					<label htmlFor="print-difficulty">Difficulty</label>
					<select id="print-difficulty" className="scope-select" value={difficulty} onChange={event => setDifficulty(event.target.value as 'easy' | 'medium' | 'hard' | 'mixed')}>
						{DIFFICULTY_OPTIONS.map(option => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
				<div className="setting-item">
					<label htmlFor="print-answer-key">Include answer key</label>
					<input type="checkbox" id="print-answer-key" className="settings-checkbox" checked={includeAnswerKey} onChange={event => setIncludeAnswerKey(event.target.checked)} />
				</div>
				<div className="setting-item">
					<button type="button" className="primary-button" onClick={handleGenerate} disabled={isGenerating || !specification}>
						{isGenerating ? 'Generating...' : 'Generate Worksheet'}
					</button>
				</div>
				{error && (
					<div className="setting-item">
						<p className="error-text">{error}</p>
					</div>
				)}
			</div>
			{questions.length > 0 && (
				<div className="print-preview">
					<h3>Preview ({questions.length} questions)</h3>
					<ol className="worksheet-preview-list">
						{questions.map((question, index) => (
							<li key={question.id} value={index + 1}>
								<MathText text={question.text} />
								{includeAnswerKey && (
									<span className="preview-answer">
										{' '}
										— <MathText text={question.answer} />
									</span>
								)}
							</li>
						))}
					</ol>
				</div>
			)}
		</Modal>
	);
}
