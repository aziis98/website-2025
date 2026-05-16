import { Icon } from '@iconify/react'
import { useEffect, useMemo, useState } from 'preact/hooks'
import styles from './Comments.module.css'

type GitHubDiscussionComment = {
    id: number
    parent_id: number | null
    html_url: string
    child_comment_count: number
    author_association: string
    created_at: string
    updated_at: string
    body_html: string
    user: {
        login: string
        html_url: string
        avatar_url: string
    }
}

type CommentNode = GitHubDiscussionComment & {
    replies: CommentNode[]
}

type CommentsProps = {
    discussionUrl: string
}

type DiscussionLocation = {
    owner: string
    repo: string
    number: number
}

const commentDateFormatter = new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
})

function parseDiscussionUrl(discussionUrl: string): DiscussionLocation {
    const url = new URL(discussionUrl)

    if (!url.hostname.endsWith('github.com')) {
        throw new Error('Only GitHub discussion URLs are supported')
    }

    const [owner, repo, discussions, number] = url.pathname.split('/').filter(Boolean)

    if (!owner || !repo || discussions !== 'discussions' || !number) {
        throw new Error('Invalid GitHub discussion URL')
    }

    const discussionNumber = Number.parseInt(number, 10)

    if (!Number.isFinite(discussionNumber)) {
        throw new Error('Invalid GitHub discussion number')
    }

    return { owner, repo, number: discussionNumber }
}

function getNextLink(linkHeader: string | null): string | null {
    if (!linkHeader) {
        return null
    }

    for (const part of linkHeader.split(',')) {
        const match = part.match(/<([^>]+)>;\s*rel="next"/)

        if (match) {
            return match[1]
        }
    }

    return null
}

async function fetchDiscussionComments(
    discussionUrl: string,
    signal: AbortSignal,
): Promise<GitHubDiscussionComment[]> {
    const { owner, repo, number } = parseDiscussionUrl(discussionUrl)
    const comments: GitHubDiscussionComment[] = []
    let nextUrl: string | null =
        `https://api.github.com/repos/${owner}/${repo}/discussions/${number}/comments?per_page=100`

    while (nextUrl) {
        const response = await fetch(nextUrl, {
            signal,
            // cache: 'no-store',
            headers: {
                Accept: 'application/vnd.github.html+json',
                // 'Cache-Control': 'no-cache, no-store, must-revalidate',
                // 'Pragma': 'no-cache',
                // 'Expires': '0',
            },
        })

        if (!response.ok) {
            throw new Error(`GitHub API request failed with status ${response.status}`)
        }

        const pageComments = (await response.json()) as GitHubDiscussionComment[]
        comments.push(...pageComments)
        nextUrl = getNextLink(response.headers.get('link'))
    }

    return comments
}

function buildCommentTree(comments: GitHubDiscussionComment[]): CommentNode[] {
    const nodes = new Map<number, CommentNode>()

    for (const comment of comments) {
        nodes.set(comment.id, { ...comment, replies: [] })
    }

    const roots: CommentNode[] = []

    for (const comment of comments) {
        const node = nodes.get(comment.id)

        if (!node) {
            continue
        }

        if (comment.parent_id && nodes.has(comment.parent_id)) {
            nodes.get(comment.parent_id)?.replies.push(node)
        } else {
            roots.push(node)
        }
    }

    const sortTree = (items: CommentNode[]) => {
        items.sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at))
        for (const item of items) {
            sortTree(item.replies)
        }
    }

    sortTree(roots)
    return roots
}

function CommentItem({ comment }: { comment: CommentNode }) {
    return (
        <div class={styles.commentGroup}>
            <article class={styles.comment}>
                <header class={styles.meta}>
                    <a
                        class={styles.avatarLink}
                        href={comment.user.html_url}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <img
                            class={styles.avatar}
                            src={comment.user.avatar_url}
                            alt={comment.user.login}
                        />
                    </a>

                    <div class={styles.author}>
                        <a href={comment.user.html_url} target="_blank" rel="noreferrer">
                            {comment.user.login}
                        </a>
                    </div>

                    <a class={styles.date} href={comment.html_url} target="_blank" rel="noreferrer">
                        {commentDateFormatter.format(new Date(comment.created_at))}
                    </a>
                </header>

                <div class={styles.body} dangerouslySetInnerHTML={{ __html: comment.body_html }} />
            </article>

            {comment.replies.length > 0 && (
                <div class={styles.replies}>
                    {comment.replies.map(reply => (
                        <CommentItem key={reply.id} comment={reply} />
                    ))}
                </div>
            )}
        </div>
    )
}

export function Comments({ discussionUrl }: CommentsProps) {
    const discussionLocation = useMemo(() => {
        try {
            return parseDiscussionUrl(discussionUrl)
        } catch {
            return null
        }
    }, [discussionUrl])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [comments, setComments] = useState<CommentNode[]>([])

    useEffect(() => {
        const controller = new AbortController()

        if (!discussionLocation) {
            setLoading(false)
            setError('Invalid GitHub discussion URL')
            setComments([])
            return () => controller.abort()
        }

        setLoading(true)
        setError(null)
        setComments([])

        void (async () => {
            try {
                const fetchedComments = await fetchDiscussionComments(
                    discussionUrl,
                    controller.signal,
                )
                setComments(buildCommentTree(fetchedComments))
            } catch (fetchError) {
                if (!controller.signal.aborted) {
                    setError(
                        fetchError instanceof Error
                            ? fetchError.message
                            : 'Failed to load comments',
                    )
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        })()

        return () => controller.abort()
    }, [discussionLocation, discussionUrl])

    return (
        <section class={styles.comments}>
            <header class={styles.header}>
                <div>
                    <h2>Comments</h2>
                    <p>
                        Join the discussion on{' '}
                        <a
                            class={styles.externalLink}
                            href={discussionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GitHub
                            <Icon icon="octicon:link-external-16" width="16" height="16" />
                        </a>
                        .
                    </p>
                </div>

                {/* discussion id removed */}
            </header>

            {loading && <p>Loading comments from GitHub...</p>}

            {!loading && error && <p class={styles.error}>{error}</p>}

            {!loading && !error && comments.length === 0 && <p>No comments yet.</p>}

            {!loading && !error && comments.length > 0 && (
                <div class={styles.list}>
                    {comments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))}
                </div>
            )}
        </section>
    )
}
