# Virtual Try-On Platform - Brandzaha Creative Agency

## Overview
A scalable, enterprise-grade B2B Virtual Try-On platform for Store Owners. Built with a "Free-First" architecture using on-device computer vision and modular paid services.

**This folder is the Web app only** – for testing core functionality. Mobile app will be developed later.

## Core Principles
- **Free-First**: Open-source AI/AR (MediaPipe) for core features.
- **Privacy-First**: No permanent storage of face images.
- **High Performance**: On-device processing, fast UI, GPU acceleration where available.
- **Modular Enterprise**: Toggleable paid features, scalable backend, role-based access.

## Tech Stack (Web)
- **Framework**: Next.js (App Router) + Tailwind CSS.
- **AR & Computer Vision**: [Google MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision) – Face Landmarker, Pose Landmarker (BlazePose).
- **Rendering**: Real-time HTML5 Canvas / WebGL with lighting estimation.

## Deployment (GitHub + Vercel)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for hosting on GitHub and deploying to Vercel for the Try App.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or Yarn

### Installation
```bash
# Install dependencies
npm install

# Run Web App (Admin + WebAR + Store Demo)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production
```bash
npm run build
npm run start
```

## Features (Web)
- [ ] User & Store Auth
- [ ] Role-based Access Control
- [ ] Inventory Management with Virtual Try-On Metadata
- [ ] **Core AR Engine**: Face/Body Detection
- [ ] **Virtual Try-On**: 2D Apparel Overlay (AR Mirror, Store Demo)
- [ ] Subscription Management
