import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	build: {
		outDir: "dist",
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: "./electron/main.ts",
				preload: "./electron/preload.ts",
				renderer: "./index.html"
			},
			external: ["electron"],  // Exclude Electron from final bundle
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
});

