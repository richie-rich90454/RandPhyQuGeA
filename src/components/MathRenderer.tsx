import {useMemo} from 'react';
import katex from 'katex';

export interface MathRendererProps {
	tex: string;
	display?: boolean;
	className?: string;
}

export function MathRenderer({tex, display = false, className}: MathRendererProps) {
	const html = useMemo(() => {
		return katex.renderToString(tex, {
			displayMode: display,
			throwOnError: false
		});
	}, [tex, display]);

	if (display) {
		return <div className={className} dangerouslySetInnerHTML={{__html: html}} />;
	}

	return <span className={className} dangerouslySetInnerHTML={{__html: html}} />;
}
