export type Vec2 = { x: number; y: number };

export const ema = (prev: number, next: number, alpha: number) => {
    return prev + alpha * (next - prev);
};

export const smoothVec2 = (prev: Vec2, next: Vec2, alpha: number): Vec2 => ({
    x: ema(prev.x, next.x, alpha),
    y: ema(prev.y, next.y, alpha),
});

export const clampVelocity = (prev: number, next: number, maxDelta: number) => {
    if (next > prev + maxDelta) return prev + maxDelta;
    if (next < prev - maxDelta) return prev - maxDelta;
    return next;
};

export const smoothAngle = (prev: number, next: number, alpha: number) => {
    const delta = Math.atan2(Math.sin(next - prev), Math.cos(next - prev));
    return prev + alpha * delta;
};
