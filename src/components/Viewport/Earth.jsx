import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import useStore from '../../store/useStore'
import { vec3ToLatLon } from './Observer'

function configEarthTexture(t) {
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.ClampToEdgeWrapping
  t.offset.x = 0.25
  t.needsUpdate = true
  return t
}

export default function Earth() {
  const cloudsRef = useRef()
  const selectedConcept = useStore((s) => s.selectedConcept)
  const showLabels = useStore((s) => s.showLabels)
  const setPendingObserverMove = useStore((s) => s.setPendingObserverMove)

  const [textures, setTextures] = useState(null)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    let cancelled = false
    // Use Vite's BASE_URL so texture paths resolve correctly under
    // GitHub Pages subpaths (e.g. /celestia/) as well as local dev (/).
    const base = import.meta.env.BASE_URL || '/'
    const url = (p) => (base.endsWith('/') ? base : base + '/') + p
    Promise.all([
      new Promise((res) => loader.load(url('textures/earth_day.jpg'), res, undefined, () => res(null))),
      new Promise((res) => loader.load(url('textures/earth_normal.jpg'), res, undefined, () => res(null))),
      new Promise((res) => loader.load(url('textures/earth_specular.jpg'), res, undefined, () => res(null))),
      new Promise((res) => loader.load(url('textures/earth_clouds.png'), res, undefined, () => res(null))),
    ]).then(([day, normal, spec, clouds]) => {
      if (cancelled) return
      ;[day, normal, spec, clouds].forEach((t) => { if (t) configEarthTexture(t) })
      setTextures({ day, normal, spec, clouds })
    })
    return () => { cancelled = true }
  }, [])

  // Slowly drift clouds
  useFrame((_, delta) => {
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.006
  })

  const isEarthActive = selectedConcept === 'earth'

  // PhongMaterial — responds to lights so day/night terminator shows.
  // emissiveMap with day texture at low intensity keeps the night side visible
  // (dim, not pitch black).
  const earthMaterial = useMemo(() => {
    if (textures?.day) {
      return new THREE.MeshPhongMaterial({
        map: textures.day,
        normalMap: textures.normal || null,
        normalScale: textures.normal ? new THREE.Vector2(0.45, 0.45) : undefined,
        specularMap: textures.spec || null,
        specular: new THREE.Color('#3a4a5e'),
        shininess: 10,
        // Self-illumination so night side is dim but visible
        emissive: new THREE.Color('#1a2540'),
        emissiveMap: textures.day,
        emissiveIntensity: 0.42,
      })
    }
    return new THREE.MeshPhongMaterial({
      color: new THREE.Color('#1a5c8a'),
      emissive: new THREE.Color('#0a1830'),
      emissiveIntensity: 0.4,
      shininess: 10,
    })
  }, [textures])

  const handleClick = (e) => {
    e.stopPropagation()
    if (e.point) {
      const { lat, lon } = vec3ToLatLon(e.point)
      setPendingObserverMove({ lat, lon })
    }
  }

  return (
    <group>
      {/* Outer atmosphere shell */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[1.06, 48, 48]} />
        <meshBasicMaterial color="#3da9ff" transparent opacity={0.06} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh raycast={() => null}>
        <sphereGeometry args={[1.025, 48, 48]} />
        <meshBasicMaterial color="#80c5ff" transparent opacity={0.05} side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/* Main Earth */}
      <mesh
        onClick={handleClick}
        onPointerOver={() => { document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'auto' }}
      >
        <sphereGeometry args={[1.0, 96, 96]} />
        <primitive object={earthMaterial} />
      </mesh>

      {/* Cloud layer */}
      {textures?.clouds && (
        <mesh ref={cloudsRef} raycast={() => null}>
          <sphereGeometry args={[1.012, 64, 64]} />
          <meshPhongMaterial
            map={textures.clouds}
            transparent
            opacity={0.36}
            depthWrite={false}
            emissive={new THREE.Color('#1a2540')}
            emissiveMap={textures.clouds}
            emissiveIntensity={0.25}
          />
        </mesh>
      )}

      {showLabels && isEarthActive && (
        <Html position={[0, 1.7, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            color: '#00E5FF',
            fontFamily: '"Inter", sans-serif',
            fontSize: 11, fontWeight: 500,
            letterSpacing: 0.3,
            whiteSpace: 'nowrap',
            textShadow: '0 0 5px rgba(0,0,0,1), 0 0 2px #00E5FF',
            opacity: 0.92, userSelect: 'none',
          }}>
            Earth · ⌀ 12,742 km
          </div>
        </Html>
      )}
    </group>
  )
}
