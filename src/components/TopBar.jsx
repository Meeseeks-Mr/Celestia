import React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import SettingsIcon from '@mui/icons-material/Settings'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import ExploreIcon from '@mui/icons-material/Explore'
import MenuIcon from '@mui/icons-material/Menu'
import useStore from '../store/useStore'

export default function TopBar() {
  const setSettingsOpen = useStore((s) => s.setSettingsOpen)
  const setHelpOpen = useStore((s) => s.setHelpOpen)
  const setMobileMenuOpen = useStore((s) => s.setMobileMenuOpen)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: 'rgba(8,15,30,0.95)',
        borderBottom: '1px solid rgba(0,229,255,0.12)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
        minHeight: 52,
      }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 52, px: { xs: 1, sm: 2 } }}>
        {isMobile && (
          <IconButton
            size="small"
            onClick={() => setMobileMenuOpen(true)}
            sx={{ color: '#00E5FF', mr: 1 }}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mr: { xs: 1, sm: 3 } }}>
          <ExploreIcon sx={{ color: '#00E5FF', fontSize: 22 }} />
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              color: '#FFFFFF',
              letterSpacing: '0.04em',
            }}
          >
            Celestia
          </Typography>
          <Box sx={{ borderLeft: '1px solid rgba(255,255,255,0.08)', height: 18, mx: { xs: 0.4, sm: 0.6 } }} />
          <Typography
            sx={{
              color: '#5A7090',
              fontFamily: '"Inter", sans-serif',
              fontSize: { xs: '0.66rem', sm: '0.74rem' },
              fontWeight: 400,
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
            }}
          >
            by <span style={{ color: '#7AACCC', fontWeight: 500, fontStyle: 'normal' }}>dio.stesso</span>
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Settings — observer position, rotation, labels" placement="bottom">
            <IconButton size="small" onClick={() => setSettingsOpen(true)} sx={{ color: '#8B9CB8', '&:hover': { color: '#00E5FF' } }}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Click any concept on the left to visualize it. Click on Earth to move the observer (you'll be asked to confirm)." placement="bottom">
            <IconButton size="small" onClick={() => setHelpOpen(true)} sx={{ color: '#8B9CB8', '&:hover': { color: '#00E5FF' } }}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
