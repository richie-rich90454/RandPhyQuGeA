import {useMemo} from 'react';
import {MathRenderer} from './MathRenderer';
/**
 * Props for {@link MathText}.
 */
export interface MathTextProps {
	/** Raw text that may contain `$...$` inline-math delimiters. */
	text: string;
	/** Extra class on the wrapper. */
	className?: string;
}
/**
 * Render a string that may contain `$...$` inline-math delimiters.
 *
 * Non-delimited segments are rendered as plain text; delimited segments are
 * rendered through {@link MathRenderer} in inline mode. Empty or whitespace-only
 * input renders nothing.
 */
export function MathText({text, className}: MathTextProps) {
	const segments = useMemo(() => {
		if (!text) return [] as Array<{type: 'text' | 'math'; value: string}>;
		const parts: Array<{type: 'text' | 'math'; value: string}> = [];
		const regex = /\$([^$]+)\$/g;
		let lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = regex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				parts.push({type: 'text', value: text.slice(lastIndex, match.index)});
			}
			parts.push({type: 'math', value: match[1] ?? ''});
			lastIndex = regex.lastIndex;
		}
		if (lastIndex < text.length) {
			parts.push({type: 'text', value: text.slice(lastIndex)});
		}
		return parts;
	}, [text]);
	if (segments.length === 0) return null;
	return (
		<span className={className}>
			{segments.map((segment, index) => {
				if (segment.type === 'math') {
					return <MathRenderer key={index} tex={segment.value} />;
				}
				return <span key={index}>{segment.value}</span>;
			})}
		</span>
	);
}
