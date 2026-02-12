function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

export type Modifier = number | ((v: number) => number)

export type AllSpace = ColorRGB | ColorHSL

export type ColorRGB = {
    space: 'rgb'
    r: number
    g: number
    b: number
}

export type ColorHSL = {
    space: 'hsl'
    h: number
    s: number
    l: number
}

export function fromHex(hex: string): ColorRGB {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { space: 'rgb', r, g, b }
}

export function toHex({ r, g, b }: ColorRGB): string {
    const rHex = r.toString(16).padStart(2, '0')
    const gHex = g.toString(16).padStart(2, '0')
    const bHex = b.toString(16).padStart(2, '0')
    return `#${rHex}${gHex}${bHex}`
}

export function fromRGBtoHSL({ r, g, b }: ColorRGB): ColorHSL {
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
        s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)

        switch (max) {
            case r:
                h = (g - b) / (max - min) + (g < b ? 6 : 0)
                break
            case g:
                h = (b - r) / (max - min) + 2
                break
            case b:
                h = (r - g) / (max - min) + 4
                break
        }

        h /= 6
    }

    return { space: 'hsl', h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function fromHSLtoRGB({ h, s, l }: ColorHSL): ColorRGB {
    h /= 360
    s /= 100
    l /= 100

    let r: number, g: number, b: number

    if (s === 0) {
        r = g = b = Math.round(l * 255)
    } else {
        const hueToRGB = (p: number, q: number, t: number): number => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q

        r = Math.round(hueToRGB(p, q, h + 1 / 3) * 255)
        g = Math.round(hueToRGB(p, q, h) * 255)
        b = Math.round(hueToRGB(p, q, h - 1 / 3) * 255)
    }

    return { space: 'rgb', r, g, b }
}

export class Color<T extends AllSpace> {
    constructor(public value: T) {}

    static fromHex(hex: string): Color<ColorRGB> {
        return new Color(fromHex(hex))
    }

    static fromRGB(r: number, g: number, b: number): Color<ColorRGB> {
        return new Color({ space: 'rgb', r, g, b })
    }

    static fromHSL(h: number, s: number, l: number): Color<ColorHSL> {
        return new Color({ space: 'hsl', h, s, l })
    }

    toRGB(): Color<ColorRGB> {
        if (this.value.space === 'rgb') {
            return this as unknown as Color<ColorRGB>
        }
        if (this.value.space === 'hsl') {
            return new Color(fromHSLtoRGB(this.value))
        }

        // @ts-ignore
        throw new Error(`Cannot convert "${this.value.space}" to RGB`)
    }

    toHSL(): Color<ColorHSL> {
        if (this.value.space === 'hsl') {
            return this as unknown as Color<ColorHSL>
        }
        if (this.value.space === 'rgb') {
            return new Color(fromRGBtoHSL(this.value))
        }

        // @ts-ignore
        throw new Error(`Cannot convert "${this.value.space}" to HSL`)
    }

    saturation(amount: Modifier): Color<ColorHSL> {
        const hsl = this.toHSL().value
        const newValue = typeof amount === 'function' ? amount(hsl.s) : amount
        hsl.s = clamp(newValue, 0, 100)
        return new Color(hsl)
    }

    hue(amount: Modifier): Color<ColorHSL> {
        const hsl = this.toHSL().value
        const newValue = typeof amount === 'function' ? amount(hsl.h) : amount
        hsl.h = newValue % 360
        if (hsl.h < 0) hsl.h += 360
        return new Color(hsl)
    }

    lightness(amount: Modifier): Color<ColorHSL> {
        const hsl = this.toHSL().value
        const newValue = typeof amount === 'function' ? amount(hsl.l) : amount
        hsl.l = clamp(newValue, 0, 100)
        return new Color(hsl)
    }

    toHex(): string {
        const rgb = this.toRGB().value
        return toHex(rgb)
    }
}
