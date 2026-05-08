import { Vector2 } from "three";
import { UINode } from "./UINode";
import { RichText } from "../../lib/RichText";
import { measurementContext } from "./TextNode";

export class TextNode extends UINode {
    private text: RichText;
    private opacity: number = 1;

    public setOpacity(opacity: number): this {
        this.opacity = opacity;
        return this;
    }
    
    /** X-axis margin; Y axis is half of this */
    private margin: number = 12;

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
        this.text.draw(ctx, this.x + this.margin, this.y + this.margin / 2);
        ctx.restore();
    }
}