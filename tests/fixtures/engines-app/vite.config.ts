import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@form-builder': path.resolve(import.meta.dirname, '../../../resources/js'),
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
