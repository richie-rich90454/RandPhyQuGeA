import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="3.2_work";
export const topicName="Work";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["workZeroPerpendicular","workGravityClosedPath","workFrictionPathDependent","workSign","workConstantForce"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "workZeroPerpendicular":
					text="A person carries a heavy box horizontally across a room at constant speed. The work done by the person on the box is:";
					answer="Zero";
					choices=[answer,"Positive","Negative","Depends on distance"];
					break;
				case "workGravityClosedPath":
					text="A ball is thrown upward and returns to its starting point. The net work done by gravity on the ball is:";
					answer="Zero";
					choices=[answer,"Positive","Negative","Depends on the path"];
					break;
				case "workFrictionPathDependent":
					text="A box is pushed across a rough floor from point A to point B along two different paths: a straight line and a longer curved path. The work done by friction:";
					answer="Greater for the longer path";
					choices=[answer,"Same for both paths","Greater for the straight path","Zero for both"];
					break;
				case "workSign":{
					const F_dir=rng.choice(["same","opposite"]);
					if (F_dir==="same"){
						text="A force acts in the same direction as an object's displacement. The work done by the force is:";
						answer="Positive";
					}
					else{
						text="A force acts opposite to an object's displacement. The work done by the force is:";
						answer="Negative";
					}
					choices=[answer,"Zero","Depends on magnitude","Cannot be determined"];
					break;
				}
				default:{
					const F=rng.nextInt(10,30);
					const d=rng.nextInt(2,8);
					const theta=rng.choice([0,30,60,90,120,180]);
					const W=F*d*Math.cos(theta*Math.PI/180);
					text=`A force of ${F} N acts over a displacement of ${d} m at an angle of ${theta}°. The work done is:`;
					if (W>0) answer="Positive";
					else if (W<0) answer="Negative";
					else answer="Zero";
					choices=[answer,"Positive","Negative","Depends on time"];
					break;
				}
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `3.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			const scenarioList=["workConstantForce","workFromGraphArea","workVariableForceLinear","workFriction","workNet"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			switch(scenario){
				case "workConstantForce":{
					const F=rng.nextInt(10,30);
					const d=rng.nextInt(2,8);
					const theta=rng.nextInt(0,90);
					const W=F*d*Math.cos(theta*Math.PI/180);
					text=`A force of ${F} N pulls a box ${d} m at an angle of ${theta}° above horizontal. Calculate the work done by the force.`;
					correctAnswer=`${W.toFixed(1)} J`;
					numericValue=W;
					unit="J";
					break;
				}
				case "workFromGraphArea":{
					const F1=rng.nextInt(5,15);
					const x1=rng.nextInt(2,4);
					const F2=rng.nextInt(10,20);
					const x2=rng.nextInt(4,6);
					const F3=rng.nextInt(0,5);
					const x3=rng.nextInt(6,8);
					const W=F1*(x1-0)+F2*(x2-x1)+F3*(x3-x2);
					text=`The force on an object varies with position: from x=0 to ${x1} m, F=${F1} N; from x=${x1} to ${x2} m, F=${F2} N; from x=${x2} to ${x3} m, F=${F3} N. Find the net work done from x=0 to ${x3} m.`;
					correctAnswer=`${W.toFixed(0)} J`;
					numericValue=W;
					unit="J";
					break;
				}
				case "workVariableForceLinear":{
					const k=rng.nextInt(2,6);
					const x_end=rng.nextInt(3,6);
					const W=0.5*k*x_end*x_end;
					text=`A force F(x) = ${k}x (in newtons) acts on an object from x=0 to x=${x_end} m. Find the work done.`;
					correctAnswer=`${W.toFixed(1)} J`;
					numericValue=W;
					unit="J";
					break;
				}
				case "workFriction":{
					const m=rng.nextInt(2,8);
					const mu=rng.nextInt(2,5)/10;
					const d=rng.nextInt(3,10);
					const W_f=-mu*m*9.8*d;
					text=`A ${m} kg box slides on a rough horizontal surface with μk = ${mu.toFixed(1)} for a distance of ${d} m. Find the work done by friction. (g = 9.8 m/s²)`;
					correctAnswer=`${W_f.toFixed(1)} J`;
					numericValue=Math.abs(W_f);
					unit="J";
					break;
				}
				default:{
					const F1=rng.nextInt(10,20);
					const d1=rng.nextInt(2,5);
					const F2=rng.nextInt(5,15);
					const d2=rng.nextInt(3,6);
					const W_net=F1*d1 + F2*d2;
					text=`A 10 N force acts for 3 m, then a 15 N force acts for 4 m in the same direction. Find the net work.`;
					correctAnswer=`${W_net.toFixed(0)} J`;
					numericValue=W_net;
					unit="J";
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
					id: `3.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `3.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
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