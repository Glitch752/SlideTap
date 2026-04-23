import { Vector2 } from "three";
import { GameNode } from "../types";

export enum AlignMode {
    Start,
    Center,
    End,
    Stretch
}

export abstract class UINode extends GameNode {
    // Layout params
    targetWidth: number = 0;
    targetHeight: number = 0;
    flex: number = 0;
    horizontalAlign: AlignMode = AlignMode.Start;
    verticalAlign: AlignMode = AlignMode.Start;

    // Actual position
    x: number = 0;
    y: number = 0
    width: number = 0;
    height: number = 0;

    withTargetSize(width: number, height: number): this {
        this.targetWidth = width;
        this.targetHeight = height;
        return this;
    }
    withFlex(flex: number): this {
        this.flex = flex;
        return this;
    }
    withHorizontalAlign(align: AlignMode): this {
        this.horizontalAlign = align;
        return this;
    }
    withVerticalAlign(align: AlignMode): this {
        this.verticalAlign = align;
        return this;
    }

    constructor() {
        super(null);
    }

    private needsRelayout: boolean = true;
    setNeedsRelayout() {
        this.needsRelayout = true;
        let parent = this.parent;
        while(parent instanceof UINode) {
            parent.needsRelayout = true;
            parent = parent.parent;
        }
    }

    measure(available: Vector2): Vector2 {
        // By default, take up the target size (or available size if target is 0)
        return new Vector2(
            this.targetWidth || available.x,
            this.targetHeight || available.y
        );
    }

    alignInBox(x: number, y: number, width: number, height: number) {
        const measured = this.measure(new Vector2(width, height));
        this.width = measured.x;
        this.height = measured.y;
        switch(this.horizontalAlign) {
            case AlignMode.Start: this.x = x; break;
            case AlignMode.Center: this.x = x + (width - this.width) / 2; break;
            case AlignMode.End: this.x = x + width - this.width; break;
            case AlignMode.Stretch: this.x = x; this.width = width; break;
        }
        switch(this.verticalAlign) {
            case AlignMode.Start: this.y = y; break;
            case AlignMode.Center: this.y = y + (height - this.height) / 2; break;
            case AlignMode.End: this.y = y + height - this.height; break;
            case AlignMode.Stretch: this.y = y; this.height = height; break;
        }
    }

    layout() {
        if(this.needsRelayout) {
            this.layoutChildren();
            this.needsRelayout = false;
        }
    }
    abstract layoutChildren(): void;

    render(ctx: CanvasRenderingContext2D): void {
        for(const child of this.children) {
            if(child instanceof UINode) child.render(ctx);
        }

        this.draw(ctx);
    }

    draw(_ctx: CanvasRenderingContext2D): void {}
}