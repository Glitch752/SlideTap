import * as THREE from 'three';
import { expSmooth } from '../lib/timing';

export class Cursor extends THREE.Object3D {
    /** In radians; doesn't wrap so we can smooth it. */
    public angle: number = 0;

    /** In radians; the target angle. Doesn't wrap for smoothing. */
    public targetAngle: number = 0;

    constructor() {
        super();

        // Triangle pointing cursor with thickness 0.1
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, 0,
            1, 0.5, 0,
            1, -0.5, 0
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const mesh = new THREE.Mesh(geometry, material);
        this.add(mesh);

        mesh.position.set(1.0, 0, 0);
    }

    public update(deltaTime: number) {
        this.angle = expSmooth(this.angle, this.targetAngle, 30, deltaTime);
        this.rotation.z = this.angle;
    }
}