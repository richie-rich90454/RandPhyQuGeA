import type {AppSettings} from './types.d.js';
export const defaultSettings: AppSettings={
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
	blurEffect: true,
};
export let settings: AppSettings={...defaultSettings};
export const loadSettings=(): void=>{
	const saved=localStorage.getItem("physicsSettings");
	if(saved){
		try{
			const parsed=JSON.parse(saved);
			settings={...defaultSettings, ...parsed};
		}
		catch(e){}
	}
};
export const saveSettings=(): void=>{
	localStorage.setItem("physicsSettings", JSON.stringify(settings));
};
export const resetSettings=(): void=>{
	settings={...defaultSettings};
	saveSettings();
};
export const applyTheme=(theme: AppSettings["theme"]): void=>{
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
	localStorage.setItem("theme", theme);
};
export const getEffectiveTheme=(): string=>{
	const root=document.documentElement;
	if(root.classList.contains("dark")) return"dark";
	if(root.classList.contains("light")) return"light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
};