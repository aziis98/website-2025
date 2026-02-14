import { basicSetup, minimalSetup } from 'codemirror'

import {
    Compartment,
    EditorState,
    StateEffect,
    StateField,
    Text,
    type ChangeSpec,
    type Extension,
} from '@codemirror/state'
import {
    Decoration,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
    type DecorationSet,
} from '@codemirror/view'

import { useEffect, useRef, useState } from 'preact/hooks'

import { Color, type AllSpace } from '@/lib/colors'
import { getChunks, getOriginalDoc, unifiedMergeView } from '@codemirror/merge'
import { ToastDisplay, useToasts } from './toasts'

const $ = (
    tag: string,
    attrs: Record<string, any>,
    children: (HTMLElement | string)[] = [],
): HTMLElement => {
    const elem = document.createElement(tag)
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'style' && typeof value === 'object') {
            for (const [styleKey, styleValue] of Object.entries(value)) {
                // @ts-ignore
                elem.style[styleKey] = styleValue
            }
            continue
        }
        if (key.startsWith('on') && typeof value === 'function') {
            // @ts-ignore
            elem.addEventListener(key.slice(2).toLowerCase(), value)
            continue
        }

        elem.setAttribute(key, value)
    }
    for (const child of children) {
        if (typeof child === 'string') {
            elem.appendChild(document.createTextNode(child))
        } else {
            elem.appendChild(child)
        }
    }
    return elem
}

function camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
}

const $svg = (
    tag: string,
    attrs: Record<string, string>,
    children: (SVGElement | string)[] = [],
): SVGElement => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', tag)
    for (const [key, value] of Object.entries(attrs)) {
        elem.setAttribute(camelToKebab(key), value)
    }
    for (const child of children) {
        if (typeof child === 'string') {
            elem.appendChild(document.createTextNode(child))
        } else {
            elem.appendChild(child)
        }
    }
    return elem
}

const SHAPES: Record<string, { createElement: (color: Color<AllSpace>) => SVGElement }> = {
    ['rectangle']: {
        createElement: (color: Color<AllSpace>) =>
            $svg('rect', {
                x: ((32 - 28) / 2).toString(),
                y: ((32 - 28) / 2).toString(),
                width: '28',
                height: '28',
                rx: '4',
                fill: color.toHex(),
                stroke: color.lightness(v => v - 20).toHex(),
                strokeWidth: '2',
            }),
    },
    ['circle']: {
        createElement: (color: Color<AllSpace>) =>
            $svg('circle', {
                cx: '16',
                cy: '16',
                r: '14',
                fill: color.toHex(),
                stroke: color.lightness(v => v - 20).toHex(),
                strokeWidth: '2',
            }),
    },
    ['star']: {
        createElement: (color: Color<AllSpace>) =>
            $svg('polygon', {
                points: Array.from({ length: 10 }, (_, i) => {
                    const angle = (i * 36 - 90) * (Math.PI / 180)
                    const radius = i % 2 === 0 ? 14 : 6
                    const x = 16 + radius * Math.cos(angle)
                    const y = 16 + radius * Math.sin(angle)
                    return `${x},${y}`
                }).join(' '),
                fill: color.toHex(),
                stroke: color.lightness(v => v - 20).toHex(),
                strokeWidth: '2',
            }),
    },
}

const SUPPORTED_COLORS_HEX: Record<string, string> = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
    purple: '#8b5cf6',
    orange: '#f97316',
    pink: '#ec4899',
    teal: '#14b8a6',
}

const initialContent = dedent(`
    You can create shapes by typing <shape color>. Try it!
    For example: <circle green> or <star yellow>.
    
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut 
    aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
    voluptate velit esse cillum dolore eu fugiat nulla pariatur. Let's add some
    inline ones like <rectangle orange> and a <star purple> for fun.
    
    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
    deserunt mollit anim id est laborum.
`)

// --- 1. The Widget (defined inside the async function) ---
// This class needs access to the dynamically imported WidgetType.
class ShapeWidget extends WidgetType {
    shape: string
    colorHex: string

    constructor(shape: string, color: string) {
        super()
        this.shape = shape
        this.colorHex = color
    }

    toDOM() {
        const container = $('span', {
            style: {
                display: 'inline-block',
                verticalAlign: 'middle',
                margin: '0 2px',
                height: '32px',
            },
        })

        const svgShape = $svg('svg', { width: '32', height: '32', viewBox: '0 0 32 32' })

        const shapeDef = SHAPES[this.shape]
        if (!shapeDef) {
            const errorText = $('span', { style: { color: 'red' } }, [
                `Unsupported shape: ${this.shape}`,
            ])
            container.appendChild(errorText)
            return container
        }

        const element = shapeDef.createElement(Color.fromHex(this.colorHex))

        svgShape.appendChild(element)
        container.appendChild(svgShape)
        return container
    }

    eq(other: ShapeWidget) {
        return other.shape === this.shape && other.colorHex === this.colorHex
    }

    ignoreEvent() {
        return true
    }
}

function setupEditor(el: HTMLElement, extensions: any[] = [], content: string = '') {
    const state = EditorState.create({
        doc: content,
        extensions: [minimalSetup, ...extensions, EditorView.lineWrapping],
    })

    const view = new EditorView({
        state,
        parent: el,
    })

    return view
}

function createCodeMirrorEditor(
    el: HTMLElement,
    extensions: Extension[] = [],
    initialContent: string = '',
) {
    const state = EditorState.create({
        doc: initialContent,
        extensions: [minimalSetup, ...extensions, EditorView.lineWrapping],
    })

    const view = new EditorView({
        state,
        parent: el,
    })

    return { view, state }
}

interface CodeMirrorEditorProps {
    extensions?: any[]
    initialContent?: string
}

// Export the shape plugin for external use
export const createShapePlugin = () =>
    ViewPlugin.fromClass(
        class {
            decorations: DecorationSet

            constructor(view: EditorView) {
                this.decorations = this.buildDecorations(view)
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged || update.selectionSet) {
                    this.decorations = this.buildDecorations(update.view)
                }
            }

            buildDecorations(view: EditorView) {
                const builder = []
                const { doc, selection } = view.state
                const mainSelection = selection.main
                const shapeRegex = /<(\w+)\s+(\w+)>/g

                for (let i = 1; i <= doc.lines; i++) {
                    const line = doc.line(i)

                    let match
                    while ((match = shapeRegex.exec(line.text))) {
                        const start = line.from + match.index
                        const end = start + match[0].length
                        const shape = match[1].toLowerCase()
                        const color = match[2].toLowerCase()

                        if (
                            !['rectangle', 'circle', 'star'].includes(shape) ||
                            !SUPPORTED_COLORS_HEX[color]
                        ) {
                            continue
                        }

                        const isCursorInside =
                            mainSelection.from <= end && mainSelection.to >= start
                        if (!isCursorInside) {
                            const widget = new ShapeWidget(shape, SUPPORTED_COLORS_HEX[color])
                            const hideDecoration = Decoration.replace({}).range(start, end)
                            const widgetDecoration = Decoration.widget({
                                widget: widget,
                                side: 1,
                            }).range(end)

                            builder.push(hideDecoration)
                            builder.push(widgetDecoration)
                        }
                    }
                }
                return Decoration.set(builder, true)
            }
        },
        {
            decorations: v => v.decorations,
        },
    )

const shapePlugin = createShapePlugin()

export const CodeMirrorEditor = ({
    extensions = [shapePlugin],
    initialContent: content = initialContent,
}: CodeMirrorEditorProps) => {
    const editorRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!editorRef.current) return

        const view = setupEditor(editorRef.current, extensions, content)

        return () => {
            view.destroy()
        }
    }, [extensions, content])

    return <div class="text-editor" ref={editorRef} />
}

export function dedent(str: string): string {
    const lines = str.split('\n')
    const minIndent = Math.min(
        ...lines.filter(line => line.trim()).map(line => line.match(/^ */)?.[0].length || 0),
    )
    return lines
        .map(line => line.slice(minIndent))
        .join('\n')
        .trim()
}

function createMergeView(parent: HTMLElement, oldState: EditorState, newState: EditorState) {
    const state = EditorState.create({
        doc: newState.doc.toString(),
        extensions: [
            minimalSetup,
            EditorView.lineWrapping,
            unifiedMergeView({
                original: oldState.doc.toString(),
                allowInlineDiffs: true,
            }),
        ],
    })

    const view = new EditorView({
        parent,
        state: state,
    })

    return { view, state }
}

export const CodeMirrorMergeDemo = () => {
    const editorElOldRef = useRef<HTMLDivElement>(null)
    const editorElNewRef = useRef<HTMLDivElement>(null)
    const mergeElRef = useRef<HTMLDivElement>(null)

    const editorOldViewRef = useRef<EditorView | null>(null)
    const editorNewViewRef = useRef<EditorView | null>(null)

    const mergeEditorViewRef = useRef<EditorView | null>(null)

    function recreateMergeView() {
        if (!mergeElRef.current || !editorOldViewRef.current || !editorNewViewRef.current) return

        mergeEditorViewRef.current?.destroy()
        mergeEditorViewRef.current = createMergeView(
            mergeElRef.current,
            editorOldViewRef.current.state,
            editorNewViewRef.current.state,
        ).view
    }

    useEffect(() => {
        if (!editorElOldRef.current || !editorElNewRef.current || !mergeElRef.current) return

        editorOldViewRef.current = createCodeMirrorEditor(
            editorElOldRef.current,
            [],
            dedent(`
                This is the original document.
                Just some placeholder content to demonstrate the editor.

                It has multiple lines of text, without anything very interesting.
                The end.
            `),
        ).view

        editorNewViewRef.current = createCodeMirrorEditor(
            editorElNewRef.current,
            [],
            dedent(`
                This is the modified document.
                Just some placeholder content to demonstrate the editor.

                It has multiple lines of text, with some changes.
                The end.
            `),
        ).view

        recreateMergeView()

        return () => {
            editorOldViewRef.current?.destroy()
            editorNewViewRef.current?.destroy()
            mergeEditorViewRef.current?.destroy()
        }
    }, [])

    return (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div class="section" style={{ flex: '1 1 300px' }}>
                <strong>Old Version</strong>
                <div class="text-editor" ref={editorElOldRef} />
            </div>
            <div class="section" style={{ flex: '1 1 300px' }}>
                <strong>New Version</strong>
                <div class="text-editor" ref={editorElNewRef} />
            </div>

            <div class="grid-container fill-width">
                <div class="tools">
                    <div class="grid-row">
                        <strong>Unified Merge View</strong>
                        <button onClick={recreateMergeView}>Recreate</button>
                    </div>
                </div>
                <div class="text-editor" ref={mergeElRef} />
            </div>
        </div>
    )
}

export const CodeMirrorMergeBasicSetupDemo = ({
    oldDoc = null,
    newDoc = 'one\n2\nthree\n4',

    debugToasts = false,
    tools = [],
}: {
    oldDoc: string | null
    newDoc?: string

    debugToasts: boolean
    tools: ('findAndReplace' | 'lorem-ipsum')[]
}) => {
    oldDoc ??= newDoc

    const mergeElRef = useRef<HTMLDivElement>(null)
    const mergeEditorViewRef = useRef<EditorView | null>(null)

    const { toasts, addToast } = useToasts()

    useEffect(() => {
        if (!mergeElRef.current) return

        const state = EditorState.create({
            doc: newDoc,
            extensions: [
                basicSetup,
                unifiedMergeView({
                    original: oldDoc,
                    allowInlineDiffs: true,
                }),

                EditorView.updateListener.of(update => {
                    const newChunkCount = getChunks(update.state)?.chunks.length

                    const tr = update.transactions.find(
                        tr => tr.isUserEvent('accept') || tr.isUserEvent('revert'),
                    )
                    console.log(update)
                    if (tr) {
                        const eventType = tr.isUserEvent('accept') ? 'accepted' : 'reverted'

                        if (debugToasts) {
                            addToast(
                                `The chunk was ${eventType}, now ${newChunkCount} chunk(s) remain.`,
                            )
                        }
                    }
                }),
            ],
        })

        mergeEditorViewRef.current = new EditorView({
            parent: mergeElRef.current,
            state,
        })

        return () => {
            mergeEditorViewRef.current?.destroy()
        }
    }, [])

    return (
        <>
            <div style={{ display: 'grid', gap: '0' }}>
                <div class="text-editor" ref={mergeElRef} />
                {tools.length > 0 && (
                    <div class="tools">
                        {tools.includes('findAndReplace') && (
                            <FindReplaceWidget
                                onReplaceAll={(findText, replaceText) => {
                                    if (!mergeEditorViewRef.current) return

                                    const view = mergeEditorViewRef.current
                                    const changes = findReplaceTransaction(
                                        view.state,
                                        findText,
                                        replaceText,
                                    )

                                    if (changes.length > 0) {
                                        view.dispatch({ changes })
                                    }
                                }}
                            />
                        )}
                        {tools.includes('lorem-ipsum') && (
                            <button
                                onClick={() => {
                                    if (!mergeEditorViewRef.current) return
                                    const view = mergeEditorViewRef.current

                                    const loremIpsum = dedent(`
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                                    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                `)

                                    mergeEditorViewRef.current.dispatch({
                                        changes: {
                                            from: 0,
                                            to: view.state.doc.length,
                                            insert: loremIpsum,
                                        },
                                    })
                                }}
                            >
                                Insert Lorem Ipsum
                            </button>
                        )}
                    </div>
                )}
            </div>
            <ToastDisplay toasts={toasts} />
        </>
    )
}

const unifiedDiffCompartment = new Compartment()

export const CodeMirrorToggleMergeModeDemo = ({
    oldDoc = null,
    newDoc = 'one\n2\nthree\n4',
}: {
    oldDoc: string | null
    newDoc?: string
}) => {
    oldDoc ??= newDoc

    const [reviewMode, setReviewMode] = useState(true)

    const originalDocRef = useRef<Text>(Text.of(oldDoc.split('\n')))

    const editorElementRef = useRef<HTMLDivElement>(null)
    const editorViewRef = useRef<EditorView | null>(null)

    useEffect(() => {
        if (!editorElementRef.current) return

        const state = EditorState.create({
            doc: newDoc,
            extensions: [
                basicSetup,
                unifiedDiffCompartment.of([
                    unifiedMergeView({
                        original: oldDoc,
                        allowInlineDiffs: true,
                    }),
                ]),
            ],
        })

        editorViewRef.current = new EditorView({
            parent: editorElementRef.current,
            state,
        })

        return () => {
            editorViewRef.current?.destroy()
        }
    }, [])

    useEffect(() => {
        if (!editorViewRef.current) return

        const view = editorViewRef.current

        if (!reviewMode) {
            const original = getOriginalDoc(view.state)
            console.log('Original doc from state:', original)

            originalDocRef.current = original
        }

        view.dispatch({
            effects: unifiedDiffCompartment.reconfigure(
                reviewMode
                    ? [
                          unifiedMergeView({
                              original: originalDocRef.current.toString(),
                              allowInlineDiffs: true,
                          }),
                      ]
                    : [],
            ),
        })
    }, [reviewMode])

    return (
        <>
            <div style={{ display: 'grid', gap: '0' }}>
                <div class="tools">
                    <button onClick={() => setReviewMode(v => !v)}>
                        {reviewMode ? 'Exit Review Mode' : 'Enter Review Mode'}
                    </button>
                </div>
                <div class="text-editor" ref={editorElementRef} />
            </div>
        </>
    )
}

function findReplaceTransaction(
    state: EditorState,
    findText: string,
    replaceText: string,
): ChangeSpec[] {
    const changes: ChangeSpec[] = []
    const regex = new RegExp(findText, 'g')

    const docText = state.doc.toString()
    for (const match of docText.matchAll(regex)) {
        changes.push({
            from: match.index,
            to: match.index + match[0].length,
            insert: replaceText,
        })
    }

    return changes
}

interface FindReplaceWidgetProps {
    onReplaceAll: (findText: string, replaceText: string) => void
}

export const FindReplaceWidget = ({ onReplaceAll }: FindReplaceWidgetProps) => {
    const [findText, setFindText] = useState('')
    const [replaceText, setReplaceText] = useState('')

    return (
        <div class="find-replace">
            <strong>Find and Replace</strong>
            <input
                type="text"
                placeholder="Find..."
                value={findText}
                onInput={e => setFindText(e.currentTarget.value)}
            />
            <input
                type="text"
                placeholder="Replace..."
                value={replaceText}
                onInput={e => setReplaceText(e.currentTarget.value)}
            />
            <button onClick={() => onReplaceAll(findText, replaceText)}>Replace All</button>
        </div>
    )
}

// const reviewMode = StateField.define<boolean>({
//     create() {
//         return false
//     },
//     update(value, tr) {
//         if (tr.isUserEvent('review-changes')) {
//             console.log('Entering review mode')
//             return true
//         }
//         if (tr.isUserEvent('accept') || tr.isUserEvent('revert')) {
//             const chunksCount = getChunks(tr.state)?.chunks.length || 0
//             if (chunksCount === 0) {
//                 console.log('All chunks resolved, exiting review mode')
//                 return false
//             }
//         }
//         return value
//     },
// })

const REVIEW_CHANGES_EVENT = 'review-changes'

const setOriginalDoc = StateEffect.define<Text | false>()

const originalDocField = StateField.define<Text | false>({
    create() {
        return false
    },
    update(value, tr) {
        console.log('originalDocField update:', value, tr)

        for (const effect of tr.effects) {
            if (effect.is(setOriginalDoc)) {
                console.log('Setting original document in state field')
                return effect.value
            }
        }

        if (value === false && tr.isUserEvent(REVIEW_CHANGES_EVENT)) {
            console.log('Storing original document for review mode')
            return tr.startState.doc
        }

        return value
    },
})

export const CodeMirrorReviewDemo = ({
    oldDoc = null,
    newDoc = 'one\n2\nthree\n4',
}: {
    oldDoc: string | null
    newDoc?: string
}) => {
    oldDoc ??= newDoc

    const editorElementRef = useRef<HTMLDivElement>(null)
    const editorViewRef = useRef<EditorView | null>(null)

    useEffect(() => {
        if (!editorElementRef.current) return

        const state = EditorState.create({
            doc: newDoc,
            extensions: [
                basicSetup,
                EditorView.lineWrapping,

                // reviewMode,
                originalDocField,

                unifiedDiffCompartment.of([]),

                EditorState.transactionExtender.of(tr => {
                    if (tr.isUserEvent(REVIEW_CHANGES_EVENT)) {
                        console.log('Entering review mode')

                        const originalDoc = tr.state.field(originalDocField)
                        if (!originalDoc) {
                            throw new Error('Original document not found in state field')
                        }

                        return {
                            effects: [
                                unifiedDiffCompartment.reconfigure([
                                    unifiedMergeView({
                                        original: originalDoc,
                                        allowInlineDiffs: true,
                                    }),
                                ]),
                            ],
                        }
                    }

                    if (tr.isUserEvent('accept') || tr.isUserEvent('revert')) {
                        if (getChunks(tr.state)?.chunks.length === 0) {
                            console.log('All chunks resolved, exiting review mode')
                            return {
                                effects: [
                                    setOriginalDoc.of(false),
                                    unifiedDiffCompartment.reconfigure([]),
                                ],
                            }
                        }
                    }

                    return null
                }),
            ],
        })

        editorViewRef.current = new EditorView({
            parent: editorElementRef.current,
            state,
        })

        return () => {
            editorViewRef.current?.destroy()
        }
    }, [])

    return (
        <>
            <div style={{ display: 'grid', gap: '0' }}>
                <div class="tools">
                    <FindReplaceWidget
                        onReplaceAll={(findText, replaceText) => {
                            if (!editorViewRef.current) return
                            const view = editorViewRef.current

                            const changes = findReplaceTransaction(
                                view.state,
                                findText,
                                replaceText,
                            )

                            if (changes.length > 0) {
                                view.dispatch({ changes, userEvent: REVIEW_CHANGES_EVENT })
                            }
                        }}
                    />
                </div>
                <div class="text-editor" ref={editorElementRef} />
            </div>
        </>
    )
}

export const TextareaAutoresizeDemo1 = () => {
    const [content, setContent] = useState(
        'Start typing...\nThis textarea will grow with your content.',
    )

    return (
        <textarea
            value={content}
            onInput={e => setContent(e.currentTarget.value)}
            rows={Math.max(3, content.split('\n').length)}
            style={{
                width: '100%',

                resize: 'none',

                whiteSpace: 'pre',
                overflowWrap: 'normal',
                overflowX: 'scroll',
            }}
        />
    )
}

export const TextareaAutoresizeDemo2 = () => {
    const [content, setContent] = useState(
        'Start typing...\nThis textarea will grow with your content.',
    )
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        const textarea = textareaRef.current
        if (!textarea) return

        requestAnimationFrame(() => {
            // Check if we need to shrink
            if (textarea.scrollHeight < textarea.clientHeight) {
                textarea.style.height = 'auto'
            }

            textarea.style.height = `${textarea.scrollHeight}px`
        })
    }, [content])

    return (
        <textarea
            ref={textareaRef}
            value={content}
            onInput={e => setContent(e.currentTarget.value)}
            style={{
                width: '100%',
                resize: 'none',
                overflow: 'hidden', // Prevents scrollbar flash
                minHeight: '3rem', // Instead of rows
            }}
        />
    )
}

export const TextInputDatalistDemo = () => {
    const [value, setValue] = useState('')
    const options = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']

    return (
        <div
            style={{
                display: 'grid',
                width: '100%',
            }}
        >
            <input
                type="text"
                list="fruits"
                value={value}
                onInput={e => setValue(e.currentTarget.value)}
                placeholder="Type to search fruits..."
                style={{
                    width: '100%',
                }}
            />
            <datalist id="fruits">
                {options.map(option => (
                    <option value={option} key={option} />
                ))}
            </datalist>
        </div>
    )
}

type HighlightSpec = Array<{
    pattern: RegExp | string
    color: string
}>

type HighlightToken = {
    text: string
    color: string | null
}

function highlightText(text: string, spec: HighlightSpec): HighlightToken[] {
    const ranges: Array<{ start: number; end: number; color: string }> = []

    // Collect all matches from all patterns
    for (const { pattern, color } of spec) {
        const regex =
            typeof pattern === 'string'
                ? new RegExp(`\\b${pattern}\\b`, 'g')
                : new RegExp(
                      pattern.source,
                      pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g',
                  )

        for (const match of text.matchAll(regex)) {
            ranges.push({
                start: match.index,
                end: match.index + match[0].length,
                color,
            })
        }
    }

    // Sort by start position
    ranges.sort((a, b) => a.start - b.start)

    // Build tokens, avoiding overlaps (first match wins)
    const tokens: HighlightToken[] = []
    let pos = 0

    for (const range of ranges) {
        if (range.start >= pos) {
            if (range.start > pos) {
                tokens.push({ text: text.slice(pos, range.start), color: null })
            }
            tokens.push({ text: text.slice(range.start, range.end), color: range.color })
            pos = range.end
        }
    }

    if (pos < text.length) {
        tokens.push({ text: text.slice(pos), color: null })
    }

    return tokens
}

interface HighlightedTextProps {
    text: string
    spec: HighlightSpec
}

const HighlightedText = ({ text, spec }: HighlightedTextProps) => {
    const tokens = highlightText(text, spec)
    return (
        <>
            {tokens.map((token, i) => (
                <span key={i} style={token.color ? { color: token.color } : undefined}>
                    {token.text}
                </span>
            ))}
        </>
    )
}

export const TextareaOverlayTrickDemo = () => {
    const [content, setContent] = useState(
        dedent(`
            This is a simple textarea with an overlay for syntax highlighting.
            Type something like <const> or <function> to see the magic!

            let x = 10
            function greet() {
                console.log("Hello, world!")
            }
        `),
    )

    return (
        <>
            <div class="textarea-overlay-container">
                <pre class="textarea-overlay-content">
                    {content.split('\n').map((line, i) => (
                        <div key={i}>
                            <HighlightedText
                                text={line + ' '}
                                spec={[
                                    {
                                        pattern: 'function|class|for|if|else|const|let|var',
                                        color: '#d73a49',
                                    },
                                    { pattern: /\d+(\.\d+)?/, color: '#3b82f6' },
                                    { pattern: /".*?"|'.*?'/, color: '#208609' },
                                ]}
                            />
                        </div>
                    ))}
                </pre>
                <textarea
                    class="textarea-overlay-input"
                    value={content}
                    onInput={e => setContent(e.currentTarget.value)}
                    spellcheck={false}
                />
            </div>
            <figcaption>
                This is a simple example of the overlay trick, the textarea is hidden and the
                overlay is rendered on top of it. Try to focus the textarea and see{' '}
                <s>some css trickery that shows</s> how the overlay updates in real-time.
            </figcaption>
        </>
    )
}
