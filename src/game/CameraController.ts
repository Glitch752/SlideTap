import { GameNode, NodeID } from "./types";
import * as THREE from 'three';
import { expSmooth, getExpSmoothAlpha } from '../lib/timing';
import { Renderer } from "./Renderer";
import { Cursor } from "./Cursor";
import { Lanes } from "./Lanes";

export class CameraController extends GameNode {
    private get camera() {
        return (this.parent as Renderer).camera!;
    }
    private get cursor() {
        return this.root.get<Cursor>(NodeID.Cursor)!;
    }

    constructor() {
        super(null);

        this.setUpdates(true);
    }

    private targetPos: THREE.Vector3 = new THREE.Vector3();
    private targetPos2: THREE.Vector3 = new THREE.Vector3();
    private easedTarget: THREE.Vector3 = new THREE.Vector3();
    private easedTarget2: THREE.Vector3 = new THREE.Vector3();
    private cameraTranslateAngleTarget: number = 0;
    private cameraTranslateAngle: number = 0;

    update(deltaTime: number): void {
        this.cursor.getCursorPositions(this.targetPos, this.targetPos2);
        this.easedTarget = this.easedTarget.lerp(this.targetPos, getExpSmoothAlpha(10, deltaTime));
        this.easedTarget2 = this.easedTarget2.lerp(this.targetPos2, getExpSmoothAlpha(10, deltaTime));

        const centerTarget = this.easedTarget.clone().lerp(this.easedTarget2, 0.5);
        
        // Set the target angle but maintain difrection in the case of ambiguity
        if(centerTarget.length() > 0.01) {
            // Set the angle target to the closest multiple of the target so we smooth in the right direction
            const centerTargetAngle = Math.atan2(centerTarget.z, centerTarget.x);
            this.cameraTranslateAngleTarget = centerTargetAngle + Math.round((this.cameraTranslateAngle - centerTargetAngle) / (Math.PI * 2)) * Math.PI * 2;
        }

        this.cameraTranslateAngle = expSmooth(this.cameraTranslateAngle, this.cameraTranslateAngleTarget, 5, deltaTime);

        const dot = this.targetPos.clone().setComponent(1, 0).normalize().dot(
            this.easedTarget2.clone().setComponent(1, 0).normalize()
        );
        const angleDiff = 1 - (dot * 0.5 + 0.5); // 1 when opposite, 0 when same
        this.camera.position
            .set(-angleDiff * Lanes.HIT_RADIUS, angleDiff * 50 + 10, 0)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.cameraTranslateAngle);
        
        this.camera.lookAt(centerTarget);
    }
}