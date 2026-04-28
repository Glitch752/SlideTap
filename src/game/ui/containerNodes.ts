import { Vector2 } from "three";
import { UINode } from "./UINode";

/** A simple container node that lays out all children in itself, stacked on top of each other. */
export abstract class ContainerNode extends UINode {
    measure(available: Vector2): Vector2 {
        let maxWidth = 0, maxHeight = 0;
        for(const child of this.getUiChildren()) {
            const measured = child.measure(available);
            maxWidth = Math.max(maxWidth, measured.x);
            maxHeight = Math.max(maxHeight, measured.y);
        }
        return new Vector2(
            this.targetWidth || maxWidth,
            this.targetHeight || maxHeight
        );
    }
    
    layoutChildren(): void {
        for(const child of this.getUiChildren()) {
            child.alignInBox(this.x, this.y, this.width, this.height);
            child.layout();
        }
    }
}

export class StackContainer extends ContainerNode {}

/** A container node that lays out its children in a horizontal row based on the flex algorithm. */
export class RowFlexContainer extends ContainerNode {
    measure(available: Vector2): Vector2 {
        let totalFlex = 0;
        let fixedWidth = 0;
        let maxHeight = 0;
        for(const child of this.getUiChildren()) {
            if(child.flex > 0) {
                totalFlex += child.flex;
            } else {
                const measured = child.measure(available);
                fixedWidth += measured.x;
                maxHeight = Math.max(maxHeight, measured.y);
            }
        }
        return new Vector2(
            this.targetWidth || fixedWidth,
            this.targetHeight || maxHeight
        );
    }

    layoutChildren(): void {
        const totalFlex = Array.from(this.getUiChildren()).reduce((sum, child) => {
            return sum + child.flex;
        }, 0);
        let xOffset = this.x;
        // This is really inefficient, but whatever
        const extraWidth = this.width - Array.from(this.getUiChildren()).reduce((sum, child) => {
            return sum + child.measure(new Vector2(this.width, this.height)).x;
        }, 0);
        for(const child of this.getUiChildren()) {
            const childWidth = child.flex > 0 ? (child.flex / totalFlex) * extraWidth : child.measure(new Vector2(this.width, this.height)).x;
            child.alignInBox(xOffset, this.y, childWidth, this.height);
            child.layout();
            xOffset += child.width;
        }
    }
}

/** A container node that lays out its children in a vertical column based on the flex algorithm. */
export class ColumnFlexContainer extends ContainerNode {
    measure(available: Vector2): Vector2 {
        let totalFlex = 0;
        let fixedHeight = 0;
        let maxWidth = 0;
        for(const child of this.getUiChildren()) {
            if(child.flex > 0) {
                totalFlex += child.flex;
            } else {
                const measured = child.measure(available);
                fixedHeight += measured.y;
                maxWidth = Math.max(maxWidth, measured.x);
            }
        }
        return new Vector2(
            this.targetWidth || maxWidth,
            this.targetHeight || fixedHeight
        );
    }

    layoutChildren(): void {
        const totalFlex = Array.from(this.getUiChildren()).reduce((sum, child) => {
            return sum + child.flex;
        }, 0);
        let yOffset = this.y;
        // This is really inefficient, but whatever
        const extraHeight = this.height - Array.from(this.getUiChildren()).reduce((sum, child) => {
            return sum + child.measure(new Vector2(this.width, this.height)).y;
        }, 0);
        for(const child of this.getUiChildren()) {
            const childHeight = child.flex > 0 ? (child.flex / totalFlex) * extraHeight : child.measure(new Vector2(this.width, this.height)).y;
            child.alignInBox(this.x, yOffset, this.width, childHeight);
            child.layout();
            yOffset += child.height;
        }
    }
}

/** A container node that offsets its children visually but inherits their layout. Useful for things like animations. */
export class OffsetContainer extends ContainerNode {
    offsetX: number = 0;
    offsetY: number = 0;

    constructor(offsetX: number, offsetY: number) {
        super();
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    measure(available: Vector2): Vector2 {
        let maxWidth = 0, maxHeight = 0;
        for(const child of this.getUiChildren()) {
            const measured = child.measure(available);
            maxWidth = Math.max(maxWidth, measured.x);
            maxHeight = Math.max(maxHeight, measured.y);
        }
        return new Vector2(
            this.targetWidth || maxWidth,
            this.targetHeight || maxHeight
        );
    }

    layoutChildren(): void {
        for(const child of this.getUiChildren()) {
            child.alignInBox(this.x + this.offsetX, this.y + this.offsetY, this.width, this.height);
            child.layout();
        }
    }
}

/** A simple container node that lays out its children with the given margins */
export class MarginContainer extends ContainerNode {
    marginLeft: number = 0;
    marginRight: number = 0;
    marginTop: number = 0;
    marginBottom: number = 0;

    constructor(marginOrLeft: number, marginOrRight?: number, marginOrTop?: number, marginOrBottom?: number) {
        super();
        this.marginLeft = marginOrLeft;
        this.marginRight = marginOrRight !== undefined ? marginOrRight : marginOrLeft;
        this.marginTop = marginOrTop !== undefined ? marginOrTop : marginOrLeft;
        this.marginBottom = marginOrBottom !== undefined ? marginOrBottom : marginOrLeft;
    }

    measure(available: Vector2): Vector2 {
        if(this.targetWidth && this.targetHeight) return new Vector2(this.targetWidth, this.targetHeight);
        
        let maxWidth = 0, maxHeight = 0;
        const innerAvailable = new Vector2(
            Math.max(0, available.x - this.marginLeft - this.marginRight),
            Math.max(0, available.y - this.marginTop - this.marginBottom)
        );
        for(const child of this.getUiChildren()) {
            const measured = child.measure(innerAvailable);
            maxWidth = Math.max(maxWidth, measured.x);
            maxHeight = Math.max(maxHeight, measured.y);
        }
        return new Vector2(
            this.targetWidth || maxWidth + this.marginLeft + this.marginRight,
            this.targetHeight || maxHeight + this.marginTop + this.marginBottom
        );
    }

    layoutChildren(): void {
        const innerX = this.x + this.marginLeft;
        const innerY = this.y + this.marginTop;
        const innerWidth = Math.max(0, this.width - this.marginLeft - this.marginRight);
        const innerHeight = Math.max(0, this.height - this.marginTop - this.marginBottom);
        for(const child of this.getUiChildren()) {
            child.alignInBox(innerX, innerY, innerWidth, innerHeight);
            child.layout();
        }
    }
}