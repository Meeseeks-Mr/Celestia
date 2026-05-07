import React from 'react'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import Slider from '@mui/material/Slider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import CloseIcon from '@mui/icons-material/Close'
import useStore from '../store/useStore'

function SettingRow({ label, tooltip, children }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Tooltip title={tooltip} placement="left">
        <Typography variant="body2" sx={{ color: '#8B9CB8', fontSize: '0.78rem', mb: 0.5, cursor: 'help', display: 'inline-block' }}>
          {label}
        </Typography>
      </Tooltip>
      {children}
    </Box>
  )
}

export default function SettingsPanel() {
  const settingsOpen = useStore((s) => s.settingsOpen)
  const setSettingsOpen = useStore((s) => s.setSettingsOpen)
  const earthRotation = useStore((s) => s.earthRotation)
  const setEarthRotation = useStore((s) => s.setEarthRotation)
  const showStars = useStore((s) => s.showStars)
  const setShowStars = useStore((s) => s.setShowStars)
  const showLabels = useStore((s) => s.showLabels)
  const setShowLabels = useStore((s) => s.setShowLabels)
  const observerLat = useStore((s) => s.observerLat)
  const setObserverLat = useStore((s) => s.setObserverLat)
  const observerLon = useStore((s) => s.observerLon)
  const setObserverLon = useStore((s) => s.setObserverLon)
  const observerLocationLabel = useStore((s) => s.observerLocationLabel)
  const setObserverPosition = useStore((s) => s.setObserverPosition)

  return (
    <Drawer
      anchor="right"
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      PaperProps={{
        sx: {
          width: 300,
          background: '#080F1E',
          borderLeft: '1px solid rgba(0,229,255,0.1)',
          p: 0,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', fontSize: '0.85rem', color: '#00E5FF', letterSpacing: 1 }}>
            SETTINGS
          </Typography>
          <IconButton size="small" onClick={() => setSettingsOpen(false)} sx={{ color: '#4A6080' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2, borderColor: 'rgba(0,229,255,0.1)' }} />

        {/* Scene Settings */}
        <Typography variant="caption" sx={{ color: '#4A6080', letterSpacing: 2, fontSize: '0.65rem', fontFamily: '"Roboto Mono", monospace', textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
          Scene
        </Typography>

        <SettingRow
          label="Earth Rotation"
          tooltip="Turn Earth's rotation on or off. When off, Earth stays still so you can study concepts without the scene spinning."
        >
          <FormControlLabel
            control={
              <Switch
                checked={earthRotation}
                onChange={(e) => setEarthRotation(e.target.checked)}
                size="small"
                sx={{ '& .MuiSwitch-thumb': { color: earthRotation ? '#00E5FF' : '#4A6080' }, '& .MuiSwitch-track': { background: earthRotation ? 'rgba(0,229,255,0.3)' : undefined } }}
              />
            }
            label={<Typography variant="body2" sx={{ fontSize: '0.78rem', color: earthRotation ? '#00E5FF' : '#4A6080' }}>{earthRotation ? 'On' : 'Off'}</Typography>}
          />
        </SettingRow>

        <SettingRow
          label="Star Field"
          tooltip="Show or hide the background star field. Hiding stars can make concept lines easier to see."
        >
          <FormControlLabel
            control={
              <Switch
                checked={showStars}
                onChange={(e) => setShowStars(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#8B9CB8' }}>{showStars ? 'Visible' : 'Hidden'}</Typography>}
          />
        </SettingRow>

        <SettingRow
          label="3D Labels"
          tooltip="Show or hide the floating text labels on 3D objects in the scene."
        >
          <FormControlLabel
            control={
              <Switch
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#8B9CB8' }}>{showLabels ? 'On' : 'Off'}</Typography>}
          />
        </SettingRow>

        <Divider sx={{ my: 2, borderColor: 'rgba(0,229,255,0.1)' }} />

        {/* Observer Position */}
        <Typography variant="caption" sx={{ color: '#4A6080', letterSpacing: 2, fontSize: '0.65rem', fontFamily: '"Roboto Mono", monospace', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
          Observer Position
        </Typography>
        {observerLocationLabel && (
          <Typography sx={{ color: '#7AACCC', fontSize: '0.78rem', mb: 1.5, fontFamily: '"Inter", sans-serif' }}>
            {observerLocationLabel}
          </Typography>
        )}
        <Box sx={{
          background: 'rgba(0,229,255,0.04)',
          border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: 1.5, p: 1.2, mb: 1.5,
        }}>
          <Typography sx={{ color: '#9DC8E0', fontSize: '0.72rem', fontFamily: '"Inter", sans-serif', lineHeight: 1.55 }}>
            Click anywhere on Earth in the 3D scene and confirm to move the observer.
          </Typography>
        </Box>

        <SettingRow
          label={`Latitude: ${observerLat.toFixed(1)}° ${observerLat >= 0 ? 'North' : 'South'}`}
          tooltip="Your latitude — how far north or south of the equator you are. London is 51°N. The equator is 0°. North Pole is 90°N."
        >
          <Slider
            value={observerLat}
            onChange={(_, v) => setObserverLat(v)}
            min={-80}
            max={80}
            step={0.5}
            sx={{
              color: '#00E5FF',
              '& .MuiSlider-thumb': { width: 14, height: 14 },
              '& .MuiSlider-rail': { color: '#1A2A3A' },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -1 }}>
            <Typography variant="caption" sx={{ color: '#4A6080', fontSize: '0.62rem', fontFamily: '"Roboto Mono", monospace' }}>80°S</Typography>
            <Typography variant="caption" sx={{ color: '#4A6080', fontSize: '0.62rem', fontFamily: '"Roboto Mono", monospace' }}>80°N</Typography>
          </Box>
        </SettingRow>

        <SettingRow
          label={`Longitude: ${Math.abs(observerLon).toFixed(1)}° ${observerLon >= 0 ? 'East' : 'West'}`}
          tooltip="Your longitude — how far east or west of the Prime Meridian (Greenwich, London) you are. New York is 74°W. Tokyo is 139°E."
        >
          <Slider
            value={observerLon}
            onChange={(_, v) => setObserverLon(v)}
            min={-180}
            max={180}
            step={1}
            sx={{
              color: '#FFB830',
              '& .MuiSlider-thumb': { width: 14, height: 14 },
              '& .MuiSlider-rail': { color: '#1A2A3A' },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -1 }}>
            <Typography variant="caption" sx={{ color: '#4A6080', fontSize: '0.62rem', fontFamily: '"Roboto Mono", monospace' }}>180°W</Typography>
            <Typography variant="caption" sx={{ color: '#4A6080', fontSize: '0.62rem', fontFamily: '"Roboto Mono", monospace' }}>180°E</Typography>
          </Box>
        </SettingRow>

        <Divider sx={{ my: 2, borderColor: 'rgba(0,229,255,0.1)' }} />

        {/* Quick Locations */}
        <Typography variant="caption" sx={{ color: '#4A6080', letterSpacing: 2, fontSize: '0.65rem', fontFamily: '"Roboto Mono", monospace', textTransform: 'uppercase', display: 'block', mb: 1 }}>
          Quick Locations
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
          {[
            { name: 'Arabian Sea', lat: 15.5, lon: 65 },
            { name: 'London', lat: 51.5, lon: 0 },
            { name: 'New York', lat: 40.7, lon: -74 },
            { name: 'Mumbai', lat: 19.07, lon: 72.87 },
            { name: 'Sydney', lat: -33.9, lon: 151 },
            { name: 'Tokyo', lat: 35.7, lon: 139.7 },
            { name: 'Equator', lat: 0, lon: 0 },
            { name: 'N. Pole', lat: 89, lon: 0 },
          ].map((loc) => (
            <Tooltip key={loc.name} title={`Set observer to ${loc.name} (${loc.lat}°, ${loc.lon}°)`} placement="top">
              <Box
                onClick={() => { setObserverPosition(loc.lat, loc.lon, loc.name) }}
                sx={{
                  px: 1.2, py: 0.4,
                  background: 'rgba(0,229,255,0.06)',
                  border: '1px solid rgba(0,229,255,0.15)',
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  '&:hover': { background: 'rgba(0,229,255,0.12)', borderColor: 'rgba(0,229,255,0.3)' },
                }}
              >
                <Typography variant="caption" sx={{ color: '#7AACCC', fontSize: '0.72rem', fontFamily: '"Inter", sans-serif' }}>
                  {loc.name}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Box>

        <Divider sx={{ my: 2, borderColor: 'rgba(0,229,255,0.1)' }} />

        {/* Help text */}
        <Box sx={{ p: 1.5, background: 'rgba(0,229,255,0.04)', borderRadius: 1.5, border: '1px solid rgba(0,229,255,0.08)' }}>
          <Typography variant="caption" sx={{ color: '#4A6080', fontSize: '0.72rem', lineHeight: 1.6, fontFamily: '"Inter", sans-serif' }}>
            💡 <strong style={{ color: '#7AACCC' }}>Tip for 8th Graders:</strong> Change your observer position
            to London (51°N) and look up Polaris — you should be able to find it about 51° above the northern horizon!
          </Typography>
        </Box>
      </Box>
    </Drawer>
  )
}
