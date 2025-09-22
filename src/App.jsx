import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ErrorProvider } from './contexts/ErrorContext';
import ErrorBoundary from './components/error/ErrorBoundaryFixed';
import ErrorDisplay from './components/error/ErrorDisplay';

import Home from './pages/Home';
import Room from './pages/Room'; // Fixed component with WebRTC fixes
import './App.css'

function App() {

	return (
		<ErrorProvider>
			<ErrorBoundary>
				<Router>
					<ErrorDisplay />
					<Routes>
						<Route path="/" element={ <Home /> } />
						<Route path="/room/:room_id" element={ <Room /> } />
					</Routes>
				</Router>
			</ErrorBoundary>
		</ErrorProvider>
	)
}

export default App
