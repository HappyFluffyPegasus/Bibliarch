'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export type ToolType = 'select' | 'terrain-raise' | 'terrain-lower' | 'place-building' | 'place-decoration' | 'delete'
export type BuildingType = 'house' | 'shop' | 'tower' | 'barn'
export type DecoType = 'tree' | 'rock' | 'bush' | 'lamp'

export interface WorldObject {
  id: string
  type: 'building' | 'decoration'
  variant: BuildingType | DecoType
  position: [number, number, number]
  rotation: number
  color: string
}

export interface TerrainData {
  heights: number[][]
  size: number
}

interface WorldViewer3DProps {
  tool: ToolType
  buildingType: BuildingType
  decoType: DecoType
  objects: WorldObject[]
  terrain: TerrainData
  onAddObject: (obj: WorldObject) => void
  onDeleteObject: (id: string) => void
  onTerrainChange: (terrain: TerrainData) => void
  onSelectObject: (id: string | null) => void
  selectedObjectId: string | null
}

const BUILDING_COLORS: Record<BuildingType, string> = {
  house: '#E07A5F',
  shop: '#81B29A',
  tower: '#3D405B',
  barn: '#F2CC8F'
}

const DECO_COLORS: Record<DecoType, string> = {
  tree: '#2D6A4F',
  rock: '#6C757D',
  bush: '#40916C',
  lamp: '#FFD166'
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export default function WorldViewer3D({
  tool,
  buildingType,
  decoType,
  objects,
  terrain,
  onAddObject,
  onDeleteObject,
  onTerrainChange,
  onSelectObject,
  selectedObjectId
}: WorldViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const terrainMeshRef = useRef<THREE.Mesh | null>(null)
  const objectMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const isMouseDownRef = useRef(false)

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB) // Sky blue
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(30, 30, 30)
    camera.lookAt(0, 0, 0)
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
    controls.maxPolarAngle = Math.PI / 2.1 // Prevent going below ground
    controls.minDistance = 10
    controls.maxDistance = 100
    controlsRef.current = controls

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 50, 25)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 200
    directionalLight.shadow.camera.left = -50
    directionalLight.shadow.camera.right = 50
    directionalLight.shadow.camera.top = 50
    directionalLight.shadow.camera.bottom = -50
    scene.add(directionalLight)

    // Grid helper
    const gridHelper = new THREE.GridHelper(50, 50, 0x888888, 0xCCCCCC)
    gridHelper.position.y = 0.01
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

  // Create/update terrain
  useEffect(() => {
    if (!sceneRef.current) return

    // Remove old terrain
    if (terrainMeshRef.current) {
      sceneRef.current.remove(terrainMeshRef.current)
      terrainMeshRef.current.geometry.dispose()
      ;(terrainMeshRef.current.material as THREE.Material).dispose()
    }

    const size = terrain.size
    const segments = size - 1

    // Create terrain geometry
    const geometry = new THREE.PlaneGeometry(50, 50, segments, segments)
    geometry.rotateX(-Math.PI / 2)

    // Apply height data
    const positions = geometry.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = Math.floor(i % size)
      const z = Math.floor(i / size)
      if (terrain.heights[z] && terrain.heights[z][x] !== undefined) {
        positions.setY(i, terrain.heights[z][x])
      }
    }
    geometry.computeVertexNormals()

    // Create terrain material
    const material = new THREE.MeshStandardMaterial({
      color: 0x7CB342,
      flatShading: true,
      side: THREE.DoubleSide
    })

    const terrainMesh = new THREE.Mesh(geometry, material)
    terrainMesh.receiveShadow = true
    terrainMesh.name = 'terrain'
    sceneRef.current.add(terrainMesh)
    terrainMeshRef.current = terrainMesh
  }, [terrain])

  // Create/update objects
  useEffect(() => {
    if (!sceneRef.current) return

    const scene = sceneRef.current
    const existingIds = new Set(objects.map(o => o.id))

    // Remove deleted objects
    objectMeshesRef.current.forEach((mesh, id) => {
      if (!existingIds.has(id)) {
        scene.remove(mesh)
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
        objectMeshesRef.current.delete(id)
      }
    })

    // Add/update objects
    objects.forEach(obj => {
      let mesh = objectMeshesRef.current.get(obj.id)

      if (!mesh) {
        // Create new mesh
        let geometry: THREE.BufferGeometry
        let height: number

        if (obj.type === 'building') {
          switch (obj.variant as BuildingType) {
            case 'house':
              geometry = new THREE.BoxGeometry(3, 2.5, 3)
              height = 1.25
              break
            case 'shop':
              geometry = new THREE.BoxGeometry(4, 2, 3)
              height = 1
              break
            case 'tower':
              geometry = new THREE.BoxGeometry(2, 6, 2)
              height = 3
              break
            case 'barn':
              geometry = new THREE.BoxGeometry(5, 3, 4)
              height = 1.5
              break
            default:
              geometry = new THREE.BoxGeometry(2, 2, 2)
              height = 1
          }
        } else {
          switch (obj.variant as DecoType) {
            case 'tree':
              geometry = new THREE.ConeGeometry(1, 3, 8)
              height = 1.5
              break
            case 'rock':
              geometry = new THREE.DodecahedronGeometry(0.8)
              height = 0.4
              break
            case 'bush':
              geometry = new THREE.SphereGeometry(0.8, 8, 6)
              height = 0.4
              break
            case 'lamp':
              geometry = new THREE.CylinderGeometry(0.1, 0.15, 2.5, 8)
              height = 1.25
              break
            default:
              geometry = new THREE.BoxGeometry(1, 1, 1)
              height = 0.5
          }
        }

        const material = new THREE.MeshStandardMaterial({
          color: obj.color,
          flatShading: true
        })

        mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.userData.objectId = obj.id
        mesh.position.set(obj.position[0], obj.position[1] + height, obj.position[2])
        mesh.rotation.y = obj.rotation

        scene.add(mesh)
        objectMeshesRef.current.set(obj.id, mesh)
      }

      // Update selection highlight
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (obj.id === selectedObjectId) {
        mat.emissive = new THREE.Color(0x333333)
      } else {
        mat.emissive = new THREE.Color(0x000000)
      }
    })
  }, [objects, selectedObjectId])

  // Handle mouse interactions
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return

    isMouseDownRef.current = true
    const rect = containerRef.current.getBoundingClientRect()
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)

    if (tool === 'select' || tool === 'delete') {
      // Check for object intersection
      const objectMeshes = Array.from(objectMeshesRef.current.values())
      const intersects = raycasterRef.current.intersectObjects(objectMeshes)

      if (intersects.length > 0) {
        const objectId = intersects[0].object.userData.objectId
        if (tool === 'delete') {
          onDeleteObject(objectId)
        } else {
          onSelectObject(objectId)
        }
        return
      } else if (tool === 'select') {
        onSelectObject(null)
      }
    }

    if (tool === 'place-building' || tool === 'place-decoration') {
      // Check for terrain intersection
      if (terrainMeshRef.current) {
        const intersects = raycasterRef.current.intersectObject(terrainMeshRef.current)
        if (intersects.length > 0) {
          const point = intersects[0].point
          const isBuilding = tool === 'place-building'

          const newObj: WorldObject = {
            id: generateId(),
            type: isBuilding ? 'building' : 'decoration',
            variant: isBuilding ? buildingType : decoType,
            position: [point.x, point.y, point.z],
            rotation: 0,
            color: isBuilding ? BUILDING_COLORS[buildingType] : DECO_COLORS[decoType]
          }

          onAddObject(newObj)
        }
      }
    }

    if (tool === 'terrain-raise' || tool === 'terrain-lower') {
      handleTerrainEdit(e)
    }
  }, [tool, buildingType, decoType, onAddObject, onDeleteObject, onSelectObject])

  const handleTerrainEdit = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !terrainMeshRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
    const intersects = raycasterRef.current.intersectObject(terrainMeshRef.current)

    if (intersects.length > 0) {
      const point = intersects[0].point
      const size = terrain.size
      const cellSize = 50 / (size - 1)

      // Find affected vertices (brush radius)
      const brushRadius = 2
      const newHeights = terrain.heights.map(row => [...row])

      for (let z = 0; z < size; z++) {
        for (let x = 0; x < size; x++) {
          const worldX = (x - (size - 1) / 2) * cellSize
          const worldZ = (z - (size - 1) / 2) * cellSize
          const dist = Math.sqrt(Math.pow(worldX - point.x, 2) + Math.pow(worldZ - point.z, 2))

          if (dist < brushRadius * cellSize) {
            const influence = 1 - (dist / (brushRadius * cellSize))
            const delta = tool === 'terrain-raise' ? 0.3 : -0.3
            newHeights[z][x] += delta * influence
          }
        }
      }

      onTerrainChange({ ...terrain, heights: newHeights })
    }
  }, [tool, terrain, onTerrainChange])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return
    if (tool === 'terrain-raise' || tool === 'terrain-lower') {
      handleTerrainEdit(e)
    }
  }, [tool, handleTerrainEdit])

  const handleMouseUp = useCallback(() => {
    isMouseDownRef.current = false
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
