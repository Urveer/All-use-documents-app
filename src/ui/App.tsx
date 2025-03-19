import './assets/App.css'
import { Route, Routes } from 'react-router'
import { Home } from './pages/Home'
import { DocT1 } from './pages/DocT1'
import { DocT2 } from './pages/DocT2'

function App() {
	// const [data, setData] = useState([])

	return (
		<Routes>
			<Route 
				path="/"
				element={<Home />}
			/>

			<Route 
				path="/doc-type-1"
				element = {<DocT1 />}
			/>

			<Route 
				path="/doc-type-2"
				element = {<DocT2 />}
			/>

		</Routes>

	)
}

export default App
