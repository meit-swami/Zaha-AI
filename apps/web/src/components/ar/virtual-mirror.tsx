"use client";

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, X, RefreshCw, Smartphone, Check, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { FilesetResolver, FaceLandmarker, PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { calculateSkinTone, classifySkinTone, getBodyMeasurements } from '../../utils/ar-math';

interface VirtualMirrorProps {
    onClose: () => void;
    mode: 'jewelry' | 'apparel';
    productImage?: string;
}

export default function VirtualMirror({ onClose, mode, productImage }: VirtualMirrorProps) {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [arReady, setArReady] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

    const [measurements, setMeasurements] = useState<any>(null);
    const [skinTone, setSkinTone] = useState<string>("");

    const [detectionStatus, setDetectionStatus] = useState({
        face: false,
        body: false,
        accuracy: 0
    });

    const [viewMode, setViewMode] = useState<'live' | '3d'>('live');
    const [sizeModalOpen, setSizeModalOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [guidance, setGuidance] = useState<string>("");
    const [imgLoading, setImgLoading] = useState(true);
    const [imgError, setImgError] = useState(false);

    // Refs for AR loop
    const requestRef = useRef<number>(0);
    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
    const lastLandmarksRef = useRef<any>(null);
    const productImgRef = useRef<HTMLImageElement | null>(null);

    // Load Product Image
    useEffect(() => {
        if (productImage) {
            console.log("AR Engine: Loading product image", productImage);
            setImgLoading(true);
            setImgError(false);

            const img = new Image();
            img.crossOrigin = "anonymous";

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
            };

            img.src = productImage;
        } else {
            productImgRef.current = null;
            setImgLoading(false);
        }

        return () => {
            productImgRef.current = null;
        };
    }, [productImage]);

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

                if (mode === 'jewelry') {
                    faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                            delegate: "GPU"
                        },
                        outputFaceBlendshapes: true,
                        runningMode: "VIDEO",
                        numFaces: 1
                    });
                } else {
                    poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                            delegate: "GPU"
                        },
                        runningMode: "VIDEO",
                        numPoses: 1
                    });
                }
                setLoading(false);
                setArReady(true);
            } catch (error) {
                console.error("Failed to load AR models", error);
                setLoading(false);
            }
        };

        if (typeof window !== 'undefined') {
            initAR();
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            faceLandmarkerRef.current?.close();
            poseLandmarkerRef.current?.close();
        };
    }, [mode]);

    const renderLoop = () => {
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
                const startTimeMs = performance.now();

                if (mode === 'jewelry' && faceLandmarkerRef.current) {
                    const detections = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);
                    if (detections.faceLandmarks && detections.faceLandmarks.length > 0) {
                        setDetectionStatus(prev => ({ ...prev, face: true, accuracy: 95 }));
                        for (const landmarks of detections.faceLandmarks) {
                            lastLandmarksRef.current = landmarks;

                            if (!skinTone && Math.random() < 0.05) {
                                try {
                                    const tone = calculateSkinTone(ctx, landmarks);
                                    if (tone) {
                                        const classification = classifySkinTone(tone);
                                        setSkinTone(classification);
                                    }
                                } catch (e) { }
                            }

                            // Draw Product (Necklace/Earrings)
                            const chin = landmarks[152];
                            if (chin) {
                                ctx.save();
                                if (productImgRef.current && mode === 'jewelry') {
                                    // Use actual product image
                                    const img = productImgRef.current;
                                    const aspectRatio = img.width / img.height;
                                    const width = 250; // Larger jewelry for visibility
                                    const height = width / aspectRatio;

                                    ctx.drawImage(
                                        img,
                                        chin.x * canvas.width - width / 2,
                                        chin.y * canvas.height - 20, // Position on neck
                                        width,
                                        height
                                    );
                                } else {
                                    // Fallback Placeholder logic (Luxe Style)
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

                            // Draw Earrings
                            const leftEar = landmarks[234];
                            const rightEar = landmarks[454];

                            [leftEar, rightEar].forEach((ear, index) => {
                                if (ear) {
                                    ctx.save();
                                    ctx.fillStyle = "#D4AF37";
                                    ctx.shadowColor = "gold";
                                    ctx.shadowBlur = 10;
                                    ctx.beginPath();
                                    ctx.arc(ear.x * canvas.width, ear.y * canvas.height + 15, 5, 0, Math.PI * 2);
                                    ctx.fill();

                                    // Hanging part
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
                        }
                    } else {
                        setDetectionStatus(prev => ({ ...prev, face: false, accuracy: 0 }));
                    }
                } else if (mode === 'apparel' && poseLandmarkerRef.current) {
                    const detections = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);
                    if (detections.landmarks && detections.landmarks.length > 0) {
                        setDetectionStatus(prev => ({ ...prev, body: true, accuracy: 88 }));
                        for (const landmark of detections.landmarks) {
                            lastLandmarksRef.current = landmark;

                            // Draw Product (Apparel)
                            const leftShoulder = landmark[11];
                            const rightShoulder = landmark[12];
                            const leftHip = landmark[23];
                            const rightHip = landmark[24];

                            if (leftShoulder && rightShoulder && leftHip && rightHip) {
                                // Live Size Analysis Trigger (Only if not manually selected)
                                if (!selectedSize && Math.random() < 0.1) {
                                    try {
                                        const m = getBodyMeasurements(landmark);
                                        if (m && m.estimatedSize) {
                                            setMeasurements(m);
                                        }
                                    } catch (e) { }
                                }

                                ctx.save();
                                if (productImgRef.current && mode === 'apparel') {
                                    const img = productImgRef.current;
                                    const rawWidth = Math.abs(rightShoulder.x - leftShoulder.x);
                                    if (rawWidth > 0.01) { // Guard against zero width
                                        // MUCH larger scale for Sarees/Lehengas to cover the torso
                                        const width = rawWidth * canvas.width * 3.5;
                                        const aspectRatio = img.width / img.height;
                                        const height = width / aspectRatio;

                                        ctx.drawImage(
                                            img,
                                            ((leftShoulder.x + rightShoulder.x) / 2) * canvas.width - width / 2,
                                            leftShoulder.y * canvas.height - (height * 0.15), // Align top proportionally
                                            width,
                                            height
                                        );
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
    };

    const videoConstraints = {
        facingMode: (typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
            ? { ideal: facingMode }
            : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 }
    };

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
                    <>
                        <Webcam
                            ref={webcamRef}
                            className={`absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "mirror-x" : ""}`}
                            mirrored={facingMode === "user"}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            onUserMedia={() => console.log("Camera started")}
                        />
                        <canvas
                            ref={canvasRef}
                            className={`absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "mirror-x" : ""}`}
                        />
                    </>
                )}

                {/* 3D View Mode - Enhanced Showcase */}
                {viewMode === '3d' && (
                    <div className="absolute inset-0 z-[150] bg-black flex flex-col items-center justify-center p-8 animate-fade-in">
                        <div className="relative w-full max-w-lg aspect-[3/4] bg-[#0a0a0a] rounded-[40px] border border-white/5 shadow-4xl flex items-center justify-center overflow-hidden">
                            {productImage ? (
                                <>
                                    {imgLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-sm">
                                            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                    <img
                                        src={productImage}
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
                {!detectionStatus.face && !detectionStatus.body && !loading && viewMode === 'live' && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="p-6 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 text-center animate-slide-up">
                            <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4 animate-bounce" />
                            <h3 className="text-white font-serif text-xl mb-2">Ready to Try On?</h3>
                            <p className="text-white/60 text-sm max-w-[200px]">Please {mode === 'jewelry' ? 'look directly into the camera' : 'step back and show your full body'} to begin detection.</p>
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
                            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold transition-all ${detectionStatus.face || detectionStatus.body ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                <Check className="w-3 h-3" />
                                <span>{mode === 'jewelry' ? 'Face' : 'Body'}: {detectionStatus.face || detectionStatus.body ? 'Detected' : 'Searching...'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-2 items-center">
                        {productImage && (
                            <div className="w-12 h-12 rounded-xl border-2 border-accent/30 overflow-hidden bg-black shadow-lg shadow-accent/20 animate-fade-in pointer-events-auto">
                                <img src={productImage} className="w-full h-full object-cover" alt="Selected Product" />
                            </div>
                        )}
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
                        onClick={() => setViewMode(prev => prev === '3d' ? 'live' : '3d')}
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
            </div>

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
