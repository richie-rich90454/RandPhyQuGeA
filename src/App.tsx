import {BrowserRouter, Routes, Route} from 'react-router-dom';
import {AppShell} from './components/layout/AppShell';
import {useTheme} from './hooks/useTheme';
import Home from './views/Home';
import FocusedPractice from './views/FocusedPractice';
import MentalPractice from './views/MentalPractice';
import Progress from './views/Progress';
import QuestionBank from './views/QuestionBank';
import Settings from './views/Settings';
import FormulaSheet from './views/FormulaSheet';
import SessionSummary from './views/SessionSummary';
import Onboarding from './views/Onboarding';

function App() {
	useTheme();

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<AppShell />}>
					<Route index element={<Home />} />
					<Route path="practice" element={<FocusedPractice />} />
					<Route path="mental-practice" element={<MentalPractice />} />
					<Route path="progress" element={<Progress />} />
					<Route path="question-bank" element={<QuestionBank />} />
					<Route path="settings" element={<Settings />} />
					<Route path="formula-sheet" element={<FormulaSheet />} />
					<Route path="session-summary" element={<SessionSummary />} />
					<Route path="onboarding" element={<Onboarding />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
