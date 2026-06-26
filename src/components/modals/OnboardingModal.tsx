import {Modal} from '../ui';
import {useUiStore} from '../../stores/uiStore';
import {useSettingsStore} from '../../stores/settingsStore';
/**
 * First-launch onboarding overlay mapped to `#onboarding-overlay`.
 *
 * Renders three numbered steps introducing the core practice loop (pick a
 * topic, generate a question, check the answer). Dismissing the modal marks
 * `onboardingCompleted` true in the persisted settings store so it never
 * re-appears automatically; it can still be re-opened from the help button.
 */
export function OnboardingModal() {
	const isOpen = useUiStore(state => state.activeModal === 'onboarding');
	const closeModal = useUiStore(state => state.closeModal);
	const setOnboardingCompleted = useSettingsStore(state => state.setOnboardingCompleted);
	const handleDismiss = () => {
		setOnboardingCompleted(true);
		closeModal();
	};
	return (
		<Modal
			open={isOpen}
			onClose={handleDismiss}
			modalId="onboarding-overlay"
			title="Welcome to RandPhyQuGeA!"
			titleId="onboarding-title"
			ariaLabel="Onboarding"
			footer={
				<button type="button" className="primary-button" onClick={handleDismiss}>
					Got it!
				</button>
			}
		>
			<ol className="onboarding-steps">
				<li className="onboarding-step">
					<span className="step-number">1</span>
					<span>Pick a topic from the list above</span>
				</li>
				<li className="onboarding-step">
					<span className="step-number">2</span>
					<span>
						Click <strong>Generate</strong> to get a question
					</span>
				</li>
				<li className="onboarding-step">
					<span className="step-number">3</span>
					<span>
						Type your answer and press <kbd>Shift+Enter</kbd> or click <strong>Check</strong>
					</span>
				</li>
			</ol>
		</Modal>
	);
}
