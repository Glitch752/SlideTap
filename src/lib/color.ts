export class RGBAColor extends Array<number> {
    get r() { return this[0]; }
    get g() { return this[1]; }
    get b() { return this[2]; }
    get a() { return this[3]; }
    
    withR(r: number): this {
        this[0] = r;
        return this;
    }
    withG(g: number): this {
        this[1] = g;
        return this;
    }
    withB(b: number): this {
        this[2] = b;
        return this;
    }
    withA(a: number): this {
        this[3] = a;
        return this;
    }

    constructor(r: number, g: number, b: number, a: number = 1) {
        super(r, g, b, a);
    }

    static parse(color: string): RGBAColor {
        return parseColor(color);
    }

    static interpolate(colorA: RGBAColor, colorB: RGBAColor, t: number): RGBAColor {
        const r = Math.round(colorA[0] + (colorB[0] - colorA[0]) * t);
        const g = Math.round(colorA[1] + (colorB[1] - colorA[1]) * t);
        const b = Math.round(colorA[2] + (colorB[2] - colorA[2]) * t);
        const a = colorA[3] + (colorB[3] - colorA[3]) * t;
        return new RGBAColor(r, g, b, a);
    }
    interpolate(other: RGBAColor, t: number): RGBAColor {
        return RGBAColor.interpolate(this, other, t);
    }

    toRGBAString(): string {
        return `rgba(${this[0]}, ${this[1]}, ${this[2]}, ${this[3]})`;
    }
}

export function parseColor(color: string): RGBAColor {
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.fillStyle = color;
    const computed = ctx.fillStyle;

    // hex colors
    if(computed.startsWith("#")) {
        let r: number, g: number, b: number, a: number = 1;
        if(computed.length === 7) {
            r = parseInt(computed.slice(1, 3), 16);
            g = parseInt(computed.slice(3, 5), 16);
            b = parseInt(computed.slice(5, 7), 16);
        } else if(computed.length === 9) {
            r = parseInt(computed.slice(1, 3), 16);
            g = parseInt(computed.slice(3, 5), 16);
            b = parseInt(computed.slice(5, 7), 16);
            a = parseInt(computed.slice(7, 9), 16) / 255;
        } else {
            throw new Error(`Unsupported hex color format: ${computed}`);
        }
        return new RGBAColor(r, g, b, a);
    }

    // rgb/rgba colors
    const rgbaMatch = computed.match(/^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/);
    if(rgbaMatch) {
        const r = parseInt(rgbaMatch[1]);
        const g = parseInt(rgbaMatch[2]);
        const b = parseInt(rgbaMatch[3]);
        const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
        return new RGBAColor(r, g, b, a);
    }

    throw new Error(`Unsupported color format: ${computed}`);
}

/** A gradient between t=0 and t=1 that can be evaluated at any point */
export class ColorGradient {
    private stops: { t: number, color: RGBAColor }[] = [];

    addStop(t: number, color: string | RGBAColor): this {
        this.stops.push({ t, color: typeof color === "string" ? parseColor(color) : color });
        this.stops.sort((a, b) => a.t - b.t);
        return this;
    }

    evaluate(t: number): string {
        if(this.stops.length === 0) return "#000";
        if(t <= this.stops[0].t) return this.stops[0].color.toRGBAString();
        if(t >= this.stops[this.stops.length - 1].t) return this.stops[this.stops.length - 1].color.toRGBAString();

        for(let i = 0; i < this.stops.length - 1; i++) {
            const stopA = this.stops[i];
            const stopB = this.stops[i + 1];
            if(t >= stopA.t && t <= stopB.t) {
                const localT = (t - stopA.t) / (stopB.t - stopA.t);
                return stopA.color.interpolate(stopB.color, localT).toRGBAString();
            }
        }

        return "#000"; // Should never reach here
    }
}