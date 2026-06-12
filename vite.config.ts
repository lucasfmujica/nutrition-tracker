import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;
                    if (
                        id.includes('/react/') ||
                        id.includes('/react-dom/') ||
                        id.includes('/scheduler/')
                    ) {
                        return 'vendor-react';
                    }
                    if (
                        id.includes('/i18next/') ||
                        id.includes('/react-i18next/') ||
                        id.includes('/i18next-browser-languagedetector/')
                    ) {
                        return 'vendor-i18n';
                    }
                    if (id.includes('/gsap/')) return 'vendor-motion';
                    if (id.includes('/dexie/')) return 'vendor-storage';
                },
            },
        },
    },
    server: {
        proxy: {
            '/api/oura': {
                target: 'https://api.ouraring.com/v2/usercollection',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/oura/, ''),
                secure: true,
            },
        },
    },
});
