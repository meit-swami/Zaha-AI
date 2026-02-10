export const calculateSkinTone = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    // MediaPipe Face Mesh landmarks: 
    // Left Cheek: 116, 117, 118, 100, 126
    // Right Cheek: 345, 346, 347, 329, 355
    // Forehead: 10, 109, 67, 103, 54, 21, 338, 297, 332, 284, 251, 389, 356

    const samplePoints = [116, 117, 345, 346, 10]; // Cheeks and Forehead
    let r = 0, g = 0, b = 0;
    let count = 0;

    samplePoints.forEach(index => {
        const point = landmarks[index];
        if (point) {
            const x = Math.floor(point.x * ctx.canvas.width);
            const y = Math.floor(point.y * ctx.canvas.height);
            // Get pixel data
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            r += pixel[0];
            g += pixel[1];
            b += pixel[2];
            count++;
        }
    });

    if (count === 0) return null;

    return {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count)
    };
};

export const getBodyMeasurements = (landmarks: any[]) => {
    // Pose Landmarks
    // 11: left shoulder, 12: right shoulder
    // 23: left hip, 24: right hip
    // 27: left ankle, 28: right ankle

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftAnkle = landmarks[27];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftAnkle) return null;

    // Calculate relative widths (0.0 - 1.0)
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const hipWidth = Math.abs(leftHip.x - rightHip.x);

    // Calibrate based on relative shoulder width and distance (Z-depth)
    // A smaller Z means closer to camera.
    const avgZ = (leftShoulder.z + rightShoulder.z) / 2;

    // Adjusted width: normalize the width based on distance
    // Heuristic: If Z is -0.5 (close), width is naturally larger. 
    // If Z is 0.0 (far), width is naturally smaller.
    const physicalWidthProxy = shoulderWidth * (1 + avgZ);

    let size = "M";
    if (physicalWidthProxy < 0.12) size = "XS";
    else if (physicalWidthProxy < 0.16) size = "S";
    else if (physicalWidthProxy < 0.20) size = "M";
    else if (physicalWidthProxy < 0.24) size = "L";
    else if (physicalWidthProxy < 0.28) size = "XL";
    else if (physicalWidthProxy < 0.32) size = "XXL";
    else size = "XXXL";

    return {
        shoulderWidth,
        hipWidth,
        distance: avgZ,
        estimatedSize: size
    };
};

export const classifySkinTone = (rgb: { r: number, g: number, b: number }) => {
    // Very simple brightness-based heuristic
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    if (brightness > 200) return "Fair / Cool";
    if (brightness > 150) return "Medium / Warm";
    return "Deep / Rich";
};
