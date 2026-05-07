import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import useStore from '../../store/useStore'
import { latLonToVec3 } from './Observer'

export const R = 4.0
export const ER = 1.0
const OBL = 23.5

// =============================================================================
// GEOMETRY HELPERS
// =============================================================================

export function meridianArc(lon, lat0, lat1, r = R, seg = 64) {
  const pts = []
  for (let i = 0; i <= seg; i++) {
    const lat = lat0 + (lat1 - lat0) * (i / seg)
    pts.push(latLonToVec3(lat, lon, r))
  }
  return pts
}

export function parallelArc(lat, lon0, lon1, r = R, seg = 96) {
  const pts = []
  for (let i = 0; i <= seg; i++) {
    const lon = lon0 + (lon1 - lon0) * (i / seg)
    pts.push(latLonToVec3(lat, lon, r))
  }
  return pts
}

export function equatorCircle(r = R, seg = 128) {
  return parallelArc(0, 0, 360, r, seg)
}

// Full meridian (great circle through both poles at lon)
export function meridianCircle(lon, r = R, seg = 128) {
  const pts = []
  const lonR = lon * Math.PI / 180
  for (let i = 0; i <= seg; i++) {
    const t = (i / seg) * 2 * Math.PI
    const y = r * Math.cos(t)
    const horizR = r * Math.sin(t)
    pts.push(new THREE.Vector3(horizR * Math.sin(lonR), y, horizR * Math.cos(lonR)))
  }
  return pts
}

// Great-circle arc between two unit-vector positions (slerp)
export function gcArc(v0, v1, r = R, seg = 64) {
  const a = v0.clone().normalize()
  const b = v1.clone().normalize()
  const omega = Math.acos(Math.max(-1, Math.min(1, a.dot(b))))
  const sinO = Math.sin(omega)
  if (sinO < 1e-6) return [a.clone().multiplyScalar(r), b.clone().multiplyScalar(r)]
  const pts = []
  for (let i = 0; i <= seg; i++) {
    const t = i / seg
    const k0 = Math.sin((1 - t) * omega) / sinO
    const k1 = Math.sin(t * omega) / sinO
    pts.push(new THREE.Vector3(a.x * k0 + b.x * k1, a.y * k0 + b.y * k1, a.z * k0 + b.z * k1).multiplyScalar(r))
  }
  return pts
}

// Full great circle perpendicular to a normal vector
export function greatCircleFull(normal, r = R, seg = 128) {
  const n = normal.clone().normalize()
  let perp = new THREE.Vector3(1, 0, 0)
  if (Math.abs(n.dot(perp)) > 0.95) perp.set(0, 1, 0)
  const u = new THREE.Vector3().crossVectors(n, perp).normalize()
  const v = new THREE.Vector3().crossVectors(n, u).normalize()
  const pts = []
  for (let i = 0; i <= seg; i++) {
    const a = (2 * Math.PI * i) / seg
    pts.push(u.clone().multiplyScalar(Math.cos(a) * r).add(v.clone().multiplyScalar(Math.sin(a) * r)))
  }
  return pts
}

// Small circle on Earth at given angular radius (radians) from a center direction
export function smallCircleAroundDir(centerDir, radiusRad, r = ER + 0.01, seg = 128) {
  const d = centerDir.clone().normalize()
  let perp = new THREE.Vector3(0, 1, 0)
  if (Math.abs(d.dot(perp)) > 0.95) perp.set(1, 0, 0)
  const u = new THREE.Vector3().crossVectors(d, perp).normalize()
  const v = new THREE.Vector3().crossVectors(d, u).normalize()
  const cosR = Math.cos(radiusRad)
  const sinR = Math.sin(radiusRad)
  const pts = []
  for (let i = 0; i <= seg; i++) {
    const a = (2 * Math.PI * i) / seg
    pts.push(d.clone().multiplyScalar(cosR)
      .add(u.clone().multiplyScalar(Math.cos(a) * sinR))
      .add(v.clone().multiplyScalar(Math.sin(a) * sinR))
      .multiplyScalar(r))
  }
  return pts
}

// Sun position on celestial sphere
export function sunPosition(gha, dec, r = R) {
  return latLonToVec3(dec, -gha, r)
}

export function observerENU(lat, lon) {
  const up = latLonToVec3(lat, lon, 1).normalize()
  const worldUp = new THREE.Vector3(0, 1, 0)
  const east = new THREE.Vector3().crossVectors(worldUp, up).normalize()
  if (east.lengthSq() < 1e-6) east.set(1, 0, 0)
  const north = new THREE.Vector3().crossVectors(up, east).normalize()
  return { up, east, north }
}

// Position on celestial sphere given observer ENU + altitude/azimuth
export function altAzToVec3(altDeg, azDeg, enu, r = R) {
  const altR = altDeg * Math.PI / 180
  const azR = azDeg * Math.PI / 180
  return enu.up.clone().multiplyScalar(Math.sin(altR) * r)
    .add(enu.east.clone().multiplyScalar(Math.cos(altR) * Math.sin(azR) * r))
    .add(enu.north.clone().multiplyScalar(Math.cos(altR) * Math.cos(azR) * r))
}

// Compute sunrise/sunset LHA and amplitude for star at declination, observer at latitude
// Returns { lhaRise, lhaSet, amplitudeDeg, alwaysUp, alwaysDown }
export function risingSettingFor(latDeg, decDeg) {
  const phi = latDeg * Math.PI / 180
  const dec = decDeg * Math.PI / 180
  const cosLHA = -Math.tan(phi) * Math.tan(dec)
  if (cosLHA > 1) return { alwaysDown: true }
  if (cosLHA < -1) return { alwaysUp: true }
  const lhaSet = Math.acos(cosLHA) * 180 / Math.PI
  const lhaRise = -lhaSet
  // Amplitude: angle from East/West where body crosses horizon
  const sinAmp = Math.sin(dec) / Math.cos(phi)
  const amp = Math.asin(Math.max(-1, Math.min(1, sinAmp))) * 180 / Math.PI
  // azRise = 90 - amp (north of east when dec>0); azSet = 270 + amp (north of west)
  return {
    lhaRise, lhaSet,
    amplitudeDeg: amp,
    azRise: 90 - amp,
    azSet: 270 + amp,
  }
}

// =============================================================================
// PRIMITIVES
// =============================================================================

function GeoLine({ points, color, opacity = 1, depthTest = true }) {
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])
  return (
    <line geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthTest={depthTest} />
    </line>
  )
}

function ThickArc({ points, color, opacity = 1, radius = 0.012 }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points])
  const geo = useMemo(() => new THREE.TubeGeometry(curve, Math.max(8, points.length), radius, 8, false), [curve, points.length, radius])
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  )
}

// Full circle drawn dim, an arc (subset of points) drawn bright on top
function CircleWithArc({ fullCirclePoints, arcPoints, color, fullOpacity = 0.28, arcOpacity = 1, arcRadius = 0.014 }) {
  return (
    <group>
      <GeoLine points={fullCirclePoints} color={color} opacity={fullOpacity} />
      {arcPoints && arcPoints.length > 1 && (
        <ThickArc points={arcPoints} color={color} opacity={arcOpacity} radius={arcRadius} />
      )}
    </group>
  )
}

// Subtle text-only label with shadow for legibility (no background box)
function Label({ position, text, color = '#00E5FF', fontSize = 9, sub }) {
  return (
    <Html position={position} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <div style={{
        color,
        fontFamily: '"Inter", sans-serif',
        fontSize, fontWeight: 600,
        whiteSpace: 'nowrap', letterSpacing: 0.4,
        textShadow: `0 0 5px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.85), 0 0 2px ${color}88`,
        opacity: 0.94, userSelect: 'none',
        textAlign: 'center', lineHeight: 1.25,
      }}>
        {text}
        {sub && <div style={{ fontSize: fontSize - 1, opacity: 0.72, fontWeight: 400, fontFamily: '"Roboto Mono", monospace' }}>{sub}</div>}
      </div>
    </Html>
  )
}

// Animated body that follows a parametric position function over time
function MovingBody({ getPos, color = '#FFE5A0', size = 0.1, speedFactor = 1, trail = false }) {
  const ref = useRef()
  const trailPts = useRef([])
  useFrame((s) => {
    if (!ref.current) return
    const p = getPos(s.clock.elapsedTime * speedFactor)
    ref.current.position.copy(p)
  })
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <sphereGeometry args={[size * 1.7, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  )
}

// Animated step controller — returns elapsed seconds since concept loaded; loops at given period
function useStepTime(loopSec = 8) {
  const startRef = useRef(null)
  const tRef = useRef(0)
  useFrame((s) => {
    if (startRef.current === null) startRef.current = s.clock.elapsedTime
    tRef.current = (s.clock.elapsedTime - startRef.current) % loopSec
  })
  return tRef
}

function Dot({ position, color, size = 0.07, glow = true }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {glow && (
        <mesh>
          <sphereGeometry args={[size * 1.8, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.25} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

function PulsingDot({ position, color, size = 0.07 }) {
  const ref = useRef()
  useFrame((s) => {
    if (ref.current) {
      const k = 1 + Math.sin(s.clock.elapsedTime * 2.2) * 0.18
      ref.current.scale.setScalar(k)
    }
  })
  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <sphereGeometry args={[size * 2.2, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} />
      </mesh>
    </group>
  )
}

// =============================================================================
// OBSERVER HORIZON RING (used in many sky visualizations)
// =============================================================================
function ObserverHorizonRing({ obsLat, obsLon, opacity = 0.5, color = '#00E5FF', showCardinals = true }) {
  const enu = useMemo(() => observerENU(obsLat, obsLon), [obsLat, obsLon])
  const ring = useMemo(() => greatCircleFull(enu.up, R), [enu.up])
  const N = useMemo(() => enu.north.clone().multiplyScalar(R), [enu.north])
  const S = useMemo(() => enu.north.clone().multiplyScalar(-R), [enu.north])
  const E = useMemo(() => enu.east.clone().multiplyScalar(R), [enu.east])
  const W = useMemo(() => enu.east.clone().multiplyScalar(-R), [enu.east])
  return (
    <group>
      <GeoLine points={ring} color={color} opacity={opacity} />
      {showCardinals && (
        <>
          <Dot position={N} color="#FFFFFF" size={0.045} />
          <Dot position={S} color="#A8BBCC" size={0.04} />
          <Dot position={E} color="#FFB830" size={0.045} />
          <Dot position={W} color="#FFB830" size={0.045} />
          <Label position={N.clone().multiplyScalar(1.06)} text="N" color="#FFFFFF" fontSize={10} />
          <Label position={S.clone().multiplyScalar(1.06)} text="S" color="#A8BBCC" fontSize={9} />
          <Label position={E.clone().multiplyScalar(1.06)} text="E" color="#FFB830" fontSize={10} />
          <Label position={W.clone().multiplyScalar(1.06)} text="W" color="#FFB830" fontSize={10} />
        </>
      )}
    </group>
  )
}

// =============================================================================
// MODULE 1 — BASICS
// =============================================================================

function ZenithViz({ obs, zen, showLabels }) {
  const pts = useMemo(() => [obs, zen], [obs, zen])
  return (
    <group>
      <ThickArc points={pts} color="#00E5FF" opacity={0.95} radius={0.015} />
      <PulsingDot position={zen} color="#00E5FF" size={0.09} />
      {showLabels && <Label position={zen.clone().multiplyScalar(1.06)} text="ZENITH" color="#00E5FF" fontSize={12} sub="point directly overhead" />}
    </group>
  )
}

function NadirViz({ obs, nadir, zen, showLabels }) {
  const nadirPts = useMemo(() => [obs, nadir], [obs, nadir])
  const zenPts = useMemo(() => [obs, zen], [obs, zen])
  return (
    <group>
      <ThickArc points={nadirPts} color="#FF6B6B" opacity={0.85} radius={0.014} />
      <ThickArc points={zenPts} color="#00E5FF" opacity={0.3} radius={0.008} />
      <PulsingDot position={nadir} color="#FF6B6B" size={0.08} />
      {showLabels && <>
        <Label position={nadir.clone().multiplyScalar(1.06)} text="NADIR" color="#FF6B6B" sub="opposite of zenith" />
        <Label position={zen.clone().multiplyScalar(1.06)} text="Zenith" color="#00E5FF" />
      </>}
    </group>
  )
}

function HorizonViz({ obsLat, obsLon, showLabels }) {
  return (
    <group>
      <ObserverHorizonRing obsLat={obsLat} obsLon={obsLon} opacity={0.85} />
      {showLabels && <Label position={observerENU(obsLat, obsLon).east.clone().multiplyScalar(R + 0.4)} text="HORIZON (rational)" color="#00E5FF" sub="great circle ⊥ zenith" />}
    </group>
  )
}

function CelestialEquatorViz({ showLabels }) {
  const eqPts = useMemo(() => equatorCircle(R), [])
  const earthEqPts = useMemo(() => equatorCircle(ER + 0.005), [])
  return (
    <group>
      <ThickArc points={eqPts} color="#FFFFFF" opacity={0.85} radius={0.014} />
      <GeoLine points={earthEqPts} color="#88CCFF" opacity={0.6} />
      {showLabels && <>
        <Label position={new THREE.Vector3(R + 0.4, 0, 0)} text="CELESTIAL EQUATOR" color="#FFFFFF" sub="Earth equator projected to sky" />
        <Label position={new THREE.Vector3(ER + 0.45, 0, 0)} text="Earth Equator" color="#88CCFF" fontSize={10} />
      </>}
    </group>
  )
}

function CelestialPolesViz({ showLabels }) {
  const pN = useMemo(() => latLonToVec3(90, 0, R), [])
  const pS = useMemo(() => latLonToVec3(-90, 0, R), [])
  const axis = useMemo(() => [pS, pN], [pN, pS])
  const earthAxis = useMemo(() => [
    latLonToVec3(-90, 0, ER * 0.3),
    latLonToVec3(90, 0, ER * 0.3),
  ], [])
  return (
    <group>
      <GeoLine points={axis} color="#FFB830" opacity={0.55} />
      <GeoLine points={earthAxis} color="#FFB830" opacity={0.7} />
      <PulsingDot position={pN} color="#FFB830" size={0.1} />
      <PulsingDot position={pS} color="#FFB830" size={0.1} />
      {showLabels && <>
        <Label position={pN.clone().multiplyScalar(1.06)} text="N. CELESTIAL POLE" color="#FFB830" sub="near Polaris ⭐" />
        <Label position={pS.clone().multiplyScalar(1.06)} text="S. CELESTIAL POLE" color="#FFB830" />
      </>}
    </group>
  )
}

function MeridianViz({ obsLon, obsLat, showLabels }) {
  const obsPos = useMemo(() => latLonToVec3(obsLat, obsLon, ER + 0.012), [obsLat, obsLon])
  // Half-circle on Earth surface from N pole through observer's longitude to S pole
  const meridEarth = useMemo(() => meridianArc(obsLon, 90, -90, ER + 0.012, 96), [obsLon])
  const nPole = useMemo(() => latLonToVec3(90, 0, ER + 0.012), [])
  const sPole = useMemo(() => latLonToVec3(-90, 0, ER + 0.012), [])
  return (
    <group>
      <ThickArc points={meridEarth} color="#FFB830" opacity={1} radius={0.013} />
      <Dot position={nPole} color="#FFB830" size={0.04} />
      <Dot position={sPole} color="#FFB830" size={0.04} />
      <PulsingDot position={obsPos} color="#00E5FF" size={0.05} />
      {showLabels && <>
        <Label position={latLonToVec3(45, obsLon, ER + 0.3)} text="Your Meridian" color="#FFB830" sub="Sun crosses → local noon" />
      </>}
    </group>
  )
}

function PrimeMeridianViz({ showLabels }) {
  // Half-circle on Earth surface from N pole through Greenwich (lon=0) to S pole
  const earth = useMemo(() => meridianArc(0, 90, -90, ER + 0.012, 96), [])
  const nPole = useMemo(() => latLonToVec3(90, 0, ER + 0.012), [])
  const sPole = useMemo(() => latLonToVec3(-90, 0, ER + 0.012), [])
  const greenwich = useMemo(() => latLonToVec3(51.5, 0, ER + 0.012), [])
  return (
    <group>
      <ThickArc points={earth} color="#00E676" opacity={1} radius={0.013} />
      <Dot position={nPole} color="#00E676" size={0.04} />
      <Dot position={sPole} color="#00E676" size={0.04} />
      <Dot position={greenwich} color="#00E676" size={0.05} />
      {showLabels && <>
        <Label position={latLonToVec3(20, 0, ER + 0.3)} text="Prime Meridian" color="#00E676" sub="Greenwich, 0°" />
        <Label position={greenwich.clone().multiplyScalar(1.18)} text="Greenwich" color="#9DC8E0" fontSize={9} />
      </>}
    </group>
  )
}

function VerticalCircleViz({ obs, zen, obsLat, obsLon, showLabels }) {
  const enu = useMemo(() => observerENU(obsLat, obsLon), [obsLat, obsLon])
  const bodyPos = useMemo(() => altAzToVec3(35, 60, enu, R), [enu])
  const vcNormal = useMemo(() => new THREE.Vector3().crossVectors(enu.up, bodyPos).normalize(), [enu.up, bodyPos])
  const fullCircle = useMemo(() => greatCircleFull(vcNormal, R), [vcNormal])
  const arc = useMemo(() => gcArc(zen, bodyPos, R), [zen, bodyPos])
  return (
    <group>
      <ObserverHorizonRing obsLat={obsLat} obsLon={obsLon} opacity={0.35} showCardinals={false} />
      <CircleWithArc fullCirclePoints={fullCircle} arcPoints={arc} color="#00E5FF" arcOpacity={1} fullOpacity={0.32} />
      <PulsingDot position={bodyPos} color="#FFFFFF" size={0.08} />
      <Dot position={zen} color="#00E5FF" size={0.07} />
      {showLabels && <>
        <Label position={bodyPos.clone().multiplyScalar(1.05)} text="★ Body" color="#FFFFFF" />
        <Label position={zen.clone().multiplyScalar(1.05)} text="ZENITH (Z)" color="#00E5FF" />
      </>}
    </group>
  )
}

function PrimeVerticalViz({ obsLat, obsLon, zen, showLabels }) {
  const enu = useMemo(() => observerENU(obsLat, obsLon), [obsLat, obsLon])
  const fullCircle = useMemo(() => greatCircleFull(enu.north, R), [enu.north])
  const eastSky = useMemo(() => enu.east.clone().multiplyScalar(R), [enu.east])
  const westSky = useMemo(() => enu.east.clone().multiplyScalar(-R), [enu.east])
  return (
    <group>
      <ObserverHorizonRing obsLat={obsLat} obsLon={obsLon} opacity={0.3} showCardinals={false} />
      <ThickArc points={fullCircle} color="#FFB830" opacity={0.88} radius={0.013} />
      <Dot position={eastSky} color="#FFB830" size={0.07} />
      <Dot position={westSky} color="#FFB830" size={0.07} />
      <Dot position={zen} color="#00E5FF" size={0.07} />
      {showLabels && <>
        <Label position={eastSky.clone().multiplyScalar(1.08)} text="EAST" color="#FFB830" fontSize={10} />
        <Label position={westSky.clone().multiplyScalar(1.08)} text="WEST" color="#FFB830" fontSize={10} />
        <Label position={zen.clone().multiplyScalar(1.06)} text="ZENITH" color="#00E5FF" fontSize={10} />
        <Label position={enu.north.clone().multiplyScalar(R + 0.4)} text="PRIME VERTICAL" color="#FFB830" sub="E ↔ Z ↔ W" />
      </>}
    </group>
  )
}

function CelestialHemisphereViz({ obsLat, obsLon, showLabels }) {
  const enu = useMemo(() => observerENU(obsLat, obsLon), [obsLat, obsLon])
  const horizonPts = useMemo(() => greatCircleFull(enu.up, R), [enu.up])
  const domeGeo = useMemo(() => new THREE.SphereGeometry(R - 0.015, 64, 32, 0, 2 * Math.PI, 0, Math.PI / 2), [])
  const quat = useMemo(() => {
    const yAxis = new THREE.Vector3(0, 1, 0)
    return new THREE.Quaternion().setFromUnitVectors(yAxis, enu.up.clone().normalize())
  }, [enu.up])
  return (
    <group>
      <ThickArc points={horizonPts} color="#00E5FF" opacity={0.85} radius={0.013} />
      <mesh geometry={domeGeo} quaternion={quat}>
        <meshBasicMaterial color="#5fb6ff" transparent opacity={0.09} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {showLabels && <Label position={enu.up.clone().multiplyScalar(R + 0.5)} text="VISIBLE SKY DOME" color="#5fb6ff" sub="upper celestial hemisphere" />}
    </group>
  )
}

// =============================================================================
// MODULE 2 — COORDINATES
// =============================================================================

function LatitudeViz({ obsLat, obsLon, showLabels }) {
  const eqRing = useMemo(() => equatorCircle(ER + 0.005), [])
  const meridFull = useMemo(() => meridianCircle(obsLon, ER + 0.005), [obsLon])
  const arc = useMemo(() => meridianArc(obsLon, 0, obsLat, ER + 0.012, 48), [obsLat, obsLon])
  const obsPt = useMemo(() => latLonToVec3(obsLat, obsLon, ER + 0.012), [obsLat, obsLon])
  const eqPt = useMemo(() => latLonToVec3(0, obsLon, ER + 0.012), [obsLon])
  return (
    <group>
      <GeoLine points={eqRing} color="#88CCFF" opacity={0.45} />
      <CircleWithArc fullCirclePoints={meridFull} arcPoints={arc} color="#00E5FF" arcRadius={0.013} fullOpacity={0.22} />
      <Dot position={eqPt} color="#FFFFFF" size={0.04} />
      <PulsingDot position={obsPt} color="#00E5FF" size={0.05} />
      {showLabels && <>
        <Label position={latLonToVec3(obsLat / 2 + 4, obsLon, ER + 0.3)} text={`LAT = ${obsLat.toFixed(1)}°${obsLat >= 0 ? 'N' : 'S'}`} color="#00E5FF" sub="north–south angle" />
        <Label position={latLonToVec3(0, obsLon + 30, ER + 0.18)} text="Equator" color="#88CCFF" fontSize={9} />
      </>}
    </group>
  )
}

function LongitudeViz({ obsLat, obsLon, showLabels }) {
  const eq = useMemo(() => equatorCircle(ER + 0.005), [])
  const arc = useMemo(() => parallelArc(0, 0, obsLon, ER + 0.012, 64), [obsLon])
  const pmFull = useMemo(() => meridianCircle(0, ER + 0.005), [])
  const obsMer = useMemo(() => meridianCircle(obsLon, ER + 0.005), [obsLon])
  return (
    <group>
      <GeoLine points={pmFull} color="#00E676" opacity={0.55} />
      <GeoLine points={obsMer} color="#00E5FF" opacity={0.4} />
      <CircleWithArc fullCirclePoints={eq} arcPoints={arc} color="#FFB830" arcRadius={0.013} fullOpacity={0.22} />
      {showLabels && <>
        <Label position={latLonToVec3(0, obsLon / 2, ER + 0.3)} text={`LON = ${Math.abs(obsLon).toFixed(1)}°${obsLon >= 0 ? 'E' : 'W'}`} color="#FFB830" sub="east–west angle" />
        <Label position={latLonToVec3(20, 0, ER + 0.3)} text="Greenwich 0°" color="#00E676" fontSize={9} />
      </>}
    </group>
  )
}

function ObserverPositionViz({ obsLat, obsLon, showLabels }) {
  const eqRing = useMemo(() => equatorCircle(ER + 0.005), [])
  const meridFull = useMemo(() => meridianCircle(obsLon, ER + 0.005), [obsLon])
  const latArc = useMemo(() => meridianArc(obsLon, 0, obsLat, ER + 0.012, 48), [obsLat, obsLon])
  const lonArc = useMemo(() => parallelArc(0, 0, obsLon, ER + 0.012, 64), [obsLon])
  const parallel = useMemo(() => parallelArc(obsLat, 0, 360, ER + 0.005), [obsLat])
  return (
    <group>
      <GeoLine points={eqRing} color="#88CCFF" opacity={0.35} />
      <GeoLine points={meridFull} color="#FFB830" opacity={0.3} />
      <GeoLine points={parallel} color="#00E5FF" opacity={0.35} />
      <ThickArc points={latArc} color="#00E5FF" opacity={0.95} radius={0.012} />
      <ThickArc points={lonArc} color="#FFB830" opacity={0.95} radius={0.012} />
      {showLabels && <Label position={latLonToVec3(obsLat + 6, obsLon + 5, ER + 0.4)} text={`${obsLat.toFixed(1)}°${obsLat >= 0 ? 'N' : 'S'}, ${Math.abs(obsLon).toFixed(1)}°${obsLon >= 0 ? 'E' : 'W'}`} color="#00E5FF" sub="your location" />}
    </group>
  )
}

function EquatorParallelsViz({ showLabels }) {
  const eq = useMemo(() => equatorCircle(ER + 0.005), [])
  const lats = [-60, -30, 30, 60]
  const parallels = useMemo(() => lats.map(lat => parallelArc(lat, 0, 360, ER + 0.005)), [])
  return (
    <group>
      <ThickArc points={eq} color="#00E5FF" opacity={0.9} radius={0.011} />
      {parallels.map((p, i) => (
        <GeoLine key={i} points={p} color="#FFB830" opacity={0.55} />
      ))}
      {showLabels && <>
        <Label position={latLonToVec3(0, 0, ER + 0.45)} text="EQUATOR (great circle)" color="#00E5FF" fontSize={10} />
        {lats.map(lat => (
          <Label key={lat} position={latLonToVec3(lat, 0, ER + 0.3)} text={`${Math.abs(lat)}°${lat > 0 ? 'N' : 'S'}`} color="#FFB830" fontSize={9} />
        ))}
      </>}
    </group>
  )
}

function GreatCircleViz({ showLabels }) {
  const p1 = useMemo(() => latLonToVec3(20, -50, ER + 0.01), [])
  const p2 = useMemo(() => latLonToVec3(45, 80, ER + 0.01), [])
  const arc = useMemo(() => gcArc(p1.clone().normalize(), p2.clone().normalize(), ER + 0.012, 96), [p1, p2])
  const fullCircle = useMemo(() => {
    const normal = new THREE.Vector3().crossVectors(p1, p2).normalize()
    return greatCircleFull(normal, ER + 0.012)
  }, [p1, p2])
  return (
    <group>
      <CircleWithArc fullCirclePoints={fullCircle} arcPoints={arc} color="#00E5FF" arcRadius={0.014} fullOpacity={0.3} />
      <Dot position={p1} color="#FFFFFF" size={0.04} />
      <Dot position={p2} color="#FFFFFF" size={0.04} />
      {showLabels && <Label position={latLonToVec3(35, 15, ER + 0.4)} text="GREAT CIRCLE" color="#00E5FF" sub="passes through Earth's center" />}
    </group>
  )
}

function SmallCircleViz({ showLabels }) {
  const lat = 50
  const ring = useMemo(() => parallelArc(lat, 0, 360, ER + 0.01), [lat])
  const eq = useMemo(() => equatorCircle(ER + 0.005), [])
  return (
    <group>
      <GeoLine points={eq} color="#88CCFF" opacity={0.35} />
      <ThickArc points={ring} color="#8B7CF8" opacity={0.95} radius={0.012} />
      {showLabels && <>
        <Label position={latLonToVec3(lat, 0, ER + 0.35)} text="SMALL CIRCLE (50°N)" color="#8B7CF8" sub="plane misses Earth's center" />
        <Label position={latLonToVec3(0, 0, ER + 0.3)} text="Equator (great)" color="#88CCFF" fontSize={9} />
      </>}
    </group>
  )
}

function DeclinationViz({ showLabels }) {
  const bodyDec = OBL
  const bodyLon = 90
  const bodyPos = useMemo(() => latLonToVec3(bodyDec, bodyLon, R), [])
  const eq = useMemo(() => equatorCircle(R), [])
  const hourCircle = useMemo(() => meridianCircle(bodyLon, R), [bodyLon])
  const arc = useMemo(() => meridianArc(bodyLon, 0, bodyDec, R, 48), [])
  return (
    <group>
      <GeoLine points={eq} color="#FFFFFF" opacity={0.5} />
      <CircleWithArc fullCirclePoints={hourCircle} arcPoints={arc} color="#FFB830" arcRadius={0.014} fullOpacity={0.25} />
      <PulsingDot position={bodyPos} color="#FFB830" size={0.1} />
      {showLabels && <>
        <Label position={latLonToVec3(bodyDec / 2, bodyLon + 8, R + 0.35)} text={`Dec = ${bodyDec}°N`} color="#FFB830" sub="Sun in June" />
        <Label position={latLonToVec3(0, bodyLon, R + 0.3)} text="Celestial Equator" color="#FFFFFF" fontSize={9} />
      </>}
    </group>
  )
}

function GHAViz({ showLabels }) {
  const ghaSun = useStore((s) => s.ghaSun)
  const decSun = useStore((s) => s.decSun)
  const bodyPos = useMemo(() => sunPosition(ghaSun, decSun, R), [ghaSun, decSun])
  const bodyEqPt = useMemo(() => latLonToVec3(0, -ghaSun, R), [ghaSun])
  const greenwichPt = useMemo(() => latLonToVec3(0, 0, R), [])
  const eq = useMemo(() => equatorCircle(R), [])
  const greenwichMer = useMemo(() => meridianCircle(0, R), [])
  // Arc from Greenwich westward to body's hour-circle foot
  const arc = useMemo(() => parallelArc(0, 0, -ghaSun, R, 96), [ghaSun])
  return (
    <group>
      <CircleWithArc fullCirclePoints={eq} arcPoints={arc} color="#FFB830" arcRadius={0.014} fullOpacity={0.3} />
      <GeoLine points={greenwichMer} color="#00E676" opacity={0.45} />
      <Dot position={greenwichPt} color="#00E676" size={0.06} />
      <Dot position={bodyEqPt} color="#FFB830" size={0.06} />
      <PulsingDot position={bodyPos} color="#FFB830" size={0.09} />
      {showLabels && <>
        <Label position={greenwichPt.clone().multiplyScalar(1.08)} text="Greenwich" color="#00E676" fontSize={9} />
        <Label position={bodyPos.clone().multiplyScalar(1.05)} text="☀ Sun" color="#FFB830" fontSize={10} />
        <Label position={latLonToVec3(0, -ghaSun / 2, R + 0.4)} text={`GHA = ${ghaSun.toFixed(0)}°`} color="#FFB830" sub="westward from Greenwich" />
        <Label position={latLonToVec3(0, 60, R + 0.25)} text="Equator" color="#FFFFFF" fontSize={9} />
      </>}
    </group>
  )
}

function LHAViz({ obsLat, obsLon, showLabels }) {
  const ghaSun = useStore((s) => s.ghaSun)
  const decSun = useStore((s) => s.decSun)
  const lha = ((ghaSun - obsLon) + 360) % 360
  const bodyPos = useMemo(() => sunPosition(ghaSun, decSun, R), [ghaSun, decSun])
  const obsEq = useMemo(() => latLonToVec3(0, obsLon, R), [obsLon])
  const bodyEq = useMemo(() => latLonToVec3(0, -ghaSun, R), [ghaSun])
  const eq = useMemo(() => equatorCircle(R), [])
  const obsMer = useMemo(() => meridianCircle(obsLon, R), [obsLon])
  const arc = useMemo(() => parallelArc(0, obsLon, obsLon - lha, R, 96), [obsLon, lha])
  return (
    <group>
      <CircleWithArc fullCirclePoints={eq} arcPoints={arc} color="#00E5FF" arcRadius={0.014} fullOpacity={0.3} />
      <GeoLine points={obsMer} color="#FFB830" opacity={0.5} />
      <Dot position={obsEq} color="#FFB830" size={0.06} />
      <Dot position={bodyEq} color="#00E5FF" size={0.06} />
      <PulsingDot position={bodyPos} color="#FFE5A0" size={0.09} />
      {showLabels && <>
        <Label position={latLonToVec3(0, obsLon - lha / 2, R + 0.4)} text={`LHA = ${lha.toFixed(0)}°`} color="#00E5FF" sub="from YOUR meridian" />
        <Label position={obsEq.clone().multiplyScalar(1.08)} text="Your meridian" color="#FFB830" fontSize={9} />
        <Label position={latLonToVec3(0, obsLon + 90, R + 0.25)} text="Equator" color="#FFFFFF" fontSize={9} />
      </>}
    </group>
  )
}

function SHAViz({ showLabels }) {
  const sha = 100, dec = 30
  const ariesPt = useMemo(() => latLonToVec3(0, 0, R), [])
  const bodyPos = useMemo(() => latLonToVec3(dec, -sha, R), [])
  const bodyEqFoot = useMemo(() => latLonToVec3(0, -sha, R), [])
  const eq = useMemo(() => equatorCircle(R), [])
  // SHA arc on celestial equator from Aries westward to body's hour-circle foot
  const arc = useMemo(() => parallelArc(0, 0, -sha, R, 96), [])
  // Hour circle through the star (full meridian-style circle through poles + body)
  const hourCircle = useMemo(() => meridianCircle(-sha, R), [])
  // Aries hour circle (Greenwich celestial meridian as reference)
  const ariesMer = useMemo(() => meridianCircle(0, R), [])
  return (
    <group>
      <GeoLine points={eq} color="#FFFFFF" opacity={0.28} />
      <GeoLine points={ariesMer} color="#FFB830" opacity={0.4} />
      <GeoLine points={hourCircle} color="#8B7CF8" opacity={0.4} />
      <ThickArc points={arc} color="#8B7CF8" opacity={1} radius={0.015} />
      <PulsingDot position={ariesPt} color="#FFB830" size={0.1} />
      <Dot position={bodyEqFoot} color="#8B7CF8" size={0.06} />
      <PulsingDot position={bodyPos} color="#FFFFFF" size={0.1} />
      {showLabels && <>
        <Label position={ariesPt.clone().multiplyScalar(1.12)} text="♈ Aries" color="#FFB830" fontSize={11} />
        <Label position={bodyPos.clone().multiplyScalar(1.08)} text="★ Star" color="#FFFFFF" fontSize={11} sub={`Dec ${dec}°N`} />
        <Label position={latLonToVec3(0, -sha / 2, R + 0.45)} text={`SHA = ${sha}°`} color="#8B7CF8" fontSize={11} sub="westward from Aries" />
        <Label position={latLonToVec3(-50, -sha, R + 0.3)} text="Hour circle of star" color="#8B7CF8" fontSize={9} />
        <Label position={latLonToVec3(0, 90, R + 0.25)} text="Equator" color="#FFFFFF" fontSize={9} />
      </>}
    </group>
  )
}

function RightAscensionViz({ showLabels }) {
  const raHours = 6.5, raDeg = raHours * 15, dec = 35
  const ariesPt = useMemo(() => latLonToVec3(0, 0, R), [])
  const bodyPos = useMemo(() => latLonToVec3(dec, raDeg, R), [])
  const eq = useMemo(() => equatorCircle(R), [])
  const arc = useMemo(() => parallelArc(0, 0, raDeg, R, 96), [])
  return (
    <group>
      <CircleWithArc fullCirclePoints={eq} arcPoints={arc} color="#FFB830" arcRadius={0.014} fullOpacity={0.32} />
      <Dot position={ariesPt} color="#FFB830" size={0.07} />
      <PulsingDot position={bodyPos} color="#FFFFFF" size={0.08} />
      {showLabels && <>
        <Label position={ariesPt.clone().multiplyScalar(1.1)} text="♈ Aries (0h)" color="#FFB830" fontSize={10} />
        <Label position={bodyPos.clone().multiplyScalar(1.05)} text="★ Star" color="#FFFFFF" fontSize={10} />
        <Label position={latLonToVec3(0, raDeg / 2, R + 0.4)} text={`RA = ${raHours}h (${raDeg}°)`} color="#FFB830" sub="eastward from Aries" />
        <Label position={latLonToVec3(0, -60, R + 0.25)} text="Equator" color="#FFFFFF" fontSize={9} />
      </>}
    </group>
  )
}

function HourCircleViz({ showLabels }) {
  const dec = 40, lonBody = 75
  const bodyPos = useMemo(() => latLonToVec3(dec, lonBody, R), [])
  const fullCircle = useMemo(() => meridianCircle(lonBody, R), [])
  const decArc = useMemo(() => meridianArc(lonBody, 0, dec, R, 48), [])
  const eq = useMemo(() => equatorCircle(R), [])
  return (
    <group>
      <GeoLine points={eq} color="#FFFFFF" opacity={0.4} />
      <CircleWithArc fullCirclePoints={fullCircle} arcPoints={decArc} color="#8B7CF8" arcRadius={0.013} fullOpacity={0.4} />
      <PulsingDot position={bodyPos} color="#FFFFFF" size={0.08} />
      {showLabels && <>
        <Label position={bodyPos.clone().multiplyScalar(1.1)} text="HOUR CIRCLE through ★" color="#8B7CF8" sub="great circle through both poles" />
        <Label position={latLonToVec3(0, -60, R + 0.25)} text="Equator" color="#FFFFFF" fontSize={9} />
      </>}
    </group>
  )
}

function FirstPointAriesViz({ showLabels }) {
  const ariesPt = useMemo(() => latLonToVec3(0, 0, R), [])
  const libraPt = useMemo(() => latLonToVec3(0, 180, R), [])
  const eq = useMemo(() => equatorCircle(R), [])
  // Ecliptic = equator rotated about the Aries–Libra line (the Z axis in our
  // convention) by the obliquity. Both equinox points stay on the equator;
  // the ±solstice points reach ±OBL declination at lon=±90°.
  const ecliptic = useMemo(() => {
    const tilt = OBL * Math.PI / 180
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt)
    const pts = []
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * 2 * Math.PI
      const x = R * Math.sin(a)   // east-west component on equator
      const z = R * Math.cos(a)   // axis through Aries (+Z) and Libra (-Z)
      // Rotate the (x, y) pair around Z by the obliquity
      pts.push(new THREE.Vector3(x * cosT, x * sinT, z))
    }
    return pts
  }, [])
  return (
    <group>
      <ThickArc points={eq} color="#FFFFFF" opacity={0.7} radius={0.012} />
      <ThickArc points={ecliptic} color="#FFB830" opacity={0.7} radius={0.011} />
      <PulsingDot position={ariesPt} color="#FFB830" size={0.16} />
      {showLabels && <>
        <Label position={ariesPt.clone().multiplyScalar(1.12)} text="♈ FIRST POINT OF ARIES" color="#FFB830" fontSize={11} sub="vernal equinox · zero of sky coordinates" />
        <Label position={latLonToVec3(0, -90, R + 0.4)} text="← SHA (west)" color="#8B7CF8" fontSize={10} />
        <Label position={latLonToVec3(0, 90, R + 0.4)} text="RA → (east)" color="#FFB830" fontSize={10} />
        <Label position={latLonToVec3(OBL, 90, R + 0.3)} text="Ecliptic" color="#FFB830" fontSize={9} />
        <Label position={latLonToVec3(0, 0, R + 0.7)} text="Equator" color="#FFFFFF" fontSize={9} />
      </>}
    </group>
  )
}

function AltitudeViz({ obsLat, obsLon, showLabels }) {
  const enu = useMemo(() => observerENU(obsLat, obsLon), [obsLat, obsLon])
  const altDeg = 42, azDeg = 110
  const bodyPos = useMemo(() => altAzToVec3(altDeg, azDeg, enu, R), [enu])
  const horizonFoot = useMemo(() => altAzToVec3(0, azDeg, enu, R), [enu])
  // Vertical circle through zenith and body (full circle for context)
  const vcNormal = useMemo(() => new THREE.Vector3().crossVectors(enu.up, bodyPos).normalize(), [enu.up, bodyPos])
  const vcFull = useMemo(() => greatCircleFull(vcNormal, R), [vcNormal])
  const altArc = useMemo(() => gcArc(horizonFoot, bodyPos, R), [horizonFoot, bodyPos])
  return (
    <group>
      <ObserverHorizonRing obsLat={obsLat} obsLon={obsLon} opacity={0.5} />
      <CircleWithArc fullCirclePoints={vcFull} arcPoints={altArc} color="#00E5FF" arcRadius={0.014} fullOpacity={0.25} />
      <Dot position={horizonFoot} color="#00E5FF" size={0.05} />
      <PulsingDot position={bodyPos} color="#FFFFFF" size={0.09} />
      {showLabels && <>
        <Label position={bodyPos.clone().multiplyScalar(1.05)} text={`Alt = ${altDeg}°`} color="#00E5FF" sub="height above horizon" />
        <Label position={horizonFoot.clone().multiplyScalar(1.08)} text="Foot on horizon" color="#5fb6ff" fontSize={9} />
      </>}
    </group>
  )
}

function ZenithDistanceViz({ obsLat, obsLon, zen, showLabels }) {
  const enu = useMemo(() => observerENU(obsLat, obsLon), [obsLat, obsLon])
  const altDeg = 42, azDeg = 110
  const zd = 90 - altDeg
  const bodyPos = useMemo(() => altAzToVec3(altDeg, azDeg, enu, R), [enu])
  const horizonFoot = useMemo(() => altAzToVec3(0, azDeg, enu, R), [enu])
  const vcNormal = useMemo(() => new THREE.Vector3().crossVectors(enu.up, bodyPos).normalize(), [enu.up, bodyPos])
  const vcFull = useMemo(() => greatCircleFull(vcNormal, R), [vcNormal])
  const zdArc = useMemo(() => gcArc(zen, bodyPos, R), [zen, bodyPos])
  const altArc = useMemo(() => gcArc(horizonFoot, bodyPos, R), [horizonFoot, bodyPos])
  return (
    <group>
      <ObserverHorizonRing obsLat={obsLat} obsLon={obsLon} opacity={0.4} />
      <GeoLine points={vcFull} color="#00E5FF" opacity={0.25} />
      <ThickArc points={altArc} color="#00E5FF" opacity={0.55} radius={0.011} />
      <ThickArc points={zdArc} color="#FFB830" opacity={1} radius={0.014} />
      <Dot position={zen} color="#00E5FF" size={0.07} />
      <PulsingDot position={bodyPos} color="#FFFFFF" size={0.08} />
      {showLabels && <>
        <Label position={zen.clone().multiplyScalar(1.06)} text="Zenith" color="#00E5FF" fontSize={10} />
        <Label position={bodyPos.clone().multiplyScalar(1.06)} text={`ZD = ${zd}° (= 90° − Alt)`} color="#FFB830" />
      </>}
    </group>
  )
}

function AzimuthViz({ obsLat, obsLon, showLabels }) {
  const enu = useMemo(() => observerENU(obsLat, obsLon), [obsLat, obsLon])
  const azDeg = 135, altDeg = 25
  const azR = azDeg * Math.PI / 180
  const bodyPos = useMemo(() => altAzToVec3(altDeg, azDeg, enu, R), [enu])
  const horizonFoot = useMemo(() => altAzToVec3(0, azDeg, enu, R), [enu])
  // Azimuth arc on horizon: from north clockwise to body's foot
  const azArc = useMemo(() => {
    const seg = 64
    const out = []
    for (let i = 0; i <= seg; i++) {
      const a = (azR * i) / seg
      out.push(enu.north.clone().multiplyScalar(Math.cos(a) * R).add(enu.east.clone().multiplyScalar(Math.sin(a) * R)))
    }
    return out
  }, [enu, azR])
  return (
    <group>
      <ObserverHorizonRing obsLat={obsLat} obsLon={obsLon} opacity={0.55} />
      <ThickArc points={azArc} color="#FFB830" opacity={1} radius={0.014} />
      <Dot position={horizonFoot} color="#FFB830" size={0.06} />
      <PulsingDot position={bodyPos} color="#FFFFFF" size={0.08} />
      {showLabels && <>
        <Label position={bodyPos.clone().multiplyScalar(1.05)} text="★ Body" color="#FFFFFF" fontSize={10} />
        <Label position={horizonFoot.clone().multiplyScalar(1.12)} text={`Az = ${azDeg}°`} color="#FFB830" sub="N → clockwise" />
      </>}
    </group>
  )
}

// Bearing & Amplitude — DIFFERENT from Azimuth.
// Amplitude = angular distance from due East (rising) or due West (setting), at horizon.
function BearingAmplitudeViz({ obsLat, obsLon, showLabels }) {
  const enu = useMemo(() => observerENU(obsLat, obsLon), [obsLat, obsLon])
  // Use Sun-like declination so amplitude is non-zero
  const decDeg = 23.5
  const rs = useMemo(() => risingSettingFor(obsLat, decDeg), [obsLat, decDeg])

  // Body just rising on east horizon
  const risingPos = useMemo(() => {
    if (rs.alwaysUp || rs.alwaysDown) return altAzToVec3(0, 90, enu, R)
    return altAzToVec3(0, rs.azRise, enu, R)
  }, [enu, rs])
  const eastPt = useMemo(() => enu.east.clone().multiplyScalar(R), [enu])
  const westPt = useMemo(() => enu.east.clone().multiplyScalar(-R), [enu])
  // Setting position
  const settingPos = useMemo(() => {
    if (rs.alwaysUp || rs.alwaysDown) return altAzToVec3(0, 270, enu, R)
    return altAzToVec3(0, rs.azSet, enu, R)
  }, [enu, rs])

  // Amplitude arc from East to risingPos (along horizon)
  const ampArcRise = useMemo(() => {
    const seg = 32
    const startAz = 90, endAz = rs.azRise || 90
    const out = []
    for (let i = 0; i <= seg; i++) {
      const az = startAz + (endAz - startAz) * (i / seg)
      out.push(altAzToVec3(0, az, enu, R))
    }
    return out
  }, [enu, rs.azRise])
  // Setting amplitude arc from West to settingPos
  const ampArcSet = useMemo(() => {
    const seg = 32
    const startAz = 270, endAz = rs.azSet || 270
    const out = []
    for (let i = 0; i <= seg; i++) {
      const az = startAz + (endAz - startAz) * (i / seg)
      out.push(altAzToVec3(0, az, enu, R))
    }
    return out
  }, [enu, rs.azSet])

  // Bearing line: from observer position (Earth surface) toward the body
  const obsPos = useMemo(() => latLonToVec3(obsLat, obsLon, ER + 0.02), [obsLat, obsLon])
  const bearingLine = useMemo(() => [obsPos, risingPos], [obsPos, risingPos])

  return (
    <group>
      <ObserverHorizonRing obsLat={obsLat} obsLon={obsLon} opacity={0.55} />
      {!rs.alwaysUp && !rs.alwaysDown && (
        <>
          <ThickArc points={ampArcRise} color="#00E676" opacity={1} radius={0.013} />
          <ThickArc points={ampArcSet} color="#FF6B6B" opacity={1} radius={0.013} />
          <PulsingDot position={risingPos} color="#00E676" size={0.08} />
          <PulsingDot position={settingPos} color="#FF6B6B" size={0.08} />
          <ThickArc points={bearingLine} color="#FFFFFF" opacity={0.55} radius={0.008} />
        </>
      )}
      <Dot position={eastPt} color="#FFB830" size={0.06} />
      <Dot position={westPt} color="#FFB830" size={0.06} />
      {showLabels && <>
        <Label position={eastPt.clone().multiplyScalar(1.08)} text="E" color="#FFB830" fontSize={10} />
        <Label position={westPt.clone().multiplyScalar(1.08)} text="W" color="#FFB830" fontSize={10} />
        {!rs.alwaysUp && !rs.alwaysDown && <>
          <Label position={risingPos.clone().multiplyScalar(1.1)} text="RISING" color="#00E676" fontSize={10} sub={`Az ${rs.azRise.toFixed(0)}°`} />
          <Label position={settingPos.clone().multiplyScalar(1.1)} text="SETTING" color="#FF6B6B" fontSize={10} sub={`Az ${rs.azSet.toFixed(0)}°`} />
          <Label position={ampArcRise[Math.floor(ampArcRise.length / 2)].clone().multiplyScalar(1.13)} text={`Amp = ${Math.abs(rs.amplitudeDeg).toFixed(1)}°`} color="#00E676" fontSize={9} />
        </>}
        {(rs.alwaysUp || rs.alwaysDown) && (
          <Label position={enu.up.clone().multiplyScalar(R + 0.4)} text={rs.alwaysUp ? "Body never sets here" : "Body never rises here"} color="#FF6B6B" />
        )}
      </>}
    </group>
  )
}

// =============================================================================
// MODULE 3 — MOTION & TIME
// =============================================================================

function DiurnalMotionViz({ showLabels }) {
  const stars = useMemo(() => [[35, 60], [55, 140], [18, 220], [-8, 310], [10, 0]], [])
  const trails = useMemo(() =>
    stars.map(([dec, lon0]) => {
      const pts = []
      for (let i = 0; i <= 128; i++) pts.push(latLonToVec3(dec, lon0 + (360 * i / 128), R))
      return pts
    }), [stars])
  const colors = ['#FFB830', '#00E5FF', '#8B7CF8', '#FF6B6B', '#00E676']
  return (
    <group>
      {trails.map((pts, i) => <GeoLine key={i} points={pts} color={colors[i]} opacity={0.45} />)}
      {/* Animated stars moving westward along their parallels (slow, ~10°/sec) */}
      {stars.map(([dec, lon0], i) => (
        <MovingBody
          key={i}
          color={colors[i]}
          size={0.085}
          getPos={(t) => latLonToVec3(dec, lon0 - (t * 10) % 360, R)}
        />
      ))}
      {showLabels && <Label position={new THREE.Vector3(0, R + 0.5, 0)} text="Diurnal Motion" color="#FFB830" />}
    </group>
  )
}

function EclipticViz({ showLabels }) {
  const tilt = OBL * Math.PI / 180
  const eclipticPts = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * 2 * Math.PI
      const x = R * Math.cos(a)
      const z0 = R * Math.sin(a)
      pts.push(new THREE.Vector3(x, -z0 * Math.sin(tilt), z0 * Math.cos(tilt)))
    }
    return pts
  }, [tilt])
  const eq = useMemo(() => equatorCircle(R), [])

  // Animated Sun moving slowly along the ecliptic (1 revolution per ~80 sec)
  const sunPosFn = (t) => {
    const a = (t * (2 * Math.PI / 80)) % (2 * Math.PI)
    const x = R * Math.cos(a)
    const z0 = R * Math.sin(a)
    return new THREE.Vector3(x, -z0 * Math.sin(tilt), z0 * Math.cos(tilt))
  }

  return (
    <group>
      <GeoLine points={eq} color="#FFFFFF" opacity={0.45} />
      <ThickArc points={eclipticPts} color="#FFB830" opacity={0.85} radius={0.013} />
      <MovingBody color="#FFE5A0" size={0.14} getPos={sunPosFn} />
      {showLabels && <>
        <Label position={new THREE.Vector3(R + 0.35, 0, 0)} text="Equator" color="#FFFFFF" fontSize={9} />
        <Label position={new THREE.Vector3(0, R + 0.4, R * 0.3)} text="Ecliptic" color="#FFB830" sub={`${OBL}° tilt`} />
      </>}
    </group>
  )
}

function RisingSettingViz({ obsLat, obsLon, showLabels }) {
  const enu = useMemo(() => observerENU(obsLat, obsLon), [obsLat, obsLon])
  const decDeg = 14
  const rs = useMemo(() => risingSettingFor(obsLat, decDeg), [obsLat, decDeg])

  const trail = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 128; i++) pts.push(latLonToVec3(decDeg, -((i / 128) * 360), R))
    return pts
  }, [decDeg])

  const risingPos = rs.alwaysUp || rs.alwaysDown ? null : altAzToVec3(0, rs.azRise, enu, R)
  const settingPos = rs.alwaysUp || rs.alwaysDown ? null : altAzToVec3(0, rs.azSet, enu, R)
  const transitPos = useMemo(() => latLonToVec3(decDeg, obsLon, R), [decDeg, obsLon])

  // Animated sun that traces the diurnal circle (slow, ~12°/sec → 30 sec / revolution)
  const sunPosFn = (t) => latLonToVec3(decDeg, -((t * 12) % 360 - 0), R)
  const sunPosFn2 = (t) => latLonToVec3(decDeg, obsLon - ((t * 12) % 360), R)

  return (
    <group>
      <ObserverHorizonRing obsLat={obsLat} obsLon={obsLon} opacity={0.55} />
      <ThickArc points={trail} color="#FFFFFF" opacity={0.55} radius={0.008} />
      {risingPos && <>
        <Dot position={risingPos} color="#00E676" size={0.08} />
        {showLabels && <Label position={risingPos.clone().multiplyScalar(1.1)} text="rises" color="#00E676" sub={`Az ${rs.azRise.toFixed(0)}°`} />}
      </>}
      {settingPos && <>
        <Dot position={settingPos} color="#FF6B6B" size={0.08} />
        {showLabels && <Label position={settingPos.clone().multiplyScalar(1.1)} text="sets" color="#FF6B6B" sub={`Az ${rs.azSet.toFixed(0)}°`} />}
      </>}
      <Dot position={transitPos} color="#FFB830" size={0.08} />
      {showLabels && <Label position={transitPos.clone().multiplyScalar(1.07)} text="transit" color="#FFB830" />}
      {/* Animated Sun on the trail */}
      <MovingBody color="#FFE5A0" size={0.11} getPos={sunPosFn2} />
      {showLabels && (rs.alwaysUp || rs.alwaysDown) && (
        <Label position={enu.up.clone().multiplyScalar(R + 0.4)} text={rs.alwaysUp ? "Always above horizon" : "Never rises here"} color={rs.alwaysUp ? "#8B7CF8" : "#FF6B6B"} />
      )}
    </group>
  )
}

function UpperLowerTransitViz({ obsLat, obsLon, showLabels }) {
  const dec = Math.max(70, 90 - Math.abs(obsLat) + 5)
  const trail = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 128; i++) {
      pts.push(latLonToVec3(dec, -((i / 128) * 360), R))
    }
    return pts
  }, [dec])
  const upperTransit = useMemo(() => latLonToVec3(dec, obsLon, R), [dec, obsLon])
  const lowerTransit = useMemo(() => latLonToVec3(dec, obsLon + 180, R), [dec, obsLon])
  const merid = useMemo(() => meridianCircle(obsLon, R), [obsLon])
  return (
    <group>
      <ObserverHorizonRing obsLat={obsLat} obsLon={obsLon} opacity={0.45} />
      <GeoLine points={merid} color="#FFB830" opacity={0.5} />
      <ThickArc points={trail} color="#8B7CF8" opacity={0.85} radius={0.011} />
      <PulsingDot position={upperTransit} color="#FFB830" size={0.1} />
      <PulsingDot position={lowerTransit} color="#FFB830" size={0.07} />
      {showLabels && <>
        <Label position={upperTransit.clone().multiplyScalar(1.06)} text="UPPER TRANSIT" color="#FFB830" fontSize={10} sub="highest" />
        <Label position={lowerTransit.clone().multiplyScalar(1.08)} text="LOWER TRANSIT" color="#FFB830" fontSize={10} sub="lowest" />
      </>}
    </group>
  )
}

function CulminationViz({ obsLat, obsLon, showLabels }) {
  const dec = 23.5
  const trail = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 128; i++) pts.push(latLonToVec3(dec, -((i / 128) * 360), R))
    return pts
  }, [dec])
  const peak = useMemo(() => latLonToVec3(dec, obsLon, R), [dec, obsLon])
  const merid = useMemo(() => meridianCircle(obsLon, R), [obsLon])
  // Animated sun (slow, ~12°/sec)
  const sunPosFn = (t) => latLonToVec3(dec, obsLon - ((t * 12) % 360), R)
  return (
    <group>
      <ObserverHorizonRing obsLat={obsLat} obsLon={obsLon} opacity={0.5} />
      <GeoLine points={trail} color="#FFE5A0" opacity={0.5} />
      <GeoLine points={merid} color="#FFB830" opacity={0.4} />
      <Dot position={peak} color="#FFB830" size={0.09} />
      <MovingBody color="#FFE5A0" size={0.12} getPos={sunPosFn} />
      {showLabels && <Label position={peak.clone().multiplyScalar(1.08)} text="culmination" color="#FFB830" sub="local noon" />}
    </group>
  )
}

function CircumpolarViz({ obsLat, obsLon, showLabels }) {
  const minDec = 90 - Math.abs(obsLat)
  const circDec = Math.min(85, minDec + 12)
  const nonCircDec = 15
  const circ = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 128; i++) pts.push(latLonToVec3(circDec, (360 * i) / 128, R))
    return pts
  }, [circDec])
  const nonCirc = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 128; i++) pts.push(latLonToVec3(nonCircDec, (360 * i) / 128, R))
    return pts
  }, [])
  // Animated stars on each trail (slow, ~10°/sec)
  const circStarPosFn = (t) => latLonToVec3(circDec, ((t * 10) + 0) % 360, R)
  const nonCircStarPosFn = (t) => latLonToVec3(nonCircDec, ((t * 10) + 90) % 360, R)
  return (
    <group>
      <ObserverHorizonRing obsLat={obsLat} obsLon={obsLon} opacity={0.4} />
      <ThickArc points={circ} color="#8B7CF8" opacity={0.7} radius={0.01} />
      <ThickArc points={nonCirc} color="#FF6B6B" opacity={0.6} radius={0.009} />
      <MovingBody color="#8B7CF8" size={0.075} getPos={circStarPosFn} />
      <MovingBody color="#FF6B6B" size={0.07} getPos={nonCircStarPosFn} />
      {showLabels && <>
        <Label position={latLonToVec3(circDec, 90, R + 0.25)} text="circumpolar" color="#8B7CF8" sub="never sets" />
        <Label position={latLonToVec3(nonCircDec, 90, R + 0.25)} text="rises & sets" color="#FF6B6B" />
      </>}
    </group>
  )
}

function ObliquityViz({ showLabels }) {
  const eq = useMemo(() => equatorCircle(R), [])
  const ecliptic = useMemo(() => {
    const tilt = OBL * Math.PI / 180
    const pts = []
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * 2 * Math.PI
      const x = R * Math.cos(a), z0 = R * Math.sin(a)
      pts.push(new THREE.Vector3(x, -z0 * Math.sin(tilt), z0 * Math.cos(tilt)))
    }
    return pts
  }, [])
  const ariesPt = useMemo(() => new THREE.Vector3(R, 0, 0), [])
  return (
    <group>
      <ThickArc points={eq} color="#FFFFFF" opacity={0.7} radius={0.011} />
      <ThickArc points={ecliptic} color="#FFB830" opacity={0.85} radius={0.011} />
      <Dot position={ariesPt} color="#FFB830" size={0.08} />
      {showLabels && <>
        <Label position={new THREE.Vector3(R * 0.5, R * 0.25, R * 0.5)} text={`23.5° tilt`} color="#FF6B6B" sub="obliquity" />
        <Label position={new THREE.Vector3(R * 0.3, 0, R + 0.3)} text="Equator" color="#FFFFFF" fontSize={9} />
        <Label position={new THREE.Vector3(0, R * 0.4, R)} text="Ecliptic" color="#FFB830" fontSize={9} />
      </>}
    </group>
  )
}

function LANViz({ obsLat, obsLon, showLabels }) {
  const dec = 14
  const trail = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 128; i++) pts.push(latLonToVec3(dec, -((i / 128) * 360), R))
    return pts
  }, [dec])
  const sunAtNoon = useMemo(() => latLonToVec3(dec, obsLon, R), [dec, obsLon])
  const merid = useMemo(() => meridianCircle(obsLon, R), [obsLon])
  // Animated Sun across sky (slow, ~10°/sec)
  const sunPosFn = (t) => latLonToVec3(dec, obsLon - ((t * 10) % 360), R)
  return (
    <group>
      <ObserverHorizonRing obsLat={obsLat} obsLon={obsLon} opacity={0.45} />
      <GeoLine points={merid} color="#FFB830" opacity={0.55} />
      <GeoLine points={trail} color="#FFE5A0" opacity={0.45} />
      <Dot position={sunAtNoon} color="#FFB830" size={0.08} />
      <MovingBody color="#FFE5A0" size={0.12} getPos={sunPosFn} />
      {showLabels && <Label position={sunAtNoon.clone().multiplyScalar(1.08)} text="LAN" color="#FFB830" sub="local noon" />}
    </group>
  )
}

function SiderealSolarViz({ showLabels }) {
  const eq = useMemo(() => equatorCircle(R), [])
  const sunPt = useMemo(() => latLonToVec3(0, 0, R), [])
  const ariesPt = useMemo(() => latLonToVec3(0, 1, R), [])
  return (
    <group>
      <ThickArc points={eq} color="#FFFFFF" opacity={0.6} radius={0.011} />
      <PulsingDot position={sunPt} color="#FFB830" size={0.13} />
      <PulsingDot position={ariesPt} color="#8B7CF8" size={0.09} />
      {showLabels && <>
        <Label position={sunPt.clone().multiplyScalar(1.1)} text="☀ Solar (24h)" color="#FFB830" />
        <Label position={ariesPt.clone().multiplyScalar(1.18)} text="♈ Sidereal (23h 56m)" color="#8B7CF8" />
        <Label position={new THREE.Vector3(0, -R - 0.4, 0)} text="Sun & stars drift apart by ~4 min/day" color="#A8BBCC" fontSize={9} />
        <Label position={latLonToVec3(0, 90, R + 0.25)} text="Equator" color="#FFFFFF" fontSize={9} />
      </>}
    </group>
  )
}

function EquationOfTimeViz({ showLabels }) {
  const analemma = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 128; i++) {
      const t = (i / 128) * 2 * Math.PI
      const dec = OBL * Math.cos(t)
      const eot = 16 * Math.sin(2 * t) / 4
      pts.push(latLonToVec3(dec, 50 + eot, ER + 0.015))
    }
    return pts
  }, [])
  return (
    <group>
      <ThickArc points={analemma} color="#FFB830" opacity={0.95} radius={0.012} />
      {showLabels && <Label position={latLonToVec3(0, 50, ER + 0.4)} text="ANALEMMA" color="#FFB830" sub="Sun position at same clock time, year-round" />}
    </group>
  )
}

// =============================================================================
// MODULE 4 — PZX TRIANGLE
// =============================================================================

function PZXViz({ obsLat, obsLon, concept, showLabels }) {
  const ghaSun = useStore((s) => s.ghaSun)
  const decSun = useStore((s) => s.decSun)
  const lha = ((ghaSun - obsLon) + 360) % 360

  const pPos = useMemo(() => latLonToVec3(90, 0, R), [])
  const zPos = useMemo(() => latLonToVec3(obsLat, obsLon, R), [obsLat, obsLon])
  const xPos = useMemo(() => sunPosition(ghaSun, decSun, R), [ghaSun, decSun])

  const pzPts = useMemo(() => gcArc(pPos, zPos, R), [pPos, zPos])
  const pxPts = useMemo(() => gcArc(pPos, xPos, R), [pPos, xPos])
  const zxPts = useMemo(() => gcArc(zPos, xPos, R), [zPos, xPos])

  const showPZ = ['pzx-overview', 'pzx-pole', 'pzx-zenith', 'pzx-colat', 'altitude-equation', 'pzx-lha'].includes(concept)
  const showPX = ['pzx-overview', 'pzx-pole', 'pzx-body', 'pzx-polar-distance', 'altitude-equation', 'pzx-lha'].includes(concept)
  const showZX = ['pzx-overview', 'pzx-zenith', 'pzx-body', 'pzx-zx', 'pzx-azimuth', 'altitude-equation'].includes(concept)

  const Hc = Math.asin(
    Math.sin(obsLat * Math.PI / 180) * Math.sin(decSun * Math.PI / 180) +
    Math.cos(obsLat * Math.PI / 180) * Math.cos(decSun * Math.PI / 180) * Math.cos(lha * Math.PI / 180)
  ) * 180 / Math.PI

  return (
    <group>
      <ObserverHorizonRing obsLat={obsLat} obsLon={obsLon} opacity={0.3} showCardinals={false} />
      {showPZ && <ThickArc points={pzPts} color="#FFB830" opacity={0.95} radius={0.014} />}
      {showPX && <ThickArc points={pxPts} color="#8B7CF8" opacity={0.95} radius={0.014} />}
      {showZX && <ThickArc points={zxPts} color="#00E5FF" opacity={0.95} radius={0.014} />}
      <PulsingDot position={pPos} color="#FFB830" size={0.1} />
      <PulsingDot position={zPos} color="#00E5FF" size={0.1} />
      <PulsingDot position={xPos} color="#FFFFFF" size={0.1} />
      {showLabels && <>
        <Label position={pPos.clone().multiplyScalar(1.08)} text="P (Pole)" color="#FFB830" />
        <Label position={zPos.clone().multiplyScalar(1.08)} text="Z (Zenith)" color="#00E5FF" />
        <Label position={xPos.clone().multiplyScalar(1.08)} text="X (Body)" color="#FFFFFF" />
        {concept === 'pzx-colat' && (
          <Label position={pzPts[Math.floor(pzPts.length / 2)].clone().multiplyScalar(1.1)}
            text={`PZ = 90° − ${obsLat.toFixed(0)}° = ${(90 - obsLat).toFixed(0)}°`} color="#FFB830" sub="co-latitude" />
        )}
        {concept === 'pzx-polar-distance' && (
          <Label position={pxPts[Math.floor(pxPts.length / 2)].clone().multiplyScalar(1.1)}
            text={`PX = 90° − ${decSun.toFixed(0)}° = ${(90 - decSun).toFixed(0)}°`} color="#8B7CF8" sub="polar distance" />
        )}
        {concept === 'pzx-zx' && (
          <Label position={zxPts[Math.floor(zxPts.length / 2)].clone().multiplyScalar(1.1)}
            text={`ZX = ZD = ${(90 - Hc).toFixed(0)}°`} color="#00E5FF" sub="zenith distance" />
        )}
        {concept === 'pzx-lha' && (
          <Label position={new THREE.Vector3(0, R + 0.5, 0)}
            text={`Angle at P = LHA = ${lha.toFixed(0)}°`} color="#FFB830" />
        )}
        {concept === 'pzx-azimuth' && (
          <Label position={zPos.clone().multiplyScalar(1.18)}
            text="Angle at Z = Azimuth" color="#FFB830" />
        )}
        {concept === 'altitude-equation' && (
          <Label position={new THREE.Vector3(0, -R * 0.7, 0)}
            text={`Hc = ${Hc.toFixed(1)}°`} color="#00E5FF" fontSize={14}
            sub={`sin(Hc) = sinφ·sinδ + cosφ·cosδ·cos(LHA)`} />
        )}
      </>}
    </group>
  )
}

// =============================================================================
// MODULE 5 — CELESTIAL FIX
// =============================================================================

function GPViz({ showLabels }) {
  const ghaSun = useStore((s) => s.ghaSun)
  const decSun = useStore((s) => s.decSun)
  const gpPos = useMemo(() => latLonToVec3(decSun, -ghaSun, ER + 0.012), [decSun, ghaSun])
  const sunPos = useMemo(() => sunPosition(ghaSun, decSun, R), [ghaSun, decSun])
  const beam = useMemo(() => [sunPos, gpPos], [sunPos, gpPos])
  return (
    <group>
      <ThickArc points={beam} color="#FFE5A0" opacity={0.7} radius={0.011} />
      <PulsingDot position={sunPos} color="#FFB830" size={0.1} />
      <PulsingDot position={gpPos} color="#FFB830" size={0.06} />
      {showLabels && <>
        <Label position={sunPos.clone().multiplyScalar(1.06)} text="☀ SUN" color="#FFB830" fontSize={11} />
        <Label position={gpPos.clone().multiplyScalar(1.4)} text="GP (Geographic Position)" color="#FFB830" sub="sub-solar point" />
      </>}
    </group>
  )
}

function PositionCircleViz({ showLabels }) {
  const ghaSun = useStore((s) => s.ghaSun)
  const decSun = useStore((s) => s.decSun)
  const obsLat = useStore((s) => s.observerLat)
  const obsLon = useStore((s) => s.observerLon)
  const gpLat = decSun
  const gpLon = -ghaSun
  const lha = ((ghaSun - obsLon) + 360) % 360
  const Hc = Math.asin(
    Math.sin(obsLat * Math.PI / 180) * Math.sin(gpLat * Math.PI / 180) +
    Math.cos(obsLat * Math.PI / 180) * Math.cos(gpLat * Math.PI / 180) * Math.cos(lha * Math.PI / 180)
  ) * 180 / Math.PI
  const zdDeg = Math.max(8, Math.min(85, 90 - Math.abs(Hc)))

  const gpDir = useMemo(() => latLonToVec3(gpLat, gpLon, 1).normalize(), [gpLat, gpLon])
  const circ = useMemo(() => smallCircleAroundDir(gpDir, zdDeg * Math.PI / 180, ER + 0.013), [gpDir, zdDeg])
  const gpPos = useMemo(() => latLonToVec3(gpLat, gpLon, ER + 0.013), [gpLat, gpLon])
  return (
    <group>
      <ThickArc points={circ} color="#00E5FF" opacity={0.95} radius={0.012} />
      <PulsingDot position={gpPos} color="#FFB830" size={0.07} />
      {showLabels && <>
        <Label position={gpPos.clone().multiplyScalar(1.3)} text="GP ☀" color="#FFB830" fontSize={10} />
        <Label position={circ[Math.floor(circ.length / 2)].clone().multiplyScalar(1.13)} text={`Position Circle (radius=${zdDeg.toFixed(0)}°)`} color="#00E5FF" sub="all see same altitude" />
      </>}
    </group>
  )
}

function LOPViz({ obsLat, obsLon, showLabels }) {
  const ghaSun = useStore((s) => s.ghaSun)
  const decSun = useStore((s) => s.decSun)
  const enu = useMemo(() => observerENU(obsLat, obsLon), [obsLat, obsLon])
  const obsPt = useMemo(() => latLonToVec3(obsLat, obsLon, ER + 0.014), [obsLat, obsLon])
  // Show full position circle around Sun's GP, then a tangent LOP segment near observer
  const gpDir = useMemo(() => latLonToVec3(decSun, -ghaSun, 1).normalize(), [decSun, ghaSun])
  const obsDir = useMemo(() => latLonToVec3(obsLat, obsLon, 1).normalize(), [obsLat, obsLon])
  const angleToGP = Math.acos(Math.max(-1, Math.min(1, gpDir.dot(obsDir))))
  const fullCircle = useMemo(() => smallCircleAroundDir(gpDir, angleToGP, ER + 0.013), [gpDir, angleToGP])
  // LOP: tangent line at observer perpendicular to azimuth toward GP
  const towardGPTangent = new THREE.Vector3().crossVectors(obsDir, gpDir).normalize()  // perpendicular to azimuth
  const lop = useMemo(() => [
    obsPt.clone().add(towardGPTangent.clone().multiplyScalar(0.35)),
    obsPt.clone().add(towardGPTangent.clone().multiplyScalar(-0.35)),
  ], [obsPt, towardGPTangent])
  return (
    <group>
      <GeoLine points={fullCircle} color="#00E5FF" opacity={0.32} />
      <ThickArc points={lop} color="#00E676" opacity={1} radius={0.013} />
      <PulsingDot position={obsPt} color="#00E676" size={0.06} />
      <Dot position={latLonToVec3(decSun, -ghaSun, ER + 0.013)} color="#FFB830" size={0.05} />
      {showLabels && <>
        <Label position={obsPt.clone().multiplyScalar(1.2)} text="LINE OF POSITION" color="#00E676" sub="tangent to circle near observer" />
        <Label position={latLonToVec3(decSun, -ghaSun, ER + 0.35)} text="GP ☀" color="#FFB830" fontSize={9} />
      </>}
    </group>
  )
}

// Animated step controller for Fix
function FadeStep({ start, fadeIn = 0.6, t, children }) {
  // Compute opacity: 0 before start, fades in over fadeIn seconds, then stays at 1
  const opacity = Math.max(0, Math.min(1, (t - start) / fadeIn))
  if (opacity <= 0) return null
  return (
    <group>
      {React.Children.map(children, (child) =>
        child ? React.cloneElement(child, { _stepOpacity: opacity }) : null
      )}
    </group>
  )
}

// Animated FIX — six steps loop every 12s
function FixViz({ obsLat, obsLon, showLabels }) {
  const ghaSun = useStore((s) => s.ghaSun)
  const decSun = useStore((s) => s.decSun)
  const obsPt = useMemo(() => latLonToVec3(obsLat, obsLon, ER + 0.018), [obsLat, obsLon])

  // Body 1: Sun
  const gp1Dir = useMemo(() => latLonToVec3(decSun, -ghaSun, 1).normalize(), [decSun, ghaSun])
  const gp1Pos = useMemo(() => gp1Dir.clone().multiplyScalar(ER + 0.013), [gp1Dir])
  // Body 2: A "star" at fixed offset
  const dec2 = -25, gha2 = (ghaSun + 70) % 360
  const gp2Dir = useMemo(() => latLonToVec3(dec2, -gha2, 1).normalize(), [gha2, dec2])
  const gp2Pos = useMemo(() => gp2Dir.clone().multiplyScalar(ER + 0.013), [gp2Dir])

  const obsDir = useMemo(() => latLonToVec3(obsLat, obsLon, 1).normalize(), [obsLat, obsLon])
  const ang1 = Math.acos(Math.max(-1, Math.min(1, gp1Dir.dot(obsDir))))
  const ang2 = Math.acos(Math.max(-1, Math.min(1, gp2Dir.dot(obsDir))))

  const circ1 = useMemo(() => smallCircleAroundDir(gp1Dir, ang1, ER + 0.013), [gp1Dir, ang1])
  const circ2 = useMemo(() => smallCircleAroundDir(gp2Dir, ang2, ER + 0.013), [gp2Dir, ang2])

  const tangent1 = useMemo(() => new THREE.Vector3().crossVectors(obsDir, gp1Dir).normalize(), [obsDir, gp1Dir])
  const tangent2 = useMemo(() => new THREE.Vector3().crossVectors(obsDir, gp2Dir).normalize(), [obsDir, gp2Dir])
  const lop1 = useMemo(() => [
    obsPt.clone().add(tangent1.clone().multiplyScalar(0.45)),
    obsPt.clone().add(tangent1.clone().multiplyScalar(-0.45)),
  ], [obsPt, tangent1])
  const lop2 = useMemo(() => [
    obsPt.clone().add(tangent2.clone().multiplyScalar(0.45)),
    obsPt.clone().add(tangent2.clone().multiplyScalar(-0.45)),
  ], [obsPt, tangent2])

  const az1Arc = useMemo(() => gcArc(gp1Pos.clone().normalize(), obsDir, ER + 0.011), [gp1Pos, obsDir])
  const az2Arc = useMemo(() => gcArc(gp2Pos.clone().normalize(), obsDir, ER + 0.011), [gp2Pos, obsDir])

  // Animated step refs — 20 sec full loop for a calmer pace
  const t = useStepTime(20)
  const ref1 = useRef(), ref2 = useRef(), ref3 = useRef(), ref4 = useRef(), ref5 = useRef(), ref6 = useRef(), ref7 = useRef()
  const stepLabelRef = useRef()

  useFrame(() => {
    const time = t.current
    // Step timings (seconds, 20 sec total loop):
    // GPs(0-2.5), Circle1(2.5-5), Circle2(5-7.5), Az lines(7.5-10), LOPs(10-13), Fix(13-16), pulse(16-20)
    const opGP = Math.max(0, Math.min(1, (time - 0) / 0.9))
    const opC1 = Math.max(0, Math.min(1, (time - 2.5) / 1.6))
    const opC2 = Math.max(0, Math.min(1, (time - 5) / 1.6))
    const opAz = Math.max(0, Math.min(1, (time - 7.5) / 1.6))
    const opLop = Math.max(0, Math.min(1, (time - 10) / 2.5))
    const opFix = Math.max(0, Math.min(1, (time - 13) / 1.6))

    if (ref1.current) ref1.current.children.forEach(c => { if (c.material) c.material.opacity = opGP })
    if (ref2.current) ref2.current.children.forEach(c => { if (c.material) c.material.opacity = opC1 * 0.5 })
    if (ref3.current) ref3.current.children.forEach(c => { if (c.material) c.material.opacity = opC2 * 0.5 })
    if (ref4.current) ref4.current.children.forEach(c => { if (c.material) c.material.opacity = opAz * 0.4 })
    if (ref5.current) ref5.current.children.forEach(c => { if (c.material) c.material.opacity = opLop * 0.95 })
    if (ref6.current) ref6.current.children.forEach(c => { if (c.material) c.material.opacity = opLop * 0.95 })
    if (ref7.current) {
      ref7.current.children.forEach(c => { if (c.material) c.material.opacity = opFix })
      const k = 1 + Math.sin(time * 4) * 0.2 * opFix
      ref7.current.scale.setScalar(k)
    }

    // Update step label text
    if (stepLabelRef.current) {
      const stepText = time < 2.5 ? '① Locate the two GPs (Sun & Star)'
        : time < 5 ? '② Draw position circle around GP-1'
        : time < 7.5 ? '③ Draw position circle around GP-2'
        : time < 10 ? '④ Sketch azimuth bearings to fix point'
        : time < 13 ? '⑤ Plot LOPs (perpendicular to bearings)'
        : '⑥ Where LOPs cross = your FIX ✦'
      stepLabelRef.current.textContent = stepText
    }
  })

  return (
    <group>
      {/* Position circles */}
      <group ref={ref2}>
        <line geometry={useMemo(() => new THREE.BufferGeometry().setFromPoints(circ1), [circ1])}>
          <lineBasicMaterial color="#00E5FF" transparent opacity={0} />
        </line>
      </group>
      <group ref={ref3}>
        <line geometry={useMemo(() => new THREE.BufferGeometry().setFromPoints(circ2), [circ2])}>
          <lineBasicMaterial color="#FFB830" transparent opacity={0} />
        </line>
      </group>

      {/* Azimuth guide lines */}
      <group ref={ref4}>
        <line geometry={useMemo(() => new THREE.BufferGeometry().setFromPoints(az1Arc), [az1Arc])}>
          <lineBasicMaterial color="#00E5FF" transparent opacity={0} />
        </line>
        <line geometry={useMemo(() => new THREE.BufferGeometry().setFromPoints(az2Arc), [az2Arc])}>
          <lineBasicMaterial color="#FFB830" transparent opacity={0} />
        </line>
      </group>

      {/* LOPs */}
      <group ref={ref5}>
        <line geometry={useMemo(() => new THREE.BufferGeometry().setFromPoints(lop1), [lop1])}>
          <lineBasicMaterial color="#00E5FF" transparent opacity={0} linewidth={2} />
        </line>
      </group>
      <group ref={ref6}>
        <line geometry={useMemo(() => new THREE.BufferGeometry().setFromPoints(lop2), [lop2])}>
          <lineBasicMaterial color="#FFB830" transparent opacity={0} linewidth={2} />
        </line>
      </group>

      {/* Fix marker */}
      <group ref={ref7} position={obsPt}>
        <mesh>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color="#00E676" transparent opacity={0} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshBasicMaterial color="#00E676" transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      {/* GP dots (always visible after step 1) */}
      <group ref={ref1}>
        <mesh position={gp1Pos}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color="#FFB830" transparent opacity={0} />
        </mesh>
        <mesh position={gp2Pos}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0} />
        </mesh>
      </group>

      {showLabels && <>
        <Label position={gp1Pos.clone().multiplyScalar(1.4)} text="GP ☀" color="#FFB830" />
        <Label position={gp2Pos.clone().multiplyScalar(1.4)} text="GP ★" color="#FFFFFF" />
        <Label position={lop1[0].clone().multiplyScalar(1.18)} text="LOP-1" color="#00E5FF" />
        <Label position={lop2[0].clone().multiplyScalar(1.18)} text="LOP-2" color="#FFB830" />
        <Label position={obsPt.clone().multiplyScalar(1.3)} text="✦ FIX" color="#00E676" />
        {/* Step indicator label */}
        <Html position={[0, -1.7, 0]} center style={{ pointerEvents: 'none' }}>
          <div ref={stepLabelRef} style={{
            color: '#00E676',
            fontFamily: '"Inter", sans-serif',
            fontSize: 11, fontWeight: 600,
            textShadow: '0 0 6px rgba(0,0,0,1), 0 0 2px #00E676',
            opacity: 0.95, userSelect: 'none',
            whiteSpace: 'nowrap',
          }}>① Locate the two GPs (Sun & Star)</div>
        </Html>
      </>}
    </group>
  )
}

function InterceptViz({ obsLat, obsLon, showLabels }) {
  const ghaSun = useStore((s) => s.ghaSun)
  const decSun = useStore((s) => s.decSun)
  const enu = useMemo(() => observerENU(obsLat, obsLon), [obsLat, obsLon])
  // Assumed Position offset slightly from true observer
  const apLat = obsLat + 0.6
  const apLon = obsLon + 0.6
  const apPt = useMemo(() => latLonToVec3(apLat, apLon, ER + 0.015), [apLat, apLon])
  const truePt = useMemo(() => latLonToVec3(obsLat, obsLon, ER + 0.016), [obsLat, obsLon])
  const apDir = useMemo(() => latLonToVec3(apLat, apLon, 1).normalize(), [apLat, apLon])
  const obsDir = useMemo(() => latLonToVec3(obsLat, obsLon, 1).normalize(), [obsLat, obsLon])
  const gpDir = useMemo(() => latLonToVec3(decSun, -ghaSun, 1).normalize(), [decSun, ghaSun])

  // Hc circle (around AP, radius = AP-to-GP angle)
  const hcAng = Math.acos(Math.max(-1, Math.min(1, apDir.dot(gpDir))))
  const hcCirc = useMemo(() => smallCircleAroundDir(gpDir, hcAng, ER + 0.012), [gpDir, hcAng])
  // True position circle (around true obs position) — using "observed" altitude
  const hoAng = Math.acos(Math.max(-1, Math.min(1, obsDir.dot(gpDir))))
  const hoCirc = useMemo(() => smallCircleAroundDir(gpDir, hoAng, ER + 0.013), [gpDir, hoAng])

  // Intercept arrow from AP toward (or away from) GP
  const azDir = new THREE.Vector3().subVectors(gpDir, apDir.clone().multiplyScalar(apDir.dot(gpDir))).normalize()
  const interceptDist = (hcAng - hoAng)  // positive = move toward GP (Ho > Hc)
  const arrowEnd = apPt.clone().add(azDir.clone().multiplyScalar(-interceptDist * 1.5))

  // LOP at the new corrected position, perpendicular to azimuth
  const lopMid = arrowEnd
  const lopTangent = new THREE.Vector3().crossVectors(apDir, gpDir).normalize()
  const lop = useMemo(() => [
    lopMid.clone().add(lopTangent.clone().multiplyScalar(0.45)),
    lopMid.clone().add(lopTangent.clone().multiplyScalar(-0.45)),
  ], [lopMid, lopTangent])

  return (
    <group>
      <GeoLine points={hcCirc} color="#FFB830" opacity={0.4} />
      <GeoLine points={hoCirc} color="#00E676" opacity={0.5} />
      <ThickArc points={[apPt, arrowEnd]} color="#FF6B6B" opacity={0.85} radius={0.011} />
      <ThickArc points={lop} color="#00E676" opacity={1} radius={0.012} />
      <Dot position={apPt} color="#FFB830" size={0.05} />
      {showLabels && <>
        <Label position={apPt.clone().multiplyScalar(1.18)} text="AP" color="#FFB830" fontSize={9} sub="Assumed Position" />
        <Label position={arrowEnd.clone().multiplyScalar(1.2)} text={`Intercept = ${(interceptDist * 180 / Math.PI * 60).toFixed(1)}'`} color="#FF6B6B" fontSize={9} sub="(Ho − Hc)" />
        <Label position={lop[0].clone().multiplyScalar(1.17)} text="LOP" color="#00E676" fontSize={10} />
      </>}
    </group>
  )
}

function RunningFixViz({ obsLat, obsLon, showLabels }) {
  const enu = useMemo(() => observerENU(obsLat, obsLon), [obsLat, obsLon])
  const obsPt = useMemo(() => latLonToVec3(obsLat, obsLon, ER + 0.016), [obsLat, obsLon])
  // Earlier position
  const earlierPt = useMemo(() => obsPt.clone()
    .add(enu.east.clone().multiplyScalar(-0.3))
    .add(enu.north.clone().multiplyScalar(-0.12)), [obsPt, enu])
  // Original LOP at earlier position
  const lop1 = useMemo(() => [
    earlierPt.clone().add(enu.north.clone().multiplyScalar(0.4)),
    earlierPt.clone().add(enu.north.clone().multiplyScalar(-0.4)),
  ], [earlierPt, enu])
  // Advanced LOP (parallel-shifted to current position)
  const lop1Advanced = useMemo(() => [
    obsPt.clone().add(enu.north.clone().multiplyScalar(0.4)),
    obsPt.clone().add(enu.north.clone().multiplyScalar(-0.4)),
  ], [obsPt, enu])
  // Course/speed line from earlier position to current
  const courseLine = useMemo(() => [earlierPt, obsPt], [earlierPt, obsPt])
  // Second LOP (different bearing, taken at current position)
  const lop2 = useMemo(() => [
    obsPt.clone().add(enu.east.clone().multiplyScalar(0.4)).add(enu.north.clone().multiplyScalar(0.15)),
    obsPt.clone().add(enu.east.clone().multiplyScalar(-0.4)).add(enu.north.clone().multiplyScalar(-0.15)),
  ], [obsPt, enu])
  return (
    <group>
      <GeoLine points={lop1} color="#8B7CF8" opacity={0.55} />
      <ThickArc points={courseLine} color="#FFB830" opacity={0.7} radius={0.008} />
      <ThickArc points={lop1Advanced} color="#8B7CF8" opacity={1} radius={0.012} />
      <ThickArc points={lop2} color="#00E5FF" opacity={1} radius={0.012} />
      <Dot position={earlierPt} color="#A8BBCC" size={0.04} />
      <PulsingDot position={obsPt} color="#00E676" size={0.07} />
      {showLabels && <>
        <Label position={earlierPt.clone().multiplyScalar(1.25)} text="@ T1" color="#A8BBCC" fontSize={9} />
        <Label position={lop1[0].clone().multiplyScalar(1.15)} text="LOP @ T1" color="#8B7CF8" fontSize={9} />
        <Label position={courseLine[0].clone().add(courseLine[1]).multiplyScalar(0.5).multiplyScalar(1.2)} text="Course/Speed" color="#FFB830" fontSize={9} />
        <Label position={lop1Advanced[0].clone().multiplyScalar(1.15)} text="LOP advanced" color="#8B7CF8" fontSize={9} />
        <Label position={lop2[0].clone().multiplyScalar(1.15)} text="LOP @ T2" color="#00E5FF" fontSize={9} />
        <Label position={obsPt.clone().multiplyScalar(1.22)} text="RUNNING FIX" color="#00E676" fontSize={11} />
      </>}
    </group>
  )
}

// =============================================================================
// MODULE 6 — ROUTES
// =============================================================================

function GreatCircleRouteViz({ showLabels }) {
  const p1 = useMemo(() => latLonToVec3(40.7, -74, ER + 0.014), [])
  const p2 = useMemo(() => latLonToVec3(51.5, 0, ER + 0.014), [])
  const arc = useMemo(() => gcArc(p1.clone().normalize(), p2.clone().normalize(), ER + 0.014, 96), [p1, p2])
  const fullGC = useMemo(() => {
    const normal = new THREE.Vector3().crossVectors(p1, p2).normalize()
    return greatCircleFull(normal, ER + 0.014)
  }, [p1, p2])
  return (
    <group>
      <GeoLine points={fullGC} color="#00E5FF" opacity={0.3} />
      <ThickArc points={arc} color="#00E5FF" opacity={1} radius={0.014} />
      <PulsingDot position={p1} color="#00E676" size={0.05} />
      <PulsingDot position={p2} color="#00E676" size={0.05} />
      {showLabels && <>
        <Label position={p1.clone().multiplyScalar(1.16)} text="New York" color="#A8BBCC" fontSize={9} />
        <Label position={p2.clone().multiplyScalar(1.16)} text="London" color="#A8BBCC" fontSize={9} />
        <Label position={latLonToVec3(55, -37, ER + 0.45)} text="GREAT CIRCLE" color="#00E5FF" sub="shortest path" />
      </>}
    </group>
  )
}

// Generate proper rhumb line (loxodrome) using Mercator coordinates
// Constant bearing C from (φ0, λ0): λ - λ0 = tan(C) * (ψ(φ) - ψ(φ0))
// where ψ(φ) = ln(tan(π/4 + φ/2))
function rhumbLinePoints(startLat, startLon, endLat, endLon, minLat = -85, maxLat = 85, segments = 800) {
  const phi0 = startLat * Math.PI / 180
  const phi1 = endLat * Math.PI / 180
  const lam0 = startLon * Math.PI / 180
  const lam1 = endLon * Math.PI / 180
  const psi = (phi) => Math.log(Math.tan(Math.PI / 4 + phi / 2))
  const psi0 = psi(phi0)
  const psi1 = psi(phi1)
  let dlam = lam1 - lam0
  // Normalize dlam to [-π, π]
  while (dlam > Math.PI) dlam -= 2 * Math.PI
  while (dlam < -Math.PI) dlam += 2 * Math.PI
  const dpsi = psi1 - psi0
  const tanC = dpsi !== 0 ? dlam / dpsi : (dlam > 0 ? 1e6 : -1e6)

  const pts = []
  for (let i = 0; i <= segments; i++) {
    const phi = (minLat + (maxLat - minLat) * i / segments) * Math.PI / 180
    const lam = lam0 + tanC * (psi(phi) - psi0)
    pts.push(latLonToVec3(phi * 180 / Math.PI, lam * 180 / Math.PI, ER + 0.013))
  }
  return pts
}

function RhumbLineViz({ showLabels }) {
  const startLat = 40.7, startLon = -74, endLat = 51.5, endLon = 0
  const p1 = useMemo(() => latLonToVec3(startLat, startLon, ER + 0.014), [])
  const p2 = useMemo(() => latLonToVec3(endLat, endLon, ER + 0.014), [])
  // Multi-turn loxodrome from -85°S to +85°N (winds around several times for our bearing)
  const fullPts = useMemo(() => rhumbLinePoints(startLat, startLon, endLat, endLon, -85, 85, 1200), [])
  // Highlighted segment NY → London using the same proper formula
  const segPts = useMemo(() => rhumbLinePoints(startLat, startLon, endLat, endLon, startLat, endLat, 64), [])
  // Show GC for comparison
  const gcArcPts = useMemo(() => gcArc(p1.clone().normalize(), p2.clone().normalize(), ER + 0.012, 96), [p1, p2])
  return (
    <group>
      <GeoLine points={gcArcPts} color="#00E5FF" opacity={0.28} />
      <GeoLine points={fullPts} color="#FFB830" opacity={0.32} />
      <ThickArc points={segPts} color="#FFB830" opacity={1} radius={0.014} />
      <PulsingDot position={p1} color="#00E676" size={0.05} />
      <PulsingDot position={p2} color="#00E676" size={0.05} />
      {showLabels && <>
        <Label position={p1.clone().multiplyScalar(1.16)} text="New York" color="#A8BBCC" />
        <Label position={p2.clone().multiplyScalar(1.16)} text="London" color="#A8BBCC" />
        <Label position={latLonToVec3(46, -37, ER + 0.45)} text="Rhumb Line" color="#FFB830" sub="spirals to poles · constant heading" />
      </>}
    </group>
  )
}

function VertexViz({ showLabels }) {
  const p1 = useMemo(() => latLonToVec3(40.7, -74, ER + 0.014), [])
  const p2 = useMemo(() => latLonToVec3(51.5, 0, ER + 0.014), [])
  const arc = useMemo(() => gcArc(p1.clone().normalize(), p2.clone().normalize(), ER + 0.014, 128), [p1, p2])
  const fullGC = useMemo(() => {
    const normal = new THREE.Vector3().crossVectors(p1, p2).normalize()
    return greatCircleFull(normal, ER + 0.014)
  }, [p1, p2])
  const vertex = useMemo(() => {
    let max = arc[0], maxY = arc[0].y
    for (const p of arc) if (p.y > maxY) { maxY = p.y; max = p }
    return max
  }, [arc])
  return (
    <group>
      <GeoLine points={fullGC} color="#00E5FF" opacity={0.3} />
      <ThickArc points={arc} color="#00E5FF" opacity={0.85} radius={0.012} />
      <PulsingDot position={vertex} color="#FFFFFF" size={0.08} />
      {showLabels && <Label position={vertex.clone().multiplyScalar(1.14)} text="VERTEX" color="#FFFFFF" sub="highest latitude on route" />}
    </group>
  )
}

// =============================================================================
// MODULE 7 — TWILIGHT
// =============================================================================

function TwilightZonesViz({ showLabels }) {
  const ghaSun = useStore((s) => s.ghaSun)
  const decSun = useStore((s) => s.decSun)
  const sunDir = useMemo(() => sunPosition(ghaSun, decSun, 1).normalize(), [ghaSun, decSun])
  const antiSun = useMemo(() => sunDir.clone().multiplyScalar(-1), [sunDir])
  const bands = [
    { sunAlt: 3, color: '#FFB073', label: 'Civil' },
    { sunAlt: 9, color: '#FF8C42', label: 'Nautical ⭐' },
    { sunAlt: 15, color: '#5fb6ff', label: 'Astronomical' },
  ]
  return (
    <group>
      {bands.map((b, idx) => {
        const radius = (90 - b.sunAlt) * Math.PI / 180
        const ring = smallCircleAroundDir(antiSun, radius, ER + 0.011 + idx * 0.001)
        return <GeoLine key={idx} points={ring} color={b.color} opacity={0.7} />
      })}
      {showLabels && <Label position={antiSun.clone().multiplyScalar(ER + 0.45)} text="TWILIGHT BANDS" color="#FF8C42" sub="navigator's golden time" />}
    </group>
  )
}

function TerminatorViz({ showLabels }) {
  const ghaSun = useStore((s) => s.ghaSun)
  const decSun = useStore((s) => s.decSun)
  const sunDir = useMemo(() => sunPosition(ghaSun, decSun, 1).normalize(), [ghaSun, decSun])
  const termPts = useMemo(() => greatCircleFull(sunDir, ER + 0.013), [sunDir])
  const subSolar = useMemo(() => sunDir.clone().multiplyScalar(ER + 0.013), [sunDir])
  return (
    <group>
      <ThickArc points={termPts} color="#FF8C42" opacity={0.9} radius={0.013} />
      <PulsingDot position={subSolar} color="#FFB830" size={0.07} />
      {showLabels && <>
        <Label position={subSolar.clone().multiplyScalar(1.4)} text="☀ Subsolar" color="#FFB830" fontSize={10} />
        <Label position={termPts[32]?.clone().multiplyScalar(1.13) || new THREE.Vector3(0, ER + 0.4, 0)} text="TERMINATOR" color="#FF8C42" sub="day/night boundary" />
      </>}
    </group>
  )
}

// =============================================================================
// MAIN DISPATCHER
// =============================================================================

export default function ConceptOverlay() {
  const selectedConcept = useStore((s) => s.selectedConcept)
  const obsLat = useStore((s) => s.observerLat)
  const obsLon = useStore((s) => s.observerLon)
  const showLabels = useStore((s) => s.showLabels)

  if (!selectedConcept) return null

  const obs = latLonToVec3(obsLat, obsLon, ER + 0.022)
  const zen = latLonToVec3(obsLat, obsLon, R)
  const nadir = latLonToVec3(-obsLat, obsLon + 180, R)

  const pzxConcepts = ['pzx-overview','pzx-pole','pzx-zenith','pzx-body','pzx-colat','pzx-polar-distance','pzx-zx','pzx-azimuth','pzx-lha','altitude-equation']
  if (pzxConcepts.includes(selectedConcept)) {
    return <PZXViz obsLat={obsLat} obsLon={obsLon} concept={selectedConcept} showLabels={showLabels} />
  }

  switch (selectedConcept) {
    case 'zenith': return <ZenithViz obs={obs} zen={zen} showLabels={showLabels} />
    case 'nadir': return <NadirViz obs={obs} nadir={nadir} zen={zen} showLabels={showLabels} />
    case 'horizon': return <HorizonViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'celestial-equator': return <CelestialEquatorViz showLabels={showLabels} />
    case 'celestial-poles': return <CelestialPolesViz showLabels={showLabels} />
    case 'meridian': return <MeridianViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'prime-meridian': return <PrimeMeridianViz showLabels={showLabels} />
    case 'celestial-hemisphere': return <CelestialHemisphereViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />

    case 'latitude': return <LatitudeViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'longitude': return <LongitudeViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'observer-position': return <ObserverPositionViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'equator-parallels': return <EquatorParallelsViz showLabels={showLabels} />
    case 'great-circle': return <GreatCircleViz showLabels={showLabels} />
    case 'small-circle': return <SmallCircleViz showLabels={showLabels} />
    case 'vertical-circle': return <VerticalCircleViz obs={obs} zen={zen} obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'prime-vertical': return <PrimeVerticalViz obsLat={obsLat} obsLon={obsLon} zen={zen} showLabels={showLabels} />
    case 'declination': return <DeclinationViz showLabels={showLabels} />
    case 'gha': return <GHAViz showLabels={showLabels} />
    case 'lha': return <LHAViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'sha': return <SHAViz showLabels={showLabels} />
    case 'right-ascension': return <RightAscensionViz showLabels={showLabels} />
    case 'hour-circle': return <HourCircleViz showLabels={showLabels} />
    case 'first-point-of-aries': return <FirstPointAriesViz showLabels={showLabels} />
    case 'altitude': return <AltitudeViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'zenith-distance': return <ZenithDistanceViz obsLat={obsLat} obsLon={obsLon} zen={zen} showLabels={showLabels} />
    case 'azimuth': return <AzimuthViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'bearing': return <BearingAmplitudeViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />

    case 'diurnal-motion': return <DiurnalMotionViz showLabels={showLabels} />
    case 'annual-motion': return <EclipticViz showLabels={showLabels} />
    case 'rising-setting': return <RisingSettingViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'upper-lower-transit': return <UpperLowerTransitViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'culmination': return <CulminationViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'circumpolar-star': return <CircumpolarViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'obliquity': return <ObliquityViz showLabels={showLabels} />
    case 'lan': return <LANViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'sidereal-solar-time': return <SiderealSolarViz showLabels={showLabels} />
    case 'equation-of-time': return <EquationOfTimeViz showLabels={showLabels} />

    case 'geographic-position': return <GPViz showLabels={showLabels} />
    case 'position-circle': return <PositionCircleViz showLabels={showLabels} />
    case 'lop': return <LOPViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'fix': return <FixViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'intercept': return <InterceptViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />
    case 'running-fix': return <RunningFixViz obsLat={obsLat} obsLon={obsLon} showLabels={showLabels} />

    case 'great-circle-route': return <GreatCircleRouteViz showLabels={showLabels} />
    case 'rhumb-line': return <RhumbLineViz showLabels={showLabels} />
    case 'vertex': return <VertexViz showLabels={showLabels} />

    case 'twilight-zones': return <TwilightZonesViz showLabels={showLabels} />
    case 'terminator': return <TerminatorViz showLabels={showLabels} />

    default: return null
  }
}
