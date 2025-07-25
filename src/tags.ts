import { getCollection, type CollectionEntry } from 'astro:content'

export async function getPosts() {
    const posts = await getCollection('blog')

    console.log(`Found ${posts.length} blog posts:`)
    posts.forEach(post => {
        console.log(`- ${post.id}`)
    })

    return posts
}

export async function getPostsByTag() {
    const posts = await getPosts()
    const postsByTag = new Map<string, CollectionEntry<'blog'>[]>()

    for (const post of posts) {
        for (const tag of post.data.tags) {
            if (!postsByTag.has(tag)) {
                postsByTag.set(tag, [])
            }
            postsByTag.get(tag)?.push(post)
        }
    }

    console.log(`Found ${postsByTag.size} tags:`)
    postsByTag.forEach((posts, tag) => {
        console.log(`- ${tag}: ${posts.length} posts`)
    })

    return postsByTag
}
