import {createContext, useContext} from "solid-js";
import type {JSX, ParentProps} from "solid-js";
import {PhysicsCore, AnswerGrader} from "../../lib/physics";
import {usePracticeStore} from "../stores/practiceStore";
import type {PracticeState} from "../stores/practiceStore";
import {useProgressStore} from "../stores/progressStore";
import type {ProgressState} from "../stores/progressStore";
import {useSettingsStore} from "../stores/settingsStore";
import type {SettingsState} from "../stores/settingsStore";
import {useSpecStore} from "../stores/specStore";
import type {SpecState} from "../stores/specStore";
import {useUiStore} from "../stores/uiStore";
import type {UiState} from "../stores/uiStore";
import type {SolidStore} from "../stores/createSolidStore";
/** Value exposed by the Solid service context: the physics core, the answer grader, and the five Solid stores. */
export interface SolidServiceContextValue {
    core: PhysicsCore;
    grader: AnswerGrader;
    practiceStore: SolidStore<PracticeState>;
    progressStore: SolidStore<ProgressState>;
    settingsStore: SolidStore<SettingsState>;
    specStore: SolidStore<SpecState>;
    uiStore: SolidStore<UiState>;
}
const ServiceContext = createContext<SolidServiceContextValue | null>(null);
export interface ServiceProviderProps {
    core?: PhysicsCore;
    grader?: AnswerGrader;
}
export function ServiceProvider(props: ParentProps<ServiceProviderProps>): JSX.Element {
    let core = props.core ?? PhysicsCore.default();
    let grader = props.grader ?? new AnswerGrader();
    let value: SolidServiceContextValue = {
        core,
        grader,
        practiceStore: usePracticeStore,
        progressStore: useProgressStore,
        settingsStore: useSettingsStore,
        specStore: useSpecStore,
        uiStore: useUiStore,
    };
    return <ServiceContext.Provider value={value}>{props.children}</ServiceContext.Provider>;
}
export function useServiceProvider(): SolidServiceContextValue {
    let value = useContext(ServiceContext);
    if (!value) {
        throw new Error("useServiceProvider must be used within a ServiceProvider.");
    }
    return value;
}
/** Non-throwing variant of {@link useServiceProvider} for components that render their idle state without a provider. */
export function useServiceProviderOptional(): SolidServiceContextValue | null {
    return useContext(ServiceContext);
}
