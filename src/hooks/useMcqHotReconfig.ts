import {useEffect, useRef} from "react";
import {useServices} from "./useServices";
import {usePracticeStore, selectCurrentQuestion} from "../stores/practiceStore";
import {QUESTION_TYPES} from "../types/models";
export function useMcqHotReconfig(): void {
	let {session: sessionService}=useServices();
	let sessionServiceRef=useRef(sessionService);
	sessionServiceRef.current=sessionService;
	let mcqEnabled=usePracticeStore(state => state.mcqEnabled);
	let prevMcqEnabledRef=useRef(mcqEnabled);
	let generationRef=useRef(0);
	useEffect(() => {
		if (mcqEnabled===prevMcqEnabledRef.current) {
			return;
		}
		prevMcqEnabledRef.current=mcqEnabled;
		let generation=++generationRef.current;
		let state=usePracticeStore.getState();
		let session=state.session;
		let currentQuestion=selectCurrentQuestion(state);
		if (!session || !currentQuestion || session.isFinished || !session.isActive) {
			return;
		}
		let targetType=mcqEnabled ? QUESTION_TYPES.MC : QUESTION_TYPES.SA;
		if (currentQuestion.question_type===targetType) {
			return;
		}
		void (async () => {
			await sessionServiceRef.current.regenerateCurrentQuestionAs(targetType);
			if (generation!==generationRef.current) {
				return;
			}
			let updatedSession=sessionServiceRef.current.getSession();
			usePracticeStore.setState({
				session: updatedSession,
				userAnswer: "",
				selectedChoiceIndex: -1,
				showFeedback: false,
				lastResult: null,
			});
		})();
	}, [mcqEnabled]);
}
