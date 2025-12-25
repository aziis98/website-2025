// Enhanced Canvas DSL with path operations

export const Canvas = {
    of(primitives, { width, height }) {
        return { primitives, width, height }
    },

    rect(x, y, width, height) {
        return {
            type: 'rect',
            x,
            y,
            width,
            height,
            fill(color) {
                return { ...this, fillColor: color }
            },
            stroke(color, lineWidth = 1) {
                return { ...this, strokeColor: color, lineWidth }
            },
            opacity(alpha) {
                return { ...this, alpha }
            },
        }
    },

    roundRect(x, y, width, height, radius) {
        return {
            type: 'roundRect',
            x,
            y,
            width,
            height,
            radius,
            fill(color) {
                return { ...this, fillColor: color }
            },
            stroke(color, lineWidth = 1) {
                return { ...this, strokeColor: color, lineWidth }
            },
            opacity(alpha) {
                return { ...this, alpha }
            },
        }
    },

    circle(x, y, radius) {
        return {
            type: 'circle',
            x,
            y,
            radius,
            fill(color) {
                return { ...this, fillColor: color }
            },
            stroke(color, lineWidth = 1) {
                return { ...this, strokeColor: color, lineWidth }
            },
            opacity(alpha) {
                return { ...this, alpha }
            },
        }
    },

    line(x1, y1, x2, y2) {
        return {
            type: 'line',
            x1,
            y1,
            x2,
            y2,
            stroke(color, lineWidth = 1) {
                return { ...this, strokeColor: color, lineWidth }
            },
            opacity(alpha) {
                return { ...this, alpha }
            },
        }
    },

    // Path builder with fluent API
    path() {
        return {
            type: 'path',
            commands: [],
            moveTo(x, y) {
                return { ...this, commands: [...this.commands, { type: 'moveTo', x, y }] }
            },
            lineTo(x, y) {
                return { ...this, commands: [...this.commands, { type: 'lineTo', x, y }] }
            },
            bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
                return {
                    ...this,
                    commands: [...this.commands, { type: 'bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y }],
                }
            },
            quadraticCurveTo(cpx, cpy, x, y) {
                return { ...this, commands: [...this.commands, { type: 'quadraticCurveTo', cpx, cpy, x, y }] }
            },
            arc(x, y, radius, startAngle, endAngle, counterclockwise = false) {
                return {
                    ...this,
                    commands: [...this.commands, { type: 'arc', x, y, radius, startAngle, endAngle, counterclockwise }],
                }
            },
            arcTo(x1, y1, x2, y2, radius) {
                return { ...this, commands: [...this.commands, { type: 'arcTo', x1, y1, x2, y2, radius }] }
            },
            closePath() {
                return { ...this, commands: [...this.commands, { type: 'closePath' }] }
            },
            stroke(color, lineWidth = 1) {
                return { ...this, strokeColor: color, lineWidth }
            },
            fill(color) {
                return { ...this, fillColor: color }
            },
            opacity(alpha) {
                return { ...this, alpha }
            },

            applyAll(array, fn) {
                let updatedPath = this
                array.forEach(args => {
                    updatedPath = fn.apply(updatedPath, args)
                })
                return updatedPath
            },
        }
    },

    text(x, y, content) {
        return {
            type: 'text',
            x,
            y,
            content,
            font(family, size) {
                return { ...this, fontFamily: family, fontSize: size }
            },
            fill(color) {
                return { ...this, fillColor: color }
            },
            align(horizontal, vertical = 'alphabetic') {
                return { ...this, textAlign: horizontal, textBaseline: vertical }
            },
            opacity(alpha) {
                return { ...this, alpha }
            },
        }
    },

    // Group primitives together
    group(primitives) {
        return {
            type: 'group',
            primitives,
            translate(dx, dy) {
                return { ...this, translateX: dx, translateY: dy }
            },
            scale(sx, sy = sx) {
                return { ...this, scaleX: sx, scaleY: sy }
            },
            opacity(alpha) {
                return { ...this, alpha }
            },
        }
    },
}

export function renderPrimitive(ctx, primitive) {
    if (!primitive) return

    // Apply opacity if specified
    if (primitive.alpha !== undefined) {
        ctx.save()
        ctx.globalAlpha = primitive.alpha
    }

    switch (primitive.type) {
        case 'rect':
            if (primitive.fillColor) {
                ctx.fillStyle = primitive.fillColor
                ctx.fillRect(primitive.x, primitive.y, primitive.width, primitive.height)
            }
            if (primitive.strokeColor) {
                ctx.strokeStyle = primitive.strokeColor
                ctx.lineWidth = primitive.lineWidth
                ctx.strokeRect(primitive.x, primitive.y, primitive.width, primitive.height)
            }
            break

        case 'roundRect':
            ctx.beginPath()
            ctx.roundRect(primitive.x, primitive.y, primitive.width, primitive.height, primitive.radius)
            if (primitive.fillColor) {
                ctx.fillStyle = primitive.fillColor
                ctx.fill()
            }
            if (primitive.strokeColor) {
                ctx.strokeStyle = primitive.strokeColor
                ctx.lineWidth = primitive.lineWidth
                ctx.stroke()
            }
            break

        case 'circle':
            ctx.beginPath()
            ctx.arc(primitive.x, primitive.y, primitive.radius, 0, Math.PI * 2)
            if (primitive.fillColor) {
                ctx.fillStyle = primitive.fillColor
                ctx.fill()
            }
            if (primitive.strokeColor) {
                ctx.strokeStyle = primitive.strokeColor
                ctx.lineWidth = primitive.lineWidth
                ctx.stroke()
            }
            break

        case 'line':
            if (primitive.strokeColor) {
                ctx.strokeStyle = primitive.strokeColor
                ctx.lineWidth = primitive.lineWidth
                ctx.beginPath()
                ctx.moveTo(primitive.x1, primitive.y1)
                ctx.lineTo(primitive.x2, primitive.y2)
                ctx.stroke()
            }
            break

        case 'path':
            ctx.beginPath()
            primitive.commands.forEach(cmd => {
                switch (cmd.type) {
                    case 'moveTo':
                        ctx.moveTo(cmd.x, cmd.y)
                        break
                    case 'lineTo':
                        ctx.lineTo(cmd.x, cmd.y)
                        break
                    case 'bezierCurveTo':
                        ctx.bezierCurveTo(cmd.cp1x, cmd.cp1y, cmd.cp2x, cmd.cp2y, cmd.x, cmd.y)
                        break
                    case 'quadraticCurveTo':
                        ctx.quadraticCurveTo(cmd.cpx, cmd.cpy, cmd.x, cmd.y)
                        break
                    case 'arc':
                        ctx.arc(cmd.x, cmd.y, cmd.radius, cmd.startAngle, cmd.endAngle, cmd.counterclockwise)
                        break
                    case 'arcTo':
                        ctx.arcTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.radius)
                        break
                    case 'closePath':
                        ctx.closePath()
                        break
                }
            })
            if (primitive.fillColor) {
                ctx.fillStyle = primitive.fillColor
                ctx.fill()
            }
            if (primitive.strokeColor) {
                ctx.strokeStyle = primitive.strokeColor
                ctx.lineWidth = primitive.lineWidth
                ctx.stroke()
            }
            break

        case 'text':
            if (primitive.fontFamily || primitive.fontSize) {
                ctx.font = `${primitive.fontSize || 12}px ${primitive.fontFamily || 'sans-serif'}`
            }
            if (primitive.textAlign) ctx.textAlign = primitive.textAlign
            if (primitive.textBaseline) ctx.textBaseline = primitive.textBaseline
            if (primitive.fillColor) {
                ctx.fillStyle = primitive.fillColor
                ctx.fillText(primitive.content, primitive.x, primitive.y)
            }
            break

        case 'group':
            ctx.save()

            // Apply transformations
            if (primitive.translateX || primitive.translateY) {
                ctx.translate(primitive.translateX || 0, primitive.translateY || 0)
            }
            if (primitive.scaleX || primitive.scaleY) {
                ctx.scale(primitive.scaleX || 1, primitive.scaleY || 1)
            }

            // Render children
            primitive.primitives.forEach(p => renderPrimitive(ctx, p))

            ctx.restore()
            break
    }

    // Restore opacity
    if (primitive.alpha !== undefined) {
        ctx.restore()
    }
}

export function renderCanvasScene(ctx, scene) {
    const cssWidth = scene.width
    const cssHeight = scene.height

    // Adjust canvas size for device pixel ratio
    const dpr = window.devicePixelRatio || 1
    ctx.canvas.width = cssWidth * dpr
    ctx.canvas.height = cssHeight * dpr
    ctx.canvas.style.width = `${cssWidth}px`
    ctx.canvas.style.height = `${cssHeight}px`

    // Reset transformations and scale the context to account for the device pixel ratio
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, cssWidth, cssHeight)

    // Render all primitives (filter out nulls/undefined)
    scene.primitives.filter(Boolean).forEach(primitive => renderPrimitive(ctx, primitive))
}
