import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="3.5_power";
export const topicName="Power";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["averagePower","instantaneousPower","powerLifting","powerForceVelocity","powerClimbingStairs"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "averagePower":{
					const W=rng.nextInt(200,1000);
					const t=rng.nextInt(5,20);
					const P=W/t;
					text=`A motor does ${W} J of work in ${t} s. Its average power is:`;
					answer=`${P.toFixed(0)} W`;
					const wrong1=`${(P*0.5).toFixed(0)} W`;
					const wrong2=`${(P*2).toFixed(0)} W`;
					const wrong3=`${(P*1.5).toFixed(0)} W`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "instantaneousPower":{
					const F=rng.nextInt(100,500);
					const v=rng.nextInt(5,25);
					const P=F*v;
					text=`A car moves at constant speed ${v} m/s against a resistive force of ${F} N. The power output of the engine is:`;
					answer=`${(P/1000).toFixed(0)} kW`;
					const wrong1=`${(P/1000*0.5).toFixed(0)} kW`;
					const wrong2=`${(P/1000*2).toFixed(0)} kW`;
					const wrong3=`${(P/1000*1.5).toFixed(0)} kW`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "powerLifting":{
					const m=rng.nextInt(20,100);
					const h=rng.nextInt(1,3);
					const t=rng.nextInt(2,6);
					const P=m*9.8*h/t;
					text=`A motor lifts a ${m} kg crate ${h} m in ${t} s at constant speed. The power output is:`;
					answer=`${P.toFixed(0)} W`;
					const wrong1=`${(P*0.5).toFixed(0)} W`;
					const wrong2=`${(P*2).toFixed(0)} W`;
					const wrong3=`${(P*1.5).toFixed(0)} W`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				default:{
					const m=rng.nextInt(50,100);
					const h=rng.nextInt(3,10);
					const t=rng.nextInt(5,15);
					const P=m*9.8*h/t;
					text=`A student of mass ${m} kg climbs stairs of height ${h} m in ${t} s. The average power output is approximately:`;
					answer=`${P.toFixed(0)} W`;
					const wrong1=`${(P*0.6).toFixed(0)} W`;
					const wrong2=`${(P*1.4).toFixed(0)} W`;
					const wrong3=`${(P*0.8).toFixed(0)} W`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `3.5_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			const scenarioList=["powerFromWorkTime","powerFromForceSpeed","powerLiftingMath","timeFromPowerWork","forceFromPowerSpeed"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			const g=9.8;
			switch(scenario){
				case "powerFromWorkTime":{
					const W=rng.nextInt(200,1000);
					const t=rng.nextInt(5,20);
					const P=W/t;
					text=`A machine does ${W} J of work in ${t} s. Calculate the average power.`;
					correctAnswer=`${P.toFixed(0)} W`;
					numericValue=P;
					unit="W";
					break;
				}
				case "powerFromForceSpeed":{
					const F=rng.nextInt(100,500);
					const v=rng.nextInt(5,25);
					const P=F*v;
					text=`A constant force of ${F} N acts on an object moving at ${v} m/s. Find the instantaneous power.`;
					correctAnswer=`${P.toFixed(0)} W`;
					numericValue=P;
					unit="W";
					break;
				}
				case "powerLiftingMath":{
					const m=rng.nextInt(20,100);
					const h=rng.nextInt(1,4);
					const t=rng.nextInt(2,8);
					const P=m*g*h/t;
					text=`A motor lifts a ${m} kg crate ${h} m in ${t} s at constant speed. Find the power output. (g = 9.8 m/s²)`;
					correctAnswer=`${P.toFixed(0)} W`;
					numericValue=P;
					unit="W";
					break;
				}
				case "timeFromPowerWork":{
					const W=rng.nextInt(500,2000);
					const P=rng.nextInt(100,500);
					const t=W/P;
					text=`A motor with power ${P} W does ${W} J of work. How long does it take?`;
					correctAnswer=`${t.toFixed(1)} s`;
					numericValue=t;
					unit="s";
					break;
				}
				default:{
					const P=rng.nextInt(1000,5000);
					const v=rng.nextInt(10,30);
					const F=P/v;
					text=`An engine delivers ${P/1000} kW of power at a speed of ${v} m/s. Find the force exerted by the engine.`;
					correctAnswer=`${F.toFixed(0)} N`;
					numericValue=F;
					unit="N";
					break;
				}
			}
			if (options.forceMcq){
				let choices: string[]=[correctAnswer];
				const offsets=[-0.2,0.15,0.3];
				for (let off of offsets){
					let wrong=numericValue+numericValue*off;
					if (unit==="W") choices.push(`${wrong.toFixed(0)} W`);
					else if (unit==="s") choices.push(`${wrong.toFixed(1)} s`);
					else if (unit==="N") choices.push(`${wrong.toFixed(0)} N`);
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
					id: `3.5_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `3.5_${Date.now()}_${rng.nextInt(0,1e6)}`,
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