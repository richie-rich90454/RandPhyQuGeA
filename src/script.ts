import { Question, GenerateOptions, GeneratorRegistry, AppSettings, MentalSession, SeededRandom, GeneratorFn } from "./types.js";

/**
 * Main entry point: sets up all event listeners, loads settings,
 * registers every topic generator (covering all learning objectives),
 * and provides full exam‑ready question generation for Single and Mental modes.
 */
document.addEventListener("DOMContentLoaded",()=>{
	// ========== DOM ELEMENTS ==========
	let elemModeSingleBtn=document.getElementById("mode-single")as HTMLButtonElement|null;
	let elemModeMentalBtn=document.getElementById("mode-mental")as HTMLButtonElement|null;
	let elemSingleControls=document.getElementById("single-controls")as HTMLDivElement|null;
	let elemMentalControls=document.getElementById("mental-controls")as HTMLDivElement|null;
	let elemTopicSearch=document.getElementById("topic-search")as HTMLInputElement|null;
	let elemTopicGrid=document.getElementById("topic-grid")as HTMLDivElement|null;
	let elemGenerateBtn=document.getElementById("genQ")as HTMLButtonElement|null;
	let elemCheckBtn=document.getElementById("check-answer")as HTMLButtonElement|null;
	let elemAnswerBox=document.getElementById("answer-box")as HTMLTextAreaElement|null;
	let elemClearAnswerBtn=document.getElementById("clear-answer")as HTMLButtonElement|null;
	let elemThemeToggle=document.getElementById("theme-toggle")as HTMLButtonElement|null;
	let elemSettingsModal=document.getElementById("settings-modal")as HTMLDivElement|null;
	let elemSettingsClose=document.getElementById("settings-close")as HTMLButtonElement|null;
	let elemSettingsSave=document.getElementById("settings-save")as HTMLButtonElement|null;
	let elemShortcutsModal=document.getElementById("shortcuts-modal")as HTMLDivElement|null;
	let elemShortcutsClose=document.getElementById("shortcuts-close")as HTMLButtonElement|null;
	let elemShortcutsGotit=document.getElementById("shortcuts-gotit")as HTMLButtonElement|null;
	let elemShortcutsBtn=document.getElementById("shortcuts-button")as HTMLButtonElement|null;
	let elemHelpBtn=document.getElementById("help-button")as HTMLButtonElement|null;
	let elemOnboardingOverlay=document.getElementById("onboarding-overlay")as HTMLDivElement|null;
	let elemOnboardingClose=document.getElementById("onboarding-close")as HTMLButtonElement|null;
	let elemOnboardingGotit=document.getElementById("onboarding-gotit")as HTMLButtonElement|null;
	let elemSettingsBtn=document.getElementById("settings-button")as HTMLButtonElement|null;
	let elemSettingsTabBasic=document.getElementById("settings-tab-basic")as HTMLButtonElement|null;
	let elemSettingsTabAdvanced=document.getElementById("settings-tab-advanced")as HTMLButtonElement|null;
	let elemSettingsBasicPanel=document.getElementById("settings-basic")as HTMLDivElement|null;
	let elemSettingsAdvancedPanel=document.getElementById("settings-advanced")as HTMLDivElement|null;
	let elemAutoContinueToggle=document.getElementById("autocontinue-toggle")as HTMLInputElement|null;
	let elemShuffleToggle=document.getElementById("shuffle-toggle")as HTMLInputElement|null;
	let elemMcqToggle=document.getElementById("mcq-toggle")as HTMLInputElement|null;
	let elemScopeSelect=document.getElementById("scope-select")as HTMLSelectElement|null;
	let elemStartSessionBtn=document.getElementById("start-session")as HTMLButtonElement|null;
	let elemMentalScopeSelect=document.getElementById("mental-scope-select")as HTMLSelectElement|null;
	let elemMentalShuffleToggle=document.getElementById("mental-shuffle-toggle")as HTMLInputElement|null;
	let elemUnlimitedToggle=document.getElementById("unlimited-toggle")as HTMLInputElement|null;
	let elemDifficultySelect=document.getElementById("difficulty-select")as HTMLSelectElement|null;
	let elemTimerDisplay=document.getElementById("timer-display")as HTMLSpanElement|null;
	let elemScoreDisplay=document.getElementById("score-display")as HTMLSpanElement|null;
	let elemPauseSessionBtn=document.getElementById("pause-session")as HTMLButtonElement|null;
	let elemSkipQuestionBtn=document.getElementById("skip-question")as HTMLButtonElement|null;
	let elemMentalProgressBar=document.getElementById("mental-progress-bar")as HTMLDivElement|null;
	let elemStatisticsPanel=document.getElementById("statistics-panel")as HTMLDivElement|null;
	let elemAccuracyStat=document.getElementById("accuracy-stat")as HTMLSpanElement|null;
	let elemAvgTimeStat=document.getElementById("avg-time-stat")as HTMLSpanElement|null;
	let elemQuestionArea=document.getElementById("question-area")as HTMLDivElement|null;
	let elemCurrentTopicSpan=document.getElementById("current-topic")as HTMLDivElement|null;
	let elemResultsDiv=document.getElementById("answer-results")as HTMLDivElement|null;
	let elemCopyAnswerBtn=document.getElementById("copy-answer")as HTMLButtonElement|null;
	let elemMcqChoicesContainer=document.getElementById("mcq-choices-container")as HTMLDivElement|null;
	let elemPhysicsPreview=document.getElementById("physics-preview")as HTMLDivElement|null;
	let elemExpectedFormatDiv=document.getElementById("expected-format")as HTMLDivElement|null;
	let elemPhysicsToolbarBtns=document.querySelectorAll(".physics-toolbar-btn[data-symbol]");
	let elemDropdownBtn=document.getElementById("physics-dropdown-btn")as HTMLButtonElement|null;
	let elemPhysicsDropdown=document.getElementById("physics-dropdown")as HTMLDivElement|null;

	// ========== STATE VARIABLES ==========
	let objCurrentQuestion: Question|null=null;
	let strActiveTopicId: string|null=null;
	let strCurrentDifficulty: "easy"|"medium"|"hard"="medium";
	let boolMcqMode=false;
	let boolAutoContinue=false;
	let boolShuffleMode=false;
	let strCurrentScope="all";
	let boolMentalModeActive=false;
	let objMentalSession: MentalSession={
		active: false,
		paused: false,
		score: 0,
		total: 0,
		timeLeft: 30,
		timerInterval: null,
		questionsRemaining: 5,
		unlimited: false,
		startTime: 0
	};
	let objSettings: AppSettings={
		theme: "system",
		defaultMode: "single",
		autoContinue: false,
		shuffle: false,
		defaultScope: "all",
		notifications: true,
		difficulty: "medium",
		timerSeconds: 30,
		maxQuestions: 5,
		autoCheckDelayMs: 800,
		decimalPlaces: 2,
		sound: false,
		vibration: false,
		mcqChoices: 4,
		performanceMode: false,
		waveBackground: true,
		blurEffect: true
	};
	let mapGeneratorRegistry: GeneratorRegistry={};

	// ========== HELPER FUNCTIONS ==========
	/** Updates UI based on current mode (single/mental). */
	function setMode(strMode: "single"|"mental"): void{
		if (strMode==="single"){
			elemModeSingleBtn?.classList.add("active");
			elemModeMentalBtn?.classList.remove("active");
			elemSingleControls?.classList.remove("hidden");
			elemMentalControls?.classList.add("hidden");
		}
		else{
			elemModeMentalBtn?.classList.add("active");
			elemModeSingleBtn?.classList.remove("active");
			elemMentalControls?.classList.remove("hidden");
			elemSingleControls?.classList.add("hidden");
		}
	}
	/** Applies the selected theme (light/dark/system). */
	function applyTheme(strTheme: "light"|"dark"|"system"): void{
		let elemRoot=document.documentElement;
		if (strTheme==="system"){
			elemRoot.classList.remove("light","dark");
		}
		else if (strTheme==="dark"){
			elemRoot.classList.remove("light");
			elemRoot.classList.add("dark");
		}
		else{
			elemRoot.classList.remove("dark");
			elemRoot.classList.add("light");
		}
		localStorage.setItem("theme",strTheme);
	}
	/** Loads all settings from localStorage and applies them. */
	function loadSettings(): void{
		let strSaved=localStorage.getItem("physicsSettings");
		if (strSaved){
			try{
				let objParsed=JSON.parse(strSaved);
				objSettings={...objSettings,...objParsed};
			}
			catch(e){}
		}
		applyTheme(objSettings.theme);
		let elemThemeSelect=document.getElementById("settings-theme")as HTMLSelectElement|null;
		if (elemThemeSelect) elemThemeSelect.value=objSettings.theme;
		let elemDefaultModeSelect=document.getElementById("settings-default-mode")as HTMLSelectElement|null;
		if (elemDefaultModeSelect) elemDefaultModeSelect.value=objSettings.defaultMode;
		let elemAutoContCheck=document.getElementById("settings-auto-continue")as HTMLInputElement|null;
		if (elemAutoContCheck) elemAutoContCheck.checked=objSettings.autoContinue;
		let elemShuffleCheck=document.getElementById("settings-shuffle")as HTMLInputElement|null;
		if (elemShuffleCheck) elemShuffleCheck.checked=objSettings.shuffle;
		let elemScopeSelectSetting=document.getElementById("settings-scope")as HTMLSelectElement|null;
		if (elemScopeSelectSetting) elemScopeSelectSetting.value=objSettings.defaultScope;
		let elemNotifCheck=document.getElementById("settings-notifications")as HTMLInputElement|null;
		if (elemNotifCheck) elemNotifCheck.checked=objSettings.notifications;
		let elemDifficultySetting=document.getElementById("settings-difficulty")as HTMLSelectElement|null;
		if (elemDifficultySetting) elemDifficultySetting.value=objSettings.difficulty;
		let elemTimerSetting=document.getElementById("settings-timer")as HTMLInputElement|null;
		if (elemTimerSetting) elemTimerSetting.value=objSettings.timerSeconds.toString();
		let elemMaxQSetting=document.getElementById("settings-max-questions")as HTMLInputElement|null;
		if (elemMaxQSetting) elemMaxQSetting.value=objSettings.maxQuestions.toString();
		let elemAutoCheckDelay=document.getElementById("settings-auto-check-delay")as HTMLInputElement|null;
		if (elemAutoCheckDelay) elemAutoCheckDelay.value=objSettings.autoCheckDelayMs.toString();
		let elemDecimalPlacesSetting=document.getElementById("settings-decimal-places")as HTMLInputElement|null;
		if (elemDecimalPlacesSetting) elemDecimalPlacesSetting.value=objSettings.decimalPlaces.toString();
		let elemSoundSetting=document.getElementById("settings-sound")as HTMLInputElement|null;
		if (elemSoundSetting) elemSoundSetting.checked=objSettings.sound;
		let elemVibrationSetting=document.getElementById("settings-vibration")as HTMLInputElement|null;
		if (elemVibrationSetting) elemVibrationSetting.checked=objSettings.vibration;
		let elemMcqChoicesSetting=document.getElementById("settings-mcq-choices")as HTMLInputElement|null;
		if (elemMcqChoicesSetting) elemMcqChoicesSetting.value=objSettings.mcqChoices.toString();
		let elemPerfMaster=document.getElementById("settings-perf-master")as HTMLInputElement|null;
		if (elemPerfMaster) elemPerfMaster.checked=objSettings.performanceMode;
		let elemPerfWave=document.getElementById("settings-perf-wave")as HTMLInputElement|null;
		if (elemPerfWave) elemPerfWave.checked=objSettings.waveBackground;
		let elemPerfBlur=document.getElementById("settings-perf-blur")as HTMLInputElement|null;
		if (elemPerfBlur) elemPerfBlur.checked=objSettings.blurEffect;
		boolAutoContinue=objSettings.autoContinue;
		boolShuffleMode=objSettings.shuffle;
		strCurrentDifficulty=objSettings.difficulty;
		strCurrentScope=objSettings.defaultScope;
		if (elemAutoContinueToggle) elemAutoContinueToggle.checked=boolAutoContinue;
		if (elemShuffleToggle) elemShuffleToggle.checked=boolShuffleMode;
		if (elemScopeSelect) elemScopeSelect.value=strCurrentScope;
		if (elemDifficultySelect) elemDifficultySelect.value=strCurrentDifficulty;
		setMode(objSettings.defaultMode);
	}
	/** Saves current settings to localStorage and updates runtime flags. */
	function saveSettings(): void{
		localStorage.setItem("physicsSettings",JSON.stringify(objSettings));
		boolAutoContinue=objSettings.autoContinue;
		boolShuffleMode=objSettings.shuffle;
		strCurrentDifficulty=objSettings.difficulty;
		strCurrentScope=objSettings.defaultScope;
		if (elemAutoContinueToggle) elemAutoContinueToggle.checked=boolAutoContinue;
		if (elemShuffleToggle) elemShuffleToggle.checked=boolShuffleMode;
		if (elemScopeSelect) elemScopeSelect.value=strCurrentScope;
		if (elemDifficultySelect) elemDifficultySelect.value=strCurrentDifficulty;
		applyTheme(objSettings.theme);
	}
	/** Updates the statistics panel (accuracy and average time). */
	function updateStatistics(): void{
		if (!elemAccuracyStat || !elemAvgTimeStat) return;
		let numTotal=objMentalSession.total;
		if (numTotal===0){
			elemAccuracyStat.textContent="Accuracy: 0%";
			elemAvgTimeStat.textContent="Avg: 0.0s";
			return;
		}
		let numAccuracy=(objMentalSession.score/numTotal)*100;
		let numElapsed=(Date.now()-objMentalSession.startTime)/1000;
		let numAvgTime=numElapsed/numTotal;
		elemAccuracyStat.textContent=`Accuracy: ${numAccuracy.toFixed(1)}%`;
		elemAvgTimeStat.textContent=`Avg: ${numAvgTime.toFixed(1)}s`;
	}
	/** Displays a question object in the UI, including MCQ buttons if applicable. */
	function displayQuestion(objQ: Question): void{
		if (!elemQuestionArea) return;
		elemQuestionArea.innerHTML=`<div class="math">${objQ.text}</div>`;
		if (elemCurrentTopicSpan) elemCurrentTopicSpan.textContent=objQ.topicName;
		if (boolMcqMode && objQ.choices && objQ.choices.length>0 && elemMcqChoicesContainer){
			elemMcqChoicesContainer.style.display="flex";
			elemMcqChoicesContainer.innerHTML=objQ.choices.map(strC=>`<button class="choice-button" data-value="${strC.replace(/"/g,"&quot;")}">${strC}</button>`).join("");
			let arrChoiceButtons=elemMcqChoicesContainer.querySelectorAll(".choice-button");
			arrChoiceButtons.forEach(btn=>{
				btn.addEventListener("click",()=>{
					arrChoiceButtons.forEach(b=>b.classList.remove("selected"));
					btn.classList.add("selected");
					if (elemAnswerBox) elemAnswerBox.value=btn.getAttribute("data-value")||"";
				});
			});
		}
		else if (elemMcqChoicesContainer){
			elemMcqChoicesContainer.style.display="none";
		}
		if (elemAnswerBox){
			elemAnswerBox.disabled=false;
			elemAnswerBox.value="";
			elemAnswerBox.focus();
		}
		if (elemCheckBtn) elemCheckBtn.disabled=false;
		if (elemPhysicsPreview){
			elemPhysicsPreview.textContent="";
			elemPhysicsPreview.classList.remove("has-content");
		}
		if (elemExpectedFormatDiv){
			if (objQ.unit) elemExpectedFormatDiv.textContent=`Expected format: numeric value with units (${objQ.unit}). Use ^ for exponents.`;
			else elemExpectedFormatDiv.textContent="Enter your answer as a number or expression. Use ^ for exponents.";
		}
	}
	/** Shows a result message (correct/incorrect) with the correct answer. */
	function showResult(boolIsCorrect: boolean, strCorrectAnswer: string, strExplanation?: string): void{
		if (!elemResultsDiv) return;
		if (boolIsCorrect){
			elemResultsDiv.innerHTML=`<div class="result-success"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg><div><h3>Correct!</h3><p>${strExplanation || "Great job!"}</p></div></div>`;
			elemResultsDiv.classList.add("correct");
			elemResultsDiv.classList.remove("incorrect");
		}
		else{
			elemResultsDiv.innerHTML=`<div class="result-error"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg><div><h3>Incorrect</h3><p>Correct answer: ${strCorrectAnswer}</p>${strExplanation?`<p>${strExplanation}</p>`:""}</div></div>`;
			elemResultsDiv.classList.add("incorrect");
			elemResultsDiv.classList.remove("correct");
		}
	}
	/** Checks the user's answer against the current question with tolerance for numeric types. */
	function checkAnswer(): void{
		if (!objCurrentQuestion || !elemAnswerBox) return;
		let strUserAnswer=elemAnswerBox.value.trim();
		if (boolMcqMode && objCurrentQuestion.choices){
			let elemSelected=document.querySelector(".choice-button.selected")as HTMLButtonElement|null;
			if (elemSelected) strUserAnswer=elemSelected.dataset.value||"";
		}
		let boolIsCorrect=false;
		if (objCurrentQuestion.answerType==="numeric"){
			let numUser=parseFloat(strUserAnswer);
			let numCorrect=parseFloat(objCurrentQuestion.answer);
			let numTolerance=Math.pow(10,-objSettings.decimalPlaces);
			boolIsCorrect=!isNaN(numUser) && !isNaN(numCorrect) && Math.abs(numUser-numCorrect)<=numTolerance;
		}
		else{
			boolIsCorrect=strUserAnswer.toLowerCase()===objCurrentQuestion.answer.toLowerCase();
		}
		showResult(boolIsCorrect,objCurrentQuestion.answer,objCurrentQuestion.answerType==="numeric"?`Accepted tolerance: ±${Math.pow(10,-objSettings.decimalPlaces)}`:"");
		if (boolMentalModeActive && objMentalSession.active && !objMentalSession.paused){
			if (boolIsCorrect) objMentalSession.score++;
			objMentalSession.total++;
			if (elemScoreDisplay) elemScoreDisplay.textContent=`${objMentalSession.score} / ${objMentalSession.total}`;
			updateStatistics();
			if (!objMentalSession.unlimited && objMentalSession.total>=objMentalSession.questionsRemaining){
				endMentalSession();
			}
			else{
				generateNextMentalQuestion();
			}
		}
	}
	/** Generates a new question using the current active topic, shuffle, and scope. */
	function generateNewQuestion(): void{
		if (!mapGeneratorRegistry || Object.keys(mapGeneratorRegistry).length===0){
			console.warn("No generators registered yet");
			return;
		}
		let strTopicId=strActiveTopicId;
		if (boolShuffleMode){
			let arrTopics=Object.keys(mapGeneratorRegistry);
			if (strCurrentScope!=="all"){
				let arrFiltered=arrTopics.filter(t=>t.startsWith(strCurrentScope));
				if (arrFiltered.length>0) arrTopics=arrFiltered;
			}
			strTopicId=arrTopics[Math.floor(Math.random()*arrTopics.length)];
		}
		if (!strTopicId || !mapGeneratorRegistry[strTopicId]){
			if (strActiveTopicId && mapGeneratorRegistry[strActiveTopicId]) strTopicId=strActiveTopicId;
			else{
				let strFirstKey=Object.keys(mapGeneratorRegistry)[0];
				if (strFirstKey) strTopicId=strFirstKey;
				else return;
			}
		}
		let objGenOptions: GenerateOptions={
			difficulty: strCurrentDifficulty,
			forceMcq: boolMcqMode,
			seed: Date.now()
		};
		try{
			let objNewQuestion=mapGeneratorRegistry[strTopicId](objGenOptions);
			objCurrentQuestion=objNewQuestion;
			displayQuestion(objNewQuestion);
			if (boolAutoContinue){
				setTimeout(()=>{
					if (objCurrentQuestion) checkAnswer();
				},objSettings.autoCheckDelayMs);
			}
		}
		catch(e){
			console.error("Generator error",e);
		}
	}
	/** Starts a mental mode session (timer, score reset, etc.). */
	function startMentalSession(): void{
		if (objMentalSession.active) endMentalSession();
		objMentalSession.active=true;
		objMentalSession.paused=false;
		objMentalSession.score=0;
		objMentalSession.total=0;
		objMentalSession.timeLeft=objSettings.timerSeconds;
		objMentalSession.unlimited=elemUnlimitedToggle?.checked||false;
		objMentalSession.questionsRemaining=objSettings.maxQuestions;
		objMentalSession.startTime=Date.now();
		if (elemTimerDisplay) elemTimerDisplay.textContent=`00:${objMentalSession.timeLeft<10?"0"+objMentalSession.timeLeft:objMentalSession.timeLeft}`;
		if (elemScoreDisplay) elemScoreDisplay.textContent="0 / 0";
		if (elemStatisticsPanel) elemStatisticsPanel.style.display="flex";
		if (elemStartSessionBtn) elemStartSessionBtn.textContent="End Session";
		if (elemPauseSessionBtn) elemPauseSessionBtn.classList.remove("hidden");
		if (elemSkipQuestionBtn) elemSkipQuestionBtn.classList.remove("hidden");
		updateStatistics();
		objMentalSession.timerInterval=window.setInterval(()=>{
			if (!objMentalSession.active || objMentalSession.paused) return;
			if (objMentalSession.timeLeft<=0){
				endMentalSession();
				showResult(false,"Time's up!","Session ended.");
			}
			else{
				objMentalSession.timeLeft--;
				if (elemTimerDisplay) elemTimerDisplay.textContent=`00:${objMentalSession.timeLeft<10?"0"+objMentalSession.timeLeft:objMentalSession.timeLeft}`;
				if (elemMentalProgressBar){
					let numProgress=(objMentalSession.total/objMentalSession.questionsRemaining)*100;
					if (objMentalSession.unlimited) numProgress=0;
					elemMentalProgressBar.style.width=Math.min(100,numProgress)+"%";
				}
			}
		},1000);
		generateNextMentalQuestion();
	}
	/** Ends the mental mode session and cleans up the timer. */
	function endMentalSession(): void{
		if (objMentalSession.timerInterval){
			clearInterval(objMentalSession.timerInterval);
			objMentalSession.timerInterval=null;
		}
		objMentalSession.active=false;
		objMentalSession.paused=false;
		if (elemStartSessionBtn) elemStartSessionBtn.textContent="Start Session";
		if (elemPauseSessionBtn) elemPauseSessionBtn.classList.add("hidden");
		if (elemSkipQuestionBtn) elemSkipQuestionBtn.classList.add("hidden");
		if (elemStatisticsPanel) elemStatisticsPanel.style.display="none";
	}
	/** Generates the next question in mental mode (respects shuffle and scope). */
	function generateNextMentalQuestion(): void{
		if (!objMentalSession.active) return;
		let strTopicId=strActiveTopicId;
		if (elemMentalShuffleToggle?.checked){
			let arrTopics=Object.keys(mapGeneratorRegistry);
			let strScopeValue=elemMentalScopeSelect?.value||"all";
			if (strScopeValue!=="all"){
				let arrFiltered=arrTopics.filter(t=>t.startsWith(strScopeValue));
				if (arrFiltered.length>0) arrTopics=arrFiltered;
			}
			strTopicId=arrTopics[Math.floor(Math.random()*arrTopics.length)];
		}
		if (!strTopicId || !mapGeneratorRegistry[strTopicId]) strTopicId=Object.keys(mapGeneratorRegistry)[0];
		if (!strTopicId) return;
		let objGenOptions: GenerateOptions={
			difficulty: strCurrentDifficulty,
			forceMcq: boolMcqMode,
			seed: Date.now()
		};
		try{
			let objNewQuestion=mapGeneratorRegistry[strTopicId](objGenOptions);
			objCurrentQuestion=objNewQuestion;
			displayQuestion(objNewQuestion);
		}
		catch(e){}
	}
	/** Registers a generator function for a given topic ID and reveals its pill. */
	function registerGenerator(strTopicId: string, fnGenerator: GeneratorFn): void{
		mapGeneratorRegistry[strTopicId]=fnGenerator;
		let elemPill=document.querySelector(`.topic-pill[data-topic="${strTopicId}"]`);
		if (elemPill) elemPill.classList.remove("hidden");
	}
	/** Initializes topic pills and search filter. */
	function initTopics(): void{
		if (!elemTopicGrid) return;
		let arrPills=elemTopicGrid.querySelectorAll(".topic-pill");
		arrPills.forEach(elemPill=>{
			let strTopic=elemPill.getAttribute("data-topic");
			if (strTopic && !mapGeneratorRegistry[strTopic]) elemPill.classList.add("hidden");
			elemPill.addEventListener("click",()=>{
				let strTopicId=elemPill.getAttribute("data-topic");
				if (strTopicId && mapGeneratorRegistry[strTopicId]){
					strActiveTopicId=strTopicId;
					document.querySelectorAll(".topic-pill").forEach(p=>p.classList.remove("active"));
					elemPill.classList.add("active");
					if (elemGenerateBtn) elemGenerateBtn.disabled=false;
				}
			});
		});
		if (elemTopicSearch){
			elemTopicSearch.addEventListener("input",(e)=>{
				let strTerm=(e.target as HTMLInputElement).value.toLowerCase();
				arrPills.forEach(elemPill=>{
					let strText=elemPill.textContent?.toLowerCase()||"";
					if (strText.includes(strTerm)) (elemPill as HTMLElement).style.display="flex";
					else (elemPill as HTMLElement).style.display="none";
				});
			});
		}
	}

	// ========== GENERATORS FOR EVERY TOPIC ==========
	registerGenerator("1.1_scalars_vectors_1d",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numA=rng.nextInt(1,20);
		let numB=rng.nextInt(1,20);
		let strQuestion=`A car travels ${numA} m east, then ${numB} m west. What is the magnitude of its displacement?`;
		let numAnswer=Math.abs(numA-numB);
		let arrChoices=[numAnswer.toString(),(numA+numB).toString(),(numA).toString(),(numB).toString()];
		arrChoices.sort(()=>rng.nextFloat()-0.5);
		return{
			id: `1.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "1.1_scalars_vectors_1d",
			topicName: "Scalars and Vectors (1D)",
			text: strQuestion,
			answer: numAnswer.toString(),
			answerType: "numeric",
			unit: "m",
			choices: options.forceMcq?arrChoices:undefined,
			difficulty: options.difficulty,
			questionType: "MC"
		};
	});
	registerGenerator("1.2_displacement_velocity_acceleration",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numInitialSpeed=rng.nextInt(10,30);
		let strQuestion=`A ball is thrown straight upward with initial speed ${numInitialSpeed} m/s. At the top of its path, (a) is its velocity zero? (b) is its acceleration zero? Make a claim and use kinematics to support.`;
		let strAnswer="Velocity is zero; acceleration is g downward (9.8 m/s²).";
		return{
			id: `1.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "1.2_displacement_velocity_acceleration",
			topicName: "Displacement, Velocity, Acceleration",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "QQT"
		};
	});
	registerGenerator("1.3_representing_motion",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numConstantVelocity=rng.nextInt(1,5);
		let strQuestion=`Given the velocity‑time graph (horizontal line at v=+${numConstantVelocity} m/s from t=0 to 5 s), sketch the corresponding position‑time and acceleration‑time graphs.`;
		let strAnswer=`Position‑time: straight line with slope +${numConstantVelocity} m/s. Acceleration‑time: horizontal line at 0 m/s².`;
		return{
			id: `1.3_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "1.3_representing_motion",
			topicName: "Representing Motion",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "TBR"
		};
	});
	registerGenerator("1.4_reference_frames",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numPersonSpeed=rng.nextInt(1,3);
		let numTrainSpeed=rng.nextInt(3,6);
		let strDirection=rng.choice(["east","west"]);
		let strQuestion=`A person walks ${numPersonSpeed} m/s ${strDirection} on a train that moves ${numTrainSpeed} m/s ${strDirection}. What is the person's speed relative to the ground?`;
		let numAnswer=numPersonSpeed+numTrainSpeed;
		let arrChoices=[numAnswer.toString(),Math.abs(numPersonSpeed-numTrainSpeed).toString(),numPersonSpeed.toString(),numTrainSpeed.toString()];
		arrChoices.sort(()=>rng.nextFloat()-0.5);
		return{
			id: `1.4_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "1.4_reference_frames",
			topicName: "Reference Frames & Relative Motion",
			text: strQuestion,
			answer: numAnswer.toString(),
			answerType: "numeric",
			unit: "m/s",
			choices: options.forceMcq?arrChoices:undefined,
			difficulty: options.difficulty,
			questionType: "MC"
		};
	});
	registerGenerator("1.5_vectors_2d_motion",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numHeight=rng.nextInt(1,5);
		let strQuestion=`Design an experiment to determine the launch speed of a projectile using only a meterstick and a stopwatch.`;
		let strAnswer=`Launch horizontally from a known height h = ${numHeight} m. Measure time of flight t with stopwatch. Horizontal range x with meterstick. Then v₀ = x/t.`;
		return{
			id: `1.5_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "1.5_vectors_2d_motion",
			topicName: "Vectors & 2D Motion",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "LAB"
		};
	});
	registerGenerator("2.1_systems_center_of_mass",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numMass1=rng.nextInt(1,5);
		let numMass2=rng.nextInt(1,5);
		let numPos1=rng.nextInt(0,10);
		let numPos2=rng.nextInt(11,20);
		let numAnswer=(numMass1*numPos1+numMass2*numPos2)/(numMass1+numMass2);
		let strQuestion=`Two masses, m₁=${numMass1} kg at x=${numPos1} m and m₂=${numMass2} kg at x=${numPos2} m. Find the center of mass position.`;
		let arrChoices=[numAnswer.toFixed(1),(numAnswer+1).toFixed(1),(numAnswer-1).toFixed(1),(numAnswer*0.5).toFixed(1)];
		arrChoices.sort(()=>rng.nextFloat()-0.5);
		return{
			id: `2.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "2.1_systems_center_of_mass",
			topicName: "Systems & Center of Mass",
			text: strQuestion,
			answer: numAnswer.toFixed(1),
			answerType: "numeric",
			unit: "m",
			choices: options.forceMcq?arrChoices:undefined,
			difficulty: options.difficulty,
			questionType: "MR"
		};
	});
	registerGenerator("2.2_forces_free_body_diagrams",(options: GenerateOptions)=>{
		let strQuestion="Draw a free‑body diagram for a box sliding down a rough incline at constant speed. Label all forces.";
		let strAnswer="Forces: weight (downward), normal (perpendicular to incline), kinetic friction (up the incline).";
		return{
			id: `2.2_${Date.now()}_${Math.floor(Math.random()*1e6)}`,
			topicId: "2.2_forces_free_body_diagrams",
			topicName: "Forces & Free‑Body Diagrams",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "TBR"
		};
	});
	registerGenerator("2.3_newtons_third_law",(options: GenerateOptions)=>{
		let strQuestion="A person pushes against a wall. The wall pushes back with an equal force. Why does the person not accelerate? Make a claim and support with Newton's laws.";
		let strAnswer="The person also experiences a friction force from the ground that balances the wall's push. Net force is zero.";
		return{
			id: `2.3_${Date.now()}_${Math.floor(Math.random()*1e6)}`,
			topicId: "2.3_newtons_third_law",
			topicName: "Newton's Third Law",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "QQT"
		};
	});
	registerGenerator("2.4_newtons_first_law",(options: GenerateOptions)=>{
		let strQuestion="A spacecraft drifts in deep space with engines off. What happens to its motion? (A) It slows down (B) It speeds up (C) It moves at constant velocity (D) It stops";
		let strAnswer="C";
		let arrChoices=["A","B","C","D"];
		return{
			id: `2.4_${Date.now()}_${Math.floor(Math.random()*1e6)}`,
			topicId: "2.4_newtons_first_law",
			topicName: "Newton's First Law",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			choices: arrChoices,
			difficulty: options.difficulty,
			questionType: "MC"
		};
	});
	registerGenerator("2.5_newtons_second_law",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numMass1=rng.nextInt(1,10);
		let numMass2=rng.nextInt(1,10);
		let numAnswer=(numMass2-numMass1)*9.8/(numMass1+numMass2);
		let strQuestion=`Derive an expression for the acceleration of two blocks (m₁=${numMass1} kg, m₂=${numMass2} kg) connected by a massless string over a frictionless pulley. (Assume m₂ heavier)`;
		let strAnswer=`a = (m₂ - m₁)g/(m₁+m₂) = ${numAnswer.toFixed(2)} m/s²`;
		return{
			id: `2.5_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "2.5_newtons_second_law",
			topicName: "Newton's Second Law",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "MR"
		};
	});
	registerGenerator("2.6_gravitational_force",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numRadius=rng.nextInt(1,10)*1e6;
		let strQuestion=`A satellite orbits Earth at radius r = ${numRadius} km. Derive its orbital speed in terms of G, M_Earth, and r.`;
		let strAnswer="v = √(GM/r)";
		return{
			id: `2.6_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "2.6_gravitational_force",
			topicName: "Gravitational Force",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "MR"
		};
	});
	registerGenerator("2.7_friction",(options: GenerateOptions)=>{
		let strQuestion="Determine the coefficient of static friction between a wooden block and a ramp.";
		let strAnswer="Slowly increase ramp angle until block just begins to slip. Measure angle θ. Then μ_s = tanθ.";
		return{
			id: `2.7_${Date.now()}_${Math.floor(Math.random()*1e6)}`,
			topicId: "2.7_friction",
			topicName: "Kinetic & Static Friction",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "LAB"
		};
	});
	registerGenerator("2.8_spring_forces",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numK=rng.nextInt(50,500);
		let numX=rng.nextInt(1,20)/100;
		let numAnswer=numK*numX;
		let strQuestion=`A spring with k = ${numK} N/m is compressed ${numX} m. What force does it exert?`;
		let arrChoices=[numAnswer.toFixed(1),(numAnswer*0.5).toFixed(1),(numAnswer*2).toFixed(1),(numAnswer*1.2).toFixed(1)];
		arrChoices.sort(()=>rng.nextFloat()-0.5);
		return{
			id: `2.8_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "2.8_spring_forces",
			topicName: "Spring Forces",
			text: strQuestion,
			answer: numAnswer.toFixed(1),
			answerType: "numeric",
			unit: "N",
			choices: options.forceMcq?arrChoices:undefined,
			difficulty: options.difficulty,
			questionType: "MR"
		};
	});
	registerGenerator("2.9_circular_motion",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numSpeed=rng.nextInt(10,30);
		let numRadius=rng.nextInt(20,100);
		let strQuestion=`A car rounds a frictionless banked curve of radius ${numRadius} m at speed ${numSpeed} m/s. Derive the ideal banking angle θ.`;
		let strAnswer=`tanθ = v²/(rg) = ${numSpeed*numSpeed/(numRadius*9.8)}`;
		return{
			id: `2.9_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "2.9_circular_motion",
			topicName: "Circular Motion",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "QQT"
		};
	});
	registerGenerator("3.1_kinetic_energy",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numMass=rng.nextInt(1,10);
		let numSpeed=rng.nextInt(1,20);
		let numAnswer=0.5*numMass*numSpeed*numSpeed;
		let strQuestion=`A ${numMass} kg object moves at ${numSpeed} m/s. Its kinetic energy is:`;
		let arrChoices=[numAnswer.toFixed(1),(numAnswer*0.5).toFixed(1),(numAnswer*2).toFixed(1),(numAnswer*1.5).toFixed(1)];
		arrChoices.sort(()=>rng.nextFloat()-0.5);
		return{
			id: `3.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "3.1_kinetic_energy",
			topicName: "Translational Kinetic Energy",
			text: strQuestion,
			answer: numAnswer.toFixed(1),
			answerType: "numeric",
			unit: "J",
			choices: options.forceMcq?arrChoices:undefined,
			difficulty: options.difficulty,
			questionType: "MC"
		};
	});
	registerGenerator("3.2_work",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numForce=rng.nextInt(5,50);
		let numDistance=rng.nextInt(1,5);
		let numAngle=rng.nextInt(0,60);
		let numAnswer=numForce*numDistance*Math.cos(numAngle*Math.PI/180);
		let strQuestion=`A ${numForce} N force pulls a box ${numDistance} m at ${numAngle}° above horizontal. Calculate the work done.`;
		let arrChoices=[numAnswer.toFixed(1),(numAnswer*0.8).toFixed(1),(numAnswer*1.2).toFixed(1),(numAnswer*0.5).toFixed(1)];
		arrChoices.sort(()=>rng.nextFloat()-0.5);
		return{
			id: `3.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "3.2_work",
			topicName: "Work",
			text: strQuestion,
			answer: numAnswer.toFixed(1),
			answerType: "numeric",
			unit: "J",
			choices: options.forceMcq?arrChoices:undefined,
			difficulty: options.difficulty,
			questionType: "MR"
		};
	});
	registerGenerator("3.3_potential_energy",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numMass=rng.nextInt(1,5);
		let strQuestion=`Sketch a graph of gravitational potential energy vs. height for a ${numMass} kg object near Earth's surface.`;
		let strAnswer=`Straight line through origin with slope mg = ${numMass*9.8} J/m.`;
		return{
			id: `3.3_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "3.3_potential_energy",
			topicName: "Potential Energy",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "TBR"
		};
	});
	registerGenerator("3.4_conservation_of_energy",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numSpringK=rng.nextInt(100,500);
		let numCompression=rng.nextInt(5,20)/100;
		let numMass=rng.nextInt(1,5);
		let numHeight=0.5*numSpringK*numCompression*numCompression/(numMass*9.8);
		let strQuestion=`Use a spring launcher (k = ${numSpringK} N/m, compressed ${numCompression} m) and a meterstick to determine the spring constant. Describe the procedure.`;
		let strAnswer=`Launch a ball of mass ${numMass} kg vertically; measure max height h. Energy conservation: ½kx² = mgh ⇒ k = 2mgh/x². Expected height ≈ ${numHeight.toFixed(2)} m.`;
		return{
			id: `3.4_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "3.4_conservation_of_energy",
			topicName: "Conservation of Energy",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "LAB"
		};
	});
	registerGenerator("3.5_power",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numPower=rng.nextInt(500,1500);
		let numMass=rng.nextInt(20,100);
		let numHeight=rng.nextInt(1,5);
		let numTime=rng.nextInt(1,3);
		let numOutput=numMass*9.8*numHeight;
		let numEfficiency=numOutput/numPower;
		let strQuestion=`A ${numPower} W motor lifts a ${numMass} kg crate ${numHeight} m in ${numTime} s. What is the efficiency?`;
		let numAnswer=numEfficiency*100;
		let arrChoices=[numAnswer.toFixed(0)+"%",(numAnswer*0.8).toFixed(0)+"%",(numAnswer*1.2).toFixed(0)+"%","100%"];
		arrChoices.sort(()=>rng.nextFloat()-0.5);
		return{
			id: `3.5_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "3.5_power",
			topicName: "Power",
			text: strQuestion,
			answer: numAnswer.toFixed(0)+"%",
			answerType: "string",
			choices: options.forceMcq?arrChoices:undefined,
			difficulty: options.difficulty,
			questionType: "MR"
		};
	});
	registerGenerator("4.1_linear_momentum",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numMass=rng.nextInt(1,10);
		let numSpeed=rng.nextInt(1,20);
		let numAnswer=numMass*numSpeed;
		let strQuestion=`A ${numMass} kg ball moving at ${numSpeed} m/s has momentum:`;
		let arrChoices=[numAnswer.toString(),(numAnswer*0.5).toString(),(numAnswer*2).toString(),(numMass+numSpeed).toString()];
		arrChoices.sort(()=>rng.nextFloat()-0.5);
		return{
			id: `4.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "4.1_linear_momentum",
			topicName: "Linear Momentum",
			text: strQuestion,
			answer: numAnswer.toString(),
			answerType: "numeric",
			unit: "kg·m/s",
			choices: options.forceMcq?arrChoices:undefined,
			difficulty: options.difficulty,
			questionType: "MC"
		};
	});
	registerGenerator("4.2_impulse",(options: GenerateOptions)=>{
		let strQuestion="Use a force sensor and motion detector to verify the impulse‑momentum theorem for a cart pushed by a spring. Describe the procedure.";
		let strAnswer="Measure force vs. time, compute impulse = area under F‑t graph; measure change in velocity Δv, compute Δp = mΔv; they should be equal.";
		return{
			id: `4.2_${Date.now()}_${Math.floor(Math.random()*1e6)}`,
			topicId: "4.2_impulse",
			topicName: "Change in Momentum & Impulse",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "LAB"
		};
	});
	registerGenerator("4.3_conservation_momentum",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numSpeed=rng.nextInt(5,20);
		let strQuestion=`Two identical cars collide and stick together. One was moving at ${numSpeed} m/s, the other at rest. What is their speed after? Claim, then derive.`;
		let numAnswer=numSpeed/2;
		let strAnswer=`Claim: ${numAnswer} m/s. Derivation: m*${numSpeed}+m*0 = (2m)v_f ⇒ v_f = ${numSpeed/2} m/s.`;
		return{
			id: `4.3_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "4.3_conservation_momentum",
			topicName: "Conservation of Linear Momentum",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "QQT"
		};
	});
	registerGenerator("4.4_elastic_collisions",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numM1=rng.nextInt(1,5);
		let numM2=rng.nextInt(1,5);
		let numV1i=rng.nextInt(2,10);
		let numV1f=(numM1-numM2)/(numM1+numM2)*numV1i;
		let numV2f=(2*numM1)/(numM1+numM2)*numV1i;
		let strQuestion=`In a 1D elastic collision, m₁=${numM1} kg, v₁i=${numV1i} m/s; m₂=${numM2} kg, v₂i=0. Find final velocities.`;
		let strAnswer=`v₁f = ${numV1f.toFixed(2)} m/s, v₂f = ${numV2f.toFixed(2)} m/s.`;
		return{
			id: `4.4_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "4.4_elastic_collisions",
			topicName: "Elastic & Inelastic Collisions",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "MR"
		};
	});
	registerGenerator("5.1_rotational_kinematics",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numAlpha=rng.nextInt(1,5);
		let numTime=rng.nextInt(2,6);
		let numAnswer=0.5*numAlpha*numTime*numTime;
		let strQuestion=`A wheel starts from rest and accelerates at ${numAlpha} rad/s² for ${numTime} s. Find angular displacement.`;
		let arrChoices=[numAnswer.toFixed(1),(numAnswer*0.5).toFixed(1),(numAnswer*2).toFixed(1),(numAlpha*numTime).toFixed(1)];
		arrChoices.sort(()=>rng.nextFloat()-0.5);
		return{
			id: `5.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "5.1_rotational_kinematics",
			topicName: "Rotational Kinematics",
			text: strQuestion,
			answer: numAnswer.toFixed(1),
			answerType: "numeric",
			unit: "rad",
			choices: options.forceMcq?arrChoices:undefined,
			difficulty: options.difficulty,
			questionType: "MR"
		};
	});
	registerGenerator("5.2_connecting_linear_rotational",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numRadius=rng.nextInt(1,5)/10;
		let strQuestion=`A string is wound around a pulley of radius R = ${numRadius} m. As the string unwinds, draw graphs of linear acceleration of the string vs. angular acceleration of the pulley.`;
		let strAnswer=`Linear acceleration a = αR ⇒ straight line through origin with slope ${numRadius}.`;
		return{
			id: `5.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "5.2_connecting_linear_rotational",
			topicName: "Connecting Linear & Rotational Motion",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "TBR"
		};
	});
	registerGenerator("5.3_torque",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numForce=rng.nextInt(10,50);
		let numDist=rng.nextInt(1,5)/10;
		let numAnswer=numForce*numDist;
		let strQuestion=`A force of ${numForce} N is applied perpendicular to a wrench at ${numDist} m from the bolt. Find torque.`;
		let arrChoices=[numAnswer.toFixed(1),(numAnswer*0.5).toFixed(1),(numAnswer*2).toFixed(1),(numAnswer/numDist).toFixed(1)];
		arrChoices.sort(()=>rng.nextFloat()-0.5);
		return{
			id: `5.3_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "5.3_torque",
			topicName: "Torque",
			text: strQuestion,
			answer: numAnswer.toFixed(1),
			answerType: "numeric",
			unit: "N·m",
			choices: options.forceMcq?arrChoices:undefined,
			difficulty: options.difficulty,
			questionType: "MR"
		};
	});
	registerGenerator("5.4_rotational_inertia",(options: GenerateOptions)=>{
		let strQuestion="Determine the rotational inertia of a disk by applying a known torque (hanging mass). Describe the procedure.";
		let strAnswer="Hang a mass m from a string wrapped around the disk. Measure angular acceleration α. Torque τ = mgR. Then I = τ/α.";
		return{
			id: `5.4_${Date.now()}_${Math.floor(Math.random()*1e6)}`,
			topicId: "5.4_rotational_inertia",
			topicName: "Rotational Inertia",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "LAB"
		};
	});
	registerGenerator("5.5_rotational_equilibrium",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numM1=rng.nextInt(20,50);
		let numM2=rng.nextInt(20,50);
		let strQuestion=`A seesaw is balanced with a ${numM1} kg child on the left and a ${numM2} kg child on the right. If the left child moves farther from the pivot, what must happen to keep equilibrium? Claim and derive.`;
		let strAnswer="The right child must also move farther from the pivot by the same factor. Torque balance: m₁g r₁ = m₂g r₂ ⇒ r₂ = (m₁/m₂) r₁.";
		return{
			id: `5.5_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "5.5_rotational_equilibrium",
			topicName: "Rotational Equilibrium",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "QQT"
		};
	});
	registerGenerator("5.6_newtons_second_law_rotational",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numMassM=rng.nextInt(1,5);
		let numRadiusR=rng.nextInt(1,5)/10;
		let numHangingMass=rng.nextInt(1,5);
		let numAlpha=(2*numHangingMass*9.8)/(numMassM*numRadiusR+2*numHangingMass*numRadiusR);
		let strQuestion=`Derive the angular acceleration of a pulley (solid disk, I = ½MR²) with mass M = ${numMassM} kg, radius R = ${numRadiusR} m, and a hanging mass m = ${numHangingMass} kg.`;
		let strAnswer=`α = 2mg/(R(M+2m)) = ${numAlpha.toFixed(2)} rad/s².`;
		return{
			id: `5.6_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "5.6_newtons_second_law_rotational",
			topicName: "Newton's Second Law (Rotational)",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "MR"
		};
	});
	registerGenerator("6.1_rotational_kinetic_energy",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numMass=rng.nextInt(1,5);
		let numRadius=rng.nextInt(1,5)/10;
		let numOmega=rng.nextInt(2,10);
		let numAnswer=0.25*numMass*numRadius*numRadius*numOmega*numOmega;
		let strQuestion=`A solid disk of mass M = ${numMass} kg and radius R = ${numRadius} m rotates about its center with angular speed ω = ${numOmega} rad/s. What is its rotational kinetic energy?`;
		let arrChoices=[numAnswer.toFixed(2),(numAnswer*0.5).toFixed(2),(numAnswer*2).toFixed(2),(numAnswer*1.5).toFixed(2)];
		arrChoices.sort(()=>rng.nextFloat()-0.5);
		return{
			id: `6.1_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "6.1_rotational_kinetic_energy",
			topicName: "Rotational Kinetic Energy",
			text: strQuestion,
			answer: numAnswer.toFixed(2),
			answerType: "numeric",
			unit: "J",
			choices: options.forceMcq?arrChoices:undefined,
			difficulty: options.difficulty,
			questionType: "MC"
		};
	});
	registerGenerator("6.2_torque_work",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numTorque=rng.nextInt(2,10);
		let numTheta=rng.nextInt(2,8);
		let numAnswer=numTorque*numTheta;
		let strQuestion=`A torque of ${numTorque} N·m acts over ${numTheta} rad. How much work is done?`;
		let arrChoices=[numAnswer.toString(),(numAnswer*0.5).toString(),(numAnswer*2).toString(),(numTorque+numTheta).toString()];
		arrChoices.sort(()=>rng.nextFloat()-0.5);
		return{
			id: `6.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "6.2_torque_work",
			topicName: "Torque and Work",
			text: strQuestion,
			answer: numAnswer.toString(),
			answerType: "numeric",
			unit: "J",
			choices: options.forceMcq?arrChoices:undefined,
			difficulty: options.difficulty,
			questionType: "MR"
		};
	});
	registerGenerator("6.3_angular_momentum",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numI=rng.nextInt(1,5);
		let numOmega=rng.nextInt(2,8);
		let numAnswer=numI*numOmega;
		let strQuestion=`A disk with rotational inertia I = ${numI} kg·m² rotates at ω = ${numOmega} rad/s. Its angular momentum is:`;
		let arrChoices=[numAnswer.toString(),(numAnswer*0.5).toString(),(numAnswer*2).toString(),(numI+numOmega).toString()];
		arrChoices.sort(()=>rng.nextFloat()-0.5);
		return{
			id: `6.3_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "6.3_angular_momentum",
			topicName: "Angular Momentum and Angular Impulse",
			text: strQuestion,
			answer: numAnswer.toString(),
			answerType: "numeric",
			unit: "kg·m²/s",
			choices: options.forceMcq?arrChoices:undefined,
			difficulty: options.difficulty,
			questionType: "MC"
		};
	});
	registerGenerator("6.4_conservation_angular_momentum",(options: GenerateOptions)=>{
		let strQuestion="An ice skater spins with arms outstretched. When she pulls her arms in, why does her angular speed increase? Claim and derive.";
		let strAnswer="Angular momentum conserved (Iω constant). Pulling arms in decreases I, so ω increases.";
		return{
			id: `6.4_${Date.now()}_${Math.floor(Math.random()*1e6)}`,
			topicId: "6.4_conservation_angular_momentum",
			topicName: "Conservation of Angular Momentum",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "QQT"
		};
	});
	registerGenerator("6.5_rolling",(options: GenerateOptions)=>{
		let strQuestion="Draw energy bar charts for a hoop and a disk rolling down an incline from rest. Show that the disk has more translational KE at the bottom.";
		let strAnswer="Both start with same gravitational PE. Hoop has larger I ⇒ more rotational KE ⇒ less translational KE. Disk has larger translational KE.";
		return{
			id: `6.5_${Date.now()}_${Math.floor(Math.random()*1e6)}`,
			topicId: "6.5_rolling",
			topicName: "Rolling",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "TBR"
		};
	});
	registerGenerator("6.6_orbiting_satellites",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numR=rng.nextInt(1,10)*1e6;
		let strQuestion=`Derive the escape speed from Earth's surface using conservation of energy. Earth radius R = ${numR} m.`;
		let strAnswer=`v_esc = √(2GM/R). From ½mv² - GMm/R = 0 ⇒ v = √(2GM/R).`;
		return{
			id: `6.6_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "6.6_orbiting_satellites",
			topicName: "Motion of Orbiting Satellites",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "MR"
		};
	});
	registerGenerator("7.1_defining_shm",(options: GenerateOptions)=>{
		let strQuestion="Which of the following forces can produce simple harmonic motion? (A) constant (B) proportional to displacement (C) proportional to velocity (D) inverse square";
		let strAnswer="B";
		let arrChoices=["A","B","C","D"];
		return{
			id: `7.1_${Date.now()}_${Math.floor(Math.random()*1e6)}`,
			topicId: "7.1_defining_shm",
			topicName: "Defining Simple Harmonic Motion",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			choices: arrChoices,
			difficulty: options.difficulty,
			questionType: "MC"
		};
	});
	registerGenerator("7.2_frequency_period_shm",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numK=rng.nextInt(100,500);
		let strQuestion=`Determine the spring constant k by measuring the period of oscillation for different masses. Describe the procedure.`;
		let strAnswer=`Plot T² vs. m; slope = 4π²/k ⇒ k = 4π²/slope. Expected k ≈ ${numK} N/m.`;
		return{
			id: `7.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "7.2_frequency_period_shm",
			topicName: "Frequency and Period of SHM",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "LAB"
		};
	});
	registerGenerator("7.3_representing_shm",(options: GenerateOptions)=>{
		let strQuestion="Given a position‑time graph of SHM (cosine), sketch the velocity‑time and acceleration‑time graphs.";
		let strAnswer="Velocity: negative sine; acceleration: negative cosine (scaled by ω²).";
		return{
			id: `7.3_${Date.now()}_${Math.floor(Math.random()*1e6)}`,
			topicId: "7.3_representing_shm",
			topicName: "Representing and Analyzing SHM",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "TBR"
		};
	});
	registerGenerator("7.4_energy_shm",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let strQuestion="A mass‑spring system has total energy E. At half the amplitude, what fraction of energy is kinetic? Claim and derive.";
		let strAnswer="3/4. Derivation: E = ½kA²; at x = A/2, U = ½k(A/2)² = E/4 ⇒ K = E - E/4 = 3E/4.";
		return{
			id: `7.4_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "7.4_energy_shm",
			topicName: "Energy of Simple Harmonic Oscillators",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "QQT"
		};
	});
	registerGenerator("8.1_density",(options: GenerateOptions)=>{
		let strQuestion="Determine the density of an irregular solid using a scale and water displacement. Describe the procedure.";
		let strAnswer="Measure mass m with scale. Submerge in water in a graduated cylinder; measure volume V from water rise. ρ = m/V.";
		return{
			id: `8.1_${Date.now()}_${Math.floor(Math.random()*1e6)}`,
			topicId: "8.1_density",
			topicName: "Internal Structure and Density",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "LAB"
		};
	});
	registerGenerator("8.2_pressure",(options: GenerateOptions)=>{
		let rng=new SeededRandom(options.seed||Date.now());
		let numMass=rng.nextInt(50,100);
		let numArea=rng.nextInt(1,5);
		let numAreaM2=numArea/10000;
		let numAnswer=numMass*9.8/numAreaM2;
		let strQuestion=`A ${numMass} kg woman stands on one heel of area ${numArea} cm². What pressure does she exert?`;
		let numAnswerExp=numAnswer/1e6;
		let strAnswer=`${numAnswerExp.toFixed(1)} × 10⁶ Pa`;
		let arrChoices=[`${numAnswerExp.toFixed(1)}×10⁶ Pa`,`${(numAnswerExp*0.8).toFixed(1)}×10⁶ Pa`,`${(numAnswerExp*1.2).toFixed(1)}×10⁶ Pa`,`${(numAnswerExp*0.5).toFixed(1)}×10⁶ Pa`];
		arrChoices.sort(()=>rng.nextFloat()-0.5);
		return{
			id: `8.2_${Date.now()}_${rng.nextInt(0,1e6)}`,
			topicId: "8.2_pressure",
			topicName: "Pressure",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			choices: options.forceMcq?arrChoices:undefined,
			difficulty: options.difficulty,
			questionType: "MR"
		};
	});
	registerGenerator("8.3_buoyancy",(options: GenerateOptions)=>{
		let strQuestion="A block floats in water with 1/4 of its volume above the surface. What is its density? Claim and derive.";
		let strAnswer="ρ_block = ¾ ρ_water. Buoyancy: ρ_water V_sub g = ρ_block V g; V_sub = ¾ V ⇒ ρ_block = ¾ ρ_water.";
		return{
			id: `8.3_${Date.now()}_${Math.floor(Math.random()*1e6)}`,
			topicId: "8.3_buoyancy",
			topicName: "Fluids and Newton's Laws",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "QQT"
		};
	});
	registerGenerator("8.4_fluid_dynamics",(options: GenerateOptions)=>{
		let strQuestion="Use a bucket with a hole to verify Torricelli's law. Measure exit speed vs. height, graph v² vs. h to find g. Describe the procedure.";
		let strAnswer="Measure height h of water above hole, measure exit speed v (by timing horizontal distance). Plot v² vs. h; slope = 2g ⇒ g = slope/2.";
		return{
			id: `8.4_${Date.now()}_${Math.floor(Math.random()*1e6)}`,
			topicId: "8.4_fluid_dynamics",
			topicName: "Fluids and Conservation Laws",
			text: strQuestion,
			answer: strAnswer,
			answerType: "string",
			difficulty: options.difficulty,
			questionType: "LAB"
		};
	});

	// ========== EVENT LISTENERS ==========
	if (elemModeSingleBtn) elemModeSingleBtn.addEventListener("click",()=>setMode("single"));
	if (elemModeMentalBtn) elemModeMentalBtn.addEventListener("click",()=>setMode("mental"));
	if (elemGenerateBtn) elemGenerateBtn.addEventListener("click",()=>generateNewQuestion());
	if (elemCheckBtn) elemCheckBtn.addEventListener("click",()=>checkAnswer());
	if (elemClearAnswerBtn && elemAnswerBox){
		elemClearAnswerBtn.addEventListener("click",()=>{
			if (elemAnswerBox) elemAnswerBox.value="";
			elemAnswerBox?.focus();
			if (elemPhysicsPreview){
				elemPhysicsPreview.textContent="";
				elemPhysicsPreview.classList.remove("has-content");
			}
		});
		elemAnswerBox.addEventListener("input",()=>{
			if (elemPhysicsPreview) elemPhysicsPreview.textContent=elemAnswerBox.value;
		});
	}
	if (elemThemeToggle) elemThemeToggle.addEventListener("click",()=>{
		let strNewTheme=document.documentElement.classList.contains("dark")?"light":"dark";
		objSettings.theme=strNewTheme as "light"|"dark";
		applyTheme(objSettings.theme);
		saveSettings();
	});
	if (elemSettingsBtn && elemSettingsModal) elemSettingsBtn.addEventListener("click",()=>elemSettingsModal.classList.add("show"));
	if (elemSettingsClose && elemSettingsModal) elemSettingsClose.addEventListener("click",()=>elemSettingsModal.classList.remove("show"));
	if (elemSettingsSave && elemSettingsModal){
		elemSettingsSave.addEventListener("click",()=>{
			let elemThemeSel=document.getElementById("settings-theme")as HTMLSelectElement|null;
			if (elemThemeSel) objSettings.theme=elemThemeSel.value as any;
			let elemDefaultModeSel=document.getElementById("settings-default-mode")as HTMLSelectElement|null;
			if (elemDefaultModeSel) objSettings.defaultMode=elemDefaultModeSel.value as any;
			let elemAutoCont=document.getElementById("settings-auto-continue")as HTMLInputElement|null;
			if (elemAutoCont) objSettings.autoContinue=elemAutoCont.checked;
			let elemShuffleCh=document.getElementById("settings-shuffle")as HTMLInputElement|null;
			if (elemShuffleCh) objSettings.shuffle=elemShuffleCh.checked;
			let elemScopeSel=document.getElementById("settings-scope")as HTMLSelectElement|null;
			if (elemScopeSel) objSettings.defaultScope=elemScopeSel.value;
			let elemNotif=document.getElementById("settings-notifications")as HTMLInputElement|null;
			if (elemNotif) objSettings.notifications=elemNotif.checked;
			let elemDiff=document.getElementById("settings-difficulty")as HTMLSelectElement|null;
			if (elemDiff) objSettings.difficulty=elemDiff.value as any;
			let elemTimer=document.getElementById("settings-timer")as HTMLInputElement|null;
			if (elemTimer) objSettings.timerSeconds=parseInt(elemTimer.value);
			let elemMaxQ=document.getElementById("settings-max-questions")as HTMLInputElement|null;
			if (elemMaxQ) objSettings.maxQuestions=parseInt(elemMaxQ.value);
			let elemDelay=document.getElementById("settings-auto-check-delay")as HTMLInputElement|null;
			if (elemDelay) objSettings.autoCheckDelayMs=parseInt(elemDelay.value);
			let elemDec=document.getElementById("settings-decimal-places")as HTMLInputElement|null;
			if (elemDec) objSettings.decimalPlaces=parseInt(elemDec.value);
			let elemSnd=document.getElementById("settings-sound")as HTMLInputElement|null;
			if (elemSnd) objSettings.sound=elemSnd.checked;
			let elemVib=document.getElementById("settings-vibration")as HTMLInputElement|null;
			if (elemVib) objSettings.vibration=elemVib.checked;
			let elemMcqCh=document.getElementById("settings-mcq-choices")as HTMLInputElement|null;
			if (elemMcqCh) objSettings.mcqChoices=parseInt(elemMcqCh.value);
			let elemPerf=document.getElementById("settings-perf-master")as HTMLInputElement|null;
			if (elemPerf) objSettings.performanceMode=elemPerf.checked;
			let elemWave=document.getElementById("settings-perf-wave")as HTMLInputElement|null;
			if (elemWave) objSettings.waveBackground=elemWave.checked;
			let elemBlur=document.getElementById("settings-perf-blur")as HTMLInputElement|null;
			if (elemBlur) objSettings.blurEffect=elemBlur.checked;
			saveSettings();
			elemSettingsModal?.classList.remove("show");
		});
	}
	if (elemSettingsTabBasic && elemSettingsBasicPanel && elemSettingsTabAdvanced && elemSettingsAdvancedPanel){
		elemSettingsTabBasic.addEventListener("click",()=>{
			elemSettingsTabBasic.classList.add("active");
			elemSettingsTabAdvanced.classList.remove("active");
			elemSettingsBasicPanel.classList.remove("hidden");
			elemSettingsAdvancedPanel.classList.add("hidden");
		});
		elemSettingsTabAdvanced.addEventListener("click",()=>{
			elemSettingsTabAdvanced.classList.add("active");
			elemSettingsTabBasic.classList.remove("active");
			elemSettingsAdvancedPanel.classList.remove("hidden");
			elemSettingsBasicPanel.classList.add("hidden");
		});
	}
	if (elemShortcutsBtn && elemShortcutsModal) elemShortcutsBtn.addEventListener("click",()=>elemShortcutsModal.classList.add("show"));
	if (elemShortcutsClose && elemShortcutsModal) elemShortcutsClose.addEventListener("click",()=>elemShortcutsModal.classList.remove("show"));
	if (elemShortcutsGotit && elemShortcutsModal) elemShortcutsGotit.addEventListener("click",()=>elemShortcutsModal.classList.remove("show"));
	if (elemHelpBtn && elemOnboardingOverlay) elemHelpBtn.addEventListener("click",()=>elemOnboardingOverlay.classList.add("show"));
	if (elemOnboardingClose && elemOnboardingOverlay) elemOnboardingClose.addEventListener("click",()=>elemOnboardingOverlay.classList.remove("show"));
	if (elemOnboardingGotit && elemOnboardingOverlay){
		elemOnboardingGotit.addEventListener("click",()=>{
			elemOnboardingOverlay.classList.remove("show");
			localStorage.setItem("onboardingSeen","true");
		});
	}
	if (elemAutoContinueToggle) elemAutoContinueToggle.addEventListener("change",(e)=>boolAutoContinue=(e.target as HTMLInputElement).checked);
	if (elemShuffleToggle) elemShuffleToggle.addEventListener("change",(e)=>boolShuffleMode=(e.target as HTMLInputElement).checked);
	if (elemMcqToggle) elemMcqToggle.addEventListener("change",(e)=>boolMcqMode=(e.target as HTMLInputElement).checked);
	if (elemScopeSelect) elemScopeSelect.addEventListener("change",(e)=>strCurrentScope=(e.target as HTMLSelectElement).value);
	if (elemDifficultySelect) elemDifficultySelect.addEventListener("change",(e)=>strCurrentDifficulty=(e.target as HTMLSelectElement).value as any);
	if (elemStartSessionBtn){
		elemStartSessionBtn.addEventListener("click",()=>{
			if (objMentalSession.active) endMentalSession();
			else startMentalSession();
		});
	}
	if (elemPauseSessionBtn){
		elemPauseSessionBtn.addEventListener("click",()=>{
			if (!objMentalSession.active) return;
			objMentalSession.paused=!objMentalSession.paused;
			elemPauseSessionBtn.innerHTML=objMentalSession.paused?"▶":"⏸";
		});
	}
	if (elemSkipQuestionBtn){
		elemSkipQuestionBtn.addEventListener("click",()=>{
			if (!objMentalSession.active) return;
			generateNextMentalQuestion();
		});
	}
	if (elemCopyAnswerBtn && elemResultsDiv){
		elemCopyAnswerBtn.addEventListener("click",()=>{
			let strCorrectText=elemResultsDiv.querySelector(".result-error p")?.textContent?.replace("Correct answer: ","")||"";
			if (strCorrectText) navigator.clipboard.writeText(strCorrectText);
		});
	}
	if (elemPhysicsToolbarBtns.length){
		elemPhysicsToolbarBtns.forEach(btn=>{
			btn.addEventListener("click",()=>{
				let strSymbol=btn.getAttribute("data-symbol")||"";
				let strTemplate=btn.getAttribute("data-template");
				if (!elemAnswerBox) return;
				let numStart=elemAnswerBox.selectionStart||0;
				let numEnd=elemAnswerBox.selectionEnd||0;
				let strInsert=strSymbol;
				if (strTemplate) strInsert=strTemplate;
				let strNewValue=elemAnswerBox.value.substring(0,numStart)+strInsert+elemAnswerBox.value.substring(numEnd);
				elemAnswerBox.value=strNewValue;
				elemAnswerBox.focus();
				let numNewPos=numStart+strInsert.length;
				elemAnswerBox.setSelectionRange(numNewPos,numNewPos);
				if (elemPhysicsPreview) elemPhysicsPreview.textContent=strNewValue;
			});
		});
	}
	if (elemDropdownBtn && elemPhysicsDropdown){
		elemDropdownBtn.addEventListener("click",(e)=>{
			e.stopPropagation();
			elemPhysicsDropdown?.classList.toggle("show");
		});
		document.addEventListener("click",(e)=>{
			if (!elemPhysicsDropdown?.contains(e.target as Node) && e.target!==elemDropdownBtn) elemPhysicsDropdown?.classList.remove("show");
		});
	}

	// ========== INITIALIZATION ==========
	loadSettings();
	initTopics();
	if (!localStorage.getItem("onboardingSeen") && elemOnboardingOverlay) elemOnboardingOverlay.classList.add("show");
	(window as any).registerPhysicsGenerator=registerGenerator;
});