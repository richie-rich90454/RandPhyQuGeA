/**
 * Export dialog.
 *
 * Modal component for generating a batch of questions from the current
 * specification and downloading them in a chosen format.
 */
import {useState} from 'react';
import {Button, Modal, Select, Input, Spinner} from '../components/ui';
import {generateBatch, exportQuestions} from '../services/physicsCore';
import type {Specification, ExportFormat} from '../types/models';

export interface ExportDialogProps {
	open: boolean;
	onClose: () => void;
	specification: Specification;
}

const FORMAT_OPTIONS: {value: ExportFormat; label: string}[] = [
	{value: 'html', label: 'HTML'},
	{value: 'pdf', label: 'PDF'},
	{value: 'markdown', label: 'Markdown'},
	{value: 'text', label: 'Plain Text'},
	{value: 'json', label: 'JSON'},
	{value: 'csv', label: 'CSV'},
	{value: 'latex', label: 'LaTeX'}
];

// PDF is rendered as HTML so it can be printed to PDF by the browser.
const FILE_EXTENSIONS: Record<ExportFormat, string> = {
	html: 'html',
	pdf: 'html',
	markdown: 'md',
	text: 'txt',
	json: 'json',
	csv: 'csv',
	latex: 'tex'
};

const MIME_TYPES: Record<ExportFormat, string> = {
	html: 'text/html',
	pdf: 'text/html',
	markdown: 'text/markdown',
	text: 'text/plain',
	json: 'application/json',
	csv: 'text/csv',
	latex: 'application/x-tex'
};

const ALL_TOPICS_VALUE = '';

export function ExportDialog({open, onClose, specification}: ExportDialogProps) {
	const [format, setFormat] = useState<ExportFormat>('html');
	const [countInput, setCountInput] = useState('10');
	const [topicId, setTopicId] = useState<string>(ALL_TOPICS_VALUE);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const topicOptions = [{value: ALL_TOPICS_VALUE, label: 'All Topics'}, ...specification.topics.map(t => ({value: t.id, label: t.name}))];

	function handleClose() {
		if (loading) return;
		setError(null);
		setSuccess(null);
		onClose();
	}

	async function handleExport() {
		const parsed = parseInt(countInput, 10);
		const count = Math.max(1, Math.min(100, Number.isFinite(parsed) ? parsed : 1));
		const options = topicId === ALL_TOPICS_VALUE ? {} : {topicId};

		setLoading(true);
		setError(null);
		setSuccess(null);
		try {
			const questions = await generateBatch(specification, count, options);
			const exported = await exportQuestions(questions, format);

			const ext = FILE_EXTENSIONS[format];
			const mime = MIME_TYPES[format];
			const blob = new Blob([exported], {type: mime});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `physics-questions.${ext}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			const formatLabel = FORMAT_OPTIONS.find(o => o.value === format)?.label ?? format;
			setSuccess(`Downloaded ${questions.length} question${questions.length === 1 ? '' : 's'} as ${formatLabel}.`);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Export failed.');
		} finally {
			setLoading(false);
		}
	}

	return (
		<Modal
			open={open}
			onClose={handleClose}
			title="Export Questions"
			footer={
				<>
					<Button variant="outline" onClick={handleClose} disabled={loading}>
						Cancel
					</Button>
					<Button onClick={handleExport} isLoading={loading}>
						Generate &amp; Export
					</Button>
				</>
			}
		>
			<div className="space-y-4">
				<p className="text-sm text-neutral-600 dark:text-neutral-300">Generate a batch of questions from the current specification and download them in your chosen format.</p>

				<Select label="Format" value={format} onChange={e => setFormat(e.target.value as ExportFormat)} options={FORMAT_OPTIONS} />

				<Input type="number" min={1} max={100} label="Number of questions" value={countInput} onChange={e => setCountInput(e.target.value)} hint="Between 1 and 100 questions." />

				<Select label="Topic" value={topicId} onChange={e => setTopicId(e.target.value)} options={topicOptions} />

				{loading && (
					<div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
						<Spinner size="sm" />
						<span>Generating questions…</span>
					</div>
				)}

				{error && <p className="text-sm text-error-600 dark:text-error-400">{error}</p>}

				{success && !loading && <p className="text-sm text-success-700 dark:text-success-300">{success}</p>}
			</div>
		</Modal>
	);
}
