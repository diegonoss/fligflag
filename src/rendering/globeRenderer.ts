import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { latLonToVector3, vector3ToLatLon } from '../geo/coordinates'
import type { LatLon, CountryTarget, Difficulty } from '../domain/types'

const DAY_TEXTURE_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_day_4096.jpg'
const NIGHT_TEXTURE_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_night_4096.jpg'
const CLOUDS_TEXTURE_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png'

const DAY_TEXTURE_TINT = 0xd0d0d0
const NIGHT_TEXTURE_TINT = 0xffffff
const CLOUD_RADIUS = 1.006
const CLOUD_OPACITY = 0.15

export class GlobeRenderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private raycaster: THREE.Raycaster
  private earth: THREE.Mesh
  private earthMaterial: THREE.MeshPhongMaterial
  private dayTexture: THREE.Texture
  private nightTexture: THREE.Texture
  private cloudTexture: THREE.Texture
  private clouds: THREE.Mesh
  private onClickCallback?: (latLon: LatLon) => void
  private pointerStart: { x: number; y: number; time: number } | null = null
  private delimiterLines: THREE.LineSegments | null = null
  private answerMarker: THREE.Mesh | null = null
  private handleKeyDownBound: (event: KeyboardEvent) => void = (event) => this.handleKeyDown(event)

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.z = 3

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 1.5
    this.controls.maxDistance = 10
    this.controls.enablePan = false
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    }

    this.raycaster = new THREE.Raycaster()

    const geometry = new THREE.SphereGeometry(1, 128, 64)
    const textureLoader = new THREE.TextureLoader()
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy()

    this.dayTexture = textureLoader.load(DAY_TEXTURE_URL)
    this.dayTexture.colorSpace = THREE.SRGBColorSpace
    this.dayTexture.anisotropy = maxAnisotropy

    this.nightTexture = textureLoader.load(NIGHT_TEXTURE_URL)
    this.nightTexture.colorSpace = THREE.SRGBColorSpace
    this.nightTexture.anisotropy = maxAnisotropy

    this.cloudTexture = textureLoader.load(CLOUDS_TEXTURE_URL)
    this.cloudTexture.colorSpace = THREE.SRGBColorSpace
    this.cloudTexture.anisotropy = maxAnisotropy

    this.earthMaterial = new THREE.MeshPhongMaterial({
      map: this.dayTexture,
      color: DAY_TEXTURE_TINT,
      shininess: 5,
    })
    this.earth = new THREE.Mesh(geometry, this.earthMaterial)
    this.scene.add(this.earth)

    const cloudGeometry = new THREE.SphereGeometry(CLOUD_RADIUS, 128, 64)
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: this.cloudTexture,
      opacity: CLOUD_OPACITY,
      transparent: true,
      depthWrite: false,
    })
    this.clouds = new THREE.Mesh(cloudGeometry, cloudMaterial)
    this.scene.add(this.clouds)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 3, 5)
    this.scene.add(directionalLight)

    window.addEventListener('resize', () => this.handleResize(container))
    this.renderer.domElement.addEventListener('pointerdown', (event: PointerEvent) => this.handlePointerDown(event))
    this.renderer.domElement.addEventListener('pointerup', (event: PointerEvent) => this.handlePointerUp(event, container))
    window.addEventListener('keydown', this.handleKeyDownBound)

    this.animate()
  }

  private handleResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(container.clientWidth, container.clientHeight)
  }

  private handlePointerDown(event: PointerEvent): void {
    if (event.button !== 0) return
    this.pointerStart = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    }
  }

  private handlePointerUp(event: PointerEvent, container: HTMLElement): void {
    if (event.button !== 0) return
    if (!this.pointerStart) return

    const dx = event.clientX - this.pointerStart.x
    const dy = event.clientY - this.pointerStart.y
    const distanceSq = dx * dx + dy * dy
    const elapsed = performance.now() - this.pointerStart.time

    this.pointerStart = null

    if (distanceSq > 25 || elapsed > 500) return

    const rect = container.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / container.clientWidth) * 2 - 1,
      -((event.clientY - rect.top) / container.clientHeight) * 2 + 1
    )

    this.raycaster.setFromCamera(mouse, this.camera)
    const intersects = this.raycaster.intersectObject(this.earth)

    if (intersects.length > 0 && intersects[0]) {
      const point = intersects[0].point
      const latLon = vector3ToLatLon(point)
      if (this.onClickCallback) {
        this.onClickCallback(latLon)
      }
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.code !== 'Space' || event.repeat) return
    const target = event.target as HTMLElement | null
    if (target) {
      const tag = target.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON') return
      if (target.isContentEditable) return
    }
    event.preventDefault()
    this.controls.reset()
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate())
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  public onClick(callback: (latLon: LatLon) => void): void {
    this.onClickCallback = callback
  }

  public getScene(): THREE.Scene {
    return this.scene
  }

  public setDifficulty(difficulty: Difficulty): void {
    if (difficulty === 'hard') {
      this.earthMaterial.map = this.nightTexture
      this.earthMaterial.color.setHex(NIGHT_TEXTURE_TINT)
    } else {
      this.earthMaterial.map = this.dayTexture
      this.earthMaterial.color.setHex(DAY_TEXTURE_TINT)
    }
    this.earthMaterial.needsUpdate = true
  }

  public setCountryDelimiters(targets: CountryTarget[], enabled: boolean): void {
    this.clearDelimitersLines()
    if (!enabled) return

    const vertices: number[] = []
    const borderRadius = 1.003

    for (const target of targets) {
      const geometry = target.geometry.geometry
      const rings = this.extractRings(geometry)
      for (const ring of rings) {
        for (let i = 0; i < ring.length - 1; i++) {
          const coordA = ring[i]
          const coordB = ring[i + 1]
          if (!coordA || coordA.length < 2 || !coordB || coordB.length < 2) continue
          const a = latLonToVector3({ lat: coordA[1]!, lon: coordA[0]! }, borderRadius)
          const b = latLonToVector3({ lat: coordB[1]!, lon: coordB[0]! }, borderRadius)
          vertices.push(a.x, a.y, a.z, b.x, b.y, b.z)
        }
      }
    }

    const bufferGeometry = new THREE.BufferGeometry()
    bufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true })
    this.delimiterLines = new THREE.LineSegments(bufferGeometry, material)
    this.scene.add(this.delimiterLines)
  }

  public showAnswerMarker(latLon: LatLon): void {
    this.clearAnswerMarker()
    const position = latLonToVector3(latLon, 1.01)
    const geometry = new THREE.SphereGeometry(0.02, 16, 16)
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    this.answerMarker = new THREE.Mesh(geometry, material)
    this.answerMarker.position.copy(position)
    this.scene.add(this.answerMarker)
  }

  public clearAnswerMarker(): void {
    if (this.answerMarker) {
      this.scene.remove(this.answerMarker)
      this.answerMarker.geometry.dispose()
      if (this.answerMarker.material instanceof THREE.Material) {
        this.answerMarker.material.dispose()
      }
      this.answerMarker = null
    }
  }

  private clearDelimitersLines(): void {
    if (this.delimiterLines) {
      this.scene.remove(this.delimiterLines)
      this.delimiterLines.geometry.dispose()
      if (this.delimiterLines.material instanceof THREE.Material) {
        this.delimiterLines.material.dispose()
      }
      this.delimiterLines = null
    }
  }

  private extractRings(geometry: GeoJSON.Geometry): number[][][] {
    if (geometry.type === 'Polygon') {
      return geometry.coordinates as number[][][]
    }
    if (geometry.type === 'MultiPolygon') {
      return (geometry.coordinates as number[][][][]).flat()
    }
    return []
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDownBound)
    this.clearAnswerMarker()
    this.clearDelimitersLines()
    if (this.earth.geometry) this.earth.geometry.dispose()
    this.earthMaterial.dispose()
    this.dayTexture.dispose()
    this.nightTexture.dispose()
    this.cloudTexture.dispose()
    this.clouds.geometry.dispose()
    if (this.clouds.material instanceof THREE.Material) {
      this.clouds.material.dispose()
    }
    this.renderer.dispose()
    this.controls.dispose()
  }
}
