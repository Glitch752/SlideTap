import { ColorGradient } from "./color";
import { UINode } from "./UINode";

export class ProgressBarNode extends UINode {
    progress: number = 1;
    backgroundColor: string = "#555";
    foregroundColorMap: ColorGradient | string = "#0f0";

    withProgress(progress: number): this {
        this.progress = progress;
        return this;
    }
    
    setProgress(progress: number) {
        this.progress = Math.max(0, Math.min(1, progress));
    }

    constructor(backgroundColor?: string, foregroundColorMap?: ColorGradient | string) {
        super();
        if(backgroundColor) this.backgroundColor = backgroundColor;
        if(foregroundColorMap) this.foregroundColorMap = foregroundColorMap;

        this.targetWidth = 300;
        this.targetHeight = 25;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        const fgWidth = Math.max(0, Math.min(this.width * this.progress, this.width));
        if(this.foregroundColorMap instanceof ColorGradient) {
            ctx.fillStyle = this.foregroundColorMap.evaluate(this.progress);
        } else {
            ctx.fillStyle = this.foregroundColorMap;
        }

        ctx.save();

        const stripeWidth = 8;
        const stripeSpacing = 8;
        ctx.beginPath();
        ctx.rect(this.x, this.y, fgWidth, this.height);
        ctx.fill();
        ctx.clip();

        // Diagonal stripes
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        for(let offset = fgWidth + this.height; offset > -this.height; offset -= stripeWidth + stripeSpacing) {
            ctx.beginPath();
            ctx.moveTo(this.x + offset, this.y);
            ctx.lineTo(this.x + offset + stripeWidth, this.y);
            ctx.lineTo(this.x + offset + stripeWidth - this.height, this.y + this.height);
            ctx.lineTo(this.x + offset - this.height, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}