import {useMemo} from 'react';
import {MathRenderer} from './MathRenderer';
type MathSegment = {type: 'text'; value: string} | {type: 'inline-math'; value: string} | {type: 'display-math'; value: string};
export interface MathTextProps {
	text: string;
	className?: string;
}
function findInlineClose(text: string, start: number): number {
	let j = start;
	const n = text.length;
	while (j < n) {
		if (text[j] === '\\' && j + 1 < n) {
			j += 2;
			continue;
		}
		if (text[j] === '$') {
			return j;
		}
		j += 1;
	}
	return -1;
}
function tokenizeMathText(text: string): MathSegment[] {
	const segments: MathSegment[] = [];
	const n = text.length;
	let buffer = '';
	let i = 0;
	const flush = () => {
		if (buffer.length > 0) {
			segments.push({type: 'text', value: buffer});
			buffer = '';
		}
	};
	while (i < n) {
		if (text[i] === '\\' && i + 1 < n && text[i + 1] === '$') {
			buffer += '$';
			i += 2;
			continue;
		}
		if (text[i] === '$' && i + 1 < n && text[i + 1] === '$') {
			const close = text.indexOf('$$', i + 2);
			if (close !== -1) {
				flush();
				segments.push({type: 'display-math', value: text.slice(i + 2, close)});
				i = close + 2;
				continue;
			}
			buffer += text[i];
			i += 1;
			continue;
		}
		if (text[i] === '\\' && i + 1 < n && text[i + 1] === '[') {
			const close = text.indexOf('\\]', i + 2);
			if (close !== -1) {
				flush();
				segments.push({type: 'display-math', value: text.slice(i + 2, close)});
				i = close + 2;
				continue;
			}
			buffer += text[i];
			i += 1;
			continue;
		}
		if (text[i] === '\\' && i + 1 < n && text[i + 1] === '(') {
			const close = text.indexOf('\\)', i + 2);
			if (close !== -1) {
				flush();
				segments.push({type: 'inline-math', value: text.slice(i + 2, close)});
				i = close + 2;
				continue;
			}
			buffer += text[i];
			i += 1;
			continue;
		}
		if (text[i] === '$') {
			const close = findInlineClose(text, i + 1);
			if (close !== -1 && close > i + 1) {
				flush();
				segments.push({type: 'inline-math', value: text.slice(i + 1, close)});
				i = close + 1;
				continue;
			}
			buffer += text[i];
			i += 1;
			continue;
		}
		buffer += text[i];
		i += 1;
	}
	flush();
	return segments;
}
export function MathText({text, className}: MathTextProps) {
	const segments = useMemo(() => {
		if (!text) return [] as MathSegment[];
		return tokenizeMathText(text);
	}, [text]);
	if (segments.length === 0) return null;
	return (
		<span className={className}>
			{segments.map((segment, index) => {
				if (segment.type === 'inline-math') {
					return <MathRenderer key={index} display={false} tex={segment.value} />;
				}
				if (segment.type === 'display-math') {
					return <MathRenderer key={index} display={true} tex={segment.value} />;
				}
				return <span key={index}>{segment.value}</span>;
			})}
		</span>
	);
}
