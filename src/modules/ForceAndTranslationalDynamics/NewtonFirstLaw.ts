import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="2.4_newton_first_law";
export const topicName="Newton's First Law";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["constantVelocityNetForce","objectAtRestNetForce","seatbeltInertia","bookOnCarDash","magicCarpet"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "constantVelocityNetForce":
					text="An object moves with constant velocity. The net force on the object is:";
					answer="Zero";
					choices=[answer,"In the direction of motion","Opposite the direction of motion","Cannot be determined"];
					break;
				case "objectAtRestNetForce":
					text="A book rests on a table. The net force on the book is:";
					answer="Zero";
					choices=[answer,"Downward","Upward","Depends on the table"];
					break;
				case "seatbeltInertia":
					text="During a sudden stop, a passenger without a seatbelt continues moving forward because:";
					answer="Inertia";
					choices=[answer,"The seat pushes them","Air resistance","Gravity"];
					break;
				case "bookOnCarDash":
					text="A book is on the dashboard of a car that suddenly accelerates forward. The book falls backward because:";
					answer="The book tends to stay at rest";
					choices=[answer,"Friction is too low","Gravity pulls it back","Air pushes it"];
					break;
				default:
					text="A person on a moving bus lurches forward when the bus stops. This is an example of:";
					answer="Newton's first law";
					choices=[answer,"Newton's second law","Newton's third law","Conservation of momentum"];
					break;
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `2.4_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			const scenarioList=["netForceZeroMath","inertiaMassComparison"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			switch(scenario){
				case "netForceZeroMath":{
					const m=rng.nextInt(2,8);
					const a=0;
					const Fnet=m*a;
					text=`A ${m} kg object moves at constant velocity. What is the net force acting on it?`;
					correctAnswer=`${Fnet} N`;
					numericValue=Fnet;
					unit="N";
					break;
				}
                default:{
                    const m1=rng.nextInt(2,6);
                    const m2=rng.nextInt(2,6);
                    const ratio=m1/m2;
                    text=`Object A has mass ${m1} kg, object B has mass ${m2} kg (mass ratio A/B = ${ratio.toFixed(2)}). Both are moving at constant velocity. Which requires a greater net force to stop in the same time?`;
                    correctAnswer=`Object ${m1>m2?"A":"B"} (greater mass)`;
                    numericValue=Math.max(m1,m2);
                    unit="kg";
                    break;
                }
			}
			if (options.forceMcq){
				let choices: string[]=[correctAnswer];
				if (scenario==="netForceZeroMath"){
					const offsets=[-0.2,0.15,0.3];
					for (let off of offsets){
						let wrong=numericValue+numericValue*off;
						if (unit) choices.push(`${wrong.toFixed(1)} ${unit}`);
						else choices.push(wrong.toFixed(1));
					}
				}
				else{
					choices=[correctAnswer,"Both require the same net force","Neither requires any net force","Depends on velocity"];
				}
				choices=[...new Set(choices)];
				while(choices.length<4) choices.push("0");
				if (!choices.includes(correctAnswer)) choices[0]=correctAnswer;
				for(let i=choices.length-1;i>0;i--){
					const j=rng.nextInt(0,i);
					[choices[i],choices[j]]=[choices[j],choices[i]];
				}
				return{
					id: `2.4_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `2.4_${Date.now()}_${rng.nextInt(0,1e6)}`,
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