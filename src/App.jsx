import React, { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import SplashScreen from './components/SplashScreen'
import MainLayout from './components/MainLayout'
import useStore from './store/useStore'

export default function App() {
  const splashDone = useStore((s) => s.splashDone)
  const setSplashDone = useStore((s) => s.setSplashDone)
  const setObserverPosition = useStore((s) => s.setObserverPosition)
  const geolocationTried = useStore((s) => s.geolocationTried)
  const setGeolocationTried = useStore((s) => s.setGeolocationTried)

  // Try IP-based geolocation once on app load
  useEffect(() => {
    if (geolocationTried) return
    setGeolocationTried(true)

    const controller = new AbortController()
    const tryGeo = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
        if (!res.ok) throw new Error('geo http')
        const data = await res.json()
        const lat = parseFloat(data?.latitude)
        const lon = parseFloat(data?.longitude)
        const label = [data?.city, data?.region, data?.country_name].filter(Boolean).join(', ') || 'Your Location'
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          setObserverPosition(lat, lon, label)
        }
      } catch (e) {
        // Silently fall back to Arabian Sea (already set as default in the store)
      }
    }
    tryGeo()
    return () => controller.abort()
  }, [geolocationTried, setGeolocationTried, setObserverPosition])

  return (
    <>
      <AnimatePresence>
        {!splashDone && <SplashScreen onDone={setSplashDone} />}
      </AnimatePresence>
      {splashDone && <MainLayout />}
    </>
  )
}
