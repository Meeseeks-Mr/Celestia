import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import useStore from '../../store/useStore'

// Convention: lat=0, lon=0 → (0, 0, +R), Greenwich faces +Z
export function latLonToVec3(lat, lon, r = 1.0) {
  const latRad = lat * Math.PI / 180
  const lonRad = lon * Math.PI / 180
  const cosLat = Math.cos(latRad)
  return new THREE.Vector3(
    r * cosLat * Math.sin(lonRad),
    r * Math.sin(latRad),
    r * cosLat * Math.cos(lonRad),
  )
}

export function vec3ToLatLon(v) {
  const r = v.length() || 1
  const lat = Math.asin(Math.max(-1, Math.min(1, v.y / r))) * 180 / Math.PI
  const lon = Math.atan2(v.x, v.z) * 180 / Math.PI
  return { lat, lon }
}

export default function Observer() {
  const observerLat = useStore((s) => s.observerLat)
  const observerLon = useStore((s) => s.observerLon)
  const observerLocationLabel = useStore((s) => s.observerLocationLabel)
  const showLabels = useStore((s) => s.showLabels)

  const pos = useMemo(() => latLonToVec3(observerLat, observerLon, 1.024), [observerLat, observerLon])

  const ringPts = useMemo(() => {
    const pts = []
    const r = 0.06
    for (let i = 0; i <= 64; i++) {
      const a = (2 * Math.PI * i) / 64
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r))
    }
    return pts
  }, [])

  const ringQuat = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0)
    const normal = pos.clone().normalize()
    return new THREE.Quaternion().setFromUnitVectors(up, normal)
  }, [pos])

  const ringGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(ringPts), [ringPts])

  return (
    <group>
      {/* Stem extending into Earth */}
      <mesh position={pos.clone().multiplyScalar(0.985)} raycast={() => null}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshBasicMaterial color="#00E5FF" />
      </mesh>

      {/* Glow halo */}
      <mesh position={pos} raycast={() => null}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.32} depthWrite={false} />
      </mesh>

      {/* Bright core (raycast disabled — no drag interaction) */}
      <mesh position={pos} raycast={() => null}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>

      {/* Tangent ring */}
      <group position={pos} quaternion={ringQuat}>
        <line geometry={ringGeo}>
          <lineBasicMaterial color="#00E5FF" transparent opacity={0.7} />
        </line>
      </group>

      {/* Subtle observer label — always reads "Observer" regardless of location */}
      {showLabels && (
        <Html
          center
          zIndexRange={[5, 0]}
          style={{ pointerEvents: 'none' }}
          position={pos.clone().multiplyScalar(1.14).toArray()}
        >
          <div style={{
            color: '#9DC8E0',
            fontFamily: '"Inter", sans-serif',
            fontSize: 9.5,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            textShadow: '0 0 5px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.8)',
            letterSpacing: 0.2,
            opacity: 0.88,
            userSelect: 'none',
          }}>
            Observer
          </div>
        </Html>
      )}
    </group>
  )
}
