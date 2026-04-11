import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="3.3_potential_energy";
export const topicName="Potential Energy";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["gravitationalPE","springPE","zeroPointChoice","peGravitySign","peSpringSign"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "gravitationalPE":{
					const m=rng.nextInt(1,5);
					const h=rng.nextInt(1,3);
					const deltaU=m*9.8*h;
					text=`A ${m} kg book is lifted from the floor to a shelf ${h}.0 m high. The change in gravitational potential energy is:`;
					answer=`${deltaU.toFixed(1)} J`;
					const wrong1=`${(deltaU*0.5).toFixed(1)} J`;
					const wrong2=`${(deltaU*2).toFixed(1)} J`;
					const wrong3=`${(deltaU*0.8).toFixed(1)} J`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "springPE":{
					const k=rng.nextInt(50,150);
					const x=rng.nextInt(10,30)/100;
					const U=0.5*k*x*x;
					text=`A spring with k = ${k} N/m is compressed ${(x*100).toFixed(0)} cm. The spring potential energy is:`;
					answer=`${U.toFixed(1)} J`;
					const wrong1=`${(U*0.5).toFixed(1)} J`;
					const wrong2=`${(U*2).toFixed(1)} J`;
					const wrong3=`${(U*1.5).toFixed(1)} J`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "zeroPointChoice":
					text="The gravitational potential energy of a system can be:";
					answer="Positive, negative, or zero depending on reference point";
					choices=[answer,"Always positive","Always negative","Always zero"];
					break;
				case "peGravitySign":{
					const m=rng.nextInt(1,5);
					const h1=rng.nextInt(1,3);
					const h2=rng.nextInt(4,7);
					text=`A ${m} kg object is raised from height ${h1} m to ${h2} m above ground (ground is zero reference). The change in gravitational PE is:`;
					answer="Positive";
					choices=[answer,"Negative","Zero","Depends on mass"];
					break;
				}
                default:{
                    const k=rng.nextInt(50,150);
                    const x=rng.nextInt(5,20)/100;
                    text=`A spring with spring constant ${k} N/m is compressed by ${(x*100).toFixed(0)} cm. If the spring is compressed further, the potential energy:`;
                    answer="Increases";
                    choices=[answer,"Decreases","Stays the same","Becomes zero"];
                    break;
                }
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `3.3_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			const scenarioList=["gravitationalPEChange","springPEStored","heightFromPE","springConstantFromPE","peRatio"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			const g=9.8;
			switch(scenario){
				case "gravitationalPEChange":{
					const m=rng.nextInt(1,5);
					const h=rng.nextInt(1,4);
					const deltaU=m*g*h;
					text=`A ${m} kg object is raised by ${h} m. Find the change in gravitational potential energy. (g = 9.8 m/s²)`;
					correctAnswer=`${deltaU.toFixed(1)} J`;
					numericValue=deltaU;
					unit="J";
					break;
				}
				case "springPEStored":{
					const k=rng.nextInt(50,200);
					const x=rng.nextInt(5,15)/100;
					const U=0.5*k*x*x;
					text=`A spring with k = ${k} N/m is stretched ${(x*100).toFixed(0)} cm. Find the elastic potential energy.`;
					correctAnswer=`${U.toFixed(1)} J`;
					numericValue=U;
					unit="J";
					break;
				}
				case "heightFromPE":{
					const m=rng.nextInt(1,5);
					const U=rng.nextInt(20,50);
					const h=U/(m*g);
					text=`A ${m} kg object has gravitational potential energy ${U} J relative to the ground. Find its height. (g = 9.8 m/s²)`;
					correctAnswer=`${h.toFixed(2)} m`;
					numericValue=h;
					unit="m";
					break;
				}
				case "springConstantFromPE":{
					const x=rng.nextInt(5,15)/100;
					const U=rng.nextInt(2,10);
					const k=2*U/(x*x);
					text=`A spring stores ${U} J of energy when compressed ${(x*100).toFixed(0)} cm. Find the spring constant.`;
					correctAnswer=`${k.toFixed(0)} N/m`;
					numericValue=k;
					unit="N/m";
					break;
				}
				default:{
					const m1=rng.nextInt(1,5);
					const h1=rng.nextInt(2,6);
					const m2=rng.nextInt(1,5);
					const h2=rng.nextInt(2,6);
					const U1=m1*g*h1;
					const U2=m2*g*h2;
					const ratio=U1/U2;
					text=`Object A: ${m1} kg at height ${h1} m. Object B: ${m2} kg at height ${h2} m. Find the ratio PE_A / PE_B.`;
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
					else if (unit==="m") choices.push(`${wrong.toFixed(2)} m`);
					else if (unit==="N/m") choices.push(`${wrong.toFixed(0)} N/m`);
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
					id: `3.3_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `3.3_${Date.now()}_${rng.nextInt(0,1e6)}`,
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