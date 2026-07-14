import {createSignal, onCleanup} from "solid-js";
import type {Accessor} from "solid-js";
/** Minimal SpeechRecognition event shape used by this primitive. */
interface SpeechRecognitionAlternative {
	readonly transcript: string;
}
interface SpeechRecognitionResult {
	readonly 0: SpeechRecognitionAlternative;
	readonly isFinal: boolean;
}
interface SpeechRecognitionResultList {
	readonly length: number;
	readonly item: (index: number) => SpeechRecognitionResult;
	[index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent {
	readonly resultIndex: number;
	readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent {
	readonly error: string;
	readonly message: string;
}
/** Constructor signature for the vendor-prefixed SpeechRecognition API. */
interface SpeechRecognitionConstructor {
	new (): SpeechRecognitionInstance;
}
/** Subset of the SpeechRecognition DOM API surface used by this primitive. */
interface SpeechRecognitionInstance {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	maxAlternatives: number;
	start: () => void;
	stop: () => void;
	abort: () => void;
	onresult: ((event: SpeechRecognitionEvent) => void) | null;
	onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
	onend: (() => void) | null;
}
/** Options accepted by {@link createVoiceInput}. */
export interface CreateVoiceInputOptions {
	/** BCP-47 locale passed to the recognition instance (defaults to `document.documentElement.lang` or `"en-US"`). */
	lang?: string;
	/** Whether to keep recognizing after a final result (defaults to `false`). */
	continuous?: boolean;
	/** Whether to surface interim (non-final) results on the transcript accessor (defaults to `true`). */
	interimResults?: boolean;
	/** Override the SpeechRecognition constructor (used for testing). */
	ctor?: SpeechRecognitionConstructor;
}
/** Reactive state returned by {@link createVoiceInput}. */
export interface VoiceInputState {
	/** True when the browser exposes a SpeechRecognition constructor. */
	supported: Accessor<boolean>;
	/** True while a recognition session is actively listening. */
	listening: Accessor<boolean>;
	/** Latest recognized transcript (interim or final). */
	transcript: Accessor<string>;
	/** Latest recognition error code, or `null` when none has occurred. */
	error: Accessor<string | null>;
	/** Start listening. No-op when unsupported or already listening. */
	start: () => void;
	/** Stop listening and finalize the transcript. No-op when unsupported or not listening. */
	stop: () => void;
}
function resolveCtor(): SpeechRecognitionConstructor | null {
	if (typeof window === "undefined") return null;
	let w=window as unknown as {SpeechRecognition?: SpeechRecognitionConstructor, webkitSpeechRecognition?: SpeechRecognitionConstructor};
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
/**
 * Solid primitive wrapping the vendor-prefixed Web Speech API.
 *
 * Returns reactive `supported`/`listening`/`transcript`/`error` accessors plus
 * `start()`/`stop()` controls. When the browser does not expose a
 * SpeechRecognition constructor (Firefox, older Safari, jsdom), `supported`
 * stays `false` and `start()`/`stop()` become no-ops so the UI can render a
 * graceful fallback. The recognition instance is created lazily on the first
 * `start()` call and torn down via `onCleanup` so reactive owners (components,
 * `createRoot`, `render`) never leak event handlers or microphone handles.
 */
export function createVoiceInput(options: CreateVoiceInputOptions = {}): VoiceInputState {
	let ctor=options.ctor ?? resolveCtor();
	let supported=ctor !== null;
	let [listening, setListening]=createSignal<boolean>(false);
	let [transcript, setTranscript]=createSignal<string>("");
	let [error, setError]=createSignal<string | null>(null);
	let recognition: SpeechRecognitionInstance | null=null;
	let baseLang=options.lang ?? (typeof document !== "undefined" && document.documentElement.lang ? document.documentElement.lang : "en-US");
	let shouldUseInterim=options.interimResults ?? true;
	let cleanup=() => {
		if (recognition) {
			recognition.onresult=null;
			recognition.onerror=null;
			recognition.onend=null;
			try {
				recognition.abort();
			} catch {
				// ignore — already stopped or never started
			}
			recognition=null;
		}
		setListening(false);
	};
	onCleanup(cleanup);
	let start=() => {
		if (!supported || listening() || !ctor) return;
		setError(null);
		setTranscript("");
		let instance=new ctor();
		instance.lang=baseLang;
		instance.continuous=options.continuous ?? false;
		instance.interimResults=shouldUseInterim;
		instance.maxAlternatives=1;
		instance.onresult=(event: SpeechRecognitionEvent) => {
			let text="";
			for (let i=event.resultIndex; i<event.results.length; i++) {
				let result=event.results[i];
				if (!result) continue;
				if (!shouldUseInterim && !result.isFinal) continue;
				let alt=result[0];
				if (!alt) continue;
				text += alt.transcript;
			}
			if (text) setTranscript(text);
		};
		instance.onerror=(event: SpeechRecognitionErrorEvent) => {
			setError(event.error);
			setListening(false);
		};
		instance.onend=() => {
			setListening(false);
		};
		recognition=instance;
		try {
			instance.start();
			setListening(true);
		} catch {
			setError("start-failed");
			recognition=null;
		}
	};
	let stop=() => {
		if (!supported || !recognition || !listening()) return;
		try {
			recognition.stop();
		} catch {
			// ignore — already stopped
		}
		setListening(false);
	};
	return {
		supported: () => supported,
		listening,
		transcript,
		error,
		start,
		stop,
	};
}
