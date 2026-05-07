import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import useStore from '../store/useStore'

function DataBadge({ label, value, unit = '', color = '#00E5FF', tooltip, hideOnMobile = false }) {
  const content = (
    <Box sx={{
      px: { xs: 1, sm: 1.5 },
      py: 0.3,
      borderRight: '1px solid rgba(0,229,255,0.08)',
      display: { xs: hideOnMobile ? 'none' : 'flex', sm: 'flex' },
      alignItems: 'center',
      gap: 0.5,
    }}>
      <Typography variant="caption" sx={{ color: '#4A6080', fontSize: '0.62rem', letterSpacing: 0.8, fontFamily: '"Roboto Mono", monospace', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ color, fontSize: { xs: '0.7rem', sm: '0.75rem' }, fontFamily: '"Roboto Mono", monospace', fontWeight: 500 }}>
        {value}{unit}
      </Typography>
    </Box>
  )

  if (tooltip) {
    return <Tooltip title={tooltip} placement="top">{content}</Tooltip>
  }
  return content
}

export default function BottomBar() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isPaused = useStore((s) => s.isPaused)
  const togglePause = useStore((s) => s.togglePause)
  const animationSpeed = useStore((s) => s.animationSpeed)
  const setAnimationSpeed = useStore((s) => s.setAnimationSpeed)
  const observerLat = useStore((s) => s.observerLat)
  const observerLon = useStore((s) => s.observerLon)
  const ghaSun = useStore((s) => s.ghaSun)
  const decSun = useStore((s) => s.decSun)
  const altSun = useStore((s) => s.altSun)
  const azSun = useStore((s) => s.azSun)

  const lhaCalc = ((ghaSun - observerLon) + 360) % 360

  const formatDeg = (v, pos, neg) => {
    const d = Math.abs(v)
    const deg = Math.floor(d)
    const min = Math.round((d - deg) * 60)
    return `${deg}°${min.toString().padStart(2, '0')}'${v >= 0 ? pos : neg}`
  }

  return (
    <Box
      sx={{
        height: 38,
        background: 'rgba(6,12,24,0.97)',
        borderTop: '1px solid rgba(0,229,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <DataBadge
        label="Pos"
        value={`${formatDeg(observerLat, 'N', 'S')} ${formatDeg(observerLon, 'E', 'W')}`}
        color="#00E5FF"
        tooltip="Your observer position"
      />

      <DataBadge
        label="GHA"
        value={`${ghaSun.toFixed(1)}°`}
        color="#FFB830"
        tooltip="Greenwich Hour Angle of the Sun"
      />

      <DataBadge
        label="LHA"
        value={`${lhaCalc.toFixed(1)}°`}
        color="#00E5FF"
        tooltip="Local Hour Angle from your meridian"
        hideOnMobile
      />

      <DataBadge
        label="Dec"
        value={`${decSun.toFixed(1)}°${decSun >= 0 ? 'N' : 'S'}`}
        color="#FFB830"
        tooltip="Sun's declination (north/south of celestial equator)"
        hideOnMobile
      />

      <DataBadge
        label="Alt"
        value={`${altSun.toFixed(1)}°`}
        color="#00E5FF"
        tooltip="Sun altitude above horizon"
        hideOnMobile
      />

      <DataBadge
        label="Az"
        value={`${azSun.toFixed(0)}°`}
        color="#FFB830"
        tooltip="Sun azimuth (compass bearing)"
        hideOnMobile
      />

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, borderLeft: '1px solid rgba(0,229,255,0.08)' }}>
        <Tooltip title={isPaused ? 'Resume animation' : 'Pause animation'} placement="top">
          <IconButton size="small" onClick={togglePause} sx={{ color: isPaused ? '#FFB830' : '#00E5FF', p: 0.5 }}>
            {isPaused ? <PlayArrowIcon sx={{ fontSize: 16 }} /> : <PauseIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Tooltip>

        {!isMobile && (
          <Typography variant="caption" sx={{ color: '#4A6080', fontSize: '0.62rem', fontFamily: '"Roboto Mono", monospace', mx: 0.5 }}>
            SPEED
          </Typography>
        )}

        {[1, 10, 100].map((speed) => (
          <Tooltip key={speed} title={`${speed}× speed`} placement="top">
            <Button
              size="small"
              variant={animationSpeed === speed ? 'contained' : 'text'}
              onClick={() => setAnimationSpeed(speed)}
              sx={{
                minWidth: 0,
                px: { xs: 0.6, sm: 0.8 },
                py: 0.2,
                fontSize: { xs: '0.6rem', sm: '0.65rem' },
                fontFamily: '"Roboto Mono", monospace',
                color: animationSpeed === speed ? '#050A14' : '#4A6080',
                background: animationSpeed === speed ? '#00E5FF' : 'transparent',
                '&:hover': { background: animationSpeed === speed ? '#00B2CC' : 'rgba(0,229,255,0.08)', color: '#00E5FF' },
                borderRadius: 1,
              }}
            >
              {speed}×
            </Button>
          </Tooltip>
        ))}
      </Box>
    </Box>
  )
}
