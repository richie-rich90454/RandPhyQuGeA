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
			const scenarioList=[
				"personWalkwaySameDir","personWalkwayOppDir","boatCrossRiver","relativeVelocityToward",
				"relativeVelocitySameDir","trainPassingPlatform","planeWindCrosswind","planeWindHeadwind",
				"rainRelativeToCar","twoBoatsMeeting"
			];
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
				case "relativeVelocityToward":{
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
				case "relativeVelocitySameDir":{
					const vA=rng.nextInt(10,30);
					const vB=rng.nextInt(5,vA-1);
					const vRel=vA-vB;
					text=`Car A moves east at ${vA} m/s, car B moves east at ${vB} m/s. What is the velocity of A relative to B?`;
					answer=`${vRel} m/s east`;
					const wrong1=`${vA+vB} m/s east`;
					const wrong2=`${vRel} m/s west`;
					const wrong3=`${vB} m/s east`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "trainPassingPlatform":{
					const vTrain=rng.nextInt(15,30);
					const vPerson=rng.nextInt(1,4);
					const vRel=vTrain+vPerson;
					text=`A train moves east at ${vTrain} m/s. A passenger walks east at ${vPerson} m/s relative to the train. What is the passenger's speed relative to the ground?`;
					answer=`${vRel} m/s`;
					const wrong1=`${Math.abs(vTrain-vPerson)} m/s`;
					const wrong2=`${vTrain} m/s`;
					const wrong3=`${vPerson} m/s`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "planeWindCrosswind":{
					const vPlane=rng.nextInt(100,200);
					const vWind=rng.nextInt(20,60);
					const vResult=Math.sqrt(vPlane*vPlane+vWind*vWind).toFixed(0);
					text=`A plane flies north at ${vPlane} km/h. A wind blows east at ${vWind} km/h. What is the plane's speed relative to the ground?`;
					answer=`${vResult} km/h`;
					const wrong1=`${Math.abs(vPlane-vWind)} km/h`;
					const wrong2=`${vPlane+vWind} km/h`;
					const wrong3=`${vPlane} km/h`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "planeWindHeadwind":{
					const vPlane=rng.nextInt(200,400);
					const vWind=rng.nextInt(30,80);
					const vResult=vPlane-vWind;
					text=`A plane flies east at ${vPlane} km/h relative to the air. A headwind blows west at ${vWind} km/h. What is the plane's ground speed?`;
					answer=`${vResult} km/h`;
					const wrong1=`${vPlane+vWind} km/h`;
					const wrong2=`${vPlane} km/h`;
					const wrong3=`${vWind} km/h`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				case "rainRelativeToCar":{
					const vCar=rng.nextInt(10,30);
					const vRain=rng.nextInt(5,15);
					const angle=Math.atan(vRain/vCar)*180/Math.PI;
					text=`A car moves horizontally at ${vCar} m/s. Rain falls vertically at ${vRain} m/s. At what angle does the rain appear to hit the windshield relative to the vertical?`;
					answer=`${angle.toFixed(0)}°`;
					const wrong1=`${(90-angle).toFixed(0)}°`;
					const wrong2=`${(angle+10).toFixed(0)}°`;
					const wrong3=`${(angle-10).toFixed(0)}°`;
					choices=[answer,wrong1,wrong2,wrong3];
					break;
				}
				default:{
					const v1=rng.nextInt(5,15);
					const v2=rng.nextInt(3,v1-1);
					const d=rng.nextInt(20,60);
					const t=d/(v1+v2);
					text=`Boat A moves toward boat B at ${v1} m/s. Boat B moves toward boat A at ${v2} m/s. They start ${d} m apart. How long until they meet?`;
					answer=`${t.toFixed(1)} s`;
					const wrong1=`${(t*0.8).toFixed(1)} s`;
					const wrong2=`${(t*1.2).toFixed(1)} s`;
					const wrong3=`${(t*0.5).toFixed(1)} s`;
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
			const scenarioList=[
				"relativeVelocityMath","timeToMeet","boatCrossingTime","relativeVelocitySameDirMath",
				"planeWindGroundSpeed","riverCrossingDownstream","rainAngle","twoTrainsPassing"
			];
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
				case "boatCrossingTime":{
					const width=rng.nextInt(20,100);
					const vBoat=rng.nextInt(2,6);
					const time=width/vBoat;
					text=`A boat heads directly across a river of width ${width} m with a speed of ${vBoat} m/s relative to the water. How long does it take to cross? (Ignore the river current for this calculation.)`;
					correctAnswer=`${time.toFixed(1)} s`;
					numericValue=time;
					unit="s";
					break;
				}
				case "relativeVelocitySameDirMath":{
					const vA=rng.nextInt(10,30);
					const vB=rng.nextInt(5,vA-1);
					const vRel=vA-vB;
					text=`Car A moves east at ${vA} m/s, car B moves east at ${vB} m/s. What is the velocity of A relative to B?`;
					correctAnswer=`${vRel} m/s east`;
					numericValue=vRel;
					unit="m/s";
					break;
				}
				case "planeWindGroundSpeed":{
					const vPlane=rng.nextInt(150,300);
					const vWind=rng.nextInt(30,80);
					const vGround=vPlane-vWind;
					text=`A plane flies east at ${vPlane} km/h relative to the air. A headwind blows west at ${vWind} km/h. What is the plane's ground speed?`;
					correctAnswer=`${vGround} km/h`;
					numericValue=vGround;
					unit="km/h";
					break;
				}
				case "riverCrossingDownstream":{
					const width=rng.nextInt(30,120);
					const vBoat=rng.nextInt(3,7);
					const vRiver=rng.nextInt(2,5);
					const time=width/vBoat;
					const downstream=vRiver*time;
					text=`A boat heads directly across a river of width ${width} m at ${vBoat} m/s. The river flows at ${vRiver} m/s. How far downstream does the boat land?`;
					correctAnswer=`${downstream.toFixed(1)} m`;
					numericValue=downstream;
					unit="m";
					break;
				}
				case "rainAngle":{
					const vCar=rng.nextInt(10,30);
					const vRain=rng.nextInt(5,15);
					const angle=Math.atan(vRain/vCar)*180/Math.PI;
					text=`A car moves horizontally at ${vCar} m/s. Rain falls vertically at ${vRain} m/s. At what angle from the vertical does the rain appear to hit the windshield?`;
					correctAnswer=`${angle.toFixed(1)}°`;
					numericValue=angle;
					unit="°";
					break;
				}
				default:{
					const v1=rng.nextInt(10,25);
					const v2=rng.nextInt(8,20);
					const len=rng.nextInt(100,300);
					const t=len/(v1+v2);
					text=`Train A of length ${len} m moves at ${v1} m/s. Train B moves toward it at ${v2} m/s. How long does it take for them to completely pass each other?`;
					correctAnswer=`${t.toFixed(1)} s`;
					numericValue=t;
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