import { FULL_LANES } from "./constants";
import { GameNode } from "./types";
import * as THREE from "three";

export class LaneVisualizer extends GameNode {
    constructor(public index: number) {
        const angle = (2 * Math.PI) / FULL_LANES;
        const radius = 500;

        // Construct a arc slice for this lane
        const segments = 10;
        const vertices = [];
        const colors = [];

        // center vertex
        vertices.push(0, 0, 0);
        colors.push(1, 1, 1, 1);
        
        // arc vertices
        for (let i = 0; i <= segments; i++) {
            const theta = (angle * i) / segments;
            const x = radius * Math.cos(theta);
            const y = radius * Math.sin(theta);
            vertices.push(x, y, 0);
            colors.push(1, 1, 1, 0); // fade outward
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
        
        // indices for triangle fan
        const indices = [];
        for (let i = 1; i <= segments; i++) {
            indices.push(0, i, i + 1);
        }
        geometry.setIndex(indices);
        geometry.rotateX(-Math.PI / 2);
        
        const material = new THREE.MeshBasicMaterial({
            color: "#7777aa",
            vertexColors: true,
            transparent: true,
            opacity: 0.0
        });
        const surface = new THREE.Mesh(geometry, material);
        surface.position.y = -5;

        super(surface);
    }
}