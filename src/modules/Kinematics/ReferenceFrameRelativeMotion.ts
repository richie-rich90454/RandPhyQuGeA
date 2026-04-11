import type {Question, GenerateOptions} from '../../types.d.js';
import {SeededRandom} from '../../seededRandom.js';
export const topicId="1.4_reference_frames_relative_motion";
export const topicName="Reference Frames and Relative Motion";
export function generate(options: GenerateOptions): Question{
	let rng=new SeededRandom(options.seed!==undefined?options.seed:Date.now());
	const typeList: Question["questionType"][]=["MC","Math"];
	let chosenType=rng.choice(typeList);
	if (options.forceMcq) chosenType="MC";
	switch(chosenType){
		case "MC":{
			const scenarioList=["personWalkwaySameDir","personWalkwayOppDir","boatCrossRiver","relativeVelocityToward"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let answer="";
			let choices:string[]=[];
			switch(scenario){
				case "personWalkwaySameDir":{
					const vPerson=(rng.nextInt(10,25)/10).toFixed(1);
					const vWalkway=(rng.nextInt(20,40)/10).toFixed(1);
					const vGround=(parseFloat(vPerson)+parseFloat(vWalkway)).toFixed(1);
					text=`A person walks ${vPerson} m/s east on a moving walkway that moves ${vWalkway} m/s east. What is the person's speed relative to the ground?`;
					answer=`${vGround} m/s`;
					const wrong1=`${Math.abs(parseFloat(vPerson)-parseFloat(vWalkway)).toFixed(1)} m/s`;
					const wrong2=`${vPerson} m/s`;
					const wrong3=`${vWalkway} m/s`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "personWalkwayOppDir":{
					const vPerson=(rng.nextInt(10,25)/10).toFixed(1);
					const vWalkway=(rng.nextInt(20,40)/10).toFixed(1);
					const vGround=(parseFloat(vWalkway)-parseFloat(vPerson)).toFixed(1);
					const dir=parseFloat(vGround)>=0?"east":"west";
					answer=`${Math.abs(parseFloat(vGround)).toFixed(1)} m/s ${dir}`;
					text=`A person walks ${vPerson} m/s west on a moving walkway that moves ${vWalkway} m/s east. What is the person's velocity relative to the ground?`;
					const wrong1=`${(parseFloat(vPerson)+parseFloat(vWalkway)).toFixed(1)} m/s east`;
					const wrong2=`${vPerson} m/s west`;
					const wrong3=`${vWalkway} m/s east`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "boatCrossRiver":{
					const vBoat=rng.nextInt(3,6);
					const vRiver=rng.nextInt(2,5);
					const vResult=Math.sqrt(vBoat*vBoat+vRiver*vRiver).toFixed(1);
					text=`A boat points directly across a river and moves at ${vBoat} m/s relative to the water. The river flows at ${vRiver} m/s. The boat's speed relative to the ground is:`;
					answer=`${vResult} m/s`;
					const wrong1=`${Math.abs(vBoat-vRiver)} m/s`;
					const wrong2=`${vBoat+vRiver} m/s`;
					const wrong3=`${vBoat} m/s`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				default:{
					const vA=rng.nextInt(10,30);
					const vB=rng.nextInt(5,vA-1);
					const vRel=vA+vB;
					text=`Car A moves east at ${vA} m/s, car B moves west at ${vB} m/s. What is the velocity of A relative to B?`;
					answer=`${vRel} m/s east`;
					const wrong1=`${Math.abs(vA-vB)} m/s east`;
					const wrong2=`${vRel} m/s west`;
					const wrong3=`${vA} m/s east`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
			}
			for(let i=choices.length-1;i>0;i--){
				const j=rng.nextInt(0,i);
				[choices[i],choices[j]]=[choices[j],choices[i]];
			}
			return{
				id: `1.4_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
			const scenarioList=["relativeVelocityMath","timeToMeet","boatCrossingTime"];
			const scenario=rng.choice(scenarioList);
			let text="";
			let correctAnswer="";
			let unit:string|undefined=undefined;
			let numericValue=0;
			switch(scenario){
				case "relativeVelocityMath":{
					const vA=rng.nextInt(10,30);
					const vB=rng.nextInt(5,vA-1);
					const vRel=vA+vB;
					text=`Car A moves east at ${vA} m/s, car B moves west at ${vB} m/s. What is the velocity of A relative to B (magnitude and direction)?`;
					correctAnswer=`${vRel} m/s east`;
					numericValue=vRel;
					unit="m/s";
					break;
				}
				case "timeToMeet":{
					const distance=rng.nextInt(50,200);
					const v1=rng.nextInt(3,10);
					const v2=rng.nextInt(3,10);
					const relSpeed=v1+v2;
					const time=distance/relSpeed;
					text=`Two runners start ${distance} m apart and run directly toward each other. Runner 1 runs at ${v1} m/s, runner 2 at ${v2} m/s. How long until they meet?`;
					correctAnswer=`${time.toFixed(1)} s`;
					numericValue=time;
					unit="s";
					break;
				}
				default:{
					const width=rng.nextInt(20,100);
					const vBoat=rng.nextInt(2,6);
					const time=width/vBoat;
					text=`A boat heads directly across a river of width ${width} m with a speed of ${vBoat} m/s relative to the water. How long does it take to cross? (Ignore the river current for this calculation.)`;
					correctAnswer=`${time.toFixed(1)} s`;
					numericValue=time;
					unit="s";
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
					id: `1.4_${Date.now()}_${rng.nextInt(0,1e6)}`,
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
					id: `1.4_${Date.now()}_${rng.nextInt(0,1e6)}`,
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