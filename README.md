TripGuard
A lightweight Expo-based React Native app built with TypeScript.

Overview
- Tech: React Native, Expo, TypeScript
- Entry: index.ts / index.web.ts
- Primary route/entry points are defined in App.tsx and src/

Quick Start
- Install dependencies: npm install
- Start the app (dev): npm run start
- Web development: npm run web
- Build web: npm run build:web
- Android: npm run android
- iOS: npm run ios

Quick helper
- Start from the repo root: bash scripts/start_dev.sh

Project structure (high level)
- App.tsx: main app component
- src/: application source code (screens, components, store, etc.)
- assets/: images and icons used by the app
- index.ts / index.web.ts: entry points for native and web

How to contribute
- Create a feature branch, implement changes, run the app locally, and submit a PR.
- See existing code patterns in src/ for conventions.

Troubleshooting
- If npm install fails due to missing dependencies, ensure Node.js is up to date.
- For Expo-specific issues, ensure the Expo CLI is installed and configured.

License and credits
- This repo is a personal TripGuard project in your workspace.
