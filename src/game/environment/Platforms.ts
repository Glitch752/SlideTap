import { GameNode } from "../types";
import * as THREE from "three";

export class Platforms extends GameNode {
    constructor() {
        const container = new THREE.Object3D();

        const platformCount = 40;
        const minRadius = 3000, maxRadius = 10000;
        const baseHeight = -2000, minHeight = 3000, maxHeight = 5000;
        const platformWidth = 500;
        const platformDepth = 500;

        for(let i = 0; i < platformCount; i++) {
            const angle = (i / platformCount) * Math.PI * 2 + Math.random() * (Math.PI * 2 / platformCount);
            const radius = minRadius + Math.random() * (maxRadius - minRadius);
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const height = minHeight + Math.random() * (maxHeight - minHeight);
            const y = baseHeight - minHeight / 2;

            // Gradient material
            const colorTop = new THREE.Color("#050B12");
            const colorBottom = new THREE.Color("#010203");
            const geometry = new THREE.BoxGeometry(platformWidth, height, platformDepth);

            // Vertex colors for gradient
            const colors = [];
            for (let v = 0; v < geometry.attributes.position.count; v++) {
                const posY = geometry.attributes.position.getY(v);
                const t = (posY + height / 2) / height;
                const color = colorTop.clone().lerp(colorBottom, 1 - t);
                colors.push(color.r, color.g, color.b);
            }
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            const material = new THREE.MeshBasicMaterial({
                vertexColors: true,
                transparent: true,
            });

            const platform = new THREE.Mesh(geometry, material);
            platform.position.set(x, y, z);
            platform.castShadow = false;
            platform.receiveShadow = false;
            container.add(platform);
        }

        super(container);
    }
}