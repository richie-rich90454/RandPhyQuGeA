import {useMemo} from 'react';
import {useSpecStore} from '../../stores/specStore';
import {usePracticeStore} from '../../stores/practiceStore';
import {useUiStore} from '../../stores/uiStore';
import {ToolbarSection, ToolbarTitle, Pill} from '../ui';
import type {Specification, Topic, Unit} from '../../types/models';
/**
 * Derive a short uppercase abbreviation from a unit name for use as the
 * topic-pill icon. Falls back to the first two characters of the name when
 * the name is a single word, otherwise uses the first letter of each word.
 */
function getUnitAbbreviation(unitName: string): string {
	const trimmed = unitName.trim();
	if (trimmed.length === 0) return '?';
	const words = trimmed.split(/\s+/).filter(word => word.length > 0);
	if (words.length >= 2) {
		return words
			.slice(0, 2)
			.map(word => word[0] ?? '')
			.join('')
			.toUpperCase();
	}
	return trimmed.slice(0, 2).toUpperCase();
}
interface TopicPillEntry {
	topic: Topic;
	abbreviation: string;
	unitName: string;
}
/**
 * Build a flat list of topic-pill entries from the specification, grouping
 * by unit only to derive the pill icon (unit abbreviation). Topics without a
 * matching unit fall back to a question-mark icon.
 */
function buildTopicEntries(specification: Specification): TopicPillEntry[] {
	const unitById = new Map<string, Unit>();
	for (const unit of specification.units) {
		unitById.set(unit.id, unit);
	}
	return specification.topics.map(topic => {
		const unit = unitById.get(topic.unit_id);
		const unitName = unit?.name ?? '';
		const abbreviation = unitName ? getUnitAbbreviation(unitName) : '?';
		return {topic, abbreviation, unitName};
	});
}
/**
 * Topics section mapped to a `.toolbar-section` containing the `.toolbar-title`,
 * the `#topic-search` input, and the `.topic-pills-container`.
 *
 * Pills are rendered from the parsed specification (grouped by unit for the
 * icon abbreviation), filtered by the UI store's search query. Selecting a
 * pill writes the topic id to the practice store so question generation can
 * scope to that topic. A null selection (clicking the active pill again)
 * clears the filter so the generator draws from all topics.
 */
export function TopicsSection() {
	const specification = useSpecStore(state => state.specification);
	const loading = useSpecStore(state => state.loading);
	const error = useSpecStore(state => state.error);
	const selectedTopicId = usePracticeStore(state => state.selectedTopicId);
	const setSelectedTopicId = usePracticeStore(state => state.setSelectedTopicId);
	const searchQuery = useUiStore(state => state.searchQuery);
	const setSearchQuery = useUiStore(state => state.setSearchQuery);
	const entries = useMemo(() => (specification ? buildTopicEntries(specification) : []), [specification]);
	const filteredEntries = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (query === '') return entries;
		return entries.filter(entry => {
			return entry.topic.name.toLowerCase().includes(query) || entry.unitName.toLowerCase().includes(query);
		});
	}, [entries, searchQuery]);
	const handlePillClick = (topicId: string) => {
		setSelectedTopicId(selectedTopicId === topicId ? null : topicId);
	};
	return (
		<ToolbarSection>
			<ToolbarTitle id="topics-heading">Topics</ToolbarTitle>
			<div className="topic-search-wrapper">
				<input
					type="text"
					id="topic-search"
					className="answer-input topic-search"
					placeholder="Search topics..."
					aria-label="Search topics"
					value={searchQuery}
					onChange={event => setSearchQuery(event.target.value)}
				/>
			</div>
			<div className="topic-pills-container" id="topic-grid" role="group" aria-labelledby="topics-heading" aria-busy={loading}>
				{loading && (
					<>
						<span className="visually-hidden">Loading topics…</span>
						<div className="topic-skeleton" aria-hidden="true">
							<span className="skeleton skeleton-pill" />
							<span className="skeleton skeleton-pill" />
							<span className="skeleton skeleton-pill" />
							<span className="skeleton skeleton-pill" />
							<span className="skeleton skeleton-pill" />
						</div>
					</>
				)}
				{error && <span className="topic-pill-name">Error: {error}</span>}
				{!loading && !error && filteredEntries.length === 0 && <span className="topic-pill-name">No topics found.</span>}
				{!loading &&
					!error &&
					filteredEntries.map(({topic, abbreviation}) => (
						<Pill key={topic.id} name={topic.name} icon={abbreviation} active={selectedTopicId === topic.id} onClick={() => handlePillClick(topic.id)} ariaLabel={`${topic.name} (${abbreviation})`} />
					))}
			</div>
		</ToolbarSection>
	);
}
