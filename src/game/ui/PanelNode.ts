import { ContainerNode } from "./containerNodes";

export class Panel {
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
}

export class PanelNode extends ContainerNode {
    panel: Panel;

    constructor(panel: Panel = new Panel()) {
        super();
        this.panel = panel;
    }
    
    draw(ctx: CanvasRenderingContext2D): void {
        if(this.panel.backgroundColor) {
            ctx.fillStyle = this.panel.backgroundColor;
            
            ctx.shadowColor = this.panel.shadowColor;
            ctx.shadowBlur = this.panel.shadowBlur;
            ctx.shadowOffsetX = this.panel.shadowOffsetX;
            ctx.shadowOffsetY = this.panel.shadowOffsetY;

            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.shadowColor = "transparent";
    }
}