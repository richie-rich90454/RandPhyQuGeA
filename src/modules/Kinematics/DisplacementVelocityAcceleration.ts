/**
 * Generator for Displacement, Velocity, and Acceleration (Topic 1.2)
 * Conforms to the generator contract: exports `topicId`, `topicName`, and a `generate` function.
 * Covers MC (slope of x-t, area under v-t, constant acceleration from v-t, rank average velocities),
 * Math (average velocity, average acceleration, instantaneous velocity from table),
 * Graphical (sketch v-t from x-t, sketch a-t from v-t), Experiment (ticker tape acceleration),
 * and QualQuant (top of vertical throw claim). All scenarios randomly selected.
 * @timestamp 2026-04-08
 */
import {Question, GenerateOptions, SeededRandom} from "../../types.js";

export const topicId="1.2_displacement_velocity_acceleration";
export const topicName="Displacement, Velocity, Acceleration";

/**
 * Main generator function – randomly selects a question type and scenario,
 * uses seeded randomness for reproducibility, and builds a complete Question.
 * @param options configuration including difficulty, forceMcq flag, and optional seed
 * @returns a fully populated Question object
 */
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	let typeList: Question["questionType"][]=["MC","Math","Graphical","Experiment","QualQuant"];
	let chosenType=rng.choice(typeList);
	if (chosenType==="MC"){
		let scenarioList=["slopeXvsT","areaUnderVvsT","constantAccelerationVt","rankAverageVelocities"];
		let scenario=rng.choice(scenarioList);
		let text="";
		let answer="";
		let choices:string[]=[];
		if (scenario==="slopeXvsT"){
			text="The slope of a position‑time graph at a given instant represents:";
			answer="instantaneous velocity";
			choices=[answer,"average velocity","acceleration","displacement"];
		}
		else if (scenario==="areaUnderVvsT"){
			text="The area under a velocity‑time graph between two times represents:";
			answer="displacement";
			choices=[answer,"acceleration","change in velocity","average velocity"];
		}
		else if (scenario==="constantAccelerationVt"){
			text="Which velocity‑time graph represents constant acceleration?";
			answer="line with positive slope";
			choices=[answer,"horizontal line","parabola","decreasing curve"];
		}
		else{
			let aDelta=rng.nextInt(5,15);
			let aDeltaT=rng.nextInt(2,4);
			let aVel=aDelta/aDeltaT;
			let bDelta=rng.nextInt(15,25);
			let bDeltaT=rng.nextInt(3,5);
			let bVel=bDelta/bDeltaT;
			let cDelta=rng.nextInt(20,30);
			let cDeltaT=rng.nextInt(4,6);
			let cVel=cDelta/cDeltaT;
			text=`An object moves along a line. Interval A: from 0 to ${aDeltaT} s, displacement +${aDelta} m. Interval B: from ${aDeltaT} to ${aDeltaT+bDeltaT} s, displacement +${bDelta} m. Interval C: from ${aDeltaT+bDeltaT} to ${aDeltaT+bDeltaT+cDeltaT} s, displacement +${cDelta} m. Rank the average velocities from greatest to least.`;
			let order="";
			if (aVel>=bVel && aVel>=cVel){
				if (bVel>=cVel) order="A, B, C";
				else order="A, C, B";
			}
			else if (bVel>=aVel && bVel>=cVel){
				if (aVel>=cVel) order="B, A, C";
				else order="B, C, A";
			}
			else{
				if (aVel>=bVel) order="C, A, B";
				else order="C, B, A";
			}
			answer=order;
			let wrong1="A, C, B";
			let wrong2="B, A, C";
			let wrong3="C, B, A";
			choices=[answer,wrong1,wrong2,wrong3];
			for (let i=choices.length-1;i>0;i--){
				let j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return {
				id: `1.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
				topicId: topicId,
				topicName: topicName,
				text: text,
				answer: answer,
				answerType: "string",
				unit: undefined,
				choices: options.forceMcq?choices:undefined,
				difficulty: options.difficulty,
				questionType: "MC"
			};
		}
		for (let i=choices.length-1;i>0;i--){
			let j=rng.nextInt(0,i);
			[choices[i],choices[j]]=[choices[j],choices[i]];
		}
		return {
			id: `1.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: topicId,
			topicName: topicName,
			text: text,
			answer: answer,
			answerType: "string",
			unit: undefined,
			choices: options.forceMcq?choices:undefined,
			difficulty: options.difficulty,
			questionType: "MC"
		};
	}
	else if (chosenType==="Math"){
		let scenarioList=["avgVelocityTwoPositions","avgAccelerationTwoVelocities","instantVelocityFromTable"];
		let scenario=rng.choice(scenarioList);
		let text="";
		let answer="";
		let unit:string|undefined=undefined;
		if (scenario==="avgVelocityTwoPositions"){
			let t1=rng.nextFloat()*3+1;
			let x1=rng.nextFloat()*10;
			let t2=rng.nextFloat()*5+t1+1;
			let x2=rng.nextFloat()*20+5;
			let v=(x2-x1)/(t2-t1);
			text=`At time t = ${t1.toFixed(1)} s, position x = ${x1.toFixed(1)} m. At t = ${t2.toFixed(1)} s, x = ${x2.toFixed(1)} m. Calculate the average velocity.`;
			answer=`${v.toFixed(2)} m/s`;
			unit="m/s";
		}
		else if (scenario==="avgAccelerationTwoVelocities"){
			let vi=rng.nextInt(5,20);
			let vf=rng.nextInt(-10, vi-5);
			let dt=rng.nextFloat()*3+1;
			let a=(vf-vi)/dt;
			let dir=a<0?"south":"north";
			text=`A car's velocity changes from ${vi} m/s north to ${Math.abs(vf)} m/s ${vf<0?"south":"north"} in ${dt.toFixed(1)} s. Calculate the average acceleration (magnitude and direction).`;
			answer=`${Math.abs(a).toFixed(2)} m/s² ${dir}`;
			unit="m/s²";
		}
		else{
			let t1=1;
			let x1=rng.nextInt(2,5);
			let x2=rng.nextInt(6,12);
			let t3=3;
			let x3=rng.nextInt(14,25);
			let vEst=(x3-x1)/(t3-t1);
			text=`Position data: t=0 s, x=0 m; t=1 s, x=${x1} m; t=2 s, x=${x2} m; t=3 s, x=${x3} m. Estimate the instantaneous velocity at t=2.0 s.`;
			answer=`${vEst.toFixed(2)} m/s`;
			unit="m/s";
		}
		return {
			id: `1.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: topicId,
			topicName: topicName,
			text: text,
			answer: answer,
			answerType: "numeric",
			unit: unit,
			choices: undefined,
			difficulty: options.difficulty,
			questionType: "Math"
		};
	}
	else if (chosenType==="Graphical"){
		let scenarioList=["sketchVtFromXt","sketchAtFromVt"];
		let scenario=rng.choice(scenarioList);
		let text="";
		let answer="";
		if (scenario==="sketchVtFromXt"){
			let seg1Duration=rng.nextInt(2,4);
			let seg1Slope=rng.nextInt(3,8);
			let seg2Duration=rng.nextInt(2,5);
			let seg3Duration=rng.nextInt(2,4);
			let seg3Slope=-rng.nextInt(3,8);
			text=`Given the x‑t graph: from t=0 to ${seg1Duration} s, x increases linearly from 0 to ${(seg1Slope*seg1Duration).toFixed(0)} m; from t=${seg1Duration} to ${seg1Duration+seg2Duration} s, x constant at ${(seg1Slope*seg1Duration).toFixed(0)} m; from t=${seg1Duration+seg2Duration} to ${seg1Duration+seg2Duration+seg3Duration} s, x decreases linearly to 0 m. Sketch the corresponding v‑t graph.`;
			answer=`Rubric: 0–${seg1Duration} s: v = +${seg1Slope} m/s (horizontal line). ${seg1Duration}–${seg1Duration+seg2Duration} s: v = 0 m/s. ${seg1Duration+seg2Duration}–${seg1Duration+seg2Duration+seg3Duration} s: v = ${seg3Slope} m/s (negative constant). Label axes (time in s, velocity in m/s).`;
		}
		else{
			let v0=rng.nextInt(1,5);
			let vf=rng.nextInt(6,15);
			let dt=rng.nextInt(3,6);
			let a=(vf-v0)/dt;
			text=`The v‑t graph is a straight line from (0 s, ${v0} m/s) to (${dt} s, ${vf} m/s). Sketch the a‑t graph.`;
			answer=`Rubric: Horizontal line at a = ${a.toFixed(2)} m/s² from t=0 to ${dt} s. Label axes: time (s) horizontal, acceleration (m/s²) vertical.`;
		}
		return {
			id: `1.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: topicId,
			topicName: topicName,
			text: text,
			answer: answer,
			answerType: "string",
			unit: undefined,
			choices: undefined,
			difficulty: options.difficulty,
			questionType: "Graphical"
		};
	}
	else if (chosenType==="Experiment"){
		let text="Describe how to use a ticker tape timer and a meterstick to determine the acceleration of a falling object.";
		let answer="Rubric: Attach ticker tape to the object and run it through the timer as it falls. The timer makes dots at fixed time intervals (e.g., 0.02 s). Measure the distance between successive dots. Use Δx = v₀t + ½at² or compute velocities from adjacent intervals and plot v vs. t; slope gives a.";
		return {
			id: `1.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: topicId,
			topicName: topicName,
			text: text,
			answer: answer,
			answerType: "string",
			unit: undefined,
			choices: undefined,
			difficulty: options.difficulty,
			questionType: "Experiment"
		};
	}
	else{
		let v0=rng.nextInt(10,25);
		let g=9.8;
		let tTop=v0/g;
		let text=`(a) A ball is thrown straight upward with initial speed ${v0} m/s. At the top of its path, is its velocity zero? Is its acceleration zero? Make a claim. (b) Use kinematic equations to support your claim. (c) Explain why the acceleration remains constant even at the top.`;
		let answer=`Rubric: (a) Velocity is zero; acceleration is not zero, it is g = 9.8 m/s² downward. (b) v = v₀ - gt. Setting v=0 gives t = v₀/g = ${tTop.toFixed(2)} s. Acceleration is dv/dt = -g, constant. (c) Gravity is the only force acting; it does not disappear at the top, so acceleration is always g downward.`;
		return {
			id: `1.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: topicId,
			topicName: topicName,
			text: text,
			answer: answer,
			answerType: "string",
			unit: undefined,
			choices: undefined,
			difficulty: options.difficulty,
			questionType: "QualQuant"
		};
	}
}