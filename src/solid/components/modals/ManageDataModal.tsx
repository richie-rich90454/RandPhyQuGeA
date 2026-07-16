import type {JSX} from "solid-js";
import {For, Show, createMemo, createSignal} from "solid-js";
import {Modal} from "../ui/Modal";
import {ConfirmDialog} from "../ui/ConfirmDialog";
import {Button} from "../ui/Button";
import {Card, CardHeader, CardTitle, CardSubtitle, CardContent} from "../ui/Card";
import {Badge} from "../ui/Badge";
import {EmptyState} from "../ui/EmptyState";
import {useToast} from "../ui/Toast";
import {useUiStore} from "../../stores/uiStore";
import {useProgressStore} from "../../stores/progressStore";
import {useSpecStore} from "../../stores/specStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {ExportService} from "../../../services/ExportService";
import type {IExportService} from "../../../services/contracts";
import type {PracticeResult} from "../../../types/models";
import styles from "./ManageDataModal.module.css";
/** localStorage keys managed by the app's persisted stores. */
const STORAGE_KEYS = ["physics-quest-settings", "physics-quest-progress"] as const;
/** Format a byte count as a human-readable string. */
function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
/** Number of records to show per page in the data list. */
const PAGE_SIZE = 20;
function DownloadIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<path d="M12 3v12M7 10l5 5 5-5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M5 21h14" stroke-linecap="round" />
		</svg>
	);
}
function UploadIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<path d="M12 21V9M7 14l5-5 5 5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M5 3h14" stroke-linecap="round" />
		</svg>
	);
}
function WarningIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<path d="M12 3l9 16H3z" stroke-linejoin="round" />
			<path d="M12 10v4M12 17v.5" stroke-linecap="round" />
		</svg>
	);
}
function TrashIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}
function CheckIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path d="M5 12l5 5 9-11" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}
function XIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
		</svg>
	);
}
function FileXIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<path d="M6 3h8l4 4v14H6z" stroke-linejoin="round" />
			<path d="M14 3v4h4" stroke-linejoin="round" />
			<path d="M9 14l6 6M15 14l-6 6" stroke-linecap="round" />
		</svg>
	);
}
function DatabaseIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<ellipse cx="12" cy="5" rx="8" ry="3" stroke-linejoin="round" />
			<path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}
function isValidResult(value: unknown): value is PracticeResult {
	if (!value || typeof value !== "object") {
		return false;
	}
	let result = value as Record<string, unknown>;
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
export interface ManageDataModalProps {
	/** Override the export service used for downloads. */
	exportService?: IExportService;
}
/**
 * Manage Data overlay mapped to `#data-modal`.
 *
 * Solid port of {@link ../../../components/modals/ManageDataModal}. Lists every
 * persisted {@link PracticeResult} record (most recent first) and provides
 * data lifecycle actions: export to JSON, import from JSON, per-record
 * deletion, delete all, and a full app reset. All destructive actions are
 * gated behind an in-app {@link ConfirmDialog} (never `window.confirm`). The
 * export service defaults to a fresh {@link ExportService}; pass
 * `exportService` to inject a test double. `@phosphor-icons/react` icons are
 * replaced with inline SVG.
 */
export function ManageDataModal(props: ManageDataModalProps): JSX.Element {
	let isOpen = useUiStore(s => s.activeModal === "manage-data");
	let results = useProgressStore(s => s.results);
	let specification = useSpecStore(s => s.specification);
	let {toast} = useToast();
	let [page, setPage] = createSignal<number>(0);
	let [confirmDeleteAll, setConfirmDeleteAll] = createSignal<boolean>(false);
	let [confirmDeleteId, setConfirmDeleteId] = createSignal<string | null>(null);
	let [confirmReset, setConfirmReset] = createSignal<boolean>(false);
	let [confirmResetSettings, setConfirmResetSettings] = createSignal<boolean>(false);
	let [pendingImport, setPendingImport] = createSignal<PracticeResult[] | null>(null);
	let [storageVersion, setStorageVersion] = createSignal<number>(0);
	let fileInput: HTMLInputElement | null = null;
	let exportService: IExportService = props.exportService ?? new ExportService();
	let sortedResults = createMemo(() => [...results()].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
	let totalPages = createMemo(() => Math.max(1, Math.ceil(sortedResults().length / PAGE_SIZE)));
	let currentPage = createMemo(() => Math.min(page(), totalPages() - 1));
	let pageResults = createMemo(() => {
		let start = currentPage() * PAGE_SIZE;
		return sortedResults().slice(start, start + PAGE_SIZE);
	});
	let totalAttempts = () => results().length;
	let correctCount = createMemo(() => results().filter(r => r.is_correct).length);
	let accuracy = createMemo(() => {
		let total = totalAttempts();
		return total === 0 ? 0 : Math.round((correctCount() / total) * 100);
	});
	let storageUsage = createMemo(() => {
		void storageVersion();
		let bytes = 0;
		for (let key of STORAGE_KEYS) {
			let raw = localStorage.getItem(key);
			if (raw) {
				bytes += raw.length;
			}
		}
		return {bytes, label: formatBytes(bytes)};
	});
	let refreshStorage = () => setStorageVersion(v => v + 1);
	let handleExport = () => {
		let payload = {appVersion: useSettingsStore.getState().appVersion, exportedAt: new Date().toISOString(), results: results()};
		let content = JSON.stringify(payload, null, 2);
		exportService.downloadText(`physics-quest-data-${new Date().toISOString().slice(0, 10)}.json`, content, "json");
		toast({variant: "success", message: "Practice data exported."});
	};
	let handleImportClick = () => {
		fileInput?.click();
	};
	let handleFileChange = (event: Event) => {
		let target = event.target as HTMLInputElement;
		let file = target.files?.[0];
		if (!file) {
			return;
		}
		let reader = new FileReader();
		reader.onload = () => {
			try {
				let text = String(reader.result);
				let parsed = JSON.parse(text) as unknown;
				let imported = Array.isArray((parsed as Record<string, unknown>)?.results) ? ((parsed as Record<string, unknown>).results as unknown[]) : [];
				let valid = imported.every(isValidResult);
				if (!valid) {
					throw new Error("Invalid data format");
				}
				if (imported.length === 0) {
					toast({variant: "warning", message: "No practice records found in file."});
					return;
				}
				setPendingImport(imported as PracticeResult[]);
			} catch {
				toast({variant: "error", message: "Failed to import data. File is not valid JSON."});
			} finally {
				if (fileInput) {
					fileInput.value = "";
				}
			}
		};
		reader.readAsText(file);
	};
	let handleConfirmImport = () => {
		let pending = pendingImport();
		if (pending) {
			useProgressStore.setState({results: pending});
			setPendingImport(null);
			setPage(0);
			refreshStorage();
			toast({variant: "success", message: `Imported ${pending.length} records.`});
		}
	};
	let handleConfirmDeleteAll = () => {
		useProgressStore.getState().clearResults();
		setPage(0);
		setConfirmDeleteAll(false);
		refreshStorage();
		toast({variant: "info", message: "All practice data deleted."});
	};
	let handleConfirmDeleteOne = () => {
		let id = confirmDeleteId();
		if (id) {
			useProgressStore.getState().deleteResult(id);
		}
		setConfirmDeleteId(null);
		refreshStorage();
	};
	let handleConfirmResetSettings = () => {
		useSettingsStore.getState().resetToDefaults();
		setConfirmResetSettings(false);
		refreshStorage();
		toast({variant: "info", message: "Settings reset to defaults."});
	};
	let handleConfirmReset = () => {
		useProgressStore.getState().clearResults();
		useSettingsStore.getState().resetToDefaults();
		useSpecStore.getState().reset();
		setConfirmReset(false);
		refreshStorage();
		useUiStore.getState().closeModal();
		toast({variant: "info", message: "App reset to defaults."});
	};
	let getTopicName = (topicId: string): string => {
		let spec = specification();
		let topic = spec?.topics.find(t => t.id === topicId);
		return topic?.name ?? topicId;
	};
	let close = () => useUiStore.getState().closeModal();
	return (
		<>
			<Modal
				open={isOpen()}
				onClose={close}
				modalId="data-modal"
				title="Manage Performance Data"
				titleId="data-title"
				ariaLabel="Manage data"
				class={styles.manage}
				footer={
					<Button variant="secondary" size="md" onClick={close}>
						Close
					</Button>
				}
			>
				<div class={styles.actionsGrid}>
					<Card variant="filled" class={styles.actionCard}>
						<CardHeader class={styles.actionHeader}>
							<span class={`${styles.actionIcon} ${styles.exportIcon}`}>
								<DownloadIcon />
							</span>
							<div class={styles.actionTitles}>
								<CardTitle>Export Data</CardTitle>
								<CardSubtitle>Download your practice history as JSON.</CardSubtitle>
							</div>
						</CardHeader>
						<CardContent class={styles.actionContent}>
							<Button variant="secondary" size="sm" leftIcon={<DownloadIcon />} onClick={handleExport} disabled={results().length === 0}>
								Export JSON
							</Button>
						</CardContent>
					</Card>
					<Card variant="filled" class={styles.actionCard}>
						<CardHeader class={styles.actionHeader}>
							<span class={`${styles.actionIcon} ${styles.importIcon}`}>
								<UploadIcon />
							</span>
							<div class={styles.actionTitles}>
								<CardTitle>Import Data</CardTitle>
								<CardSubtitle>Restore practice history from a JSON file.</CardSubtitle>
							</div>
						</CardHeader>
						<CardContent class={styles.actionContent}>
							<input
								ref={(el: HTMLInputElement) => {
									fileInput = el;
								}}
								type="file"
								accept=".json,application/json"
								aria-label="Import practice data file"
								class={styles.srOnly}
								onChange={handleFileChange}
							/>
							<Button variant="secondary" size="sm" leftIcon={<UploadIcon />} onClick={handleImportClick}>
								Import JSON
							</Button>
						</CardContent>
					</Card>
					<Card variant="filled" class={styles.actionCard}>
						<CardHeader class={styles.actionHeader}>
							<span class={`${styles.actionIcon} ${styles.storageIcon}`}>
								<DatabaseIcon />
							</span>
							<div class={styles.actionTitles}>
								<CardTitle>Storage Usage</CardTitle>
								<CardSubtitle>Estimated local storage used by the app.</CardSubtitle>
							</div>
						</CardHeader>
						<CardContent class={styles.actionContent}>
							<span class={styles.storageValue} aria-live="polite">
								{storageUsage().label}
							</span>
						</CardContent>
					</Card>
				</div>
				<Card variant="filled" class={styles.historyCard}>
					<CardHeader class={styles.historyHeader}>
						<div class={styles.historyTitles}>
							<CardTitle>History</CardTitle>
							<CardSubtitle>
								{totalAttempts()} record{totalAttempts() === 1 ? "" : "s"}
							</CardSubtitle>
						</div>
						<div class={styles.historyActions}>
							<Show when={totalAttempts() > 0}>
								<Badge variant={accuracy() >= 70 ? "success" : accuracy() >= 50 ? "warning" : "error"} size="sm">
									{accuracy()}% accuracy
								</Badge>
							</Show>
							<Button variant="danger" size="sm" leftIcon={<TrashIcon />} aria-label="Delete all records" onClick={() => setConfirmDeleteAll(true)} disabled={results().length === 0}>
								Delete All
							</Button>
						</div>
					</CardHeader>
					<CardContent class={styles.historyContent}>
						<Show
							when={results().length === 0}
							fallback={
								<>
									<div class={styles.list}>
										<For each={pageResults()}>
											{result => (
												<div class={styles.item}>
													<div class={styles.itemInfo}>
														<span class={`${styles.itemResult} ${result.is_correct ? styles.correct : styles.incorrect}`}>
															{result.is_correct ? <CheckIcon /> : <XIcon />}
														</span>
														<span class={styles.itemTopic}>{getTopicName(result.topic_id)}</span>
														<span class={styles.itemMeta}>
															{result.mode} · D{result.difficulty} · {(result.time_taken_ms / 1000).toFixed(1)}s · {new Date(result.timestamp).toLocaleString()}
														</span>
													</div>
													<Button variant="icon" size="sm" class={styles.itemDelete} aria-label="Delete record" onClick={() => setConfirmDeleteId(result.id)}>
														<XIcon />
													</Button>
												</div>
											)}
										</For>
									</div>
									<Show when={totalPages() > 1}>
										<div class={styles.pagination}>
											<Button variant="secondary" size="sm" onClick={() => setPage(currentPage() - 1)} disabled={currentPage() === 0}>
												Previous
											</Button>
											<span class={styles.paginationInfo}>
												Page {currentPage() + 1} of {totalPages()}
											</span>
											<Button variant="secondary" size="sm" onClick={() => setPage(currentPage() + 1)} disabled={currentPage() >= totalPages() - 1}>
												Next
											</Button>
										</div>
									</Show>
								</>
							}
						>
							<EmptyState illustration={<FileXIcon />} title="No practice data" description="Start a session to build your history." />
						</Show>
					</CardContent>
				</Card>
				<Card variant="outline" class={styles.dangerCard}>
					<CardHeader class={styles.dangerHeader}>
						<span class={styles.dangerIcon}>
							<WarningIcon />
						</span>
						<div class={styles.actionTitles}>
							<CardTitle>Danger Zone</CardTitle>
							<CardSubtitle>Irreversible actions. Confirm carefully.</CardSubtitle>
						</div>
					</CardHeader>
					<CardContent class={styles.dangerContent}>
						<div class={styles.dangerRow}>
							<div class={styles.dangerRowInfo}>
								<span class={styles.dangerRowTitle}>Reset settings</span>
								<span class={styles.dangerRowHint}>Restore all preferences to defaults. Your practice history is kept.</span>
							</div>
							<Button variant="danger" size="sm" onClick={() => setConfirmResetSettings(true)}>
								Reset Settings
							</Button>
						</div>
						<div class={styles.dangerRow}>
							<div class={styles.dangerRowInfo}>
								<span class={styles.dangerRowTitle}>Reset everything</span>
								<span class={styles.dangerRowHint}>Clear practice data, reset settings, and unload the specification.</span>
							</div>
							<Button variant="danger" size="sm" leftIcon={<WarningIcon />} onClick={() => setConfirmReset(true)}>
								Reset Everything
							</Button>
						</div>
					</CardContent>
				</Card>
			</Modal>
			<ConfirmDialog
				destructive
				title="Delete all data?"
				message="Delete ALL practice data? This cannot be undone."
				confirmLabel="Delete All"
				open={confirmDeleteAll()}
				onConfirm={handleConfirmDeleteAll}
				onCancel={() => setConfirmDeleteAll(false)}
			/>
			<ConfirmDialog
				destructive
				title="Delete record?"
				message="Delete this practice record? This cannot be undone."
				confirmLabel="Delete"
				open={confirmDeleteId() !== null}
				onConfirm={handleConfirmDeleteOne}
				onCancel={() => setConfirmDeleteId(null)}
			/>
			<ConfirmDialog
				destructive
				title="Reset settings?"
				message="This will restore all settings to their defaults. Your practice history will be kept. This cannot be undone."
				confirmLabel="Reset"
				open={confirmResetSettings()}
				onConfirm={handleConfirmResetSettings}
				onCancel={() => setConfirmResetSettings(false)}
			/>
			<ConfirmDialog
				destructive
				title="Reset app?"
				message="This will clear all practice data and reset settings to their defaults. Your specification will remain loaded."
				confirmLabel="Reset"
				open={confirmReset()}
				onConfirm={handleConfirmReset}
				onCancel={() => setConfirmReset(false)}
			/>
			<ConfirmDialog
				title="Import practice data?"
				message={pendingImport() ? `Import ${pendingImport()!.length} record${pendingImport()!.length === 1 ? "" : "s"}? This will replace your current history.` : ""}
				confirmLabel="Import"
				open={pendingImport() !== null}
				onConfirm={handleConfirmImport}
				onCancel={() => setPendingImport(null)}
			/>
		</>
	);
}
