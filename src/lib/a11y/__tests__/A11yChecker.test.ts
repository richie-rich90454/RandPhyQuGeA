import {describe, it, expect, beforeEach} from "vitest";
import {A11yChecker} from "../A11yChecker";
beforeEach(() => {
	document.body.innerHTML="";
	document.documentElement.removeAttribute("lang");
});
describe("A11yChecker.checkImageAlt", () => {
	it("flags an img without alt", () => {
		document.body.innerHTML="<img src='photo.png'>";
		let issues=new A11yChecker().checkImageAlt();
		expect(issues).toHaveLength(1);
		expect(issues[0]!.rule).toBe("img-alt");
		expect(issues[0]!.severity).toBe("error");
	});
	it("passes an img with empty alt (decorative)", () => {
		document.body.innerHTML="<img src='photo.png' alt=''>";
		expect(new A11yChecker().checkImageAlt()).toHaveLength(0);
	});
	it("passes an img with alt text", () => {
		document.body.innerHTML="<img src='photo.png' alt='A diagram'>";
		expect(new A11yChecker().checkImageAlt()).toHaveLength(0);
	});
});
describe("A11yChecker.checkButtonNames", () => {
	it("flags a button with no text or aria-label", () => {
		document.body.innerHTML="<button></button>";
		let issues=new A11yChecker().checkButtonNames();
		expect(issues).toHaveLength(1);
		expect(issues[0]!.rule).toBe("button-name");
	});
	it("passes a button with text content", () => {
		document.body.innerHTML="<button>Save</button>";
		expect(new A11yChecker().checkButtonNames()).toHaveLength(0);
	});
	it("passes a button with aria-label", () => {
		document.body.innerHTML="<button aria-label='Close'></button>";
		expect(new A11yChecker().checkButtonNames()).toHaveLength(0);
	});
	it("passes a button with aria-labelledby", () => {
		document.body.innerHTML="<span id='lbl'>Submit</span><button aria-labelledby='lbl'></button>";
		expect(new A11yChecker().checkButtonNames()).toHaveLength(0);
	});
});
describe("A11yChecker.checkLinkNames", () => {
	it("flags a link with no accessible name", () => {
		document.body.innerHTML="<a href='#'></a>";
		let issues=new A11yChecker().checkLinkNames();
		expect(issues).toHaveLength(1);
		expect(issues[0]!.rule).toBe("link-name");
	});
	it("passes a link with text", () => {
		document.body.innerHTML="<a href='#'>Home</a>";
		expect(new A11yChecker().checkLinkNames()).toHaveLength(0);
	});
	it("ignores links without href", () => {
		document.body.innerHTML="<a></a>";
		expect(new A11yChecker().checkLinkNames()).toHaveLength(0);
	});
});
describe("A11yChecker.checkInputLabels", () => {
	it("flags an input with no label", () => {
		document.body.innerHTML="<input type='text'>";
		let issues=new A11yChecker().checkInputLabels();
		expect(issues).toHaveLength(1);
		expect(issues[0]!.rule).toBe("input-label");
	});
	it("passes an input with a for-label", () => {
		document.body.innerHTML="<label for='name'>Name</label><input id='name' type='text'>";
		expect(new A11yChecker().checkInputLabels()).toHaveLength(0);
	});
	it("passes an input wrapped in a label", () => {
		document.body.innerHTML="<label>Name<input type='text'></label>";
		expect(new A11yChecker().checkInputLabels()).toHaveLength(0);
	});
	it("passes an input with aria-label", () => {
		document.body.innerHTML="<input type='text' aria-label='Email'>";
		expect(new A11yChecker().checkInputLabels()).toHaveLength(0);
	});
	it("ignores hidden/submit/button/reset inputs", () => {
		document.body.innerHTML="<input type='hidden'><input type='submit'><input type='button'><input type='reset'>";
		expect(new A11yChecker().checkInputLabels()).toHaveLength(0);
	});
	it("flags a textarea with no label", () => {
		document.body.innerHTML="<textarea></textarea>";
		expect(new A11yChecker().checkInputLabels()).toHaveLength(1);
	});
	it("flags a select with no label", () => {
		document.body.innerHTML="<select><option>A</option></select>";
		expect(new A11yChecker().checkInputLabels()).toHaveLength(1);
	});
});
describe("A11yChecker.checkHeadingHierarchy", () => {
	it("flags a skip from h1 to h3", () => {
		document.body.innerHTML="<h1>Title</h1><h3>Subtitle</h3>";
		let issues=new A11yChecker().checkHeadingHierarchy();
		expect(issues).toHaveLength(1);
		expect(issues[0]!.rule).toBe("heading-order");
		expect(issues[0]!.severity).toBe("warning");
	});
	it("passes sequential h1 -> h2", () => {
		document.body.innerHTML="<h1>Title</h1><h2>Subtitle</h2>";
		expect(new A11yChecker().checkHeadingHierarchy()).toHaveLength(0);
	});
	it("passes a single heading", () => {
		document.body.innerHTML="<h2>Section</h2>";
		expect(new A11yChecker().checkHeadingHierarchy()).toHaveLength(0);
	});
	it("flags multiple skips", () => {
		document.body.innerHTML="<h1>A</h1><h3>B</h3><h5>C</h5>";
		expect(new A11yChecker().checkHeadingHierarchy()).toHaveLength(2);
	});
});
describe("A11yChecker.checkDuplicateIds", () => {
	it("flags a duplicate ID", () => {
		document.body.innerHTML="<div id='x'></div><div id='x'></div>";
		let issues=new A11yChecker().checkDuplicateIds();
		expect(issues).toHaveLength(1);
		expect(issues[0]!.rule).toBe("duplicate-id");
	});
	it("passes unique IDs", () => {
		document.body.innerHTML="<div id='a'></div><div id='b'></div>";
		expect(new A11yChecker().checkDuplicateIds()).toHaveLength(0);
	});
});
describe("A11yChecker.checkDocumentLang", () => {
	it("flags a missing lang on html", () => {
		document.documentElement.removeAttribute("lang");
		let issues=new A11yChecker().checkDocumentLang();
		expect(issues).toHaveLength(1);
		expect(issues[0]!.rule).toBe("html-lang");
	});
	it("passes when html has lang", () => {
		document.documentElement.setAttribute("lang", "en");
		expect(new A11yChecker().checkDocumentLang()).toHaveLength(0);
	});
});
describe("A11yChecker.check (combined)", () => {
	it("returns all issues from every check", () => {
		document.documentElement.removeAttribute("lang");
		document.body.innerHTML="<img src='a.png'><button></button><h1>T</h1><h3>S</h3>";
		let issues=new A11yChecker().check();
		expect(issues.length).toBeGreaterThanOrEqual(3);
		let rules=issues.map(i => i.rule);
		expect(rules).toContain("img-alt");
		expect(rules).toContain("button-name");
		expect(rules).toContain("heading-order");
		expect(rules).toContain("html-lang");
	});
	it("returns no issues for a clean document", () => {
		document.documentElement.setAttribute("lang", "en");
		document.body.innerHTML="<h1>Title</h1><p>Content</p><button>OK</button>";
		expect(new A11yChecker().check()).toHaveLength(0);
	});
});
describe("A11yChecker.getAccessibleName", () => {
	it("uses textContent when present", () => {
		document.body.innerHTML="<button>Save</button>";
		let btn=document.querySelector("button")!;
		expect(new A11yChecker().getAccessibleName(btn)).toBe("Save");
	});
	it("uses aria-label when textContent is empty", () => {
		document.body.innerHTML="<button aria-label='Close'></button>";
		let btn=document.querySelector("button")!;
		expect(new A11yChecker().getAccessibleName(btn)).toBe("Close");
	});
	it("uses aria-labelledby when present", () => {
		document.body.innerHTML="<span id='l'>Submit</span><button aria-labelledby='l'></button>";
		let btn=document.querySelector("button")!;
		expect(new A11yChecker().getAccessibleName(btn)).toBe("Submit");
	});
});
describe("A11yChecker.selectorFor", () => {
	it("returns #id when the element has an id", () => {
		document.body.innerHTML="<div id='main'></div>";
		let el=document.querySelector("#main")!;
		expect(new A11yChecker().selectorFor(el)).toBe("#main");
	});
	it("returns tag.class when the element has a class", () => {
		document.body.innerHTML="<button class='primary'></button>";
		let el=document.querySelector("button")!;
		expect(new A11yChecker().selectorFor(el)).toBe("button.primary");
	});
	it("returns tag when no id or class", () => {
		document.body.innerHTML="<span></span>";
		let el=document.querySelector("span")!;
		expect(new A11yChecker().selectorFor(el)).toBe("span");
	});
});
