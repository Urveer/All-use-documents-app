import './assets/App.css'
import { Route, Routes } from 'react-router'
import { Home } from './pages/Home'
import { DocT1 } from './pages/DocT1'

export default function App() {
	return (
		<Routes>
			<Route 
				path="/"
				element={<Home />}
			/>

			<Route 
				path="/CISE-forms"
				element = {<DocT1 />}
			/>
		</Routes>
	)
}
