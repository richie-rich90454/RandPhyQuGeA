import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="2.9_circular_motion";
export const topicName="Circular Motion";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["centripetalDirection","acFromVandR","minSpeedTopLoop","bankedCurveAngle","conicalPendulum"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "centripetalDirection":
					text="For an object moving in a circle at constant speed, the acceleration vector is directed:";
					answer="Radially inward";
					choices=[answer,"Tangent to the circle","Radially outward","Zero"];
					break;
				case "acFromVandR":{
					const v=rng.nextInt(10,25);
					const r=rng.nextInt(20,50);
					const ac=v*v/r;
					text=`A car goes around a curve of radius ${r} m at ${v} m/s. Its centripetal acceleration is:`;
					answer=`${ac.toFixed(1)} m/s²`;
					const wrong1=`${(ac*0.5).toFixed(1)} m/s²`;
					const wrong2=`${(ac*2).toFixed(1)} m/s²`;
					const wrong3=`${(v/r).toFixed(1)} m/s²`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "minSpeedTopLoop":{
					const R=rng.nextInt(5,15);
					const v=Math.sqrt(9.8*R);
					text=`At the top of a vertical loop of radius ${R} m, the minimum speed to maintain circular motion is:`;
					answer=`${v.toFixed(1)} m/s`;
					const wrong1=`${(v*0.7).toFixed(1)} m/s`;
					const wrong2=`${(v*1.3).toFixed(1)} m/s`;
					const wrong3=`${Math.sqrt(2*9.8*R).toFixed(1)} m/s`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				default:{
					const v=rng.nextInt(15,30);
					const r=rng.nextInt(30,80);
					const theta=Math.atan(v*v/(r*9.8))*180/Math.PI;
					text=`A frictionless banked curve is designed for a speed of ${v} m/s and radius ${r} m. The banking angle is:`;
					answer=`${theta.toFixed(0)}°`;
					const wrong1=`${(theta*0.7).toFixed(0)}°`;
					const wrong2=`${(theta*1.3).toFixed(0)}°`;
					const wrong3=`${(theta+10).toFixed(0)}°`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `2.9_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			const scenarioList=["centripetalAcceleration","minSpeedVerticalLoop","bankAngle","conicalSpeed","tensionHorizontalCircle"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			const g=9.8;
			switch(scenario){
				case "centripetalAcceleration":{
					const v=rng.nextInt(10,25);
					const r=rng.nextInt(15,50);
					const ac=v*v/r;
					text=`Find the centripetal acceleration of a car moving at ${v} m/s around a curve of radius ${r} m.`;
					correctAnswer=`${ac.toFixed(1)} m/s²`;
					numericValue=ac;
					unit="m/s²";
					break;
				}
				case "minSpeedVerticalLoop":{
					const R=rng.nextInt(5,15);
					const v=Math.sqrt(g*R);
					text=`Find the minimum speed at the top of a vertical loop of radius ${R} m to maintain circular motion. (g = 9.8 m/s²)`;
					correctAnswer=`${v.toFixed(1)} m/s`;
					numericValue=v;
					unit="m/s";
					break;
				}
				case "bankAngle":{
					const v=rng.nextInt(15,30);
					const r=rng.nextInt(30,80);
					const theta=Math.atan(v*v/(r*g))*180/Math.PI;
					text=`Find the banking angle for a frictionless curve of radius ${r} m designed for a speed of ${v} m/s. (g = 9.8 m/s²)`;
					correctAnswer=`${theta.toFixed(0)}°`;
					numericValue=theta;
					unit="°";
					break;
				}
				case "conicalSpeed":{
					const L=rng.nextInt(1,3);
					const theta=rng.nextInt(20,50);
					const r=L*Math.sin(theta*Math.PI/180);
					const v=Math.sqrt(g*r*Math.tan(theta*Math.PI/180));
					text=`A conical pendulum has a string of length ${L} m making an angle ${theta}° with the vertical. Find the speed of the mass. (g = 9.8 m/s²)`;
					correctAnswer=`${v.toFixed(1)} m/s`;
					numericValue=v;
					unit="m/s";
					break;
				}
				default:{
					const m=rng.nextInt(1,4);
					const v=rng.nextInt(5,12);
					const r=rng.nextInt(2,6);
					const T=m*v*v/r;
					text=`A ${m} kg object moves in a horizontal circle of radius ${r} m at speed ${v} m/s. Find the tension (centripetal force).`;
					correctAnswer=`${T.toFixed(0)} N`;
					numericValue=T;
					unit="N";
					break;
				}
			}
			if (options.forceMcq){
				let choices: string[]=[correctAnswer];
				const offsets=[-0.2,0.15,0.3];
				for (let off of offsets){
					let wrong=numericValue+numericValue*off;
					if (unit==="°") choices.push(`${wrong.toFixed(0)}°`);
					else if (unit==="N") choices.push(`${wrong.toFixed(0)} N`);
					else choices.push(`${wrong.toFixed(1)} ${unit}`);
				}
				choices=[...new Set(choices)];
				while(choices.length<4) choices.push("0");
				if (!choices.includes(correctAnswer)) choices[0]=correctAnswer;
				for(let i=choices.length-1;i>0;i--){
					const j=rng.nextInt(0,i);
					[choices[i],choices[j]]=[choices[j],choices[i]];
				}
				return{
					id: `2.9_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `2.9_${Date.now()}_${rng.nextInt(0,1e6)}`,
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