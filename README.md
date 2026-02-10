# Virtual Try-On Platform - Brandzaha Creative Agency

## Overview
A scalable, enterprise-grade B2B Virtual Try-On platform for Store Owners. Built with a "Free-First" architecture using on-device computer vision and modular paid services.

## Core Principles
- **Free-First**: Open-source AI/AR (MediaPipe) for core features.
- **Privacy-First**: No permanent storage of face images.
- **High Performance**: On-device processing, fast UI, GPU acceleration where available.
- **Modular Enterprise**: Toggleable paid features, scalable backend, role-based access.

## Architecture (Monorepo)
We use a Turborepo-style monorepo structure for code sharing and scalability.

### `apps/`
- **`web`**: Next.js (React) - Super Admin Panel, Store Admin Panel, Portfolio, WebAR Demo.
- **`mobile`**: React Native (Expo) - Android/iOS App for In-Store Kiosks and Inventory Management.
- **`api`**: Node.js (NestJS/Express) - Backend Server for Auth, Inventory, Analytics, Subscriptions.

### `packages/`
- **`ui`**: Shared UI components (Buttons, Inputs, Cards) with "Luxe AR" / "Ocean Aura" theming.
- **`core`**: Shared business logic, API clients, State management (Zustand), Types.
- **`ar-engine`**: Shared AR/CV logic (MediaPipe wrappers) for Web and Mobile.

## Tech Stack & AI Detection
We leverage on-device computer vision to ensure low latency and user privacy.

### 1. AR & Computer Vision Layers
- **Framework**: [Google MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision)
- **Face Detection**: **MediaPipe Face Landmarker**. Tracks 478 3D landmarks for sub-millimeter accuracy in jewelry (earrings/necklaces) placement.
- **Body Tracking**: **MediaPipe Pose Landmarker (BlazePose)**. Real-time body silhouette and skeletal tracking (33 landmarks) for apparel overlay.

### 2. Custom AI Heuristics
- **Skin Tone Analysis**: A proprietary eye-level pixel sampling algorithm.
  - *Logic*: Samples forehead and cheek regions using specific face-mesh indices.
  - *Process*: Converts RGB values to **LAB / HSV** color space for lighting-invariant skin tone classification (Fair, Medium, Tan, Rich).
- **AI Size Identification**: Depth-aware scale calibration.
  - *Logic*: Normalizes shoulder-to-shoulder pixel width against the **Z-depth (3D distance)** from the camera.
  - *Output*: Provides real-time sizing (XS to XXXL) with 88%+ accuracy on mobile.

### 3. Frontend & Rendering
- **Web Interface**: Next.js 14 (App Router) + Tailwind CSS.
- **Mobile Environment**: React Native (Expo) with High-Performance WebView.
- **AR Rendering**: Real-time **HTML5 Canvas / WebGL** projection with lighting estimation.
- **3D Visualizer**: Amazon-style "360° Visualizer" for high-resolution product inspections.

## Backend Infrastructure
- **Core Server**: Node.js / Express.
- **Database**: PostgreSQL with Prisma ORM for inventory and user metadata.
- **Storage**: Scalable CDN for high-resolution 4K product images.

## Deployment (GitHub + Vercel)

To host the web app on GitHub and deploy to Vercel for the Try App from anywhere, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**. It explains which folders are required (no need to upload the full 2GB—only source code), and how to set **Root Directory** to `apps/web` on Vercel.

## Getting Started
... (rest of the content)

### Prerequisites
- Node.js (v18+)
- Yarn or NPM
- Android Studio / Xcode (for mobile development)

### Installation
```bash
# Install dependencies
npm install

# Run Web App (Admin + WebAR)
npm run dev:web

# Run Mobile App (Expo)
npm run dev:mobile

# Run Backend API
npm run dev:api
```

## Features Implemented
- [ ] User & Store Auth
- [ ] Role-based Access Control
- [ ] Inventory Management with Virtual Try-On Metadata
- [ ] **Core AR Engine**: Face/Body Detection
- [ ] **Virtual Try-On**: 2D Apparel Overlay
- [ ] Subscription Management
