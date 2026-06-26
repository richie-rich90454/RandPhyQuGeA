import {useEffect} from 'react';
import {AppShell} from './components/layout/AppShell';
import {Toolbar} from './components/ui';
import {ControlToolbarTop} from './components/practice/ControlToolbarTop';
import {useTheme} from './hooks/useTheme';
import {useSpecStore} from './stores/specStore';
/**
 * Root application component.
 *
 * The app is a single practice surface per the reference design, so
 * react-router is no longer used: the shell renders directly with the
 * control-toolbar (top row wired in Task 13, bottom row in Task 14) and the
 * main content area (populated in Task 15). The default specification is
 * loaded once on mount so the topics section can render pills.
 */
function App() {
	useTheme();
	const loadSpec = useSpecStore(state => state.load);
	useEffect(() => {
		void loadSpec();
	}, [loadSpec]);
	return (
		<AppShell>
			<Toolbar>
				<ControlToolbarTop />
			</Toolbar>
			<main className="main-content">
				<div className="content-stack">
					<div className="question-card card">
						<div className="card-header">
							<h2 className="card-title">Question</h2>
							<div className="card-subtitle">Select a topic</div>
						</div>
						<div className="card-content">
							<div className="question-display" aria-live="polite" role="region" aria-label="Question display">
								<div className="empty-state">
									<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
										<path d="M11 7h2v2h-2zm0 4h2v6h-2z" />
									</svg>
									<p>
										Pick a topic and click <strong>Generate</strong> to start
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</AppShell>
	);
}
export default App;
