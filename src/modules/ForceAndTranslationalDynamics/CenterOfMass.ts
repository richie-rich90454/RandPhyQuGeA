import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="2.1_center_of_mass";
export const topicName="Center of Mass";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=[
				"systemDefinition","cmTwoMasses","cmThreeMasses","cmMotion","cmInternalForces",
				"cmVelocity","cmAcceleration","cmRelativePosition","cmZeroMomentum","cmSplitting"
			];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "systemDefinition":
					text="A person pushes a box across a rough floor. Which is the best system to analyze the work done by the person?";
					answer="The box only";
					choices=[answer,"The person only","The box and the floor","The person and the box"];
					break;
				case "cmTwoMasses":{
					const m1=rng.nextInt(1,5);
					const m2=rng.nextInt(2,8);
					const x1=rng.nextInt(0,3);
					const x2=rng.nextInt(5,10);
					const cm=(m1*x1+m2*x2)/(m1+m2);
					text=`Masses ${m1} kg and ${m2} kg are at x = ${x1} m and x = ${x2} m. Where is the center of mass?`;
					answer=`${cm.toFixed(1)} m`;
					const wrong1=`${(cm*0.7).toFixed(1)} m`;
					const wrong2=`${(cm*1.3).toFixed(1)} m`;
					const wrong3=`${(cm*0.5).toFixed(1)} m`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "cmThreeMasses":{
					const m1=rng.nextInt(1,4);
					const m2=rng.nextInt(2,5);
					const m3=rng.nextInt(3,6);
					const x1=rng.nextInt(0,2);
					const x2=rng.nextInt(3,5);
					const x3=rng.nextInt(6,9);
					const cm=(m1*x1+m2*x2+m3*x3)/(m1+m2+m3);
					text=`Three masses: ${m1} kg at x=${x1} m, ${m2} kg at x=${x2} m, ${m3} kg at x=${x3} m. Find the center of mass.`;
					answer=`${cm.toFixed(1)} m`;
					const wrong1=`${(cm*0.8).toFixed(1)} m`;
					const wrong2=`${(cm*1.2).toFixed(1)} m`;
					const wrong3=`${(cm*0.6).toFixed(1)} m`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "cmMotion":
					text="The center of mass of a system of particles moves as if:";
					answer="All external forces act at the CM";
					choices=[answer,"Internal forces dominate","Mass is ignored","All forces are internal"];
					break;
				case "cmInternalForces":
					text="Internal forces do NOT affect the motion of the center of mass because:";
					answer="They cancel in pairs (Newton's third law)";
					choices=[answer,"They are zero","They are always balanced by gravity","They are too small"];
					break;
				case "cmVelocity":{
					const v1=rng.nextInt(2,8);
					const v2=rng.nextInt(-5,-1);
					const m1=rng.nextInt(2,6);
					const m2=rng.nextInt(3,7);
					const vcm=(m1*v1+m2*v2)/(m1+m2);
					text=`A ${m1} kg object moves at ${v1} m/s right, a ${m2} kg object moves at ${Math.abs(v2)} m/s left. Find the velocity of the center of mass.`;
					answer=`${vcm.toFixed(1)} m/s ${vcm>0?"right":"left"}`;
					const wrong1=`${(vcm*0.8).toFixed(1)} m/s ${vcm>0?"right":"left"}`;
					const wrong2=`${(vcm*1.2).toFixed(1)} m/s ${vcm>0?"right":"left"}`;
					const wrong3=`${(Math.abs(vcm)*0.5).toFixed(1)} m/s ${vcm>0?"left":"right"}`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "cmAcceleration":
					text="The acceleration of the center of mass of a system is given by:";
					answer="a_cm = F_net_external / M_total";
					choices=[answer,"a_cm = F_net_internal / M_total","a_cm = Σ m_i a_i","a_cm = 0 always"];
					break;
				case "cmRelativePosition":{
					const m1=rng.nextInt(1,5);
					const m2=rng.nextInt(1,5);
					const d=rng.nextInt(2,8);
					const xcm=(m2*d)/(m1+m2);
					text=`Two masses ${m1} kg and ${m2} kg are placed on a massless rod of length ${d} m. Where is the center of mass measured from the ${m1} kg mass?`;
					answer=`${xcm.toFixed(1)} m`;
					const wrong1=`${(xcm*0.7).toFixed(1)} m`;
					const wrong2=`${(xcm*1.3).toFixed(1)} m`;
					const wrong3=`${(xcm*0.5).toFixed(1)} m`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				default:
					text="An exploding object splits into two fragments. The center of mass of the fragments:";
					answer="Continues with the same velocity as before the explosion";
					choices=[answer,"Stops immediately","Moves toward the larger fragment","Moves toward the smaller fragment"];
					break;
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `2.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
				"cmTwoMassesMath","cmThreeMasses2D","cmFromVelocities","cmWithDifferentMasses",
				"cmMomentumZero","cmPositionFromOrigin","cmVelocityAfterCollision","cmAccelerationFromForces"
			];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			switch(scenario){
				case "cmTwoMassesMath":{
					const m1=rng.nextInt(1,6);
					const m2=rng.nextInt(2,8);
					const x1=rng.nextInt(0,4);
					const x2=rng.nextInt(5,12);
					const cm=(m1*x1+m2*x2)/(m1+m2);
					text=`A ${m1} kg mass is at x = ${x1} m and a ${m2} kg mass is at x = ${x2} m. Find the center of mass position.`;
					correctAnswer=`${cm.toFixed(1)} m`;
					numericValue=cm;
					unit="m";
					break;
				}
				case "cmThreeMasses2D":{
					const m1=rng.nextInt(1,4);
					const m2=rng.nextInt(2,5);
					const m3=rng.nextInt(3,6);
					const x1=rng.nextInt(0,2);
					const y1=rng.nextInt(0,2);
					const x2=rng.nextInt(3,5);
					const y2=rng.nextInt(0,2);
					const x3=rng.nextInt(0,2);
					const y3=rng.nextInt(3,6);
					const cmx=(m1*x1+m2*x2+m3*x3)/(m1+m2+m3);
					const cmy=(m1*y1+m2*y2+m3*y3)/(m1+m2+m3);
					text=`Three masses: ${m1} kg at (${x1},${y1}), ${m2} kg at (${x2},${y2}), ${m3} kg at (${x3},${y3}). Find the center of mass coordinates.`;
					correctAnswer=`(${cmx.toFixed(1)} m, ${cmy.toFixed(1)} m)`;
					numericValue=cmx;
					unit="m";
					break;
				}
				case "cmFromVelocities":{
					const m1=rng.nextInt(2,6);
					const m2=rng.nextInt(2,6);
					const v1=rng.nextInt(3,10);
					const v2=rng.nextInt(-8,-2);
					const vcm=(m1*v1+m2*v2)/(m1+m2);
					text=`A ${m1} kg object moves at ${v1} m/s right, a ${m2} kg object moves at ${Math.abs(v2)} m/s left. Find the velocity of the center of mass.`;
					correctAnswer=`${vcm.toFixed(1)} m/s ${vcm>0?"right":"left"}`;
					numericValue=Math.abs(vcm);
					unit="m/s";
					break;
				}
				case "cmWithDifferentMasses":{
					const m1=rng.nextInt(1,5);
					const m2=rng.nextInt(1,5);
					const d=rng.nextInt(2,10);
					const xcm=(m2*d)/(m1+m2);
					text=`Two masses ${m1} kg and ${m2} kg are attached to a massless rod of length ${d} m. How far from the ${m1} kg mass is the center of mass?`;
					correctAnswer=`${xcm.toFixed(1)} m`;
					numericValue=xcm;
					unit="m";
					break;
				}
				case "cmMomentumZero":{
					const m1=rng.nextInt(2,7);
					const m2=rng.nextInt(2,7);
					const v1=rng.nextInt(3,9);
					const v2=-(m1*v1)/m2;
					text=`A ${m1} kg object moves at ${v1} m/s. What must be the velocity of a ${m2} kg object (opposite direction) so that the center of mass is at rest?`;
					correctAnswer=`${Math.abs(v2).toFixed(1)} m/s opposite direction`;
					numericValue=Math.abs(v2);
					unit="m/s";
					break;
				}
				case "cmPositionFromOrigin":{
					const m1=rng.nextInt(2,6);
					const m2=rng.nextInt(3,8);
					const m3=rng.nextInt(1,5);
					const x1=rng.nextInt(1,4);
					const x2=rng.nextInt(5,9);
					const x3=rng.nextInt(10,14);
					const cm=(m1*x1+m2*x2+m3*x3)/(m1+m2+m3);
					text=`Three masses: ${m1} kg at ${x1} m, ${m2} kg at ${x2} m, ${m3} kg at ${x3} m. Find the center of mass relative to the origin.`;
					correctAnswer=`${cm.toFixed(1)} m`;
					numericValue=cm;
					unit="m";
					break;
				}
				default:{
					const m1=rng.nextInt(2,5);
					const m2=rng.nextInt(2,5);
					const a1=rng.nextInt(2,6);
					const a2=rng.nextInt(-4,-1);
					const acm=(m1*a1+m2*a2)/(m1+m2);
					text=`A ${m1} kg object accelerates at ${a1} m/s² right, a ${m2} kg object accelerates at ${Math.abs(a2)} m/s² left. Find the acceleration of the center of mass.`;
					correctAnswer=`${acm.toFixed(1)} m/s² ${acm>0?"right":"left"}`;
					numericValue=Math.abs(acm);
					unit="m/s²";
					break;
				}
			}
			if (options.forceMcq){
				let choices: string[]=[correctAnswer];
				if (scenario==="cmThreeMasses2D"){
					const [xStr,yStr]=correctAnswer.split(", ");
					const xNum=parseFloat(xStr.split("(")[1]);
					const yNum=parseFloat(yStr.split(" ")[0]);
					const wrong1=`(${(xNum*0.8).toFixed(1)} m, ${yNum.toFixed(1)} m)`;
					const wrong2=`(${xNum.toFixed(1)} m, ${(yNum*1.2).toFixed(1)} m)`;
					const wrong3=`(${(xNum*1.1).toFixed(1)} m, ${(yNum*0.9).toFixed(1)} m)`;
					choices=[correctAnswer,wrong1,wrong2,wrong3];
				}
				else{
					const offsets=[-0.2,0.15,0.3];
					for (let off of offsets){
						let wrong=numericValue+numericValue*off;
						if (unit) choices.push(`${wrong.toFixed(1)} ${unit}`);
						else choices.push(wrong.toFixed(1));
					}
				}
				choices=[...new Set(choices)];
				while(choices.length<4) choices.push("0");
				if (!choices.includes(correctAnswer)) choices[0]=correctAnswer;
				for(let i=choices.length-1;i>0;i--){
					const j=rng.nextInt(0,i);
					[choices[i],choices[j]]=[choices[j],choices[i]];
				}
				return{
					id: `2.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `2.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
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