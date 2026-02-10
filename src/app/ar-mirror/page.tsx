"use client";

import React, { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import VirtualMirror from '@/components/ar/virtual-mirror';
import type { FitProfile, MirrorMode, ProductTryOnConfig } from '@/lib/ar/types';

const isMirrorMode = (value: string | null): value is MirrorMode => {
    return value === 'jewelry' || value === 'apparel' || value === 'eyewear' || value === 'watch';
};

function ARMirrorContent() {
    const searchParams = useSearchParams();
    const arParams = useMemo(() => {
        const typeRaw = searchParams.get('type');
        const type: MirrorMode = isMirrorMode(typeRaw) ? typeRaw : 'jewelry';
        const image = searchParams.get('image') || undefined;
        const assetId = searchParams.get('assetId') || `deep-link-${type}`;
        let fitProfile: FitProfile | undefined;
        const fitProfileParam = searchParams.get('fitProfile');
        if (fitProfileParam) {
            try {
                fitProfile = JSON.parse(fitProfileParam) as FitProfile;
            } catch {
                fitProfile = undefined;
            }
        }
        return {
            type,
            image,
            config: {
                mode: type,
                assetId,
                tryOnImage: image,
                fitProfile
            } as ProductTryOnConfig
        };
    }, [searchParams]);

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
            productConfig={arParams.config}
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
