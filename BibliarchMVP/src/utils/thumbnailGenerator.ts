import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

class ThumbnailGenerator {
  private scene: THREE.Scene | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private renderer: THREE.WebGLRenderer | null = null
  private canvas: HTMLCanvasElement | null = null
  private thumbnailCache: Map<string, string> = new Map()
  private modelLoaded: Promise<THREE.Group> | null = null
  private meshMap: Map<string, THREE.Mesh> = new Map()
  private modelGroup: THREE.Group | null = null
  private readonly CACHE_VERSION = 'v27'
  private initialized = false

  private init() {
    if (this.initialized || typeof window === 'undefined') return

    // Create offscreen canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = 256
    this.canvas.height = 256

    // Scene setup
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xf5f5f5)

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    this.camera.position.set(0, 0, 4)
    this.camera.lookAt(0, 0, 0)

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    })
    this.renderer.setSize(256, 256)
    this.renderer.setPixelRatio(1)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    this.scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight1.position.set(2, 2, 2)
    this.scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3)
    directionalLight2.position.set(-2, -1, -2)
    this.scene.add(directionalLight2)

    // Load model once
    this.modelLoaded = this.loadModel()
    this.initialized = true
  }

  private async loadModel(): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader()
      loader.load(
        '/models/Neighbor Base V16.glb',
        (gltf) => {
          this.modelGroup = gltf.scene
          gltf.scene.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              const meshName = node.name || 'unnamed_mesh'
              this.meshMap.set(meshName, node)
            }
          })
          console.log(`Thumbnail generator loaded model with ${this.meshMap.size} meshes`)
          resolve(gltf.scene)
        },
        undefined,
        reject
      )
    })
  }

  private isBaseMesh(meshName: string): boolean {
    const lower = meshName.toLowerCase()
    return lower === 'body' ||
           lower === 'plane072' ||
           (lower.includes('eye') && !lower.includes('brow'))
  }

  private categorizeItem(meshName: string): 'hair' | 'face' | 'top' | 'dress' | 'bottom' | 'shoes' | 'accessory' | 'other' {
    const lower = meshName.toLowerCase()

    if (lower.includes('plane072') || lower.includes('eye')) return 'face'
    if (lower.includes('eyebrow') || lower.includes('brow')) return 'face'
    if (lower.includes('mouth')) return 'face'
    if (lower.includes('glasses')) return 'face'

    if (lower.includes('hair') || lower.includes('pigtail') || lower.includes('ponytail') ||
        lower.includes('bob') || lower.includes('bangs') || lower.includes('bun') || lower.includes('braids')) return 'hair'

    if (lower.includes('shirt') || lower.includes('tee') || lower.includes('polo') ||
        lower.includes('sweater') || lower.includes('jacket') || lower.includes('tank') ||
        lower.includes('top') || lower.includes('plane023')) return 'top'

    if (lower.includes('dress')) return 'dress'

    if (lower.includes('pants') || lower.includes('jeans') || lower.includes('short') ||
        lower.includes('skirt')) return 'bottom'

    if (lower.includes('shoe') || lower.includes('boot') || lower.includes('loafer') ||
        lower.includes('sneaker') || lower.includes('mary') || lower.includes('jane')) return 'shoes'

    if (lower.includes('sock') || lower.includes('tight') || lower.includes('stocking') ||
        lower.includes('warmer') || lower.includes('hat') || lower.includes('wing')) return 'accessory'

    return 'other'
  }

  async generateThumbnail(meshName: string, color: string): Promise<string> {
    this.init()

    if (!this.scene || !this.camera || !this.renderer || !this.canvas) {
      return this.createPlaceholder(meshName, color)
    }

    const cacheKey = `${this.CACHE_VERSION}_${meshName}_${color}`

    if (this.thumbnailCache.has(cacheKey)) {
      return this.thumbnailCache.get(cacheKey)!
    }

    await this.modelLoaded

    if (!this.modelGroup) {
      console.warn('Model not loaded')
      return this.createPlaceholder(meshName, color)
    }

    const originalMesh = this.meshMap.get(meshName)
    if (!originalMesh) {
      console.warn(`Mesh ${meshName} not found`)
      return this.createPlaceholder(meshName, color)
    }

    const modelClone = this.modelGroup.clone(true)

    modelClone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        const nodeMeshName = node.name || 'unnamed_mesh'

        if (nodeMeshName === meshName) {
          const materials = Array.isArray(node.material) ? node.material : [node.material]
          materials.forEach(mat => {
            if (mat && mat instanceof THREE.MeshStandardMaterial) {
              const clonedMat = mat.clone()
              if (!clonedMat.map) {
                clonedMat.color.setStyle(color)
              }
              node.material = clonedMat
            }
          })
          node.visible = true
        }
        else if (this.isBaseMesh(nodeMeshName)) {
          node.visible = true
        }
        else {
          node.visible = false
        }
      }
    })

    // Clear scene (keep lights)
    while (this.scene.children.length > 2) {
      this.scene.remove(this.scene.children[2])
    }

    this.scene.add(modelClone)
    modelClone.position.set(0, 0, 0)

    const itemType = this.categorizeItem(meshName)
    let lookAtPoint = new THREE.Vector3(0, 0, 0)

    switch (itemType) {
      case 'hair':
        this.camera.position.set(0.8, 1.7, 2.4)
        this.camera.fov = 32
        modelClone.rotation.y = Math.PI / 6
        modelClone.rotation.x = 0
        lookAtPoint.set(0, 1.7, 0)
        break

      case 'face':
        this.camera.position.set(0, 1.4, 1.3)
        this.camera.fov = 28
        modelClone.rotation.y = 0
        modelClone.rotation.x = 0
        lookAtPoint.set(0, 1.4, 0)
        break

      case 'top':
        this.camera.position.set(0.8, 1.2, 2.2)
        this.camera.fov = 28
        modelClone.rotation.y = Math.PI / 6
        modelClone.rotation.x = 0
        lookAtPoint.set(0, 1.2, 0)
        break

      case 'dress':
        this.camera.position.set(0.8, 0.9, 2.8)
        this.camera.fov = 32
        modelClone.rotation.y = Math.PI / 6
        modelClone.rotation.x = 0
        lookAtPoint.set(0, 0.9, 0)
        break

      case 'bottom':
        this.camera.position.set(0.8, 0.6, 2.6)
        this.camera.fov = 34
        modelClone.rotation.y = Math.PI / 6
        modelClone.rotation.x = 0
        lookAtPoint.set(0, 0.6, 0)
        break

      case 'shoes':
        this.camera.position.set(0.8, 0.1, 2.2)
        this.camera.fov = 32
        modelClone.rotation.y = Math.PI / 6
        modelClone.rotation.x = 0
        lookAtPoint.set(0, 0.1, 0)
        break

      case 'accessory':
        const lower = meshName.toLowerCase()
        if (lower.includes('sock') || lower.includes('tight') || lower.includes('stocking')) {
          this.camera.position.set(0.8, 0.6, 2.6)
          this.camera.fov = 34
          modelClone.rotation.y = Math.PI / 6
          modelClone.rotation.x = 0
          lookAtPoint.set(0, 0.6, 0)
        } else {
          this.camera.position.set(0.8, 1.0, 2.5)
          this.camera.fov = 33
          modelClone.rotation.y = Math.PI / 6
          modelClone.rotation.x = 0
          lookAtPoint.set(0, 1.0, 0)
        }
        break

      default:
        this.camera.position.set(0.8, 0.9, 2.5)
        this.camera.fov = 35
        modelClone.rotation.y = Math.PI / 6
        modelClone.rotation.x = 0
        lookAtPoint.set(0, 0.9, 0)
        break
    }

    this.camera.updateProjectionMatrix()
    this.camera.lookAt(lookAtPoint)

    this.renderer.render(this.scene, this.camera)

    const dataURL = this.canvas.toDataURL('image/png')

    this.thumbnailCache.set(cacheKey, dataURL)

    this.scene.remove(modelClone)

    return dataURL
  }

  private createPlaceholder(meshName: string, color: string): string {
    if (typeof document === 'undefined') {
      return ''
    }

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = color
    ctx.fillRect(0, 0, 256, 256)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(meshName, 128, 128)

    return canvas.toDataURL('image/png')
  }

  clearCache() {
    this.thumbnailCache.clear()
  }
}

// Singleton instance
export const thumbnailGenerator = new ThumbnailGenerator()
