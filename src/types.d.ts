/**
 * Represents a single question with all metadata needed for display and grading.
 */
export interface Question{
	id: string;
	topicId: string;
	topicName: string;
	text: string;
	answer: string;
	answerType: "numeric"|"expression"|"string";
	unit?: string;
	choices?: string[];
	difficulty: "easy"|"medium"|"hard";
	questionType: "MC"|"MR"|"TBR"|"LAB"|"QQT";
}

/**
 * Options passed to every generator function.
 */
export interface GenerateOptions{
	difficulty: "easy"|"medium"|"hard";
	forceMcq?: boolean;
	seed?: number;
}

/**
 * Signature for a generator function that produces a Question.
 */
export type GeneratorFn=(options: GenerateOptions)=>Question;

/**
 * Registry mapping topic IDs (e.g., "kinematics") to their generator functions.
 */
export interface GeneratorRegistry{
	[key: string]: GeneratorFn;
}

/**
 * Application settings persisted in localStorage.
 */
export interface AppSettings{
	theme: "light"|"dark"|"system";
	defaultMode: "single"|"mental";
	autoContinue: boolean;
	shuffle: boolean;
	defaultScope: string;
	notifications: boolean;
	difficulty: "easy"|"medium"|"hard";
	timerSeconds: number;
	maxQuestions: number;
	autoCheckDelayMs: number;
	decimalPlaces: number;
	sound: boolean;
	vibration: boolean;
	mcqChoices: number;
	performanceMode: boolean;
	waveBackground: boolean;
	blurEffect: boolean;
}

/**
 * Runtime state for a mental mode session.
 */
export interface MentalSession{
	active: boolean;
	paused: boolean;
	score: number;
	total: number;
	timeLeft: number;
	timerInterval: number|null;
	questionsRemaining: number;
	unlimited: boolean;
	startTime: number;
}

/**
 * Seeded pseudo‑random number generator (mulberry32).
 */
export class SeededRandom{
	private numSeed: number;
	constructor(numSeedValue: number){
		this.numSeed=numSeedValue;
	}
	/** Returns a random integer in [min, max] (inclusive). */
	public nextInt(numMin: number, numMax: number): number{
		return Math.floor(this.nextFloat()*(numMax-numMin+1))+numMin;
	}
	/** Returns a random float in [0, 1). */
	public nextFloat(): number{
		let numT=this.numSeed+=0x6D2B79F5;
		numT=Math.imul(numT^numT>>>15, numT|1);
		numT^=numT+Math.imul(numT^numT>>>17, numT|1);
		return ((numT>>>0)/4294967296);
	}
	/** Returns a random element from an array. */
	public choice<T>(arrItems: T[]): T{
		return arrItems[this.nextInt(0,arrItems.length-1)];
	}
}