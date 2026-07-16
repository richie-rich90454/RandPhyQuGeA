/**
 * Accessibility checker.
 *
 * Pure-TypeScript DOM scanner (no JSX, no `solid-js` imports) that inspects
 * a DOM root for common accessibility issues: images without alt, buttons/
 * links without accessible names, inputs without labels, heading-hierarchy
 * skips, duplicate IDs, and a missing document language. Returns a list of
 * structured issues. Used by the dev-only a11y inspector overlay.
 */
export type A11yIssueSeverity = "error" | "warning" | "info";
export interface A11yIssue {
	/** Rule identifier, e.g. "img-alt". */
	rule: string;
	/** Severity of the issue. */
	severity: A11yIssueSeverity;
	/** Human-readable description. */
	message: string;
	/** CSS selector targeting the offending element. */
	selector: string;
	/** Tag name of the offending element (lowercase). */
	element?: string;
}
export class A11yChecker {
	/**
	 * Run every check against `root` (defaults to `document`) and return the
	 * combined list of issues.
	 */
	check(root: ParentNode = document): A11yIssue[] {
		return [
			...this.checkImageAlt(root),
			...this.checkButtonNames(root),
			...this.checkLinkNames(root),
			...this.checkInputLabels(root),
			...this.checkHeadingHierarchy(root),
			...this.checkDuplicateIds(root),
			...this.checkDocumentLang(),
		];
	}
	/** Images must have an alt attribute (empty alt is allowed for decorative). */
	checkImageAlt(root: ParentNode = document): A11yIssue[] {
		let issues: A11yIssue[] = [];
		let imgs = root.querySelectorAll("img");
		for (let img of imgs) {
			if (!img.hasAttribute("alt")) {
				issues.push({
					rule: "img-alt",
					severity: "error",
					message: "Image is missing an alt attribute.",
					selector: this.selectorFor(img),
					element: img.tagName.toLowerCase(),
				});
			}
		}
		return issues;
	}
	/** Buttons must have an accessible name (text, aria-label, or aria-labelledby). */
	checkButtonNames(root: ParentNode = document): A11yIssue[] {
		let issues: A11yIssue[] = [];
		let buttons = root.querySelectorAll("button");
		for (let btn of buttons) {
			if (this.getAccessibleName(btn).length === 0) {
				issues.push({
					rule: "button-name",
					severity: "error",
					message: "Button has no accessible name.",
					selector: this.selectorFor(btn),
					element: btn.tagName.toLowerCase(),
				});
			}
		}
		return issues;
	}
	/** Links must have an accessible name. */
	checkLinkNames(root: ParentNode = document): A11yIssue[] {
		let issues: A11yIssue[] = [];
		let links = root.querySelectorAll("a[href]");
		for (let link of links) {
			if (this.getAccessibleName(link).length === 0) {
				issues.push({
					rule: "link-name",
					severity: "error",
					message: "Link has no accessible name.",
					selector: this.selectorFor(link),
					element: link.tagName.toLowerCase(),
				});
			}
		}
		return issues;
	}
	/** Form inputs (text/email/number/etc.) must have an associated label. */
	checkInputLabels(root: ParentNode = document): A11yIssue[] {
		let issues: A11yIssue[] = [];
		let inputs = root.querySelectorAll("input, textarea, select");
		for (let input of inputs) {
			let type = (input.getAttribute("type") ?? "").toLowerCase();
			if (type === "hidden" || type === "submit" || type === "button" || type === "reset") continue;
			if (input.hasAttribute("aria-label") || input.hasAttribute("aria-labelledby")) continue;
			let id = input.id;
			let hasLabel = id ? root.querySelector(`label[for="${id}"]`) !== null : false;
			let wrappedLabel = input.closest("label") !== null;
			if (!hasLabel && !wrappedLabel) {
				issues.push({
					rule: "input-label",
					severity: "error",
					message: "Form control has no associated label.",
					selector: this.selectorFor(input),
					element: input.tagName.toLowerCase(),
				});
			}
		}
		return issues;
	}
	/** Heading levels should not skip (e.g. h1 -> h3). */
	checkHeadingHierarchy(root: ParentNode = document): A11yIssue[] {
		let issues: A11yIssue[] = [];
		let headings = root.querySelectorAll("h1, h2, h3, h4, h5, h6");
		let prevLevel = 0;
		for (let heading of headings) {
			let level = parseInt(heading.tagName.substring(1), 10);
			if (prevLevel > 0 && level > prevLevel + 1) {
				issues.push({
					rule: "heading-order",
					severity: "warning",
					message: `Heading level jumps from h${prevLevel} to h${level}.`,
					selector: this.selectorFor(heading),
					element: heading.tagName.toLowerCase(),
				});
			}
			prevLevel = level;
		}
		return issues;
	}
	/** No two elements should share the same ID. */
	checkDuplicateIds(root: ParentNode = document): A11yIssue[] {
		let issues: A11yIssue[] = [];
		let seen = new Map<string, number>();
		let all = root.querySelectorAll("[id]");
		for (let el of all) {
			let id = el.id;
			seen.set(id, (seen.get(id) ?? 0) + 1);
		}
		for (let [id, count] of seen) {
			if (count > 1) {
				issues.push({
					rule: "duplicate-id",
					severity: "warning",
					message: `ID "${id}" is used ${count} times.`,
					selector: `#${id}`,
				});
			}
		}
		return issues;
	}
	/** The document element should declare a language. */
	checkDocumentLang(): A11yIssue[] {
		let issues: A11yIssue[] = [];
		if (typeof document === "undefined") return issues;
		let html = document.documentElement;
		if (!html || !html.getAttribute("lang")) {
			issues.push({
				rule: "html-lang",
				severity: "error",
				message: "The <html> element is missing a lang attribute.",
				selector: "html",
				element: "html",
			});
		}
		return issues;
	}
	/** Compute the accessible name of an element (textContent, aria-label, or aria-labelledby). */
	getAccessibleName(el: Element): string {
		let labelledby = el.getAttribute("aria-labelledby");
		if (labelledby && el.ownerDocument) {
			let parts = labelledby.split(/\s+/).map(id => el.ownerDocument!.getElementById(id));
			let text = parts.map(p => p?.textContent?.trim() ?? "").join(" ");
			if (text.length > 0) return text;
		}
		let ariaLabel = el.getAttribute("aria-label");
		if (ariaLabel && ariaLabel.trim().length > 0) return ariaLabel.trim();
		return (el.textContent ?? "").trim();
	}
	/** Build a best-effort CSS selector for an element. */
	selectorFor(el: Element): string {
		if (el.id) return `#${el.id}`;
		let tag = el.tagName.toLowerCase();
		if (el.classList.length > 0) return `${tag}.${el.classList[0]}`;
		return tag;
	}
}
