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

    hidden: boolean = false;

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
    withHidden(hidden: boolean): this {
        this.hidden = hidden;
        return this;
    }

    constructor() {
        super(null);
    }

    withUpdate(fun: (self: this, deltaTime: number) => void): this {
        this.update = (deltaTime: number) => {
            fun(this, deltaTime);
        }
        this.setUpdates(true);
        return this;
    }

    private needsRelayout: boolean = true;
    setNeedsRelayout(layoutFullTree: boolean = true) {
        // TODO: This logic should really be more complicated, but we just invalidate the whole tree for now
        this.needsRelayout = true;
        if(this.parent && this.parent instanceof UINode) this.parent.setNeedsRelayout(layoutFullTree);
        for(const child of this.children) {
            if(child instanceof UINode && !child.needsRelayout) child.setNeedsRelayout(layoutFullTree);
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
    layoutChildren(): void {}

    render(ctx: CanvasRenderingContext2D): void {
        this.draw(ctx);
        if(this.hidden) return;

        for(const child of this.children) {
            if(child instanceof UINode) child.render(ctx);
        }
    }

    *getUiChildren(includeHidden: boolean = false): Generator<UINode> {
        for(const child of this.children) {
            if(child instanceof UINode) {
                if(includeHidden || !child.hidden) yield child;
            }
        }
    }

    draw(_ctx: CanvasRenderingContext2D): void {}
}

export class EmptyNode extends UINode {
    measure(available: Vector2): Vector2 {
        return new Vector2(this.targetWidth, this.targetHeight);
    }
}