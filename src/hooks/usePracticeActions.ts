import {useCallback, useEffect, useRef} from "react";
import {usePracticeStore, selectCurrentQuestion} from "../stores/practiceStore";
import {useProgressStore} from "../stores/progressStore";
import {useUiStore} from "../stores/uiStore";
import {useServices} from "./useServices";
import type {PracticeMode} from "../types/models";
export interface UsePracticeActionsOptions {
	/** Restrict checking to a specific mode. Omit to accept any active mode. */
	mode?: PracticeMode;
	/** Whether the Shift+Enter submit shortcut is active. Defaults to true. */
	shortcutEnabled?: boolean;
}
export interface UsePracticeActionsReturn {
	/** Evaluate the current answer, persist the result, and reveal feedback. */
	check: () => Promise<void>;
}
/**
 * Shared practice submission logic for Single and Mental modes.
 *
 * `check` delegates to `SessionService.submitAnswer`, persists the returned
 * `PracticeResult` to the progress store so it survives reloads, and updates
 * the practice store with feedback state. The optional `mode` filter mirrors
 * the per-mode guard each hook previously inlined (Mental rejects submissions
 * outside a Mental session). The Shift+Enter shortcut is extracted here so
 * both modes share one keydown listener instead of duplicating it.
 *
 * Stale closures are avoided by reading the latest store state through
 * `getState()` and by keeping mutable options (`mode`, the service instance)
 * in refs. `check` therefore has a stable identity and the keydown listener
 * is only recreated when `shortcutEnabled` changes.
 */
export function usePracticeActions(options: UsePracticeActionsOptions = {}): UsePracticeActionsReturn {
	const {mode, shortcutEnabled=true}=options;
	const {session: sessionService}=useServices();
	const modeRef=useRef(mode);
	modeRef.current=mode;
	const sessionServiceRef=useRef(sessionService);
	sessionServiceRef.current=sessionService;
	const isSubmittingRef=useRef(false);
	const check=useCallback(async () => {
		const store=usePracticeStore.getState();
		const currentQuestion=selectCurrentQuestion(store);
		if (!store.session || !currentQuestion || store.showFeedback) return;
		if (modeRef.current!==undefined && store.session.mode!==modeRef.current) return;
		if (isSubmittingRef.current) return;
		isSubmittingRef.current=true;
		try {
			const result=await sessionServiceRef.current.submitAnswer(
				store.userAnswer,
				store.selectedChoiceIndex>=0 ? store.selectedChoiceIndex : undefined,
			);
			useProgressStore.getState().addResults([result]);
			usePracticeStore.setState({
				session: sessionServiceRef.current.getSession(),
				showFeedback: true,
				lastResult: {isCorrect: result.is_correct, correctAnswer: currentQuestion.answer},
			});
		} finally {
			isSubmittingRef.current=false;
		}
	}, []);
	useEffect(() => {
		if (!shortcutEnabled) return;
		const handleKeyDown=(event: KeyboardEvent) => {
			if (event.shiftKey && event.key==="Enter") {
				if (useUiStore.getState().activeModal) return;
				if (usePracticeStore.getState().showFeedback) return;
				const target=event.target as HTMLElement | null;
				if (target && (target.tagName==="TEXTAREA" || target.tagName==="INPUT")) {
					event.preventDefault();
					void check();
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [check, shortcutEnabled]);
	return {check};
}
