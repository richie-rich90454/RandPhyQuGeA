import {render} from "solid-js/web";
import App from "./App";
import "./styles/globals.css";
import "./styles/glass.css";
let root=document.getElementById("root");
if (!root) {
	root=document.createElement("div");
	root.id="root";
	document.body.appendChild(root);
}
render(() => <App />, root);
