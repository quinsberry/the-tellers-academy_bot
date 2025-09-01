import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        // Enable globals like describe, it, expect
        globals: true,

        // Test environment (node for backend, jsdom for frontend)
        environment: 'node',

        // Include test files
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

        // Exclude files
        exclude: ['node_modules', 'build', 'dist', '.git', '.cache'],

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'build/', 'src/**/*.d.ts', 'src/**/*.config.ts', 'src/types.ts'],
        },

        // Test timeout
        testTimeout: 10000,

        // Setup files (if needed)
        // setupFiles: ['src/test/setup.ts']
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
