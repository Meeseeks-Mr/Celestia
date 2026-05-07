import React, { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../../store/useStore'
import { latLonToVec3 } from './Observer'

const DEFAULT_POS = new THREE.Vector3(0, 1.8, 12)
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0)

const CATEGORIES = {
  earthDetail: new Set([
    'observer-position', 'latitude', 'longitude', 'prime-meridian',
    'equator-parallels', 'great-circle', 'small-circle',
    'position-circle', 'lop', 'fix', 'intercept', 'running-fix',
    'great-circle-route', 'rhumb-line', 'vertex',
    'terminator', 'twilight-zones', 'equation-of-time',
    'geographic-position',
  ]),
  globeOverview: new Set([
    'earth', 'observer',
  ]),
  skyCentered: new Set([
    'celestial-sphere', 'celestial-equator', 'celestial-poles',
    'declination', 'gha', 'sha', 'right-ascension', 'hour-circle', 'first-point-of-aries',
    'diurnal-motion', 'annual-motion', 'obliquity', 'sidereal-solar-time', 'circumpolar-star',
  ]),
  observerSky: new Set([
    'zenith', 'nadir', 'horizon', 'celestial-hemisphere',
    'vertical-circle', 'prime-vertical', 'meridian',
    'altitude', 'zenith-distance', 'azimuth', 'bearing',
    'lha',
    'rising-setting', 'culmination', 'lan', 'upper-lower-transit',
    'pzx-overview', 'pzx-pole', 'pzx-zenith', 'pzx-body',
    'pzx-colat', 'pzx-polar-distance', 'pzx-zx',
    'pzx-azimuth', 'pzx-lha', 'altitude-equation',
  ]),
}

function categoryFor(conceptId) {
  if (!conceptId) return null
  if (CATEGORIES.earthDetail.has(conceptId)) return 'earthDetail'
  if (CATEGORIES.globeOverview.has(conceptId)) return 'globeOverview'
  if (CATEGORIES.skyCentered.has(conceptId)) return 'skyCentered'
  if (CATEGORIES.observerSky.has(conceptId)) return 'observerSky'
  return 'globeOverview'
}

function computeCameraTarget(conceptId, obsLat, obsLon, viewMode) {
  const cat = categoryFor(conceptId)

  const SKY_VIEW_DISTANCE = 13
  const OBSERVER_VIEW_DISTANCE = 12.5
  const GLOBE_VIEW_DISTANCE = 5.5
  const EARTH_DETAIL_DISTANCE = 4.0

  const observerNormal = latLonToVec3(obsLat, obsLon, 1).normalize()
  const worldUp = new THREE.Vector3(0, 1, 0)
  const tangentEast = new THREE.Vector3().crossVectors(worldUp, observerNormal).normalize()
  if (tangentEast.lengthSq() < 0.01) tangentEast.set(1, 0, 0)
  const tangentNorth = new THREE.Vector3().crossVectors(observerNormal, tangentEast).normalize()

  if (cat === 'observerSky') {
    const D = OBSERVER_VIEW_DISTANCE
    // In zenith-up mode: position camera tangent so observer's zenith appears upward
    if (viewMode === 'zenith-up') {
      // Camera looks horizontally tangent at observer with zenith pointing up in screen
      const camPos = tangentEast.clone().multiplyScalar(D * 0.85)
        .add(observerNormal.clone().multiplyScalar(D * 0.15))
        .add(tangentNorth.clone().multiplyScalar(D * 0.15))
      const target = observerNormal.clone().multiplyScalar(2.0)
      return { pos: camPos, target }
    }
    // North-up: camera positioned above north
    const camPos = tangentEast.clone().multiplyScalar(D * 0.85)
      .add(tangentNorth.clone().multiplyScalar(D * 0.20))
      .add(observerNormal.clone().multiplyScalar(D * 0.20))
      .add(worldUp.clone().multiplyScalar(D * 0.18))
    const target = observerNormal.clone().multiplyScalar(2.0)
    return { pos: camPos, target }
  }

  if (cat === 'skyCentered') {
    const D = SKY_VIEW_DISTANCE
    return {
      pos: new THREE.Vector3(D * 0.25, D * 0.28, D * 0.85),
      target: new THREE.Vector3(0, 0, 0),
    }
  }

  if (cat === 'earthDetail') {
    const D = EARTH_DETAIL_DISTANCE
    const camPos = observerNormal.clone().multiplyScalar(D * 0.65)
      .add(tangentEast.clone().multiplyScalar(D * 0.7))
      .add(tangentNorth.clone().multiplyScalar(D * 0.35))
    const target = observerNormal.clone().multiplyScalar(0.4)
    return { pos: camPos, target }
  }

  if (cat === 'globeOverview') {
    const D = GLOBE_VIEW_DISTANCE
    const camPos = observerNormal.clone().multiplyScalar(D * 0.45)
      .add(tangentEast.clone().multiplyScalar(D * 0.85))
      .add(worldUp.clone().multiplyScalar(D * 0.30))
    return { pos: camPos, target: new THREE.Vector3(0, 0, 0) }
  }

  return { pos: DEFAULT_POS.clone(), target: DEFAULT_TARGET.clone() }
}

// Auto-derived view orientation:
// Zenith-up ONLY for concepts where observer-perspective matters (horizon, alt/az, PZX, etc.).
// For sky-centered, Earth-detail, and globe overview concepts, North-up is more natural.
function shouldUseZenithUp(conceptId) {
  if (!conceptId) return false
  return CATEGORIES.observerSky.has(conceptId)
}

export default function CameraController({ controlsRef }) {
  const { camera, size } = useThree()
  const selectedConcept = useStore((s) => s.selectedConcept)
  const obsLat = useStore((s) => s.observerLat)
  const obsLon = useStore((s) => s.observerLon)

  const targetPos = useRef(DEFAULT_POS.clone())
  const targetLook = useRef(DEFAULT_TARGET.clone())
  const targetUp = useRef(new THREE.Vector3(0, 1, 0))
  const transitioning = useRef(false)
  const transitionFrames = useRef(0)
  const isFirstRun = useRef(true)

  // Auto-update target up vector based on selected concept
  useEffect(() => {
    if (shouldUseZenithUp(selectedConcept)) {
      targetUp.current.copy(latLonToVec3(obsLat, obsLon, 1).normalize())
    } else {
      targetUp.current.set(0, 1, 0)
    }
  }, [selectedConcept, obsLat, obsLon])

  useEffect(() => {
    const viewMode = shouldUseZenithUp(selectedConcept) ? 'zenith-up' : 'north-up'
    let { pos, target } = selectedConcept
      ? computeCameraTarget(selectedConcept, obsLat, obsLon, viewMode)
      : { pos: DEFAULT_POS.clone(), target: DEFAULT_TARGET.clone() }

    // Mobile / narrow viewports need extra camera distance to fit scene horizontally
    const aspect = size.width / Math.max(1, size.height)
    if (aspect < 1) {
      const scale = 1 / Math.max(0.55, aspect)
      pos = pos.clone().multiplyScalar(scale)
    }

    targetPos.current.copy(pos)
    targetLook.current.copy(target)
    transitioning.current = true
    transitionFrames.current = 0

    if (isFirstRun.current) {
      camera.position.copy(pos)
      camera.up.copy(targetUp.current)
      if (controlsRef?.current?.target) {
        controlsRef.current.target.copy(target)
        controlsRef.current.update()
      }
      isFirstRun.current = false
      transitioning.current = false
    }
  }, [selectedConcept, obsLat, obsLon, camera, controlsRef, size.width, size.height])

  useFrame(() => {
    // Smoothly lerp camera.up toward target up (gentler)
    camera.up.lerp(targetUp.current, 0.025).normalize()

    if (!transitioning.current) {
      if (controlsRef?.current) controlsRef.current.update()
      return
    }
    transitionFrames.current += 1

    // Slower, more cinematic transitions
    camera.position.lerp(targetPos.current, 0.04)

    if (controlsRef?.current?.target) {
      controlsRef.current.target.lerp(targetLook.current, 0.04)
      controlsRef.current.update()
    }

    if (transitionFrames.current > 180 ||
        camera.position.distanceTo(targetPos.current) < 0.03) {
      transitioning.current = false
    }
  })

  return null
}
