import React from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../../concepts/index'
import useStore from '../../store/useStore'

function highlight(text, term) {
  if (!term) return text
  const idx = text.toLowerCase().indexOf(term.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ background: 'rgba(0,229,255,0.22)', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + term.length)}
      </span>
      {text.slice(idx + term.length)}
    </>
  )
}

export default function ConceptItem({ concept, searchTerm }) {
  const theme = useTheme()
  // On mobile, hover/long-press tooltips overflow the drawer area; the bottom
  // sheet already shows the same description on tap, so suppress the tooltip.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const selectedConcept = useStore((s) => s.selectedConcept)
  const setSelectedConcept = useStore((s) => s.setSelectedConcept)
  const isActive = selectedConcept === concept.id

  const tooltipContent = (
    <Box>
      <Typography sx={{ fontWeight: 600, mb: 0.5, color: '#E8F0F8', fontFamily: '"Inter", sans-serif', fontSize: '0.85rem' }}>
        {concept.name}
      </Typography>
      <Typography sx={{ color: '#A8BBCC', lineHeight: 1.5, fontFamily: '"Inter", sans-serif', fontSize: '0.78rem' }}>
        {concept.tooltip}
      </Typography>
      {concept.analogy && (
        <Typography sx={{ mt: 1, color: '#7A9AB8', fontStyle: 'italic', fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', pt: 1, fontFamily: '"Inter", sans-serif' }}>
          {concept.analogy}
        </Typography>
      )}
    </Box>
  )

  const button = (
    <ButtonBase
      onClick={() => setSelectedConcept(concept.id)}
      sx={{
        width: '100%',
        textAlign: 'left',
        borderRadius: 1.5,
        mb: 0.3,
        overflow: 'hidden',
        background: isActive ? 'rgba(0,229,255,0.12)' : 'transparent',
        transition: 'all 140ms ease',
        '&:hover': {
          background: isActive ? 'rgba(0,229,255,0.16)' : 'rgba(255,255,255,0.04)',
        },
      }}
    >
      <Box sx={{ px: 1.4, py: 0.9, display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
        <Box sx={{
          width: 6, height: 6,
          borderRadius: '50%',
          flexShrink: 0,
          background: DIFFICULTY_COLORS[concept.difficulty],
          boxShadow: isActive ? `0 0 5px ${DIFFICULTY_COLORS[concept.difficulty]}` : 'none',
        }} />
        <Typography sx={{
          flex: 1,
          fontFamily: '"Inter", sans-serif',
          fontWeight: isActive ? 600 : 400,
          fontSize: '0.83rem',
          color: isActive ? '#00E5FF' : '#C8D8E8',
          lineHeight: 1.3,
          letterSpacing: '-0.005em',
        }}>
          {highlight(concept.name, searchTerm)}
        </Typography>
      </Box>
    </ButtonBase>
  )

  // Mobile: no tooltip — bottom sheet already shows the description on tap
  if (isMobile) return button

  // Desktop: show description on hover, with a width clamp so it never spills
  return (
    <Tooltip
      title={tooltipContent}
      placement="right"
      enterDelay={500}
      leaveDelay={100}
      componentsProps={{
        tooltip: { sx: { maxWidth: 300 } },
      }}
    >
      {button}
    </Tooltip>
  )
}
