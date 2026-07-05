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
import {useEffect} from "react";
import {AppShell} from "./components/layout/AppShell";
import {Toolbar} from "./components/ui";
import {ControlToolbarTop} from "./components/practice/ControlToolbarTop";
import {ControlToolbarBottom} from "./components/practice/ControlToolbarBottom";
import {MainContent} from "./components/practice/MainContent";
import {OnboardingModal} from "./components/modals/OnboardingModal";
import {ShortcutsModal} from "./components/modals/ShortcutsModal";
import {SettingsModal} from "./components/modals/SettingsModal";
import {PrintModal} from "./components/modals/PrintModal";
import {RecommendModal} from "./components/modals/RecommendModal";
import {ManageDataModal} from "./components/modals/ManageDataModal";
import {ServiceProvider} from "./components/providers/ServiceProvider";
import {useTheme, useGlobalShortcuts} from "./hooks";
import {useSpecStore, useSettingsStore, useUiStore} from "./stores";
function App() {
	useTheme();
	useGlobalShortcuts();
	let loadSpec=useSpecStore(state => state.load);
	let specLoading=useSpecStore(state => state.loading);
	let specError=useSpecStore(state => state.error);
	let onboardingCompleted=useSettingsStore(state => state.onboardingCompleted);
	let openModal=useUiStore(state => state.openModal);
	useEffect(() => {
		void loadSpec();
	}, [loadSpec]);
	useEffect(() => {
		if (!onboardingCompleted) {
			openModal("onboarding");
		}
	}, [onboardingCompleted, openModal]);
	if (specError) {
		return (
			<ServiceProvider>
				<AppShell>
					<div className="spec-error" role="alert">
						<h2>Failed to load specification</h2>
						<p>{specError}</p>
						<button type="button" className="primary-button" onClick={() => void loadSpec()}>
							Retry
						</button>
					</div>
				</AppShell>
			</ServiceProvider>
		);
	}
	if (specLoading) {
		return (
			<ServiceProvider>
				<AppShell>
					<div className="spec-skeleton" role="status" aria-live="polite" aria-busy="true">
						<span className="visually-hidden">Loading specification…</span>
						<div className="skeleton skeleton-bar skeleton-bar--lg" aria-hidden="true" />
						<div className="skeleton skeleton-bar" aria-hidden="true" />
						<div className="skeleton skeleton-bar" aria-hidden="true" />
						<div className="skeleton skeleton-bar skeleton-bar--sm" aria-hidden="true" />
					</div>
				</AppShell>
			</ServiceProvider>
		);
	}
	return (
		<ServiceProvider>
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
		</ServiceProvider>
	);
}
export default App;
