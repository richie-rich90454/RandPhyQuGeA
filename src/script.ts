import {Question, GenerateOptions, GeneratorRegistry, AppSettings, MentalSession, GeneratorFn} from "./types.js";
/**
 * Main entry point: sets up all event listeners, loads settings,
 * and provides full exam‑ready question generation for Single and Mental modes.
 * All question generators are registered externally via registerPhysicsGenerator.
 * Topic pills and scope dropdowns are built dynamically from registered generators.
 */
document.addEventListener("DOMContentLoaded",async()=>{
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
	let mapTopicMetadata: {[topicId: string]: {name: string; scope: string}}={};
	// ========== HELPER FUNCTIONS ==========
	function getScopeFromTopicId(strTopicId: string): string{
		if (strTopicId.match(/^[1-8]\./)) return "mechanics";
		if (strTopicId.match(/^9\.|^10\.|^11\.|^12\./)) return "emag";
		if (strTopicId.match(/^13\.|^14\./)) return "optics";
		if (strTopicId.match(/^15\./)) return "thermo";
		if (strTopicId.match(/^16\./)) return "modern";
		return "mechanics";
	}
	function populateScopeSelects(): void{
		let arrScopes=new Set<string>();
		for (let strTopicId in mapGeneratorRegistry){
			let strScope=getScopeFromTopicId(strTopicId);
			arrScopes.add(strScope);
		}
		let arrScopeList=["all", ...Array.from(arrScopes).sort()];
		if (elemScopeSelect){
			elemScopeSelect.innerHTML="";
			arrScopeList.forEach(strScope=>{
				let option=document.createElement("option");
				option.value=strScope;
				option.textContent=strScope==="all"?"All":strScope.charAt(0).toUpperCase()+strScope.slice(1);
				elemScopeSelect!.appendChild(option);
			});
		}
		if (elemMentalScopeSelect){
			elemMentalScopeSelect.innerHTML="";
			arrScopeList.forEach(strScope=>{
				let option=document.createElement("option");
				option.value=strScope;
				option.textContent=strScope==="all"?"All":strScope.charAt(0).toUpperCase()+strScope.slice(1);
				elemMentalScopeSelect!.appendChild(option);
			});
		}
	}
	function rebuildTopicPills(): void{
		if (!elemTopicGrid) return;
		elemTopicGrid.innerHTML="";
		let arrTopicIds=Object.keys(mapGeneratorRegistry);
		for (let strTopicId of arrTopicIds){
			let strScope=getScopeFromTopicId(strTopicId);
			if (strCurrentScope!=="all" && strScope!==strCurrentScope) continue;
			let strTopicName=mapTopicMetadata[strTopicId]?.name||strTopicId.replace(/_/g," ").replace(/\d+\.\d+\s*/,"");
			let elemPill=document.createElement("div");
			elemPill.className="topic-pill";
			elemPill.setAttribute("data-topic",strTopicId);
			elemPill.textContent=strTopicName;
			if (strActiveTopicId===strTopicId) elemPill.classList.add("active");
			elemPill.addEventListener("click",()=>{
				if (mapGeneratorRegistry[strTopicId]){
					strActiveTopicId=strTopicId;
					document.querySelectorAll(".topic-pill").forEach(p=>p.classList.remove("active"));
					elemPill.classList.add("active");
					if (elemGenerateBtn) elemGenerateBtn.disabled=false;
				}
			});
			elemTopicGrid.appendChild(elemPill);
		}
		if (elemTopicSearch) filterTopics(elemTopicSearch.value);
	}
	function filterTopics(strTerm: string): void{
		if (!elemTopicGrid) return;
		let arrPills=elemTopicGrid.querySelectorAll(".topic-pill");
		let strLowerTerm=strTerm.toLowerCase();
		arrPills.forEach(elemPill=>{
			let strText=elemPill.textContent?.toLowerCase()||"";
			if (strText.includes(strLowerTerm)) (elemPill as HTMLElement).style.display="flex";
			else (elemPill as HTMLElement).style.display="none";
		});
	}
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
		rebuildTopicPills();
	}
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
		rebuildTopicPills();
	}
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
	function generateNewQuestion(): void{
		if (!mapGeneratorRegistry || Object.keys(mapGeneratorRegistry).length===0){
			console.warn("No generators registered yet");
			return;
		}
		let strTopicId=strActiveTopicId;
		if (boolShuffleMode){
			let arrTopics=Object.keys(mapGeneratorRegistry);
			if (strCurrentScope!=="all"){
				let arrFiltered=arrTopics.filter(t=>getScopeFromTopicId(t)===strCurrentScope);
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
	function generateNextMentalQuestion(): void{
		if (!objMentalSession.active) return;
		let strTopicId=strActiveTopicId;
		if (elemMentalShuffleToggle?.checked){
			let arrTopics=Object.keys(mapGeneratorRegistry);
			let strScopeValue=elemMentalScopeSelect?.value||"all";
			if (strScopeValue!=="all"){
				let arrFiltered=arrTopics.filter(t=>getScopeFromTopicId(t)===strScopeValue);
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
	function registerGenerator(strTopicId: string, fnGenerator: GeneratorFn, strTopicName: string): void{
		mapGeneratorRegistry[strTopicId]=fnGenerator;
		let strScope=getScopeFromTopicId(strTopicId);
		mapTopicMetadata[strTopicId]={name: strTopicName, scope: strScope};
		populateScopeSelects();
		rebuildTopicPills();
	}
	function initTopics(): void{
		rebuildTopicPills();
		if (elemTopicSearch){
			elemTopicSearch.addEventListener("input",(e)=>{
				filterTopics((e.target as HTMLInputElement).value);
			});
		}
	}
	// ========== AUTO‑LOAD ALL GENERATORS ==========
	const unitModules=import.meta.glob<{generators: Array<{id: string; name: string; generate: GeneratorFn}>}>("/src/modules/*/index.ts");
	for (const path in unitModules){
		const module=await unitModules[path]();
		if (module && module.generators){
			for (const gen of module.generators){
				registerGenerator(gen.id, gen.generate, gen.name);
			}
		}
	}
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
	if (elemScopeSelect) elemScopeSelect.addEventListener("change",(e)=>{
		strCurrentScope=(e.target as HTMLSelectElement).value;
		rebuildTopicPills();
	});
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
});