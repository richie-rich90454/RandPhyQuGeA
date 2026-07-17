import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
let pluginsRegistered = false;
export function registerGsapPlugins(): void {
    if (typeof window === "undefined") return;
    if (pluginsRegistered) return;
    gsap.registerPlugin(ScrollTrigger);
    pluginsRegistered = true;
}
export function safeTween(target: gsap.TweenTarget, vars: gsap.TweenVars): gsap.core.Tween | null {
    if (typeof window === "undefined") return null;
    registerGsapPlugins();
    return gsap.to(target, vars);
}
