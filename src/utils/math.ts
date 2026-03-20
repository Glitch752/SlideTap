export function wrappingMod(n: number, m: number): number {
    return ((n % m) + m) % m;
}