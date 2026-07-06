import {useRef, useState, type ChangeEvent} from "react";
import {DownloadSimple, UploadSimple, Trash, Warning, FileX} from "@phosphor-icons/react";
import {Modal, ConfirmDialog, Button, Card, CardContent, CardHeader, CardTitle, CardSubtitle, Badge, EmptyState, useToast} from "../ui";
import {ScrollReveal} from "../animations";
import {useUiStore} from "../../stores/uiStore";
import {useProgressStore} from "../../stores/progressStore";
import {useSpecStore} from "../../stores/specStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {useServices} from "../../hooks/useServices";
import type {PracticeResult} from "../../types/models";
/** Number of records to show per page in the data list. */
const PAGE_SIZE = 20;
function isValidResult(value: unknown): value is PracticeResult {
	if (!value || typeof value !== "object") {
		return false;
	}
	const result = value as Record<string, unknown>;
	return (
		typeof result.id === "string" &&
		typeof result.question_id === "string" &&
		typeof result.topic_id === "string" &&
		typeof result.skill_id === "string" &&
		typeof result.is_correct === "boolean" &&
		typeof result.time_taken_ms === "number" &&
		typeof result.user_answer === "string" &&
		typeof result.timestamp === "string" &&
		(result.mode === "Single" || result.mode === "Mental") &&
		typeof result.difficulty === "number"
	);
}
/**
 * Manage Data overlay mapped to `#data-modal`.
 *
 * Lists every persisted {@link PracticeResult} record (most recent first)
 * and provides data lifecycle actions: export to JSON, import from JSON,
 * per-record deletion, delete all, and a full app reset. All destructive
 * actions are gated behind an in-app {@link ConfirmDialog}.
 */
export function ManageDataModal() {
	const isOpen = useUiStore(state => state.activeModal === "manage-data");
	const closeModal = useUiStore(state => state.closeModal);
	const results = useProgressStore(state => state.results);
	const deleteResult = useProgressStore(state => state.deleteResult);
	const clearResults = useProgressStore(state => state.clearResults);
	const specification = useSpecStore(state => state.specification);
	const resetSpec = useSpecStore(state => state.reset);
	const settings = useSettingsStore();
	const {export: exportService} = useServices();
	const {toast} = useToast();
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const scrollerRef = useRef<HTMLElement | null>(null);
	const [page, setPage] = useState(0);
	const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
	const [confirmReset, setConfirmReset] = useState(false);
	const [pendingImport, setPendingImport] = useState<PracticeResult[] | null>(null);
	const sortedResults = [...results].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
	const totalPages = Math.max(1, Math.ceil(sortedResults.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages - 1);
	const pageResults = sortedResults.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
	const totalAttempts = results.length;
	const correctCount = results.filter(r => r.is_correct).length;
	const accuracy = totalAttempts === 0 ? 0 : Math.round((correctCount / totalAttempts) * 100);
	const handleExport = () => {
		const payload = {appVersion: settings.appVersion, exportedAt: new Date().toISOString(), results};
		const content = JSON.stringify(payload, null, 2);
		exportService.downloadText(`physics-quest-data-${new Date().toISOString().slice(0, 10)}.json`, content, "json");
		toast({variant: "success", message: "Practice data exported."});
	};
	const handleImportClick = () => {
		fileInputRef.current?.click();
	};
	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const text = String(reader.result);
				const parsed = JSON.parse(text) as unknown;
				const imported = Array.isArray((parsed as Record<string, unknown>)?.results) ? (parsed as Record<string, unknown>).results as unknown[] : [];
				const valid = imported.every(isValidResult);
				if (!valid) {
					throw new Error("Invalid data format");
				}
				if (imported.length === 0) {
					toast({variant: "warning", message: "No practice records found in file."});
					return;
				}
				setPendingImport(imported);
			} catch {
				toast({variant: "error", message: "Failed to import data. File is not valid JSON."});
			} finally {
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
			}
		};
		reader.readAsText(file);
	};
	const handleConfirmImport = () => {
		if (pendingImport) {
			useProgressStore.setState({results: pendingImport});
			setPendingImport(null);
			setPage(0);
			toast({variant: "success", message: `Imported ${pendingImport.length} records.`});
		}
	};
	const handleDeleteAll = () => {
		setConfirmDeleteAll(true);
	};
	const handleConfirmDeleteAll = () => {
		clearResults();
		setPage(0);
		setConfirmDeleteAll(false);
		toast({variant: "info", message: "All practice data deleted."});
	};
	const handleConfirmDeleteOne = () => {
		if (confirmDeleteId) {
			deleteResult(confirmDeleteId);
		}
		setConfirmDeleteId(null);
	};
	const handleResetApp = () => {
		setConfirmReset(true);
	};
	const handleConfirmReset = () => {
		clearResults();
		settings.resetToDefaults();
		resetSpec();
		setConfirmReset(false);
		closeModal();
		toast({variant: "info", message: "App reset to defaults."});
	};
	const getTopicName = (topicId: string): string => {
		const topic = specification?.topics.find(t => t.id === topicId);
		return topic?.name ?? topicId;
	};
	return (
		<>
			<Modal
				open={isOpen}
				onClose={closeModal}
				modalId="data-modal"
				title="Manage Performance Data"
				titleId="data-title"
				ariaLabel="Manage data"
				scrollerRef={scrollerRef}
				footer={
					<Button variant="secondary" size="md" onClick={closeModal}>
						Close
					</Button>
				}
			>
				<div className="data-actions-grid">
					<Card variant="filled" className="data-action-card">
						<CardHeader className="data-action-header">
							<div className="data-action-icon export-icon">
								<DownloadSimple className="h-5 w-5" aria-hidden="true" />
							</div>
							<div className="data-action-titles">
								<CardTitle>Export Data</CardTitle>
								<CardSubtitle>Download your practice history as JSON.</CardSubtitle>
							</div>
						</CardHeader>
						<CardContent className="data-action-content">
							<Button variant="secondary" size="sm" leftIcon={<DownloadSimple aria-hidden="true" />} onClick={handleExport} disabled={results.length === 0}>
								Export JSON
							</Button>
						</CardContent>
					</Card>
					<Card variant="filled" className="data-action-card">
						<CardHeader className="data-action-header">
							<div className="data-action-icon import-icon">
								<UploadSimple className="h-5 w-5" aria-hidden="true" />
							</div>
							<div className="data-action-titles">
								<CardTitle>Import Data</CardTitle>
								<CardSubtitle>Restore practice history from a JSON file.</CardSubtitle>
							</div>
						</CardHeader>
						<CardContent className="data-action-content">
							<input
								ref={fileInputRef}
								type="file"
								accept=".json,application/json"
								aria-label="Import practice data file"
								className="sr-only"
								onChange={handleFileChange}
							/>
							<Button variant="secondary" size="sm" leftIcon={<UploadSimple aria-hidden="true" />} onClick={handleImportClick}>
								Import JSON
							</Button>
						</CardContent>
					</Card>
					<Card variant="filled" className="data-action-card">
						<CardHeader className="data-action-header">
							<div className="data-action-icon reset-icon">
								<Warning className="h-5 w-5" aria-hidden="true" />
							</div>
							<div className="data-action-titles">
								<CardTitle>Reset App</CardTitle>
								<CardSubtitle>Clear data and restore default settings.</CardSubtitle>
							</div>
						</CardHeader>
						<CardContent className="data-action-content">
							<Button variant="danger" size="sm" leftIcon={<Warning aria-hidden="true" />} onClick={handleResetApp}>
								Reset Everything
							</Button>
						</CardContent>
					</Card>
				</div>
				<Card variant="filled" className="data-history-card">
					<CardHeader className="data-history-header">
						<div className="data-history-titles">
							<CardTitle>History</CardTitle>
							<CardSubtitle>{totalAttempts} record{totalAttempts === 1 ? "" : "s"}</CardSubtitle>
						</div>
						<div className="data-history-actions">
							{totalAttempts > 0 && (
								<Badge variant={accuracy >= 70 ? "success" : accuracy >= 50 ? "warning" : "error"} size="sm">
									{accuracy}% accuracy
								</Badge>
							)}
							<Button variant="danger" size="sm" leftIcon={<Trash aria-hidden="true" />} aria-label="Delete all records" title="Delete all records" onClick={handleDeleteAll} disabled={results.length === 0}>
								Delete All
							</Button>
						</div>
					</CardHeader>
					<CardContent className="data-history-content">
						{results.length === 0 ? (
							<EmptyState
								illustration={<FileX className="h-12 w-12" aria-hidden="true" />}
								title="No practice data"
								description="Start a session to build your history."
							/>
						) : (
							<>
								<div className="data-list">
									{pageResults.map((result, index) => (
										<ScrollReveal key={result.id} as="div" direction="up" distance={12} duration={0.35} delay={index * 0.05} scrollerRef={scrollerRef}>
											<div className="data-item">
												<div className="data-item-info">
													<span className={`data-item-result ${result.is_correct ? "correct" : "incorrect"}`}>{result.is_correct ? "✓" : "✗"}</span>
													<span className="data-item-topic">{getTopicName(result.topic_id)}</span>
													<span className="data-item-meta">
														{result.mode} &middot; D{result.difficulty} &middot; {(result.time_taken_ms / 1000).toFixed(1)}s &middot; {new Date(result.timestamp).toLocaleString()}
													</span>
												</div>
												<Button
													variant="icon"
													size="sm"
													className="data-item-delete"
													aria-label="Delete record"
													title="Delete record"
													onClick={() => setConfirmDeleteId(result.id)}
												>
													✕
												</Button>
											</div>
										</ScrollReveal>
									))}
								</div>
								{totalPages > 1 && (
									<div className="data-pagination">
										<Button variant="secondary" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0}>
											Previous
										</Button>
										<span className="pagination-info">
											Page {currentPage + 1} of {totalPages}
										</span>
										<Button variant="secondary" size="sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}>
											Next
										</Button>
									</div>
								)}
							</>
						)}
					</CardContent>
				</Card>
			</Modal>
			<ConfirmDialog
				destructive
				title="Delete all data?"
				message="Delete ALL practice data? This cannot be undone."
				confirmLabel="Delete All"
				open={confirmDeleteAll}
				onConfirm={handleConfirmDeleteAll}
				onCancel={() => setConfirmDeleteAll(false)}
			/>
			<ConfirmDialog
				destructive
				title="Delete record?"
				message="Delete this practice record? This cannot be undone."
				confirmLabel="Delete"
				open={confirmDeleteId !== null}
				onConfirm={handleConfirmDeleteOne}
				onCancel={() => setConfirmDeleteId(null)}
			/>
			<ConfirmDialog
				destructive
				title="Reset app?"
				message="This will clear all practice data and reset settings to their defaults. Your specification will remain loaded."
				confirmLabel="Reset"
				open={confirmReset}
				onConfirm={handleConfirmReset}
				onCancel={() => setConfirmReset(false)}
			/>
			<ConfirmDialog
				title="Import practice data?"
				message={pendingImport ? `Import ${pendingImport.length} record${pendingImport.length === 1 ? "" : "s"}? This will replace your current history.` : ""}
				confirmLabel="Import"
				open={pendingImport !== null}
				onConfirm={handleConfirmImport}
				onCancel={() => setPendingImport(null)}
			/>
		</>
	);
}
