# Celestia — Astro Navigation Visualizer

An interactive 3D web app that makes celestial-navigation concepts spatially obvious. Pick any term — Zenith, GHA, the PZX triangle, a Celestial Fix — and watch it materialize on a live globe and celestial sphere.

Built with React, Three.js (@react-three/fiber), Material UI (dark mode), Zustand, and Framer Motion.

**Developed by dio.stesso**

---

## Features

- **61 concepts across 7 modules** — Earth & Sky Basics, Coordinates, Motion & Time, the PZX Triangle, Celestial Fix, Route Geometry, Twilight
- **Real Earth texture** with day/night terminator (the night side stays dimly visible)
- **Click anywhere on Earth** to move the observer (with confirmation dialog)
- **Auto IP geolocation** on first load (with Arabian Sea as a fallback default)
- **Auto view modes** — Zenith-up for observer-perspective concepts, North-up for sky-centered views
- **Animated motion paths** — Sun and stars actually move along their paths (diurnal motion, ecliptic, rising/setting)
- **Smooth camera focus** — the camera lerps to the optimal viewpoint for each concept
- **Mobile-friendly** — vertical module rail, a non-blocking three-state bottom sheet, and a floating concept chip that keeps the visualization always visible
- **Live coordinates** in the bottom bar (Position, GHA, LHA, Dec, Alt, Az), pause + speed controls

---

## Quick start

Requires **Node 18+** and **npm**.

```bash
# Install dependencies
npm install

# Run the dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

---

## Hosting on GitHub Pages

The project is pre-configured for GitHub Pages: `vite.config.js` uses `base: './'` so assets resolve under any URL path, and `gh-pages` is wired up as a dev dependency.

```bash
# One-time setup (already done if you cloned this repo)
npm install

# Each time you want to publish:
npm run deploy
```

This builds the site and pushes it to a `gh-pages` branch. In the repo's **Settings → Pages**, set the source to the `gh-pages` branch (root). Your site will be live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

---

## Project layout

```
celestia/
├── public/
│   └── textures/                  Earth day/normal/specular/clouds (NASA Blue Marble)
├── src/
│   ├── App.jsx                    Root + IP geolocation
│   ├── main.jsx                   Entry, theme provider
│   ├── theme.js                   MUI dark-mode theme (Inter, Roboto Mono)
│   ├── store/
│   │   └── useStore.js            Zustand store (concept, observer, mobile state)
│   ├── concepts/
│   │   ├── index.js               MODULES + ALL_CONCEPTS registry
│   │   └── module1..7.js          Concept data (descriptions, tooltips, formulas, process steps)
│   ├── components/
│   │   ├── MainLayout.jsx         Responsive layout
│   │   ├── TopBar.jsx             Header + mobile menu
│   │   ├── LeftPanel/             Module rail + concept list
│   │   ├── RightPanel.jsx         Description panel (desktop)
│   │   ├── BottomBar.jsx          Live readouts + speed controls
│   │   ├── SplashScreen.jsx       Animated splash
│   │   ├── SettingsPanel.jsx      Observer position, scene toggles
│   │   ├── MoveObserverDialog.jsx Two-stage observer placement confirm
│   │   ├── MobileConceptChip.jsx  Floating chip on visualization
│   │   ├── MobileBottomSheet.jsx  Three-state resizable info panel
│   │   └── Viewport/
│   │       ├── SceneWrapper.jsx   <Canvas>, OrbitControls
│   │       ├── Scene.jsx          Lights, polar axis, always-on horizon
│   │       ├── Earth.jsx          Textured Earth, atmosphere, click-to-place
│   │       ├── CelestialSphere.jsx
│   │       ├── Observer.jsx       Observer marker + lat/lon ↔ Vec3 utilities
│   │       ├── CameraController.jsx  Smooth lerp + auto-derived view mode
│   │       └── ConceptOverlay.jsx 30+ visualization components
│   └── styles/globals.css
├── index.html
├── vite.config.js                 base: './' for GitHub Pages compatibility
└── package.json
```

---

## Tech stack

- **React 18** + **Vite** — UI framework, fast dev server, production bundler
- **Three.js** + **@react-three/fiber** + **@react-three/drei** — 3D scene
- **Material UI v5** (dark theme) — components, layout primitives, breakpoints
- **Zustand** — global state (no Redux boilerplate)
- **Framer Motion** — splash screen + panel transitions
- **Inter** + **Roboto Mono** — typography (Google Fonts)

---

## Coordinate convention

`lat=0, lon=0 → (0, 0, +R)` — Greenwich faces +Z (camera). Conversion helpers live in `src/components/Viewport/Observer.jsx` (`latLonToVec3`, `vec3ToLatLon`).

Earth texture is offset 0.25 in U so the standard equirectangular Blue Marble image aligns with this convention.

---

## License

MIT — feel free to fork, modify, share.

---

*"The sky is not the limit. It is the beginning of understanding."*
