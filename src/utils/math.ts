export function wrappingMod(n: number, m: number): number {
    return ((n % m) + m) % m;
}

export function lerp(a: number, b: number, t: number): number {
    return a * (1 - t) + b * t;
}