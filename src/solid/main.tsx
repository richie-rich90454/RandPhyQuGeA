import {render} from "solid-js/web";
import App from "./App";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/500.css";
import "@fontsource/noto-sans/600.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/noto-sans-mono/400.css";
import "@fontsource/noto-sans-mono/700.css";
import "./styles/globals.css";
import "./styles/glass.css";
import "./styles/motion.css";
let root=document.getElementById("root");
if (!root) {
	root=document.createElement("div");
	root.id="root";
	document.body.appendChild(root);
}
render(() => <App />, root);
