type TelemetryEvent = {
    ts: number;
    name: string;
    payload?: Record<string, unknown>;
};

const eventBuffer: TelemetryEvent[] = [];
const MAX_EVENTS = 200;

export const emitTelemetry = (name: string, payload?: Record<string, unknown>) => {
    eventBuffer.push({ ts: Date.now(), name, payload });
    if (eventBuffer.length > MAX_EVENTS) eventBuffer.shift();
};

export const getTelemetrySnapshot = () => {
    return [...eventBuffer];
};

export const estimateFps = (frameTimes: number[]) => {
    if (frameTimes.length < 2) return 0;
    const span = frameTimes[frameTimes.length - 1] - frameTimes[0];
    if (span <= 0) return 0;
    return Math.round(((frameTimes.length - 1) * 1000) / span);
};

export const confidenceFromVisibility = (points: Array<{ visibility?: number } | undefined>) => {
    const vals = points
        .map((p) => p?.visibility)
        .filter((v): v is number => typeof v === "number");
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
};
