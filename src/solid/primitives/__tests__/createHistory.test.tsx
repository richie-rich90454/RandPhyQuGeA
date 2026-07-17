import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi} from "vitest";
import type {JSX} from "solid-js";
import {createHistory} from "../createHistory";
import type {HistoryState} from "../createHistory";
import type {QuestionAttempt} from "../../../lib/physics/history/QuestionHistory";
function makeAttempt(overrides: Partial<QuestionAttempt> = {}): QuestionAttempt {
    return {
        id: "att-1",
        questionId: "Q1",
        correct: false,
        response: "wrong",
        mode: "frq",
        timestamp: 1000,
        ...overrides,
    };
}
let state: HistoryState | null = null;
function makeRoot(options?: Parameters<typeof createHistory>[0]): () => JSX.Element {
    return () => {
        state = createHistory(options);
        return <div>history</div>;
    };
}
beforeEach(() => {
    state = null;
});
describe("createHistory default state (task 5.74)", () => {
    it("starts empty with count 0 and zero accuracy", () => {
        render(makeRoot());
        expect(state!.attempts()).toEqual([]);
        expect(state!.count()).toBe(0);
        expect(state!.stats()).toEqual({total: 0, correct: 0, accuracy: 0});
        expect(state!.reattemptQueue()).toEqual([]);
    });
    it("default capacity is 100", () => {
        render(makeRoot());
        expect(state!.getCapacity()).toBe(100);
    });
    it("honors a custom capacity", () => {
        render(makeRoot({capacity: 5}));
        expect(state!.getCapacity()).toBe(5);
    });
    it("needsReattempt returns false when no attempts exist", () => {
        render(makeRoot());
        expect(state!.needsReattempt("Q1")).toBe(false);
    });
});
describe("createHistory record reactivity (task 5.74)", () => {
    it("record appends an attempt and updates attempts/count/stats accessors", () => {
        render(makeRoot());
        let attempt = state!.record({questionId: "Q1", correct: true, response: "5", mode: "frq"});
        expect(attempt.id).toBe("att-1");
        expect(attempt.questionId).toBe("Q1");
        expect(state!.count()).toBe(1);
        expect(state!.attempts()).toEqual([attempt]);
        expect(state!.stats()).toEqual({total: 1, correct: 1, accuracy: 1});
    });
    it("record fires onRecord callback with the stored attempt", () => {
        let onRecord = vi.fn<(attempt: QuestionAttempt) => void>();
        render(makeRoot({onRecord}));
        state!.record({questionId: "Q1", correct: true, response: "5", mode: "frq"});
        expect(onRecord).toHaveBeenCalledTimes(1);
        expect(onRecord).toHaveBeenCalledWith(expect.objectContaining({questionId: "Q1", correct: true}));
    });
    it("record auto-assigns a monotonically increasing id", () => {
        render(makeRoot());
        let a1 = state!.record({questionId: "Q1", correct: true, response: "1", mode: "frq"});
        let a2 = state!.record({questionId: "Q2", correct: false, response: "2", mode: "frq"});
        expect(a1.id).toBe("att-1");
        expect(a2.id).toBe("att-2");
    });
    it("record accepts an explicit timestamp", () => {
        render(makeRoot());
        let a = state!.record({questionId: "Q1", correct: true, response: "1", mode: "frq", timestamp: 5000});
        expect(a.timestamp).toBe(5000);
    });
    it("stats reflect running accuracy across mixed-correctness attempts", () => {
        render(makeRoot());
        state!.record({questionId: "Q1", correct: true, response: "1", mode: "frq"});
        state!.record({questionId: "Q2", correct: false, response: "2", mode: "frq"});
        state!.record({questionId: "Q3", correct: true, response: "3", mode: "frq"});
        expect(state!.stats()).toEqual({total: 3, correct: 2, accuracy: 2 / 3});
    });
    it("ring buffer drops oldest entry when over capacity", () => {
        render(makeRoot({capacity: 2}));
        state!.record({questionId: "Q1", correct: true, response: "1", mode: "frq"});
        state!.record({questionId: "Q2", correct: true, response: "2", mode: "frq"});
        state!.record({questionId: "Q3", correct: true, response: "3", mode: "frq"});
        expect(state!.count()).toBe(2);
        expect(state!.attempts().map(a => a.questionId)).toEqual(["Q2", "Q3"]);
    });
});
describe("createHistory recent / lookup (task 5.74)", () => {
    it("recent returns the n most recent attempts (newest last)", () => {
        render(makeRoot());
        state!.record({questionId: "Q1", correct: true, response: "1", mode: "frq"});
        state!.record({questionId: "Q2", correct: true, response: "2", mode: "frq"});
        state!.record({questionId: "Q3", correct: true, response: "3", mode: "frq"});
        expect(state!.recent(2).map(a => a.questionId)).toEqual(["Q2", "Q3"]);
    });
    it("recent returns empty for n<=0", () => {
        render(makeRoot());
        state!.record({questionId: "Q1", correct: true, response: "1", mode: "frq"});
        expect(state!.recent(0)).toEqual([]);
        expect(state!.recent(-1)).toEqual([]);
    });
    it("getByQuestion filters attempts by question id", () => {
        render(makeRoot());
        state!.record({questionId: "Q1", correct: true, response: "1", mode: "frq"});
        state!.record({questionId: "Q2", correct: false, response: "2", mode: "frq"});
        state!.record({questionId: "Q1", correct: false, response: "1b", mode: "frq"});
        expect(state!.getByQuestion("Q1").map(a => a.response)).toEqual(["1", "1b"]);
    });
    it("lastAttempt returns the most recent attempt for a question", () => {
        render(makeRoot());
        state!.record({questionId: "Q1", correct: true, response: "1", mode: "frq"});
        state!.record({questionId: "Q1", correct: false, response: "1b", mode: "frq"});
        expect(state!.lastAttempt("Q1")?.response).toBe("1b");
    });
    it("lastAttempt returns undefined for an unknown question", () => {
        render(makeRoot());
        expect(state!.lastAttempt("nope")).toBeUndefined();
    });
});
describe("createHistory reattempt queue + callback (task 5.74)", () => {
    it("reattemptQueue lists question ids whose most recent attempt was incorrect", () => {
        render(makeRoot());
        state!.record({questionId: "Q1", correct: false, response: "x", mode: "frq"});
        state!.record({questionId: "Q2", correct: true, response: "y", mode: "frq"});
        state!.record({questionId: "Q3", correct: false, response: "z", mode: "frq"});
        expect(state!.reattemptQueue().toSorted()).toEqual(["Q1", "Q3"]);
    });
    it("reattemptQueue excludes questions whose latest attempt became correct", () => {
        render(makeRoot());
        state!.record({questionId: "Q1", correct: false, response: "x", mode: "frq"});
        state!.record({questionId: "Q1", correct: true, response: "y", mode: "frq"});
        expect(state!.reattemptQueue()).toEqual([]);
    });
    it("needsReattempt returns true when the most recent attempt was incorrect", () => {
        render(makeRoot());
        state!.record({questionId: "Q1", correct: false, response: "x", mode: "frq"});
        expect(state!.needsReattempt("Q1")).toBe(true);
    });
    it("needsReattempt returns false when the most recent attempt was correct", () => {
        render(makeRoot());
        state!.record({questionId: "Q1", correct: false, response: "x", mode: "frq"});
        state!.record({questionId: "Q1", correct: true, response: "y", mode: "frq"});
        expect(state!.needsReattempt("Q1")).toBe(false);
    });
    it("reattempt fires onReattempt and returns true when the question needs another attempt", () => {
        let onReattempt = vi.fn<(questionId: string) => void>();
        render(makeRoot({onReattempt}));
        state!.record({questionId: "Q1", correct: false, response: "x", mode: "frq"});
        expect(state!.reattempt("Q1")).toBe(true);
        expect(onReattempt).toHaveBeenCalledTimes(1);
        expect(onReattempt).toHaveBeenCalledWith("Q1");
    });
    it("reattempt returns false and does not fire onReattempt when the question does not need another attempt", () => {
        let onReattempt = vi.fn<(questionId: string) => void>();
        render(makeRoot({onReattempt}));
        state!.record({questionId: "Q1", correct: true, response: "x", mode: "frq"});
        expect(state!.reattempt("Q1")).toBe(false);
        expect(onReattempt).not.toHaveBeenCalled();
    });
    it("reattempt returns false when no attempts exist for the question", () => {
        let onReattempt = vi.fn<(questionId: string) => void>();
        render(makeRoot({onReattempt}));
        expect(state!.reattempt("nope")).toBe(false);
        expect(onReattempt).not.toHaveBeenCalled();
    });
});
describe("createHistory pre-seeding (task 5.74)", () => {
    it("pre-seeds attempts from options", () => {
        render(makeRoot({attempts: [makeAttempt({questionId: "Q1", correct: false}), makeAttempt({id: "att-2", questionId: "Q2", correct: true, response: "y", mode: "frq", timestamp: 2000})]}));
        expect(state!.count()).toBe(2);
        expect(state!.attempts().map(a => a.questionId)).toEqual(["Q1", "Q2"]);
    });
    it("pre-seeded attempts contribute to the reattempt queue", () => {
        render(makeRoot({attempts: [makeAttempt({questionId: "Q1", correct: false})]}));
        expect(state!.reattemptQueue()).toEqual(["Q1"]);
    });
});
describe("createHistory clear + cleanup (task 5.74)", () => {
    it("clear empties the buffer and resets accessors", () => {
        render(makeRoot());
        state!.record({questionId: "Q1", correct: true, response: "1", mode: "frq"});
        state!.clear();
        expect(state!.count()).toBe(0);
        expect(state!.attempts()).toEqual([]);
        expect(state!.stats()).toEqual({total: 0, correct: 0, accuracy: 0});
        expect(state!.reattemptQueue()).toEqual([]);
    });
    it("resets the underlying instance on disposal", () => {
        let rendered = render(makeRoot());
        state!.record({questionId: "Q1", correct: true, response: "1", mode: "frq"});
        expect(state!.inner().count()).toBe(1);
        rendered.unmount();
        expect(state!.inner().count()).toBe(0);
    });
});
