import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	build: {
		outDir: "dist",  // Ensure output goes to `dist/`
		emptyOutDir: true,  // Clears old files before building
		rollupOptions: {
			input: {
				main: "./electron/main.ts",
				preload: "./electron/preload.ts",
				renderer: "./index.html"  // Ensure renderer is included!
			}
		}
	},
	plugins: [
		react(),
		tsConfigPaths(),
		electron({
			main: {
				entry: 'electron/main.ts',
			},
			preload: {
				input: path.join(__dirname, 'electron/preload.ts'),
			},
			renderer: {},
		}),
	],
})
