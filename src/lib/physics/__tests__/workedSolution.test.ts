import {describe, it, expect} from "vitest";
import {WorkedSolutionBuilder} from "../solution/WorkedSolution";
describe("WorkedSolutionBuilder", () => {
    it("builds an empty solution with a questionId and title", () => {
        const sol = new WorkedSolutionBuilder("Q1", "Kinematics").build();
        expect(sol.questionId).toBe("Q1");
        expect(sol.title).toBe("Kinematics");
        expect(sol.steps).toEqual([]);
        expect(sol.finalAnswer).toBeUndefined();
    });
    it("defaults the title to an empty string", () => {
        const sol = new WorkedSolutionBuilder("Q1").build();
        expect(sol.title).toBe("");
    });
    it("setTitle updates the title", () => {
        const sol = new WorkedSolutionBuilder("Q1").setTitle("New Title").build();
        expect(sol.title).toBe("New Title");
    });
    it("addStep appends a step and supports chaining", () => {
        const builder = new WorkedSolutionBuilder("Q1", "T");
        const returned = builder.addStep({description: "Step 1", latex: "a = b", result: "5"});
        expect(returned).toBe(builder);
        const sol = builder.build();
        expect(sol.steps.length).toBe(1);
        expect(sol.steps[0]?.description).toBe("Step 1");
        expect(sol.steps[0]?.latex).toBe("a = b");
        expect(sol.steps[0]?.result).toBe("5");
    });
    it("step() appends from raw fields", () => {
        const sol = new WorkedSolutionBuilder("Q1", "T").step("Substitute", "a = \\frac{v}{t}", "a = \\frac{20}{4}", "a = 5").build();
        expect(sol.steps.length).toBe(1);
        expect(sol.steps[0]?.substitution).toBe("a = \\frac{20}{4}");
    });
    it("setFinalAnswer sets the final answer", () => {
        const sol = new WorkedSolutionBuilder("Q1", "T").setFinalAnswer("5 m/s^2").build();
        expect(sol.finalAnswer).toBe("5 m/s^2");
    });
    it("stepCount returns the number of added steps", () => {
        const builder = new WorkedSolutionBuilder("Q1", "T");
        builder.step("a");
        builder.step("b");
        expect(builder.stepCount()).toBe(2);
    });
    it("build produces a defensive copy of steps", () => {
        const builder = new WorkedSolutionBuilder("Q1", "T");
        builder.addStep({description: "original"});
        const sol = builder.build();
        builder.addStep({description: "after-build"});
        expect(sol.steps.length).toBe(1);
        expect(sol.steps[0]?.description).toBe("original");
    });
    it("built steps are independent of the original step object", () => {
        const builder = new WorkedSolutionBuilder("Q1", "T");
        const step = {description: "orig", result: "1"};
        builder.addStep(step);
        const sol = builder.build();
        step.result = "mutated";
        expect(sol.steps[0]?.result).toBe("1");
    });
    it("fromSteps builds a solution from a steps array", () => {
        const sol = WorkedSolutionBuilder.fromSteps("Q1", "T", [{description: "a"}, {description: "b"}], "42");
        expect(sol.questionId).toBe("Q1");
        expect(sol.steps.length).toBe(2);
        expect(sol.finalAnswer).toBe("42");
    });
    it("fromSteps omits finalAnswer when undefined", () => {
        const sol = WorkedSolutionBuilder.fromSteps("Q1", "T", [{description: "a"}]);
        expect(sol.finalAnswer).toBeUndefined();
    });
});
