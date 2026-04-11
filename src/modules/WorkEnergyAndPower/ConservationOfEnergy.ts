import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="3.4_conservation_of_energy";
export const topicName="Conservation of Energy";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["pendulumKEatBottom","springKEMax","rollerCoasterFriction","loopMinHeight","energyBarCharts"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "pendulumKEatBottom":
					text="A pendulum bob swings from its highest point to its lowest point. At the lowest point, its kinetic energy is:";
					answer="Maximum and equal to the potential energy at the highest point (if no friction)";
					choices=[answer,"Zero","Equal to half the initial PE","Equal to twice the initial PE"];
					break;
				case "springKEMax":
					text="A mass on a spring oscillates horizontally. At the equilibrium position, the kinetic energy is:";
					answer="Maximum and equal to the total energy";
					choices=[answer,"Zero","Half the total energy","Equal to the spring PE"];
					break;
				case "rollerCoasterFriction":
					text="A roller coaster car starts from rest at height H. If friction is present, the speed at the bottom is:";
					answer="Less than √(2gH)";
					choices=[answer,"Greater than √(2gH)","Equal to √(2gH)","Zero"];
					break;
				case "loopMinHeight":{
					const R=rng.nextInt(3,8);
					const h_min=2.5*R;
					text=`For a cart to complete a vertical loop of radius ${R} m (starting from rest), the minimum release height is:`;
					answer=`${h_min.toFixed(1)} m`;
					const wrong1=`${(h_min*0.8).toFixed(1)} m`;
					const wrong2=`${(h_min*1.2).toFixed(1)} m`;
					const wrong3=`${(h_min*0.5).toFixed(1)} m`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				default:{
					const h=rng.nextInt(2,8);
					const v=Math.sqrt(2*9.8*h);
					text=`A block slides from rest down a frictionless incline of height ${h} m. Its speed at the bottom is:`;
					answer=`${v.toFixed(1)} m/s`;
					const wrong1=`${(v*0.7).toFixed(1)} m/s`;
					const wrong2=`${(v*1.3).toFixed(1)} m/s`;
					const wrong3=`${Math.sqrt(9.8*h).toFixed(1)} m/s`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `3.4_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			const scenarioList=["speedFromHeight","springCompressionFromSpeed","maxHeightFromSpeed","workFrictionFromEnergyLoss","loopReleaseHeight"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			const g=9.8;
			switch(scenario){
				case "speedFromHeight":{
					const h=rng.nextInt(2,10);
					const v=Math.sqrt(2*g*h);
					text=`A block slides from rest down a frictionless incline of height ${h} m. Find its speed at the bottom. (g = 9.8 m/s²)`;
					correctAnswer=`${v.toFixed(2)} m/s`;
					numericValue=v;
					unit="m/s";
					break;
				}
				case "springCompressionFromSpeed":{
					const m=rng.nextInt(1,4);
					const v=rng.nextInt(3,8);
					const k=rng.nextInt(100,300);
					const x=v*Math.sqrt(m/k);
					text=`A ${m} kg block moving at ${v} m/s compresses a spring (k = ${k} N/m) on a frictionless surface. Find the maximum compression.`;
					correctAnswer=`${x.toFixed(3)} m`;
					numericValue=x;
					unit="m";
					break;
				}
				case "maxHeightFromSpeed":{
					const v0=rng.nextInt(5,15);
					const h=v0*v0/(2*g);
					text=`A projectile is launched vertically upward with initial speed ${v0} m/s. Find the maximum height (ignore air resistance). (g = 9.8 m/s²)`;
					correctAnswer=`${h.toFixed(2)} m`;
					numericValue=h;
					unit="m";
					break;
				}
				case "workFrictionFromEnergyLoss":{
					const m=rng.nextInt(1,5);
					const h=rng.nextInt(2,6);
					const v=rng.nextInt(3,7);
					const W_f=m*g*h-0.5*m*v*v;
					text=`A ${m} kg block slides down a rough incline of height ${h} m, reaching the bottom with speed ${v} m/s. Find the work done by friction. (g = 9.8 m/s²)`;
					correctAnswer=`${W_f.toFixed(1)} J`;
					numericValue=Math.abs(W_f);
					unit="J";
					break;
				}
				default:{
					const R=rng.nextInt(3,8);
					const h_min=2.5*R;
					text=`A cart starts from rest at height h to complete a vertical loop of radius ${R} m. Find the minimum release height needed. (Assume no friction)`;
					correctAnswer=`${h_min.toFixed(1)} m`;
					numericValue=h_min;
					unit="m";
					break;
				}
			}
			if (options.forceMcq){
				let choices: string[]=[correctAnswer];
				const offsets=[-0.2,0.15,0.3];
				for (let off of offsets){
					let wrong=numericValue+numericValue*off;
					if (unit==="m/s") choices.push(`${wrong.toFixed(2)} m/s`);
					else if (unit==="m") choices.push(`${wrong.toFixed(2)} m`);
					else if (unit==="J") choices.push(`${wrong.toFixed(1)} J`);
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
					id: `3.4_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `3.4_${Date.now()}_${rng.nextInt(0,1e6)}`,
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