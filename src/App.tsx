import {useEffect} from 'react';
import {AppShell} from './components/layout/AppShell';
import {Toolbar} from './components/ui';
import {ControlToolbarTop} from './components/practice/ControlToolbarTop';
import {ControlToolbarBottom} from './components/practice/ControlToolbarBottom';
import {MainContent} from './components/practice/MainContent';
import {OnboardingModal} from './components/modals/OnboardingModal';
import {ShortcutsModal} from './components/modals/ShortcutsModal';
import {useTheme} from './hooks/useTheme';
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
	const loadSpec = useSpecStore(state => state.load);
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
	return (
		<AppShell>
			<Toolbar>
				<ControlToolbarTop />
				<ControlToolbarBottom />
			</Toolbar>
			<MainContent />
			<OnboardingModal />
			<ShortcutsModal />
		</AppShell>
	);
}
export default App;
