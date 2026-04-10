import type { Question, GenerateOptions, MentalSession } from './types.d.js';
import { generatorRegistry, topicMetadata } from "./modules/index.js";
import { settings, loadSettings, saveSettings, applyTheme, getEffectiveTheme, defaultSettings, resetSettings } from './settings.js';
export function initApp(){
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
	const elemSettingsReset=document.getElementById("settings-reset")as HTMLButtonElement;
	let currentQuestion: Question|null=null;
	let activeTopicId: string|null=null;
	let currentDifficulty: "easy"|"medium"|"hard"="medium";
	let mcqMode=false;
	let autoContinue=false;
	let shuffleMode=false;
	let currentScope="all";
	let mentalModeActive=false;
	let autoContinueTimeout: number|null=null;
	let mentalSession: MentalSession={
		active: false,
		paused: false,
		score: 0,
		total: 0,
		timeLeft: 30,
		timerInterval: null,
		questionsRemaining: 5,
		unlimited: false,
		startTime: 0,
		answerTimes: [],
	};
	const showModal=(modal: HTMLDivElement)=>{
		modal.classList.remove("hidden");
		modal.classList.add("show");
	};
	const hideModal=(modal: HTMLDivElement)=>{
		modal.classList.add("hidden");
		modal.classList.remove("show");
	};
	const getScopeFromTopicId=(topicId: string): string=>{
		return topicId.split('_')[0]||'general';
	};
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
				option.textContent=scope==="all"?"All":scope;
				elemScopeSelect.appendChild(option);
			});
		}
		if(elemMentalScopeSelect){
			elemMentalScopeSelect.innerHTML="";
			scopeList.forEach(scope=>{
				const option=document.createElement("option");
				option.value=scope;
				option.textContent=scope==="all"?"All":scope;
				elemMentalScopeSelect.appendChild(option);
			});
		}
	};
	const rebuildTopicPills=()=>{
		if(!elemTopicGrid) return;
		elemTopicGrid.innerHTML="";
		const topicIds=Object.keys(generatorRegistry);
		for(const id of topicIds){
			const scope=getScopeFromTopicId(id);
			if(currentScope!=="all"&&scope!==currentScope) continue;
			const topicName=topicMetadata[id]?.name||id;
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
	const filterTopics=(term: string)=>{
		if(!elemTopicGrid) return;
		const pills=elemTopicGrid.querySelectorAll(".topic-pill");
		const lowerTerm=term.toLowerCase();
		pills.forEach(pill=>{
			const text=pill.textContent?.toLowerCase()||"";
			(pill as HTMLElement).style.display=text.includes(lowerTerm)?"flex":"none";
		});
	};
	const setMode=(mode: "single"|"mental")=>{
		if(autoContinueTimeout){
			clearTimeout(autoContinueTimeout);
			autoContinueTimeout=null;
		}
		if(mode==="single"){
			elemModeSingleBtn.classList.add("active");
			elemModeMentalBtn.classList.remove("active");
			elemSingleControls.classList.remove("hidden");
			elemMentalControls.classList.add("hidden");
			mentalModeActive=false;
			if(mentalSession.active) endMentalSession();
		}
		else{
			elemModeMentalBtn.classList.add("active");
			elemModeSingleBtn.classList.remove("active");
			elemMentalControls.classList.remove("hidden");
			elemSingleControls.classList.add("hidden");
			mentalModeActive=true;
		}
	};
	const updateSettingsUI=()=>{
		const themeSelect=document.getElementById("settings-theme")as HTMLSelectElement;
		if(themeSelect) themeSelect.value=settings.theme;
		const defaultModeSelect=document.getElementById("settings-default-mode")as HTMLSelectElement;
		if(defaultModeSelect) defaultModeSelect.value=settings.defaultMode;
		const autoCont=document.getElementById("settings-auto-continue")as HTMLInputElement;
		if(autoCont) autoCont.checked=settings.autoContinue;
		const shuffleCh=document.getElementById("settings-shuffle")as HTMLInputElement;
		if(shuffleCh) shuffleCh.checked=settings.shuffle;
		const scopeSel=document.getElementById("settings-scope")as HTMLSelectElement;
		if(scopeSel) scopeSel.value=settings.defaultScope;
		const notif=document.getElementById("settings-notifications")as HTMLInputElement;
		if(notif) notif.checked=settings.notifications;
		const diff=document.getElementById("settings-difficulty")as HTMLSelectElement;
		if(diff) diff.value=settings.difficulty;
		const timer=document.getElementById("settings-timer")as HTMLInputElement;
		if(timer) timer.value=settings.timerSeconds.toString();
		const maxQ=document.getElementById("settings-max-questions")as HTMLInputElement;
		if(maxQ) maxQ.value=settings.maxQuestions.toString();
		const delay=document.getElementById("settings-auto-check-delay")as HTMLInputElement;
		if(delay) delay.value=settings.autoCheckDelayMs.toString();
		const dec=document.getElementById("settings-decimal-places")as HTMLInputElement;
		if(dec) dec.value=settings.decimalPlaces.toString();
		const snd=document.getElementById("settings-sound")as HTMLInputElement;
		if(snd) snd.checked=settings.sound;
		const vib=document.getElementById("settings-vibration")as HTMLInputElement;
		if(vib) vib.checked=settings.vibration;
		const mcqCh=document.getElementById("settings-mcq-choices")as HTMLInputElement;
		if(mcqCh) mcqCh.value=settings.mcqChoices.toString();
		const perf=document.getElementById("settings-perf-master")as HTMLInputElement;
		if(perf) perf.checked=settings.performanceMode;
		const wave=document.getElementById("settings-perf-wave")as HTMLInputElement;
		if(wave) wave.checked=settings.waveBackground;
		const blur=document.getElementById("settings-perf-blur")as HTMLInputElement;
		if(blur) blur.checked=settings.blurEffect;
	};
	const loadAllSettings=()=>{
		loadSettings();
		applyTheme(settings.theme);
		updateSettingsUI();
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
	const saveAllSettings=()=>{
		saveSettings();
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
		const sumTimes=mentalSession.answerTimes.reduce((a: number, b: number)=>a+b,0);
		const avgTime=sumTimes/total;
		elemAccuracyStat.textContent=`Accuracy: ${accuracy.toFixed(1)}%`;
		elemAvgTimeStat.textContent=`Avg: ${avgTime.toFixed(1)}s`;
	};
	const displayQuestion=(q: Question)=>{
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
			if(elemAnswerBox) elemAnswerBox.style.display="none";
		}
		else{
			if(elemMcqChoicesContainer) elemMcqChoicesContainer.style.display="none";
			if(elemAnswerBox) elemAnswerBox.style.display="block";
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
			else if(q.answerType==="string") elemExpectedFormatDiv.textContent="Enter your answer as text (conceptual question).";
			else elemExpectedFormatDiv.textContent="Enter your answer as a number or expression. Use ^ for exponents.";
		}
	};
	const showResult=(isCorrect: boolean, correctAnswer: string, explanation?: string)=>{
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
		if(autoContinue&&!mentalModeActive&&!mentalSession.active){
			if(autoContinueTimeout) clearTimeout(autoContinueTimeout);
			autoContinueTimeout=window.setTimeout(()=>{
				generateNewQuestion();
				autoContinueTimeout=null;
			},3000);
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
			const timeSpent=(Date.now()-mentalSession.startTime)/1000;
			mentalSession.answerTimes.push(timeSpent);
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
		if(autoContinueTimeout){
			clearTimeout(autoContinueTimeout);
			autoContinueTimeout=null;
		}
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
		const options: GenerateOptions={
			difficulty: currentDifficulty,
			forceMcq: mcqMode,
			seed: Date.now(),
		};
		try{
			const newQuestion=generatorRegistry[topicId](options);
			currentQuestion=newQuestion;
			displayQuestion(newQuestion);
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
		mentalSession.answerTimes=[];
		const mins=Math.floor(mentalSession.timeLeft/60);
		const secs=mentalSession.timeLeft%60;
		if(elemTimerDisplay) elemTimerDisplay.textContent=`${mins.toString().padStart(2,"0")}:${secs.toString().padStart(2,"0")}`;
		if(elemScoreDisplay) elemScoreDisplay.textContent="0 / 0";
		if(elemStatisticsPanel) elemStatisticsPanel.style.display="flex";
		if(elemStartSessionBtn) elemStartSessionBtn.textContent="End Session";
		if(elemPauseSessionBtn) elemPauseSessionBtn.classList.remove("hidden");
		if(elemSkipQuestionBtn) elemSkipQuestionBtn.classList.remove("hidden");
		updateStatistics();
		if(mentalSession.timerInterval) clearInterval(mentalSession.timerInterval);
		mentalSession.timerInterval=window.setInterval(()=>{
			if(!mentalSession.active||mentalSession.paused) return;
			if(mentalSession.timeLeft<=0){
				endMentalSession();
				showResult(false,"Time's up!","Session ended.");
			}
			else{
				mentalSession.timeLeft--;
				const minsLeft=Math.floor(mentalSession.timeLeft/60);
				const secsLeft=mentalSession.timeLeft%60;
				if(elemTimerDisplay) elemTimerDisplay.textContent=`${minsLeft.toString().padStart(2,"0")}:${secsLeft.toString().padStart(2,"0")}`;
				if(elemMentalProgressBar){
					let progress=0;
					if(!mentalSession.unlimited&&mentalSession.questionsRemaining>0){
						progress=(mentalSession.total/mentalSession.questionsRemaining)*100;
					}
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
		if(elemMentalProgressBar) elemMentalProgressBar.style.width="0%";
		if(elemTimerDisplay) elemTimerDisplay.textContent="00:30";
		if(elemScoreDisplay) elemScoreDisplay.textContent="0 / 0";
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
		const options: GenerateOptions={
			difficulty: currentDifficulty,
			forceMcq: mcqMode,
			seed: Date.now(),
		};
		try{
			const newQuestion=generatorRegistry[topicId](options);
			currentQuestion=newQuestion;
			displayQuestion(newQuestion);
		}
		catch(e){}
	};
	const toggleTheme=()=>{
		let currentTheme=settings.theme;
		let effective=getEffectiveTheme();
		let newThemeSetting: typeof settings.theme;
		if(currentTheme==="system"){
			newThemeSetting=effective==="dark"?"light":"dark";
		}
		else{
			newThemeSetting=currentTheme==="dark"?"light":"dark";
		}
		settings.theme=newThemeSetting;
		applyTheme(settings.theme);
		saveAllSettings();
	};
	const handleKeydown=(e: KeyboardEvent)=>{
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
			showModal(elemSettingsModal);
		}
		else if(e.ctrlKey&&e.shiftKey&&e.key==='T'){
			e.preventDefault();
			toggleTheme();
		}
	};
	document.addEventListener("keydown",handleKeydown);
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
		const selectedChoice=document.querySelector(".choice-button.selected");
		if(selectedChoice) selectedChoice.classList.remove("selected");
	});
	elemAnswerBox?.addEventListener("input",()=>{
		if(elemPhysicsPreview) elemPhysicsPreview.textContent=elemAnswerBox.value;
		if(elemPhysicsPreview.textContent) elemPhysicsPreview.classList.add("has-content");
		else elemPhysicsPreview.classList.remove("has-content");
	});
	elemThemeToggle?.addEventListener("click",toggleTheme);
	elemSettingsBtn?.addEventListener("click",()=>showModal(elemSettingsModal));
	elemSettingsClose?.addEventListener("click",()=>hideModal(elemSettingsModal));
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
		saveAllSettings();
		hideModal(elemSettingsModal);
	});
	elemSettingsReset?.addEventListener("click",()=>{
		resetSettings();
		loadAllSettings();
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
	elemShortcutsBtn?.addEventListener("click",()=>showModal(elemShortcutsModal));
	elemShortcutsClose?.addEventListener("click",()=>hideModal(elemShortcutsModal));
	elemShortcutsGotit?.addEventListener("click",()=>hideModal(elemShortcutsModal));
	elemHelpBtn?.addEventListener("click",()=>showModal(elemOnboardingOverlay));
	elemOnboardingClose?.addEventListener("click",()=>hideModal(elemOnboardingOverlay));
	elemOnboardingGotit?.addEventListener("click",()=>{
		hideModal(elemOnboardingOverlay);
		localStorage.setItem("onboardingSeen","true");
	});
	elemAutoContinueToggle?.addEventListener("change",(e)=>autoContinue=(e.target as HTMLInputElement).checked);
	elemShuffleToggle?.addEventListener("change",(e)=>shuffleMode=(e.target as HTMLInputElement).checked);
	elemMcqToggle?.addEventListener("change",(e)=>{
		mcqMode=(e.target as HTMLInputElement).checked;
		if(currentQuestion){
			const options: GenerateOptions={
				difficulty: currentDifficulty,
				forceMcq: mcqMode,
				seed: Date.now(),
			};
			try{
				const topicId=activeTopicId||Object.keys(generatorRegistry)[0];
				if(topicId&&generatorRegistry[topicId]){
					const newQuestion=generatorRegistry[topicId](options);
					currentQuestion=newQuestion;
					displayQuestion(newQuestion);
				}
			}
			catch(err){}
		}
	});
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
		if(currentQuestion){
			navigator.clipboard.writeText(currentQuestion.answer);
		}
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
	loadAllSettings();
	populateScopeSelects();
	rebuildTopicPills();
	if(!localStorage.getItem("onboardingSeen")&&elemOnboardingOverlay){
		showModal(elemOnboardingOverlay);
	}
}