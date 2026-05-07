import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00E5FF', dark: '#00B2CC', light: '#73EFFF', contrastText: '#050A14' },
    secondary: { main: '#FFB830', dark: '#CC8F00', light: '#FFCF6B', contrastText: '#050A14' },
    error: { main: '#FF6B6B' },
    warning: { main: '#FFB830' },
    info: { main: '#8B7CF8' },
    success: { main: '#00E676' },
    background: { default: '#050A14', paper: '#0A1628' },
    text: { primary: '#E8F0F8', secondary: '#8B9CB8', disabled: '#3A4A5C' },
    divider: 'rgba(0, 229, 255, 0.10)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
    h1: { fontFamily: '"Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.015em' },
    h3: { fontFamily: '"Inter", sans-serif', fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontFamily: '"Inter", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Inter", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Inter", sans-serif', fontWeight: 600 },
    subtitle1: { fontFamily: '"Inter", sans-serif', fontWeight: 500 },
    subtitle2: { fontFamily: '"Inter", sans-serif', fontWeight: 500 },
    body1: { fontFamily: '"Inter", sans-serif', fontWeight: 400, lineHeight: 1.6 },
    body2: { fontFamily: '"Inter", sans-serif', fontWeight: 400, fontSize: '0.85rem' },
    button: { fontFamily: '"Inter", sans-serif', fontWeight: 500, textTransform: 'none' },
    caption: { fontFamily: '"Roboto Mono", monospace', fontSize: '0.72rem' },
    overline: { fontFamily: '"Inter", sans-serif', letterSpacing: 1.5, fontWeight: 500 },
  },
  components: {
    MuiTooltip: {
      defaultProps: { arrow: true, enterDelay: 400 },
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0D1F3C',
          border: '1px solid rgba(0,229,255,0.20)',
          borderRadius: 6,
          padding: '8px 12px',
          maxWidth: 300,
          fontFamily: '"Inter", sans-serif',
          fontSize: '0.78rem',
          fontWeight: 400,
          lineHeight: 1.5,
          color: '#C8D8E8',
          boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
        },
        arrow: { color: '#0D1F3C' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontFamily: '"Inter", sans-serif', fontWeight: 500 },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: '#080F1E', backgroundImage: 'none' } } },
    MuiTab: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif', fontWeight: 500, fontSize: '0.78rem', minHeight: 44 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: '"Inter", sans-serif', fontSize: '0.72rem', fontWeight: 500 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0F1A2E',
          backgroundImage: 'none',
          border: '1px solid rgba(0,229,255,0.18)',
          borderRadius: 12,
        },
      },
    },
  },
  shape: { borderRadius: 8 },
  // Slow default MUI transitions for a calmer, more deliberate feel.
  transitions: {
    duration: {
      shortest: 200,
      shorter: 260,
      short: 320,
      standard: 400,
      complex: 500,
      enteringScreen: 340,
      leavingScreen: 280,
    },
  },
})

export default theme
