import type {JSX} from "solid-js";
import {For, Show, createMemo, splitProps} from "solid-js";
import {MathRenderer} from "./MathRenderer";
import styles from "./MathText.module.css";
type MathSegment = {type: "text"; value: string} | {type: "inline-math"; value: string} | {type: "display-math"; value: string};
export interface MathTextProps {
    /** Mixed text with math delimiters ($...$, $$...$$, \(...\), \[...\]). */
    text: string;
    /** Extra class for the wrapper. */
    class?: string;
}
function findInlineClose(text: string, start: number): number {
    let j = start;
    let n = text.length;
    while (j < n) {
        let ch = text[j];
        if (ch === "\\" && j + 1 < n) {
            j = j + 2;
            continue;
        }
        if (ch === "$") {
            return j;
        }
        j = j + 1;
    }
    return -1;
}
function findDelimiterClose(text: string, start: number, close: string): number {
    let j = start;
    let n = text.length;
    let closeLen = close.length;
    while (j < n) {
        if (text[j] === "\\" && j + 1 < n && text[j + 1] === "\\") {
            j = j + 2;
            continue;
        }
        if (text.slice(j, j + closeLen) === close) {
            return j;
        }
        j = j + 1;
    }
    return -1;
}
function tokenizeMathText(text: string): MathSegment[] {
    let segments: MathSegment[] = [];
    let n = text.length;
    let buffer = "";
    let i = 0;
    let flush = () => {
        if (buffer.length > 0) {
            segments.push({type: "text", value: buffer});
            buffer = "";
        }
    };
    while (i < n) {
        let ch = text[i];
        if (ch === "\\" && i + 1 < n && text[i + 1] === "\\") {
            buffer = buffer + "\\";
            i = i + 2;
            continue;
        }
        if (ch === "\\" && i + 1 < n && text[i + 1] === "$") {
            buffer = buffer + "$";
            i = i + 2;
            continue;
        }
        if (ch === "$" && i + 1 < n && text[i + 1] === "$") {
            let close = findDelimiterClose(text, i + 2, "$$");
            if (close !== -1) {
                flush();
                segments.push({type: "display-math", value: text.slice(i + 2, close)});
                i = close + 2;
                continue;
            }
            buffer = buffer + "$$";
            i = i + 2;
            continue;
        }
        if (ch === "\\" && i + 1 < n && text[i + 1] === "[") {
            let close = findDelimiterClose(text, i + 2, "\\]");
            if (close !== -1) {
                flush();
                segments.push({type: "display-math", value: text.slice(i + 2, close)});
                i = close + 2;
                continue;
            }
            buffer = buffer + "\\[";
            i = i + 2;
            continue;
        }
        if (ch === "\\" && i + 1 < n && text[i + 1] === "(") {
            let close = findDelimiterClose(text, i + 2, "\\)");
            if (close !== -1) {
                flush();
                segments.push({type: "inline-math", value: text.slice(i + 2, close)});
                i = close + 2;
                continue;
            }
            buffer = buffer + "\\(";
            i = i + 2;
            continue;
        }
        if (ch === "$") {
            let close = findInlineClose(text, i + 1);
            if (close !== -1 && close > i + 1) {
                flush();
                segments.push({type: "inline-math", value: text.slice(i + 1, close)});
                i = close + 1;
                continue;
            }
            buffer = buffer + (ch ?? "");
            i = i + 1;
            continue;
        }
        buffer = buffer + (ch ?? "");
        i = i + 1;
    }
    flush();
    return segments;
}
/** Renders mixed text containing inline and display math via KaTeX. */
export function MathText(props: MathTextProps): JSX.Element {
    let [local] = splitProps(props, ["text", "class"]);
    let segments = createMemo(() => {
        if (!local.text) return [] as MathSegment[];
        return tokenizeMathText(local.text);
    });
    return (
        <Show when={segments().length > 0}>
            <span class={`${styles.root} ${local.class ?? ""}`}>
                <For each={segments()}>
                    {segment => {
                        return (
                            <Show
                                when={segment.type === "inline-math"}
                                fallback={
                                    <Show when={segment.type === "display-math"} fallback={<span>{segment.value}</span>}>
                                        <MathRenderer display={true} tex={segment.value} />
                                    </Show>
                                }
                            >
                                <MathRenderer display={false} tex={segment.value} />
                            </Show>
                        );
                    }}
                </For>
            </span>
        </Show>
    );
}
