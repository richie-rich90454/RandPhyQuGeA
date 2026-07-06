import {useCallback, useEffect, useState} from "react";
import {useServices} from "./useServices";
import {usePracticeStore} from "../stores/practiceStore";
import {useUiStore} from "../stores/uiStore";
import type {SessionSnapshot} from "../services/contracts";
/** Result returned by {@link useSessionSnapshot}. */
export interface UseSessionSnapshotResult {
	/** The persisted unfinished snapshot, if one was found. */
	snapshot: SessionSnapshot | null;
	/** Resume the saved session in the active practice store. */
	resume: () => void;
	/** Discard the saved snapshot and clear persisted storage. */
	discard: () => void;
}
/**
 * Check for a persisted unfinished session on mount and expose resume/discard
 * actions. When an unfinished snapshot exists, the "resume-session" modal is
 * opened automatically so the user can decide whether to continue.
 */
export function useSessionSnapshot(): UseSessionSnapshotResult {
	let {session: sessionService}=useServices();
	let setSession=usePracticeStore(state => state.setSession);
	let openModal=useUiStore(state => state.openModal);
	let [snapshot, setSnapshot]=useState<SessionSnapshot | null>(null);
	useEffect(() => {
		let cancelled=false;
		async function load() {
			let loaded=await sessionService.loadSessionSnapshot();
			if (!cancelled && loaded && !loaded.session.isFinished) {
				setSnapshot(loaded);
				openModal("resume-session");
			}
		}
		void load();
		return () => {
			cancelled=true;
		};
	}, [sessionService, openModal]);
	let resume=useCallback(() => {
		if (!snapshot) {
			return;
		}
		void sessionService.resumeSession(snapshot).then(session => {
			setSession(session);
		});
	}, [snapshot, sessionService, setSession]);
	let discard=useCallback(() => {
		sessionService.clearSessionSnapshot();
		setSnapshot(null);
	}, [sessionService]);
	return {snapshot, resume, discard};
}
