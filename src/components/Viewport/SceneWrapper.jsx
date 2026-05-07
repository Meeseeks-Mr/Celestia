import React, { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Scene from './Scene'
import CameraController from './CameraController'
import useStore from '../../store/useStore'

function LoadingFallback() {
  return (
    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050A14' }}>
      <CircularProgress sx={{ color: '#00E5FF' }} size={40} />
    </Box>
  )
}

function ControlsGate({ controlsRef }) {
  const isDragging = useStore((s) => s.isDraggingObserver)
  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!isDragging}
      enablePan={false}
      minDistance={2.0}
      maxDistance={30}
      dampingFactor={0.08}
      enableDamping
      rotateSpeed={0.6}
      zoomSpeed={0.8}
    />
  )
}

export default function SceneWrapper() {
  const showStars = useStore((s) => s.showStars)
  const controlsRef = useRef()

  return (
    <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, #0A1628 0%, #050A14 60%)' }}>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 1.8, 12], fov: 50, near: 0.1, far: 1000 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          style={{ background: 'transparent' }}
        >
          {showStars && (
            <Stars
              radius={140}
              depth={60}
              count={2400}
              factor={4}
              saturation={0}
              fade
              speed={0.5}
            />
          )}

          <Scene />
          <ControlsGate controlsRef={controlsRef} />
          <CameraController controlsRef={controlsRef} />
        </Canvas>
      </Suspense>
    </Box>
  )
}
