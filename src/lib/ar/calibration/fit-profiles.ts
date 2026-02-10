import type { FitProfile, MirrorMode } from "../types";

export const DEFAULT_FIT_PROFILES: Record<MirrorMode, FitProfile> = {
    jewelry: {
        opacity: 0.95,
    },
    eyewear: {
        lensScale: 1,
        bridgeOffset: 0.06,
        templeCurve: 0.34,
        templeLength: 0.6,
        opacity: 0.94,
    },
    apparel: {
        widthScale: 2.95,
        heightScale: 1.65,
        yOffset: 0.36,
        blendMode: "multiply",
        opacity: 0.9,
    },
    watch: {
        wristScale: 1.65,
        wristYOffset: -0.06,
        opacity: 0.95,
    },
};

export const mergeFitProfile = (mode: MirrorMode, custom?: FitProfile): FitProfile => {
    return {
        ...DEFAULT_FIT_PROFILES[mode],
        ...(custom || {}),
    };
};
