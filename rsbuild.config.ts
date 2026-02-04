import { defineConfig } from '@rsbuild/core';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginSvelte } from '@rsbuild/plugin-svelte';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
    plugins: [pluginSass(), pluginSvelte()],
    html: {
        template: './index.html'
    },
    server: {
        port: 3000
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
                    }
                ],
            },
        },
    },
});
