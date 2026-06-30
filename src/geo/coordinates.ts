import * as THREE from 'three'
import type { LatLon } from '../domain/types'

const GLOBE_RADIUS = 1

export function latLonToVector3(latLon: LatLon, radius: number = GLOBE_RADIUS): THREE.Vector3 {
  const phi = (90 - latLon.lat) * (Math.PI / 180)
  const theta = (latLon.lon + 180) * (Math.PI / 180)

  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return new THREE.Vector3(x, y, z)
}

export function vector3ToLatLon(vector: THREE.Vector3): LatLon {
  const radius = vector.length()
  const phi = Math.acos(vector.y / radius)
  const theta = Math.atan2(vector.z, -vector.x)

  const lat = 90 - (phi * 180) / Math.PI
  const lon = (theta * 180) / Math.PI - 180

  return { lat, lon }
}
