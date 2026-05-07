import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import CloseIcon from '@mui/icons-material/Close'
import { getConceptById, MODULES } from '../concepts/index'
import useStore from '../store/useStore'

export default function MobileConceptChip() {
  const selectedConcept = useStore((s) => s.selectedConcept)
  const setSelectedConcept = useStore((s) => s.setSelectedConcept)
  const panelState = useStore((s) => s.mobilePanelState)
  const setPanelState = useStore((s) => s.setMobilePanelState)

  const concept = getConceptById(selectedConcept)
  if (!concept) return null

  const mod = MODULES.find((m) => m.id === concept.module)

  const handleChipClick = () => {
    // Tap chip: toggle between peek and partial
    setPanelState(panelState === 'peek' ? 'partial' : 'peek')
  }

  const handleClose = (e) => {
    e.stopPropagation()
    setSelectedConcept(null)
  }

  return (
    <Box
      onClick={handleChipClick}
      sx={{
        position: 'absolute',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(8,15,30,0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0,229,255,0.45)',
        borderRadius: 999,
        pl: 1.5, pr: 0.4,
        py: 0.4,
        zIndex: 30,
        cursor: 'pointer',
        boxShadow: '0 2px 14px rgba(0,0,0,0.5), 0 0 12px rgba(0,229,255,0.2)',
        userSelect: 'none',
        maxWidth: 'min(90%, 360px)',
        display: 'flex',
        alignItems: 'center',
        gap: 0.6,
        transition: 'all 200ms ease',
        '&:active': { transform: 'translateX(-50%) scale(0.97)' },
      }}
    >
      {mod && (
        <Box sx={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: mod.color,
          flexShrink: 0,
          boxShadow: `0 0 6px ${mod.color}`,
        }} />
      )}
      <Typography sx={{
        color: '#E8F0F8',
        fontFamily: '"Inter", sans-serif',
        fontSize: '0.78rem',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flex: 1,
        lineHeight: 1.2,
      }}>
        {concept.name}
      </Typography>
      {panelState === 'peek' && (
        <KeyboardArrowDownIcon sx={{
          fontSize: 14,
          color: '#5fb6ff',
          transform: 'rotate(180deg)',
          flexShrink: 0,
        }} />
      )}
      <IconButton
        onClick={handleClose}
        size="small"
        aria-label="Close concept"
        sx={{
          p: 0.3,
          color: '#7AACCC',
          '&:hover': { color: '#FF6B6B' },
        }}
      >
        <CloseIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  )
}
