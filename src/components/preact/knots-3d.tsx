import { useEffect, useRef } from 'preact/hooks'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import MAIN_FRAGMENT_SHADER from '@/assets/shaders/hatching.frag?raw'
import MAIN_VERTEX_SHADER from '@/assets/shaders/hatching.vert?raw'
import OUTLINE_FRAGMENT_SHADER from '@/assets/shaders/outline.frag?raw'
import OUTLINE_VERTEX_SHADER from '@/assets/shaders/outline.vert?raw'

// https://www.wolframcloud.com/obj/9e91c33b-e5d5-41da-b9bc-560005b42282
import RAW_FIGURE_EIGHT_KNOT_DATA from '@/assets/knot-data/figure-eight.json'

type Knot =
    | { type: 'data'; points: [number, number, number][] }
    | { type: 'torus-knot'; p: number; q: number; segments?: number }

function getKnotPoints(knot: Knot): [number, number, number][] {
    if (knot.type === 'data') {
        return knot.points
    } else if (knot.type === 'torus-knot') {
        const segments = knot.segments ?? 200
        const radius = 2
        const points: [number, number, number][] = []

        for (let i = 0; i <= segments; i++) {
            const u = (i / segments) * knot.p * Math.PI * 2
            const cu = Math.sin(u)
            const su = Math.cos(u)
            const quOverP = (knot.q / knot.p) * u
            const cs = Math.cos(quOverP)

            const x = radius * (2 + cs) * 0.5 * cu
            const y = radius * (2 + cs) * su * 0.5
            const z = radius * Math.sin(quOverP) * 0.5
            points.push([x, y, z * 0.5])
        }

        return points
    }

    throw new Error(`Unknown knot type`)
}

function createKnotGeometry(knot: Knot): THREE.BufferGeometry {
    const points = getKnotPoints(knot)

    return new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
            points.map(p => new THREE.Vector3(p[0], p[1], p[2])),
            true,
        ),
        points.length,
        0.325,
        16,
    )
}

function normalizeGeometry(geometry: THREE.BufferGeometry): void {
    geometry.computeBoundingBox()
    const bbox = geometry.boundingBox!

    // Calculate center and size
    const center = new THREE.Vector3()
    bbox.getCenter(center)

    const size = new THREE.Vector3()
    bbox.getSize(size)

    // Calculate scale to fit in [-1, 1] box
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 2 / maxDim

    // Get position attribute and transform vertices
    const positionAttribute = geometry.getAttribute('position')
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i)
        const y = positionAttribute.getY(i)
        const z = positionAttribute.getZ(i)

        positionAttribute.setXYZ(i, (x - center.x) * scale, (y - center.y) * scale, (z - center.z) * scale)
    }
    positionAttribute.needsUpdate = true
    geometry.computeVertexNormals()
    geometry.computeBoundingBox()
}

const KNOT_NAMES = {
    'trefoil': {
        type: 'torus-knot',
        p: 2,
        q: 3,
    } satisfies Knot,
    'figure-eight': {
        type: 'data',
        points: RAW_FIGURE_EIGHT_KNOT_DATA.map(p => [p[0], p[1], p[2] * 0.33]),
    } satisfies Knot,
}

export const PlotKnot = ({ name, knot = KNOT_NAMES['trefoil'] }: { name?: keyof typeof KNOT_NAMES; knot?: Knot }) => {
    if (name && KNOT_NAMES[name]) {
        knot = KNOT_NAMES[name]
    }

    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const animationIdRef = useRef<number | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        // Merge config with provided style
        const config = {
            colors: {
                paper: '#f4f4f4',
                ink: '#555',
            },
            outline: {
                thickness: 0.013,
            },
            hatching: {
                pitch: 6.0,
                thickness: 1.5,
                angle: 60,
                threshold: 0.8,
                density: 0.5,
            },
        }

        // Scene Setup
        const scene = new THREE.Scene()
        sceneRef.current = scene

        const width = containerRef.current.clientWidth
        const height = containerRef.current.clientHeight

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
        camera.position.set(0, 0, 3)

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setClearColor(0x000000, 0)
        rendererRef.current = renderer
        containerRef.current.appendChild(renderer.domElement)

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableZoom = false
        controls.enableDamping = true
        controls.dampingFactor = 0.05

        // Capture initial camera state
        const initialCameraPosition = camera.position.clone()
        const initialControlsTarget = controls.target.clone()

        // Auto-rotation management
        let mouseDown = false
        let autoRotateEnabled = true
        let autoRotateTimeout: NodeJS.Timeout | null = null

        const handleInteraction = (isMouseDown: boolean) => {
            mouseDown = isMouseDown
            autoRotateEnabled = false

            if (autoRotateTimeout) clearTimeout(autoRotateTimeout)
            autoRotateEnabled = false
            autoRotateTimeout = setTimeout(() => {
                if (!mouseDown) autoRotateEnabled = true
            }, 1000)
        }

        renderer.domElement.addEventListener('pointerdown', () => handleInteraction(true))
        renderer.domElement.addEventListener('pointerup', () => handleInteraction(false))

        // --- OBJECT CREATION ---
        const geometry = createKnotGeometry(knot)
        normalizeGeometry(geometry)

        // Mesh with Hatching Material
        const mesh = new THREE.Mesh(
            geometry,
            new THREE.ShaderMaterial({
                uniforms: {
                    uInkColor: { value: new THREE.Color(config.colors.ink) },
                    uPaperColor: { value: new THREE.Color(config.colors.paper) },
                    uLightDir: { value: new THREE.Vector3(-2.0, 3.0, 3.0).normalize() },
                    uPitch: { value: config.hatching.pitch },
                    uHatchThickness: { value: config.hatching.thickness },
                    uHatchAngle: { value: config.hatching.angle },
                    uShadowThreshold: { value: config.hatching.threshold },
                    uShadowDensity: { value: config.hatching.density },
                },
                vertexShader: MAIN_VERTEX_SHADER,
                fragmentShader: MAIN_FRAGMENT_SHADER,
            }),
        )

        // Mesh with Outline Material
        const outlineMesh = new THREE.Mesh(
            geometry,
            new THREE.ShaderMaterial({
                uniforms: {
                    uThickness: { value: config.outline.thickness },
                    uInkColor: { value: new THREE.Color(config.colors.ink) },
                },
                vertexShader: OUTLINE_VERTEX_SHADER,
                fragmentShader: OUTLINE_FRAGMENT_SHADER,
                side: THREE.BackSide,
            }),
        )

        scene.add(mesh)
        scene.add(outlineMesh)

        // --- ANIMATION LOOP ---
        function animate() {
            animationIdRef.current = requestAnimationFrame(animate)

            if (autoRotateEnabled) {
                // Smoothly return camera to initial position
                const targetPosition = camera.position.clone().lerp(initialCameraPosition, 0.01)
                targetPosition.normalize().multiplyScalar(camera.position.length())
                camera.position.copy(targetPosition)

                const targetTarget = initialControlsTarget.clone()
                controls.target.lerp(targetTarget, 0.01)

                controls.update()

                // Rotate the mesh
                mesh.rotation.y += 0.0025
                outlineMesh.rotation.copy(mesh.rotation)
            } else {
                controls.update()
            }

            renderer.render(scene, camera)
        }

        animate()

        // --- RESIZE HANDLER ---
        function handleResize() {
            if (!containerRef.current) return
            const w = containerRef.current.clientWidth
            const h = containerRef.current.clientHeight
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
        }

        window.addEventListener('resize', handleResize)

        // --- CLEANUP ---
        return () => {
            window.removeEventListener('resize', handleResize)
            if (autoRotateTimeout) clearTimeout(autoRotateTimeout)
            if (animationIdRef.current !== null) {
                cancelAnimationFrame(animationIdRef.current)
            }
            geometry.dispose()
            new THREE.ShaderMaterial({
                uniforms: {
                    uInkColor: { value: new THREE.Color(config.colors.ink) },
                    uPaperColor: { value: new THREE.Color(config.colors.paper) },
                    uLightDir: { value: new THREE.Vector3(-2.0, 3.0, 3.0).normalize() },
                    uPitch: { value: config.hatching.pitch },
                    uHatchThickness: { value: config.hatching.thickness },
                    uHatchAngle: { value: config.hatching.angle },
                    uShadowThreshold: { value: config.hatching.threshold },
                    uShadowDensity: { value: config.hatching.density },
                },
                vertexShader: MAIN_VERTEX_SHADER,
                fragmentShader: MAIN_FRAGMENT_SHADER,
            }).dispose()
            new THREE.ShaderMaterial({
                uniforms: {
                    uThickness: { value: config.outline.thickness },
                    uInkColor: { value: new THREE.Color(config.colors.ink) },
                },
                vertexShader: OUTLINE_VERTEX_SHADER,
                fragmentShader: OUTLINE_FRAGMENT_SHADER,
                side: THREE.BackSide,
            }).dispose()
            renderer.dispose()
            containerRef.current?.removeChild(renderer.domElement)
        }
    }, [knot])

    return (
        <div
            ref={containerRef}
            style={{
                // border: '1px solid magenta',
                width: '18rem',
                minHeight: '18rem',
                margin: '0 auto',
            }}
        />
    )
}
