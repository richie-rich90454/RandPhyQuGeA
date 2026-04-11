import type { Question, GenerateOptions } from '../../types.d.js';
import { SeededRandom } from '../../seededRandom.js';
export const topicId="2.3_newton_third_law";
export const topicName="Newton's Third Law";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["actionReactionPair","collisionForcesEqual","bookOnTablePair","personPushingWall","rocketThrust","swimming"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "actionReactionPair":
					text="A book rests on a table. The force of gravity on the book and the normal force from the table are:";
					answer="Not an action‑reaction pair";
					choices=[answer,"An action‑reaction pair","Equal only if the book is at rest","Both A and C"];
					break;
				case "collisionForcesEqual":
					text="A car collides with a truck. Which experiences the greater force during the collision?";
					answer="Both the same";
					choices=[answer,"Car","Truck","Depends on speeds"];
					break;
				case "bookOnTablePair":
					text="The reaction force to the weight of a book is:";
					answer="The gravitational force of the book on Earth";
					choices=[answer,"The normal force from the table","The force of the table on the book","The weight of the table"];
					break;
				case "personPushingWall":
					text="A person pushes against a wall. The reaction force to the push is:";
					answer="The wall pushes back on the person";
					choices=[answer,"The person moves backward","Friction on the person's feet","The wall moves forward"];
					break;
				case "rocketThrust":
					text="A rocket accelerates upward because:";
					answer="The exhaust gases push down on the rocket";
					choices=[answer,"The rocket pushes down on the gases","Gravity is cancelled","Air pushes the rocket"];
					break;
				default:
					text="A swimmer pushes water backward. The forward force on the swimmer comes from:";
					answer="The water pushing forward on the swimmer";
					choices=[answer,"The swimmer's muscles","Gravity","Buoyancy"];
					break;
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `2.3_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			const scenarioList=["forceRatioCollision","reactionForceMagnitude","impulseComparison"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			switch(scenario){
				case "forceRatioCollision":{
					const m1=rng.nextInt(1,5);
					const m2=rng.nextInt(1,5);
					const F1=rng.nextInt(100,500);
					const F2=F1;
					text=`A ${m1} kg car collides with a ${m2} kg truck. The force on the car is measured to be ${F1} N. What is the force on the truck?`;
					correctAnswer=`${F2} N`;
					numericValue=F2;
					unit="N";
					break;
				}
				case "reactionForceMagnitude":{
					const m=rng.nextInt(2,10);
					const F_gravity=m*9.8;
					text=`A ${m} kg book rests on a table. What is the magnitude of the reaction force to the book's weight?`;
					correctAnswer=`${F_gravity.toFixed(1)} N`;
					numericValue=F_gravity;
					unit="N";
					break;
				}
				default:{
					const m1=rng.nextInt(1,4);
					const m2=rng.nextInt(1,4);
					const v1=rng.nextInt(5,15);
					const v2=rng.nextInt(5,15);
					const p1=m1*v1;
					const p2=m2*v2;
					text=`A ${m1} kg object moving at ${v1} m/s collides with a ${m2} kg object moving at ${v2} m/s. The magnitude of the force on the first object during the collision is equal to:`;
					correctAnswer=`The force on the second object (Newton's third law)`;
					numericValue=1;
					unit="";
					break;
				}
			}
			if (options.forceMcq){
				let choices: string[]=[correctAnswer];
				if (scenario!=="impulseComparison"){
					const offsets=[-0.2,0.15,0.3];
					for (let off of offsets){
						let wrong=numericValue+numericValue*off;
						if (unit) choices.push(`${wrong.toFixed(1)} ${unit}`);
						else choices.push(wrong.toFixed(1));
					}
				}
				else{
					choices=[correctAnswer,"The force on the first object is larger","The force on the second object is larger","Forces are unrelated"];
				}
				choices=[...new Set(choices)];
				while(choices.length<4) choices.push("0");
				if (!choices.includes(correctAnswer)) choices[0]=correctAnswer;
				for(let i=choices.length-1;i>0;i--){
					const j=rng.nextInt(0,i);
					[choices[i],choices[j]]=[choices[j],choices[i]];
				}
				return{
					id: `2.3_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `2.3_${Date.now()}_${rng.nextInt(0,1e6)}`,
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