import {createSignal, onMount, onCleanup} from "solid-js";
import type {Accessor} from "solid-js";
import {usePracticeStore} from "../stores/practiceStore";
import type {PracticeState} from "../stores/practiceStore";
import {useUiStore} from "../stores/uiStore";
import type {UiState} from "../stores/uiStore";
import type {SolidStore} from "../stores/createSolidStore";
import type {ISessionService, SessionSnapshot} from "../../services/contracts";
import {SessionService} from "../../services/SessionService";
import {PhysicsService} from "../../services/PhysicsService";
import {AnalyticsService} from "../../services/AnalyticsService";
import {useServiceProvider} from "../providers/ServiceProvider";
export interface CreateSessionSnapshotOptions {
    practiceStore?: SolidStore<PracticeState>;
    uiStore?: SolidStore<UiState>;
    sessionService?: ISessionService;
}
export interface CreateSessionSnapshotReturn {
    snapshot: Accessor<SessionSnapshot | null>;
    resume: () => void;
    discard: () => void;
}
/**
 * Check for a persisted unfinished session on mount and expose resume/discard
 * actions.
 *
 * Solid port of {@link ../../hooks/useSessionSnapshot}: on mount it loads any
 * saved snapshot via the session service and, when an unfinished session is
 * found, opens the "resume-session" modal. `resume` restores the session into
 * the practice store; `discard` clears the persisted snapshot. A disposal flag
 * mirrors the React hook's `cancelled` guard so state is never written after
 * unmount. The session service is injectable; when omitted it is built lazily
 * from the {@link useServiceProvider} core.
 */
export function createSessionSnapshot(options: CreateSessionSnapshotOptions = {}): CreateSessionSnapshotReturn {
    let practice = options.practiceStore ?? usePracticeStore;
    let ui = options.uiStore ?? useUiStore;
    let cachedSessionService: ISessionService | null = null;
    let resolveSessionService = (): ISessionService => {
        if (options.sessionService) {
            return options.sessionService;
        }
        if (!cachedSessionService) {
            let {core} = useServiceProvider();
            cachedSessionService = new SessionService(new PhysicsService(core), new AnalyticsService());
        }
        return cachedSessionService;
    };
    let [snapshot, setSnapshot] = createSignal<SessionSnapshot | null>(null);
    let disposed = false;
    onCleanup(() => {
        disposed = true;
    });
    onMount(() => {
        void (async () => {
            let loaded = await resolveSessionService().loadSessionSnapshot();
            if (!disposed && loaded && !loaded.session.isFinished) {
                setSnapshot(loaded);
                ui.getState().openModal("resume-session");
            }
        })();
    });
    let resume = () => {
        let current = snapshot();
        if (!current) {
            return;
        }
        void resolveSessionService()
            .resumeSession(current)
            .then(session => {
                if (!disposed) {
                    practice.getState().setSession(session);
                }
            });
    };
    let discard = () => {
        resolveSessionService().clearSessionSnapshot();
        setSnapshot(null);
    };
    return {snapshot, resume, discard};
}
