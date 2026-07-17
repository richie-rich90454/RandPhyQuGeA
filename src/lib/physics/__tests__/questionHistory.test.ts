import {describe, it, expect} from "vitest";
import {QuestionHistory} from "../history/QuestionHistory";
describe("QuestionHistory.record", () => {
    it("records an attempt with an auto-assigned id and timestamp", () => {
        const h = new QuestionHistory(10);
        const a = h.record({questionId: "Q1", correct: true, response: "42", mode: "FRQ", timestamp: 1000});
        expect(a.id).toBe("att-1");
        expect(a.questionId).toBe("Q1");
        expect(a.correct).toBe(true);
        expect(a.timestamp).toBe(1000);
    });
    it("increments the id counter across records", () => {
        const h = new QuestionHistory(10);
        h.record({questionId: "Q1", correct: true, response: "a", mode: "MC"});
        const b = h.record({questionId: "Q2", correct: false, response: "b", mode: "MC"});
        expect(b.id).toBe("att-2");
    });
    it("drops the oldest entry when capacity is exceeded", () => {
        const h = new QuestionHistory(2);
        h.record({questionId: "Q1", correct: true, response: "1", mode: "MC", timestamp: 1});
        h.record({questionId: "Q2", correct: true, response: "2", mode: "MC", timestamp: 2});
        h.record({questionId: "Q3", correct: true, response: "3", mode: "MC", timestamp: 3});
        expect(h.count()).toBe(2);
        const all = h.all();
        expect(all[0]?.questionId).toBe("Q2");
        expect(all[1]?.questionId).toBe("Q3");
    });
    it("throws when capacity is less than 1", () => {
        expect(() => new QuestionHistory(0)).toThrow("capacity");
    });
});
describe("QuestionHistory.recent", () => {
    it("returns the n most recent attempts newest last", () => {
        const h = new QuestionHistory(10);
        for (let i = 1; i <= 5; i++) {
            h.record({questionId: `Q${i}`, correct: true, response: `${i}`, mode: "MC", timestamp: i});
        }
        const recent = h.recent(2);
        expect(recent.length).toBe(2);
        expect(recent[0]?.questionId).toBe("Q4");
        expect(recent[1]?.questionId).toBe("Q5");
    });
    it("returns empty for n <= 0", () => {
        const h = new QuestionHistory(10);
        h.record({questionId: "Q1", correct: true, response: "1", mode: "MC"});
        expect(h.recent(0)).toEqual([]);
        expect(h.recent(-3)).toEqual([]);
    });
});
describe("QuestionHistory.getByQuestion / lastAttempt", () => {
    it("returns all attempts for a question in chronological order", () => {
        const h = new QuestionHistory(10);
        h.record({questionId: "Q1", correct: false, response: "x", mode: "MC", timestamp: 1});
        h.record({questionId: "Q2", correct: true, response: "y", mode: "MC", timestamp: 2});
        h.record({questionId: "Q1", correct: true, response: "z", mode: "MC", timestamp: 3});
        const q1 = h.getByQuestion("Q1");
        expect(q1.length).toBe(2);
        expect(q1[0]?.correct).toBe(false);
        expect(q1[1]?.correct).toBe(true);
    });
    it("lastAttempt returns the most recent attempt for a question", () => {
        const h = new QuestionHistory(10);
        h.record({questionId: "Q1", correct: false, response: "x", mode: "MC", timestamp: 1});
        h.record({questionId: "Q1", correct: true, response: "z", mode: "MC", timestamp: 3});
        expect(h.lastAttempt("Q1")?.correct).toBe(true);
    });
    it("lastAttempt returns undefined for an unseen question", () => {
        const h = new QuestionHistory(10);
        expect(h.lastAttempt("nope")).toBeUndefined();
    });
});
describe("QuestionHistory.needsReattempt / reattemptQueue", () => {
    it("needsReattempt is true when the last attempt was incorrect", () => {
        const h = new QuestionHistory(10);
        h.record({questionId: "Q1", correct: false, response: "x", mode: "MC", timestamp: 1});
        expect(h.needsReattempt("Q1")).toBe(true);
    });
    it("needsReattempt is false when the last attempt was correct", () => {
        const h = new QuestionHistory(10);
        h.record({questionId: "Q1", correct: false, response: "x", mode: "MC", timestamp: 1});
        h.record({questionId: "Q1", correct: true, response: "y", mode: "MC", timestamp: 2});
        expect(h.needsReattempt("Q1")).toBe(false);
    });
    it("reattemptQueue lists question ids whose last attempt was incorrect", () => {
        const h = new QuestionHistory(10);
        h.record({questionId: "Q1", correct: false, response: "x", mode: "MC", timestamp: 1});
        h.record({questionId: "Q2", correct: true, response: "y", mode: "MC", timestamp: 2});
        h.record({questionId: "Q3", correct: false, response: "z", mode: "MC", timestamp: 3});
        const queue = h.reattemptQueue();
        expect(queue).toContain("Q1");
        expect(queue).toContain("Q3");
        expect(queue).not.toContain("Q2");
    });
});
describe("QuestionHistory.stats", () => {
    it("reports total, correct, and accuracy", () => {
        const h = new QuestionHistory(10);
        h.record({questionId: "Q1", correct: true, response: "a", mode: "MC"});
        h.record({questionId: "Q2", correct: false, response: "b", mode: "MC"});
        h.record({questionId: "Q3", correct: true, response: "c", mode: "MC"});
        const stats = h.stats();
        expect(stats.total).toBe(3);
        expect(stats.correct).toBe(2);
        expect(stats.accuracy).toBeCloseTo(2 / 3, 5);
    });
    it("reports accuracy 0 for an empty history", () => {
        const h = new QuestionHistory(10);
        expect(h.stats().accuracy).toBe(0);
    });
});
describe("QuestionHistory.clear", () => {
    it("removes all attempts", () => {
        const h = new QuestionHistory(10);
        h.record({questionId: "Q1", correct: true, response: "a", mode: "MC"});
        h.clear();
        expect(h.count()).toBe(0);
        expect(h.all()).toEqual([]);
    });
});
describe("QuestionHistory.getCapacity", () => {
    it("returns the configured capacity", () => {
        const h = new QuestionHistory(50);
        expect(h.getCapacity()).toBe(50);
    });
});
