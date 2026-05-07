import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import useStore from '../../store/useStore'

const R = 4.0

function SphereLine({ points, color, opacity = 1 }) {
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])
  return (
    <line geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  )
}

export default function CelestialSphere() {
  const selectedConcept = useStore((s) => s.selectedConcept)
  const showLabels = useStore((s) => s.showLabels)

  const isActive = selectedConcept === 'celestial-sphere'
  const opacity = isActive ? 0.18 : 0.07
  const lineColor = isActive ? '#B8A8FF' : '#8B7CF8'

  const meridianLines = useMemo(() => {
    const lines = []
    for (let lon = 0; lon < 180; lon += 30) {
      const pts = []
      for (let i = 0; i <= 64; i++) {
        const lat = -90 + (180 * i) / 64
        const phi = (90 - lat) * (Math.PI / 180)
        const theta = lon * (Math.PI / 180)
        pts.push(new THREE.Vector3(
          -Math.sin(phi) * Math.cos(theta) * R,
          Math.cos(phi) * R,
          Math.sin(phi) * Math.sin(theta) * R
        ))
      }
      lines.push(pts)
    }
    return lines
  }, [])

  const parallelLines = useMemo(() => {
    const lines = []
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts = []
      const phi = (90 - lat) * (Math.PI / 180)
      for (let i = 0; i <= 64; i++) {
        const theta = (360 * i / 64) * (Math.PI / 180)
        pts.push(new THREE.Vector3(
          -Math.sin(phi) * Math.cos(theta) * R,
          Math.cos(phi) * R,
          Math.sin(phi) * Math.sin(theta) * R
        ))
      }
      lines.push(pts)
    }
    return lines
  }, [])

  return (
    <group>
      <mesh>
        <sphereGeometry args={[R, 32, 32]} />
        <meshBasicMaterial color="#8B7CF8" transparent opacity={opacity} wireframe side={THREE.BackSide} />
      </mesh>

      {meridianLines.map((pts, i) => (
        <SphereLine key={`mer-${i}`} points={pts} color={lineColor} opacity={opacity * 1.5} />
      ))}
      {parallelLines.map((pts, i) => (
        <SphereLine key={`par-${i}`} points={pts} color={lineColor} opacity={opacity * 1.5} />
      ))}

      {isActive && (
        <mesh>
          <sphereGeometry args={[R + 0.05, 32, 32]} />
          <meshBasicMaterial color="#8B7CF8" transparent opacity={0.03} side={THREE.FrontSide} />
        </mesh>
      )}

      {showLabels && isActive && (
        <Html position={[0, R + 0.3, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(139,124,248,0.5)',
            color: '#B8A8FF',
            padding: '4px 10px', borderRadius: 4,
            fontFamily: '"Inter", sans-serif',
            fontSize: 11, fontWeight: 600, letterSpacing: 1, whiteSpace: 'nowrap',
          }}>
            CELESTIAL SPHERE — Radius: Infinite (shown 4× Earth)
          </div>
        </Html>
      )}
    </group>
  )
}
