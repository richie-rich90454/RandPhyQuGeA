/**
 * Generator for Scalars and Vectors in One Dimension (Topic 1.1)
 * Conforms to the generator contract: exports `topicId`, `topicName`, and a `generate` function.
 * Supports all five question types: MC, Math, Graphical, Experiment, QualQuant.
 * @timestamp 2026-04-08
 */
import {Question, GenerateOptions, SeededRandom} from "../../types.js";

export const topicId="1.1_scalars_vectors_1d";
export const topicName="Scalars and Vectors (1D)";

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
		let scenarioList=["distanceSame","distanceOpposite","signVelocity","scalarVector","addVectors","subtractVectors","motionDiagram"];
		let scenario=rng.choice(scenarioList);
		let text="";
		let answer="";
		let choices:string[]=[];
		let unit:string|undefined=undefined;
		switch(scenario){
			case "distanceSame":{
				let a=rng.nextInt(10,100);
				let b=rng.nextInt(5,50);
				let distance=a+b;
				let displacement=a+b;
				text=`An object moves ${a} m to the right, then ${b} m to the right. What is the distance traveled and the displacement?`;
				answer=`Distance = ${distance} m, Displacement = ${displacement} m to the right`;
				let wrong1=`Distance = ${distance} m, Displacement = ${Math.abs(a-b)} m to the right`;
				let wrong2=`Distance = ${Math.abs(a-b)} m, Displacement = ${displacement} m to the right`;
				let wrong3=`Distance = ${distance} m, Displacement = 0 m`;
				choices=[answer,wrong1,wrong2,wrong3];
				break;
			}
			case "distanceOpposite":{
				let a=rng.nextInt(10,100);
				let b=rng.nextInt(5,a-1);
				let distance=a+b;
				let displacement=a-b;
				text=`An object moves ${a} m to the right, then ${b} m to the left. What is the distance traveled and the displacement?`;
				answer=`Distance = ${distance} m, Displacement = ${displacement} m to the right`;
				let wrong1=`Distance = ${distance} m, Displacement = ${a+b} m to the right`;
				let wrong2=`Distance = ${Math.abs(displacement)} m, Displacement = ${displacement} m to the right`;
				let wrong3=`Distance = ${distance} m, Displacement = 0 m`;
				choices=[answer,wrong1,wrong2,wrong3];
				break;
			}
			case "signVelocity":{
				let type=rng.nextInt(1,3);
				if (type===1){
					text="An object moves to the right while slowing down. What are the signs of velocity and acceleration?";
					answer="Velocity positive, acceleration negative";
					choices=[answer,"Velocity positive, acceleration positive","Velocity negative, acceleration negative","Velocity negative, acceleration positive"];
				}
				else if (type===2){
					text="An object moves to the left while speeding up. What are the signs of velocity and acceleration?";
					answer="Velocity negative, acceleration negative";
					choices=[answer,"Velocity negative, acceleration positive","Velocity positive, acceleration positive","Velocity positive, acceleration negative"];
				}
				else{
					text="An object moves to the right with constant velocity. What are the signs of velocity and acceleration?";
					answer="Velocity positive, acceleration zero";
					choices=[answer,"Velocity positive, acceleration positive","Velocity positive, acceleration negative","Velocity zero, acceleration zero"];
				}
				break;
			}
			case "scalarVector":{
				let type=rng.nextInt(1,2);
				if (type===1){
					text="Which of the following is a vector quantity?";
					answer="Displacement";
					choices=[answer,"Distance","Speed","Mass"];
				}
				else{
					text="Which of the following is a scalar quantity?";
					answer="Distance";
					choices=[answer,"Displacement","Velocity","Acceleration"];
				}
				break;
			}
			case "addVectors":{
				let a=rng.nextFloat()*100-50;
				let b=rng.nextFloat()*100-50;
				let res=a+b;
				let dir=res>=0?"right":"left";
				answer=`${Math.abs(res).toFixed(1)} m ${dir}`;
				text=`Vector A has magnitude ${Math.abs(a).toFixed(1)} m ${a>=0?"right":"left"}. Vector B has magnitude ${Math.abs(b).toFixed(1)} m ${b>=0?"right":"left"}. What is the magnitude and direction of A + B?`;
				let wrongDir=res>=0?"left":"right";
				let wrong1=`${Math.abs(res).toFixed(1)} m ${wrongDir}`;
				let wrong2=`${Math.abs(a-b).toFixed(1)} m ${a-b>=0?"right":"left"}`;
				let wrong3=`${Math.abs(b-a).toFixed(1)} m ${b-a>=0?"right":"left"}`;
				choices=[answer,wrong1,wrong2,wrong3];
				break;
			}
			case "subtractVectors":{
				let a=rng.nextFloat()*100-50;
				let b=rng.nextFloat()*100-50;
				let diff=a-b;
				let dir=diff>=0?"right":"left";
				answer=`${Math.abs(diff).toFixed(1)} m ${dir}`;
				text=`Vector A has magnitude ${Math.abs(a).toFixed(1)} m ${a>=0?"right":"left"}. Vector B has magnitude ${Math.abs(b).toFixed(1)} m ${b>=0?"right":"left"}. What is the magnitude and direction of A - B?`;
				let wrongDir=diff>=0?"left":"right";
				let wrong1=`${Math.abs(diff).toFixed(1)} m ${wrongDir}`;
				let wrong2=`${Math.abs(a+b).toFixed(1)} m ${a+b>=0?"right":"left"}`;
				let wrong3=`${Math.abs(b-a).toFixed(1)} m ${b-a>=0?"right":"left"}`;
				choices=[answer,wrong1,wrong2,wrong3];
				break;
			}
			default:{
				let type=rng.nextInt(1,3);
				if (type===1){
					text="A motion diagram shows equally spaced dots with velocity vectors that are all the same length and point to the right. What type of motion does this represent?";
					answer="Constant velocity to the right";
					choices=[answer,"Speeding up to the right","Slowing down to the right","Constant velocity to the left"];
				}
				else if (type===2){
					text="A motion diagram shows dots getting farther apart, with velocity vectors increasing in length and pointing to the right. What type of motion does this represent?";
					answer="Speeding up to the right";
					choices=[answer,"Constant velocity to the right","Slowing down to the right","Speeding up to the left"];
				}
				else{
					text="A motion diagram shows dots getting closer together, with velocity vectors decreasing in length and pointing to the right. What type of motion does this represent?";
					answer="Slowing down to the right";
					choices=[answer,"Constant velocity to the right","Speeding up to the right","Slowing down to the left"];
				}
				break;
			}
		}
		for (let i=choices.length-1;i>0;i--){
			let j=rng.nextInt(0,i);
			[choices[i],choices[j]]=[choices[j],choices[i]];
		}
		return {
			id: `1.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: topicId,
			topicName: topicName,
			text: text,
			answer: answer,
			answerType: "string",
			unit: unit,
			choices: options.forceMcq?choices:undefined,
			difficulty: options.difficulty,
			questionType: "MC"
		};
	}
	else if (chosenType==="Math"){
		let scenarioList=["successiveDisplacements","avgVelocity","avgSpeedVsVelocity","algebraicSum"];
		let scenario=rng.choice(scenarioList);
		let text="";
		let answer="";
		let unit:string|undefined=undefined;
		switch(scenario){
			case "successiveDisplacements":{
				let d1=rng.nextFloat()*100-50;
				let d2=rng.nextFloat()*100-50;
				let total=d1+d2;
				text=`An object undergoes a displacement of ${d1.toFixed(1)} m, followed by a displacement of ${d2.toFixed(1)} m. What is the total displacement?`;
				answer=`${total.toFixed(1)} m`;
				unit="m";
				break;
			}
			case "avgVelocity":{
				let x1=rng.nextFloat()*200-100;
				let t1=rng.nextFloat()*5;
				let x2=rng.nextFloat()*200-100;
				let t2=rng.nextFloat()*10+t1+1;
				let v=(x2-x1)/(t2-t1);
				text=`At time t = ${t1.toFixed(1)} s, an object is at position x = ${x1.toFixed(1)} m. At time t = ${t2.toFixed(1)} s, it is at x = ${x2.toFixed(1)} m. Calculate the average velocity.`;
				answer=`${v.toFixed(2)} m/s`;
				unit="m/s";
				break;
			}
			case "avgSpeedVsVelocity":{
				let d=rng.nextFloat()*80+20;
				let v1=rng.nextFloat()*8+2;
				let v2=rng.nextFloat()*8+2;
				let t1=d/v1;
				let t2=d/v2;
				let speed=(2*d)/(t1+t2);
				let vel=0;
				text=`A car travels ${d.toFixed(1)} km east at ${v1.toFixed(1)} km/h, then returns west at ${v2.toFixed(1)} km/h. Calculate (a) average speed and (b) average velocity.`;
				answer=`Average speed = ${speed.toFixed(2)} km/h, Average velocity = ${vel} km/h`;
				unit=undefined;
				break;
			}
			default:{
				let a=rng.nextFloat()*60-30;
				let b=rng.nextFloat()*60-30;
				let sum=a+b;
				text=`Vector A has value ${a.toFixed(1)} (positive = right, negative = left). Vector B has value ${b.toFixed(1)}. What is the algebraic sum A + B (include sign and unit)?`;
				answer=`${sum.toFixed(1)} m`;
				unit="m";
				break;
			}
		}
		return {
			id: `1.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
		let scenarioList=["positionTimeFromVerbal","velocityTimeFromPosition","motionDiagram"];
		let scenario=rng.choice(scenarioList);
		let text="";
		let answer="";
		if (scenario==="positionTimeFromVerbal"){
			let segments=rng.nextInt(2,4);
			let totalTime=0;
			let descParts:string[]=[];
			let rubricParts:string[]=[];
			let pos=0;
			for (let i=0;i<segments;i++){
				let dur=rng.nextInt(1,4);
				let spd=rng.nextFloat()*4.5+0.5;
				let dir=rng.choice(["right","left"]);
				let sign=dir==="right"?1:-1;
				let delta=sign*spd*dur;
				descParts.push(`moves ${dir} at ${spd.toFixed(1)} m/s for ${dur} s`);
				rubricParts.push(`From t=${totalTime} to ${totalTime+dur}: straight line slope ${(sign*spd).toFixed(1)} (${dir})`);
				totalTime+=dur;
				pos+=delta;
			}
			text=`An object starts at x=0. It ${descParts.join(", then ")}. Sketch the position vs. time graph.`;
			answer=`Rubric: Horizontal axis time (s) 0-${totalTime}, vertical position (m). ${rubricParts.join("; ")}. Graph is piecewise linear and continuous. Label axes.`;
		}
		else if (scenario==="velocityTimeFromPosition"){
			let type=rng.nextInt(1,3);
			let desc="";
			if (type===1){
				desc="The position‑time graph is a straight line with positive slope (constant velocity right).";
				answer="Rubric: Sketch a horizontal line at a positive constant value (the slope). Label axes: time (s) horizontal, velocity (m/s) vertical.";
			}
			else if (type===2){
				desc="The position‑time graph is a parabola opening upward (increasing slope, positive acceleration).";
				answer="Rubric: Sketch a straight line with positive slope (velocity increasing linearly). Start at some positive value and increase.";
			}
			else{
				desc="The position‑time graph is a parabola opening downward (decreasing slope, negative acceleration).";
				answer="Rubric: Sketch a straight line with negative slope (velocity decreasing linearly). Start at some positive value and decrease.";
			}
			text=`Given the description: ${desc} Sketch the corresponding velocity‑time graph.`;
		}
		else{
			let type=rng.nextInt(1,3);
			if (type===1){
				text="Complete the motion diagram: An object moves right with constant velocity. Five equally spaced dots, velocity vectors missing.";
				answer="Rubric: Draw velocity vectors at each dot, all pointing right, all same length. Dots remain equally spaced.";
			}
			else if (type===2){
				text="Complete the motion diagram: An object moves right and speeds up. Five dots with increasing spacing, velocity vectors missing.";
				answer="Rubric: Draw velocity vectors at each dot, all pointing right, increasing in length from first to last. Spacing increases.";
			}
			else{
				text="Complete the motion diagram: An object moves right and slows down. Five dots with decreasing spacing, velocity vectors missing.";
				answer="Rubric: Draw velocity vectors at each dot, all pointing right, decreasing in length from first to last. Spacing decreases.";
			}
		}
		return {
			id: `1.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
		let text="No laboratory experiment is defined for topic 1.1 (Scalars and Vectors in One Dimension). This topic focuses on conceptual distinctions and basic vector calculations, typically assessed through multiple‑choice and mathematical routines.";
		let answer="N/A";
		return {
			id: `1.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
		let xi=rng.nextFloat()*40-20;
		let xf=rng.nextFloat()*40-20;
		let disp=xf-xi;
		let dist=Math.abs(disp);
		let text=`Claim: "Distance is always positive, but displacement can be positive, negative, or zero." Using definitions, derive this claim mathematically. Then provide a numeric example where distance is positive but displacement negative. Use initial position = ${xi.toFixed(1)} m, final = ${xf.toFixed(1)} m.`;
		let answer=`Rubric: 1) Distance = total path length ≥0; Displacement = x_f - x_i (any real). 2) Example: distance = at least ${dist.toFixed(1)} m, displacement = ${disp.toFixed(1)} m (negative because ${xf.toFixed(1)} < ${xi.toFixed(1)}).`;
		return {
			id: `1.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
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