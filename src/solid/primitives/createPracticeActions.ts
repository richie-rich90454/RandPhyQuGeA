import {onMount, onCleanup} from "solid-js";
import {usePracticeStore, selectCurrentQuestion} from "../stores/practiceStore";
import type {PracticeState} from "../stores/practiceStore";
import {useProgressStore} from "../stores/progressStore";
import type {ProgressState} from "../stores/progressStore";
import {useUiStore} from "../stores/uiStore";
import type {UiState} from "../stores/uiStore";
import type {SolidStore} from "../stores/createSolidStore";
import type {ISessionService} from "../../services/contracts";
import {SessionService} from "../../services/SessionService";
import {PhysicsService} from "../../services/PhysicsService";
import {AnalyticsService} from "../../services/AnalyticsService";
import {useServiceProvider} from "../providers/ServiceProvider";
import type {PracticeMode} from "../../types/models";
export interface CreatePracticeActionsOptions {
	/** Restrict checking to a specific mode. Omit to accept any active mode. */
	mode?: PracticeMode;
	/** Whether the Shift+Enter submit shortcut is active. Defaults to true. */
	shortcutEnabled?: boolean;
	practiceStore?: SolidStore<PracticeState>;
	progressStore?: SolidStore<ProgressState>;
	uiStore?: SolidStore<UiState>;
	sessionService?: ISessionService;
}
export interface CreatePracticeActionsReturn {
	/** Evaluate the current answer, persist the result, and reveal feedback. */
	check: () => Promise<void>;
}
/**
 * Shared practice submission logic for Single and Mental modes.
 *
 * Solid port of {@link ../../hooks/usePracticeActions}: `check` delegates to
 * `SessionService.submitAnswer`, persists the returned `PracticeResult` to the
 * progress store so it survives reloads, and updates the practice store with
 * feedback state. The optional `mode` filter mirrors the per-mode guard each
 * hook previously inlined (Mental rejects submissions outside a Mental
 * session). The Shift+Enter shortcut is extracted here so both modes share one
 * keydown listener. Solid's reactive closures always read the latest store
 * state through `getState()`, so the React ref bookkeeping is unnecessary; an
 * `isSubmitting` flag still guards against re-entrancy within a single
 * in-flight submission. The session service is injectable; when omitted it is
 * built lazily from the {@link useServiceProvider} core.
 */
export function createPracticeActions(options: CreatePracticeActionsOptions = {}): CreatePracticeActionsReturn {
	let practice=options.practiceStore ?? usePracticeStore;
	let progress=options.progressStore ?? useProgressStore;
	let ui=options.uiStore ?? useUiStore;
	let mode=options.mode;
	let shortcutEnabled=options.shortcutEnabled !== false;
	let cachedSessionService: ISessionService | null=null;
	let resolveSessionService=(): ISessionService => {
		if (options.sessionService) {
			return options.sessionService;
		}
		if (!cachedSessionService) {
			let {core}=useServiceProvider();
			cachedSessionService=new SessionService(new PhysicsService(core), new AnalyticsService());
		}
		return cachedSessionService;
	};
	let isSubmitting=false;
	let check=async (): Promise<void> => {
		let store=practice.getState();
		let currentQuestion=selectCurrentQuestion(store);
		if (!store.session || !currentQuestion || store.showFeedback) {
			return;
		}
		if (mode!==undefined && store.session.mode!==mode) {
			return;
		}
		if (isSubmitting) {
			return;
		}
		isSubmitting=true;
		try {
			let sessionService=resolveSessionService();
			let result=await sessionService.submitAnswer(
				store.userAnswer,
				store.selectedChoiceIndex>=0 ? store.selectedChoiceIndex : undefined,
			);
			progress.getState().addResults([result]);
			practice.setState({
				session: sessionService.getSession(),
				showFeedback: true,
				lastResult: {isCorrect: result.is_correct, correctAnswer: currentQuestion.answer, userAnswer: result.user_answer},
			});
		} finally {
			isSubmitting=false;
		}
	};
	if (shortcutEnabled) {
		let handleKeyDown=(event: KeyboardEvent) => {
			if (event.shiftKey && event.key==="Enter") {
				if (ui.getState().activeModal) {
					return;
				}
				if (practice.getState().showFeedback) {
					return;
				}
				let target=event.target as HTMLElement | null;
				if (target && (target.tagName==="TEXTAREA" || target.tagName==="INPUT")) {
					event.preventDefault();
					void check();
				}
			}
		};
		onMount(() => {
			window.addEventListener("keydown", handleKeyDown);
		});
		onCleanup(() => {
			window.removeEventListener("keydown", handleKeyDown);
		});
	}
	return {check};
}
