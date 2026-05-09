import { Vector2 } from "three";
import { Direction, UINode } from "./UINode";
import type { GameNode } from "../types";

/** A simple container node that lays out all children in itself, stacked on top of each other. */
export abstract class ContainerNode extends UINode {
    add(node: GameNode): this {
        super.add(node);
        this.setNeedsRelayout(false);
        return this;
    }
    remove(node: GameNode): void {
        super.remove(node);
        this.setNeedsRelayout(false);
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
            child.alignInBox(this.x, this.y, this.width, this.height);
            child.layout();
        }
    }
}

export class StackContainer extends ContainerNode {}

/** A container node that lays out its children in a row based on the flex algorithm. */
export class FlexContainer extends ContainerNode {
    direction: Direction;
    gap: number;

    constructor(gap: number = 0, direction: Direction = Direction.Row) {
        super();
        this.gap = gap;
        this.direction = direction;
    }

    measure(available: Vector2): Vector2 {
        let totalFlex = 0;
        let fixedPrimarySize = 0;
        let maxSecondarySize = 0;
        for(const child of this.getUiChildren()) {
            if(child.flex > 0) {
                totalFlex += child.flex;
            } else {
                const measured = child.measure(available);
                fixedPrimarySize += (this.direction == Direction.Row ? measured.x : measured.y) + this.gap;
                maxSecondarySize = Math.max(maxSecondarySize, this.direction == Direction.Row ? measured.y : measured.x);
            }
        }
        let flexSize = totalFlex > 0 ? this.gap * (totalFlex - 1) : 0;
        return new Vector2(
            this.targetWidth || (this.direction == Direction.Row ? fixedPrimarySize + flexSize : maxSecondarySize),
            this.targetHeight || (this.direction == Direction.Row ? maxSecondarySize : fixedPrimarySize + flexSize)
        );
    }

    layoutChildren(): void {
        const children = Array.from(this.getUiChildren());
        const totalFlex = children.reduce((sum, child) => sum + child.flex, 0);
        
        // Calculate fixed primary size (sum of non-flex children)
        let fixedPrimarySize = 0;
        const childMeasurements = new Map<any, number>();
        for(const child of children) {
            if(child.flex <= 0) {
                const measured = child.measure(new Vector2(this.width, this.height))[this.direction == Direction.Row ? 'x' : 'y'];
                childMeasurements.set(child, measured);
                fixedPrimarySize += measured + this.gap;
            }
        }
        
        // Extra primary size to distribute among flex children
        const extraPrimarySize = Math.max(0, (this.direction == Direction.Row ? this.width : this.height) - fixedPrimarySize);
        
        let offset = this.direction == Direction.Row ? this.x : this.y;
        for(const child of children) {
            const childSize = child.flex > 0 ? (child.flex / totalFlex) * extraPrimarySize : childMeasurements.get(child)!;
            const x = this.direction == Direction.Row ? offset : this.x;
            const y = this.direction == Direction.Row ? this.y : offset;
            const width = this.direction == Direction.Row ? childSize : this.width;
            const height = this.direction == Direction.Row ? this.height : childSize;
            
            child.alignInBox(x, y, width, height);
            child.layout();
            offset += (this.direction == Direction.Row ? child.width : child.height) + this.gap;
        }
    }
}

/** A container node that lays out its children in a vertical column based on the flex algorithm. */
export class ColumnFlexContainer extends FlexContainer {
    constructor(gap: number = 0) {
        super(gap, Direction.Column);
    }
}

/** A container node that lays out its children in a horizontal row based on the flex algorithm. */
export class RowFlexContainer extends FlexContainer {
    constructor(gap: number = 0) {
        super(gap, Direction.Row);
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

    constructor(marginOrLeft: number, right?: number, top?: number, bottom?: number) {
        super();
        this.marginLeft = marginOrLeft;
        this.marginRight = right !== undefined ? right : marginOrLeft;
        this.marginTop = top !== undefined ? top : marginOrLeft;
        this.marginBottom = bottom !== undefined ? bottom : marginOrLeft;
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