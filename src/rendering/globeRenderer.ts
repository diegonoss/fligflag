import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { latLonToVector3, vector3ToLatLon } from '../geo/coordinates'
import type { LatLon, CountryTarget } from '../domain/types'

export class GlobeRenderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private raycaster: THREE.Raycaster
  private earth: THREE.Mesh
  private onClickCallback?: (latLon: LatLon) => void
  private pointerStart: { x: number; y: number; time: number } | null = null
  private delimiterLines: THREE.LineSegments | null = null
  private answerMarker: THREE.Mesh | null = null

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

    this.raycaster = new THREE.Raycaster()

    const geometry = new THREE.SphereGeometry(1, 128, 64)
    const textureLoader = new THREE.TextureLoader()
    const texture = textureLoader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg'
    )
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 5,
    })
    this.earth = new THREE.Mesh(geometry, material)
    this.scene.add(this.earth)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 3, 5)
    this.scene.add(directionalLight)

    window.addEventListener('resize', () => this.handleResize(container))
    this.renderer.domElement.addEventListener('pointerdown', (event: PointerEvent) => this.handlePointerDown(event))
    this.renderer.domElement.addEventListener('pointerup', (event: PointerEvent) => this.handlePointerUp(event, container))

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
    this.clearAnswerMarker()
    this.clearDelimitersLines()
    if (this.earth.geometry) this.earth.geometry.dispose()
    const earthMaterial = this.earth.material
    if (earthMaterial instanceof THREE.MeshPhongMaterial) {
      if (earthMaterial.map) earthMaterial.map.dispose()
      earthMaterial.dispose()
    }
    this.renderer.dispose()
    this.controls.dispose()
  }
}
