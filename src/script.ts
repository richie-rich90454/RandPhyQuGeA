// ============================================================
// 1. Type Definitions
// ============================================================
type Question={
	text:string;
	answer:string;
	unit?:string;
	choices?:string[];
	answerType:"numeric"|"string";
	topicName:string;
	explanation?:string;
};
type GenerateOptions={
	difficulty:"easy"|"medium"|"hard";
	forceMcq:boolean;
	seed?:number;
};
type GeneratorFn=(options:GenerateOptions)=>Question;
type GeneratorRegistry={
	[topicId:string]:GeneratorFn;
};
type AppSettings={
	theme:"light"|"dark"|"system";
	defaultMode:"single"|"mental";
	autoContinue:boolean;
	shuffle:boolean;
	defaultScope:string;
	notifications:boolean;
	difficulty:"easy"|"medium"|"hard";
	timerSeconds:number;
	maxQuestions:number;
	autoCheckDelayMs:number;
	decimalPlaces:number;
	sound:boolean;
	vibration:boolean;
	mcqChoices:number;
	performanceMode:boolean;
	waveBackground:boolean;
	blurEffect:boolean;
};
type MentalSession={
	active:boolean;
	paused:boolean;
	score:number;
	total:number;
	timeLeft:number;
	timerInterval:number|null;
	questionsRemaining:number;
	unlimited:boolean;
	startTime:number;
};
// ============================================================
// 2. Helper Functions
// ============================================================
const rand=(min:number,max:number):number=>{
	return min+Math.random()*(max-min);
};
const randInt=(min:number,max:number):number=>{
	return Math.floor(rand(min,max+1));
};
const roundTo=(value:number,decimals:number):number=>{
	const factor=Math.pow(10,decimals);
	return Math.round(value*factor)/factor;
};
const pickRandom=<T>(arr:T[]):T=>{
	return arr[Math.floor(Math.random()*arr.length)];
};
const formatNumber=(num:number,decimals:number=2):string=>{
	return roundTo(num,decimals).toString();
};
// ============================================================
// 3. Question Generators (Kinematics)
// ============================================================
const generate1DKinematics=(options:GenerateOptions):Question=>{
	const difficulty=options.difficulty;
	let v0:number,a:number,t:number;
	if(difficulty==="easy"){
		v0=rand(0,10);
		a=rand(1,5);
		t=rand(2,6);
	}
	else if(difficulty==="medium"){
		v0=rand(0,20);
		a=rand(1,8);
		t=rand(2,10);
	}
	else{
		v0=rand(5,30);
		a=rand(2,12);
		t=rand(3,15);
	}
	const scenarioType=randInt(1,3);
	let scenario:string;
	let computeAnswer:()=>number;
	let unit:string;
	let explanation:string="";
	const displacement=v0*t+0.5*a*t*t;
	// const vf=v0+a*t;
	if(scenarioType===1){
		scenario=`A object starts from rest and accelerates at ${formatNumber(a)} m/s² for ${formatNumber(t)} seconds. What is its final velocity?`;
		computeAnswer=()=>a*t;
		unit="m/s";
		explanation=`Final velocity = initial velocity (0) + acceleration × time = ${formatNumber(a)} × ${formatNumber(t)} = ${formatNumber(a*t)} m/s.`;
	}
	else if(scenarioType===2){
		scenario=`An object moving at ${formatNumber(v0)} m/s accelerates at ${formatNumber(a)} m/s² for ${formatNumber(t)} seconds. What is the displacement?`;
		computeAnswer=()=>v0*t+0.5*a*t*t;
		unit="m";
		explanation=`Displacement = v₀t + ½at² = ${formatNumber(v0)}×${formatNumber(t)} + 0.5×${formatNumber(a)}×${formatNumber(t)}² = ${formatNumber(displacement)} m.`;
	}
	else{
		scenario=`An object traveling at ${formatNumber(v0)} m/s decelerates uniformly at ${formatNumber(a)} m/s². How far does it travel before coming to rest?`;
		computeAnswer=()=>(v0*v0)/(2*a);
		unit="m";
		explanation=`Using v² = v₀² + 2aΔx, with v=0 → Δx = v₀²/(2a) = ${formatNumber(v0)}²/(2×${formatNumber(a)}) = ${formatNumber((v0*v0)/(2*a))} m.`;
	}
	const numericAnswer=computeAnswer();
	let answer=formatNumber(numericAnswer);
	let choices:string[]|undefined;
	if(options.forceMcq){
		const correct=numericAnswer;
		const offsets=[-correct*0.2,correct*0.15,correct*0.3,-correct*0.1];
		const rawChoices=[correct,...offsets.map(o=>correct+o)].map(v=>formatNumber(v));
		choices=[...new Set(rawChoices)].slice(0,4);
		if(!choices.includes(answer)) choices[0]=answer;
		choices.sort(()=>Math.random()-0.5);
	}
	return{
		text:scenario,
		answer:answer,
		unit:unit,
		choices:choices,
		answerType:"numeric",
		topicName:"1D Kinematics",
		explanation:explanation,
	};
};
const generateFreeFall=(options:GenerateOptions):Question=>{
	const difficulty=options.difficulty;
	const g=9.8;
	let height:number;
	if(difficulty==="easy") height=rand(10,50);
	else if(difficulty==="medium") height=rand(20,100);
	else height=rand(50,200);
	const time=Math.sqrt((2*height)/g);
	const vFinal=Math.sqrt(2*g*height);
	const scenario=`An object is dropped from a height of ${formatNumber(height)} meters. How long does it take to hit the ground? (Use g = 9.8 m/s²)`;
	const numericAnswer=time;
	let answer=formatNumber(numericAnswer);
	let choices:string[]|undefined;
	if(options.forceMcq){
		const correct=numericAnswer;
		const offsets=[-correct*0.2,correct*0.15,correct*0.3,-correct*0.1];
		const rawChoices=[correct,...offsets.map(o=>correct+o)].map(v=>formatNumber(v));
		choices=[...new Set(rawChoices)].slice(0,4);
		if(!choices.includes(answer)) choices[0]=answer;
		choices.sort(()=>Math.random()-0.5);
	}
	return{
		text:scenario,
		answer:answer,
		unit:"s",
		choices:choices,
		answerType:"numeric",
		topicName:"Free Fall",
		explanation:`Time = √(2h/g) = √(2×${formatNumber(height)}/9.8) = ${formatNumber(time)} s. Final speed would be ${formatNumber(vFinal)} m/s.`,
	};
};
const generateProjectileMotion=(options:GenerateOptions):Question=>{
	const difficulty=options.difficulty;
	const g=9.8;
	let v0:number,angleDeg:number;
	if(difficulty==="easy"){
		v0=rand(10,25);
		angleDeg=rand(30,50);
	}
	else if(difficulty==="medium"){
		v0=rand(15,40);
		angleDeg=rand(25,65);
	}
	else{
		v0=rand(30,60);
		angleDeg=rand(20,70);
	}
	const angleRad=angleDeg*Math.PI/180;
	const range=(v0*v0*Math.sin(2*angleRad))/g;
	const maxHeight=(v0*v0*Math.sin(angleRad)*Math.sin(angleRad))/(2*g);
	const timeOfFlight=(2*v0*Math.sin(angleRad))/g;
	const scenario=`A projectile is launched with an initial speed of ${formatNumber(v0)} m/s at an angle of ${formatNumber(angleDeg)}° above horizontal. Calculate the horizontal range. (Use g = 9.8 m/s²)`;
	const numericAnswer=range;
	let answer=formatNumber(numericAnswer);
	let choices:string[]|undefined;
	if(options.forceMcq){
		const correct=numericAnswer;
		const offsets=[-correct*0.2,correct*0.15,correct*0.3,-correct*0.1];
		const rawChoices=[correct,...offsets.map(o=>correct+o)].map(v=>formatNumber(v));
		choices=[...new Set(rawChoices)].slice(0,4);
		if(!choices.includes(answer)) choices[0]=answer;
		choices.sort(()=>Math.random()-0.5);
	}
	return{
		text:scenario,
		answer:answer,
		unit:"m",
		choices:choices,
		answerType:"numeric",
		topicName:"Projectile Motion",
		explanation:`Range R = (v₀² sin(2θ))/g = (${formatNumber(v0)}² × sin(${formatNumber(2*angleDeg)}°)) / 9.8 = ${formatNumber(range)} m. Maximum height = ${formatNumber(maxHeight)} m, time of flight = ${formatNumber(timeOfFlight)} s.`,
	};
};
const generateVectors=(options:GenerateOptions):Question=>{
	const difficulty=options.difficulty;
	let ax:number,ay:number;
	if(difficulty==="easy"){
		ax=randInt(2,8);
		ay=randInt(2,8);
	}
	else if(difficulty==="medium"){
		ax=randInt(3,12);
		ay=randInt(3,12);
	}
	else{
		ax=randInt(5,20);
		ay=randInt(5,20);
	}
	const magnitude=Math.sqrt(ax*ax+ay*ay);
	const angle=Math.atan2(ay,ax)*180/Math.PI;
	const scenario=`Vector A has components Aₓ = ${formatNumber(ax)} and Aᵧ = ${formatNumber(ay)}. What is the magnitude of the vector?`;
	const numericAnswer=magnitude;
	let answer=formatNumber(numericAnswer);
	let choices:string[]|undefined;
	if(options.forceMcq){
		const correct=numericAnswer;
		const offsets=[-correct*0.2,correct*0.15,correct*0.3,-correct*0.1];
		const rawChoices=[correct,...offsets.map(o=>correct+o)].map(v=>formatNumber(v));
		choices=[...new Set(rawChoices)].slice(0,4);
		if(!choices.includes(answer)) choices[0]=answer;
		choices.sort(()=>Math.random()-0.5);
	}
	return{
		text:scenario,
		answer:answer,
		unit:"",
		choices:choices,
		answerType:"numeric",
		topicName:"Vectors",
		explanation:`Magnitude = √(Aₓ² + Aᵧ²) = √(${formatNumber(ax)}² + ${formatNumber(ay)}²) = ${formatNumber(magnitude)}. Direction = ${formatNumber(angle)}° from x‑axis.`,
	};
};
const generateRelativeMotion=(options:GenerateOptions):Question=>{
	const difficulty=options.difficulty;
	let vBoat:number,vRiver:number,width:number;
	if(difficulty==="easy"){
		vBoat=rand(3,6);
		vRiver=rand(1,3);
		width=rand(20,60);
	}
	else if(difficulty==="medium"){
		vBoat=rand(2,8);
		vRiver=rand(1,5);
		width=rand(20,100);
	}
	else{
		vBoat=rand(5,12);
		vRiver=rand(3,8);
		width=rand(50,150);
	}
	const timeCross=width/vBoat;
	const downstream=vRiver*timeCross;
	const velocityRelative=Math.sqrt(vBoat*vBoat+vRiver*vRiver);
	const scenario=`A boat can travel at ${formatNumber(vBoat)} m/s in still water. It attempts to cross a river of width ${formatNumber(width)} m flowing at ${formatNumber(vRiver)} m/s. If the boat heads directly perpendicular to the banks, how far downstream does it land?`;
	const numericAnswer=downstream;
	let answer=formatNumber(numericAnswer);
	let choices:string[]|undefined;
	if(options.forceMcq){
		const correct=numericAnswer;
		const offsets=[-correct*0.2,correct*0.15,correct*0.3,-correct*0.1];
		const rawChoices=[correct,...offsets.map(o=>correct+o)].map(v=>formatNumber(v));
		choices=[...new Set(rawChoices)].slice(0,4);
		if(!choices.includes(answer)) choices[0]=answer;
		choices.sort(()=>Math.random()-0.5);
	}
	return{
		text:scenario,
		answer:answer,
		unit:"m",
		choices:choices,
		answerType:"numeric",
		topicName:"Relative Motion",
		explanation:`Time to cross = width / v_boat = ${formatNumber(width)} / ${formatNumber(vBoat)} = ${formatNumber(timeCross)} s. Downstream distance = v_river × time = ${formatNumber(vRiver)} × ${formatNumber(timeCross)} = ${formatNumber(downstream)} m. Resultant velocity = ${formatNumber(velocityRelative)} m/s.`,
	};
};
const generateMotionGraphs=(options:GenerateOptions):Question=>{
	const difficulty=options.difficulty;
	let slope:number,intercept:number;
	if(difficulty==="easy"){
		slope=rand(2,5);
		intercept=rand(0,3);
	}
	else if(difficulty==="medium"){
		slope=rand(2,10);
		intercept=rand(0,5);
	}
	else{
		slope=rand(5,15);
		intercept=rand(1,8);
	}
	const time=rand(2,8);
	const velocity=slope*time+intercept;
	const scenario=`The velocity of an object is given by v(t) = ${formatNumber(slope)}t + ${formatNumber(intercept)} (m/s). What is the acceleration?`;
	const numericAnswer=slope;
	let answer=formatNumber(numericAnswer);
	let choices:string[]|undefined;
	if(options.forceMcq){
		const correct=numericAnswer;
		const offsets=[-correct*0.2,correct*0.15,correct*0.3,-correct*0.1];
		const rawChoices=[correct,...offsets.map(o=>correct+o)].map(v=>formatNumber(v));
		choices=[...new Set(rawChoices)].slice(0,4);
		if(!choices.includes(answer)) choices[0]=answer;
		choices.sort(()=>Math.random()-0.5);
	}
	return{
		text:scenario,
		answer:answer,
		unit:"m/s²",
		choices:choices,
		answerType:"numeric",
		topicName:"Motion Graphs",
		explanation:`Acceleration is the slope of velocity vs. time graph: a = ${formatNumber(slope)} m/s². At t=${formatNumber(time)} s, velocity = ${formatNumber(velocity)} m/s.`,
	};
};
// ============================================================
// 4. Generator Registry
// ============================================================
const generatorRegistry:GeneratorRegistry={};
const topicMetadata:{[topicId:string]:{name:string;scope:string}}={};
const registerGenerator=(topicId:string,generator:GeneratorFn,name:string,scope:string="mechanics"):void=>{
	generatorRegistry[topicId]=generator;
	topicMetadata[topicId]={name,scope};
};
registerGenerator("mechanics.1d-kinematics",generate1DKinematics,"1D Kinematics","mechanics");
registerGenerator("mechanics.free-fall",generateFreeFall,"Free Fall","mechanics");
registerGenerator("mechanics.projectile-motion",generateProjectileMotion,"Projectile Motion","mechanics");
registerGenerator("mechanics.vectors",generateVectors,"Vectors","mechanics");
registerGenerator("mechanics.relative-motion",generateRelativeMotion,"Relative Motion","mechanics");
registerGenerator("mechanics.motion-graphs",generateMotionGraphs,"Motion Graphs","mechanics");
// ============================================================
// 5. UI Initialization & Event Binding
// ============================================================
document.addEventListener("DOMContentLoaded",()=>{
	// DOM Elements
	const elemModeSingleBtn=document.getElementById("mode-single")as HTMLButtonElement;
	const elemModeMentalBtn=document.getElementById("mode-mental")as HTMLButtonElement;
	const elemSingleControls=document.getElementById("single-controls")as HTMLDivElement;
	const elemMentalControls=document.getElementById("mental-controls")as HTMLDivElement;
	const elemTopicSearch=document.getElementById("topic-search")as HTMLInputElement;
	const elemTopicGrid=document.getElementById("topic-grid")as HTMLDivElement;
	const elemGenerateBtn=document.getElementById("genQ")as HTMLButtonElement;
	const elemCheckBtn=document.getElementById("check-answer")as HTMLButtonElement;
	const elemAnswerBox=document.getElementById("answer-box")as HTMLTextAreaElement;
	const elemClearAnswerBtn=document.getElementById("clear-answer")as HTMLButtonElement;
	const elemThemeToggle=document.getElementById("theme-toggle")as HTMLButtonElement;
	const elemSettingsModal=document.getElementById("settings-modal")as HTMLDivElement;
	const elemSettingsClose=document.getElementById("settings-close")as HTMLButtonElement;
	const elemSettingsSave=document.getElementById("settings-save")as HTMLButtonElement;
	const elemShortcutsModal=document.getElementById("shortcuts-modal")as HTMLDivElement;
	const elemShortcutsClose=document.getElementById("shortcuts-close")as HTMLButtonElement;
	const elemShortcutsGotit=document.getElementById("shortcuts-gotit")as HTMLButtonElement;
	const elemShortcutsBtn=document.getElementById("shortcuts-button")as HTMLButtonElement;
	const elemHelpBtn=document.getElementById("help-button")as HTMLButtonElement;
	const elemOnboardingOverlay=document.getElementById("onboarding-overlay")as HTMLDivElement;
	const elemOnboardingClose=document.getElementById("onboarding-close")as HTMLButtonElement;
	const elemOnboardingGotit=document.getElementById("onboarding-gotit")as HTMLButtonElement;
	const elemSettingsBtn=document.getElementById("settings-button")as HTMLButtonElement;
	const elemSettingsTabBasic=document.getElementById("settings-tab-basic")as HTMLButtonElement;
	const elemSettingsTabAdvanced=document.getElementById("settings-tab-advanced")as HTMLButtonElement;
	const elemSettingsBasicPanel=document.getElementById("settings-basic")as HTMLDivElement;
	const elemSettingsAdvancedPanel=document.getElementById("settings-advanced")as HTMLDivElement;
	const elemAutoContinueToggle=document.getElementById("autocontinue-toggle")as HTMLInputElement;
	const elemShuffleToggle=document.getElementById("shuffle-toggle")as HTMLInputElement;
	const elemMcqToggle=document.getElementById("mcq-toggle")as HTMLInputElement;
	const elemScopeSelect=document.getElementById("scope-select")as HTMLSelectElement;
	const elemStartSessionBtn=document.getElementById("start-session")as HTMLButtonElement;
	const elemMentalScopeSelect=document.getElementById("mental-scope-select")as HTMLSelectElement;
	const elemMentalShuffleToggle=document.getElementById("mental-shuffle-toggle")as HTMLInputElement;
	const elemUnlimitedToggle=document.getElementById("unlimited-toggle")as HTMLInputElement;
	const elemDifficultySelect=document.getElementById("difficulty-select")as HTMLSelectElement;
	const elemTimerDisplay=document.getElementById("timer-display")as HTMLSpanElement;
	const elemScoreDisplay=document.getElementById("score-display")as HTMLSpanElement;
	const elemPauseSessionBtn=document.getElementById("pause-session")as HTMLButtonElement;
	const elemSkipQuestionBtn=document.getElementById("skip-question")as HTMLButtonElement;
	const elemMentalProgressBar=document.getElementById("mental-progress-bar")as HTMLDivElement;
	const elemStatisticsPanel=document.getElementById("statistics-panel")as HTMLDivElement;
	const elemAccuracyStat=document.getElementById("accuracy-stat")as HTMLSpanElement;
	const elemAvgTimeStat=document.getElementById("avg-time-stat")as HTMLSpanElement;
	const elemQuestionArea=document.getElementById("question-area")as HTMLDivElement;
	const elemCurrentTopicSpan=document.getElementById("current-topic")as HTMLDivElement;
	const elemResultsDiv=document.getElementById("answer-results")as HTMLDivElement;
	const elemCopyAnswerBtn=document.getElementById("copy-answer")as HTMLButtonElement;
	const elemMcqChoicesContainer=document.getElementById("mcq-choices-container")as HTMLDivElement;
	const elemPhysicsPreview=document.getElementById("physics-preview")as HTMLDivElement;
	const elemExpectedFormatDiv=document.getElementById("expected-format")as HTMLDivElement;
	const elemPhysicsToolbarBtns=document.querySelectorAll(".physics-toolbar-btn[data-symbol]");
	const elemDropdownBtn=document.getElementById("physics-dropdown-btn")as HTMLButtonElement;
	const elemPhysicsDropdown=document.getElementById("physics-dropdown")as HTMLDivElement;
	// State
	let currentQuestion:Question|null=null;
	let activeTopicId:string|null=null;
	let currentDifficulty:"easy"|"medium"|"hard"="medium";
	let mcqMode=false;
	let autoContinue=false;
	let shuffleMode=false;
	let currentScope="all";
	let mentalModeActive=false;
	let mentalSession:MentalSession={
		active:false,
		paused:false,
		score:0,
		total:0,
		timeLeft:30,
		timerInterval:null,
		questionsRemaining:5,
		unlimited:false,
		startTime:0,
	};
	let settings:AppSettings={
		theme:"system",
		defaultMode:"single",
		autoContinue:false,
		shuffle:false,
		defaultScope:"all",
		notifications:true,
		difficulty:"medium",
		timerSeconds:30,
		maxQuestions:5,
		autoCheckDelayMs:800,
		decimalPlaces:2,
		sound:false,
		vibration:false,
		mcqChoices:4,
		performanceMode:false,
		waveBackground:true,
		blurEffect:true,
	};
	// Helper: Get scope from topic id
	const getScopeFromTopicId=(topicId:string):string=>{
		if(topicId.startsWith("mechanics.")) return"mechanics";
		return"mechanics";
	};
	// Populate scope dropdowns
	const populateScopeSelects=()=>{
		const scopes=new Set<string>();
		for(const id in generatorRegistry){
			scopes.add(getScopeFromTopicId(id));
		}
		const scopeList=["all",...Array.from(scopes).sort()];
		if(elemScopeSelect){
			elemScopeSelect.innerHTML="";
			scopeList.forEach(scope=>{
				const option=document.createElement("option");
				option.value=scope;
				option.textContent=scope==="all"?"All":scope.charAt(0).toUpperCase()+scope.slice(1);
				elemScopeSelect.appendChild(option);
			});
		}
		if(elemMentalScopeSelect){
			elemMentalScopeSelect.innerHTML="";
			scopeList.forEach(scope=>{
				const option=document.createElement("option");
				option.value=scope;
				option.textContent=scope==="all"?"All":scope.charAt(0).toUpperCase()+scope.slice(1);
				elemMentalScopeSelect.appendChild(option);
			});
		}
	};
	// Rebuild topic pills
	const rebuildTopicPills=()=>{
		if(!elemTopicGrid) return;
		elemTopicGrid.innerHTML="";
		const topicIds=Object.keys(generatorRegistry);
		for(const id of topicIds){
			const scope=getScopeFromTopicId(id);
			if(currentScope!=="all"&&scope!==currentScope) continue;
			const topicName=topicMetadata[id]?.name||id.replace(/_/g," ");
			const pill=document.createElement("div");
			pill.className="topic-pill";
			pill.setAttribute("data-topic",id);
			pill.textContent=topicName;
			if(activeTopicId===id) pill.classList.add("active");
			pill.addEventListener("click",()=>{
				if(generatorRegistry[id]){
					activeTopicId=id;
					document.querySelectorAll(".topic-pill").forEach(p=>p.classList.remove("active"));
					pill.classList.add("active");
					if(elemGenerateBtn) elemGenerateBtn.disabled=false;
				}
			});
			elemTopicGrid.appendChild(pill);
		}
		if(elemTopicSearch) filterTopics(elemTopicSearch.value);
	};
	const filterTopics=(term:string)=>{
		if(!elemTopicGrid) return;
		const pills=elemTopicGrid.querySelectorAll(".topic-pill");
		const lowerTerm=term.toLowerCase();
		pills.forEach(pill=>{
			const text=pill.textContent?.toLowerCase()||"";
			(pill as HTMLElement).style.display=text.includes(lowerTerm)?"flex":"none";
		});
	};
	const setMode=(mode:"single"|"mental")=>{
		if(mode==="single"){
			elemModeSingleBtn.classList.add("active");
			elemModeMentalBtn.classList.remove("active");
			elemSingleControls.classList.remove("hidden");
			elemMentalControls.classList.add("hidden");
			mentalModeActive=false;
		}
		else{
			elemModeMentalBtn.classList.add("active");
			elemModeSingleBtn.classList.remove("active");
			elemMentalControls.classList.remove("hidden");
			elemSingleControls.classList.add("hidden");
			mentalModeActive=true;
		}
	};
	const applyTheme=(theme:"light"|"dark"|"system")=>{
		const root=document.documentElement;
		if(theme==="system"){
			root.classList.remove("light","dark");
		}
		else if(theme==="dark"){
			root.classList.remove("light");
			root.classList.add("dark");
		}
		else{
			root.classList.remove("dark");
			root.classList.add("light");
		}
		localStorage.setItem("theme",theme);
	};
	const loadSettings=()=>{
		const saved=localStorage.getItem("physicsSettings");
		if(saved){
			try{
				const parsed=JSON.parse(saved);
				settings={...settings,...parsed};
			}
			catch(e){}
		}
		applyTheme(settings.theme);
		const themeSelect=document.getElementById("settings-theme")as HTMLSelectElement;
		if(themeSelect) themeSelect.value=settings.theme;
		const defaultModeSelect=document.getElementById("settings-default-mode")as HTMLSelectElement;
		if(defaultModeSelect) defaultModeSelect.value=settings.defaultMode;
		const autoContCheck=document.getElementById("settings-auto-continue")as HTMLInputElement;
		if(autoContCheck) autoContCheck.checked=settings.autoContinue;
		const shuffleCheck=document.getElementById("settings-shuffle")as HTMLInputElement;
		if(shuffleCheck) shuffleCheck.checked=settings.shuffle;
		const scopeSelectSetting=document.getElementById("settings-scope")as HTMLSelectElement;
		if(scopeSelectSetting) scopeSelectSetting.value=settings.defaultScope;
		const notifCheck=document.getElementById("settings-notifications")as HTMLInputElement;
		if(notifCheck) notifCheck.checked=settings.notifications;
		const difficultySetting=document.getElementById("settings-difficulty")as HTMLSelectElement;
		if(difficultySetting) difficultySetting.value=settings.difficulty;
		const timerSetting=document.getElementById("settings-timer")as HTMLInputElement;
		if(timerSetting) timerSetting.value=settings.timerSeconds.toString();
		const maxQSetting=document.getElementById("settings-max-questions")as HTMLInputElement;
		if(maxQSetting) maxQSetting.value=settings.maxQuestions.toString();
		const autoCheckDelay=document.getElementById("settings-auto-check-delay")as HTMLInputElement;
		if(autoCheckDelay) autoCheckDelay.value=settings.autoCheckDelayMs.toString();
		const decimalPlacesSetting=document.getElementById("settings-decimal-places")as HTMLInputElement;
		if(decimalPlacesSetting) decimalPlacesSetting.value=settings.decimalPlaces.toString();
		const soundSetting=document.getElementById("settings-sound")as HTMLInputElement;
		if(soundSetting) soundSetting.checked=settings.sound;
		const vibrationSetting=document.getElementById("settings-vibration")as HTMLInputElement;
		if(vibrationSetting) vibrationSetting.checked=settings.vibration;
		const mcqChoicesSetting=document.getElementById("settings-mcq-choices")as HTMLInputElement;
		if(mcqChoicesSetting) mcqChoicesSetting.value=settings.mcqChoices.toString();
		const perfMaster=document.getElementById("settings-perf-master")as HTMLInputElement;
		if(perfMaster) perfMaster.checked=settings.performanceMode;
		const perfWave=document.getElementById("settings-perf-wave")as HTMLInputElement;
		if(perfWave) perfWave.checked=settings.waveBackground;
		const perfBlur=document.getElementById("settings-perf-blur")as HTMLInputElement;
		if(perfBlur) perfBlur.checked=settings.blurEffect;
		autoContinue=settings.autoContinue;
		shuffleMode=settings.shuffle;
		currentDifficulty=settings.difficulty;
		currentScope=settings.defaultScope;
		if(elemAutoContinueToggle) elemAutoContinueToggle.checked=autoContinue;
		if(elemShuffleToggle) elemShuffleToggle.checked=shuffleMode;
		if(elemScopeSelect) elemScopeSelect.value=currentScope;
		if(elemDifficultySelect) elemDifficultySelect.value=currentDifficulty;
		setMode(settings.defaultMode);
		rebuildTopicPills();
	};
	const saveSettings=()=>{
		localStorage.setItem("physicsSettings",JSON.stringify(settings));
		autoContinue=settings.autoContinue;
		shuffleMode=settings.shuffle;
		currentDifficulty=settings.difficulty;
		currentScope=settings.defaultScope;
		if(elemAutoContinueToggle) elemAutoContinueToggle.checked=autoContinue;
		if(elemShuffleToggle) elemShuffleToggle.checked=shuffleMode;
		if(elemScopeSelect) elemScopeSelect.value=currentScope;
		if(elemDifficultySelect) elemDifficultySelect.value=currentDifficulty;
		applyTheme(settings.theme);
		rebuildTopicPills();
	};
	const updateStatistics=()=>{
		if(!elemAccuracyStat||!elemAvgTimeStat) return;
		const total=mentalSession.total;
		if(total===0){
			elemAccuracyStat.textContent="Accuracy: 0%";
			elemAvgTimeStat.textContent="Avg: 0.0s";
			return;
		}
		const accuracy=(mentalSession.score/total)*100;
		const elapsed=(Date.now()-mentalSession.startTime)/1000;
		const avgTime=elapsed/total;
		elemAccuracyStat.textContent=`Accuracy: ${accuracy.toFixed(1)}%`;
		elemAvgTimeStat.textContent=`Avg: ${avgTime.toFixed(1)}s`;
	};
	const displayQuestion=(q:Question)=>{
		if(!elemQuestionArea) return;
		elemQuestionArea.innerHTML=`<div class="math">${q.text}</div>`;
		if(elemCurrentTopicSpan) elemCurrentTopicSpan.textContent=q.topicName;
		if(mcqMode&&q.choices&&q.choices.length>0&&elemMcqChoicesContainer){
			elemMcqChoicesContainer.style.display="flex";
			elemMcqChoicesContainer.innerHTML=q.choices.map(c=>`<button class="choice-button" data-value="${c.replace(/"/g,"&quot;")}">${c}</button>`).join("");
			const choiceButtons=elemMcqChoicesContainer.querySelectorAll(".choice-button");
			choiceButtons.forEach(btn=>{
				btn.addEventListener("click",()=>{
					choiceButtons.forEach(b=>b.classList.remove("selected"));
					btn.classList.add("selected");
					if(elemAnswerBox) elemAnswerBox.value=btn.getAttribute("data-value")||"";
				});
			});
		}
		else if(elemMcqChoicesContainer){
			elemMcqChoicesContainer.style.display="none";
		}
		if(elemAnswerBox){
			elemAnswerBox.disabled=false;
			elemAnswerBox.value="";
			elemAnswerBox.focus();
		}
		if(elemCheckBtn) elemCheckBtn.disabled=false;
		if(elemPhysicsPreview){
			elemPhysicsPreview.textContent="";
			elemPhysicsPreview.classList.remove("has-content");
		}
		if(elemExpectedFormatDiv){
			if(q.unit) elemExpectedFormatDiv.textContent=`Expected format: numeric value with units (${q.unit}). Use ^ for exponents.`;
			else elemExpectedFormatDiv.textContent="Enter your answer as a number or expression. Use ^ for exponents.";
		}
	};
	const showResult=(isCorrect:boolean,correctAnswer:string,explanation?:string)=>{
		if(!elemResultsDiv) return;
		if(elemCopyAnswerBtn) elemCopyAnswerBtn.classList.remove("hidden");
		if(isCorrect){
			elemResultsDiv.innerHTML=`<div class="result-success"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg><div><h3>Correct!</h3><p>${explanation||"Great job!"}</p></div></div>`;
			elemResultsDiv.classList.add("correct");
			elemResultsDiv.classList.remove("incorrect");
		}
		else{
			elemResultsDiv.innerHTML=`<div class="result-error"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg><div><h3>Incorrect</h3><p>Correct answer: ${correctAnswer}</p>${explanation?`<p>${explanation}</p>`:""}</div></div>`;
			elemResultsDiv.classList.add("incorrect");
			elemResultsDiv.classList.remove("correct");
		}
	};
	const checkAnswer=()=>{
		if(!currentQuestion||!elemAnswerBox) return;
		let userAnswer=elemAnswerBox.value.trim();
		if(mcqMode&&currentQuestion.choices){
			const selected=document.querySelector(".choice-button.selected")as HTMLButtonElement;
			if(selected) userAnswer=selected.dataset.value||"";
		}
		let isCorrect=false;
		if(currentQuestion.answerType==="numeric"){
			const userNum=parseFloat(userAnswer);
			const correctNum=parseFloat(currentQuestion.answer);
			const tolerance=Math.pow(10,-settings.decimalPlaces);
			isCorrect=!isNaN(userNum)&&!isNaN(correctNum)&&Math.abs(userNum-correctNum)<=tolerance;
		}
		else{
			isCorrect=userAnswer.toLowerCase()===currentQuestion.answer.toLowerCase();
		}
		showResult(isCorrect,currentQuestion.answer,currentQuestion.explanation);
		if(mentalModeActive&&mentalSession.active&&!mentalSession.paused){
			if(isCorrect) mentalSession.score++;
			mentalSession.total++;
			if(elemScoreDisplay) elemScoreDisplay.textContent=`${mentalSession.score} / ${mentalSession.total}`;
			updateStatistics();
			if(!mentalSession.unlimited&&mentalSession.total>=mentalSession.questionsRemaining){
				endMentalSession();
			}
			else{
				generateNextMentalQuestion();
			}
		}
	};
	const generateNewQuestion=()=>{
		if(Object.keys(generatorRegistry).length===0) return;
		let topicId=activeTopicId;
		if(shuffleMode){
			let topics=Object.keys(generatorRegistry);
			if(currentScope!=="all"){
				topics=topics.filter(t=>getScopeFromTopicId(t)===currentScope);
			}
			if(topics.length) topicId=topics[Math.floor(Math.random()*topics.length)];
		}
		if(!topicId||!generatorRegistry[topicId]){
			if(activeTopicId&&generatorRegistry[activeTopicId]) topicId=activeTopicId;
			else topicId=Object.keys(generatorRegistry)[0];
			if(!topicId) return;
		}
		const options:GenerateOptions={
			difficulty:currentDifficulty,
			forceMcq:mcqMode,
			seed:Date.now(),
		};
		try{
			const newQuestion=generatorRegistry[topicId](options);
			currentQuestion=newQuestion;
			displayQuestion(newQuestion);
			if(autoContinue){
				setTimeout(()=>{
					if(currentQuestion) checkAnswer();
				},settings.autoCheckDelayMs);
			}
		}
		catch(e){
			console.error(e);
		}
	};
	const startMentalSession=()=>{
		if(mentalSession.active) endMentalSession();
		mentalSession.active=true;
		mentalSession.paused=false;
		mentalSession.score=0;
		mentalSession.total=0;
		mentalSession.timeLeft=settings.timerSeconds;
		mentalSession.unlimited=elemUnlimitedToggle?.checked||false;
		mentalSession.questionsRemaining=settings.maxQuestions;
		mentalSession.startTime=Date.now();
		if(elemTimerDisplay) elemTimerDisplay.textContent=`00:${mentalSession.timeLeft<10?"0"+mentalSession.timeLeft:mentalSession.timeLeft}`;
		if(elemScoreDisplay) elemScoreDisplay.textContent="0 / 0";
		if(elemStatisticsPanel) elemStatisticsPanel.style.display="flex";
		if(elemStartSessionBtn) elemStartSessionBtn.textContent="End Session";
		if(elemPauseSessionBtn) elemPauseSessionBtn.classList.remove("hidden");
		if(elemSkipQuestionBtn) elemSkipQuestionBtn.classList.remove("hidden");
		updateStatistics();
		mentalSession.timerInterval=window.setInterval(()=>{
			if(!mentalSession.active||mentalSession.paused) return;
			if(mentalSession.timeLeft<=0){
				endMentalSession();
				showResult(false,"Time's up!","Session ended.");
			}
			else{
				mentalSession.timeLeft--;
				if(elemTimerDisplay) elemTimerDisplay.textContent=`00:${mentalSession.timeLeft<10?"0"+mentalSession.timeLeft:mentalSession.timeLeft}`;
				if(elemMentalProgressBar){
					let progress=(mentalSession.total/mentalSession.questionsRemaining)*100;
					if(mentalSession.unlimited) progress=0;
					elemMentalProgressBar.style.width=Math.min(100,progress)+"%";
				}
			}
		},1000);
		generateNextMentalQuestion();
	};
	const endMentalSession=()=>{
		if(mentalSession.timerInterval){
			clearInterval(mentalSession.timerInterval);
			mentalSession.timerInterval=null;
		}
		mentalSession.active=false;
		mentalSession.paused=false;
		if(elemStartSessionBtn) elemStartSessionBtn.textContent="Start Session";
		if(elemPauseSessionBtn) elemPauseSessionBtn.classList.add("hidden");
		if(elemSkipQuestionBtn) elemSkipQuestionBtn.classList.add("hidden");
		if(elemStatisticsPanel) elemStatisticsPanel.style.display="none";
		if(elemCopyAnswerBtn) elemCopyAnswerBtn.classList.add("hidden");
	};
	const generateNextMentalQuestion=()=>{
		if(!mentalSession.active) return;
		let topicId=activeTopicId;
		if(elemMentalShuffleToggle?.checked){
			let topics=Object.keys(generatorRegistry);
			const scopeVal=elemMentalScopeSelect?.value||"all";
			if(scopeVal!=="all"){
				topics=topics.filter(t=>getScopeFromTopicId(t)===scopeVal);
			}
			if(topics.length) topicId=topics[Math.floor(Math.random()*topics.length)];
		}
		if(!topicId||!generatorRegistry[topicId]) topicId=Object.keys(generatorRegistry)[0];
		if(!topicId) return;
		const options:GenerateOptions={
			difficulty:currentDifficulty,
			forceMcq:mcqMode,
			seed:Date.now(),
		};
		try{
			const newQuestion=generatorRegistry[topicId](options);
			currentQuestion=newQuestion;
			displayQuestion(newQuestion);
		}
		catch(e){}
	};
	// Keyboard shortcuts
	const handleKeydown=(e:KeyboardEvent)=>{
		if(e.ctrlKey&&e.key==='g'){
			e.preventDefault();
			generateNewQuestion();
		}
		else if(e.shiftKey&&e.key==='Enter'){
			e.preventDefault();
			if(elemCheckBtn&&!elemCheckBtn.disabled) checkAnswer();
		}
		else if(e.ctrlKey&&e.key==='1'){
			e.preventDefault();
			setMode("single");
		}
		else if(e.ctrlKey&&e.key==='2'){
			e.preventDefault();
			setMode("mental");
		}
		else if(e.ctrlKey&&e.key===','){
			e.preventDefault();
			elemSettingsModal.classList.add("show");
		}
		else if(e.ctrlKey&&e.shiftKey&&e.key==='T'){
			e.preventDefault();
			const newTheme=document.documentElement.classList.contains("dark")?"light":"dark";
			settings.theme=newTheme as"light"|"dark";
			applyTheme(settings.theme);
			saveSettings();
		}
	};
	document.addEventListener("keydown",handleKeydown);
	// Event listeners
	elemModeSingleBtn?.addEventListener("click",()=>setMode("single"));
	elemModeMentalBtn?.addEventListener("click",()=>setMode("mental"));
	elemGenerateBtn?.addEventListener("click",generateNewQuestion);
	elemCheckBtn?.addEventListener("click",checkAnswer);
	elemClearAnswerBtn?.addEventListener("click",()=>{
		if(elemAnswerBox) elemAnswerBox.value="";
		elemAnswerBox?.focus();
		if(elemPhysicsPreview){
			elemPhysicsPreview.textContent="";
			elemPhysicsPreview.classList.remove("has-content");
		}
	});
	elemAnswerBox?.addEventListener("input",()=>{
		if(elemPhysicsPreview) elemPhysicsPreview.textContent=elemAnswerBox.value;
		if(elemPhysicsPreview.textContent) elemPhysicsPreview.classList.add("has-content");
		else elemPhysicsPreview.classList.remove("has-content");
	});
	elemThemeToggle?.addEventListener("click",()=>{
		const newTheme=document.documentElement.classList.contains("dark")?"light":"dark";
		settings.theme=newTheme as"light"|"dark";
		applyTheme(settings.theme);
		saveSettings();
	});
	elemSettingsBtn?.addEventListener("click",()=>elemSettingsModal?.classList.add("show"));
	elemSettingsClose?.addEventListener("click",()=>elemSettingsModal?.classList.remove("show"));
	elemSettingsSave?.addEventListener("click",()=>{
		const themeSel=document.getElementById("settings-theme")as HTMLSelectElement;
		if(themeSel) settings.theme=themeSel.value as any;
		const defaultModeSel=document.getElementById("settings-default-mode")as HTMLSelectElement;
		if(defaultModeSel) settings.defaultMode=defaultModeSel.value as any;
		const autoCont=document.getElementById("settings-auto-continue")as HTMLInputElement;
		if(autoCont) settings.autoContinue=autoCont.checked;
		const shuffleCh=document.getElementById("settings-shuffle")as HTMLInputElement;
		if(shuffleCh) settings.shuffle=shuffleCh.checked;
		const scopeSel=document.getElementById("settings-scope")as HTMLSelectElement;
		if(scopeSel) settings.defaultScope=scopeSel.value;
		const notif=document.getElementById("settings-notifications")as HTMLInputElement;
		if(notif) settings.notifications=notif.checked;
		const diff=document.getElementById("settings-difficulty")as HTMLSelectElement;
		if(diff) settings.difficulty=diff.value as any;
		const timer=document.getElementById("settings-timer")as HTMLInputElement;
		if(timer) settings.timerSeconds=parseInt(timer.value);
		const maxQ=document.getElementById("settings-max-questions")as HTMLInputElement;
		if(maxQ) settings.maxQuestions=parseInt(maxQ.value);
		const delay=document.getElementById("settings-auto-check-delay")as HTMLInputElement;
		if(delay) settings.autoCheckDelayMs=parseInt(delay.value);
		const dec=document.getElementById("settings-decimal-places")as HTMLInputElement;
		if(dec) settings.decimalPlaces=parseInt(dec.value);
		const snd=document.getElementById("settings-sound")as HTMLInputElement;
		if(snd) settings.sound=snd.checked;
		const vib=document.getElementById("settings-vibration")as HTMLInputElement;
		if(vib) settings.vibration=vib.checked;
		const mcqCh=document.getElementById("settings-mcq-choices")as HTMLInputElement;
		if(mcqCh) settings.mcqChoices=parseInt(mcqCh.value);
		const perf=document.getElementById("settings-perf-master")as HTMLInputElement;
		if(perf) settings.performanceMode=perf.checked;
		const wave=document.getElementById("settings-perf-wave")as HTMLInputElement;
		if(wave) settings.waveBackground=wave.checked;
		const blur=document.getElementById("settings-perf-blur")as HTMLInputElement;
		if(blur) settings.blurEffect=blur.checked;
		saveSettings();
		elemSettingsModal?.classList.remove("show");
	});
	elemSettingsTabBasic?.addEventListener("click",()=>{
		elemSettingsTabBasic.classList.add("active");
		elemSettingsTabAdvanced.classList.remove("active");
		elemSettingsBasicPanel?.classList.remove("hidden");
		elemSettingsAdvancedPanel?.classList.add("hidden");
	});
	elemSettingsTabAdvanced?.addEventListener("click",()=>{
		elemSettingsTabAdvanced.classList.add("active");
		elemSettingsTabBasic.classList.remove("active");
		elemSettingsAdvancedPanel?.classList.remove("hidden");
		elemSettingsBasicPanel?.classList.add("hidden");
	});
	elemShortcutsBtn?.addEventListener("click",()=>elemShortcutsModal?.classList.add("show"));
	elemShortcutsClose?.addEventListener("click",()=>elemShortcutsModal?.classList.remove("show"));
	elemShortcutsGotit?.addEventListener("click",()=>elemShortcutsModal?.classList.remove("show"));
	elemHelpBtn?.addEventListener("click",()=>elemOnboardingOverlay?.classList.add("show"));
	elemOnboardingClose?.addEventListener("click",()=>elemOnboardingOverlay?.classList.remove("show"));
	elemOnboardingGotit?.addEventListener("click",()=>{
		elemOnboardingOverlay?.classList.remove("show");
		localStorage.setItem("onboardingSeen","true");
	});
	elemAutoContinueToggle?.addEventListener("change",(e)=>autoContinue=(e.target as HTMLInputElement).checked);
	elemShuffleToggle?.addEventListener("change",(e)=>shuffleMode=(e.target as HTMLInputElement).checked);
	elemMcqToggle?.addEventListener("change",(e)=>mcqMode=(e.target as HTMLInputElement).checked);
	elemScopeSelect?.addEventListener("change",(e)=>{
		currentScope=(e.target as HTMLSelectElement).value;
		rebuildTopicPills();
	});
	elemDifficultySelect?.addEventListener("change",(e)=>currentDifficulty=(e.target as HTMLSelectElement).value as any);
	elemStartSessionBtn?.addEventListener("click",()=>{
		if(mentalSession.active) endMentalSession();
		else startMentalSession();
	});
	elemPauseSessionBtn?.addEventListener("click",()=>{
		if(!mentalSession.active) return;
		mentalSession.paused=!mentalSession.paused;
		elemPauseSessionBtn.innerHTML=mentalSession.paused?"▶":"⏸";
	});
	elemSkipQuestionBtn?.addEventListener("click",()=>{
		if(!mentalSession.active) return;
		generateNextMentalQuestion();
	});
	elemCopyAnswerBtn?.addEventListener("click",()=>{
		const correctText=elemResultsDiv?.querySelector(".result-error p")?.textContent?.replace("Correct answer: ","")||"";
		if(correctText) navigator.clipboard.writeText(correctText);
	});
	elemPhysicsToolbarBtns.forEach(btn=>{
		btn.addEventListener("click",()=>{
			const symbol=btn.getAttribute("data-symbol")||"";
			const template=btn.getAttribute("data-template");
			if(!elemAnswerBox) return;
			const start=elemAnswerBox.selectionStart||0;
			const end=elemAnswerBox.selectionEnd||0;
			let insert=symbol;
			if(template) insert=template;
			const newValue=elemAnswerBox.value.substring(0,start)+insert+elemAnswerBox.value.substring(end);
			elemAnswerBox.value=newValue;
			elemAnswerBox.focus();
			const newPos=start+insert.length;
			elemAnswerBox.setSelectionRange(newPos,newPos);
			if(elemPhysicsPreview) elemPhysicsPreview.textContent=newValue;
		});
	});
	elemDropdownBtn?.addEventListener("click",(e)=>{
		e.stopPropagation();
		elemPhysicsDropdown?.classList.toggle("show");
	});
	document.addEventListener("click",(e)=>{
		if(!elemPhysicsDropdown?.contains(e.target as Node)&&e.target!==elemDropdownBtn){
			elemPhysicsDropdown?.classList.remove("show");
		}
	});
	// Initialize
	loadSettings();
	populateScopeSelects();
	rebuildTopicPills();
	if(!localStorage.getItem("onboardingSeen")&&elemOnboardingOverlay){
		elemOnboardingOverlay.classList.add("show");
	}
});