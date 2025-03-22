import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/index.css'
import App from './App.tsx'
import {
	HashRouter as Router,
} from 'react-router-dom'

const root = createRoot(document.getElementById('root')!);

root.render(
	<Router>
		<StrictMode>
			<App />
		</StrictMode>
	</Router>,
)
