import { render } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'

// const CELL_SIZE = 5
// const CELL_COLOR = '#44444406'
// const CELL_COLOR = '#66666606'
// const CELL_COLOR = '#ffffff06'

// --accent: hsl(266, 100%, 77%);
// --accent-2: hsl(239, 100%, 77%);

// function randomColorInGradientHSL(
//     hue: number,
//     saturation: number,
//     lightness: number,
//     variation: number = 10,
//     alpha: number = 1.0,
// ): string {
//     const h = hue + Math.floor(Math.random() * variation) - variation / 2
//     const s = saturation + Math.floor(Math.random() * variation) - variation / 2
//     const l = lightness + Math.floor(Math.random() * variation) - variation / 2
//     return `hsl(${h}deg ${s}% ${l}% / ${alpha * 100}%)`
// }

// randomColorInGradientHSL(250, 100, 77, 13)

type Size = { abs: number } | { rel: number }

function toAbsoluteSize(s: Size, containerSize: number): number {
    return 'abs' in s ? s.abs : (containerSize * s.rel) / 100
}

function toAbsoluteSizeOr<T>(s: Size, other: T): number | T {
    return 'abs' in s ? s.abs : other
}

class Grid<T> {
    cells: Map<string, T>

    constructor() {
        this.cells = new Map()
    }

    get(x: number, y: number): T | undefined {
        return this.cells.get(`${x},${y}`)
    }

    set(x: number, y: number, value: T): void {
        this.cells.set(`${x},${y}`, value)
    }

    remove(x: number, y: number): void {
        this.cells.delete(`${x},${y}`)
    }

    has(x: number, y: number): boolean {
        return this.cells.has(`${x},${y}`)
    }

    forEach(callback: (x: number, y: number, value: T) => void): void {
        this.cells.forEach((value, key) => {
            const [x, y] = key.split(',').map(Number)
            callback(x, y, value)
        })
    }

    allCells(): { x: number; y: number; value: T }[] {
        const result: { x: number; y: number; value: T }[] = []
        this.cells.forEach((value, key) => {
            const [x, y] = key.split(',').map(Number)
            result.push({ x, y, value })
        })
        return result
    }

    clear(): void {
        this.cells.clear()
    }
}

type Vec2 = { x: number; y: number }

const allDirections: Record<number, Vec2> = {
    0: { x: 1, y: 0 },
    1: { x: 0, y: 1 },
    2: { x: -1, y: 0 },
    3: { x: 0, y: -1 },
}

function oppositeDirection(d: number): number {
    return (d + 2) % 4
}

function orthogonalDirections(d: number): [number, number] {
    return [(d + 1) % 4, (d + 3) % 4]
}

function scale(v: Vec2, amount: number): Vec2 {
    return { x: v.x * amount, y: v.y * amount }
}

function randomRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min
}

function randomChoose<T>(array: T[]): T {
    if (array.length === 0) {
        throw new Error('Cannot choose from an empty array')
    }

    return array[Math.floor(Math.random() * array.length)]
}

function roundTo(v: number, step: number): number {
    return Math.floor(Math.round(v / step) * step)
}

function range(min: number, max: number): number[] {
    const arr = []
    for (let i = min; i <= max; i++) {
        arr.push(i)
    }
    return arr
}

// function clamp(value: number, { min, max }: { min?: number; max?: number }): number {
//     if (min !== undefined && value < min) {
//         return min
//     }
//     if (max !== undefined && value > max) {
//         return max
//     }
//     return value
// }

// clamp(5, { min: 7, max: 32423 })

const SPROUT_DIE_CHANCE = 0.01
const SPROUT_BORN_CHANCE = 0.5

type Sprout = { x: number; y: number; direction: number }

const createPixelartAutomata = (initialSprouts: Sprout[], grid: Grid<'filled'>, width: number, height: number) => {
    const sprouts = [...initialSprouts]

    // horizontally spaced sprouts
    // const MAX_SPROUTS = 8
    // const sprouts: { x: number; y: number; direction: number }[] = range(1, MAX_SPROUTS).map(i => ({
    //     x: roundTo(Math.floor(width * (i / (MAX_SPROUTS + 1))), 2),
    //     y: roundTo(Math.floor(height * 0.5), 2),
    //     direction: randomRange(0, 3),
    // }))

    // randomly spaced sprouts
    // const MAX_SPROUTS = Math.floor(Math.max(1, (width * height) / 500))
    // const sprouts: Sprout[] = Array.from({ length: MAX_SPROUTS }, () => ({
    //     x: roundTo(Math.floor(Math.random() * (width - 2 + 1)), 2),
    //     y: roundTo(Math.floor(Math.random() * (height - 2 + 1)), 2),
    //     direction: randomRange(0, 3),
    // }))

    // console.log(sprouts)

    // grid spaced sprouts every 20 cells in x and y
    // const SPACING_X = 25
    // const SPACING_Y = 7

    // const MAX_SPROUTS_X = Math.floor(width / SPACING_X)
    // const MAX_SPROUTS_Y = Math.floor(height / SPACING_Y)
    // const sprouts: { x: number; y: number; direction: number }[] = Array.from(
    //     { length: MAX_SPROUTS_X * MAX_SPROUTS_Y },
    //     (_, i) => {
    //         const x = (i % MAX_SPROUTS_X) * SPACING_X + 2
    //         const y = Math.floor(i / MAX_SPROUTS_X) * SPACING_Y + 2
    //         return {
    //             x: roundTo(x, 2),
    //             y: roundTo(y, 2),
    //             direction: randomRange(0, 3),
    //         }
    //     },
    // )

    return {
        sprouts,
        update() {
            const toRemove = []

            sproutLoop: for (const sprout of sprouts) {
                // const advanceAmount = randomRange(2, 4) * 2
                // const advanceAmount = roundTo((Math.random() ** 2 * 3 + 1) * 2, 2)
                const advanceAmount = randomChoose([2, 4, 4, 4, 6, 6])

                sprout.direction = randomChoose([0, 1, 2, 3])

                for (let i = 1; i < advanceAmount + 1; i++) {
                    const stepX = sprout.x + allDirections[sprout.direction].x * i
                    const stepY = sprout.y + allDirections[sprout.direction].y * i

                    if (grid.has(stepX, stepY) || stepX < 0 || stepX > width || stepY < 0 || stepY >= height) {
                        if (Math.random() < SPROUT_DIE_CHANCE) {
                            toRemove.push(sprout)
                        }

                        continue sproutLoop
                    }
                }

                // fill all cells in the path
                for (let i = 0; i < advanceAmount; i++) {
                    const stepX = sprout.x + allDirections[sprout.direction].x * i
                    const stepY = sprout.y + allDirections[sprout.direction].y * i

                    grid.set(stepX, stepY, 'filled')
                }

                const newX = sprout.x + allDirections[sprout.direction].x * advanceAmount
                const newY = sprout.y + allDirections[sprout.direction].y * advanceAmount

                grid.set(newX, newY, 'filled')
                sprout.x = newX
                sprout.y = newY
                sprout.direction = randomChoose(
                    [
                        0,
                        1,
                        2,
                        3,
                        ...orthogonalDirections(sprout.direction),
                        ...orthogonalDirections(sprout.direction),
                    ].filter(d => d !== oppositeDirection(sprout.direction)),
                )
            }

            // remove sprouts that hit obstacles
            for (const sprout of toRemove) {
                const index = sprouts.indexOf(sprout)
                if (index !== -1) {
                    sprouts.splice(index, 1)
                }
            }

            // occasionally add new sprouts to the grid
            if (Math.random() < SPROUT_BORN_CHANCE) {
                const filledCells = grid.allCells().filter(cell => cell.x % 2 === 0 && cell.y % 2 === 0)

                if (filledCells.length > 0) {
                    const randomCell = randomChoose(filledCells)
                    const availableDirections: number[] = []

                    // Check 3x3 plus pattern centered at the chosen point
                    for (let dir = 0; dir < 4; dir++) {
                        const dx = allDirections[dir].x
                        const dy = allDirections[dir].y

                        // Check the plus pattern: center + 3 cells in each direction
                        let canGrow = true
                        for (let i = 1; i <= 2; i++) {
                            const checkX = randomCell.x + dx * i
                            const checkY = randomCell.y + dy * i

                            if (
                                grid.has(checkX, checkY) ||
                                checkX < 0 ||
                                checkX >= width ||
                                checkY < 0 ||
                                checkY >= height
                            ) {
                                canGrow = false
                                break
                            }
                        }

                        if (canGrow) {
                            availableDirections.push(dir)
                        }
                    }

                    if (availableDirections.length > 0) {
                        const newDirection = randomChoose(availableDirections)
                        sprouts.push({
                            x: randomCell.x,
                            y: randomCell.y,
                            direction: newDirection,
                        })
                    }
                }
            }
        },
    }
}

type PixelartOptions = {
    cellSize?: number
    cellColor?: string
    spawnLocation?: 'everywhere' | 'right' | 'top' | 'bottom' | 'left'
}

const renderPixelart = (
    ctx: CanvasRenderingContext2D,
    updateInterval: number,
    stopTimeout: number,
    { cellSize, cellColor, spawnLocation }: PixelartOptions,
) => {
    cellSize ??= 5
    cellColor ??= '#dddddd06'
    spawnLocation ??= 'everywhere'

    console.log('Rendering pixel art plant...')
    // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    const initialSprouts: Sprout[] = []
    const gridWidth = Math.floor(ctx.canvas.width / cellSize)
    const gridHeight = Math.floor(ctx.canvas.height / cellSize)

    const SIDE_SIZE = 0.25

    const sproutDensity = 0.005
    const maxSprouts = Math.floor(Math.max(1, gridWidth * gridHeight * sproutDensity))
    for (let i = 0; i < maxSprouts; i++) {
        const x =
            spawnLocation === 'left'
                ? Math.floor(randomFloat(0, gridWidth * SIDE_SIZE))
                : spawnLocation === 'right'
                  ? Math.floor(randomFloat(gridWidth * (1.0 - SIDE_SIZE), gridWidth))
                  : Math.floor(randomFloat(0, gridWidth))

        const y =
            spawnLocation === 'top'
                ? Math.floor(randomFloat(0, gridHeight * SIDE_SIZE))
                : spawnLocation === 'bottom'
                  ? Math.floor(randomFloat(gridHeight * (1.0 - SIDE_SIZE), gridHeight))
                  : Math.floor(randomFloat(0, gridHeight))

        initialSprouts.push({
            x: roundTo(x, 2),
            y: roundTo(y, 2),
            direction: randomRange(0, 3), // random direction
        })
    }

    const grid = new Grid<'filled'>()
    const sim = createPixelartAutomata(initialSprouts, grid, gridWidth, gridHeight)

    const timerUpdateId = window.setInterval(() => {
        grid.forEach((x, y, value) => {
            if (value === 'filled') {
                ctx.fillStyle = cellColor
                // ctx.fillStyle = randomColorInGradientHSL(250, 100, 77, 20, 0.1)
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
            }
        })

        // draw a red dot near each sprout
        // sim.sprouts.forEach(sprout => {
        //     ctx.fillStyle = '#f00' // red for sprouts
        //     ctx.beginPath()
        //     ctx.arc(sprout.x * cellSize + 2.5, sprout.y * cellSize + 2.5, 2.5, 0, Math.PI * 2)
        //     ctx.fill()
        // })

        sim.update()
    }, updateInterval)

    const timerStopId = window.setTimeout(() => {
        window.clearInterval(timerUpdateId)
        console.log('Pixel art plant rendering completed.')
    }, stopTimeout)

    // ctx.fillStyle = '#00FF00'
    // ctx.fillRect(0, 0, ctx.canvas.width / 2, ctx.canvas.height / 2)
    // ctx.fillStyle = '#0000FF'
    // ctx.fillRect(10, 10, ctx.canvas.width - 20, ctx.canvas.height - 20)

    return () => {
        console.log('Stopping pixel art plant rendering...')
        window.clearInterval(timerUpdateId)
        window.clearTimeout(timerStopId)
    }
}

export const PixelartPlantRect = ({
    width,
    height,
    updateInterval,
    stopTimeout,
    options,
}: {
    width?: number
    height?: number
    updateInterval?: number
    stopTimeout?: number
    options?: PixelartOptions
}) => {
    updateInterval ??= 100
    stopTimeout ??= 1000 * 60

    options ??= {
        cellSize: 5,
        cellColor: '#aaaaaa06',
    }

    const actualWidth: Size = width !== undefined ? { abs: width } : { rel: 100 }
    const actualHeight: Size = height !== undefined ? { abs: height } : { rel: 100 }

    const [redraw, setRedraw] = useState(0)

    const canvasRef = useRef<HTMLCanvasElement>(null)

    // redraw on window resize
    useEffect(() => {
        let lastWidth = window.innerWidth

        const handleResize = () => {
            if (window.innerWidth !== lastWidth) {
                lastWidth = window.innerWidth
                setRedraw(v => v + 1)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (canvasRef.current) {
            const canvasEl = canvasRef.current

            canvasEl.width = roundTo(toAbsoluteSize(actualWidth, canvasEl.offsetWidth), options.cellSize ?? 5)
            canvasEl.height = roundTo(toAbsoluteSize(actualHeight, canvasEl.offsetHeight), options.cellSize ?? 5)

            const ctx = canvasEl.getContext('2d')
            if (!ctx) {
                console.error('Failed to get canvas context')
                return
            }

            const dispose = renderPixelart(ctx, updateInterval, stopTimeout, options)

            return dispose
        }
    }, [redraw])

    return (
        <div
            class="pixelart-plant-art"
            style={{
                minWidth: 0,
                minHeight: 0,
                width: toAbsoluteSizeOr(actualWidth, '100%'),
                height: toAbsoluteSizeOr(actualHeight, '100%'),
            }}
            onClick={() => setRedraw(v => v + 1)}
        >
            <canvas ref={canvasRef}></canvas>
        </div>
    )
}

export const decorateHeadings = () => {
    document.querySelectorAll('h1,h2').forEach($heading => {
        const $span = document.createElement('span')
        $heading.appendChild($span)

        render(
            <div class="decoration">
                <PixelartPlantRect />
            </div>,
            $span,
        )
    })
}
