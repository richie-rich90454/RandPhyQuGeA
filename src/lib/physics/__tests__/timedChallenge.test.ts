import {describe, it, expect} from "vitest";
import {TimedChallenge, SPRINT_CHALLENGES, MARATHON_CHALLENGES, ACCURACY_CHALLENGES} from "../session/TimedChallenge";
const sprint30 = SPRINT_CHALLENGES[0]!;
const sprint60 = SPRINT_CHALLENGES[1]!;
const accuracy50 = ACCURACY_CHALLENGES[0]!;
describe("TimedChallenge presets", () => {
	it("exposes sprint, marathon, and accuracy presets", () => {
		expect(SPRINT_CHALLENGES.length).toBe(3);
		expect(MARATHON_CHALLENGES.length).toBe(2);
		expect(ACCURACY_CHALLENGES.length).toBe(1);
		expect(SPRINT_CHALLENGES.map(c => c.durationMs)).toEqual([30000, 60000, 120000]);
		expect(accuracy50.targetCorrect).toBe(50);
	});
});
describe("TimedChallenge state machine", () => {
	it("starts idle and transitions to running", () => {
		const c = new TimedChallenge(sprint30);
		expect(c.currentState()).toBe("idle");
		c.start(1000);
		expect(c.currentState()).toBe("running");
	});
	it("throws when starting from a non-idle state", () => {
		const c = new TimedChallenge(sprint30);
		c.start(1000);
		expect(() => c.start(2000)).toThrow("Cannot start from state running");
	});
	it("pause/resume round-trips through paused", () => {
		const c = new TimedChallenge(sprint30);
		c.start(1000);
		expect(c.pause(2000)).toBe(true);
		expect(c.currentState()).toBe("paused");
		expect(c.resume(3000)).toBe(true);
		expect(c.currentState()).toBe("running");
	});
	it("pause fails when not running", () => {
		const c = new TimedChallenge(sprint30);
		expect(c.pause(1000)).toBe(false);
	});
	it("abort transitions running to aborted", () => {
		const c = new TimedChallenge(sprint30);
		c.start(1000);
		expect(c.abort(2000)).toBe(true);
		expect(c.currentState()).toBe("aborted");
		expect(c.isFinished()).toBe(true);
	});
	it("abort transitions paused to aborted", () => {
		const c = new TimedChallenge(sprint30);
		c.start(1000);
		c.pause(2000);
		expect(c.abort(3000)).toBe(true);
		expect(c.currentState()).toBe("aborted");
	});
	it("abort fails when already finished", () => {
		const c = new TimedChallenge(sprint30);
		c.start(1000);
		c.abort(2000);
		expect(c.abort(3000)).toBe(false);
	});
});
describe("TimedChallenge elapsed/remaining", () => {
	it("accumulates elapsed while running and freezes while paused", () => {
		const c = new TimedChallenge(sprint60);
		c.start(1000);
		expect(c.elapsedMs(1500)).toBe(500);
		c.pause(2000);
		expect(c.elapsedMs(9999)).toBe(1000);
		c.resume(3000);
		expect(c.elapsedMs(3500)).toBe(1500);
	});
	it("remainingMs counts down and clamps at 0", () => {
		const c = new TimedChallenge(sprint30);
		c.start(1000);
		expect(c.remainingMs(1000)).toBe(30000);
		expect(c.remainingMs(31000)).toBe(0);
	});
	it("remainingMs is 0 for uncapped accuracy challenges", () => {
		const c = new TimedChallenge(accuracy50);
		c.start(1000);
		expect(c.remainingMs(5000)).toBe(0);
	});
});
describe("TimedChallenge sprint completion", () => {
	it("completes on tick when the duration elapses", () => {
		const c = new TimedChallenge(sprint30);
		c.start(1000);
		expect(c.tick(30000)).toBe("running");
		expect(c.tick(31001)).toBe("completed");
		expect(c.isFinished()).toBe(true);
	});
	it("result reports completion with elapsed time", () => {
		const c = new TimedChallenge(sprint30);
		c.start(1000);
		c.tick(31000);
		const r = c.result();
		expect(r?.completed).toBe(true);
		expect(r?.elapsedMs).toBe(30000);
		expect(r?.state).toBe("completed");
	});
});
describe("TimedChallenge accuracy completion", () => {
	it("completes when the target correct count is reached", () => {
		const c = new TimedChallenge(accuracy50);
		c.start(1000);
		for (let i = 0; i < 49; i += 1) {
			expect(c.currentState()).toBe("running");
			c.record(true, 1000 + i);
		}
		c.record(true, 2000);
		expect(c.currentState()).toBe("completed");
	});
	it("does not complete from incorrect answers", () => {
		const c = new TimedChallenge(accuracy50);
		c.start(1000);
		for (let i = 0; i < 60; i += 1) {
			c.record(false, 1000 + i);
		}
		expect(c.currentState()).toBe("running");
		expect(c.correctCount()).toBe(0);
		expect(c.answeredCount()).toBe(60);
	});
	it("tick does not complete an accuracy challenge on time", () => {
		const c = new TimedChallenge(accuracy50);
		c.start(1000);
		expect(c.tick(1000000)).toBe("running");
	});
});
describe("TimedChallenge record after finish", () => {
	it("ignores records once finished", () => {
		const c = new TimedChallenge(sprint30);
		c.start(1000);
		c.tick(31000);
		const before = c.answeredCount();
		c.record(true, 32000);
		expect(c.answeredCount()).toBe(before);
	});
});
describe("TimedChallenge resume when not paused", () => {
	it("returns false when resuming from an idle state", () => {
		const c = new TimedChallenge(sprint30);
		expect(c.resume(1000)).toBe(false);
		expect(c.currentState()).toBe("idle");
	});
	it("returns false when resuming from a running state", () => {
		const c = new TimedChallenge(sprint30);
		c.start(1000);
		expect(c.resume(2000)).toBe(false);
		expect(c.currentState()).toBe("running");
	});
});
describe("TimedChallenge result when not finished", () => {
	it("returns undefined when the challenge is still running", () => {
		const c = new TimedChallenge(sprint30);
		c.start(1000);
		expect(c.result()).toBeUndefined();
	});
	it("returns undefined when the challenge is idle", () => {
		const c = new TimedChallenge(sprint30);
		expect(c.result()).toBeUndefined();
	});
});
