"use client";

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, X, RefreshCw, Smartphone, Check, ShieldCheck, UserCheck, AlertCircle, Plus, Minus } from 'lucide-react';
import { FilesetResolver, FaceLandmarker, PoseLandmarker, DrawingUtils, HandLandmarker } from '@mediapipe/tasks-vision';
import { calculateSkinTone, classifySkinTone, getBodyMeasurements, stabilityScore } from '../../utils/ar-math';
import type { BodyMeasurementResult, LandmarkPoint } from '../../utils/ar-math';
import type { MirrorMode, ProductTryOnConfig, TrackingMetrics } from '@/lib/ar/types';
import { mergeFitProfile } from '@/lib/ar/calibration/fit-profiles';
import { clampVelocity, ema, smoothAngle, smoothVec2 } from '@/lib/ar/tracking/smoothing';
import { confidenceFromVisibility, emitTelemetry, estimateFps, getTelemetrySnapshot } from '@/lib/ar/metrics';
import { estimateFaceShape, recommendationsForFaceShape, type FaceShape } from '@/lib/ar/render/recommendations';

interface VirtualMirrorProps {
    onClose: () => void;
    mode: MirrorMode;
    productImage?: string;
    productConfig?: ProductTryOnConfig;
}

const DEFAULT_APPAREL_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 760">
        <defs>
            <linearGradient id="shirtFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2a8a84"/>
                <stop offset="100%" stop-color="#0d5f5a"/>
            </linearGradient>
        </defs>
        <path d="M160 150 L240 80 Q300 45 360 80 L440 150 L560 235 L505 330 L455 300 L410 720 L190 720 L145 300 L95 330 L40 235 Z"
              fill="url(#shirtFill)" stroke="#e6fffa" stroke-opacity="0.35" stroke-width="12" />
        <path d="M245 90 Q300 65 355 90 Q350 145 300 160 Q250 145 245 90 Z"
              fill="#083b39" fill-opacity="0.85" />
    </svg>`
)}`;
const DEFAULT_EYEWEAR_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 300">
        <defs>
            <linearGradient id="frameShade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2b2f34"/>
                <stop offset="100%" stop-color="#14181d"/>
            </linearGradient>
        </defs>
        <rect x="40" y="70" rx="55" ry="55" width="280" height="160" fill="url(#frameShade)" />
        <rect x="460" y="70" rx="55" ry="55" width="280" height="160" fill="url(#frameShade)" />
        <rect x="300" y="125" rx="15" ry="15" width="180" height="28" fill="#111417" />
        <rect x="82" y="102" rx="36" ry="36" width="196" height="96" fill="#6f8798" fill-opacity="0.45" />
        <rect x="502" y="102" rx="36" ry="36" width="196" height="96" fill="#6f8798" fill-opacity="0.45" />
        <path d="M40 150 C 18 145 8 150 0 165" stroke="#15191e" stroke-width="16" fill="none" stroke-linecap="round"/>
        <path d="M740 150 C 762 145 772 150 780 165" stroke="#15191e" stroke-width="16" fill="none" stroke-linecap="round"/>
    </svg>`
)}`;
const DEFAULT_WATCH_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 520">
      <defs>
        <linearGradient id="strap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2f3136"/>
          <stop offset="100%" stop-color="#181a1f"/>
        </linearGradient>
        <radialGradient id="dial" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stop-color="#f5f6fa"/>
          <stop offset="100%" stop-color="#bcc3cf"/>
        </radialGradient>
      </defs>
      <rect x="200" y="0" width="120" height="520" rx="34" fill="url(#strap)"/>
      <circle cx="260" cy="260" r="126" fill="#11161f" />
      <circle cx="260" cy="260" r="110" fill="url(#dial)" stroke="#2a2f3b" stroke-width="10"/>
      <circle cx="260" cy="260" r="10" fill="#2b3444"/>
      <line x1="260" y1="260" x2="260" y2="190" stroke="#26314a" stroke-width="10" stroke-linecap="round"/>
      <line x1="260" y1="260" x2="312" y2="260" stroke="#26314a" stroke-width="8" stroke-linecap="round"/>
    </svg>`
)}`;

export default function VirtualMirror({ onClose, mode, productImage, productConfig }: VirtualMirrorProps) {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [arReady, setArReady] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [capturePreview, setCapturePreview] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

    const [measurements, setMeasurements] = useState<BodyMeasurementResult | null>(null);
    const [skinTone, setSkinTone] = useState<string>("");

    const [detectionStatus, setDetectionStatus] = useState({
        face: false,
        body: false,
        hand: false,
        accuracy: 0
    });

    const [viewMode, setViewMode] = useState<'live' | '3d'>('live');
    const [sizeModalOpen, setSizeModalOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [guidance, setGuidance] = useState<string>("Keep your face centered for best fit.");
    const [faceShape, setFaceShape] = useState<FaceShape>("oval");
    const [styleSuggestions, setStyleSuggestions] = useState<string[]>(recommendationsForFaceShape("oval"));
    const [imgLoading, setImgLoading] = useState(true);
    const [imgError, setImgError] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [showDebug, setShowDebug] = useState(false);
    const [guidedScan, setGuidedScan] = useState(false);
    const [guidedScanProgress, setGuidedScanProgress] = useState(0);
    const [showPrivacyNote, setShowPrivacyNote] = useState(true);
    const [trackingMetrics, setTrackingMetrics] = useState<TrackingMetrics>({
        fps: 0,
        faceConfidence: 0,
        bodyConfidence: 0,
        handConfidence: 0,
        landmarksVisible: 0,
        stability: 0
    });
    const fitProfile = mergeFitProfile(mode, productConfig?.fitProfile);
    const resolvedProductImage = productImage
        || (mode === 'apparel' ? DEFAULT_APPAREL_IMAGE : undefined)
        || (mode === 'eyewear' ? DEFAULT_EYEWEAR_IMAGE : undefined)
        || (mode === 'watch' ? DEFAULT_WATCH_IMAGE : undefined);

    // Refs for AR loop
    const requestRef = useRef<number>(0);
    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);
    const lastLandmarksRef = useRef<LandmarkPoint[] | null>(null);
    const productImgRef = useRef<HTMLImageElement | null>(null);
    const frameTimesRef = useRef<number[]>([]);
    const stabilityRef = useRef<number[]>([]);
    const frameCounterRef = useRef<number>(0);
    const smoothEyewearRef = useRef<{ x: number; y: number; rotation: number; width: number } | null>(null);
    const lastTrackLockRef = useRef<number>(0);

    // Load Product Image
    useEffect(() => {
        let preloadFrame: number | undefined;
        if (resolvedProductImage) {
            console.log("AR Engine: Loading product image", resolvedProductImage);
            preloadFrame = requestAnimationFrame(() => {
                setImgLoading(true);
                setImgError(false);
            });

            const img = new Image();
            // Keep local assets same-origin; only apply crossOrigin for remote URLs.
            if (/^https?:\/\//i.test(resolvedProductImage)) {
                img.crossOrigin = "anonymous";
            }

            // Handle cross-origin carefully
            img.onload = () => {
                console.log("AR Engine: Image loaded successfully", img.width, "x", img.height);
                productImgRef.current = img;
                setImgLoading(false);
            };
            img.onerror = (err) => {
                console.error("AR Engine: Image failed to load", err);
                productImgRef.current = null;
                setImgError(true);
                setImgLoading(false);
                emitTelemetry("asset_load_error", { mode, image: resolvedProductImage });
            };

            img.src = resolvedProductImage;
        } else {
            productImgRef.current = null;
            preloadFrame = requestAnimationFrame(() => {
                setImgLoading(false);
            });
        }

        return () => {
            productImgRef.current = null;
            if (preloadFrame) cancelAnimationFrame(preloadFrame);
        };
    }, [resolvedProductImage]);

    useEffect(() => {
        const initAR = async () => {
            // Check for secure context and mediaDevices
            if (typeof window !== 'undefined') {
                const isSecure = window.isSecureContext || window.location.hostname === 'localhost';
                if (!isSecure && window.location.protocol === 'http:') {
                    setError("Camera access blocked. Mobile browsers require HTTPS or a specifically configured 'Secure Origin'. Please use Localhost on your PC, or see the 'Pro Tip' below.");
                    setLoading(false);
                    return;
                }

                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    setError("Camera API is missing/blocked. This browser doesn't support the Virtual Try-On feature in this mode.");
                    setLoading(false);
                    return;
                }
            }

            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );

                if (mode === 'jewelry' || mode === 'eyewear') {
                    faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                            delegate: "GPU"
                        },
                        outputFaceBlendshapes: true,
                        runningMode: "VIDEO",
                        numFaces: 1
                    });
                } else if (mode === 'apparel') {
                    poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                            delegate: "GPU"
                        },
                        runningMode: "VIDEO",
                        numPoses: 1
                    });
                } else if (mode === 'watch') {
                    handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                            delegate: "GPU"
                        },
                        runningMode: "VIDEO",
                        numHands: 1
                    });
                }
                setLoading(false);
                setArReady(true);
                emitTelemetry("ar_init_ready", { mode, assetId: productConfig?.assetId });
            } catch (error) {
                console.error("Failed to load AR models", error);
                setLoading(false);
                emitTelemetry("ar_init_error", { mode });
            }
        };

        if (typeof window !== 'undefined') {
            initAR();
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            faceLandmarkerRef.current?.close();
            poseLandmarkerRef.current?.close();
            handLandmarkerRef.current?.close();
        };
    }, [mode, productConfig?.assetId]);

    const renderLoop = (rafTs: number) => {
        if (
            webcamRef.current &&
            webcamRef.current.video &&
            webcamRef.current.video.readyState === 4 &&
            canvasRef.current
        ) {
            const video = webcamRef.current.video;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const startTimeMs = rafTs;
                frameTimesRef.current.push(startTimeMs);
                if (frameTimesRef.current.length > 30) frameTimesRef.current.shift();
                const fps = estimateFps(frameTimesRef.current);
                frameCounterRef.current += 1;

                if ((mode === 'jewelry' || mode === 'eyewear') && faceLandmarkerRef.current) {
                    const detections = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);
                    if (detections.faceLandmarks && detections.faceLandmarks.length > 0) {
                        setDetectionStatus(prev => ({ ...prev, face: true, hand: false, accuracy: 95 }));
                        if (startTimeMs - lastTrackLockRef.current > 2000) {
                            emitTelemetry("face_lock", { mode });
                            lastTrackLockRef.current = startTimeMs;
                        }
                        for (const landmarks of detections.faceLandmarks) {
                            lastLandmarksRef.current = landmarks;

                            if (!skinTone && frameCounterRef.current % 20 === 0) {
                                try {
                                    const tone = calculateSkinTone(ctx, landmarks);
                                    if (tone) {
                                        const classification = classifySkinTone(tone);
                                        setSkinTone(classification);
                                    }
                                } catch (e) { }
                            }

                            if (mode === 'jewelry') {
                                // Draw Product (Necklace/Earrings)
                                const chin = landmarks[152];
                                if (chin) {
                                    ctx.save();
                                    if (productImgRef.current) {
                                        const img = productImgRef.current;
                                        const aspectRatio = img.width / img.height;
                                        const width = 250;
                                        const height = width / aspectRatio;

                                        ctx.drawImage(
                                            img,
                                            chin.x * canvas.width - width / 2,
                                            chin.y * canvas.height - 20,
                                            width,
                                            height
                                        );
                                    } else {
                                        const gradient = ctx.createLinearGradient(
                                            chin.x * canvas.width - 100,
                                            chin.y * canvas.height,
                                            chin.x * canvas.width + 100,
                                            chin.y * canvas.height
                                        );
                                        gradient.addColorStop(0, "#8A6E3F");
                                        gradient.addColorStop(0.5, "#D4AF37");
                                        gradient.addColorStop(1, "#8A6E3F");

                                        ctx.strokeStyle = gradient;
                                        ctx.lineWidth = 4;
                                        ctx.beginPath();
                                        ctx.moveTo(chin.x * canvas.width - 60, chin.y * canvas.height + 40);
                                        ctx.quadraticCurveTo(
                                            chin.x * canvas.width,
                                            chin.y * canvas.height + 120,
                                            chin.x * canvas.width + 60,
                                            chin.y * canvas.height + 40
                                        );
                                        ctx.stroke();
                                    }
                                    ctx.restore();
                                }

                                const leftEar = landmarks[234];
                                const rightEar = landmarks[454];
                                [leftEar, rightEar].forEach((ear) => {
                                    if (ear) {
                                        ctx.save();
                                        ctx.fillStyle = "#D4AF37";
                                        ctx.shadowColor = "gold";
                                        ctx.shadowBlur = 10;
                                        ctx.beginPath();
                                        ctx.arc(ear.x * canvas.width, ear.y * canvas.height + 15, 5, 0, Math.PI * 2);
                                        ctx.fill();
                                        ctx.strokeStyle = "#D4AF37";
                                        ctx.lineWidth = 2;
                                        ctx.beginPath();
                                        ctx.moveTo(ear.x * canvas.width, ear.y * canvas.height + 20);
                                        ctx.lineTo(ear.x * canvas.width, ear.y * canvas.height + 35);
                                        ctx.stroke();
                                        ctx.fillStyle = "white";
                                        ctx.beginPath();
                                        ctx.arc(ear.x * canvas.width, ear.y * canvas.height + 35, 3, 0, Math.PI * 2);
                                        ctx.fill();
                                        ctx.restore();
                                    }
                                });
                            } else if (mode === 'eyewear') {
                                const leftEyeOuter = landmarks[33];
                                const rightEyeOuter = landmarks[263];
                                const leftTemple = landmarks[234];
                                const rightTemple = landmarks[454];
                                const noseBridge = landmarks[168] || landmarks[6];

                                if (leftEyeOuter && rightEyeOuter && noseBridge) {
                                    const lx = leftEyeOuter.x * canvas.width;
                                    const ly = leftEyeOuter.y * canvas.height;
                                    const rx = rightEyeOuter.x * canvas.width;
                                    const ry = rightEyeOuter.y * canvas.height;
                                    const dx = rx - lx;
                                    const dy = ry - ly;
                                    const eyeDistance = Math.sqrt(dx * dx + dy * dy);
                                    const rawCx = (lx + rx) / 2;
                                    const rawCy = (ly + ry) / 2;
                                    const rawRotation = Math.atan2(dy, dx);
                                    const frameWidthBase = eyeDistance * 2.25 * (fitProfile.lensScale || 1);
                                    if (!smoothEyewearRef.current) {
                                        smoothEyewearRef.current = {
                                            x: rawCx,
                                            y: rawCy,
                                            rotation: rawRotation,
                                            width: frameWidthBase
                                        };
                                    } else {
                                        const prev = smoothEyewearRef.current;
                                        const smoothed = smoothVec2({ x: prev.x, y: prev.y }, { x: rawCx, y: rawCy }, 0.34);
                                        smoothEyewearRef.current = {
                                            x: clampVelocity(prev.x, smoothed.x, canvas.width * 0.035),
                                            y: clampVelocity(prev.y, smoothed.y, canvas.height * 0.03),
                                            rotation: smoothAngle(prev.rotation, rawRotation, 0.3),
                                            width: ema(prev.width, frameWidthBase, 0.3)
                                        };
                                    }
                                    const cx = smoothEyewearRef.current.x;
                                    const cy = smoothEyewearRef.current.y;
                                    const rotation = smoothEyewearRef.current.rotation;
                                    const frameWidth = smoothEyewearRef.current.width;
                                    const frameHeight = frameWidth * 0.38;
                                    const centerY = cy + frameHeight * (fitProfile.bridgeOffset || 0.06);
                                    const lz = leftEyeOuter.z ?? 0;
                                    const rz = rightEyeOuter.z ?? 0;
                                    const yawRaw = rz - lz;
                                    const yawMag = Math.min(0.55, Math.abs(yawRaw) * 4.2);
                                    const rightIsNear = rz < lz;
                                    const nearAlpha = fitProfile.opacity || 0.95;
                                    const farAlpha = 0.25 + (0.35 * (1 - yawMag));

                                    ctx.save();
                                    ctx.translate(cx, centerY);
                                    ctx.rotate(rotation);
                                    if (productImgRef.current) {
                                        ctx.globalAlpha = 0.94;
                                        ctx.drawImage(
                                            productImgRef.current,
                                            -frameWidth / 2,
                                            -frameHeight / 2,
                                            frameWidth,
                                            frameHeight
                                        );
                                    } else {
                                        ctx.strokeStyle = "rgba(28,33,40,0.95)";
                                        ctx.lineWidth = Math.max(2, eyeDistance * 0.03);
                                        ctx.beginPath();
                                        ctx.roundRect(-frameWidth * 0.44, -frameHeight * 0.34, frameWidth * 0.36, frameHeight * 0.68, frameHeight * 0.24);
                                        ctx.roundRect(frameWidth * 0.08, -frameHeight * 0.34, frameWidth * 0.36, frameHeight * 0.68, frameHeight * 0.24);
                                        ctx.moveTo(-frameWidth * 0.08, 0);
                                        ctx.lineTo(frameWidth * 0.08, 0);
                                        ctx.stroke();
                                    }
                                    ctx.restore();

                                    if (leftTemple && rightTemple) {
                                        const leftArmStartX = lx - eyeDistance * 0.60;
                                        const rightArmStartX = rx + eyeDistance * 0.60;
                                        const leftArmStartY = ly - eyeDistance * 0.06;
                                        const rightArmStartY = ry - eyeDistance * 0.06;
                                        const leftEarX = leftTemple.x * canvas.width;
                                        const rightEarX = rightTemple.x * canvas.width;
                                        const leftEarY = (leftTemple.y * canvas.height) - eyeDistance * 0.14;
                                        const rightEarY = (rightTemple.y * canvas.height) - eyeDistance * 0.14;

                                        const drawArm = (side: 'left' | 'right') => {
                                            const isRight = side === 'right';
                                            const isNear = isRight ? rightIsNear : !rightIsNear;
                                            const alpha = isNear ? nearAlpha : farAlpha;
                                            const startX = isRight ? rightArmStartX : leftArmStartX;
                                            const startY = isRight ? rightArmStartY : leftArmStartY;
                                            const endX = isRight ? rightEarX : leftEarX;
                                            const endY = isRight ? rightEarY : leftEarY;
                                            const bend = (isRight ? 1 : -1) * eyeDistance * ((fitProfile.templeCurve || 0.28) + yawMag * 0.32);
                                            const ctrlX = (startX + endX) / 2 + bend;
                                            const ctrlY = Math.min(startY, endY) - eyeDistance * (0.12 + yawMag * 0.08);

                                            ctx.save();
                                            ctx.globalAlpha = alpha;
                                            ctx.strokeStyle = "rgba(28,33,40,0.80)";
                                            ctx.lineWidth = Math.max(2, eyeDistance * 0.017);
                                            ctx.lineCap = "round";
                                            ctx.beginPath();
                                            ctx.moveTo(startX, startY);
                                            ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
                                            ctx.stroke();
                                            ctx.restore();
                                        };

                                        drawArm('left');
                                        drawArm('right');
                                    }
                                    const faceConfidence = Math.max(0.35, 0.96 - Math.min(0.42, yawMag * 0.58));
                                    stabilityRef.current.push(eyeDistance);
                                    if (stabilityRef.current.length > 24) stabilityRef.current.shift();
                                    setTrackingMetrics((prev) => ({
                                        ...prev,
                                        fps,
                                        faceConfidence,
                                        landmarksVisible: 468,
                                        stability: stabilityScore(stabilityRef.current)
                                    }));
                                    if (frameCounterRef.current % 20 === 0) {
                                        const shape = estimateFaceShape(landmarks as LandmarkPoint[]);
                                        setFaceShape(shape);
                                        setStyleSuggestions(recommendationsForFaceShape(shape));
                                        setGuidance(
                                            faceConfidence < 0.55
                                                ? "Turn slightly toward camera and keep temples visible."
                                                : `Detected ${shape} face profile.`
                                        );
                                    }
                                }
                            }
                        }
                    } else {
                        setDetectionStatus(prev => ({ ...prev, face: false, accuracy: 0 }));
                        setTrackingMetrics((prev) => ({ ...prev, fps, faceConfidence: 0, landmarksVisible: 0 }));
                    }
                } else if (mode === 'apparel' && poseLandmarkerRef.current) {
                    const detections = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);
                    if (detections.landmarks && detections.landmarks.length > 0) {
                        setDetectionStatus(prev => ({ ...prev, body: true, hand: false, accuracy: 88 }));
                        if (startTimeMs - lastTrackLockRef.current > 2000) {
                            emitTelemetry("body_lock", { mode });
                            lastTrackLockRef.current = startTimeMs;
                        }
                        for (const landmark of detections.landmarks) {
                            lastLandmarksRef.current = landmark;

                            // Draw Product (Apparel)
                            const leftShoulder = landmark[11];
                            const rightShoulder = landmark[12];
                            const leftHip = landmark[23];
                            const rightHip = landmark[24];

                            if (leftShoulder && rightShoulder && leftHip && rightHip) {
                                const bodyConfidence = confidenceFromVisibility([leftShoulder, rightShoulder, leftHip, rightHip]);
                                setTrackingMetrics((prev) => ({
                                    ...prev,
                                    fps,
                                    bodyConfidence,
                                    landmarksVisible: landmark.length,
                                    stability: stabilityScore([Math.abs(rightShoulder.x - leftShoulder.x), Math.abs(rightHip.x - leftHip.x)])
                                }));
                                if (frameCounterRef.current % 20 === 0) {
                                    setGuidance(
                                        bodyConfidence < 0.45
                                            ? "Step back, keep shoulders and hips visible."
                                            : "Body tracking stable. You can turn slightly for side fit."
                                    );
                                }

                                // Live Size Analysis Trigger (Only if not manually selected)
                                if (!selectedSize && frameCounterRef.current % 10 === 0) {
                                    try {
                                        const m = getBodyMeasurements(landmark);
                                        if (m && m.estimatedSize) {
                                            setMeasurements(m);
                                            if (guidedScan) {
                                                const next = Math.min(100, guidedScanProgress + (m.confidence || 0.6) * 8);
                                                setGuidedScanProgress(next);
                                                if (next >= 100) {
                                                    setGuidedScan(false);
                                                    emitTelemetry("guided_scan_complete", { size: m.estimatedSize, confidence: m.confidence });
                                                }
                                            }
                                        }
                                    } catch (e) { }
                                }

                                ctx.save();
                                if (productImgRef.current && mode === 'apparel') {
                                    const img = productImgRef.current;
                                    const shoulderDx = rightShoulder.x - leftShoulder.x;
                                    const shoulderDy = rightShoulder.y - leftShoulder.y;
                                    const shoulderSpan = Math.sqrt((shoulderDx ** 2) + (shoulderDy ** 2));
                                    if (shoulderSpan > 0.03) {
                                        const bodyConfidence = confidenceFromVisibility([leftShoulder, rightShoulder, leftHip, rightHip]);
                                        if (bodyConfidence < 0.35) {
                                            ctx.restore();
                                            continue;
                                        }
                                        const shoulderAngle = Math.atan2(shoulderDy, shoulderDx);
                                        const shoulderDepthDelta = (rightShoulder.z ?? 0) - (leftShoulder.z ?? 0);
                                        const sideTurnFactor = Math.min(0.6, Math.abs(shoulderDepthDelta) * 3.4);
                                        const baseWidth = shoulderSpan * canvas.width * (fitProfile.widthScale || 2.95);
                                        const width = baseWidth * (1 - sideTurnFactor * 0.52);
                                        const aspectRatio = img.width / img.height;
                                        const naturalHeight = width / aspectRatio;
                                        const torsoCenterY = ((leftHip.y + rightHip.y) / 2) * canvas.height;
                                        const shoulderCenterY = ((leftShoulder.y + rightShoulder.y) / 2) * canvas.height;
                                        const torsoHeight = Math.max(60, (torsoCenterY - shoulderCenterY) * (fitProfile.heightScale || 1.65));
                                        const height = Math.max(naturalHeight, torsoHeight);
                                        const centerX = ((leftShoulder.x + rightShoulder.x) / 2) * canvas.width + (Math.sign(shoulderDepthDelta) * sideTurnFactor * width * 0.12);
                                        const centerY = shoulderCenterY + (height * (fitProfile.yOffset || 0.36));

                                        ctx.translate(centerX, centerY);
                                        ctx.rotate(shoulderAngle * 0.55);
                                        ctx.globalAlpha = (fitProfile.opacity || 0.9) - (sideTurnFactor * 0.18);
                                        ctx.globalCompositeOperation = fitProfile.blendMode || "multiply";
                                        ctx.drawImage(
                                            img,
                                            -width / 2,
                                            -height / 2,
                                            width,
                                            height
                                        );
                                        ctx.globalCompositeOperation = "source-over";
                                    }
                                } else {
                                    // Fallback Placeholder
                                    ctx.globalAlpha = 0.6;
                                    ctx.fillStyle = "#006D66";
                                    ctx.beginPath();
                                    ctx.moveTo(leftShoulder.x * canvas.width - 20, leftShoulder.y * canvas.height);
                                    ctx.lineTo(rightShoulder.x * canvas.width + 20, rightShoulder.y * canvas.height);
                                    ctx.lineTo(rightHip.x * canvas.width + 10, rightHip.y * canvas.height);
                                    ctx.lineTo(leftHip.x * canvas.width - 10, leftHip.y * canvas.height);
                                    ctx.closePath();
                                    ctx.fill();
                                }
                                ctx.restore();
                            }

                            // Debug skeletal dots (Optional, kept subtle)
                            const drawingUtils = new DrawingUtils(ctx);
                            drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: 'rgba(255,255,255,0.2)', lineWidth: 1 });
                        }
                    } else {
                        setDetectionStatus(prev => ({ ...prev, body: false, accuracy: 0 }));
                        setTrackingMetrics((prev) => ({ ...prev, fps, bodyConfidence: 0, landmarksVisible: 0 }));
                    }
                } else if (mode === 'watch' && handLandmarkerRef.current) {
                    const detections = handLandmarkerRef.current.detectForVideo(video, startTimeMs);
                    if (detections.landmarks && detections.landmarks.length > 0) {
                        const hand = detections.landmarks[0];
                        const wrist = hand[0];
                        const indexMcp = hand[5];
                        const pinkyMcp = hand[17];
                        if (wrist && indexMcp && pinkyMcp) {
                            const handConf = confidenceFromVisibility([wrist, indexMcp, pinkyMcp]);
                            const wx = wrist.x * canvas.width;
                            const wy = wrist.y * canvas.height;
                            const cx = (indexMcp.x + pinkyMcp.x) * 0.5 * canvas.width;
                            const cy = (indexMcp.y + pinkyMcp.y) * 0.5 * canvas.height;
                            const dx = cx - wx;
                            const dy = cy - wy;
                            const wristWidth = Math.sqrt(dx * dx + dy * dy) * (fitProfile.wristScale || 1.65);
                            const angle = Math.atan2(dy, dx);

                            if (productImgRef.current) {
                                ctx.save();
                                ctx.translate(wx, wy + wristWidth * (fitProfile.wristYOffset || -0.06));
                                ctx.rotate(angle + Math.PI / 2);
                                ctx.globalAlpha = fitProfile.opacity || 0.95;
                                ctx.drawImage(productImgRef.current, -wristWidth * 0.5, -wristWidth * 0.65, wristWidth, wristWidth * 1.3);
                                ctx.restore();
                            }
                            setDetectionStatus((prev) => ({ ...prev, face: false, body: false, hand: handConf > 0.35, accuracy: Math.round(handConf * 100) }));
                            setTrackingMetrics((prev) => ({
                                ...prev,
                                fps,
                                handConfidence: handConf,
                                landmarksVisible: hand.length,
                                stability: stabilityScore([wristWidth, Math.abs(angle)])
                            }));
                            if (frameCounterRef.current % 20 === 0) {
                                setGuidance(
                                    handConf < 0.45
                                        ? "Raise your wrist and keep it centered."
                                        : "Wrist lock stable. Rotate naturally to inspect watch."
                                );
                            }
                            if (startTimeMs - lastTrackLockRef.current > 2000) {
                                emitTelemetry("hand_lock", { mode });
                                lastTrackLockRef.current = startTimeMs;
                            }
                        }
                    } else {
                        setDetectionStatus((prev) => ({ ...prev, hand: false, accuracy: 0 }));
                        setTrackingMetrics((prev) => ({ ...prev, fps, handConfidence: 0, landmarksVisible: 0 }));
                    }
                }
            }
        }
        requestRef.current = requestAnimationFrame(renderLoop);
    };

    useEffect(() => {
        if (arReady) {
            requestRef.current = requestAnimationFrame(renderLoop);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [arReady]);



    const toggleCamera = () => {
        setFacingMode(prev => prev === "user" ? "environment" : "user");
        emitTelemetry("camera_toggle", { mode, facingMode });
    };
    const updateZoom = (nextZoom: number) => {
        const zoom = Math.max(0.6, Math.min(2.2, Number(nextZoom.toFixed(2))));
        setZoomLevel(zoom);
        emitTelemetry("zoom_change", { zoom });
    };
    const captureLook = () => {
        if (!webcamRef.current) return;
        setCapturing(true);
        const shot = webcamRef.current.getScreenshot();
        if (shot) {
            setCapturePreview(shot);
            emitTelemetry("capture_look", { mode, assetId: productConfig?.assetId });
        }
        setTimeout(() => setCapturing(false), 250);
    };
    const downloadCapture = () => {
        if (!capturePreview) return;
        const a = document.createElement("a");
        a.href = capturePreview;
        a.download = `zaha-tryon-${mode}-${Date.now()}.jpg`;
        a.click();
        emitTelemetry("capture_download", { mode, assetId: productConfig?.assetId });
    };
    const shareCapture = async () => {
        if (!capturePreview || !navigator.share) return;
        try {
            await navigator.share({
                title: "My Zaha AI Try-On",
                text: "Check my virtual try-on look.",
                url: window.location.href
            });
            emitTelemetry("capture_share", { mode, assetId: productConfig?.assetId });
        } catch {
            // user canceled share
        }
    };
    const toggleViewMode = () => {
        setViewMode((prev) => {
            const next = prev === "3d" ? "live" : "3d";
            emitTelemetry("view_mode_change", { from: prev, to: next });
            return next;
        });
    };

    useEffect(() => {
        (window as unknown as { __ZAHA_AR_TELEMETRY__?: () => unknown }).__ZAHA_AR_TELEMETRY__ = getTelemetrySnapshot;
        return () => {
            delete (window as unknown as { __ZAHA_AR_TELEMETRY__?: () => unknown }).__ZAHA_AR_TELEMETRY__;
        };
    }, []);

    const videoConstraints = {
        facingMode: (typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
            ? { ideal: facingMode }
            : undefined,
        width: { ideal: 960 },
        height: { ideal: 540 },
        aspectRatio: { ideal: 16 / 9 }
    };
    const shareSupported = typeof navigator !== "undefined" && typeof navigator.share === "function";

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in overflow-hidden">
            {/* Main AR View */}
            <div className="relative flex-1 bg-gray-900 flex items-center justify-center overflow-hidden z-10">
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-[110] bg-black/80 backdrop-blur-sm">
                        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-accent font-serif text-lg tracking-widest animate-pulse">PREPARING MAGIC...</p>
                        <p className="text-xs text-gray-500 mt-2 font-mono">Calibrating AI Sensors</p>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-[120] bg-black/95 p-8 text-center animate-fade-in">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-white font-serif text-2xl mb-4 font-bold">Camera Access Issue</h2>
                        <p className="text-white/70 text-sm max-w-md mb-8 leading-relaxed">
                            {error}
                        </p>
                        <div className="flex flex-col w-full max-w-xs gap-3">
                            <button onClick={() => window.location.reload()} className="px-8 py-4 bg-accent text-white rounded-full font-bold hover:shadow-lg hover:shadow-accent/20 transition-all active:scale-95">Re-Try Connection</button>
                            <button onClick={onClose} className="px-8 py-4 bg-white/10 text-white border border-white/10 rounded-full font-bold hover:bg-white/20 transition-all">Exit Mirror</button>
                        </div>
                    </div>
                )}

                {!loading && !error && (
                    <div
                        className="absolute inset-0"
                        style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
                    >
                        <Webcam
                            ref={webcamRef}
                            className={`absolute inset-0 w-full h-full object-contain bg-black ${facingMode === "user" ? "mirror-x" : ""}`}
                            mirrored={facingMode === "user"}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            onUserMedia={() => console.log("Camera started")}
                        />
                        <canvas
                            ref={canvasRef}
                            className={`absolute inset-0 w-full h-full object-contain ${facingMode === "user" ? "mirror-x" : ""}`}
                        />
                    </div>
                )}

                {/* 3D View Mode - Enhanced Showcase */}
                {viewMode === '3d' && (
                    <div className="absolute inset-0 z-[150] bg-black flex flex-col items-center justify-center p-8 animate-fade-in">
                        <div className="relative w-full max-w-lg aspect-[3/4] bg-[#0a0a0a] rounded-[40px] border border-white/5 shadow-4xl flex items-center justify-center overflow-hidden">
                            {resolvedProductImage ? (
                                <>
                                    {imgLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-sm">
                                            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                    <img
                                        src={resolvedProductImage}
                                        className={`w-full h-full object-contain transition-all duration-700 ${imgLoading ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}
                                        alt="Product Showcase"
                                        onLoad={() => {
                                            console.log("3D Visualizer: Product image loaded");
                                            setImgLoading(false);
                                        }}
                                        onError={() => {
                                            console.error("3D Visualizer: Image load error");
                                            setImgError(true);
                                        }}
                                    />
                                </>
                            ) : (
                                <div className="text-center px-10">
                                    <Smartphone className="w-16 h-16 text-white/10 mx-auto mb-4" />
                                    <p className="text-white/40 text-xs">Visualizer content unavailable</p>
                                </div>
                            )}
                            <div className="absolute top-6 left-6 px-4 py-1.5 bg-accent/20 border border-accent/40 rounded-full text-[10px] text-accent font-black tracking-widest uppercase">360° Visualizer</div>
                        </div>
                        <div className="mt-8 text-center animate-slide-up">
                            <h2 className="text-3xl font-serif text-white mb-2 font-light tracking-wide">Detailed View</h2>
                            <p className="text-white/30 text-[10px] uppercase tracking-[0.2em]">Premium Showcase Mode</p>
                            <button onClick={() => setViewMode('live')} className="mt-8 px-10 py-4 bg-white/5 border border-white/10 rounded-full text-white text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition active:scale-95">Return to Try-On</button>
                        </div>
                    </div>
                )}

                {/* Size Suggestion Overlay */}
                {measurements && measurements.estimatedSize && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
                        <div className="bg-accent text-white px-4 py-2 rounded-full shadow-lg flex flex-col items-center border-2 border-white/20">
                            <span className="text-[10px] uppercase tracking-tighter opacity-70">Detection Accurate</span>
                            <span className="text-xs font-bold tracking-widest uppercase">Size identified: {selectedSize || measurements.estimatedSize}</span>
                        </div>
                    </div>
                )}



                {/* Tracking Instructions */}
                {!detectionStatus.face && !detectionStatus.body && !detectionStatus.hand && !loading && viewMode === 'live' && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="p-6 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 text-center animate-slide-up">
                            <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4 animate-bounce" />
                            <h3 className="text-white font-serif text-xl mb-2">Ready to Try On?</h3>
                            <p className="text-white/60 text-sm max-w-[220px]">Please {mode === 'apparel' ? 'step back and show your upper body' : mode === 'watch' ? 'show your wrist in front of camera' : 'look directly into the camera'} to begin detection.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Overlays (Header & Footer) - Placed after Main View for click precedence */}
            <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between p-4">
                {/* Header */}
                <div className="flex justify-between items-center pointer-events-auto">
                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2 bg-black/40 backdrop-blur rounded-full px-3 py-1 w-fit">
                            <div className={`w-2 h-2 rounded-full ${arReady ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                            <span className="text-xs font-mono font-bold tracking-wider uppercase">{arReady ? 'AI Engine Active' : 'Initializing...'}</span>
                        </div>
                        <div className="flex space-x-2">
                            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold transition-all ${detectionStatus.face || detectionStatus.body || detectionStatus.hand ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                <Check className="w-3 h-3" />
                                <span>
                                    {mode === 'apparel' ? 'Body' : mode === 'watch' ? 'Hand' : 'Face'}: {
                                        mode === 'watch'
                                            ? (trackingMetrics.handConfidence > 0.3 ? 'Detected' : 'Searching...')
                                            : (detectionStatus.face || detectionStatus.body ? 'Detected' : 'Searching...')
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-2 items-center">
                        {resolvedProductImage && (
                            <div className="w-12 h-12 rounded-xl border-2 border-accent/30 overflow-hidden bg-black shadow-lg shadow-accent/20 animate-fade-in pointer-events-auto">
                                <img src={resolvedProductImage} className="w-full h-full object-cover" alt="Selected Product" />
                            </div>
                        )}
                        <div className="flex items-center space-x-1 bg-black/35 backdrop-blur rounded-full px-2 py-1 pointer-events-auto">
                            <button
                                onClick={() => updateZoom(zoomLevel - 0.1)}
                                className="p-1.5 rounded-full hover:bg-white/10 transition active:scale-95"
                                aria-label="Zoom out camera"
                            >
                                <Minus className="w-4 h-4 text-white" />
                            </button>
                            <span className="text-[10px] w-10 text-center text-white/80 font-mono">{zoomLevel.toFixed(1)}x</span>
                            <button
                                onClick={() => updateZoom(zoomLevel + 0.1)}
                                className="p-1.5 rounded-full hover:bg-white/10 transition active:scale-95"
                                aria-label="Zoom in camera"
                            >
                                <Plus className="w-4 h-4 text-white" />
                            </button>
                        </div>
                        <button
                            onClick={captureLook}
                            className={`p-3 rounded-full backdrop-blur transition active:scale-95 pointer-events-auto relative z-[300] ${capturing ? 'bg-accent/40' : 'bg-white/10 hover:bg-white/20'}`}
                            aria-label="Capture try-on look"
                        >
                            <Camera className="w-6 h-6 text-white" />
                        </button>
                        <button onClick={toggleCamera} className="p-3 bg-white/10 rounded-full backdrop-blur hover:bg-white/20 transition active:scale-95 pointer-events-auto relative z-[300]">
                            <RefreshCw className="w-6 h-6 text-white" />
                        </button>
                        <button onClick={onClose} className="p-3 bg-white/10 rounded-full backdrop-blur hover:bg-white/20 transition active:scale-95 pointer-events-auto relative z-[300]">
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="h-32 bg-gradient-to-t from-black via-black/50 to-transparent flex items-end justify-center pb-8 space-x-12 px-6 pointer-events-auto">
                    <button
                        onClick={toggleViewMode}
                        className={`flex flex-col items-center space-y-1 transition group ${viewMode === '3d' ? 'text-accent' : 'text-white/50 hover:text-white'}`}
                    >
                        <div className={`p-3 rounded-full mt-2 ${viewMode === '3d' ? 'bg-accent/20' : 'bg-white/10 group-hover:bg-white/20'}`}>
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] tracking-widest uppercase">{viewMode === '3d' ? 'Live AR' : '3D View'}</span>
                    </button>

                    <div className="flex flex-col items-center space-y-1 scale-110">
                        <div className="w-16 h-16 border-2 border-accent rounded-full flex items-center justify-center">
                            <div className="w-12 h-12 bg-accent/20 rounded-full animate-pulse flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-accent animate-spin-slow" />
                            </div>
                        </div>
                        <span className="text-[10px] text-accent font-bold tracking-[0.2em] uppercase mt-2">Live {viewMode === 'live' ? 'Try-On' : 'Showcase'}</span>
                    </div>

                    <button
                        onClick={() => {
                            if (measurements) setSizeModalOpen(true);
                        }}
                        className={`flex flex-col items-center space-y-1 text-white/50 hover:text-white transition group ${measurements ? 'text-white' : 'opacity-40'}`}
                    >
                        <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 mt-2"><Check className="w-6 h-6" /></div>
                        <span className="text-[10px] tracking-widest uppercase">{selectedSize ? `Size ${selectedSize}` : 'Analysing Size'}</span>
                    </button>
                </div>
                {viewMode === 'live' && (
                    <div className="absolute bottom-36 left-1/2 -translate-x-1/2 bg-black/45 backdrop-blur rounded-full px-3 py-2 pointer-events-auto flex items-center space-x-3">
                        <span className="text-[9px] uppercase tracking-widest text-white/60">Zoom</span>
                        <input
                            type="range"
                            min={0.6}
                            max={2.2}
                            step={0.05}
                            value={zoomLevel}
                            onChange={(e) => updateZoom(Number(e.target.value))}
                            className="w-32 accent-amber-500"
                            aria-label="Adjust camera zoom"
                        />
                        <button
                            onClick={() => {
                                setGuidedScan((prev) => !prev);
                                setGuidedScanProgress(0);
                                emitTelemetry("guided_scan_toggle", { enabled: !guidedScan });
                            }}
                            className={`px-2 py-1 rounded-full text-[9px] uppercase tracking-wider ${guidedScan ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-white/10 text-white/70 border border-white/10'}`}
                        >
                            Guided Scan
                        </button>
                        <button
                            onClick={() => setShowDebug((prev) => !prev)}
                            className={`px-2 py-1 rounded-full text-[9px] uppercase tracking-wider ${showDebug ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'bg-white/10 text-white/70 border border-white/10'}`}
                        >
                            Debug
                        </button>
                    </div>
                )}
            </div>

            {resolvedProductImage && viewMode === 'live' && (
                <div className="absolute bottom-2 left-2 z-[260] pointer-events-none">
                    <div className="px-3 py-1 rounded-full bg-black/55 backdrop-blur border border-white/10 text-[10px] text-white/70 font-mono">
                        overlay: {resolvedProductImage.split('/').slice(-2).join('/')}
                        {imgError ? " (fallback)" : ""}
                    </div>
                </div>
            )}
            {guidedScan && viewMode === 'live' && (
                <div className="absolute top-16 right-4 z-[260] pointer-events-none">
                    <div className="bg-black/55 backdrop-blur border border-white/10 rounded-xl px-3 py-2 min-w-44">
                        <p className="text-[10px] text-white/60 uppercase tracking-widest">Guided Scan</p>
                        <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${guidedScanProgress}%` }} />
                        </div>
                        <p className="text-[10px] text-emerald-300 mt-1">{Math.round(guidedScanProgress)}% stable frames</p>
                    </div>
                </div>
            )}
            {viewMode === 'live' && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[255] pointer-events-none">
                    <div className="bg-black/55 backdrop-blur border border-white/10 rounded-xl px-3 py-2 min-w-64 text-center">
                        <p className="text-[10px] text-white/60 uppercase tracking-widest">AI Guidance</p>
                        <p className="text-xs text-white/85 mt-1">{guidance}</p>
                        {mode === "eyewear" && (
                            <p className="text-[10px] text-accent mt-1">
                                Face shape: {faceShape} • Suggested: {styleSuggestions.slice(0, 2).join(", ")}
                            </p>
                        )}
                    </div>
                </div>
            )}
            {showPrivacyNote && viewMode === 'live' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[270] pointer-events-auto">
                    <div className="bg-black/70 backdrop-blur border border-white/10 rounded-full px-3 py-1.5 flex items-center space-x-2">
                        <span className="text-[10px] text-white/70">Camera frames are processed locally for live try-on.</span>
                        <button
                            onClick={() => setShowPrivacyNote(false)}
                            className="text-[10px] text-accent hover:text-white transition"
                        >
                            Hide
                        </button>
                    </div>
                </div>
            )}
            {showDebug && viewMode === 'live' && (
                <div className="absolute top-16 left-4 z-[260] pointer-events-none">
                    <div className="bg-black/65 backdrop-blur border border-white/10 rounded-xl px-3 py-2 min-w-52 text-[10px] font-mono text-white/80 space-y-1">
                        <div>fps: {trackingMetrics.fps}</div>
                        <div>faceConf: {(trackingMetrics.faceConfidence * 100).toFixed(0)}%</div>
                        <div>bodyConf: {(trackingMetrics.bodyConfidence * 100).toFixed(0)}%</div>
                        <div>handConf: {(trackingMetrics.handConfidence * 100).toFixed(0)}%</div>
                        <div>stability: {(trackingMetrics.stability * 100).toFixed(0)}%</div>
                        <div>landmarks: {trackingMetrics.landmarksVisible}</div>
                        <div>assetId: {productConfig?.assetId || "unknown"}</div>
                    </div>
                </div>
            )}

            {capturePreview && (
                <div className="fixed inset-0 z-[290] bg-black/80 backdrop-blur-md flex items-center justify-center p-5">
                    <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden">
                        <img src={capturePreview} alt="Captured look preview" className="w-full h-auto" />
                        <div className="p-4 flex items-center justify-between">
                            <button
                                onClick={() => setCapturePreview(null)}
                                className="px-4 py-2 text-xs uppercase tracking-wider rounded-full bg-white/10 hover:bg-white/20 transition"
                            >
                                Close
                            </button>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={downloadCapture}
                                    className="px-4 py-2 text-xs uppercase tracking-wider rounded-full bg-accent/20 border border-accent/50 text-accent hover:bg-accent/30 transition"
                                >
                                    Download
                                </button>
                                <button
                                    onClick={shareCapture}
                                    disabled={!shareSupported}
                                    className="px-4 py-2 text-xs uppercase tracking-wider rounded-full bg-white/10 hover:bg-white/20 transition disabled:opacity-40"
                                >
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Size Analysis Modal (with Manual Charts) */}
            {sizeModalOpen && (
                <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-[40px] p-8 w-full max-w-md text-center shadow-3xl">
                        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                            <div className="w-10 h-10" />
                            <h3 className="text-white font-serif text-2xl tracking-wide">Choose Your Fit</h3>
                            <button onClick={() => setSizeModalOpen(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:bg-white/10 transition"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="mb-6 py-4 bg-accent/10 rounded-2xl border border-accent/20">
                            <p className="text-[10px] text-accent font-bold uppercase tracking-widest mb-1">AI Suggestion</p>
                            <p className="text-2xl font-bold text-white">Size identified: {measurements?.estimatedSize}</p>
                        </div>

                        {/* Size Selection Grid */}
                        <div className="grid grid-cols-4 gap-3 mb-8">
                            {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedSize(s)}
                                    className={`relative py-4 rounded-2xl border transition-all duration-300 ${selectedSize === s ? 'bg-accent border-accent text-white scale-105 shadow-[0_0_20px_rgba(197,160,101,0.4)]' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                                >
                                    <div className="text-xs font-bold">{s}</div>
                                    <span className="text-[7px] block mt-1 opacity-50 font-mono">
                                        {s === 'S' ? '38 (IN) / 10 (UK)' : s === 'M' ? '40 (IN) / 12 (UK)' : s === 'L' ? '42 (IN) / 14 (UK)' : s === 'XL' ? '44 (IN) / 16 (UK)' : 'Standard'}
                                    </span>
                                    {selectedSize === s && <div className="absolute -top-1 -right-1 bg-white text-accent rounded-full p-0.5 shadow-md animate-scale-in"><Check className="w-2.5 h-2.5" /></div>}
                                </button>
                            ))}
                        </div>

                        {/* Chart Reference */}
                        <div className="bg-white/5 rounded-3xl p-6 mb-8 text-left border border-white/5">
                            <div className="flex items-center space-x-2 mb-4">
                                <ShieldCheck className="w-4 h-4 text-accent" />
                                <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Size Chart Reference</p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-white/30 uppercase font-bold">Indian Size (Chest)</span>
                                    <span className="text-white/80 font-mono tracking-tighter">36 | 38 | 40 | 42 | 44 | 46</span>
                                </div>
                                <div className="h-[1px] bg-white/5 w-full" />
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-white/30 uppercase font-bold">UK Standard Size</span>
                                    <span className="text-white/80 font-mono tracking-tighter">08 | 10 | 12 | 14 | 16 | 18</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSizeModalOpen(false)}
                            className="w-full py-5 bg-accent text-white rounded-full font-bold shadow-2xl hover:shadow-accent/40 active:scale-95 transition-all text-sm uppercase tracking-widest"
                        >
                            CONFIRM SELECTION
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
