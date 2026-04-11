import type { Question, GenerateOptions } from '../../types.d.js';
import { SeededRandom } from '../../seededRandom.js';

export const topicId="1.2_displacement_velocity_acceleration";
export const topicName="Displacement, Velocity, Acceleration";

export function generate(options: GenerateOptions): Question {
	let rng = new SeededRandom(options.seed !== undefined ? options.seed : Date.now());
	const typeList: Question["questionType"][] = ["MC", "Math"];
	let chosenType = rng.choice(typeList);
	if (options.forceMcq) chosenType = "MC";

	switch (chosenType) {
		case "MC": {
			const scenarioList = ["slopeXvsT", "areaUnderVvsT", "constantAccelerationVt", "rankAverageVelocities"];
			const scenario = rng.choice(scenarioList);
			let text = "";
			let answer = "";
			let choices: string[] = [];

			switch (scenario) {
				case "slopeXvsT":
					text = "The slope of a position‑time graph at a given instant represents:";
					answer = "instantaneous velocity";
					choices = [answer, "average velocity", "acceleration", "displacement"];
					break;
				case "areaUnderVvsT":
					text = "The area under a velocity‑time graph between two times represents:";
					answer = "displacement";
					choices = [answer, "acceleration", "change in velocity", "average velocity"];
					break;
				case "constantAccelerationVt":
					text = "Which velocity‑time graph represents constant acceleration?";
					answer = "line with positive slope";
					choices = [answer, "horizontal line", "parabola", "decreasing curve"];
					break;
				default: { // rankAverageVelocities
					const aDelta = rng.nextInt(5, 15);
					const aDeltaT = rng.nextInt(2, 4);
					const aVel = aDelta / aDeltaT;
					const bDelta = rng.nextInt(15, 25);
					const bDeltaT = rng.nextInt(3, 5);
					const bVel = bDelta / bDeltaT;
					const cDelta = rng.nextInt(20, 30);
					const cDeltaT = rng.nextInt(4, 6);
					const cVel = cDelta / cDeltaT;
					text = `An object moves along a line. Interval A: from 0 to ${aDeltaT} s, displacement +${aDelta} m. Interval B: from ${aDeltaT} to ${aDeltaT + bDeltaT} s, displacement +${bDelta} m. Interval C: from ${aDeltaT + bDeltaT} to ${aDeltaT + bDeltaT + cDeltaT} s, displacement +${cDelta} m. Rank the average velocities from greatest to least.`;
					let order = "";
					if (aVel >= bVel && aVel >= cVel) {
						order = (bVel >= cVel) ? "A, B, C" : "A, C, B";
					} else if (bVel >= aVel && bVel >= cVel) {
						order = (aVel >= cVel) ? "B, A, C" : "B, C, A";
					} else {
						order = (aVel >= bVel) ? "C, A, B" : "C, B, A";
					}
					answer = order;
					choices = [answer, "A, C, B", "B, A, C", "C, B, A"];
					break;
				}
			}
			// Shuffle choices for all MC scenarios.
			for (let i = choices.length - 1; i > 0; i--) {
				const j = rng.nextInt(0, i);
				[choices[i], choices[j]] = [choices[j], choices[i]];
			}
			return {
				id: `1.2_${Date.now()}_${rng.nextInt(0, 1e6)}`,
				topicId: topicId,
				topicName: topicName,
				text: text,
				answer: answer,
				answerType: "string",
				unit: undefined,
				choices: choices,
				difficulty: options.difficulty,
				questionType: "MC"
			};
		}

		default: { // Math branch
			const scenarioList = ["avgVelocityTwoPositions", "avgAccelerationTwoVelocities", "instantVelocityFromTable"];
			const scenario = rng.choice(scenarioList);
			let text = "";
			let correctAnswer = "";
			let unit: string | undefined = undefined;
			let numericValue = 0;

			switch (scenario) {
				case "avgVelocityTwoPositions": {
					const t1 = rng.nextFloat() * 3 + 1;
					const x1 = rng.nextFloat() * 10;
					const t2 = rng.nextFloat() * 5 + t1 + 1;
					const x2 = rng.nextFloat() * 20 + 5;
					const v = (x2 - x1) / (t2 - t1);
					text = `At time t = ${t1.toFixed(1)} s, position x = ${x1.toFixed(1)} m. At t = ${t2.toFixed(1)} s, x = ${x2.toFixed(1)} m. Calculate the average velocity.`;
					correctAnswer = `${v.toFixed(2)} m/s`;
					numericValue = v;
					unit = "m/s";
					break;
				}
				case "avgAccelerationTwoVelocities": {
					const vi = rng.nextInt(5, 20);
					const vf = rng.nextInt(-10, vi - 5);
					const dt = rng.nextFloat() * 3 + 1;
					const a = (vf - vi) / dt;
					const dir = a < 0 ? "south" : "north";
					text = `A car's velocity changes from ${vi} m/s north to ${Math.abs(vf)} m/s ${vf < 0 ? "south" : "north"} in ${dt.toFixed(1)} s. Calculate the average acceleration (magnitude and direction).`;
					correctAnswer = `${Math.abs(a).toFixed(2)} m/s² ${dir}`;
					numericValue = Math.abs(a);
					unit = "m/s²";
					break;
				}
				default: { // instantVelocityFromTable
					const x1 = rng.nextInt(2, 5);
					const x2 = rng.nextInt(6, 12);
					const x3 = rng.nextInt(14, 25);
					const vEst = (x3 - x1) / 2;
					text = `Position data: t=0 s, x=0 m; t=1 s, x=${x1} m; t=2 s, x=${x2} m; t=3 s, x=${x3} m. Estimate the instantaneous velocity at t=2.0 s.`;
					correctAnswer = `${vEst.toFixed(2)} m/s`;
					numericValue = vEst;
					unit = "m/s";
					break;
				}
			}

			if (options.forceMcq) {
				// Generate 4 choices (correct + 3 distractors)
				let choices: string[] = [correctAnswer];
				const offsets = [-0.2, 0.15, 0.3];
				for (let off of offsets) {
					let wrong = numericValue + numericValue * off;
					if (unit) choices.push(`${wrong.toFixed(2)} ${unit}`);
					else choices.push(wrong.toFixed(2));
				}
				// Ensure we have exactly 4 unique choices
				choices = [...new Set(choices)];
				while (choices.length < 4) choices.push("0");
				if (!choices.includes(correctAnswer)) choices[0] = correctAnswer;
				// Shuffle choices
				for (let i = choices.length - 1; i > 0; i--) {
					const j = rng.nextInt(0, i);
					[choices[i], choices[j]] = [choices[j], choices[i]];
				}
				return {
					id: `1.2_${Date.now()}_${rng.nextInt(0, 1e6)}`,
					topicId: topicId,
					topicName: topicName,
					text: text,
					answer: correctAnswer,
					answerType: "string",
					unit: unit,
					choices: choices,
					difficulty: options.difficulty,
					questionType: "MC"
				};
			} else {
				return {
					id: `1.2_${Date.now()}_${rng.nextInt(0, 1e6)}`,
					topicId: topicId,
					topicName: topicName,
					text: text,
					answer: correctAnswer,
					answerType: "numeric",
					unit: unit,
					choices: undefined,
					difficulty: options.difficulty,
					questionType: "Math"
				};
			}
		}
	}
}