import * as THREE from 'three'

export class Starfield {
  private stars: THREE.Points
  private reducedMotion: boolean

  constructor(scene: THREE.Scene) {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const geometry = new THREE.BufferGeometry()
    const vertices = []

    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000
      const y = (Math.random() - 0.5) * 2000
      const z = (Math.random() - 0.5) * 2000
      vertices.push(x, y, z)
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      sizeAttenuation: true,
    })

    this.stars = new THREE.Points(geometry, material)
    scene.add(this.stars)

    if (!this.reducedMotion) {
      this.animate()
    }
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate())
    this.stars.rotation.y += 0.0001
  }

  public dispose(): void {
    this.stars.geometry.dispose()
    if (this.stars.material instanceof THREE.Material) {
      this.stars.material.dispose()
    }
  }
}
