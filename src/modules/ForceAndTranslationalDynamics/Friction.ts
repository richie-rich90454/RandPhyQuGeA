import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="2.7_friction";
export const topicName="Kinetic and Static Friction";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["staticFrictionMagnitude","kineticFrictionMagnitude","frictionDirection","muSvsMuK","criticalAngle","frictionOnIncline"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "staticFrictionMagnitude":{
					const m=rng.nextInt(5,15);
					const muS=rng.nextInt(3,7)/10;
					const F_applied=rng.nextInt(10,40);
					const f_max=muS*m*9.8;
					text=`A ${m} kg box rests on a horizontal surface with μs = ${muS.toFixed(1)}. A horizontal force of ${F_applied} N is applied. The static friction force is:`;
					if (F_applied<=f_max) answer=`${F_applied} N`;
					else answer=`${f_max.toFixed(1)} N (maximum)`;
					const wrong1=`${f_max.toFixed(1)} N`;
					const wrong2=`${(f_max*0.5).toFixed(1)} N`;
					const wrong3=`0 N`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "kineticFrictionMagnitude":{
					const m=rng.nextInt(3,8);
					const muK=rng.nextInt(1,4)/10;
					const f_k=muK*m*9.8;
					text=`A ${m} kg block slides on a rough surface with μk = ${muK.toFixed(1)}. The kinetic friction force is:`;
					answer=`${f_k.toFixed(1)} N`;
					const wrong1=`${(f_k*0.5).toFixed(1)} N`;
					const wrong2=`${(f_k*2).toFixed(1)} N`;
					const wrong3=`0 N`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "frictionDirection":
					text="A box is pushed to the right across a rough floor. The kinetic friction force direction is:";
					answer="To the left";
					choices=[answer,"To the right","Upward","Downward"];
					break;
				case "muSvsMuK":
					text="For a given pair of surfaces, the coefficient of static friction μs is typically:";
					answer="Greater than μk";
					choices=[answer,"Less than μk","Equal to μk","Unrelated"];
					break;
				case "criticalAngle":{
					const angle=rng.nextInt(15,45);
					const muS=Math.tan(angle*Math.PI/180);
					text=`A block just begins to slip when an incline is raised to ${angle}°. Find μs.`;
					answer=`${muS.toFixed(3)}`;
					const wrong1=`${(muS*0.8).toFixed(3)}`;
					const wrong2=`${(muS*1.2).toFixed(3)}`;
					const wrong3=`${Math.sin(angle*Math.PI/180).toFixed(3)}`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
                default:{
                    const angle=rng.nextInt(20,50);
                    text=`A block slides down a ${angle}° incline at constant speed. The coefficient of kinetic friction is:`;
                    answer=`${Math.tan(angle*Math.PI/180).toFixed(3)}`;
                    choices=[answer,`${(Math.tan(angle*Math.PI/180)*0.8).toFixed(3)}`,`${(Math.tan(angle*Math.PI/180)*1.2).toFixed(3)}`,`0`];
                    break;
                }
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `2.7_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			const scenarioList=["muSfromAngle","muKfromAcceleration","frictionForceHorizontal","frictionOnInclineMath"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			const g=9.8;
			switch(scenario){
				case "muSfromAngle":{
					const angle=rng.nextInt(15,45);
					const muS=Math.tan(angle*Math.PI/180);
					text=`A block just begins to slip on an incline at angle ${angle}°. Find the coefficient of static friction.`;
					correctAnswer=`${muS.toFixed(3)}`;
					numericValue=muS;
					unit="";
					break;
				}
				case "muKfromAcceleration":{
					const m=rng.nextInt(2,6);
					const F=rng.nextInt(15,30);
					const a=rng.nextInt(1,4);
					const muK=(F-m*a)/(m*g);
					text=`A ${m} kg block is pulled horizontally with a force of ${F} N and accelerates at ${a} m/s². Find μk. (g = 9.8 m/s²)`;
					correctAnswer=`${muK.toFixed(3)}`;
					numericValue=muK;
					unit="";
					break;
				}
				case "frictionForceHorizontal":{
					const m=rng.nextInt(3,8);
					const muK=rng.nextInt(2,5)/10;
					const f_k=muK*m*g;
					text=`A ${m} kg box slides on a horizontal surface with μk = ${muK.toFixed(1)}. Find the kinetic friction force. (g = 9.8 m/s²)`;
					correctAnswer=`${f_k.toFixed(1)} N`;
					numericValue=f_k;
					unit="N";
					break;
				}
				default:{
					const angle=rng.nextInt(20,50);
					const muK=rng.nextInt(2,5)/10;
					const a=g*(Math.sin(angle*Math.PI/180)-muK*Math.cos(angle*Math.PI/180));
					text=`A block slides down a ${angle}° incline with μk = ${muK.toFixed(1)}. Find the acceleration. (g = 9.8 m/s²)`;
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
					else choices.push(wrong.toFixed(3));
				}
				choices=[...new Set(choices)];
				while(choices.length<4) choices.push("0");
				if (!choices.includes(correctAnswer)) choices[0]=correctAnswer;
				for(let i=choices.length-1;i>0;i--){
					const j=rng.nextInt(0,i);
					[choices[i],choices[j]]=[choices[j],choices[i]];
				}
				return{
					id: `2.7_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `2.7_${Date.now()}_${rng.nextInt(0,1e6)}`,
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