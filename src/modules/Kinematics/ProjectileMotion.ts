import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="1.5_projectile_motion";
export const topicName="Projectile Motion";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["horizontalLaunchTime","maxRangeAngle","symmetryTopVelocity","compareFlightTimes","horizontalRangeConcept"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "horizontalLaunchTime":
					text="Two balls are launched horizontally from the same height. Ball A has speed 10 m/s, ball B has speed 20 m/s. Which hits the ground first?";
					answer="Both at the same time";
					choices=[answer,"Ball A","Ball B","It depends on mass"];
					break;
				case "maxRangeAngle":
					text="For a projectile launched from ground level, which angle gives the maximum range?";
					answer="45°";
					choices=[answer,"30°","60°","90°"];
					break;
				case "symmetryTopVelocity":
					text="A projectile is launched at 50° above horizontal. At the top of its trajectory, its velocity is:";
					answer="purely horizontal";
					choices=[answer,"zero","purely vertical","equal to initial speed"];
					break;
				case "compareFlightTimes":
					text="Two projectiles are launched with the same speed but at angles 30° and 60°. Which has a longer time of flight?";
					answer="60°";
					choices=[answer,"30°","same","depends on mass"];
					break;
				default:
					text="A ball is launched horizontally from a cliff. If the launch speed is doubled, the horizontal range (ignoring air resistance) will:";
					answer="double";
					choices=[answer,"quadruple","remain the same","halve"];
					break;
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `1.5_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			const scenarioList=["horizontalRange","maxHeight","timeOfFlight","finalVelocityComponents"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			const g=9.8;
			switch(scenario){
				case "horizontalRange":{
					const height=rng.nextInt(10,50);
					const v0=rng.nextInt(10,30);
					const t=Math.sqrt(2*height/g);
					const range=v0*t;
					text=`A ball is launched horizontally from a height of ${height} m with speed ${v0} m/s. How far does it travel horizontally before hitting the ground? (Use g = 9.8 m/s²)`;
					correctAnswer=`${range.toFixed(1)} m`;
					numericValue=range;
					unit="m";
					break;
				}
				case "maxHeight":{
					const v0=rng.nextInt(15,40);
					const angle=rng.nextInt(25,65);
					const vy=v0*Math.sin(angle*Math.PI/180);
					const H=(vy*vy)/(2*g);
					text=`A projectile is launched at ${v0} m/s at ${angle}° above horizontal. Find the maximum height. (Use g = 9.8 m/s²)`;
					correctAnswer=`${H.toFixed(1)} m`;
					numericValue=H;
					unit="m";
					break;
				}
				case "timeOfFlight":{
					const v0=rng.nextInt(15,35);
					const angle=rng.nextInt(30,60);
					const T=2*v0*Math.sin(angle*Math.PI/180)/g;
					text=`A projectile is launched from ground level at ${v0} m/s at ${angle}° above horizontal. Find the time of flight. (Use g = 9.8 m/s²)`;
					correctAnswer=`${T.toFixed(2)} s`;
					numericValue=T;
					unit="s";
					break;
				}
				default:{
					const v0=rng.nextInt(20,40);
					const angle=rng.nextInt(30,60);
					const vx=v0*Math.cos(angle*Math.PI/180);
					const vyFinal=-v0*Math.sin(angle*Math.PI/180);
					text=`A projectile is launched from the ground at ${v0} m/s at ${angle}° above horizontal. Find the velocity components (v_x, v_y) just before it hits the ground. (Use g = 9.8 m/s²)`;
					correctAnswer=`${vx.toFixed(1)} m/s, ${vyFinal.toFixed(1)} m/s`;
					numericValue=vx;
					unit=undefined;
					break;
				}
			}
			if (options.forceMcq){
				let choices: string[]=[correctAnswer];
				if (scenario==="finalVelocityComponents"){
					const [vxStr,vyStr]=correctAnswer.split(", ");
					const vxNum=parseFloat(vxStr);
					const vyNum=parseFloat(vyStr);
					const wrong1=`${(vxNum*0.8).toFixed(1)} m/s, ${vyNum.toFixed(1)} m/s`;
					const wrong2=`${vxNum.toFixed(1)} m/s, ${(vyNum*1.2).toFixed(1)} m/s`;
					const wrong3=`${(vxNum*1.1).toFixed(1)} m/s, ${(vyNum*0.9).toFixed(1)} m/s`;
					choices=[correctAnswer,wrong1,wrong2,wrong3];
				}
				else{
					const offsets=[-0.2,0.15,0.3];
					for (let off of offsets){
						let wrong=numericValue+numericValue*off;
						if (unit) choices.push(`${wrong.toFixed(1)} ${unit}`);
						else choices.push(wrong.toFixed(1));
					}
				}
				choices=[...new Set(choices)];
				while(choices.length<4) choices.push("0");
				if (!choices.includes(correctAnswer)) choices[0]=correctAnswer;
				for(let i=choices.length-1;i>0;i--){
					const j=rng.nextInt(0,i);
					[choices[i],choices[j]]=[choices[j],choices[i]];
				}
				return{
					id: `1.5_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `1.5_${Date.now()}_${rng.nextInt(0,1e6)}`,
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