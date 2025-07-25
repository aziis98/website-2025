// @ts-check
import { defineConfig } from 'astro/config'

import preact from '@astrojs/preact'
import icon from 'astro-icon'

import remarkMath from 'remark-math'
import mdx from '@astrojs/mdx'

// https://astro.build/config
export default defineConfig({
    devToolbar: { enabled: false },
    markdown: {
        remarkPlugins: [remarkMath],
        shikiConfig: {
            themes: {
                light: 'github-light',
                dark: 'github-dark',
            },
        },
    },
    server: {
        allowedHosts: true,
    },
    integrations: [
        preact(),
        icon(),
        mdx({
            remarkPlugins: [remarkMath],
            shikiConfig: {
                themes: {
                    light: 'github-light',
                    dark: 'github-dark',
                },
            },
        }),
    ],
})
