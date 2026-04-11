import type { Question, GenerateOptions } from '../../types.d.js';
import { SeededRandom } from '../../seededRandom.js';
export const topicId="2.6_gravitational_force";
export const topicName="Gravitational Force";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["inverseSquareLaw","weightOnDifferentPlanet","gAtHeight","orbitalSpeedConcept","satellitePeriodConcept"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "inverseSquareLaw":
					text="If the distance between two masses is doubled, the gravitational force becomes:";
					answer="One‑fourth";
					choices=[answer,"Half","Twice","Four times"];
					break;
				case "weightOnDifferentPlanet":{
					const factor=rng.choice([2,3,0.5]);
					const desc=factor===2?"twice the mass of Earth and the same radius":factor===3?"three times the mass and the same radius":"half the mass and the same radius";
					text=`A planet has ${desc}. The acceleration due to gravity on its surface is:`;
					if (factor===2) answer="2g";
					else if (factor===3) answer="3g";
					else answer="g/2";
					choices=[answer,`${factor===2?"g":factor===3?"g/2":"2g"}`, "g", "4g"];
					break;
				}
				case "gAtHeight":{
					const h=rng.choice(["R","2R","3R"]);
					text=`At a distance ${h} from Earth's center (where R is Earth's radius), the value of g is:`;
					if (h==="R") answer="g/4";
					else if (h==="2R") answer="g/9";
					else answer="g/16";
					choices=[answer,"g/2","g/3","g"];
					break;
				}
				default:
					text="A satellite orbits Earth at constant speed. The force that provides the centripetal acceleration is:";
					answer="Gravitational force";
					choices=[answer,"Tension","Friction","Normal force"];
					break;
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `2.6_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			const scenarioList=["forceAtDistance","gAtHeightMath","orbitalSpeed","satellitePeriod","weightOnPlanet"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			const G=6.67e-11;
			const M_earth=5.97e24;
			const R_earth=6.37e6;
			switch(scenario){
				case "forceAtDistance":{
					const m1=rng.nextInt(100,500);
					const m2=rng.nextInt(100,500);
					const r=rng.nextInt(1,5);
					const F=G*m1*m2/(r*r);
					text=`Two masses of ${m1} kg and ${m2} kg are ${r} m apart. Find the gravitational force between them. (G = 6.67×10⁻¹¹ N·m²/kg²)`;
					correctAnswer=F.toExponential(2);
					numericValue=F;
					unit="N";
					break;
				}
				case "gAtHeightMath":{
					const h=rng.nextInt(1,5)*R_earth;
					const g_h=G*M_earth/((R_earth+h)*(R_earth+h));
					text=`Find the acceleration due to gravity at a height of ${h/R_earth} R_earth above Earth's surface. (G = 6.67×10⁻¹¹, M_earth = 5.97×10²⁴ kg, R_earth = 6.37×10⁶ m)`;
					correctAnswer=g_h.toFixed(2);
					numericValue=g_h;
					unit="m/s²";
					break;
				}
				case "orbitalSpeed":{
					const r=rng.nextInt(2,10)*R_earth;
					const v=Math.sqrt(G*M_earth/r);
					text=`Find the orbital speed of a satellite at a distance of ${r/R_earth} R_earth from Earth's center.`;
					correctAnswer=v.toFixed(0);
					numericValue=v;
					unit="m/s";
					break;
				}
				case "satellitePeriod":{
					const r=rng.nextInt(2,10)*R_earth;
					const T=2*Math.PI*Math.sqrt(r*r*r/(G*M_earth));
					text=`Find the orbital period of a satellite at a distance of ${r/R_earth} R_earth from Earth's center.`;
					correctAnswer=T.toFixed(0);
					numericValue=T;
					unit="s";
					break;
				}
				default:{
					const massRatio=rng.choice([2,3,0.5]);
					const g_planet=9.8*massRatio;
					text=`A planet has ${massRatio===2?"twice":massRatio===3?"three times":"half"} the mass of Earth and the same radius. Find the acceleration due to gravity on its surface. (g_Earth = 9.8 m/s²)`;
					correctAnswer=`${g_planet.toFixed(1)} m/s²`;
					numericValue=g_planet;
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
					id: `2.6_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `2.6_${Date.now()}_${rng.nextInt(0,1e6)}`,
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