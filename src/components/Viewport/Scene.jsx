import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import Earth from './Earth'
import CelestialSphere from './CelestialSphere'
import Observer from './Observer'
import ConceptOverlay from './ConceptOverlay'
import useStore from '../../store/useStore'
import { latLonToVec3 } from './Observer'

const R_SKY = 4.0

function PolarAxis() {
  const pts = useMemo(() => [
    new THREE.Vector3(0, -1.45, 0),
    new THREE.Vector3(0, 1.45, 0),
  ], [])
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts])
  return (
    <group>
      <line geometry={geo}>
        <lineBasicMaterial color="#FFB830" transparent opacity={0.4} />
      </line>
      <Html position={[0, 1.55, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          color: '#FFB830', fontSize: 9, fontWeight: 600,
          fontFamily: '"Inter", sans-serif',
          textShadow: '0 0 4px rgba(0,0,0,1), 0 0 2px #FFB830',
          letterSpacing: 0.5, opacity: 0.85, userSelect: 'none',
        }}>N</div>
      </Html>
      <Html position={[0, -1.55, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          color: '#FFB830', fontSize: 9, fontWeight: 600,
          fontFamily: '"Inter", sans-serif',
          textShadow: '0 0 4px rgba(0,0,0,1), 0 0 2px #FFB830',
          letterSpacing: 0.5, opacity: 0.85, userSelect: 'none',
        }}>S</div>
      </Html>
    </group>
  )
}

// Always-visible subtle horizon ring at the observer's location
function ObserverHorizonAlways() {
  const obsLat = useStore((s) => s.observerLat)
  const obsLon = useStore((s) => s.observerLon)
  const showLabels = useStore((s) => s.showLabels)

  const { pts, labelPos } = useMemo(() => {
    const up = latLonToVec3(obsLat, obsLon, 1).normalize()
    const worldUp = new THREE.Vector3(0, 1, 0)
    let east = new THREE.Vector3().crossVectors(worldUp, up).normalize()
    if (east.lengthSq() < 1e-6) east.set(1, 0, 0)
    const north = new THREE.Vector3().crossVectors(up, east).normalize()
    const out = []
    for (let i = 0; i <= 128; i++) {
      const a = (2 * Math.PI * i) / 128
      out.push(east.clone().multiplyScalar(Math.cos(a) * R_SKY).add(north.clone().multiplyScalar(Math.sin(a) * R_SKY)))
    }
    // Place the "Horizon" label between east and north on the ring (NE-ish direction),
    // slightly outside the sphere so it sits clear of cardinals or other labels.
    const lp = east.clone().add(north).normalize().multiplyScalar(R_SKY + 0.3)
    return { pts: out, labelPos: lp }
  }, [obsLat, obsLon])

  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts])

  return (
    <group>
      <line geometry={geo}>
        <lineBasicMaterial color="#5fb6ff" transparent opacity={0.22} />
      </line>
      {showLabels && (
        <Html position={labelPos} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            color: '#5fb6ff',
            fontFamily: '"Inter", sans-serif',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: 0.3,
            textShadow: '0 0 5px rgba(0,0,0,1), 0 0 2px rgba(0,0,0,0.8)',
            opacity: 0.75,
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}>
            Horizon
          </div>
        </Html>
      )}
    </group>
  )
}

export default function Scene() {
  const isPaused = useStore((s) => s.isPaused)
  const animationSpeed = useStore((s) => s.animationSpeed)
  const earthRotation = useStore((s) => s.earthRotation)
  const earthGroupRef = useRef()
  const timeRef = useRef(0)
  const lastUpdateRef = useRef(0)

  useFrame((_, delta) => {
    if (isPaused) return
    timeRef.current += delta * animationSpeed

    if (earthRotation && earthGroupRef.current) {
      earthGroupRef.current.rotation.y += delta * 0.04 * animationSpeed
    }

    if (timeRef.current - lastUpdateRef.current < 0.25) return
    lastUpdateRef.current = timeRef.current

    const ghaSun = (187.56 + timeRef.current * 0.5) % 360
    const decSun = 14.37 + Math.sin(timeRef.current * 0.005) * 1.5
    const obsLat = useStore.getState().observerLat
    const obsLon = useStore.getState().observerLon
    const lha = ((ghaSun - obsLon) + 360) % 360

    const latR = obsLat * Math.PI / 180
    const decR = decSun * Math.PI / 180
    const lhaR = lha * Math.PI / 180
    const altSun = Math.asin(
      Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(lhaR)
    ) * 180 / Math.PI
    const azCos = (Math.sin(decR) - Math.sin(latR) * Math.sin(altSun * Math.PI / 180)) /
                  (Math.cos(latR) * Math.cos(altSun * Math.PI / 180))
    let azSun = Math.acos(Math.max(-1, Math.min(1, azCos))) * 180 / Math.PI
    if (Math.sin(lhaR) > 0) azSun = 360 - azSun

    useStore.getState().updateLiveValues({ ghaSun, decSun, lhaSun: lha, altSun, azSun })
  })

  return (
    <group>
      {/* Lighting — directional sun for day/night, ambient softens night side */}
      <ambientLight color="#5a7090" intensity={0.55} />
      <directionalLight
        position={[6, 2.2, 4.5]}
        intensity={1.35}
        color="#FFF6DC"
        castShadow={false}
      />

      {/* Earth */}
      <group ref={earthGroupRef}>
        <Earth />
      </group>

      {/* Celestial sphere (always world-fixed) */}
      <CelestialSphere />

      {/* Polar axis (always visible) */}
      <PolarAxis />

      {/* Observer's horizon — always visible, very subtle */}
      <ObserverHorizonAlways />

      {/* Observer */}
      <Observer />

      {/* Concept-specific overlays */}
      <ConceptOverlay />
    </group>
  )
}
