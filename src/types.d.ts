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
	questionType: "MC"|"Math"|"Graphical"|"Experiment"|"QualQuant";
	explanation?: string;
}
export interface GenerateOptions{
	difficulty: "easy"|"medium"|"hard";
	forceMcq?: boolean;
	seed?: number;
}
export type GeneratorFn=(options: GenerateOptions)=>Question;
export interface GeneratorRegistry{
	[key: string]: GeneratorFn;
}
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
	answerTimes: number[];
}