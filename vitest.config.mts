import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

/**
 * Component tests only. The editor registry guard runs on node:test instead,
 * so `include` is narrow enough to leave tests/wysiwyg alone — Vitest would
 * otherwise pick up its .test.mjs files as well.
 */
export default defineConfig({
    plugins: [vue()],
    test: {
        include: ['tests/components/**/*.test.ts'],
        environment: 'jsdom',
    },
});
