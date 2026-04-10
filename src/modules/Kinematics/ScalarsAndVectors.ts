import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="1.1_scalars_vectors_1d";
export const topicName="Scalars and Vectors (1D)";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["distanceSame","distanceOpposite","signVelocity","scalarVector","addVectors","subtractVectors","motionDiagram"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			let unit:string|undefined=undefined;
			switch(scenario){
				case "distanceSame":{
					const a=rng.nextInt(10,100);
					const b=rng.nextInt(5,50);
					const distance=a+b;
					const displacement=a+b;
					text=`An object moves ${a} m to the right, then ${b} m to the right. What is the distance traveled and the displacement?`;
					answer=`Distance = ${distance} m, Displacement = ${displacement} m to the right`;
					const wrong1=`Distance = ${distance} m, Displacement = ${Math.abs(a-b)} m to the right`;
					const wrong2=`Distance = ${Math.abs(a-b)} m, Displacement = ${displacement} m to the right`;
					const wrong3=`Distance = ${distance} m, Displacement = 0 m`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "distanceOpposite":{
					const a=rng.nextInt(10,100);
					const b=rng.nextInt(5,a-1);
					const distance=a+b;
					const displacement=a-b;
					text=`An object moves ${a} m to the right, then ${b} m to the left. What is the distance traveled and the displacement?`;
					answer=`Distance = ${distance} m, Displacement = ${displacement} m to the right`;
					const wrong1=`Distance = ${distance} m, Displacement = ${a+b} m to the right`;
					const wrong2=`Distance = ${Math.abs(displacement)} m, Displacement = ${displacement} m to the right`;
					const wrong3=`Distance = ${distance} m, Displacement = 0 m`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "signVelocity":{
					const type=rng.nextInt(1,3);
					switch(type){
						case 1:
							text="An object moves to the right while slowing down. What are the signs of velocity and acceleration?";
							answer="Velocity positive, acceleration negative";
							choices=[answer,"Velocity positive, acceleration positive","Velocity negative, acceleration negative","Velocity negative, acceleration positive"];
							break;
						case 2:
							text="An object moves to the left while speeding up. What are the signs of velocity and acceleration?";
							answer="Velocity negative, acceleration negative";
							choices=[answer,"Velocity negative, acceleration positive","Velocity positive, acceleration positive","Velocity positive, acceleration negative"];
							break;
						default:
							text="An object moves to the right with constant velocity. What are the signs of velocity and acceleration?";
							answer="Velocity positive, acceleration zero";
							choices=[answer,"Velocity positive, acceleration positive","Velocity positive, acceleration negative","Velocity zero, acceleration zero"];
							break;
					}
					break;
				}
				case "scalarVector":{
					const type=rng.nextInt(1,2);
					switch(type){
						case 1:
							text="Which of the following is a vector quantity?";
							answer="Displacement";
							choices=[answer,"Distance","Speed","Mass"];
							break;
						default:
							text="Which of the following is a scalar quantity?";
							answer="Distance";
							choices=[answer,"Displacement","Velocity","Acceleration"];
							break;
					}
					break;
				}
				case "addVectors":{
					const a=rng.nextFloat()*100-50;
					const b=rng.nextFloat()*100-50;
					const res=a+b;
					const dir=res>=0?"right":"left";
					answer=`${Math.abs(res).toFixed(1)} m ${dir}`;
					text=`Vector A has magnitude ${Math.abs(a).toFixed(1)} m ${a>=0?"right":"left"}. Vector B has magnitude ${Math.abs(b).toFixed(1)} m ${b>=0?"right":"left"}. What is the magnitude and direction of A + B?`;
					const wrongDir=res>=0?"left":"right";
					const wrong1=`${Math.abs(res).toFixed(1)} m ${wrongDir}`;
					const wrong2=`${Math.abs(a-b).toFixed(1)} m ${a-b>=0?"right":"left"}`;
					const wrong3=`${Math.abs(b-a).toFixed(1)} m ${b-a>=0?"right":"left"}`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "subtractVectors":{
					const a=rng.nextFloat()*100-50;
					const b=rng.nextFloat()*100-50;
					const diff=a-b;
					const dir=diff>=0?"right":"left";
					answer=`${Math.abs(diff).toFixed(1)} m ${dir}`;
					text=`Vector A has magnitude ${Math.abs(a).toFixed(1)} m ${a>=0?"right":"left"}. Vector B has magnitude ${Math.abs(b).toFixed(1)} m ${b>=0?"right":"left"}. What is the magnitude and direction of A - B?`;
					const wrongDir=diff>=0?"left":"right";
					const wrong1=`${Math.abs(diff).toFixed(1)} m ${wrongDir}`;
					const wrong2=`${Math.abs(a+b).toFixed(1)} m ${a+b>=0?"right":"left"}`;
					const wrong3=`${Math.abs(b-a).toFixed(1)} m ${b-a>=0?"right":"left"}`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				default:{
					const type=rng.nextInt(1,3);
					switch(type){
						case 1:
							text="A motion diagram shows equally spaced dots with velocity vectors that are all the same length and point to the right. What type of motion does this represent?";
							answer="Constant velocity to the right";
							choices=[answer,"Speeding up to the right","Slowing down to the right","Constant velocity to the left"];
							break;
						case 2:
							text="A motion diagram shows dots getting farther apart, with velocity vectors increasing in length and pointing to the right. What type of motion does this represent?";
							answer="Speeding up to the right";
							choices=[answer,"Constant velocity to the right","Slowing down to the right","Speeding up to the left"];
							break;
						default:
							text="A motion diagram shows dots getting closer together, with velocity vectors decreasing in length and pointing to the right. What type of motion does this represent?";
							answer="Slowing down to the right";
							choices=[answer,"Constant velocity to the right","Speeding up to the right","Slowing down to the left"];
							break;
					}
					break;
				}
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return {
				id: `1.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
				topicId: topicId,
				topicName: topicName,
				text: text,
				answer: answer,
				answerType: "string",
				unit: unit,
				choices: choices,
				difficulty: options.difficulty,
				questionType: "MC"
			};
		}
		default:{
			const scenarioList=["successiveDisplacements","avgVelocity","avgSpeedVsVelocity","algebraicSum"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			switch(scenario){
				case "successiveDisplacements":{
					const d1=rng.nextFloat()*100-50;
					const d2=rng.nextFloat()*100-50;
					const total=d1+d2;
					text=`An object undergoes a displacement of ${d1.toFixed(1)} m, followed by a displacement of ${d2.toFixed(1)} m. What is the total displacement?`;
					correctAnswer=`${total.toFixed(1)} m`;
					numericValue=total;
					unit="m";
					break;
				}
				case "avgVelocity":{
					const x1=rng.nextFloat()*200-100;
					const t1=rng.nextFloat()*5;
					const x2=rng.nextFloat()*200-100;
					const t2=rng.nextFloat()*10+t1+1;
					const v=(x2-x1)/(t2-t1);
					text=`At time t = ${t1.toFixed(1)} s, an object is at position x = ${x1.toFixed(1)} m. At time t = ${t2.toFixed(1)} s, it is at x = ${x2.toFixed(1)} m. Calculate the average velocity.`;
					correctAnswer=`${v.toFixed(2)} m/s`;
					numericValue=v;
					unit="m/s";
					break;
				}
				case "avgSpeedVsVelocity":{
					const d=rng.nextFloat()*80+20;
					const v1=rng.nextFloat()*8+2;
					const v2=rng.nextFloat()*8+2;
					const t1=d/v1;
					const t2=d/v2;
					const speed=(2*d)/(t1+t2);
					text=`A car travels ${d.toFixed(1)} km east at ${v1.toFixed(1)} km/h, then returns west at ${v2.toFixed(1)} km/h. Calculate (a) average speed and (b) average velocity.`;
					correctAnswer=`Average speed = ${speed.toFixed(2)} km/h, Average velocity = 0 km/h`;
					numericValue=0;
					unit=undefined;
					break;
				}
				default:{
					const a=rng.nextFloat()*60-30;
					const b=rng.nextFloat()*60-30;
					const sum=a+b;
					text=`Vector A has value ${a.toFixed(1)} (positive = right, negative = left). Vector B has value ${b.toFixed(1)}. What is the algebraic sum A + B (include sign and unit)?`;
					correctAnswer=`${sum.toFixed(1)} m`;
					numericValue=sum;
					unit="m";
					break;
				}
			}
			if (options.forceMcq){
				let choices: string[]=[correctAnswer];
				const offsets=[-0.2,0.15,0.3].map(f=>numericValue*f);
				for (let off of offsets){
					let wrong=numericValue+off;
					if (unit) choices.push(`${wrong.toFixed(1)} ${unit}`);
					else choices.push(wrong.toFixed(1));
				}
				while(choices.length<4) choices.push("0");
				choices=[...new Set(choices)];
				if (!choices.includes(correctAnswer)) choices[0]=correctAnswer;
				for(let i=choices.length-1;i>0;i--){
					const j=rng.nextInt(0,i);
					[choices[i],choices[j]]=[choices[j],choices[i]];
				}
				return {
					id: `1.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
				return {
					id: `1.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
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