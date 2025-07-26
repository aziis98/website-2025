import type { ImageMetadata } from 'astro'

type ArtImage = {
    id: string
    path: string
    module: Promise<{ default: ImageMetadata }>
}

export async function getArtWorks(): Promise<Record<string, ArtImage>> {
    const items = import.meta.glob('./assets/art/**/*.{jpg,png,webp}')

    return Object.fromEntries(
        // @ts-ignore
        await Promise.all(
            Object.entries(items).map(async ([path, loader]) => {
                return [
                    path.split('/').pop(),
                    {
                        id: path.split('/').pop()?.split('.')[0] || '',
                        path,
                        module: loader(),
                    },
                ]
            }),
        ),
    )
}

export async function getArtCollections() {
    const works = await getArtWorks()

    return {
        procreate: Object.values(works).filter(work => work.path.includes('procreate/')),
        old: Object.values(works).filter(work => work.path.includes('webp/')),
    }
}
