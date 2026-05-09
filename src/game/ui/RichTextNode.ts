import { Vector2 } from "three";
import { UINode } from "./UINode";
import { RichText } from "../../lib/RichText";
import { measurementContext } from "./TextNode";

export class RichTextNode extends UINode {
    private text: RichText;
    public opacity: number = 1;
    
    /** X-axis margin; Y axis is half of this */
    private margin: number = 12;

    private outlineColor?: string;
    private outlineWidth: number = 0;

    withMargin(margin: number): this {
        this.margin = margin;
        return this;
    }
    withOutline(color: string, width: number): this {
        this.outlineColor = color;
        this.outlineWidth = width;
        return this;
    }

    constructor(text: RichText) {
        super();
        this.text = text;
    }

    measure(available: Vector2): Vector2 {
        if(this.targetWidth || this.targetHeight) return new Vector2(
            this.targetWidth || available.x,
            this.targetHeight || available.y
        );

        const m = this.text.measure(measurementContext);
        return new Vector2(m.width + this.margin * 2, m.height + this.margin);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        let x = this.x + this.margin;
        if(this.text.align === "center") {
            x = this.x + this.width / 2;
        } else if(this.text.align === "right") {
            x = this.x + this.width - this.margin;
        }

        if(this.outlineColor && this.outlineWidth > 0) {
            ctx.lineWidth = this.outlineWidth;
            ctx.strokeStyle = this.outlineColor;
            this.text.draw(ctx, x, this.y + this.margin / 2, true);
        }

        this.text.draw(ctx, x, this.y + this.margin / 2);
        ctx.restore();
    }
}