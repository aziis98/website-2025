// @ts-check
import { defineConfig } from 'astro/config'

import preact from '@astrojs/preact'
import icon from 'astro-icon'

import mdx from '@astrojs/mdx'
import remarkMath from 'remark-math'

import { unified } from '@astrojs/markdown-remark'

import rehypeExternalLinks from 'rehype-external-links'

// https://astro.build/config
export default defineConfig({
    vite: {
        build: {
            target: ['edge88', 'firefox78', 'chrome87', 'safari14'],
        },
    },

    devToolbar: { enabled: false },
    markdown: {
        shikiConfig: {
            themes: {
                light: 'github-light',
                dark: 'github-dark',
            },
        },
        processor: unified({
            remarkPlugins: [remarkMath],
            rehypePlugins: [[rehypeExternalLinks, { target: '_blank', rel: ['noopener'] }]],
        }),
    },
    prefetch: {
        prefetchAll: true,
    },
    server: {
        allowedHosts: true,
    },
    integrations: [
        preact({
            compat: true,
        }),
        icon(),
        mdx({
            shikiConfig: {
                themes: {
                    light: 'github-light',
                    dark: 'github-dark',
                },
            },
            processor: unified({
                remarkPlugins: [remarkMath],
                rehypePlugins: [[rehypeExternalLinks, { target: '_blank', rel: ['noopener'] }]],
            }),
        }),
    ],
})
