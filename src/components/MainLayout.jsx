import React from 'react'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import TopBar from './TopBar'
import LeftPanel from './LeftPanel/index'
import RightPanel from './RightPanel'
import BottomBar from './BottomBar'
import SceneWrapper from './Viewport/SceneWrapper'
import SettingsPanel from './SettingsPanel'
import MoveObserverDialog from './MoveObserverDialog'
import MobileConceptChip from './MobileConceptChip'
import MobileBottomSheet, { sheetHeightCss } from './MobileBottomSheet'
import useStore from '../store/useStore'

export default function MainLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const selectedConcept = useStore((s) => s.selectedConcept)
  const panelState = useStore((s) => s.mobilePanelState)

  // Compute the bottom inset for the canvas so the visualization stays
  // centered in the *visible* portion of the screen rather than under the sheet.
  const canvasBottomInset = (isMobile && selectedConcept) ? sheetHeightCss(panelState) : '0px'

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#050A14' }}>
      <TopBar />
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <LeftPanel />
        {/* Outer canvas container: keeps mobile chip & bottom sheet positioned within it */}
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
          {/* Inner canvas region — its bottom edge tracks the sheet height so the
              3D scene auto-centers in the visible area when the sheet expands or collapses. */}
          <Box sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            bottom: canvasBottomInset,
            transition: 'bottom 420ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <SceneWrapper />
          </Box>
          {isMobile && (
            <>
              <MobileConceptChip />
              <MobileBottomSheet />
            </>
          )}
        </Box>
        {!isMobile && <RightPanel />}
      </Box>
      <BottomBar />
      <SettingsPanel />
      <MoveObserverDialog />
    </Box>
  )
}
