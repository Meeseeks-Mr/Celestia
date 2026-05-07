import { create } from 'zustand'

const useStore = create((set, get) => ({
  // UI state
  splashDone: false,
  activeModule: 1,
  selectedConcept: null,
  settingsOpen: false,
  helpOpen: false,

  // Observer position — default to central Arabian Sea
  observerLat: 15.5,
  observerLon: 65.0,
  observerLocationLabel: 'Arabian Sea',
  isDraggingObserver: false,
  geolocationTried: false,
  pendingObserverMove: null, // { lat, lon } when click confirmation pending

  // Animation
  animationSpeed: 1,
  isPaused: false,
  earthRotationAngle: 0,

  // Settings
  earthRotation: false,
  showStars: true,
  showLabels: true,
  soundEnabled: false,
  mobileMenuOpen: false,
  mobilePanelState: 'partial', // 'peek' | 'partial' | 'expanded'

  // Live computed values
  ghaSun: 187.56,
  lhaSun: 187.66,
  decSun: 14.37,
  altSun: 38.68,
  azSun: 192.0,

  // Actions
  setSplashDone: () => set({ splashDone: true }),
  setActiveModule: (m) => set({ activeModule: m }),
  setSelectedConcept: (id) => set({ selectedConcept: id }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  setHelpOpen: (v) => set({ helpOpen: v }),
  setObserverLat: (lat) => set({ observerLat: Math.max(-89.5, Math.min(89.5, lat)) }),
  setObserverLon: (lon) => {
    let l = lon
    while (l > 180) l -= 360
    while (l < -180) l += 360
    set({ observerLon: l })
  },
  setObserverPosition: (lat, lon, label) => set({
    observerLat: Math.max(-89.5, Math.min(89.5, lat)),
    observerLon: ((lon + 540) % 360) - 180,
    observerLocationLabel: label || 'Custom Position',
  }),
  setObserverLocationLabel: (label) => set({ observerLocationLabel: label }),
  setIsDraggingObserver: (v) => set({ isDraggingObserver: v }),
  setPendingObserverMove: (v) => set({ pendingObserverMove: v }),
  setGeolocationTried: (v) => set({ geolocationTried: v }),
  setAnimationSpeed: (s) => set({ animationSpeed: s }),
  setIsPaused: (v) => set({ isPaused: v }),
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
  setEarthRotation: (v) => set({ earthRotation: v }),
  setShowStars: (v) => set({ showStars: v }),
  setShowLabels: (v) => set({ showLabels: v }),
  setSoundEnabled: (v) => set({ soundEnabled: v }),
  setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),
  setMobilePanelState: (v) => set({ mobilePanelState: v }),
  cycleMobilePanelState: () => set((s) => ({
    mobilePanelState: s.mobilePanelState === 'peek' ? 'partial'
                     : s.mobilePanelState === 'partial' ? 'expanded'
                     : 'peek',
  })),
  setEarthRotationAngle: (a) => set({ earthRotationAngle: a }),
  updateLiveValues: (vals) => set(vals),
}))

export default useStore
