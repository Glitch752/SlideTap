import { GameNode, NodeID } from "./types";
import * as THREE from 'three';
import { getExpSmoothAlpha } from '../lib/timing';
import type { Renderer } from "./Renderer";
import { Cursor } from "./Cursor";

export class CameraController extends GameNode {
    private get camera() {
        return (this.parent as Renderer).camera;
    }
    private get cursor() {
        return this.root.get<Cursor>(NodeID.Cursor)!;
    }

    constructor() {
        super(null);

        this.setUpdates(true);
    }

    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private easedTarget: THREE.Vector3 = new THREE.Vector3();

    update(deltaTime: number): void {
        this.cursor.position(this.targetPos);
        this.easedTarget = this.easedTarget.lerp(this.targetPos, getExpSmoothAlpha(30, deltaTime));
        this.camera?.lookAt(this.easedTarget);
    }
}