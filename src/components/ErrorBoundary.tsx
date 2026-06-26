import {Component, type ReactNode} from 'react';
interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}
interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}
/**
 * Top-level React error boundary.
 *
 * Catches render-time errors from any descendant component (modals, practice
 * surface, stores) and displays a recovery fallback instead of a blank white
 * screen. The user can reload the page to retry. Errors are logged to the
 * console for debugging.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {hasError: false, error: null};
	}
	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {hasError: true, error};
	}
	componentDidCatch(error: Error, info: React.ErrorInfo): void {
		console.error('ErrorBoundary caught:', error, info);
	}
	handleReload = () => {
		window.location.reload();
	};
	render(): ReactNode {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}
			return (
				<div className="error-boundary" role="alert">
					<h1>Something went wrong</h1>
					<p>An unexpected error occurred while rendering the application.</p>
					{this.state.error && <pre className="error-details">{this.state.error.message}</pre>}
					<button type="button" className="primary-button" onClick={this.handleReload}>
						Reload Page
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}
