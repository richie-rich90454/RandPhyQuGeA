import {useEffect} from 'react';
import {AppShell} from './components/layout/AppShell';
import {Toolbar} from './components/ui';
import {ControlToolbarTop} from './components/practice/ControlToolbarTop';
import {ControlToolbarBottom} from './components/practice/ControlToolbarBottom';
import {MainContent} from './components/practice/MainContent';
import {useTheme} from './hooks/useTheme';
import {useSpecStore} from './stores/specStore';
/**
 * Root application component.
 *
 * The app is a single practice surface per the reference design, so
 * react-router is no longer used: the shell renders the control toolbar
 * (top + bottom rows) and the main content area (question card + answer
 * section). The default specification is loaded once on mount so the topics
 * section can render pills.
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
				<ControlToolbarBottom />
			</Toolbar>
			<MainContent />
		</AppShell>
	);
}
export default App;
