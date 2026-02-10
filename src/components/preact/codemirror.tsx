import { minimalSetup } from 'codemirror'

import { EditorState } from '@codemirror/state'
import { Decoration, EditorView, ViewPlugin, ViewUpdate, WidgetType, type DecorationSet } from '@codemirror/view'

import { useEffect, useRef } from 'preact/hooks'

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

const SHAPES: Record<string, { createElement: (color: string) => SVGElement }> = {
    ['rectangle']: {
        createElement: (color: string) =>
            $svg('rect', {
                x: '2',
                y: '2',
                width: '46',
                height: '46',
                rx: '5',
                fill: color,
                stroke: 'rgba(0,0,0,0.2)',
                strokeWidth: '2',
            }),
    },
    ['circle']: {
        createElement: (color: string) =>
            $svg('circle', {
                cx: '25',
                cy: '25',
                r: '22',
                fill: color,
                stroke: 'rgba(0,0,0,0.2)',
                strokeWidth: '2',
            }),
    },
    ['star']: {
        createElement: (color: string) =>
            $svg('polygon', {
                points: '25,2.5 32.5,17.5 48.5,17.5 35.5,27.5 40.5,42.5 25,32.5 9.5,42.5 14.5,27.5 1.5,17.5 17.5,17.5',
                fill: color,
                stroke: 'rgba(0,0,0,0.2)',
                strokeWidth: '2',
            }),
    },
}

const SUPPORTED_COLORS: Record<string, string> = {
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
    color: string

    constructor(shape: string, color: string) {
        super()
        this.shape = shape
        this.color = color
    }

    toDOM() {
        const container = $('span', {
            style: { display: 'inline-block', verticalAlign: 'middle', margin: '0 2px' },
        })

        const svgShape = $svg('svg', { width: '50', height: '50', viewBox: '0 0 50 50' })

        const shapeDef = SHAPES[this.shape]
        if (!shapeDef) {
            const errorText = $('span', { style: { color: 'red' } }, [`Unsupported shape: ${this.shape}`])
            container.appendChild(errorText)
            return container
        }

        const element = shapeDef.createElement(this.color)

        svgShape.appendChild(element)
        container.appendChild(svgShape)
        return container
    }

    eq(other: ShapeWidget) {
        return other.shape === this.shape && other.color === this.color
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

                        if (!['rectangle', 'circle', 'star'].includes(shape) || !SUPPORTED_COLORS[color]) {
                            continue
                        }

                        const isCursorInside = mainSelection.from <= end && mainSelection.to >= start
                        if (!isCursorInside) {
                            const widget = new ShapeWidget(shape, SUPPORTED_COLORS[color])
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
