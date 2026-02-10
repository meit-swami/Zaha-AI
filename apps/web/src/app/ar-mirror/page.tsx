"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import VirtualMirror from '@/components/ar/virtual-mirror';

function ARMirrorContent() {
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);
    const [arParams, setArParams] = useState<{ type: 'jewelry' | 'apparel'; image?: string }>({
        type: 'jewelry'
    });

    useEffect(() => {
        setMounted(true);

        // Robust parameter extraction for WebViews
        let type = searchParams.get('type') as 'jewelry' | 'apparel' || 'jewelry';
        let image = searchParams.get('image') || undefined;

        // Fallback for some mobile WebViews that struggle with useSearchParams
        if (!image && typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            type = urlParams.get('type') as 'jewelry' | 'apparel' || type;
            image = urlParams.get('image') || image;
        }

        console.log("AR Page: Params detected", { type, image: image?.substring(0, 30) + "..." });
        setArParams({ type, image });
    }, [searchParams]);

    if (!mounted) return null;

    return (
        <VirtualMirror
            onClose={() => {
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CLOSE' }));
                } else if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = '/';
                }
            }}
            mode={arParams.type}
            productImage={arParams.image}
        />
    );
}

export default function ARMirrorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading AR Engine...</div>}>
            <ARMirrorContent />
        </Suspense>
    );
}

// Add TS definition for React Native WebView injection
declare global {
    interface Window {
        ReactNativeWebView?: {
            postMessage: (msg: string) => void;
        }
    }
}
