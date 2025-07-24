/** @type {import("prettier").Config} */
export default {
    printWidth: 120,
    singleQuote: true,
    quoteProps: 'consistent',
    tabWidth: 4,
    useTabs: false,
    semi: false,
    arrowParens: 'avoid',

    plugins: ['prettier-plugin-astro'],
    overrides: [
        {
            files: '*.astro',
            options: {
                parser: 'astro',
            },
        },
        {
            files: '*.{yml,yaml,json}',
            excludeFiles: 'package-lock.json',
            options: {
                tabWidth: 2,
            },
        },
    ],
}
