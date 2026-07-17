import {render} from "solid-js/web";
import App from "./App";
// eslint-disable-next-line import/no-unassigned-import
import "@fontsource/noto-sans/400.css";
// eslint-disable-next-line import/no-unassigned-import
import "@fontsource/noto-sans/500.css";
// eslint-disable-next-line import/no-unassigned-import
import "@fontsource/noto-sans/600.css";
// eslint-disable-next-line import/no-unassigned-import
import "@fontsource/noto-sans/700.css";
// eslint-disable-next-line import/no-unassigned-import
import "@fontsource/noto-sans-mono/400.css";
// eslint-disable-next-line import/no-unassigned-import
import "@fontsource/noto-sans-mono/700.css";
// eslint-disable-next-line import/no-unassigned-import
import "./styles/globals.css";
// eslint-disable-next-line import/no-unassigned-import
import "./styles/glass.css";
// eslint-disable-next-line import/no-unassigned-import
import "./styles/motion.css";
let root = document.getElementById("root");
if (!root) {
    root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);
}
render(() => <App />, root);
