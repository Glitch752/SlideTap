import { ColorGradient } from "./color";
import { UINode } from "./UINode";

export class ProgressBarNode extends UINode {
    progress: number = 1;
    backgroundColor: string = "#555";
    foregroundColorMap: ColorGradient | string = "#0f0";

    setProgress(progress: number) {
        this.progress = Math.max(0, Math.min(1, progress));
        this.setNeedsRelayout(false);
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
        ctx.fillRect(this.x, this.y, fgWidth, this.height);
    }
}