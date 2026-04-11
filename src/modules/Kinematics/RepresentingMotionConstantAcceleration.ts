import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="1.3_constant_acceleration";
export const topicName="Constant Acceleration Motion";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=[
				"kinematicEquations","constantAGraphs","stoppingDistance","reactionTime","freeFallTime",
				"overtaking","twoStageMotion","graphSlopeMeaning","areaUnderGraph","vfFromV0At"
			];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "kinematicEquations":
					text="Which equation correctly relates final velocity, initial velocity, acceleration, and displacement?";
					answer="All of the above";
					choices=[answer,"v = v₀ + at","v² = v₀² + 2aΔx","Δx = v₀t + ½at²"];
					break;
				case "constantAGraphs":
					text="Which graph shows an object with constant positive acceleration?";
					answer="both A and C";
					choices=[answer,"x‑t parabola opening upward","v‑t horizontal line","a‑t horizontal line"];
					break;
				case "stoppingDistance":{
					const v0=rng.nextInt(15,25);
					const a=rng.nextInt(4,7);
					const stopping=v0*v0/(2*a);
					text=`A car traveling at ${v0} m/s brakes with constant deceleration of ${a} m/s². What is the stopping distance?`;
					answer=`${stopping.toFixed(1)} m`;
					const wrong1=`${(stopping*0.5).toFixed(1)} m`;
					const wrong2=`${(stopping*2).toFixed(1)} m`;
					const wrong3=`${(stopping*0.25).toFixed(1)} m`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "reactionTime":{
					const v=rng.nextInt(15,30);
					const treact=rng.nextInt(1,3)/10;
					const dReact=v*treact;
					text=`A driver has a reaction time of ${treact.toFixed(1)} s. The car is moving at ${v} m/s. How far does the car travel during the driver's reaction time before braking begins?`;
					answer=`${dReact.toFixed(1)} m`;
					const wrong1=`${(dReact*0.7).toFixed(1)} m`;
					const wrong2=`${(dReact*1.3).toFixed(1)} m`;
					const wrong3=`${(dReact*0.5).toFixed(1)} m`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "freeFallTime":{
					const h=rng.nextInt(20,80);
					const t=Math.sqrt(2*h/9.8);
					text=`An object is dropped from a height of ${h} m. How long does it take to hit the ground? (g = 9.8 m/s²)`;
					answer=`${t.toFixed(1)} s`;
					const wrong1=`${(t*0.8).toFixed(1)} s`;
					const wrong2=`${(t*1.2).toFixed(1)} s`;
					const wrong3=`${(t*0.6).toFixed(1)} s`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "overtaking":{
					const v1=rng.nextInt(10,20);
					const v2=rng.nextInt(5,v1-1);
					const d=rng.nextInt(50,100);
					const tRel=d/(v1-v2);
					text=`Car A moves at ${v1} m/s, car B moves at ${v2} m/s in the same direction. Initially B is ${d} m ahead. How long until A catches B?`;
					answer=`${tRel.toFixed(1)} s`;
					const wrong1=`${(tRel*0.8).toFixed(1)} s`;
					const wrong2=`${(tRel*1.2).toFixed(1)} s`;
					const wrong3=`${(tRel*1.5).toFixed(1)} s`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "twoStageMotion":{
					const a1=rng.nextInt(2,4);
					const t1=rng.nextInt(3,6);
					const v1=a1*t1;
					const a2=rng.nextInt(3,6);
					const t2=rng.nextInt(2,5);
					const v2=v1+a2*t2;
					text=`An object accelerates from rest at ${a1} m/s² for ${t1} s, then accelerates at ${a2} m/s² for another ${t2} s. What is its final velocity?`;
					answer=`${v2.toFixed(1)} m/s`;
					const wrong1=`${(v2*0.7).toFixed(1)} m/s`;
					const wrong2=`${(v2*1.3).toFixed(1)} m/s`;
					const wrong3=`${(v2*0.5).toFixed(1)} m/s`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "graphSlopeMeaning":
					text="On a velocity‑time graph, the slope represents:";
					answer="acceleration";
					choices=[answer,"displacement","velocity","speed"];
					break;
				case "areaUnderGraph":
					text="On a velocity‑time graph, the area under the curve represents:";
					answer="displacement";
					choices=[answer,"acceleration","velocity","change in velocity"];
					break;
				default:{
					const v0=rng.nextInt(5,20);
					const a=rng.nextInt(2,6);
					const t=rng.nextInt(3,8);
					const vf=v0+a*t;
					text=`An object has initial velocity ${v0} m/s and accelerates at ${a} m/s² for ${t} s. What is its final velocity?`;
					answer=`${vf.toFixed(1)} m/s`;
					const wrong1=`${(vf*0.8).toFixed(1)} m/s`;
					const wrong2=`${(vf*1.2).toFixed(1)} m/s`;
					const wrong3=`${(vf*0.6).toFixed(1)} m/s`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `1.3_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
		default:{
			const scenarioList=[
				"finalVelocity","displacement","timeFromDistance","freeFallHeight","vfFromV0AndA",
				"reactionAndBraking","twoPartDistance","relativeAcceleration"
			];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			switch(scenario){
				case "finalVelocity":{
					const a=rng.nextInt(2,5);
					const t=rng.nextInt(3,8);
					const v=a*t;
					text=`An object starts from rest and accelerates at ${a}.0 m/s² for ${t}.0 s. Find its final velocity.`;
					correctAnswer=`${v.toFixed(1)} m/s`;
					numericValue=v;
					unit="m/s";
					break;
				}
				case "displacement":{
					const a=rng.nextInt(2,4);
					const t=rng.nextInt(4,7);
					const s=0.5*a*t*t;
					text=`A particle moves with constant acceleration ${a}.0 m/s² starting from rest. How far does it travel in ${t}.0 s?`;
					correctAnswer=`${s.toFixed(1)} m`;
					numericValue=s;
					unit="m";
					break;
				}
				case "timeFromDistance":{
					const a=rng.nextInt(2,3);
					const s=rng.nextInt(20,30);
					const t=Math.sqrt(2*s/a);
					text=`A car accelerates from rest at ${a}.0 m/s² over a distance of ${s} m. How long does it take?`;
					correctAnswer=`${t.toFixed(1)} s`;
					numericValue=t;
					unit="s";
					break;
				}
				case "freeFallHeight":{
					const t=rng.nextInt(2,5);
					const h=0.5*9.8*t*t;
					text=`An object is dropped from rest and falls for ${t}.0 s. How far does it fall? (g = 9.8 m/s²)`;
					correctAnswer=`${h.toFixed(1)} m`;
					numericValue=h;
					unit="m";
					break;
				}
				case "vfFromV0AndA":{
					const v0=rng.nextInt(5,15);
					const a=rng.nextInt(2,5);
					const t=rng.nextInt(3,7);
					const vf=v0+a*t;
					text=`An object has initial velocity ${v0} m/s and accelerates at ${a} m/s² for ${t} s. Find its final velocity.`;
					correctAnswer=`${vf.toFixed(1)} m/s`;
					numericValue=vf;
					unit="m/s";
					break;
				}
				case "reactionAndBraking":{
					const v=rng.nextInt(15,30);
					const treact=rng.nextInt(1,3)/10;
					const a=rng.nextInt(4,7);
					const dReact=v*treact;
					const dBrake=v*v/(2*a);
					const total=dReact+dBrake;
					text=`A car travels at ${v} m/s. Driver reaction time is ${treact.toFixed(1)} s, then brakes with deceleration ${a} m/s². What is the total stopping distance?`;
					correctAnswer=`${total.toFixed(1)} m`;
					numericValue=total;
					unit="m";
					break;
				}
				case "twoPartDistance":{
					const a1=rng.nextInt(2,4);
					const t1=rng.nextInt(3,6);
					const s1=0.5*a1*t1*t1;
					const v1=a1*t1;
					const t2=rng.nextInt(2,5);
					const s2=v1*t2;
					const total=s1+s2;
					text=`An object accelerates from rest at ${a1} m/s² for ${t1} s, then continues at constant velocity for ${t2} s. Find the total distance traveled.`;
					correctAnswer=`${total.toFixed(1)} m`;
					numericValue=total;
					unit="m";
					break;
				}
				default:{
					const a1=rng.nextInt(2,4);
					const a2=rng.nextInt(3,6);
					const t=rng.nextInt(2,5);
					const vRel=(a2-a1)*t;
					text=`Object A accelerates from rest at ${a1} m/s². Object B accelerates from rest at ${a2} m/s² (both start at same time). What is the relative velocity of B with respect to A after ${t} s?`;
					correctAnswer=`${vRel.toFixed(1)} m/s`;
					numericValue=vRel;
					unit="m/s";
					break;
				}
			}
			if (options.forceMcq){
				let choices: string[]=[correctAnswer];
				const offsets=[-0.2,0.15,0.3];
				for (let off of offsets){
					let wrong=numericValue+numericValue*off;
					if (unit) choices.push(`${wrong.toFixed(1)} ${unit}`);
					else choices.push(wrong.toFixed(1));
				}
				choices=[...new Set(choices)];
				while(choices.length<4) choices.push("0");
				if (!choices.includes(correctAnswer)) choices[0]=correctAnswer;
				for(let i=choices.length-1;i>0;i--){
					const j=rng.nextInt(0,i);
					[choices[i],choices[j]]=[choices[j],choices[i]];
				}
				return{
					id: `1.3_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			}
			else{
				return{
					id: `1.3_${Date.now()}_${rng.nextInt(0,1e6)}`,
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