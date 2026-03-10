import { defineConfig } from 'vite';

import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import basicSsl from '@vitejs/plugin-basic-ssl'

import path from 'path';

export default defineConfig({
    plugins: [svelte({
        // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
        // for more information about preprocessors
        preprocess: vitePreprocess(),
        compilerOptions: {
            hmr: true
        }
    }), basicSsl()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        open: true,
        port: 51734
    },
    build: {
        outDir: 'dist',
    },
    css: {
        preprocessorOptions: {
            scss: {
                // @ts-expect-error - This does exist??
                api: 'modern-compiler'
            }
        }
    }
});
