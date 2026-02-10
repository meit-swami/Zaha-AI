export type MirrorMode = "jewelry" | "apparel" | "eyewear" | "watch";

export type FitProfile = {
    lensScale?: number;
    bridgeOffset?: number;
    templeCurve?: number;
    templeLength?: number;
    widthScale?: number;
    heightScale?: number;
    yOffset?: number;
    blendMode?: GlobalCompositeOperation;
    opacity?: number;
    wristScale?: number;
    wristYOffset?: number;
};

export type ProductTryOnConfig = {
    assetId: string;
    tryOnImage?: string;
    mode: MirrorMode;
    fitProfile?: FitProfile;
    occlusionProfile?: "none" | "basic" | "enhanced";
};

export type TrackingMetrics = {
    fps: number;
    faceConfidence: number;
    bodyConfidence: number;
    handConfidence: number;
    landmarksVisible: number;
    stability: number;
};
