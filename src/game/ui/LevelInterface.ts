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

        const game = this.context;
        if(!game) return;
        if(game.controlledByEditor) return;
        
        // Health bar
        const barWidth = 300, barHeight = 24;
        const healthX = 20, healthY = 20;
        this.ui.save();
        this.ui.globalAlpha = 0.8;
        this.ui.fillStyle = '#222';
        this.ui.fillRect(healthX, healthY, barWidth, barHeight);
        this.ui.fillStyle = game.health > 30 ? '#4caf50' : '#e53935';
        this.ui.fillRect(healthX, healthY, (game.health / 100) * barWidth, barHeight);
        this.ui.strokeStyle = '#fff';
        this.ui.lineWidth = 2;
        this.ui.strokeRect(healthX, healthY, barWidth, barHeight);
        this.ui.globalAlpha = 1;
        this.ui.restore();

        // Score and combo
        this.ui.font = "20px Arial";
        this.ui.fillStyle = "white";
        this.ui.textBaseline = "top";
        this.ui.fillText(`Score: ${game.score}%`, healthX, healthY + barHeight + 10);
        this.ui.fillText(`Combo: ${game.combo}`, healthX, healthY + barHeight + 36);

        // Debug text
        if(this.debugTextValue !== null) {
            this.ui.font = "20px Arial";
            this.ui.fillStyle = "white";
            this.ui.textBaseline = "top";
            this.ui.fillText(this.debugTextValue, 10, this.ui.canvas.height - 30);
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