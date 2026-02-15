import type { GameScene } from "../Game";
import { GameNode } from "../types";
import * as THREE from "three";

export class Skybox extends GameNode {
    constructor() {
        // Simple horizon gradient
        const startColor = "#060D16";
        const endColor = "#000000";

        // Create a canvas to draw the gradient
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = size;
        const context = canvas.getContext('2d')!;

        // Create gradient from top (startColor) to bottom (endColor)
        const gradient = context.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, endColor);
        context.fillStyle = gradient;
        context.fillRect(0, 0, 1, size);

        // Use the canvas as a texture
        const texture = new THREE.Texture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;

        // Create a large sphere geometry for the skybox
        const geometry = new THREE.SphereGeometry(10000, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            depthWrite: false,
            fog: true
        });
        const skybox = new THREE.Mesh(geometry, material);

        super(skybox);
    }

    init(context: GameScene): void {
        context.scene.fog = new THREE.FogExp2(0x000000, 0.00015);
    }
}