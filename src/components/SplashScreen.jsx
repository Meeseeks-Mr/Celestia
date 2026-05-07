import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@mui/material/Button'

const TITLE = 'CELESTIA'
const SUBTITLE = 'Astro Navigation Concepts …. Made easy'
const STAR_COUNT = 200

function randomStars(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    opacity: Math.random() * 0.7 + 0.3,
    delay: Math.random() * 2,
  }))
}

export default function SplashScreen({ onDone }) {
  const [stars] = useState(() => randomStars(STAR_COUNT))
  const [titleChars, setTitleChars] = useState([])
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [showCta, setShowCta] = useState(false)
  const [showEarth, setShowEarth] = useState(false)
  const [showSphere, setShowSphere] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    const t1 = setTimeout(() => setShowEarth(true), 400)
    const t2 = setTimeout(() => setShowSphere(true), 1400)
    let charIdx = 0
    const t3 = setTimeout(() => {
      const interval = setInterval(() => {
        setTitleChars((prev) => {
          if (charIdx >= TITLE.length) { clearInterval(interval); return prev }
          charIdx++
          return TITLE.slice(0, charIdx).split('')
        })
      }, 70)
    }, 1800)
    const t4 = setTimeout(() => setShowSubtitle(true), 2700)
    const t5 = setTimeout(() => setShowCta(true), 3200)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5) }
  }, [])

  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'radial-gradient(ellipse at center, #0A1628 0%, #050A14 70%, #020508 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Star field */}
      {stars.map((s) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: s.opacity }}
          transition={{ delay: s.delay, duration: 1.5 }}
          style={{
            position: 'absolute',
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            borderRadius: '50%',
            background: '#E8F0F8',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Animated Earth sphere */}
      <AnimatePresence>
        {showEarth && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.35, scale: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 280, height: 280,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #1a6b4a 0%, #0d4a8c 35%, #071a3a 70%, #030a14 100%)',
              boxShadow: '0 0 60px rgba(0,100,200,0.3), inset -20px -10px 40px rgba(0,0,0,0.6)',
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              zIndex: 1,
            }}
          />
        )}
      </AnimatePresence>

      {/* Celestial sphere rings */}
      <AnimatePresence>
        {showSphere && (
          <>
            {[240, 300, 340].map((size, i) => (
              <motion.div
                key={size}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.15, scale: 1 }}
                transition={{ delay: i * 0.2, duration: 1.0 }}
                style={{
                  position: 'absolute',
                  width: size, height: size,
                  borderRadius: '50%',
                  border: `1px solid #8B7CF8`,
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px' }}>
        {/* Title */}
        <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: 'clamp(36px, 8vw, 80px)',
            fontWeight: 700,
            letterSpacing: '0.10em',
            color: '#FFFFFF',
            textShadow: '0 0 30px rgba(0,229,255,0.7), 0 0 60px rgba(0,229,255,0.35)',
            margin: 0,
          }}>
            {titleChars.map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>
        </div>

        {/* Subtitle */}
        <AnimatePresence>
          {showSubtitle && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                fontFamily: '"Inter", sans-serif',
                fontSize: 'clamp(14px, 2vw, 18px)',
                fontWeight: 400,
                color: '#8B9CB8',
                letterSpacing: '0.02em',
                marginBottom: 48,
                marginTop: 8,
              }}
            >
              {SUBTITLE}
            </motion.p>
          )}
        </AnimatePresence>

        {/* CTA */}
        <AnimatePresence>
          {showCta && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ boxShadow: ['0 0 10px rgba(0,229,255,0.3)', '0 0 25px rgba(0,229,255,0.7)', '0 0 10px rgba(0,229,255,0.3)'] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ display: 'inline-block', borderRadius: 30 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={onDone}
                  sx={{
                    px: 5, py: 1.6,
                    fontSize: '0.92rem',
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    borderRadius: '30px',
                    background: 'linear-gradient(135deg, #00E5FF, #0099BB)',
                    color: '#050A14',
                    '&:hover': { background: 'linear-gradient(135deg, #73EFFF, #00E5FF)' },
                  }}
                >
                  Begin Exploration →
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom credit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 4, duration: 1 }}
        style={{
          position: 'absolute', bottom: 22,
          textAlign: 'center',
        }}
      >
        <div style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: 11,
          color: '#5A7090',
          letterSpacing: 0.6,
          fontWeight: 400,
        }}>
          Celestial Navigation Educational Visualizer
        </div>
        <div style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: 10,
          color: '#4A6080',
          letterSpacing: 0.4,
          fontWeight: 400,
          marginTop: 4,
          fontStyle: 'italic',
        }}>
          Developed by <span style={{ color: '#7AACCC', fontWeight: 500 }}>dio.stesso</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
