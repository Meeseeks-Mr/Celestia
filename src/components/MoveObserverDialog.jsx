import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import useStore from '../store/useStore'

export default function MoveObserverDialog() {
  const pending = useStore((s) => s.pendingObserverMove)
  const setPending = useStore((s) => s.setPendingObserverMove)
  const setObserverPosition = useStore((s) => s.setObserverPosition)

  const handleConfirm = () => {
    if (pending) {
      setObserverPosition(pending.lat, pending.lon, 'Custom')
    }
    setPending(null)
  }

  const handleCancel = () => setPending(null)

  return (
    <Dialog
      open={!!pending}
      onClose={handleCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          background: '#0F1A2E',
          border: '1px solid rgba(0,229,255,0.20)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{
        fontFamily: '"Inter", sans-serif',
        fontWeight: 600,
        fontSize: '1rem',
        color: '#E8F0F8',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        pb: 1,
      }}>
        <PlaceOutlinedIcon sx={{ color: '#00E5FF', fontSize: 20 }} />
        Move observer here?
      </DialogTitle>
      <DialogContent>
        <Typography sx={{
          color: '#A8BBCC',
          fontSize: '0.85rem',
          mb: 2,
          fontFamily: '"Inter", sans-serif',
          lineHeight: 1.55,
        }}>
          The observer position will move to a new location on Earth. All visualizations
          will update to reflect the new horizon, zenith, and sky orientation.
        </Typography>
        {pending && (
          <Box sx={{
            background: 'rgba(0,229,255,0.06)',
            border: '1px solid rgba(0,229,255,0.18)',
            borderRadius: 2,
            px: 2, py: 1.4,
          }}>
            <Typography sx={{
              fontFamily: '"Roboto Mono", monospace',
              fontSize: '0.78rem',
              color: '#00E5FF',
              fontWeight: 500,
            }}>
              {pending.lat.toFixed(2)}°{pending.lat >= 0 ? 'N' : 'S'} · {Math.abs(pending.lon).toFixed(2)}°{pending.lon >= 0 ? 'E' : 'W'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.4 }}>
        <Button
          onClick={handleCancel}
          sx={{
            color: '#8B9CB8',
            fontFamily: '"Inter", sans-serif',
            fontWeight: 500,
            '&:hover': { background: 'rgba(255,255,255,0.05)' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          sx={{
            background: '#00E5FF',
            color: '#050A14',
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            '&:hover': { background: '#73EFFF' },
            px: 2.5,
          }}
        >
          Move Observer
        </Button>
      </DialogActions>
    </Dialog>
  )
}
