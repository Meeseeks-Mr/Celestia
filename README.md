# Celestia — Astro Navigation Visualizer

> **Astro Navigation Concepts …. Made easy.**

Celestia is an interactive 3D web app that turns abstract celestial-navigation theory into something you can *see*, rotate, and play with. Pick any concept — from Latitude to the PZX triangle to a full Celestial Fix to Earth's magnetic field — and watch it materialize live on a textured Earth and a surrounding celestial sphere, with the camera automatically reframing for the best angle.

Designed as a friendly teaching tool: simple language, gentle animations, and a layout that works on phones, tablets, and desktops.

**Created and developed by [dio.stesso](mailto:dio.stesso@gmail.com)**

---

## What it does

### 69 concepts across 8 modules

| Module | What's inside |
| ------ | ------------- |
| **🌍 Earth & Sky Basics** | Earth, Observer, Zenith, Nadir, Horizon, Celestial Sphere / Equator / Poles, Meridian, Prime Meridian, Celestial Hemisphere |
| **📐 Coordinates** | Latitude, Longitude, Observer Position, Equator & Parallels, Great / Small / Vertical / Prime-Vertical Circles, Declination, GHA, LHA, SHA, Right Ascension, Hour Circle, First Point of Aries, Altitude, Zenith Distance, Azimuth, Bearing & Amplitude |
| **⏱️ Motion & Time** | Diurnal Motion, Annual Motion (Ecliptic), Obliquity, Sidereal vs Solar Time, Rising / Setting, Culmination, Upper / Lower Transit, LAN, Equation of Time, Circumpolar Stars |
| **🔺 PZX Triangle** | Overview + each vertex (Pole, Zenith, Body) and each side (Co-latitude, Polar Distance, Zenith Distance), interior Azimuth and LHA angles, Altitude equation |
| **📌 Celestial Fix** | Geographic Position, Position Circle, Line of Position, full step-animated Fix, Intercept method, Running Fix |
| **✈️ Route Geometry** | Great-Circle Route, multi-turn Rhumb Line (true Mercator-derived loxodrome), Vertex |
| **🌆 Twilight** | Civil / Nautical / Astronomical bands, day/night Terminator |
| **🧲 Magnetic Earth** | Magnetic Poles, Magnetic vs Geographic Poles, dipole Magnetic Field with directional arrows, Magnetic Meridians, Variation (Declination), Magnetic Compass, Gyro Compass, True vs Magnetic Direction |

### What you can actually do

- **Click any concept** → smooth camera transition + 3D visualization on Earth and/or the celestial sphere.
- **Click anywhere on Earth** → two-stage confirmation dialog → observer relocates, all observer-dependent concepts update live (LHA, Az, Alt, Variation, etc.).
- **Auto IP geolocation** on first load (with Arabian Sea as a graceful fallback if blocked).
- **Smart auto-framing** — Zenith-up perspective for observer-centric concepts (horizon, alt-az, PZX); North-up for sky-centered concepts (declination, GHA, ecliptic).
- **Animated celestial bodies** that actually trace their paths (diurnal motion, ecliptic, rising/setting, sub-solar point).
- **Step-animated Celestial Fix** — a 20-second loop that shows how three sights become a fix, position circles and all.
- **Rich descriptions** with school-grade analogies, technical tooltips, formulas, and cross-links to related concepts.
- **Live readouts** — Position, GHA, LHA, Declination, Altitude, Azimuth, plus pause and time-speed controls in the bottom bar.
- **Always-visible reference geometry** — polar axis and observer's horizon ring stay on so you never lose your bearings.
- **Magnetic field with physics-correct direction arrows** — field lines drawn as a tilted dipole, with cone arrowheads showing the conventional N → S external flow (and a note on why Earth's "North Magnetic Pole" is technically a magnetic *south*).

### Mobile-first, desktop-rich

- **Desktop**: 88 px vertical module rail + 230 px concept list + dedicated description panel + 3D canvas + bottom readout bar.
- **Mobile**: collapsible drawer with module rail and concept list, plus a non-blocking 3-state bottom sheet (peek / partial / expanded) and a floating concept chip on the canvas — the visualization stays visible and re-centers itself as the sheet resizes.

---

## Installation & running locally

You need **Node.js 18+** and **npm**.

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/celestia.git
cd celestia

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open <http://localhost:5173/> — Vite will hot-reload as you edit.

### Production build

```bash
npm run build      # creates ./dist
npm run preview    # serves ./dist locally for verification
```

---

## Hosting on GitHub Pages

The repo is pre-configured for GitHub Pages:

- `vite.config.js` uses `base: './'` so assets resolve from any URL path.
- Earth textures load via `import.meta.env.BASE_URL` so they work on subpaths (e.g. `/celestia/`).
- `gh-pages` is wired up as a dev dependency.

```bash
# Publish (or re-publish) the live site
npm run deploy
```

This builds to `dist/` and pushes it to a `gh-pages` branch on your remote. In the repo's **Settings → Pages**, set **Source: `gh-pages` branch / root**. Your site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

---

## Project layout

```
celestia/
├── public/textures/                NASA Blue Marble (day, normal, specular, clouds)
├── src/
│   ├── App.jsx                     Root + IP geolocation
│   ├── main.jsx                    Entry, theme provider
│   ├── theme.js                    MUI dark theme (Inter, Roboto Mono)
│   ├── store/useStore.js           Zustand store (concept, observer, mobile state)
│   ├── concepts/
│   │   ├── index.js                MODULES + ALL_CONCEPTS registry
│   │   └── module1..8.js           69 concepts: descriptions, tooltips, formulas
│   ├── components/
│   │   ├── MainLayout.jsx          Responsive layout
│   │   ├── TopBar.jsx              Header + mobile menu trigger
│   │   ├── LeftPanel/              Module rail + concept list
│   │   ├── RightPanel.jsx          Description panel (desktop)
│   │   ├── BottomBar.jsx           Live readouts + speed controls
│   │   ├── SplashScreen.jsx        Animated splash
│   │   ├── SettingsPanel.jsx       Observer position, scene toggles
│   │   ├── MoveObserverDialog.jsx  Two-stage observer placement
│   │   ├── MobileConceptChip.jsx   Floating chip on visualization
│   │   ├── MobileBottomSheet.jsx   Three-state resizable info panel
│   │   └── Viewport/
│   │       ├── SceneWrapper.jsx    <Canvas>, OrbitControls
│   │       ├── Scene.jsx           Lights, polar axis, always-on horizon
│   │       ├── Earth.jsx           Textured Earth, atmosphere, click-to-place
│   │       ├── CelestialSphere.jsx
│   │       ├── Observer.jsx        Marker + lat/lon ↔ Vec3 utilities
│   │       ├── CameraController.jsx  Smooth lerp + auto-derived view mode
│   │       └── ConceptOverlay.jsx  All 60+ visualization components
│   └── styles/globals.css
├── index.html
├── vite.config.js                  base: './' for GitHub Pages
└── package.json
```

---

## Tech stack

- **React 18** + **Vite** — fast UI, instant HMR, lean production bundles
- **Three.js** + **@react-three/fiber** + **@react-three/drei** — declarative 3D
- **Material UI v5** (dark theme) — components, layout primitives, breakpoints
- **Zustand** — minimal global state
- **Framer Motion** — splash + panel transitions
- **Inter** + **Roboto Mono** — typography (Google Fonts)

---

## Coordinate convention

`lat=0, lon=0 → (0, 0, +R)` — Greenwich faces +Z (camera at startup). Conversion helpers live in `src/components/Viewport/Observer.jsx` (`latLonToVec3`, `vec3ToLatLon`). The Earth texture is offset 0.25 in U so the standard equirectangular Blue Marble image aligns with this convention.

---

## Credits

- **Concept, design, and development:** [dio.stesso](mailto:dio.stesso@gmail.com)
- **Earth imagery:** NASA Blue Marble
- **Open-source libraries:** React, Three.js, MUI, Zustand, Framer Motion, Vite

---

## License

MIT — fork it, remix it, share it. If it helps a student understand the night sky a little better, that's the point.

---

*"The sky is not the limit. It is the beginning of understanding."*
