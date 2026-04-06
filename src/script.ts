// src/script.ts
import { Question, GenerateOptions, GeneratorRegistry, AppSettings, MentalSession, SeededRandom } from "./types.js";
/**
 * Main entry point: initializes DOM event listeners, manages mode switching,
 * topic selection, answer checking, mental mode timer, and settings persistence.
 * Generators are loaded dynamically; this file only orchestrates UI and state.
 */
document.addEventListener("DOMContentLoaded",()=>{
	// ----- DOM Elements -----
	let modeSingleBtn=document.getElementById("mode-single")as HTMLButtonElement|null;
	let modeMentalBtn=document.getElementById("mode-mental")as HTMLButtonElement|null;
	let singleControls=document.getElementById("single-controls")as HTMLDivElement|null;
	let mentalControls=document.getElementById("mental-controls")as HTMLDivElement|null;
	let topicSearch=document.getElementById("topic-search")as HTMLInputElement|null;
	let topicGrid=document.getElementById("topic-grid")as HTMLDivElement|null;
	let generateBtn=document.getElementById("genQ")as HTMLButtonElement|null;
	let checkBtn=document.getElementById("check-answer")as HTMLButtonElement|null;
	let answerBox=document.getElementById("answer-box")as HTMLTextAreaElement|null;
	let clearAnswerBtn=document.getElementById("clear-answer")as HTMLButtonElement|null;
	let themeToggle=document.getElementById("theme-toggle")as HTMLButtonElement|null;
	let settingsModal=document.getElementById("settings-modal")as HTMLDivElement|null;
	let settingsClose=document.getElementById("settings-close")as HTMLButtonElement|null;
	let settingsSave=document.getElementById("settings-save")as HTMLButtonElement|null;
	let shortcutsModal=document.getElementById("shortcuts-modal")as HTMLDivElement|null;
	let shortcutsClose=document.getElementById("shortcuts-close")as HTMLButtonElement|null;
	let shortcutsGotit=document.getElementById("shortcuts-gotit")as HTMLButtonElement|null;
	let shortcutsBtn=document.getElementById("shortcuts-button")as HTMLButtonElement|null;
	let helpBtn=document.getElementById("help-button")as HTMLButtonElement|null;
	let onboardingOverlay=document.getElementById("onboarding-overlay")as HTMLDivElement|null;
	let onboardingClose=document.getElementById("onboarding-close")as HTMLButtonElement|null;
	let onboardingGotit=document.getElementById("onboarding-gotit")as HTMLButtonElement|null;
	let settingsBtn=document.getElementById("settings-button")as HTMLButtonElement|null;
	let settingsTabBasic=document.getElementById("settings-tab-basic")as HTMLButtonElement|null;
	let settingsTabAdvanced=document.getElementById("settings-tab-advanced")as HTMLButtonElement|null;
	let settingsBasicPanel=document.getElementById("settings-basic")as HTMLDivElement|null;
	let settingsAdvancedPanel=document.getElementById("settings-advanced")as HTMLDivElement|null;
	let autoContinueToggle=document.getElementById("autocontinue-toggle")as HTMLInputElement|null;
	let shuffleToggle=document.getElementById("shuffle-toggle")as HTMLInputElement|null;
	let mcqToggle=document.getElementById("mcq-toggle")as HTMLInputElement|null;
	let scopeSelect=document.getElementById("scope-select")as HTMLSelectElement|null;
	let startSessionBtn=document.getElementById("start-session")as HTMLButtonElement|null;
	let mentalScopeSelect=document.getElementById("mental-scope-select")as HTMLSelectElement|null;
	let mentalShuffleToggle=document.getElementById("mental-shuffle-toggle")as HTMLInputElement|null;
	let unlimitedToggle=document.getElementById("unlimited-toggle")as HTMLInputElement|null;
	let difficultySelect=document.getElementById("difficulty-select")as HTMLSelectElement|null;
	let timerDisplay=document.getElementById("timer-display")as HTMLSpanElement|null;
	let scoreDisplay=document.getElementById("score-display")as HTMLSpanElement|null;
	let pauseSessionBtn=document.getElementById("pause-session")as HTMLButtonElement|null;
	let skipQuestionBtn=document.getElementById("skip-question")as HTMLButtonElement|null;
	let mentalProgressBar=document.getElementById("mental-progress-bar")as HTMLDivElement|null;
	let statisticsPanel=document.getElementById("statistics-panel")as HTMLDivElement|null;
	let accuracyStat=document.getElementById("accuracy-stat")as HTMLSpanElement|null;
	let avgTimeStat=document.getElementById("avg-time-stat")as HTMLSpanElement|null;
	let questionArea=document.getElementById("question-area")as HTMLDivElement|null;
	let currentTopicSpan=document.getElementById("current-topic")as HTMLDivElement|null;
	let resultsDiv=document.getElementById("answer-results")as HTMLDivElement|null;
	let copyAnswerBtn=document.getElementById("copy-answer")as HTMLButtonElement|null;
	let mcqChoicesContainer=document.getElementById("mcq-choices-container")as HTMLDivElement|null;
	let physicsPreview=document.getElementById("physics-preview")as HTMLDivElement|null;
	let expectedFormatDiv=document.getElementById("expected-format")as HTMLDivElement|null;
	let physicsToolbarBtns=document.querySelectorAll(".physics-toolbar-btn[data-symbol]");
	let dropdownBtn=document.getElementById("physics-dropdown-btn")as HTMLButtonElement|null;
	let physicsDropdown=document.getElementById("physics-dropdown")as HTMLDivElement|null;
	// ----- State -----
	let currentQuestion: Question|null=null;
	let activeTopicId: string|null=null;
	let currentDifficulty: 'easy'|'medium'|'hard'='medium';
	let mcqMode=false;
	let autoContinue=false;
	let shuffleMode=false;
	let currentScope='all';
	let mentalModeActive=false;
	let mentalSession: MentalSession={
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
	let settings: AppSettings={
		theme: 'system',
		defaultMode: 'single',
		autoContinue: false,
		shuffle: false,
		defaultScope: 'all',
		notifications: true,
		difficulty: 'medium',
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
	let generatorRegistry: GeneratorRegistry={};
	// ----- Helper functions -----
	/** Updates UI based on current mode (single/mental). */
	function setMode(mode: 'single'|'mental'): void{
		if (mode==='single'){
			modeSingleBtn?.classList.add("active");
			modeMentalBtn?.classList.remove("active");
			singleControls?.classList.remove("hidden");
			mentalControls?.classList.add("hidden");
		}
		else{
			modeMentalBtn?.classList.add("active");
			modeSingleBtn?.classList.remove("active");
			mentalControls?.classList.remove("hidden");
			singleControls?.classList.add("hidden");
		}
	}
	/** Loads theme from settings and applies to document. */
	function applyTheme(theme: 'light'|'dark'|'system'): void{
		let root=document.documentElement;
		if (theme==='system'){
			root.classList.remove("light","dark");
		}
		else if (theme==='dark'){
			root.classList.remove("light");
			root.classList.add("dark");
		}
		else{
			root.classList.remove("dark");
			root.classList.add("light");
		}
		localStorage.setItem("theme",theme);
	}
	/** Loads saved settings from localStorage and applies them. */
	function loadSettings(): void{
		let saved=localStorage.getItem("physicsSettings");
		if (saved){
			try{
				let parsed=JSON.parse(saved);
				settings={...settings,...parsed};
			}
			catch(e){}
		}
		applyTheme(settings.theme);
		let themeSelect=document.getElementById("settings-theme")as HTMLSelectElement|null;
		if (themeSelect) themeSelect.value=settings.theme;
		let defaultModeSelect=document.getElementById("settings-default-mode")as HTMLSelectElement|null;
		if (defaultModeSelect) defaultModeSelect.value=settings.defaultMode;
		let autoContCheck=document.getElementById("settings-auto-continue")as HTMLInputElement|null;
		if (autoContCheck) autoContCheck.checked=settings.autoContinue;
		let shuffleCheck=document.getElementById("settings-shuffle")as HTMLInputElement|null;
		if (shuffleCheck) shuffleCheck.checked=settings.shuffle;
		let scopeSelectSetting=document.getElementById("settings-scope")as HTMLSelectElement|null;
		if (scopeSelectSetting) scopeSelectSetting.value=settings.defaultScope;
		let notifCheck=document.getElementById("settings-notifications")as HTMLInputElement|null;
		if (notifCheck) notifCheck.checked=settings.notifications;
		let difficultySetting=document.getElementById("settings-difficulty")as HTMLSelectElement|null;
		if (difficultySetting) difficultySetting.value=settings.difficulty;
		let timerSetting=document.getElementById("settings-timer")as HTMLInputElement|null;
		if (timerSetting) timerSetting.value=settings.timerSeconds.toString();
		let maxQSetting=document.getElementById("settings-max-questions")as HTMLInputElement|null;
		if (maxQSetting) maxQSetting.value=settings.maxQuestions.toString();
		let autoCheckDelay=document.getElementById("settings-auto-check-delay")as HTMLInputElement|null;
		if (autoCheckDelay) autoCheckDelay.value=settings.autoCheckDelayMs.toString();
		let decimalPlacesSetting=document.getElementById("settings-decimal-places")as HTMLInputElement|null;
		if (decimalPlacesSetting) decimalPlacesSetting.value=settings.decimalPlaces.toString();
		let soundSetting=document.getElementById("settings-sound")as HTMLInputElement|null;
		if (soundSetting) soundSetting.checked=settings.sound;
		let vibrationSetting=document.getElementById("settings-vibration")as HTMLInputElement|null;
		if (vibrationSetting) vibrationSetting.checked=settings.vibration;
		let mcqChoicesSetting=document.getElementById("settings-mcq-choices")as HTMLInputElement|null;
		if (mcqChoicesSetting) mcqChoicesSetting.value=settings.mcqChoices.toString();
		let perfMaster=document.getElementById("settings-perf-master")as HTMLInputElement|null;
		if (perfMaster) perfMaster.checked=settings.performanceMode;
		let perfWave=document.getElementById("settings-perf-wave")as HTMLInputElement|null;
		if (perfWave) perfWave.checked=settings.waveBackground;
		let perfBlur=document.getElementById("settings-perf-blur")as HTMLInputElement|null;
		if (perfBlur) perfBlur.checked=settings.blurEffect;
		autoContinue=settings.autoContinue;
		shuffleMode=settings.shuffle;
		currentDifficulty=settings.difficulty;
		currentScope=settings.defaultScope;
		if (autoContinueToggle) autoContinueToggle.checked=autoContinue;
		if (shuffleToggle) shuffleToggle.checked=shuffleMode;
		if (scopeSelect) scopeSelect.value=currentScope;
		if (difficultySelect) difficultySelect.value=currentDifficulty;
		setMode(settings.defaultMode);
	}
	/** Saves current settings to localStorage and updates runtime state. */
	function saveSettings(): void{
		localStorage.setItem("physicsSettings",JSON.stringify(settings));
		autoContinue=settings.autoContinue;
		shuffleMode=settings.shuffle;
		currentDifficulty=settings.difficulty;
		currentScope=settings.defaultScope;
		if (autoContinueToggle) autoContinueToggle.checked=autoContinue;
		if (shuffleToggle) shuffleToggle.checked=shuffleMode;
		if (scopeSelect) scopeSelect.value=currentScope;
		if (difficultySelect) difficultySelect.value=currentDifficulty;
		applyTheme(settings.theme);
	}
	/** Displays a question object in the UI (text, MCQ choices, etc.). */
	function displayQuestion(q: Question): void{
		if (!questionArea) return;
		questionArea.innerHTML=`<div class="math">${q.text}</div>`;
		if (currentTopicSpan) currentTopicSpan.textContent=q.topicName;
		if (mcqMode && q.choices && q.choices.length>0 && mcqChoicesContainer){
			mcqChoicesContainer.style.display="flex";
			mcqChoicesContainer.innerHTML=q.choices.map(c=>`<button class="choice-button" data-value="${c.replace(/"/g,'&quot;')}">${c}</button>`).join("");
		}
		else if (mcqChoicesContainer){
			mcqChoicesContainer.style.display="none";
		}
		if (answerBox){
			answerBox.disabled=false;
			answerBox.value="";
			answerBox.focus();
		}
		if (checkBtn) checkBtn.disabled=false;
		if (physicsPreview){
			physicsPreview.textContent="";
			physicsPreview.classList.remove("has-content");
		}
		if (expectedFormatDiv){
			if (q.unit) expectedFormatDiv.textContent=`Expected format: numeric value with units (${q.unit}). Use ^ for exponents.`;
			else expectedFormatDiv.textContent=`Enter your answer as a number or expression. Use ^ for exponents.`;
		}
	}
	/** Shows result (correct/incorrect) and the correct answer. */
	function showResult(isCorrect: boolean, correctAnswer: string, explanation?: string): void{
		if (!resultsDiv) return;
		if (isCorrect){
			resultsDiv.innerHTML=`<div class="result-success"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg><div><h3>Correct!</h3><p>${explanation || "Great job!"}</p></div></div>`;
			resultsDiv.classList.add("correct");
			resultsDiv.classList.remove("incorrect");
		}
		else{
			resultsDiv.innerHTML=`<div class="result-error"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg><div><h3>Incorrect</h3><p>Correct answer: ${correctAnswer}</p>${explanation?`<p>${explanation}</p>`:""}</div></div>`;
			resultsDiv.classList.add("incorrect");
			resultsDiv.classList.remove("correct");
		}
	}
	/** Checks user answer against current question using tolerance for numeric. */
	function checkAnswer(): void{
		if (!currentQuestion || !answerBox) return;
		let userAnswer=answerBox.value.trim();
		if (mcqMode && currentQuestion.choices){
			let selected=document.querySelector(".choice-button.selected") as HTMLButtonElement|null;
			if (selected) userAnswer=selected.dataset.value||"";
		}
		let isCorrect=false;
		if (currentQuestion.answerType==='numeric'){
			let userNum=parseFloat(userAnswer);
			let correctNum=parseFloat(currentQuestion.answer);
			let tolerance=Math.pow(10,-settings.decimalPlaces);
			isCorrect=!isNaN(userNum) && !isNaN(correctNum) && Math.abs(userNum-correctNum)<=tolerance;
		}
		else{
			isCorrect=userAnswer.toLowerCase()===currentQuestion.answer.toLowerCase();
		}
		showResult(isCorrect,currentQuestion.answer,currentQuestion.answerType==='numeric'?`Accepted tolerance: ±${Math.pow(10,-settings.decimalPlaces)}`:"");
		if (mentalModeActive && mentalSession.active && !mentalSession.paused){
			if (isCorrect) mentalSession.score++;
			mentalSession.total++;
			if (scoreDisplay) scoreDisplay.textContent=`${mentalSession.score} / ${mentalSession.total}`;
			if (!mentalSession.unlimited && mentalSession.total>=mentalSession.questionsRemaining){
				endMentalSession();
			}
			else{
				generateNextMentalQuestion();
			}
		}
	}
	/** Generates a new question using the current active topic / shuffle / scope. */
	function generateNewQuestion(): void{
		if (!generatorRegistry || Object.keys(generatorRegistry).length===0){
			console.warn("No generators registered yet");
			return;
		}
		let topicId=activeTopicId;
		if (shuffleMode){
			let topics=Object.keys(generatorRegistry);
			if (currentScope!=='all'){
				let filtered=topics.filter(t=>t.startsWith(currentScope));
				if (filtered.length>0) topics=filtered;
			}
			topicId=topics[Math.floor(Math.random()*topics.length)];
		}
		if (!topicId || !generatorRegistry[topicId]){
			if (activeTopicId && generatorRegistry[activeTopicId]) topicId=activeTopicId;
			else{
				let firstKey=Object.keys(generatorRegistry)[0];
				if (firstKey) topicId=firstKey;
				else return;
			}
		}
		let genOptions: GenerateOptions={
			difficulty: currentDifficulty,
			forceMcq: mcqMode,
			seed: Date.now()
		};
		try{
			let newQuestion=generatorRegistry[topicId](genOptions);
			currentQuestion=newQuestion;
			displayQuestion(newQuestion);
			if (autoContinue){
				setTimeout(()=>{
					if (currentQuestion) checkAnswer();
				},settings.autoCheckDelayMs);
			}
		}
		catch(e){
			console.error("Generator error",e);
		}
	}
	/** Starts a mental mode session (timer, score reset, etc.). */
	function startMentalSession(): void{
		if (mentalSession.active) endMentalSession();
		mentalSession.active=true;
		mentalSession.paused=false;
		mentalSession.score=0;
		mentalSession.total=0;
		mentalSession.timeLeft=settings.timerSeconds;
		mentalSession.unlimited=unlimitedToggle?.checked||false;
		mentalSession.questionsRemaining=settings.maxQuestions;
		mentalSession.startTime=Date.now();
		if (timerDisplay) timerDisplay.textContent=`00:${mentalSession.timeLeft<10?"0"+mentalSession.timeLeft:mentalSession.timeLeft}`;
		if (scoreDisplay) scoreDisplay.textContent=`0 / 0`;
		if (statisticsPanel) statisticsPanel.style.display="flex";
		if (startSessionBtn) startSessionBtn.textContent="End Session";
		if (pauseSessionBtn) pauseSessionBtn.classList.remove("hidden");
		if (skipQuestionBtn) skipQuestionBtn.classList.remove("hidden");
		mentalSession.timerInterval=window.setInterval(()=>{
			if (!mentalSession.active || mentalSession.paused) return;
			if (mentalSession.timeLeft<=0){
				endMentalSession();
				showResult(false,"Time's up!","Session ended.");
			}
			else{
				mentalSession.timeLeft--;
				if (timerDisplay) timerDisplay.textContent=`00:${mentalSession.timeLeft<10?"0"+mentalSession.timeLeft:mentalSession.timeLeft}`;
				if (mentalProgressBar){
					let progress=(mentalSession.total/mentalSession.questionsRemaining)*100;
					if (mentalSession.unlimited) progress=0;
					mentalProgressBar.style.width=Math.min(100,progress)+"%";
				}
			}
		},1000);
		generateNextMentalQuestion();
	}
	/** Ends mental mode session and cleans up timer. */
	function endMentalSession(): void{
		if (mentalSession.timerInterval){
			clearInterval(mentalSession.timerInterval);
			mentalSession.timerInterval=null;
		}
		mentalSession.active=false;
		mentalSession.paused=false;
		if (startSessionBtn) startSessionBtn.textContent="Start Session";
		if (pauseSessionBtn) pauseSessionBtn.classList.add("hidden");
		if (skipQuestionBtn) skipQuestionBtn.classList.add("hidden");
		if (statisticsPanel) statisticsPanel.style.display="none";
	}
	/** Generates the next question in mental mode (same topic or random within scope). */
	function generateNextMentalQuestion(): void{
		if (!mentalSession.active) return;
		let topicId=activeTopicId;
		if (mentalShuffleToggle?.checked){
			let topics=Object.keys(generatorRegistry);
			let scopeValue=mentalScopeSelect?.value||'all';
			if (scopeValue!=='all'){
				let filtered=topics.filter(t=>t.startsWith(scopeValue));
				if (filtered.length>0) topics=filtered;
			}
			topicId=topics[Math.floor(Math.random()*topics.length)];
		}
		if (!topicId || !generatorRegistry[topicId]) topicId=Object.keys(generatorRegistry)[0];
		if (!topicId) return;
		let genOptions: GenerateOptions={
			difficulty: currentDifficulty,
			forceMcq: mcqMode,
			seed: Date.now()
		};
		try{
			let newQuestion=generatorRegistry[topicId](genOptions);
			currentQuestion=newQuestion;
			displayQuestion(newQuestion);
		}
		catch(e){}
	}
	/** Registers a topic generator (called from external modules). */
	function registerGenerator(topicId: string, generator: GeneratorFn): void{
		generatorRegistry[topicId]=generator;
		let pill=document.querySelector(`.topic-pill[data-topic="${topicId}"]`);
		if (pill) pill.classList.remove("hidden");
	}
	/** Initializes topic pills and search filter. */
	function initTopics(): void{
		if (!topicGrid) return;
		let pills=topicGrid.querySelectorAll(".topic-pill");
		pills.forEach(pill=>{
			let topic=pill.getAttribute("data-topic");
			if (topic && !generatorRegistry[topic]) pill.classList.add("hidden");
			pill.addEventListener("click",()=>{
				let tid=pill.getAttribute("data-topic");
				if (tid && generatorRegistry[tid]){
					activeTopicId=tid;
					document.querySelectorAll(".topic-pill").forEach(p=>p.classList.remove("active"));
					pill.classList.add("active");
					if (generateBtn) generateBtn.disabled=false;
				}
			});
		});
		if (topicSearch){
			topicSearch.addEventListener("input",(e)=>{
				let term=(e.target as HTMLInputElement).value.toLowerCase();
				pills.forEach(pill=>{
					let text=pill.textContent?.toLowerCase()||"";
					if (text.includes(term)) (pill as HTMLElement).style.display="flex";
					else (pill as HTMLElement).style.display="none";
				});
			});
		}
	}
	// ----- Event listeners -----
	if (modeSingleBtn) modeSingleBtn.addEventListener("click",()=>setMode("single"));
	if (modeMentalBtn) modeMentalBtn.addEventListener("click",()=>setMode("mental"));
	if (generateBtn) generateBtn.addEventListener("click",()=>generateNewQuestion());
	if (checkBtn) checkBtn.addEventListener("click",()=>checkAnswer());
	if (clearAnswerBtn && answerBox){
		clearAnswerBtn.addEventListener("click",()=>{
			answerBox.value="";
			answerBox.focus();
			if (physicsPreview){
				physicsPreview.textContent="";
				physicsPreview.classList.remove("has-content");
			}
		});
		answerBox.addEventListener("input",()=>{
			if (physicsPreview) physicsPreview.textContent=answerBox.value;
		});
	}
	if (themeToggle) themeToggle.addEventListener("click",()=>{
		let newTheme=document.documentElement.classList.contains("dark")?"light":"dark";
		settings.theme=newTheme;
		applyTheme(newTheme);
		saveSettings();
	});
	if (settingsBtn && settingsModal) settingsBtn.addEventListener("click",()=>settingsModal.classList.add("show"));
	if (settingsClose && settingsModal) settingsClose.addEventListener("click",()=>settingsModal.classList.remove("show"));
	if (settingsSave && settingsModal){
		settingsSave.addEventListener("click",()=>{
			let themeSel=document.getElementById("settings-theme")as HTMLSelectElement|null;
			if (themeSel) settings.theme=themeSel.value as any;
			let defaultModeSel=document.getElementById("settings-default-mode")as HTMLSelectElement|null;
			if (defaultModeSel) settings.defaultMode=defaultModeSel.value as any;
			let autoCont=document.getElementById("settings-auto-continue")as HTMLInputElement|null;
			if (autoCont) settings.autoContinue=autoCont.checked;
			let shuffleCh=document.getElementById("settings-shuffle")as HTMLInputElement|null;
			if (shuffleCh) settings.shuffle=shuffleCh.checked;
			let scopeSel=document.getElementById("settings-scope")as HTMLSelectElement|null;
			if (scopeSel) settings.defaultScope=scopeSel.value;
			let notif=document.getElementById("settings-notifications")as HTMLInputElement|null;
			if (notif) settings.notifications=notif.checked;
			let diff=document.getElementById("settings-difficulty")as HTMLSelectElement|null;
			if (diff) settings.difficulty=diff.value as any;
			let timer=document.getElementById("settings-timer")as HTMLInputElement|null;
			if (timer) settings.timerSeconds=parseInt(timer.value);
			let maxQ=document.getElementById("settings-max-questions")as HTMLInputElement|null;
			if (maxQ) settings.maxQuestions=parseInt(maxQ.value);
			let delay=document.getElementById("settings-auto-check-delay")as HTMLInputElement|null;
			if (delay) settings.autoCheckDelayMs=parseInt(delay.value);
			let dec=document.getElementById("settings-decimal-places")as HTMLInputElement|null;
			if (dec) settings.decimalPlaces=parseInt(dec.value);
			let snd=document.getElementById("settings-sound")as HTMLInputElement|null;
			if (snd) settings.sound=snd.checked;
			let vib=document.getElementById("settings-vibration")as HTMLInputElement|null;
			if (vib) settings.vibration=vib.checked;
			let mcqCh=document.getElementById("settings-mcq-choices")as HTMLInputElement|null;
			if (mcqCh) settings.mcqChoices=parseInt(mcqCh.value);
			let perf=document.getElementById("settings-perf-master")as HTMLInputElement|null;
			if (perf) settings.performanceMode=perf.checked;
			let wave=document.getElementById("settings-perf-wave")as HTMLInputElement|null;
			if (wave) settings.waveBackground=wave.checked;
			let blur=document.getElementById("settings-perf-blur")as HTMLInputElement|null;
			if (blur) settings.blurEffect=blur.checked;
			saveSettings();
			settingsModal.classList.remove("show");
		});
	}
	if (settingsTabBasic && settingsBasicPanel && settingsTabAdvanced && settingsAdvancedPanel){
		settingsTabBasic.addEventListener("click",()=>{
			settingsTabBasic.classList.add("active");
			settingsTabAdvanced.classList.remove("active");
			settingsBasicPanel.classList.remove("hidden");
			settingsAdvancedPanel.classList.add("hidden");
		});
		settingsTabAdvanced.addEventListener("click",()=>{
			settingsTabAdvanced.classList.add("active");
			settingsTabBasic.classList.remove("active");
			settingsAdvancedPanel.classList.remove("hidden");
			settingsBasicPanel.classList.add("hidden");
		});
	}
	if (shortcutsBtn && shortcutsModal) shortcutsBtn.addEventListener("click",()=>shortcutsModal.classList.add("show"));
	if (shortcutsClose && shortcutsModal) shortcutsClose.addEventListener("click",()=>shortcutsModal.classList.remove("show"));
	if (shortcutsGotit && shortcutsModal) shortcutsGotit.addEventListener("click",()=>shortcutsModal.classList.remove("show"));
	if (helpBtn && onboardingOverlay) helpBtn.addEventListener("click",()=>onboardingOverlay.classList.add("show"));
	if (onboardingClose && onboardingOverlay) onboardingClose.addEventListener("click",()=>onboardingOverlay.classList.remove("show"));
	if (onboardingGotit && onboardingOverlay){
		onboardingGotit.addEventListener("click",()=>{
			onboardingOverlay.classList.remove("show");
			localStorage.setItem("onboardingSeen","true");
		});
	}
	if (autoContinueToggle) autoContinueToggle.addEventListener("change",(e)=>autoContinue=(e.target as HTMLInputElement).checked);
	if (shuffleToggle) shuffleToggle.addEventListener("change",(e)=>shuffleMode=(e.target as HTMLInputElement).checked);
	if (mcqToggle) mcqToggle.addEventListener("change",(e)=>mcqMode=(e.target as HTMLInputElement).checked);
	if (scopeSelect) scopeSelect.addEventListener("change",(e)=>currentScope=(e.target as HTMLSelectElement).value);
	if (difficultySelect) difficultySelect.addEventListener("change",(e)=>currentDifficulty=(e.target as HTMLSelectElement).value as any);
	if (startSessionBtn){
		startSessionBtn.addEventListener("click",()=>{
			if (mentalSession.active) endMentalSession();
			else startMentalSession();
		});
	}
	if (pauseSessionBtn){
		pauseSessionBtn.addEventListener("click",()=>{
			if (!mentalSession.active) return;
			mentalSession.paused=!mentalSession.paused;
			pauseSessionBtn.innerHTML=mentalSession.paused?'▶':'⏸';
		});
	}
	if (skipQuestionBtn){
		skipQuestionBtn.addEventListener("click",()=>{
			if (!mentalSession.active) return;
			generateNextMentalQuestion();
		});
	}
	if (copyAnswerBtn && resultsDiv){
		copyAnswerBtn.addEventListener("click",()=>{
			let correctText=resultsDiv.querySelector(".result-error p")?.textContent?.replace("Correct answer: ","")||"";
			if (correctText) navigator.clipboard.writeText(correctText);
		});
	}
	if (physicsToolbarBtns.length){
		physicsToolbarBtns.forEach(btn=>{
			btn.addEventListener("click",()=>{
				let symbol=btn.getAttribute("data-symbol")||"";
				let template=btn.getAttribute("data-template");
				if (!answerBox) return;
				let start=answerBox.selectionStart||0;
				let end=answerBox.selectionEnd||0;
				let insert=symbol;
				if (template) insert=template;
				let newValue=answerBox.value.substring(0,start)+insert+answerBox.value.substring(end);
				answerBox.value=newValue;
				answerBox.focus();
				let newPos=start+insert.length;
				answerBox.setSelectionRange(newPos,newPos);
				if (physicsPreview) physicsPreview.textContent=newValue;
			});
		});
	}
	if (dropdownBtn && physicsDropdown){
		dropdownBtn.addEventListener("click",(e)=>{
			e.stopPropagation();
			physicsDropdown.classList.toggle("show");
		});
		document.addEventListener("click",(e)=>{
			if (!physicsDropdown.contains(e.target as Node) && e.target!==dropdownBtn) physicsDropdown.classList.remove("show");
		});
	}
	// ----- Initialization -----
	loadSettings();
	initTopics();
	if (!localStorage.getItem("onboardingSeen") && onboardingOverlay) onboardingOverlay.classList.add("show");
	// Expose registerGenerator globally for modules to call
	(window as any).registerPhysicsGenerator=registerGenerator;
});