import { defineConfig } from '@rsbuild/core';
import { pluginSass } from '@rsbuild/plugin-sass';
import path from 'path';
import { createRequire } from 'module';
import sveltePreprocess from 'svelte-preprocess';

const require = createRequire(import.meta.url);

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
    plugins: [pluginSass()],
    html: {
        template: './index.html'
    },
    server: {
        port: 3000
    },
    resolve: {
        alias: {
        svelte: path.dirname(require.resolve('svelte/package.json')),
        },
        extensions: ['.mjs', '.js', '.ts', '.svelte'],
        mainFields: ['svelte', 'browser', 'module', 'main'],
    },
    output: {
        // Use relative paths
        assetPrefix: "./"
    },
    tools: {
        rspack: {
            module: {
                rules: [
                    {
                        resourceQuery: /url$/,
                        type: 'asset/resource',
                    },
                    {
                        resourceQuery: /raw$/,
                        type: 'asset/source',
                    },
                    {
                        test: /\.svelte$/,
                        use: [
                            {
                                loader: 'svelte-loader',
                                options: {
                                    compilerOptions: {
                                        dev: !prod,
                                    },
                                    emitCss: prod,
                                    hotReload: !prod,
                                    preprocess: sveltePreprocess({ sourceMap: !prod, postcss: true }),
                                },
                            },
                        ],
                    },
                ],
            },
        },
    },
});
