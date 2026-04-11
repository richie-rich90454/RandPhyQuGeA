import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="3.1_kinetic_energy";
export const topicName="Translational Kinetic Energy";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["calculateKE","compareKE","keDoublingSpeed","keDoublingMass","referenceFrameKE"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "calculateKE":{
					const m=rng.nextInt(1,10)/2;
					const v=rng.nextInt(2,10);
					const ke=0.5*m*v*v;
					text=`A ${m} kg object moves at ${v} m/s. Its kinetic energy is:`;
					answer=`${ke.toFixed(1)} J`;
					const wrong1=`${(ke*0.5).toFixed(1)} J`;
					const wrong2=`${(ke*2).toFixed(1)} J`;
					const wrong3=`${(ke*1.5).toFixed(1)} J`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "compareKE":{
					const m1=rng.nextInt(1,4);
					const v1=rng.nextInt(3,8);
					const m2=rng.nextInt(2,6);
					const v2=rng.nextInt(2,5);
					const ke1=0.5*m1*v1*v1;
					const ke2=0.5*m2*v2*v2;
					text=`Object A: mass ${m1} kg, speed ${v1} m/s. Object B: mass ${m2} kg, speed ${v2} m/s. Which has greater kinetic energy?`;
					if (Math.abs(ke1-ke2)<0.1) answer="Equal";
					else if (ke1>ke2) answer="A";
					else answer="B";
					choices=[answer,answer==="A"?"B":"A","Both zero","Cannot be determined"];
					break;
				}
                case "keDoublingSpeed":{
                    const ke_orig=rng.nextInt(10,50);
                    text=`An object has kinetic energy ${ke_orig} J. If its speed is doubled, its kinetic energy becomes:`;
                    answer="Four times the original";
                    choices=[answer,"Twice the original","Half the original","Eight times the original"];
                    break;
                }
                case "keDoublingMass":{
                    const ke_orig=rng.nextInt(10,50);
                    text=`An object has kinetic energy ${ke_orig} J. If its mass is doubled (speed constant), its kinetic energy becomes:`;
                    answer="Twice the original";
                    choices=[answer,"Four times the original","Half the original","Eight times the original"];
                    break;
                }
				default:{
					const v_car=rng.nextInt(10,30);
					const v_ground=rng.nextInt(5,20);
					text=`A car moves at ${v_car} m/s relative to the ground. An observer in another car moving at ${v_ground} m/s in the same direction measures the kinetic energy of the first car. Compared to the ground frame, the kinetic energy in the moving frame is:`;
					answer="Different (depends on relative speed)";
					choices=[answer,"The same","Zero","Larger"];
					break;
				}
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `3.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			const scenarioList=["keFromMassSpeed","speedFromMassKE","massFromSpeedKE","keRatio"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			switch(scenario){
				case "keFromMassSpeed":{
					const m=rng.nextInt(1,10)/2;
					const v=rng.nextInt(2,10);
					const ke=0.5*m*v*v;
					text=`A ${m} kg object moves at ${v} m/s. Calculate its kinetic energy.`;
					correctAnswer=`${ke.toFixed(1)} J`;
					numericValue=ke;
					unit="J";
					break;
				}
				case "speedFromMassKE":{
					const m=rng.nextInt(1,5);
					const ke=rng.nextInt(10,50);
					const v=Math.sqrt(2*ke/m);
					text=`A ${m} kg object has kinetic energy ${ke} J. Find its speed.`;
					correctAnswer=`${v.toFixed(2)} m/s`;
					numericValue=v;
					unit="m/s";
					break;
				}
				case "massFromSpeedKE":{
					const v=rng.nextInt(3,8);
					const ke=rng.nextInt(20,60);
					const m=2*ke/(v*v);
					text=`An object moving at ${v} m/s has kinetic energy ${ke} J. Find its mass.`;
					correctAnswer=`${m.toFixed(1)} kg`;
					numericValue=m;
					unit="kg";
					break;
				}
				default:{
					const m1=rng.nextInt(1,4);
					const v1=rng.nextInt(3,8);
					const m2=rng.nextInt(2,6);
					const v2=rng.nextInt(2,5);
					const ke1=0.5*m1*v1*v1;
					const ke2=0.5*m2*v2*v2;
					const ratio=ke1/ke2;
					text=`Object A: ${m1} kg at ${v1} m/s. Object B: ${m2} kg at ${v2} m/s. Find the ratio KE_A / KE_B.`;
					correctAnswer=`${ratio.toFixed(2)}`;
					numericValue=ratio;
					unit="";
					break;
				}
			}
			if (options.forceMcq){
				let choices: string[]=[correctAnswer];
				const offsets=[-0.2,0.15,0.3];
				for (let off of offsets){
					let wrong=numericValue+numericValue*off;
					if (unit==="J") choices.push(`${wrong.toFixed(1)} J`);
					else if (unit==="m/s") choices.push(`${wrong.toFixed(2)} m/s`);
					else if (unit==="kg") choices.push(`${wrong.toFixed(1)} kg`);
					else choices.push(wrong.toFixed(2));
				}
				choices=[...new Set(choices)];
				while(choices.length<4) choices.push("0");
				if (!choices.includes(correctAnswer)) choices[0]=correctAnswer;
				for(let i=choices.length-1;i>0;i--){
					const j=rng.nextInt(0,i);
					[choices[i],choices[j]]=[choices[j],choices[i]];
				}
				return{
					id: `3.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `3.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
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