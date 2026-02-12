import { basicSetup, minimalSetup } from 'codemirror'

import { EditorState, type ChangeSpec, type Extension } from '@codemirror/state'
import { Decoration, EditorView, ViewPlugin, ViewUpdate, WidgetType, type DecorationSet } from '@codemirror/view'

import { useEffect, useRef, useState } from 'preact/hooks'

import { Color, type AllSpace } from '@/lib/colors'
import { getChunks, unifiedMergeView } from '@codemirror/merge'
import { ToastDisplay, useToasts } from './toasts'

const $ = (tag: string, attrs: Record<string, any>, children: (HTMLElement | string)[] = []): HTMLElement => {
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

const $svg = (tag: string, attrs: Record<string, string>, children: (SVGElement | string)[] = []): SVGElement => {
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

const initialContent = `Hello! This is a CodeMirror 6 editor.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Here is a <rectangle blue> shape. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 

You can create shapes by typing <shape color>. Try it!
For example: <circle green> or <star yellow>.

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Let's add an <rectangle orange> and a <star purple> for fun.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`

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
            const errorText = $('span', { style: { color: 'red' } }, [`Unsupported shape: ${this.shape}`])
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

function createCodeMirrorEditor(el: HTMLElement, extensions: Extension[] = [], initialContent: string = '') {
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

                        if (!['rectangle', 'circle', 'star'].includes(shape) || !SUPPORTED_COLORS_HEX[color]) {
                            continue
                        }

                        const isCursorInside = mainSelection.from <= end && mainSelection.to >= start
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
    const minIndent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)?.[0].length || 0))
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
            <div class="unified-merge-editor" style={{ flex: '1 1 100%' }}>
                <strong>Unified Merge View</strong>
                <button onClick={recreateMergeView}>Recreate</button>
                <div class="text-editor" style={{ height: '400px' }} ref={mergeElRef} />
            </div>
        </div>
    )
}

export const CodeMirrorMergeBasicSetupDemo = ({
    oldDoc = null,
    newDoc = 'one\n2\nthree\n4',
    tools = [],
}: {
    oldDoc: string | null
    newDoc?: string
    tools?: ('searchAndReplace' | 'lorem-ipsum')[]
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

                    const tr = update.transactions.find(tr => tr.isUserEvent('accept') || tr.isUserEvent('revert'))
                    console.log(update)
                    if (tr) {
                        const eventType = tr.isUserEvent('accept') ? 'accepted' : 'reverted'
                        addToast(`The chunk was ${eventType}, now ${newChunkCount} chunk(s) remain.`)
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

    const [searchText, setSearchText] = useState('')
    const [replaceText, setReplaceText] = useState('')

    return (
        <>
            <div style={{ display: 'grid', gap: '0' }}>
                <div class="text-editor" ref={mergeElRef} />
                {tools.length > 0 && (
                    <div class="tools">
                        {tools.includes('searchAndReplace') && (
                            <div class="search-replace">
                                <strong>Search and Replace</strong>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchText}
                                    onInput={e => setSearchText(e.currentTarget.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Replace..."
                                    value={replaceText}
                                    onInput={e => setReplaceText(e.currentTarget.value)}
                                />
                                <button
                                    onClick={() => {
                                        if (!mergeEditorViewRef.current) return

                                        const view = mergeEditorViewRef.current

                                        const changes: ChangeSpec[] = []
                                        const regex = new RegExp(searchText, 'g')

                                        const docText = view.state.doc.toString()
                                        for (const match of docText.matchAll(regex)) {
                                            changes.push({
                                                from: match.index,
                                                to: match.index + match[0].length,
                                                insert: replaceText,
                                            })
                                        }

                                        if (changes.length > 0) {
                                            view.dispatch({ changes })
                                        }
                                    }}
                                >
                                    Replace All
                                </button>
                            </div>
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
                                        changes: { from: 0, to: view.state.doc.length, insert: loremIpsum },
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
