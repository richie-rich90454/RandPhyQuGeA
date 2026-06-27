import {useState} from 'react';
import {Modal, ConfirmDialog} from '../ui';
import {useUiStore} from '../../stores/uiStore';
import {useProgressStore} from '../../stores/progressStore';
import {useSpecStore} from '../../stores/specStore';
/** Number of records to show per page in the data list. */
const PAGE_SIZE = 20;
/**
 * Manage Data overlay mapped to `#data-modal`.
 *
 * Lists every persisted {@link PracticeResult} record (most recent first)
 * with topic name, correctness, time taken, mode, difficulty, and
 * timestamp. Each record has a delete button. The "Delete All Data"
 * button clears the entire store. Both delete actions require confirmation
 * via an in-app {@link ConfirmDialog} before they are applied. Pagination
 * controls limit the list to PAGE_SIZE records at a time for performance
 * with large histories.
 */
export function ManageDataModal() {
	const isOpen = useUiStore(state => state.activeModal === 'manage-data');
	const closeModal = useUiStore(state => state.closeModal);
	const results = useProgressStore(state => state.results);
	const deleteResult = useProgressStore(state => state.deleteResult);
	const clearResults = useProgressStore(state => state.clearResults);
	const specification = useSpecStore(state => state.specification);
	const [page, setPage] = useState(0);
	const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
	const sortedResults = [...results].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
	const totalPages = Math.max(1, Math.ceil(sortedResults.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages - 1);
	const pageResults = sortedResults.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
	const handleDeleteAll = () => {
		setConfirmDeleteAll(true);
	};
	const handleConfirmDeleteAll = () => {
		clearResults();
		setPage(0);
		setConfirmDeleteAll(false);
	};
	const handleConfirmDeleteOne = () => {
		if (confirmDeleteId) {
			deleteResult(confirmDeleteId);
		}
		setConfirmDeleteId(null);
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
				footer={
					<>
						<button type="button" className="secondary-button" id="delete-all-btn" onClick={handleDeleteAll} disabled={results.length === 0}>
							Delete All Data
						</button>
						<button type="button" className="primary-button" onClick={closeModal}>
							Close
						</button>
					</>
				}
			>
				{results.length === 0 ? (
					<p className="empty-data">No practice data recorded yet. Start a session to build your history.</p>
				) : (
					<>
						<p className="data-summary">{results.length} record(s) total</p>
						<div id="data-list" className="data-list">
							{pageResults.map(result => (
								<div key={result.id} className="data-item">
									<div className="data-item-info">
										<span className={`data-item-result ${result.is_correct ? 'correct' : 'incorrect'}`}>{result.is_correct ? '✓' : '✗'}</span>
										<span className="data-item-topic">{getTopicName(result.topic_id)}</span>
										<span className="data-item-meta">
											{result.mode} &middot; D{result.difficulty} &middot; {(result.time_taken_ms / 1000).toFixed(1)}s &middot; {new Date(result.timestamp).toLocaleString()}
										</span>
									</div>
									<button type="button" className="icon-button data-item-delete" aria-label="Delete record" title="Delete record" onClick={() => setConfirmDeleteId(result.id)}>
										✕
									</button>
								</div>
							))}
						</div>
						{totalPages > 1 && (
							<div className="data-pagination">
								<button type="button" className="secondary-button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
									Previous
								</button>
								<span className="pagination-info">
									Page {currentPage + 1} of {totalPages}
								</span>
								<button type="button" className="secondary-button" disabled={currentPage >= totalPages - 1} onClick={() => setPage(currentPage + 1)}>
									Next
								</button>
							</div>
						)}
					</>
				)}
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
		</>
	);
}
