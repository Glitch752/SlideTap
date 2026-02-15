/**
 * Gets the alpha for linear interpolation for proper exponential smoothing.
 * @param smoothing The smoothing factor; higher values mean faster smoothing.
 * @param deltaTime The time since the last update, in seconds.
 */
export function getExpSmoothAlpha(smoothing: number, deltaTime: number): number {
    return 1 - Math.exp(-smoothing * deltaTime);
}

/**
 * Exponential smmoothing that correctly accounts for delta time.
 * @param current The current value
 * @param target The target value
 * @param smoothing The smoothing factor; higher values mean faster smoothing.
 * A value of 0 means no smoothing, and a value of Infinity means instant change.
 * 20 is a reasonable default.
 * @param deltaTime The time since the last update, in seconds.
 */
export function expSmooth(current: number, target: number, smoothing: number, deltaTime: number): number {
    return current + getExpSmoothAlpha(smoothing, deltaTime) * (target - current);
}