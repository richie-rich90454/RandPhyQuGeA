/** Stateful service that manages a practice session lifecycle and persistence snapshots. */
import type {IAnalyticsService, IPhysicsService, ISessionService, Session, SessionConfig, SessionSnapshot} from "./contracts";
import type {GeneratedQuestion, PracticeResult, QuestionType, Specification} from "../types/models";
import type {AnswerGraderLike} from "../lib/physics/contracts";
import {AnswerGrader} from "../lib/physics/grader/AnswerGrader";
const DEFAULT_SNAPSHOT_KEY = "physics-session-snapshot";
/** Shuffle an array in place using the Fisher-Yates algorithm. */
function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let left = array[i];
        let right = array[j];
        if (left === undefined || right === undefined) {
            continue;
        }
        array[i] = right;
        array[j] = left;
    }
    return array;
}
function isSession(value: unknown): value is Session {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    let v = value as Record<string, unknown>;
    return (
        typeof v.id === "string" &&
        typeof v.specification === "object" &&
        v.specification !== null &&
        Array.isArray(v.questions) &&
        typeof v.mode === "string" &&
        typeof v.currentIndex === "number" &&
        Array.isArray(v.results) &&
        typeof v.isActive === "boolean" &&
        typeof v.isFinished === "boolean" &&
        typeof v.questionStartTime === "number" &&
        typeof v.sessionStartTime === "number"
    );
}
function isSessionSnapshot(value: unknown): value is SessionSnapshot {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    if (!("session" in value) || !("createdAt" in value)) {
        return false;
    }
    let v = value as Record<string, unknown>;
    return isSession(v.session) && typeof v.createdAt === "string";
}
function createResult(question: GeneratedQuestion, userAnswer: string, isCorrect: boolean, timeTakenMs: number, mode: Session["mode"]): PracticeResult {
    return {
        id: crypto.randomUUID(),
        question_id: question.id,
        topic_id: question.topic_id,
        skill_id: question.skill_id,
        is_correct: isCorrect,
        time_taken_ms: timeTakenMs,
        user_answer: userAnswer,
        timestamp: new Date().toISOString(),
        mode,
        difficulty: question.difficulty,
    };
}
export class SessionService implements ISessionService {
    private readonly physicsService: IPhysicsService;
    private readonly analyticsService: IAnalyticsService;
    private readonly grader: AnswerGraderLike;
    private session: Session | null = null;
    public constructor(physicsService: IPhysicsService, analyticsService: IAnalyticsService, grader?: AnswerGraderLike) {
        this.physicsService = physicsService;
        this.analyticsService = analyticsService;
        this.grader = grader ?? new AnswerGrader();
    }
    public async startSession(spec: Specification, config: SessionConfig): Promise<Session> {
        let questions: GeneratedQuestion[] = [];
        if (config.questionCount > 0) {
            questions = await this.physicsService.generateBatch(spec, config.questionCount, config.options);
        }
        if (config.shuffle) {
            shuffleArray(questions);
        }
        let now = Date.now();
        let session: Session = {
            id: crypto.randomUUID(),
            specification: spec,
            questions,
            mode: config.mode,
            currentIndex: 0,
            results: [],
            isActive: true,
            isFinished: false,
            questionStartTime: now,
            sessionStartTime: now,
        };
        this.session = session;
        return session;
    }
    public async submitAnswer(answer: string, choiceIndex?: number): Promise<PracticeResult> {
        if (!this.session) {
            throw new Error("No active session.");
        }
        if (!this.session.isActive || this.session.isFinished) {
            throw new Error("Session is not active.");
        }
        let question = this.session.questions[this.session.currentIndex];
        if (!question) {
            throw new Error("No current question.");
        }
        let timeTakenMs = Date.now() - this.session.questionStartTime;
        let choices = question.choices;
        let userAnswerValue = choiceIndex !== undefined && choices ? (choices[choiceIndex] ?? answer) : answer;
        let isCorrect = this.grader.grade(question, answer, choiceIndex).is_correct;
        let result = createResult(question, userAnswerValue, isCorrect, timeTakenMs, this.session.mode);
        this.session.results.push(result);
        return result;
    }
    public async advanceQuestion(): Promise<boolean> {
        if (!this.session || !this.session.isActive || this.session.isFinished) {
            return false;
        }
        let nextIndex = this.session.currentIndex + 1;
        if (nextIndex >= this.session.questions.length) {
            return false;
        }
        this.session.currentIndex = nextIndex;
        this.session.questionStartTime = Date.now();
        return true;
    }
    public async regenerateCurrentQuestionAs(questionType: QuestionType): Promise<GeneratedQuestion> {
        if (!this.session || !this.session.isActive || this.session.isFinished) {
            throw new Error("No active session.");
        }
        let currentQuestion = this.session.questions[this.session.currentIndex];
        if (!currentQuestion) {
            throw new Error("No current question.");
        }
        let regeneratedQuestion = await this.physicsService.generateQuestion(this.session.specification, {
            topicId: currentQuestion.topic_id,
            skillId: currentQuestion.skill_id,
            minDifficulty: currentQuestion.difficulty,
            maxDifficulty: currentQuestion.difficulty,
            questionType,
        });
        this.session.questions[this.session.currentIndex] = regeneratedQuestion;
        this.session.questionStartTime = Date.now();
        return regeneratedQuestion;
    }
    public async finishSession(): Promise<PracticeResult[]> {
        if (!this.session) {
            return [];
        }
        this.session.isActive = false;
        this.session.isFinished = true;
        this.session.sessionEndTime = Date.now();
        return this.session.results;
    }
    public getSession(): Session | null {
        return this.session;
    }
    public async resumeSession(snapshot: SessionSnapshot): Promise<Session> {
        snapshot.session.questionStartTime = Date.now();
        this.session = snapshot.session;
        return snapshot.session;
    }
    public async saveSessionSnapshot(key: string = DEFAULT_SNAPSHOT_KEY): Promise<SessionSnapshot | null> {
        if (!this.session) {
            return null;
        }
        let snapshot: SessionSnapshot = {
            session: this.session,
            createdAt: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(snapshot));
        return snapshot;
    }
    public async loadSessionSnapshot(key: string = DEFAULT_SNAPSHOT_KEY): Promise<SessionSnapshot | null> {
        let raw = localStorage.getItem(key);
        if (!raw) {
            return null;
        }
        try {
            let parsed = JSON.parse(raw);
            if (!isSessionSnapshot(parsed)) {
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    }
    public clearSessionSnapshot(key: string = DEFAULT_SNAPSHOT_KEY): void {
        localStorage.removeItem(key);
    }
}
