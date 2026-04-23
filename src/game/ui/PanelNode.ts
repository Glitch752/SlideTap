import { ContainerNode } from "./containerNodes";

export class PanelNode extends ContainerNode {
    backgroundColor: string = "rgba(0, 0, 0, 0.5)";
    withBackgroundColor(color: string): this {
        this.backgroundColor = color;
        return this;
    }

    shadowColor: string = "transparent";
    shadowBlur: number = 0;
    shadowOffsetX: number = 0;
    shadowOffsetY: number = 0;
    withShadow(color: string, blur: number, offsetX: number, offsetY: number): this {
        this.shadowColor = color;
        this.shadowBlur = blur;
        this.shadowOffsetX = offsetX;
        this.shadowOffsetY = offsetY;
        return this;
    }
    
    draw(ctx: CanvasRenderingContext2D): void {
        if(this.backgroundColor) {
            ctx.fillStyle = this.backgroundColor;
            
            ctx.shadowColor = this.shadowColor;
            ctx.shadowBlur = this.shadowBlur;
            ctx.shadowOffsetX = this.shadowOffsetX;
            ctx.shadowOffsetY = this.shadowOffsetY;

            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.shadowColor = "transparent";
    }
}