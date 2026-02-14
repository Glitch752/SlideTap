import { GameNode } from "../types";
import * as THREE from "three";

export class Lighting extends GameNode {
    constructor() {
        const container = new THREE.Object3D();

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        container.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        container.add(directionalLight);

        super(container);
    }
}