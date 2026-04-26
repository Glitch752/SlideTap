import type { Object3D, Object3DEventMap } from "three";
import type { Node } from "../../lib/miniNodeTree";
import type { GameScene } from "../Game";
import { AlignMode, UINode } from "./UINode";
import { ContainerNode } from "./containerNodes";

/** A node for debugging that draws an outline and small type text around every child (recursively). */
export class DebugPanel extends ContainerNode {
    render(ctx: CanvasRenderingContext2D): void {
        super.render(ctx);

        // Draw after children so it appears on top
        ctx.save();
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.font = "10px monospace";
        this.forEachRecursive(child => {
            if(child instanceof UINode) DebugPanel.drawDebug(child, ctx);
        });
        ctx.restore();
    }

    public add(node: Node<Object3D<Object3DEventMap>, GameScene>): this {
        super.add(node);
        if(node instanceof UINode) {
            // Doesn't work with multiple children, but it doesn't really matter
            this.verticalAlign = node.verticalAlign;
            this.horizontalAlign = node.horizontalAlign;
            node.verticalAlign = node.horizontalAlign = AlignMode.Stretch;
        }
        return this;
    }

    private static drawDebug(node: UINode, ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = node instanceof ContainerNode ? "rgba(255, 0, 0, 0.5)" : "rgba(132, 0, 255, 0.5)";
        ctx.strokeRect(node.x, node.y, node.width, node.height);
        const label = `${node.constructor.name} (${Math.round(node.width)}x${Math.round(node.height)})`;
        ctx.textBaseline = "top";
        ctx.fillStyle = "#fff";
        ctx.fillText(label, node.x + 3, node.y + 3);
    }
}