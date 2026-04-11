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
			const scenarioList=[
				"horizontalLaunchTime","maxRangeAngle","symmetryTopVelocity","compareFlightTimes",
				"horizontalRangeConcept","verticalVelocityAtTop","timeToTop","rangeVsAngle",
				"horizontalComponent","verticalComponent","launchSpeedFromRange","symmetryLandingSpeed"
			];
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
				case "horizontalRangeConcept":
					text="A ball is launched horizontally from a cliff. If the launch speed is doubled, the horizontal range (ignoring air resistance) will:";
					answer="double";
					choices=[answer,"quadruple","remain the same","halve"];
					break;
				case "verticalVelocityAtTop":
					text="At the highest point of a projectile's trajectory, the vertical component of velocity is:";
					answer="zero";
					choices=[answer,"maximum","equal to horizontal component","equal to initial speed"];
					break;
                case "timeToTop":{
                    const v0=rng.nextInt(20,40);
                    const angle=rng.nextInt(30,60);
                    const tTop=v0*Math.sin(angle*Math.PI/180)/9.8;
                    text=`A projectile is launched at ${v0} m/s at ${angle}°. How long does it take to reach the highest point? (g = 9.8 m/s²)`;
                    answer=`${tTop.toFixed(2)} s`;
                    const wrong1=`${(tTop*0.7).toFixed(2)} s`;
                    const wrong2=`${(tTop*1.3).toFixed(2)} s`;
                    const wrong3=`${(tTop*0.5).toFixed(2)} s`;
                    choices=[answer,wrong1,wrong2,wrong3];
                    break;
                }
				case "rangeVsAngle":{
					const a=rng.nextInt(15,25);
					const b=90-a;
					text=`A projectile is launched at ${a}° and again at ${b}° with the same speed. Which has a greater range?`;
					answer="Both have the same range";
					choices=[answer,`${a}°`, `${b}°`, "Depends on speed"];
					break;
				}
				case "horizontalComponent":
					text="For a projectile launched at an angle, which statement about the horizontal velocity is true (ignoring air resistance)?";
					answer="It remains constant";
					choices=[answer,"It increases","It decreases","It is zero at the top"];
					break;
				case "verticalComponent":
					text="For a projectile launched at an angle, the vertical component of velocity at the highest point is:";
					answer="0 m/s";
					choices=[answer,"Maximum","Equal to initial vertical component","Equal to initial speed"];
					break;
				default:{
					const v0=rng.nextInt(15,30);
					const angle=rng.nextInt(25,65);
					text=`A projectile is launched with speed ${v0} m/s at angle ${angle}°. Which launch speed would double the range (same angle)?`;
					answer=`${(v0*Math.sqrt(2)).toFixed(0)} m/s`;
					choices=[answer,`${(v0*2).toFixed(0)} m/s`, `${(v0/2).toFixed(0)} m/s`, `${(v0*1.5).toFixed(0)} m/s`];
					break;
				}
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
			const scenarioList=[
				"horizontalRange","maxHeight","timeOfFlight","finalVelocityComponents",
				"heightFromTime","velocityAtTime","rangeFromHeightAndSpeed","impactSpeed",
				"angleFromRangeAndHeight","timeToTopMath","horizontalDistanceAtTime","verticalPositionAtTime"
			];
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
					text=`A ball is launched horizontally from a height of ${height} m with speed ${v0} m/s. How far does it travel horizontally before hitting the ground? (g = 9.8 m/s²)`;
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
					text=`A projectile is launched at ${v0} m/s at ${angle}° above horizontal. Find the maximum height. (g = 9.8 m/s²)`;
					correctAnswer=`${H.toFixed(1)} m`;
					numericValue=H;
					unit="m";
					break;
				}
				case "timeOfFlight":{
					const v0=rng.nextInt(15,35);
					const angle=rng.nextInt(30,60);
					const T=2*v0*Math.sin(angle*Math.PI/180)/g;
					text=`A projectile is launched from ground level at ${v0} m/s at ${angle}° above horizontal. Find the time of flight. (g = 9.8 m/s²)`;
					correctAnswer=`${T.toFixed(2)} s`;
					numericValue=T;
					unit="s";
					break;
				}
				case "finalVelocityComponents":{
					const v0=rng.nextInt(20,40);
					const angle=rng.nextInt(30,60);
					const vx=v0*Math.cos(angle*Math.PI/180);
					const vyFinal=-v0*Math.sin(angle*Math.PI/180);
					text=`A projectile is launched from the ground at ${v0} m/s at ${angle}° above horizontal. Find the velocity components (v_x, v_y) just before it hits the ground. (g = 9.8 m/s²)`;
					correctAnswer=`${vx.toFixed(1)} m/s, ${vyFinal.toFixed(1)} m/s`;
					numericValue=vx;
					unit=undefined;
					break;
				}
				case "heightFromTime":{
					const t=rng.nextInt(2,5);
					const h=0.5*g*t*t;
					text=`An object is dropped from rest. How far does it fall in ${t} s? (g = 9.8 m/s²)`;
					correctAnswer=`${h.toFixed(1)} m`;
					numericValue=h;
					unit="m";
					break;
				}
				case "velocityAtTime":{
					const v0=rng.nextInt(10,25);
					const angle=rng.nextInt(30,60);
					const t=rng.nextInt(1,3);
					const vx=v0*Math.cos(angle*Math.PI/180);
					const vy=v0*Math.sin(angle*Math.PI/180)-g*t;
					const v=Math.sqrt(vx*vx+vy*vy);
					text=`A projectile is launched at ${v0} m/s at ${angle}°. What is its speed at t = ${t} s? (g = 9.8 m/s²)`;
					correctAnswer=`${v.toFixed(1)} m/s`;
					numericValue=v;
					unit="m/s";
					break;
				}
				case "rangeFromHeightAndSpeed":{
					const h=rng.nextInt(15,40);
					const v0=rng.nextInt(10,25);
					const t=Math.sqrt(2*h/g);
					const R=v0*t;
					text=`A ball is thrown horizontally at ${v0} m/s from a height of ${h} m. Find the horizontal range. (g = 9.8 m/s²)`;
					correctAnswer=`${R.toFixed(1)} m`;
					numericValue=R;
					unit="m";
					break;
				}
				case "impactSpeed":{
					const h=rng.nextInt(20,60);
					const v=Math.sqrt(2*g*h);
					text=`An object is dropped from a height of ${h} m. What is its speed just before impact? (g = 9.8 m/s²)`;
					correctAnswer=`${v.toFixed(1)} m/s`;
					numericValue=v;
					unit="m/s";
					break;
				}
				case "angleFromRangeAndHeight":{
					const R=rng.nextInt(30,80);
					const H=rng.nextInt(5,20);
					const tanTheta=4*H/R;
					const theta=Math.atan(tanTheta)*180/Math.PI;
					text=`A projectile has range ${R} m and maximum height ${H} m. Find the launch angle.`;
					correctAnswer=`${theta.toFixed(0)}°`;
					numericValue=theta;
					unit="°";
					break;
				}
				case "timeToTopMath":{
					const v0=rng.nextInt(15,35);
					const angle=rng.nextInt(30,60);
					const tTop=v0*Math.sin(angle*Math.PI/180)/g;
					text=`A projectile is launched at ${v0} m/s at ${angle}°. How long does it take to reach the highest point? (g = 9.8 m/s²)`;
					correctAnswer=`${tTop.toFixed(2)} s`;
					numericValue=tTop;
					unit="s";
					break;
				}
				default:{
					const v0=rng.nextInt(15,30);
					const angle=rng.nextInt(30,60);
					const t=rng.nextInt(1,3);
					const x=v0*Math.cos(angle*Math.PI/180)*t;
					text=`A projectile is launched at ${v0} m/s at ${angle}°. What is the horizontal distance traveled at t = ${t} s?`;
					correctAnswer=`${x.toFixed(1)} m`;
					numericValue=x;
					unit="m";
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