import {createEffect, onCleanup} from "solid-js";
import {usePracticeStore, selectCurrentQuestion} from "../stores/practiceStore";
import type {PracticeState} from "../stores/practiceStore";
import type {SolidStore} from "../stores/createSolidStore";
import type {ISessionService} from "../../services/contracts";
import {SessionService} from "../../services/SessionService";
import {PhysicsService} from "../../services/PhysicsService";
import {AnalyticsService} from "../../services/AnalyticsService";
import {useServiceProvider} from "../providers/ServiceProvider";
import {QUESTION_TYPES} from "../../types/models";
import type {QuestionType} from "../../types/models";
export interface CreateMcqHotReconfigOptions {
	practiceStore?: SolidStore<PracticeState>;
	sessionService?: ISessionService;
}
/**
 * Hot-swap the current question between multiple-choice and short-answer when
 * the `mcqEnabled` flag toggles.
 *
 * Solid port of {@link ../../hooks/useMcqHotReconfig}: subscribes to the
 * practice store's `mcqEnabled` slice once (via the Solid accessor returned by
 * the store hook) and re-runs a `createEffect` when it changes. On each
 * toggled run it asks the session service to regenerate the current question
 * as `MC` (when enabled) or `SA` (when disabled), then writes the updated
 * session back into the practice store with the answer UI reset. A generation
 * counter supersedes stale in-flight regenerations when the flag toggles
 * rapidly, and a disposal flag (set via `onCleanup`) prevents any write after
 * unmount. The session service is injectable; when omitted it is built lazily
 * from the {@link useServiceProvider} core.
 */
export function createMcqHotReconfig(options: CreateMcqHotReconfigOptions = {}): void {
	let practice=options.practiceStore ?? usePracticeStore;
	let mcqEnabled=practice(s => s.mcqEnabled);
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
	let generation=0;
	let prevMcqEnabled: boolean | undefined=undefined;
	let disposed=false;
	onCleanup(() => {
		disposed=true;
	});
	createEffect(() => {
		let enabled=mcqEnabled();
		if (prevMcqEnabled===undefined) {
			prevMcqEnabled=enabled;
			return;
		}
		if (enabled===prevMcqEnabled) {
			return;
		}
		prevMcqEnabled=enabled;
		let state=practice.getState();
		let session=state.session;
		let currentQuestion=selectCurrentQuestion(state);
		if (!session || !currentQuestion || session.isFinished || !session.isActive) {
			return;
		}
		let targetType: QuestionType=enabled ? QUESTION_TYPES.MC : QUESTION_TYPES.SA;
		if (currentQuestion.question_type===targetType) {
			return;
		}
		let myGen=++generation;
		void (async () => {
			await resolveSessionService().regenerateCurrentQuestionAs(targetType);
			if (disposed || myGen!==generation) {
				return;
			}
			let updatedSession=resolveSessionService().getSession();
			practice.setState({
				session: updatedSession,
				userAnswer: "",
				selectedChoiceIndex: -1,
				showFeedback: false,
				lastResult: null,
			});
		})();
	});
}
