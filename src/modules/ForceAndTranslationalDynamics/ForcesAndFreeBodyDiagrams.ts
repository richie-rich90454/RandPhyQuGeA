import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="2.2_forces_free_body_diagrams";
export const topicName="Forces and Free‑Body Diagrams";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=[
				"forcesOnRest","acceleratingCarForce","newtonThirdPair","boxOnIncline",
				"hangingMassTension","pulleySystem","normalForceIncline","frictionDirection",
				"netForceZero","actionReaction","elevatorNormal","tensionTwoRopes",
				"inclinedPlaneComponents","springForceDirection","airResistanceDirection",
				"centripetalForceDirection","frictionStaticVsKinetic","normalForceOnCurve"
			];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "forcesOnRest":
					text="A book rests on a table. Which forces act on the book?";
					answer="Weight and normal force";
					choices=[answer,"Weight only","Normal force only","Neither"];
					break;
				case "acceleratingCarForce":
					text="A car accelerates forward on a horizontal road. The forward force on the car is provided by:";
					answer="Friction from the road on the tires";
					choices=[answer,"The engine","The air","The car's weight"];
					break;
				case "newtonThirdPair":
					text="A person pulls a sled forward. The reaction force to the force of the person on the sled is:";
					answer="Force of the sled on the person";
					choices=[answer,"Friction on the sled","Weight of the sled","Normal force on the sled"];
					break;
				case "boxOnIncline":
					text="A box slides down a rough incline at constant speed. The direction of the kinetic friction force is:";
					answer="Up the incline";
					choices=[answer,"Down the incline","Perpendicular to the incline","Horizontal"];
					break;
				case "hangingMassTension":{
					const m=rng.nextInt(1,5);
					text=`A ${m} kg mass hangs at rest from a vertical string. The tension in the string is:`;
					answer=`${(m*9.8).toFixed(0)} N`;
					const wrong1=`${(m*9.8*0.5).toFixed(0)} N`;
					const wrong2=`${(m*9.8*2).toFixed(0)} N`;
					const wrong3="0 N";
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "pulleySystem":
					text="Two blocks are connected by a string over a frictionless pulley. Block A hangs vertically, block B sits on a horizontal frictionless table. The tension in the string is:";
					answer="Less than the weight of block A";
					choices=[answer,"Greater than the weight of block A","Equal to the weight of block A","Zero"];
					break;
				case "normalForceIncline":{
					const angle=rng.nextInt(10,50);
					const m=rng.nextInt(2,8);
					const N=m*9.8*Math.cos(angle*Math.PI/180);
					text=`A ${m} kg block rests on a frictionless incline at ${angle}°. The normal force is:`;
					answer=`${N.toFixed(0)} N`;
					const wrong1=`${(m*9.8).toFixed(0)} N`;
					const wrong2=`${(m*9.8*Math.sin(angle*Math.PI/180)).toFixed(0)} N`;
					const wrong3="0 N";
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "frictionDirection":
					text="A box is pushed to the right across a rough floor at constant speed. The direction of the kinetic friction force on the box is:";
					answer="To the left";
					choices=[answer,"To the right","Upward","Downward"];
					break;
				case "netForceZero":
					text="An object moves at constant velocity. Which statement is true?";
					answer="The net force on the object is zero";
					choices=[answer,"The net force is non‑zero","All forces are zero","There is no gravity"];
					break;
				case "actionReaction":
					text="A book pushes down on a table. The reaction force to this force is:";
					answer="The table pushes up on the book";
					choices=[answer,"The book's weight","The table's weight","Friction from the table"];
					break;
				case "elevatorNormal":{
					const dir=rng.choice(["upward","downward"]);
					if (dir==="upward"){
						text="An elevator accelerates upward. Compared to the person's weight, the normal force from the floor is:";
						answer="Greater";
						choices=[answer,"Less","Equal","Zero"];
					}
					else{
						text="An elevator accelerates downward. Compared to the person's weight, the normal force from the floor is:";
						answer="Less";
						choices=[answer,"Greater","Equal","Zero"];
					}
					break;
				}
				case "tensionTwoRopes":{
					const angle=rng.nextInt(20,70);
					text=`A sign hangs from two ropes at equal angles of ${angle}° from the vertical. Compared to the weight, the tension in each rope is:`;
					answer="Greater than half the weight";
					choices=[answer,"Less than half the weight","Equal to half the weight","Equal to the weight"];
					break;
				}
				case "inclinedPlaneComponents":
					text="On an inclined plane, the component of weight parallel to the incline is:";
					answer="mg sinθ";
					choices=[answer,"mg cosθ","mg tanθ","mg"];
					break;
				case "springForceDirection":
					text="A spring is stretched to the right. The force exerted by the spring on the object attached to it is directed:";
					answer="To the left";
					choices=[answer,"To the right","Upward","Downward"];
					break;
				case "airResistanceDirection":
					text="A ball is thrown upward. As it rises, the direction of air resistance is:";
					answer="Downward";
					choices=[answer,"Upward","Zero","Horizontal"];
					break;
				case "centripetalForceDirection":
					text="A car moves at constant speed around a circular track. The net force on the car is directed:";
					answer="Toward the center of the circle";
					choices=[answer,"Forward","Backward","Away from the center"];
					break;
				case "frictionStaticVsKinetic":
					text="Which is generally true about the maximum static friction force compared to kinetic friction?";
					answer="Maximum static friction is greater";
					choices=[answer,"Kinetic friction is greater","They are equal","Depends on speed"];
					break;
				default:{
					const angle=rng.nextInt(10,60);
					text=`A car rounds a banked curve at the design speed. The horizontal component of the normal force provides the centripetal force. The bank angle is ${angle}°. The normal force is:`;
					answer="Greater than mg/cosθ";
					choices=[answer,"Equal to mg","Less than mg","Zero"];
					break;
				}
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `2.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
				"netForceFromFBD","tensionInString","normalForceOnIncline","frictionForceMagnitude",
				"accelerationFromForces","weightAndNormal","springForce","resultantForce2D",
				"tensionTwoRopesMath","inclineAcceleration","elevatorApparentWeight","pulleyAcceleration"
			];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			const g=9.8;
			switch(scenario){
				case "netForceFromFBD":{
					const F1=rng.nextInt(10,30);
					const F2=rng.nextInt(5,15);
					const net=F1-F2;
					text=`A 5 kg box has a ${F1} N force to the right and a ${F2} N force to the left. What is the net force?`;
					correctAnswer=`${net.toFixed(0)} N to the right`;
					numericValue=net;
					unit="N";
					break;
				}
				case "tensionInString":{
					const m=rng.nextInt(1,5);
					const T=m*g;
					text=`A ${m} kg mass hangs at rest from a vertical string. Find the tension in the string. (g = 9.8 m/s²)`;
					correctAnswer=`${T.toFixed(1)} N`;
					numericValue=T;
					unit="N";
					break;
				}
				case "normalForceOnIncline":{
					const m=rng.nextInt(2,8);
					const angle=rng.nextInt(10,60);
					const N=m*g*Math.cos(angle*Math.PI/180);
					text=`A ${m} kg block rests on a frictionless incline at ${angle}°. Calculate the normal force. (g = 9.8 m/s²)`;
					correctAnswer=`${N.toFixed(1)} N`;
					numericValue=N;
					unit="N";
					break;
				}
				case "frictionForceMagnitude":{
					const m=rng.nextInt(2,10);
					const mu=rng.nextInt(2,6)/10;
					const Ff=mu*m*g;
					text=`A ${m} kg box slides on a horizontal surface with coefficient of kinetic friction ${mu.toFixed(1)}. Find the friction force. (g = 9.8 m/s²)`;
					correctAnswer=`${Ff.toFixed(1)} N`;
					numericValue=Ff;
					unit="N";
					break;
				}
				case "accelerationFromForces":{
					const m=rng.nextInt(2,8);
					const Fnet=rng.nextInt(10,40);
					const a=Fnet/m;
					text=`A net force of ${Fnet} N acts on a ${m} kg object. Find the acceleration.`;
					correctAnswer=`${a.toFixed(1)} m/s²`;
					numericValue=a;
					unit="m/s²";
					break;
				}
				case "weightAndNormal":{
					const m=rng.nextInt(3,12);
					const N=m*g;
					text=`A ${m} kg block sits on a horizontal table. What is the normal force? (g = 9.8 m/s²)`;
					correctAnswer=`${N.toFixed(1)} N`;
					numericValue=N;
					unit="N";
					break;
				}
				case "springForce":{
					const k=rng.nextInt(50,200);
					const x=rng.nextInt(2,10)/100;
					const F=k*x;
					text=`A spring with spring constant ${k} N/m is stretched ${(x*100).toFixed(0)} cm. Find the spring force.`;
					correctAnswer=`${F.toFixed(1)} N`;
					numericValue=F;
					unit="N";
					break;
				}
				case "resultantForce2D":{
					const Fx=rng.nextInt(10,30);
					const Fy=rng.nextInt(10,30);
					const Fr=Math.sqrt(Fx*Fx+Fy*Fy);
					text=`Two forces act on an object: ${Fx} N east and ${Fy} N north. Find the magnitude of the resultant force.`;
					correctAnswer=`${Fr.toFixed(1)} N`;
					numericValue=Fr;
					unit="N";
					break;
				}
				case "tensionTwoRopesMath":{
					const m=rng.nextInt(2,6);
					const angle=rng.nextInt(20,70);
					const T=(m*g)/(2*Math.cos(angle*Math.PI/180));
					text=`A ${m} kg sign hangs from two ropes making equal angles of ${angle}° with the vertical. Find the tension in each rope. (g = 9.8 m/s²)`;
					correctAnswer=`${T.toFixed(1)} N`;
					numericValue=T;
					unit="N";
					break;
				}
				case "inclineAcceleration":{
					const m=rng.nextInt(2,8);
					const angle=rng.nextInt(15,45);
					const a=g*Math.sin(angle*Math.PI/180);
					text=`A ${m} kg block slides down a frictionless incline at ${angle}°. Find its acceleration. (g = 9.8 m/s²)`;
					correctAnswer=`${a.toFixed(2)} m/s²`;
					numericValue=a;
					unit="m/s²";
					break;
				}
				case "elevatorApparentWeight":{
					const m=rng.nextInt(50,80);
					const a=rng.nextInt(1,4);
					const dir=rng.choice(["up","down"]);
					let N:number;
					if (dir==="up"){
						N=m*(g+a);
						text=`A ${m} kg person stands on a scale in an elevator accelerating upward at ${a} m/s². What is the scale reading (normal force)? (g = 9.8 m/s²)`;
					}
					else{
						N=m*(g-a);
						text=`A ${m} kg person stands on a scale in an elevator accelerating downward at ${a} m/s². What is the scale reading (normal force)? (g = 9.8 m/s²)`;
					}
					correctAnswer=`${N.toFixed(0)} N`;
					numericValue=N;
					unit="N";
					break;
				}
				default:{
					const m1=rng.nextInt(2,5);
					const m2=rng.nextInt(1,4);
					const a=(m2*g)/(m1+m2);
					text=`A ${m1} kg block on a frictionless table is connected by a string over a pulley to a hanging ${m2} kg mass. Find the acceleration of the system. (g = 9.8 m/s²)`;
					correctAnswer=`${a.toFixed(2)} m/s²`;
					numericValue=a;
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
					id: `2.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `2.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
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