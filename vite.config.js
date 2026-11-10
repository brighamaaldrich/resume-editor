import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the built site work from any subpath (e.g. GitHub Pages).
export default defineConfig({ plugins: [react()], base: './' });
