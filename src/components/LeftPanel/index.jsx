import React, { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
import GridOnIcon from '@mui/icons-material/GridOn'
import RotateRightIcon from '@mui/icons-material/RotateRight'
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import RouteIcon from '@mui/icons-material/Route'
import WbTwilightIcon from '@mui/icons-material/WbTwilight'
import ConceptItem from './ConceptItem'
import { MODULES, CONCEPTS_BY_MODULE, ALL_CONCEPTS } from '../../concepts/index'
import useStore from '../../store/useStore'

const MODULE_ICONS = {
  1: PublicOutlinedIcon,
  2: GridOnIcon,
  3: RotateRightIcon,
  4: ChangeHistoryIcon,
  5: GpsFixedIcon,
  6: RouteIcon,
  7: WbTwilightIcon,
}

const RAIL_WIDTH = 88
const LIST_WIDTH = 230

function LeftPanelContent({ onConceptSelect }) {
  const activeModule = useStore((s) => s.activeModule)
  const setActiveModule = useStore((s) => s.setActiveModule)
  const setSelectedConcept = useStore((s) => s.setSelectedConcept)
  const [search, setSearch] = useState('')

  const concepts = search.trim()
    ? ALL_CONCEPTS.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      )
    : CONCEPTS_BY_MODULE[activeModule] || []

  const handleModuleChange = (newModule) => {
    setActiveModule(newModule)
    setSearch('')
    // Auto-select first concept ONLY on desktop (no onConceptSelect callback).
    // On mobile, leave selection alone so the drawer stays open showing the
    // submenu — drawer only closes when the user picks a concept explicitly.
    if (!onConceptSelect) {
      const firstConcept = (CONCEPTS_BY_MODULE[newModule] || [])[0]
      if (firstConcept) setSelectedConcept(firstConcept.id)
    }
  }

  const handleConceptClick = () => {
    // Mobile: close the drawer once a concept (submenu item) is chosen.
    if (onConceptSelect) onConceptSelect()
  }

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Module navigation rail */}
      <Box sx={{
        width: RAIL_WIDTH,
        minWidth: RAIL_WIDTH,
        height: '100%',
        background: '#070D1A',
        borderRight: '1px solid rgba(0,229,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        py: 1,
        overflow: 'hidden',
      }}>
        {MODULES.map((m) => {
          const IconComp = MODULE_ICONS[m.id]
          const active = activeModule === m.id && !search
          return (
            <Tooltip key={m.id} title={m.name} placement="right" arrow>
              <Box
                onClick={() => handleModuleChange(m.id)}
                sx={{
                  py: 1.4, px: 0.5,
                  mx: 0.7, my: 0.2,
                  borderRadius: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  position: 'relative',
                  background: active ? 'rgba(0,229,255,0.10)' : 'transparent',
                  transition: 'all 160ms ease',
                  '&:hover': { background: active ? 'rgba(0,229,255,0.14)' : 'rgba(255,255,255,0.04)' },
                  '&::before': active ? {
                    content: '""',
                    position: 'absolute',
                    left: -7,
                    top: '20%', bottom: '20%',
                    width: 3,
                    borderRadius: '0 3px 3px 0',
                    background: '#00E5FF',
                    boxShadow: '0 0 8px rgba(0,229,255,0.6)',
                  } : {},
                }}
              >
                {IconComp && (
                  <IconComp sx={{
                    fontSize: 22,
                    color: active ? '#00E5FF' : '#5A7090',
                    transition: 'color 160ms ease',
                  }} />
                )}
                <Typography sx={{
                  fontSize: '0.62rem',
                  fontWeight: active ? 600 : 500,
                  color: active ? '#00E5FF' : '#7A8FA8',
                  letterSpacing: 0.3,
                  fontFamily: '"Inter", sans-serif',
                  textAlign: 'center',
                  lineHeight: 1.1,
                }}>
                  {m.shortName}
                </Typography>
              </Box>
            </Tooltip>
          )
        })}
      </Box>

      {/* Concept list */}
      <Box sx={{
        width: LIST_WIDTH,
        minWidth: LIST_WIDTH,
        height: '100%',
        background: '#080F1E',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <Box sx={{ px: 2, pt: 1.8, pb: 1, flexShrink: 0 }}>
          <Typography sx={{
            color: '#E8F0F8',
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.95rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}>
            {search ? 'Search Results' : MODULES.find(m => m.id === activeModule)?.name}
          </Typography>
          {!search && (
            <Typography sx={{
              color: '#5A7090',
              fontSize: '0.7rem',
              fontWeight: 400,
              fontFamily: '"Inter", sans-serif',
              mt: 0.2,
            }}>
              {concepts.length} concept{concepts.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        <Box sx={{ px: 1.5, pb: 1, flexShrink: 0 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: '#5A7090' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 2,
                fontSize: '0.82rem',
                fontFamily: '"Inter", sans-serif',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                '&:hover fieldset': { borderColor: 'rgba(0,229,255,0.25)' },
                '&.Mui-focused fieldset': { borderColor: '#00E5FF' },
              },
              '& input': { color: '#C8D8E8', fontFamily: '"Inter", sans-serif' },
              '& input::placeholder': { color: '#5A7090', opacity: 1 },
            }}
          />
        </Box>

        <Box sx={{
          flex: 1, overflowY: 'auto', px: 0.8, pb: 1.5,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(0,229,255,0.2)', borderRadius: 2 },
        }}>
          {concepts.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ color: '#5A7090', fontSize: '0.8rem' }}>
                No concepts found
              </Typography>
            </Box>
          )}
          {concepts.map((concept) => (
            <Box key={concept.id} onClick={handleConceptClick}>
              <ConceptItem concept={concept} searchTerm={search} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export default function LeftPanel() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const mobileMenuOpen = useStore((s) => s.mobileMenuOpen)
  const setMobileMenuOpen = useStore((s) => s.setMobileMenuOpen)

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: RAIL_WIDTH + LIST_WIDTH,
            background: '#080F1E',
            borderRight: '1px solid rgba(0,229,255,0.06)',
          },
        }}
      >
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 5 }}>
          <IconButton size="small" onClick={() => setMobileMenuOpen(false)} sx={{ color: '#8B9CB8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <LeftPanelContent onConceptSelect={() => setMobileMenuOpen(false)} />
      </Drawer>
    )
  }

  return (
    <Box sx={{ height: '100%', flexShrink: 0, borderRight: '1px solid rgba(0,229,255,0.06)' }}>
      <LeftPanelContent />
    </Box>
  )
}
