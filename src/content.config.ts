import { defineCollection, z } from 'astro:content'

// 2. Import loader(s)
import { glob, file } from 'astro/loaders'

// 3. Define your collection(s)
const blog = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/blog' }),
    schema: z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().min(1, 'Description is required'),
        tags: z.array(z.string()),
        publish_date: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, 'Publish date must be in YYYY/MM/DD format'),
        image: z.string().optional(),
        draft: z.boolean().default(false),

        thumbnail: z.string().optional(),
        thumbnail_alt: z.string().optional(),
        thumbnail_url: z.string().optional(),
    }),
})

// 4. Export a single `collections` object to register your collection(s)
export const collections = { blog }
