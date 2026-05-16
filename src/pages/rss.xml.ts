import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

export async function GET() {
    const posts = await getCollection('blog')

    const items = posts
        .filter(p => !p.data.draft)
        .map(post => ({
            title: post.data.title,
            pubDate: new Date(post.data.publish_date.replace(/\//g, '-')),
            description: post.data.description,
            link: `/blog/${post.id}/`,
        }))

    return rss({
        title: 'aziis98.com',
        description:
            "I'm Antonio De Lucreziis, I study Maths in Pisa and I'm interested in computer science. There is also an art section with a gallery of most of my works",
        site: import.meta.env.SITE ?? 'https://aziis98.com',
        items,
    })
}
