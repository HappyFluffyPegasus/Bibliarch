'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type Section = 'BODY' | 'HAIR' | 'TOPS' | 'DRESSES' | 'PANTS' | 'SHOES' | 'ACCESSORIES' | null

export interface Transform {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

export interface CategoryColors {
  hair: string
  tops: {
    primary: string
    secondary?: string
  }
  pants: string
  dresses: string
  shoes: string
  socks: string
  accessories: string
  body: {
    skinTone: string
    eyeColor: string
  }
}

interface Viewer3DProps {
  currentSection: Section
  visibleAssets: string[]
  categoryColors?: CategoryColors
  transforms?: Record<string, Transform>
  onMeshesLoaded?: (meshes: string[]) => void
}

const CAMERA_POSITIONS = {
  DEFAULT: { position: new THREE.Vector3(0, 1.55, 5), target: new THREE.Vector3(0, 1.1, 0), fov: 28 },
  BODY: { position: new THREE.Vector3(0, 1.55, 5), target: new THREE.Vector3(0, 1.1, 0), fov: 28 },
  HAIR: { position: new THREE.Vector3(0, 1.7, 1.2), target: new THREE.Vector3(0, 1.65, 0), fov: 40 },
  TOPS: { position: new THREE.Vector3(0, 1.2, 1.8), target: new THREE.Vector3(0, 1.1, 0), fov: 45 },
  DRESSES: { position: new THREE.Vector3(0, 1.0, 2.8), target: new THREE.Vector3(0, 1.0, 0), fov: 40 },
  PANTS: { position: new THREE.Vector3(0, 0.8, 2.0), target: new THREE.Vector3(0, 0.6, 0), fov: 50 },
  SHOES: { position: new THREE.Vector3(0.3, 0.3, 1.5), target: new THREE.Vector3(0, 0.1, 0), fov: 45 },
  ACCESSORIES: { position: new THREE.Vector3(0, 1.55, 5), target: new THREE.Vector3(0, 1.1, 0), fov: 28 },
}

export default function Viewer3D({ currentSection, visibleAssets, categoryColors, transforms, onMeshesLoaded }: Viewer3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const materialMapRef = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map())
  const sceneObjectsRef = useRef<THREE.Group | null>(null)
  const originalTransformsRef = useRef<Map<string, { position: THREE.Vector3, rotation: THREE.Euler, scale: THREE.Vector3 }>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x2a2a2a)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      28,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 1.55, 5)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    })
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    rendererRef.current = renderer

    // Controls setup - Sims-style rotation
    const controls = new OrbitControls(camera, canvas)
    controls.target.set(0, 1.1, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 0.5
    controls.maxDistance = 8
    controls.maxPolarAngle = Math.PI / 1.5
    controls.minPolarAngle = Math.PI / 6
    controls.enablePan = false
    controls.rotateSpeed = 0.8
    controls.zoomSpeed = 0.8
    controlsRef.current = controls

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4)
    scene.add(hemiLight)

    // Grid
    const grid = new THREE.GridHelper(10, 10, 0x404040, 0x404040)
    scene.add(grid)

    // Load GLB model
    const loader = new GLTFLoader()
    loader.load(
      '/models/Neighbor Base V16.glb',
      (gltf) => {
        scene.add(gltf.scene)
        sceneObjectsRef.current = gltf.scene

        const meshes: string[] = []

        gltf.scene.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            const meshName = node.name || 'unnamed_mesh'
            const nameLower = meshName.toLowerCase()
            meshes.push(meshName)
            meshMapRef.current.set(meshName, node)

            // Save original transform
            originalTransformsRef.current.set(meshName, {
              position: node.position.clone(),
              rotation: node.rotation.clone(),
              scale: node.scale.clone()
            })

            // Store material references
            const materials = Array.isArray(node.material) ? node.material : [node.material]
            materials.forEach((mat) => {
              if (mat && mat instanceof THREE.MeshStandardMaterial) {
                const matName = mat.name || 'unnamed_material'
                if (!materialMapRef.current.has(matName)) {
                  materialMapRef.current.set(matName, mat)
                }

                // Mark eye materials
                if (meshName === 'Eyes' || meshName === 'Eyes_3' || nameLower.includes('eyes')) {
                  mat.userData.isEyeMaterial = true
                  mat.transparent = true
                  mat.alphaTest = 0.5
                  mat.opacity = 1
                  mat.depthWrite = true
                  mat.side = THREE.DoubleSide
                  mat.visible = true
                  mat.needsUpdate = true
                }
              }
            })

            // Only show base body and closed mouth by default
            const hasBaseOrBody = nameLower.includes('base') || nameLower.includes('body')
            const isClothing = nameLower.includes('hair') || nameLower.includes('pants') ||
                              nameLower.includes('shirt') || nameLower.includes('top') ||
                              nameLower.includes('shoe') || nameLower.includes('sock')
            const isBaseBody = hasBaseOrBody && !isClothing
            const isClosedMouth = nameLower.includes('mouth') && nameLower.includes('closed')

            node.visible = isBaseBody || isClosedMouth
          }
        })

        setLoading(false)

        if (onMeshesLoaded) {
          onMeshesLoaded(meshes)
        }

        // Center the model
        const box = new THREE.Box3().setFromObject(gltf.scene)
        const center = box.getCenter(new THREE.Vector3())
        gltf.scene.position.sub(center)
        gltf.scene.position.y += box.getSize(new THREE.Vector3()).y / 2

        // Normalize skin weights
        gltf.scene.traverse((node) => {
          if (node instanceof THREE.SkinnedMesh) {
            node.normalizeSkinWeights()
          }
        })
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error)
        setError('Failed to load 3D model')
        setLoading(false)
      }
    )

    // Handle window resize
    const handleResize = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()

      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      renderer.dispose()
      controls.dispose()
    }
  }, [])

  // Camera animation effect when section changes
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return

    const camera = cameraRef.current
    const controls = controlsRef.current

    const sectionKey = currentSection || 'DEFAULT'
    const targetPos = CAMERA_POSITIONS[sectionKey]

    if (targetPos) {
      const startPos = camera.position.clone()
      const startTarget = controls.target.clone()
      const startFov = camera.fov

      const duration = 800
      const startTime = Date.now()

      const animateCamera = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2

        camera.position.lerpVectors(startPos, targetPos.position, eased)
        controls.target.lerpVectors(startTarget, targetPos.target, eased)

        camera.fov = startFov + (targetPos.fov - startFov) * eased
        camera.updateProjectionMatrix()

        controls.update()

        if (progress < 1) {
          requestAnimationFrame(animateCamera)
        }
      }

      animateCamera()
    }
  }, [currentSection])

  // Helper: categorize mesh to determine which color to apply
  const categorizeMesh = (meshName: string): string | null => {
    const lower = meshName.toLowerCase()
    if (lower.includes('plane072')) return null
    if (lower.includes('hair')) return 'hair'
    if (lower.includes('shirt') || lower.includes('tee') || lower.includes('polo') ||
        lower.includes('sweater') || lower.includes('jacket') || lower.includes('tank') ||
        lower.includes('top') || lower.includes('plane023')) return 'tops'
    if (lower.includes('dress')) return 'dresses'
    if (lower.includes('pants') || lower.includes('jeans') || lower.includes('short') ||
        lower.includes('skirt')) return 'pants'
    if (lower.includes('shoe') || lower.includes('boot') || lower.includes('loafer') || lower.includes('sneaker')) return 'shoes'
    if (lower.includes('sock') || lower.includes('tight') || lower.includes('stocking') ||
        lower.includes('warmer') || lower.includes('leg warmer')) return 'socks'
    if (lower.includes('glasses') || lower.includes('hat') || lower.includes('wing')) return 'accessories'
    if (lower.includes('body') || lower.includes('skin')) return 'body'
    return null
  }

  // Category color application effect
  useEffect(() => {
    if (!categoryColors || !sceneObjectsRef.current) {
      return
    }

    meshMapRef.current.forEach((mesh, meshName) => {
      const lowerName = meshName.toLowerCase()
      if (lowerName.includes('plane072')) {
        return
      }

      const category = categorizeMesh(meshName)
      if (!category) return

      let targetColor: string | null = null

      switch (category) {
        case 'hair': targetColor = categoryColors.hair; break
        case 'tops': targetColor = categoryColors.tops.primary; break
        case 'pants': targetColor = categoryColors.pants; break
        case 'dresses': targetColor = categoryColors.dresses; break
        case 'shoes': targetColor = categoryColors.shoes; break
        case 'socks': targetColor = categoryColors.socks; break
        case 'accessories': targetColor = categoryColors.accessories; break
        case 'body': targetColor = categoryColors.body.skinTone; break
      }

      if (targetColor) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach(mat => {
          if (mat && mat instanceof THREE.MeshStandardMaterial) {
            if (mat.userData.isEyeMaterial) {
              return
            }
            if (!mat.map) {
              mat.color.setStyle(targetColor!)
              mat.needsUpdate = true
            }
          }
        })
      }
    })
  }, [categoryColors])

  // Transform effect
  useEffect(() => {
    if (meshMapRef.current.size === 0) return

    // Reset all meshes to their original transforms first
    meshMapRef.current.forEach((mesh, meshName) => {
      const original = originalTransformsRef.current.get(meshName)
      if (original) {
        mesh.position.copy(original.position)
        mesh.rotation.copy(original.rotation)
        mesh.scale.copy(original.scale)
      }
    })

    // Apply custom transforms if they exist
    if (transforms) {
      Object.entries(transforms).forEach(([transformKey, transform]) => {
        meshMapRef.current.forEach((mesh, meshName) => {
          if (meshName === transformKey) {
            const original = originalTransformsRef.current.get(meshName)
            if (original) {
              mesh.position.set(
                original.position.x + transform.position[0],
                original.position.y + transform.position[1],
                original.position.z + transform.position[2]
              )

              mesh.rotation.set(
                original.rotation.x + (transform.rotation[0] * Math.PI) / 180,
                original.rotation.y + (transform.rotation[1] * Math.PI) / 180,
                original.rotation.z + (transform.rotation[2] * Math.PI) / 180
              )

              mesh.scale.set(
                original.scale.x * transform.scale[0],
                original.scale.y * transform.scale[1],
                original.scale.z * transform.scale[2]
              )
            }
          }
        })
      })
    }
  }, [transforms])

  // Asset visibility effect
  useEffect(() => {
    if (meshMapRef.current.size === 0) return

    meshMapRef.current.forEach((mesh, meshName) => {
      const nameLower = meshName.toLowerCase()

      const hasBaseOrBody = nameLower.includes('base') || nameLower.includes('body')
      const isClothing = nameLower.includes('hair') || nameLower.includes('pants') ||
                        nameLower.includes('shirt') || nameLower.includes('top') ||
                        nameLower.includes('shoe') || nameLower.includes('sock')
      const isBaseBody = hasBaseOrBody && !isClothing

      const isClosedMouth = nameLower.includes('mouth') && nameLower.includes('closed')
      const isDefaultVisible = isBaseBody || isClosedMouth

      let isSelected = visibleAssets.includes(meshName)

      if (!isSelected && (meshName === 'Eyes' || meshName === 'Eyes_3' || nameLower.includes('eyes'))) {
        isSelected = visibleAssets.some(asset => asset === 'Eyes' || asset === 'Eyes_3' || asset.toLowerCase().includes('eyes'))
      }

      mesh.visible = isDefaultVisible || isSelected
    })
  }, [visibleAssets])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-90">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
            <p className="mt-4 text-white">Loading model...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-90">
          <div className="text-center text-red-400">
            <div className="text-4xl mb-4">⚠</div>
            <p className="text-lg">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
