import React, { useRef, useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import { RightPanelInner } from './RightPanel'
import { getConceptById } from '../concepts/index'
import useStore from '../store/useStore'

// Heights: peek shows just the handle bar; partial leaves majority of viz visible;
// expanded gives lots of room for reading. None of them are full-screen.
export const SHEET_HEIGHTS = {
  peek: 26,
  partial: '38vh',
  expanded: '72vh',
}

// CSS-string version (for use in calc() etc.)
export function sheetHeightCss(state) {
  const h = SHEET_HEIGHTS[state]
  return typeof h === 'number' ? `${h}px` : h
}

const HEIGHTS = SHEET_HEIGHTS

export default function MobileBottomSheet() {
  const selectedConcept = useStore((s) => s.selectedConcept)
  const panelState = useStore((s) => s.mobilePanelState)
  const setPanelState = useStore((s) => s.setMobilePanelState)

  const concept = getConceptById(selectedConcept)

  // Drag-to-resize state
  const [dragOffset, setDragOffset] = useState(0) // pixels added to current state height during drag
  const dragRef = useRef({ startY: 0, dragging: false, startHeight: 0 })

  if (!concept) return null

  const onPointerDown = (e) => {
    dragRef.current.startY = e.clientY
    dragRef.current.dragging = true
    e.target.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return
    const dy = dragRef.current.startY - e.clientY
    setDragOffset(dy)
  }
  const onPointerUp = (e) => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    const dy = dragRef.current.startY - e.clientY
    setDragOffset(0)
    // Translate drag distance into a state change
    if (dy > 60) {
      // dragged up: go up one state
      setPanelState(panelState === 'peek' ? 'partial' : 'expanded')
    } else if (dy < -60) {
      // dragged down: go down one state
      setPanelState(panelState === 'expanded' ? 'partial' : 'peek')
    }
    e.target.releasePointerCapture?.(e.pointerId)
  }

  const heightStyle = dragRef.current.dragging
    ? `calc(${typeof HEIGHTS[panelState] === 'number' ? HEIGHTS[panelState] + 'px' : HEIGHTS[panelState]} + ${dragOffset}px)`
    : HEIGHTS[panelState]

  const isPeek = panelState === 'peek'

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: heightStyle,
        maxHeight: '85vh',
        minHeight: 26,
        background: 'rgba(8,15,30,0.96)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(0,229,255,0.22)',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        transition: dragRef.current.dragging ? 'none' : 'height 420ms cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 20,
        boxShadow: '0 -6px 22px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      {/* Header / drag area */}
      <Box
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        sx={{
          flexShrink: 0,
          py: 0.7, px: 1.2,
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          borderBottom: isPeek ? 'none' : '1px solid rgba(255,255,255,0.04)',
          userSelect: 'none',
        }}
      >
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{
            width: 38, height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.25)',
          }} />
        </Box>

        {/* Quick state controls */}
        <Box sx={{ position: 'absolute', right: 6, top: 4, display: 'flex', gap: 0.2 }}>
          {!isPeek && (
            <Tooltip title="Minimize" placement="top">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); setPanelState('peek') }}
                sx={{ p: 0.4, color: '#7AACCC' }}
              >
                <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          {isPeek && (
            <Tooltip title="Show description" placement="top">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); setPanelState('partial') }}
                sx={{ p: 0.4, color: '#00E5FF' }}
              >
                <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          {panelState === 'partial' && (
            <Tooltip title="Expand" placement="top">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); setPanelState('expanded') }}
                sx={{ p: 0.4, color: '#7AACCC' }}
              >
                <OpenInFullIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Tooltip>
          )}
          {panelState === 'expanded' && (
            <Tooltip title="Shrink" placement="top">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); setPanelState('partial') }}
                sx={{ p: 0.4, color: '#7AACCC' }}
              >
                <CloseFullscreenIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Body — only when not in peek state */}
      {!isPeek && (
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <RightPanelInner isMobile hideHeader />
        </Box>
      )}
    </Box>
  )
}
