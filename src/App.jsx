import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Home from './components/Home';
import Room from './components/Room';
import './App.css'

function App() {

	return (
		<Router>
			<Routes>
				<Route path="/" element={ <Home /> } />
				<Route path="/room/:room_id" element={ <Room /> } />
			</Routes>
		</Router>
	)
}

export default App
