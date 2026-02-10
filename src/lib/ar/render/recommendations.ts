import type { LandmarkPoint } from "@/utils/ar-math";

export type FaceShape = "oval" | "round" | "square" | "oblong";

export const estimateFaceShape = (landmarks: LandmarkPoint[]): FaceShape => {
    const top = landmarks[10];
    const chin = landmarks[152];
    const leftJaw = landmarks[234];
    const rightJaw = landmarks[454];
    const leftCheek = landmarks[93];
    const rightCheek = landmarks[323];

    if (!top || !chin || !leftJaw || !rightJaw || !leftCheek || !rightCheek) {
        return "oval";
    }

    const faceLength = Math.abs(chin.y - top.y);
    const jawWidth = Math.abs(rightJaw.x - leftJaw.x);
    const cheekWidth = Math.abs(rightCheek.x - leftCheek.x);
    const width = Math.max(jawWidth, cheekWidth);
    const ratio = faceLength / Math.max(0.0001, width);

    if (ratio > 1.55) return "oblong";
    if (ratio > 1.3) return "oval";
    if (Math.abs(jawWidth - cheekWidth) < 0.03) return "square";
    return "round";
};

export const recommendationsForFaceShape = (shape: FaceShape): string[] => {
    switch (shape) {
        case "oblong":
            return ["Wayfarer", "Round frames", "Aviator"];
        case "square":
            return ["Round frames", "Aviator", "Cat-eye"];
        case "round":
            return ["Rectangular", "Geometric", "Browline"];
        case "oval":
        default:
            return ["Rectangular", "Aviator", "Wayfarer"];
    }
};
