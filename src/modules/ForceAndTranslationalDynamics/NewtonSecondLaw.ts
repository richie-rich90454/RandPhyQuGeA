import type { Question, GenerateOptions } from '../../types.d.js';
import { SeededRandom } from '../../seededRandom.js';
export const topicId="2.5_newton_second_law";
export const topicName="Newton's Second Law";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["singleObjectHorizontal","atwoodMachine","inclineNoFriction","elevatorApparentWeight","multipleForces2D","pulleyWithFriction"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "singleObjectHorizontal":{
					const m=rng.nextInt(2,5);
					const F=rng.nextInt(10,20);
					const a=F/m;
					text=`A ${m} kg object is pulled horizontally with a ${F} N force. Friction is negligible. Its acceleration is:`;
					answer=`${a.toFixed(1)} m/s²`;
					const wrong1=`${(a*0.5).toFixed(1)} m/s²`;
					const wrong2=`${(a*2).toFixed(1)} m/s²`;
					const wrong3=`${(a*0.8).toFixed(1)} m/s²`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "atwoodMachine":{
					const m1=rng.nextInt(2,4);
					const m2=rng.nextInt(5,7);
					const a=((m2-m1)*9.8)/(m1+m2);
					text=`In an Atwood machine with masses ${m1} kg and ${m2} kg, the acceleration is:`;
					answer=`${a.toFixed(2)} m/s²`;
					const wrong1=`${(a*0.7).toFixed(2)} m/s²`;
					const wrong2=`${(a*1.3).toFixed(2)} m/s²`;
					const wrong3=`${(a*0.5).toFixed(2)} m/s²`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "inclineNoFriction":{
					const m=rng.nextInt(2,5);
					const angle=rng.nextInt(15,45);
					const a=9.8*Math.sin(angle*Math.PI/180);
					text=`A ${m} kg block slides down a frictionless incline at ${angle}°. Its acceleration is:`;
					answer=`${a.toFixed(2)} m/s²`;
					const wrong1=`${(a*0.6).toFixed(2)} m/s²`;
					const wrong2=`${(a*1.2).toFixed(2)} m/s²`;
					const wrong3=`${(9.8*Math.cos(angle*Math.PI/180)).toFixed(2)} m/s²`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "elevatorApparentWeight":{
					const m=rng.nextInt(50,70);
					const a=rng.nextInt(1,3);
					const dir=rng.choice(["up","down"]);
					let N:number;
					if (dir==="up"){
						N=m*(9.8+a);
						text=`A ${m} kg person stands on a scale in an elevator accelerating upward at ${a} m/s². The scale reading is:`;
					}
					else{
						N=m*(9.8-a);
						text=`A ${m} kg person stands on a scale in an elevator accelerating downward at ${a} m/s². The scale reading is:`;
					}
					answer=`${N.toFixed(0)} N`;
					const wrong1=`${(m*9.8).toFixed(0)} N`;
					const wrong2=`${(m*9.8*0.5).toFixed(0)} N`;
					const wrong3=`0 N`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				default:{
					const F1=rng.nextInt(3,8);
					const F2=rng.nextInt(3,8);
					const m=rng.nextInt(2,5);
					const Fnet=Math.sqrt(F1*F1+F2*F2);
					const a=Fnet/m;
					text=`Two forces, ${F1} N east and ${F2} N north, act on a ${m} kg object. The magnitude of acceleration is:`;
					answer=`${a.toFixed(2)} m/s²`;
					const wrong1=`${(a*0.7).toFixed(2)} m/s²`;
					const wrong2=`${(a*1.3).toFixed(2)} m/s²`;
					const wrong3=`${((F1+F2)/m).toFixed(2)} m/s²`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `2.5_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			const scenarioList=["simpleAcceleration","atwoodAcceleration","inclineAcceleration","twoBlockPulley","elevatorNormalForce","vectorNetForce"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			const g=9.8;
			switch(scenario){
				case "simpleAcceleration":{
					const m=rng.nextInt(2,8);
					const F=rng.nextInt(10,30);
					const a=F/m;
					text=`A net force of ${F} N acts on a ${m} kg object. Find the acceleration.`;
					correctAnswer=`${a.toFixed(2)} m/s²`;
					numericValue=a;
					unit="m/s²";
					break;
				}
				case "atwoodAcceleration":{
					const m1=rng.nextInt(2,5);
					const m2=rng.nextInt(6,9);
					const a=((m2-m1)*g)/(m1+m2);
					text=`Find the acceleration of an Atwood machine with masses ${m1} kg and ${m2} kg. (g = 9.8 m/s²)`;
					correctAnswer=`${a.toFixed(2)} m/s²`;
					numericValue=a;
					unit="m/s²";
					break;
				}
				case "inclineAcceleration":{
					const angle=rng.nextInt(15,60);
					const a=g*Math.sin(angle*Math.PI/180);
					text=`A block slides down a frictionless incline of angle ${angle}°. Find its acceleration. (g = 9.8 m/s²)`;
					correctAnswer=`${a.toFixed(2)} m/s²`;
					numericValue=a;
					unit="m/s²";
					break;
				}
				case "twoBlockPulley":{
					const m1=rng.nextInt(2,5);
					const m2=rng.nextInt(1,4);
					const a=(m2*g)/(m1+m2);
					text=`A ${m1} kg block on a frictionless table is connected by a string over a pulley to a hanging ${m2} kg mass. Find the acceleration. (g = 9.8 m/s²)`;
					correctAnswer=`${a.toFixed(2)} m/s²`;
					numericValue=a;
					unit="m/s²";
					break;
				}
				case "elevatorNormalForce":{
					const m=rng.nextInt(50,80);
					const a=rng.nextInt(1,4);
					const dir=rng.choice(["up","down"]);
					let N:number;
					if (dir==="up"){
						N=m*(g+a);
						text=`A ${m} kg person stands in an elevator accelerating upward at ${a} m/s². Find the normal force from the floor. (g = 9.8 m/s²)`;
					}
					else{
						N=m*(g-a);
						text=`A ${m} kg person stands in an elevator accelerating downward at ${a} m/s². Find the normal force from the floor. (g = 9.8 m/s²)`;
					}
					correctAnswer=`${N.toFixed(0)} N`;
					numericValue=N;
					unit="N";
					break;
				}
				default:{
					const F1=rng.nextInt(10,30);
					const F2=rng.nextInt(10,30);
					const m=rng.nextInt(2,6);
					const Fnet=Math.sqrt(F1*F1+F2*F2);
					const a=Fnet/m;
					text=`Forces of ${F1} N east and ${F2} N north act on a ${m} kg object. Find the magnitude of acceleration.`;
					correctAnswer=`${a.toFixed(2)} m/s²`;
					numericValue=a;
					unit="m/s²";
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
					id: `2.5_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `2.5_${Date.now()}_${rng.nextInt(0,1e6)}`,
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