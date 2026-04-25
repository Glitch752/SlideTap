import { Vector2 } from "three";
import { UINode } from "./UINode";

const measurementContext = document.createElement("canvas").getContext("2d")!;

export class TextNode extends UINode {
    font: string = "18px Helvetica";
    text: string;
    color: string;
    /** X-axis margin; Y axis is half of this */
    margin: number = 8;

    withFont(font: string): this {
        this.font = font;
        return this;
    }
    withMargin(margin: number): this {
        this.margin = margin;
        return this;
    }

    constructor(text: string, color: string = "#fff") {
        super();
        this.text = text;
        this.color = color;
    }

    measure(available: Vector2): Vector2 {
        measurementContext.font = this.font;
        const metrics = measurementContext.measureText(this.text);
        const width = metrics.width + this.margin * 2;
        const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + this.margin;
        return new Vector2(
            this.targetWidth || width,
            this.targetHeight || height
        );
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.textBaseline = "top";
        ctx.fillText(this.text, this.x + this.margin, this.y + this.margin / 2.);
    }
}