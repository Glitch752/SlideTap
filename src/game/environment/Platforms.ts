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
                vertexColors: true
            });

            const platform = new THREE.Mesh(geometry, material);
            platform.position.set(x, y, z);
            container.add(platform);
        }

        // Center platform
        const centerGeometry = new THREE.CircleGeometry(50, 50);
        centerGeometry.rotateX(-Math.PI / 2);
        const centerMaterial = new THREE.MeshBasicMaterial({
            color: "#050B12",
            transparent: true,
            opacity: 0.5
        });
        const centerPlatform = new THREE.Mesh(centerGeometry, centerMaterial);
        centerPlatform.position.set(0, -80, 0);
        // Override depth sorting so the center is always drawn first
        centerPlatform.renderOrder = -1;

        container.add(centerPlatform);

        super(container);
    }
}