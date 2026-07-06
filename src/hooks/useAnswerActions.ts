import {useCallback, useRef, useState} from "react";
import {useServices} from "./useServices";
import {usePracticeStore, selectCurrentQuestion} from "../stores/practiceStore";
import {useProgressStore} from "../stores/progressStore";
import {useUiStore} from "../stores/uiStore";
import {QUESTION_TYPES} from "../types/models";
export interface UseAnswerActionsReturn {
	/** True when an answer can be submitted for the current question. */
	canSubmit: boolean;
	/** True when the session can advance to the next question after feedback. */
	canAdvance: boolean;
	/** True while an answer is being evaluated. */
	isSubmitting: boolean;
	/** Evaluate the current answer, persist the result, and reveal feedback. */
	submit: () => Promise<void>;
	/** Move to the next question after feedback, or finish the session. */
	advance: () => Promise<void>;
	/** Global keyboard shortcut handler for digits 1-4 and Enter/Shift+Enter. */
	handleKeyDown: (event: KeyboardEvent) => void;
}
/**
 * Answer orchestration hook for {@link AnswerSection}.
 *
 * Reads the latest practice-store state through `getState()` to avoid stale
 * closures and wires {@link SessionService.submitAnswer} and
 * {@link SessionService.advanceQuestion} directly. Exposes boolean guards for
 * the Check/Next buttons and a window keydown handler that supports 1-4 for
 * MCQ choices and Enter/Shift+Enter to submit or advance.
 */
export function useAnswerActions(): UseAnswerActionsReturn {
	const {session: sessionService}=useServices();
	const sessionServiceRef=useRef(sessionService);
	sessionServiceRef.current=sessionService;
	const [isSubmitting, setIsSubmitting]=useState(false);
	const isSubmittingRef=useRef(false);
	const canSubmit=usePracticeStore(useCallback(state => {
		const currentQuestion=selectCurrentQuestion(state);
		if (!state.session || !currentQuestion || state.showFeedback) return false;
		return state.userAnswer.trim()!=="" || state.selectedChoiceIndex>=0;
	}, []));
	const canAdvance=usePracticeStore(useCallback(state => {
		if (!state.session || !state.showFeedback) return false;
		return state.session.currentIndex<state.session.questions.length-1;
	}, []));
	const canSubmitRef=useRef(canSubmit);
	const canAdvanceRef=useRef(canAdvance);
	canSubmitRef.current=canSubmit;
	canAdvanceRef.current=canAdvance;
	const submit=useCallback(async () => {
		const store=usePracticeStore.getState();
		const currentQuestion=selectCurrentQuestion(store);
		if (!store.session || !currentQuestion || store.showFeedback) return;
		if (isSubmittingRef.current) return;
		isSubmittingRef.current=true;
		setIsSubmitting(true);
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
			setIsSubmitting(false);
		}
	}, []);
	const advance=useCallback(async () => {
		const store=usePracticeStore.getState();
		if (!store.session || !store.showFeedback) return;
		const advanced=await sessionServiceRef.current.advanceQuestion();
		if (advanced) {
			usePracticeStore.setState({
				session: sessionServiceRef.current.getSession(),
				userAnswer: "",
				selectedChoiceIndex: -1,
				showFeedback: false,
				lastResult: null,
			});
		} else {
			await sessionServiceRef.current.finishSession();
			usePracticeStore.setState({
				session: sessionServiceRef.current.getSession(),
			});
		}
	}, []);
	const handleKeyDown=useCallback((event: KeyboardEvent) => {
		if (useUiStore.getState().activeModal) return;
		const store=usePracticeStore.getState();
		const currentQuestion=selectCurrentQuestion(store);
		const target=event.target as HTMLElement | null;
		const isTyping=target && (target.tagName==="TEXTAREA" || target.tagName==="INPUT" || target.isContentEditable);
		const digit=event.key;
		if (!isTyping && !store.showFeedback && currentQuestion?.question_type===QUESTION_TYPES.MC && currentQuestion.choices && currentQuestion.choices.length>0) {
			if (digit>="1" && digit<="4") {
				const index=parseInt(digit, 10)-1;
				if (index<currentQuestion.choices.length) {
					event.preventDefault();
					usePracticeStore.getState().selectChoice(index);
				}
			}
		}
		if (event.key==="Enter") {
			if (store.showFeedback && canAdvanceRef.current) {
				event.preventDefault();
				void advance();
			} else if (canSubmitRef.current) {
				event.preventDefault();
				void submit();
			}
		}
	}, [submit, advance]);
	return {canSubmit, canAdvance, isSubmitting, submit, advance, handleKeyDown};
}
