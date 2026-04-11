import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="2.8_spring_forces";
export const topicName="Spring Forces";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["hookeLawMagnitude","springForceDirection","springConstantFromData","forceFromKAndX","seriesVsParallel"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "hookeLawMagnitude":{
					const k=rng.nextInt(100,300);
					const x=rng.nextInt(5,15)/100;
					const F=k*x;
					text=`A spring with k = ${k} N/m is stretched ${(x*100).toFixed(0)} cm. The spring force magnitude is:`;
					answer=`${F.toFixed(0)} N`;
					const wrong1=`${(F*0.5).toFixed(0)} N`;
					const wrong2=`${(F*2).toFixed(0)} N`;
					const wrong3=`${k} N`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "springForceDirection":
					text="If a spring is compressed, the force it exerts is:";
					answer="Opposite the direction of compression";
					choices=[answer,"In the direction of compression","Zero","Depends on spring constant"];
					break;
				case "springConstantFromData":{
					const m=rng.nextInt(1,5);
					const x=rng.nextInt(5,15)/100;
					const k=(m*9.8)/x;
					text=`A spring extends ${(x*100).toFixed(0)} cm when a ${m} kg mass is hung. Find k. (g = 9.8 m/s²)`;
					answer=`${k.toFixed(0)} N/m`;
					const wrong1=`${(k*0.7).toFixed(0)} N/m`;
					const wrong2=`${(k*1.3).toFixed(0)} N/m`;
					const wrong3=`${(k*0.5).toFixed(0)} N/m`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				default:{
					const k1=rng.nextInt(50,150);
					const k2=rng.nextInt(50,150);
					const k_series=(k1*k2)/(k1+k2);
					const k_parallel=k1+k2;
					text=`Two springs with k1 = ${k1} N/m and k2 = ${k2} N/m are connected in parallel. The effective spring constant is:`;
					answer=`${k_parallel} N/m`;
					const wrong1=`${k_series.toFixed(0)} N/m`;
					const wrong2=`${k1} N/m`;
					const wrong3=`${k2} N/m`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `2.8_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			const scenarioList=["forceFromExtension","springConstant","extensionFromForce","energyStored"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			switch(scenario){
				case "forceFromExtension":{
					const k=rng.nextInt(100,300);
					const x=rng.nextInt(3,12)/100;
					const F=k*x;
					text=`A spring with k = ${k} N/m is stretched ${(x*100).toFixed(0)} cm. Find the force exerted by the spring.`;
					correctAnswer=`${F.toFixed(0)} N`;
					numericValue=F;
					unit="N";
					break;
				}
				case "springConstant":{
					const m=rng.nextInt(1,5);
					const x=rng.nextInt(5,20)/100;
					const k=(m*9.8)/x;
					text=`A spring stretches ${(x*100).toFixed(0)} cm when a ${m} kg mass is hung. Find the spring constant. (g = 9.8 m/s²)`;
					correctAnswer=`${k.toFixed(0)} N/m`;
					numericValue=k;
					unit="N/m";
					break;
				}
				case "extensionFromForce":{
					const k=rng.nextInt(100,300);
					const F=rng.nextInt(20,60);
					const x=F/k;
					text=`A force of ${F} N is applied to a spring with k = ${k} N/m. Find the extension.`;
					correctAnswer=`${(x*100).toFixed(1)} cm`;
					numericValue=x;
					unit="m";
					break;
				}
				default:{
					const k=rng.nextInt(100,300);
					const x=rng.nextInt(5,15)/100;
					const E=0.5*k*x*x;
					text=`A spring with k = ${k} N/m is compressed ${(x*100).toFixed(0)} cm. Find the elastic potential energy stored.`;
					correctAnswer=`${E.toFixed(1)} J`;
					numericValue=E;
					unit="J";
					break;
				}
			}
			if (options.forceMcq){
				let choices: string[]=[correctAnswer];
				const offsets=[-0.2,0.15,0.3];
				for (let off of offsets){
					let wrong=numericValue+numericValue*off;
					if (unit==="N/m") choices.push(`${wrong.toFixed(0)} ${unit}`);
					else if (unit==="cm") choices.push(`${(wrong*100).toFixed(1)} cm`);
					else if (unit==="J") choices.push(`${wrong.toFixed(1)} J`);
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
					id: `2.8_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `2.8_${Date.now()}_${rng.nextInt(0,1e6)}`,
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