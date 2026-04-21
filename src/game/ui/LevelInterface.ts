import { Renderer } from "../Renderer";
import { GameNode, NodeID } from "../types";
import * as THREE from "three";

export class LevelInterface extends GameNode {
    private debugTextValue: any = null;

    private get ui(): CanvasRenderingContext2D | null {
        return this.root.get<Renderer>(NodeID.Renderer)?.ui || null;
    }

    update(deltaTime: number): void {
        if(!this.ui) return;

        // TODO: Node-based UI

        this.ui.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);
        // this.ui.drawImage(this.context!.song.cover, 10, 10, 256, 256);

        

        
        if(this.debugTextValue !== null) {
            this.ui.font = "20px Arial";
            this.ui.fillStyle = "white";
            this.ui.textBaseline = "top";
            this.ui.fillText(this.debugTextValue, 10, 10);
        }
    }

    public debugText(value: any) {
        if(value instanceof THREE.Vector3) {
            value = `(${value.x.toFixed(2)}, ${value.y.toFixed(2)}, ${value.z.toFixed(2)})`;
        }
        if(typeof value === "number") {
            value = value.toFixed(3);
        }
        this.debugTextValue = value;
    }
}