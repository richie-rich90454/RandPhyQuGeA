import {useEffect, useState} from 'react';
/**
 * Subscribe to a CSS media query and return whether it currently matches.
 *
 * @param query A CSS media query string, e.g. `"(min-width: 768px)"`.
 * @returns `true` when the query matches, otherwise `false`.
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState<boolean>(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
	const [prevQuery, setPrevQuery] = useState(query);
	if (prevQuery !== query) {
		setPrevQuery(query);
		setMatches(typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
	}
	useEffect(() => {
		const mediaQueryList = window.matchMedia(query);
		const handleChange = (event: MediaQueryListEvent) => {
			setMatches(event.matches);
		};
		mediaQueryList.addEventListener('change', handleChange);
		return () => {
			mediaQueryList.removeEventListener('change', handleChange);
		};
	}, [query]);
	return matches;
}
