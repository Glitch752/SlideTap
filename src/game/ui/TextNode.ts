import { Vector2 } from "three";
import { AlignMode, UINode } from "./UINode";

const measurementContext = document.createElement("canvas").getContext("2d")!;

export class TextNode extends UINode {
    font: string = "20px Helvetica";
    text: string;
    color: string;
    outlineColor?: string;
    outlineWidth: number = 0;
    /** X-axis margin; Y axis is half of this */
    margin: number = 12;

    withFont(font: string): this {
        this.font = font;
        return this;
    }
    withMargin(margin: number): this {
        this.margin = margin;
        return this;
    }
    withOutline(color: string, width: number): this {
        this.outlineColor = color;
        this.outlineWidth = width;
        return this;
    }

    constructor(text: string, color: string = "#fff") {
        super();
        this.text = text;
        this.color = color;
    }

    measure(available: Vector2): Vector2 {
        if(this.targetWidth || this.targetHeight) return new Vector2(
            this.targetWidth || available.x,
            this.targetHeight || available.y
        );

        measurementContext.font = this.font;
        const metrics = measurementContext.measureText(this.text);
        const width = metrics.width + this.margin * 2;
        const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + this.margin;
        return new Vector2(width, height);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.textBaseline = "top";
        if(this.outlineColor && this.outlineWidth > 0) {
            ctx.lineWidth = this.outlineWidth;
            ctx.strokeStyle = this.outlineColor;
            ctx.strokeText(this.text, this.x + this.margin, this.y + this.margin / 2);
        }
        ctx.fillText(this.text, this.x + this.margin, this.y + this.margin / 2.);
    }
}