import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import SchoolIcon from '@mui/icons-material/School'
import {
  getConceptById, DIFFICULTY_COLORS, DIFFICULTY_LABELS, MODULES,
} from '../concepts/index'
import useStore from '../store/useStore'

const PANEL_WIDTH = 340

function RelatedChip({ conceptId }) {
  const setSelectedConcept = useStore((s) => s.setSelectedConcept)
  const related = getConceptById(conceptId)
  if (!related) return null

  return (
    <Tooltip title={related.tooltip} placement="top" arrow>
      <Chip
        label={`${related.emoji} ${related.name}`}
        size="small"
        onClick={() => setSelectedConcept(conceptId)}
        sx={{
          height: 22, fontSize: '0.7rem',
          cursor: 'pointer',
          background: 'rgba(0,229,255,0.06)',
          color: '#7AACCC',
          border: '1px solid rgba(0,229,255,0.18)',
          fontFamily: '"Inter", sans-serif',
          '&:hover': { background: 'rgba(0,229,255,0.12)', color: '#00E5FF', borderColor: 'rgba(0,229,255,0.4)' },
        }}
      />
    </Tooltip>
  )
}

function EmptyState() {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <SchoolIcon sx={{ fontSize: 48, color: '#1A2A4A', mb: 1 }} />
      <Typography variant="h6" sx={{
        fontFamily: '"Inter", sans-serif',
        fontSize: '0.85rem', color: '#4A6080', mb: 1, letterSpacing: 1,
      }}>
        WELCOME, EXPLORER
      </Typography>
      <Typography variant="body2" sx={{ color: '#5A7090', fontSize: '0.78rem', lineHeight: 1.7, mb: 2 }}>
        Click any concept on the left to see it visualized in the 3D scene. The camera will smoothly zoom to focus on the chosen feature.
      </Typography>
      <Box sx={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.12)', borderRadius: 2, p: 1.5, textAlign: 'left' }}>
        <Typography variant="caption" sx={{ color: '#7AACCC', fontSize: '0.72rem', display: 'block', mb: 0.5, fontWeight: 600 }}>
          💡 Try this first:
        </Typography>
        <Typography variant="body2" sx={{ color: '#8B9CB8', fontSize: '0.74rem', lineHeight: 1.5 }}>
          Open <strong>Module 1</strong> and click <strong>“Zenith”</strong>. Watch how the cyan beam shoots straight up from your spot on Earth into the sky bubble.
        </Typography>
      </Box>
    </Box>
  )
}

function RightPanelInner({ isMobile, hideHeader }) {
  const selectedConcept = useStore((s) => s.selectedConcept)
  const setSelectedConcept = useStore((s) => s.setSelectedConcept)
  const [showAnalogy, setShowAnalogy] = useState(true)

  const concept = getConceptById(selectedConcept)
  const mod = concept ? MODULES.find((m) => m.id === concept.module) : null

  return (
    <Box
      sx={{
        width: isMobile ? '100%' : PANEL_WIDTH,
        minWidth: isMobile ? 'auto' : PANEL_WIDTH,
        maxWidth: isMobile ? '100%' : PANEL_WIDTH,
        height: '100%',
        background: isMobile ? 'transparent' : '#080F1E',
        borderLeft: isMobile ? 'none' : '1px solid rgba(0,229,255,0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AnimatePresence mode="wait">
        {!concept && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <EmptyState />
          </motion.div>
        )}

        {concept && (
          <motion.div
            key={selectedConcept}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.4 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {/* Sticky header — hidden on mobile (chip + sheet header replace it) */}
            {!hideHeader && (
              <Box sx={{
                p: 2, pb: 1.5,
                borderBottom: '1px solid rgba(0,229,255,0.08)',
                flexShrink: 0,
                background: 'linear-gradient(180deg, rgba(0,229,255,0.04), transparent)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontSize: '1rem', fontWeight: 700,
                      color: '#00E5FF', lineHeight: 1.25,
                      textShadow: '0 0 10px rgba(0,229,255,0.4)',
                      mb: 0.6,
                    }}>
                      {concept.emoji} {concept.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={mod?.name}
                        size="small"
                        sx={{
                          height: 18, fontSize: '0.62rem',
                          background: `${mod?.color}22`,
                          color: mod?.color,
                          border: `1px solid ${mod?.color}44`,
                          fontFamily: '"Inter", sans-serif',
                        }}
                      />
                      <Chip
                        label={DIFFICULTY_LABELS[concept.difficulty]}
                        size="small"
                        sx={{
                          height: 18, fontSize: '0.62rem',
                          background: `${DIFFICULTY_COLORS[concept.difficulty]}22`,
                          color: DIFFICULTY_COLORS[concept.difficulty],
                          border: `1px solid ${DIFFICULTY_COLORS[concept.difficulty]}44`,
                          fontFamily: '"Inter", sans-serif',
                        }}
                      />
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedConcept(null)}
                    sx={{ color: '#4A6080', mt: -0.5, ml: 0.5, '&:hover': { color: '#FF6B6B' } }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* Scrollable content */}
            <Box sx={{
              flex: 1, overflowY: 'auto', px: 2, py: 2,
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { background: 'rgba(0,229,255,0.2)', borderRadius: 2 },
            }}>
              {/* Quick tooltip-style description */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#4A6080', letterSpacing: 1.5, fontSize: '0.62rem', fontFamily: '"Roboto Mono", monospace', textTransform: 'uppercase' }}>
                  In Plain English
                </Typography>
                <Typography variant="body2" sx={{ color: '#C8D8E8', lineHeight: 1.7, fontSize: '0.85rem', mt: 0.5 }}>
                  {concept.tooltip}
                </Typography>
              </Box>

              {/* Formula */}
              {concept.formula && (
                <Box sx={{
                  background: 'rgba(0,229,255,0.06)',
                  border: '1px solid rgba(0,229,255,0.2)',
                  borderRadius: 2,
                  px: 2, py: 1.2,
                  mb: 2,
                }}>
                  <Typography variant="caption" sx={{ color: '#5AAACC', fontSize: '0.62rem', letterSpacing: 1, fontFamily: '"Roboto Mono", monospace', textTransform: 'uppercase' }}>
                    Formula
                  </Typography>
                  <Typography sx={{
                    color: '#00E5FF',
                    fontFamily: '"Roboto Mono", monospace',
                    fontSize: '0.78rem',
                    whiteSpace: 'pre-line',
                    lineHeight: 1.7,
                    mt: 0.5,
                  }}>
                    {concept.formula}
                  </Typography>
                </Box>
              )}

              {/* Full description */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#4A6080', letterSpacing: 1.5, fontSize: '0.62rem', fontFamily: '"Roboto Mono", monospace', textTransform: 'uppercase' }}>
                  Full Description
                </Typography>
                <Typography variant="body2" sx={{ color: '#A8BBCC', lineHeight: 1.7, fontSize: '0.82rem', mt: 0.5 }}>
                  {concept.description}
                </Typography>
              </Box>

              {/* Process steps (for fix concepts especially) */}
              {concept.process?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#4A6080', letterSpacing: 1.5, fontSize: '0.62rem', fontFamily: '"Roboto Mono", monospace', textTransform: 'uppercase', display: 'block', mb: 0.8 }}>
                    Process — Step by Step
                  </Typography>
                  {concept.process.map((step, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex', gap: 1.2, mb: 1.2,
                        p: 1.2,
                        background: 'rgba(0,229,255,0.04)',
                        border: '1px solid rgba(0,229,255,0.12)',
                        borderRadius: 1.5,
                      }}
                    >
                      <Box sx={{
                        flexShrink: 0,
                        width: 22, height: 22,
                        borderRadius: '50%',
                        background: 'rgba(0,229,255,0.15)',
                        border: '1px solid rgba(0,229,255,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#00E5FF',
                        fontSize: '0.7rem', fontWeight: 700,
                        fontFamily: '"Roboto Mono", monospace',
                      }}>
                        {i + 1}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: '#00E5FF', fontWeight: 600, fontSize: '0.78rem', mb: 0.3 }}>
                          {step.title}
                        </Typography>
                        <Typography sx={{ color: '#A8BBCC', fontSize: '0.74rem', lineHeight: 1.55 }}>
                          {step.detail}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Analogy (always-on, friendly box) */}
              {concept.analogy && (
                <Box sx={{ mb: 2 }}>
                  <Box
                    onClick={() => setShowAnalogy((v) => !v)}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', mb: 0.5, color: '#7A9AB8', '&:hover': { color: '#B8A8FF' } }}
                  >
                    <LightbulbIcon sx={{ fontSize: 14, color: '#B8A8FF' }} />
                    <Typography variant="caption" sx={{ letterSpacing: 1.5, fontSize: '0.62rem', fontFamily: '"Roboto Mono", monospace', textTransform: 'uppercase', flex: 1 }}>
                      Think of it like…
                    </Typography>
                    {showAnalogy ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
                  </Box>

                  <AnimatePresence initial={false}>
                    {showAnalogy && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.36 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <Box sx={{
                          background: 'linear-gradient(135deg, rgba(139,124,248,0.08), rgba(139,124,248,0.02))',
                          border: '1px solid rgba(139,124,248,0.25)',
                          borderRadius: 2,
                          p: 1.5,
                        }}>
                          <Typography sx={{
                            color: '#C8B8FF',
                            fontStyle: 'italic',
                            fontSize: '0.82rem',
                            lineHeight: 1.7,
                          }}>
                            {concept.analogy}
                          </Typography>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              )}

              {/* Related concepts */}
              {concept.relatedConcepts?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#4A6080', letterSpacing: 1.5, fontSize: '0.62rem', fontFamily: '"Roboto Mono", monospace', textTransform: 'uppercase', display: 'block', mb: 0.8 }}>
                    Related Concepts
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                    {concept.relatedConcepts.map((rid) => (
                      <RelatedChip key={rid} conceptId={rid} />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Explore hint */}
              <Box sx={{
                mt: 2, p: 1.5,
                background: 'rgba(255,184,48,0.06)',
                border: '1px solid rgba(255,184,48,0.18)',
                borderRadius: 2,
              }}>
                <Typography variant="caption" sx={{ color: '#FFB830', fontSize: '0.7rem', letterSpacing: 1, fontFamily: '"Roboto Mono", monospace', display: 'block', mb: 0.4 }}>
                  EXPLORE
                </Typography>
                <Typography variant="body2" sx={{ color: '#A89070', fontSize: '0.74rem', lineHeight: 1.55 }}>
                  Drag the 3D scene to orbit. Tap <strong style={{ color: '#FFB830' }}>Settings</strong> to set the observer to a city, or click directly on Earth.
                </Typography>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}

// Used directly on desktop; wrapped by MobileBottomSheet on mobile
export { RightPanelInner }

export default function RightPanel() {
  return <RightPanelInner isMobile={false} />
}
