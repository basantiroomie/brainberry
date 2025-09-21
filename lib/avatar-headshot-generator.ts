import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export class AvatarHeadshotGenerator {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private loader: GLTFLoader

  constructor() {
    // Create scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xf0f0f0)

    // Create camera positioned for headshot
    this.camera = new THREE.PerspectiveCamera(25, 1, 0.1, 1000)
    this.camera.position.set(0, 1.65, 0.8) // Focus on head area
    this.camera.lookAt(0, 1.65, 0)

    // Create renderer (offscreen)
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: true 
    })
    this.renderer.setSize(512, 512) // High quality headshot
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Create loader
    this.loader = new GLTFLoader()

    // Add lighting for good headshot quality
    this.setupLighting()
  }

  private setupLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    // Key light (main light on face)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)
    keyLight.position.set(2, 3, 2)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    this.scene.add(keyLight)

    // Fill light (softer light to reduce shadows)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-1, 2, 1)
    this.scene.add(fillLight)

    // Rim light (back light for depth)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2)
    rimLight.position.set(0, 2, -2)
    this.scene.add(rimLight)
  }

  /**
   * Generate a headshot from a Ready Player Me GLB URL
   */
  async generateHeadshot(glbUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate URL first
      if (!glbUrl || typeof glbUrl !== 'string') {
        reject(new Error('Invalid GLB URL provided'))
        return
      }

      // Set a timeout for the operation
      const timeout = setTimeout(() => {
        reject(new Error('Headshot generation timeout'))
      }, 30000) // 30 second timeout

      try {
        // Clear previous models
        const objectsToRemove = this.scene.children.filter(child => 
          child.type === 'Group' || child.type === 'Mesh'
        )
        objectsToRemove.forEach(obj => this.scene.remove(obj))

        this.loader.load(
          glbUrl,
          (gltf) => {
            try {
              clearTimeout(timeout)
              
              if (!gltf || !gltf.scene) {
                reject(new Error('Invalid GLB file - no scene found'))
                return
              }

              const model = gltf.scene
              
              // Scale and position the model
              model.scale.setScalar(1)
              model.position.set(0, 0, 0)
              
              // Add model to scene
              this.scene.add(model)

              // Wait a frame for the model to be properly positioned
              requestAnimationFrame(() => {
                try {
                  // Render the scene
                  this.renderer.render(this.scene, this.camera)
                  
                  // Get the canvas and convert to data URL
                  const canvas = this.renderer.domElement
                  if (!canvas) {
                    reject(new Error('Renderer canvas not available'))
                    return
                  }

                  const dataUrl = canvas.toDataURL('image/png', 0.9)
                  
                  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
                    reject(new Error('Failed to generate valid image data'))
                    return
                  }
                  
                  console.log('Headshot generated successfully from:', glbUrl)
                  resolve(dataUrl)
                } catch (error) {
                  console.error('Error rendering headshot:', error)
                  reject(error)
                }
              })
            } catch (error) {
              clearTimeout(timeout)
              console.error('Error processing loaded model:', error)
              reject(error)
            }
          },
          (progress) => {
            if (progress.total > 0) {
              console.log('Loading avatar for headshot:', Math.round(progress.loaded / progress.total * 100) + '%')
            }
          },
          (error) => {
            clearTimeout(timeout)
            console.error('Error loading avatar for headshot:', error)
            reject(new Error(`Failed to load GLB file: ${(error as Error)?.message || error}`))
          }
        )
      } catch (error) {
        clearTimeout(timeout)
        console.error('Error in generateHeadshot:', error)
        reject(error)
      }
    })
  }

  /**
   * Generate multiple headshot angles
   */
  async generateMultipleHeadshots(glbUrl: string): Promise<{
    front: string
    profile: string
    threeFourths: string
  }> {
    const headshots = {
      front: '',
      profile: '',
      threeFourths: ''
    }

    // Front view
    this.camera.position.set(0, 1.65, 0.8)
    this.camera.lookAt(0, 1.65, 0)
    headshots.front = await this.generateHeadshot(glbUrl)

    // Profile view (side)
    this.camera.position.set(0.8, 1.65, 0)
    this.camera.lookAt(0, 1.65, 0)
    headshots.profile = await this.generateHeadshot(glbUrl)

    // Three-quarters view
    this.camera.position.set(0.6, 1.65, 0.6)
    this.camera.lookAt(0, 1.65, 0)
    headshots.threeFourths = await this.generateHeadshot(glbUrl)

    // Reset to front view
    this.camera.position.set(0, 1.65, 0.8)
    this.camera.lookAt(0, 1.65, 0)

    return headshots
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.renderer.dispose()
    this.scene.clear()
  }
}

// Singleton instance for reuse
let headshotGenerator: AvatarHeadshotGenerator | null = null

export function getHeadshotGenerator(): AvatarHeadshotGenerator {
  if (!headshotGenerator) {
    headshotGenerator = new AvatarHeadshotGenerator()
  }
  return headshotGenerator
}

export function resetHeadshotGenerator() {
  if (headshotGenerator) {
    headshotGenerator.dispose()
    headshotGenerator = null
  }
}