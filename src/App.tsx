import {useEffect} from 'react';
import {AppShell} from './components/layout/AppShell';
import {Toolbar} from './components/ui';
import {ControlToolbarTop} from './components/practice/ControlToolbarTop';
import {ControlToolbarBottom} from './components/practice/ControlToolbarBottom';
import {MainContent} from './components/practice/MainContent';
import {OnboardingModal} from './components/modals/OnboardingModal';
import {ShortcutsModal} from './components/modals/ShortcutsModal';
import {SettingsModal} from './components/modals/SettingsModal';
import {PrintModal} from './components/modals/PrintModal';
import {RecommendModal} from './components/modals/RecommendModal';
import {ManageDataModal} from './components/modals/ManageDataModal';
import {useTheme} from './hooks/useTheme';
import {useGlobalShortcuts} from './hooks/useGlobalShortcuts';
import {useSpecStore} from './stores/specStore';
import {useSettingsStore} from './stores/settingsStore';
import {useUiStore} from './stores/uiStore';
/**
 * Root application component.
 *
 * The app is a single practice surface per the reference design, so
 * react-router is no longer used: the shell renders the control toolbar
 * (top + bottom rows) and the main content area (question card + answer
 * section). The default specification is loaded once on mount so the topics
 * section can render pills. The onboarding overlay auto-opens on first
 * launch (when `onboardingCompleted` is still false).
 */
function App() {
	useTheme();
	useGlobalShortcuts();
	const loadSpec = useSpecStore(state => state.load);
	const specLoading = useSpecStore(state => state.loading);
	const specError = useSpecStore(state => state.error);
	const onboardingCompleted = useSettingsStore(state => state.onboardingCompleted);
	const openModal = useUiStore(state => state.openModal);
	useEffect(() => {
		void loadSpec();
	}, [loadSpec]);
	useEffect(() => {
		if (!onboardingCompleted) {
			openModal('onboarding');
		}
	}, [onboardingCompleted, openModal]);
	if (specError) {
		return (
			<AppShell>
				<div className="spec-error" role="alert">
					<h2>Failed to load specification</h2>
					<p>{specError}</p>
					<button type="button" className="primary-button" onClick={() => void loadSpec()}>
						Retry
					</button>
				</div>
			</AppShell>
		);
	}
	if (specLoading) {
		return (
			<AppShell>
				<div className="spec-loading" role="status" aria-live="polite">
					Loading specification…
				</div>
			</AppShell>
		);
	}
	return (
		<AppShell>
			<Toolbar>
				<ControlToolbarTop />
				<ControlToolbarBottom />
			</Toolbar>
			<MainContent />
			<OnboardingModal />
			<ShortcutsModal />
			<SettingsModal />
			<PrintModal />
			<RecommendModal />
			<ManageDataModal />
		</AppShell>
	);
}
export default App;
