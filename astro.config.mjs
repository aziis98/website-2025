// @ts-check
import { defineConfig } from 'astro/config'

import preact from '@astrojs/preact'
import icon from 'astro-icon'

import mdx from '@astrojs/mdx'
import remarkMath from 'remark-math'

import rehypeExternalLinks from 'rehype-external-links'

// https://astro.build/config
export default defineConfig({
    vite: {
        build: {
            target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
        },
    },

    devToolbar: { enabled: false },
    markdown: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [[rehypeExternalLinks, { target: '_blank', rel: ['noopener'] }]],
        shikiConfig: {
            themes: {
                light: 'github-light',
                dark: 'github-dark',
            },
        },
    },
    prefetch: {
        prefetchAll: true,
    },
    server: {
        allowedHosts: true,
    },
    integrations: [
        preact(),
        icon(),
        mdx({
            remarkPlugins: [remarkMath],
            rehypePlugins: [[rehypeExternalLinks, { target: '_blank', rel: ['noopener'] }]],
            shikiConfig: {
                themes: {
                    light: 'github-light',
                    dark: 'github-dark',
                },
            },
        }),
    ],
})
