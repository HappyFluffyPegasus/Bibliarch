'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface SceneCharacter {
  id: string
  characterId: string
  name: string
  color: string
  position: [number, number, number]
  rotation: number
}

export interface DialogueLine {
  id: string
  characterId: string
  characterName: string
  text: string
  startTime: number
  duration: number
}

interface SceneViewer3DProps {
  characters: SceneCharacter[]
  selectedCharacterId: string | null
  onSelectCharacter: (id: string | null) => void
  onMoveCharacter: (id: string, position: [number, number, number]) => void
  isPlaying: boolean
  currentTime: number
}

export default function SceneViewer3D({
  characters,
  selectedCharacterId,
  onSelectCharacter,
  onMoveCharacter,
  isPlaying,
  currentTime
}: SceneViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const characterMeshesRef = useRef<Map<string, THREE.Group>>(new Map())
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const floorRef = useRef<THREE.Mesh | null>(null)
  const isDraggingRef = useRef(false)
  const draggedCharacterRef = useRef<string | null>(null)
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e) // Dark blue-ish background
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(0, 8, 12)
    camera.lookAt(0, 1, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2.1
    controls.minDistance = 5
    controls.maxDistance = 30
    controls.target.set(0, 1, 0)
    controlsRef.current = controls

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
    mainLight.position.set(10, 20, 10)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 100
    mainLight.shadow.camera.left = -20
    mainLight.shadow.camera.right = 20
    mainLight.shadow.camera.top = 20
    mainLight.shadow.camera.bottom = -20
    scene.add(mainLight)

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3)
    fillLight.position.set(-10, 10, -10)
    scene.add(fillLight)

    // Create stage floor
    const floorGeometry = new THREE.CircleGeometry(10, 64)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d2d44,
      roughness: 0.8,
      metalness: 0.2
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    floor.name = 'floor'
    scene.add(floor)
    floorRef.current = floor

    // Add stage edge glow
    const ringGeometry = new THREE.RingGeometry(9.8, 10, 64)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.01
    scene.add(ring)

    // Grid helper on floor
    const gridHelper = new THREE.GridHelper(20, 20, 0x444466, 0x333355)
    gridHelper.position.y = 0.02
    scene.add(gridHelper)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  // Create/update character meshes
  useEffect(() => {
    if (!sceneRef.current) return

    const scene = sceneRef.current
    const existingIds = new Set(characters.map(c => c.id))

    // Remove deleted characters
    characterMeshesRef.current.forEach((group, id) => {
      if (!existingIds.has(id)) {
        scene.remove(group)
        group.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose()
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => m.dispose())
            } else {
              obj.material.dispose()
            }
          }
        })
        characterMeshesRef.current.delete(id)
      }
    })

    // Add/update characters
    characters.forEach(char => {
      let group = characterMeshesRef.current.get(char.id)

      if (!group) {
        // Create character placeholder (humanoid shape)
        group = new THREE.Group()
        group.userData.characterId = char.id

        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.8, 8, 16)
        const bodyMaterial = new THREE.MeshStandardMaterial({
          color: char.color,
          roughness: 0.7,
          metalness: 0.1
        })
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
        body.position.y = 0.9
        body.castShadow = true
        body.receiveShadow = true
        group.add(body)

        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16)
        const headMaterial = new THREE.MeshStandardMaterial({
          color: '#FFD5C2',
          roughness: 0.8,
          metalness: 0
        })
        const head = new THREE.Mesh(headGeometry, headMaterial)
        head.position.y = 1.65
        head.castShadow = true
        group.add(head)

        // Name label (sprite)
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 64
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, 256, 64)
        ctx.fillStyle = 'white'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(char.name.slice(0, 15), 128, 32)

        const texture = new THREE.CanvasTexture(canvas)
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
        const sprite = new THREE.Sprite(spriteMaterial)
        sprite.position.y = 2.2
        sprite.scale.set(1.5, 0.4, 1)
        group.add(sprite)

        scene.add(group)
        characterMeshesRef.current.set(char.id, group)
      }

      // Update position and rotation
      group.position.set(char.position[0], char.position[1], char.position[2])
      group.rotation.y = char.rotation

      // Update selection highlight
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj !== floorRef.current) {
          const mat = obj.material as THREE.MeshStandardMaterial
          if (char.id === selectedCharacterId) {
            mat.emissive = new THREE.Color(0x333333)
          } else {
            mat.emissive = new THREE.Color(0x000000)
          }
        }
      })
    })
  }, [characters, selectedCharacterId])

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return
    if (isPlaying) return // Don't allow interaction during playback

    const rect = containerRef.current.getBoundingClientRect()
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)

    // Check for character intersection
    const characterGroups = Array.from(characterMeshesRef.current.values())
    const allMeshes: THREE.Mesh[] = []
    characterGroups.forEach(group => {
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          allMeshes.push(obj)
        }
      })
    })

    const intersects = raycasterRef.current.intersectObjects(allMeshes)

    if (intersects.length > 0) {
      // Find parent group
      let parent = intersects[0].object.parent
      while (parent && !parent.userData.characterId) {
        parent = parent.parent
      }

      if (parent?.userData.characterId) {
        onSelectCharacter(parent.userData.characterId)
        isDraggingRef.current = true
        draggedCharacterRef.current = parent.userData.characterId

        // Disable orbit controls while dragging
        if (controlsRef.current) {
          controlsRef.current.enabled = false
        }
        return
      }
    }

    // Click on empty space - deselect
    onSelectCharacter(null)
  }, [onSelectCharacter, isPlaying])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || !draggedCharacterRef.current) return
    if (!containerRef.current || !cameraRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)

    // Intersect with drag plane (y = 0)
    const intersection = new THREE.Vector3()
    raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersection)

    if (intersection) {
      // Clamp to stage bounds
      const maxDist = 9
      const dist = Math.sqrt(intersection.x * intersection.x + intersection.z * intersection.z)
      if (dist > maxDist) {
        intersection.x *= maxDist / dist
        intersection.z *= maxDist / dist
      }

      onMoveCharacter(draggedCharacterRef.current, [intersection.x, 0, intersection.z])
    }
  }, [onMoveCharacter])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
    draggedCharacterRef.current = null

    // Re-enable orbit controls
    if (controlsRef.current) {
      controlsRef.current.enabled = true
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  )
}
