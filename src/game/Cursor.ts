import { GameNode, NodeID } from "./types";
import * as THREE from 'three';
import { expSmooth } from '../lib/timing';
import { Lanes } from "./Lanes";
import { Line2, LineGeometry, LineMaterial } from "three/examples/jsm/Addons.js";

export class Cursor extends GameNode {
    /** In radians; doesn't wrap so we can smooth it. */
    public angle: number = 0;

    /** In radians; the target angle. Doesn't wrap for smoothing. */
    public targetAngle: number = 0;

    private cursor: Line2;

    public position(targetVector?: THREE.Vector3) {
        return this.cursor.getWorldPosition(targetVector ?? new THREE.Vector3());
    }

    constructor() {
        const container = new THREE.Object3D();

        // Cone pointing cursor
        const geometry = new THREE.ConeGeometry(1.5, 4.0, 16);
        geometry.rotateZ(-Math.PI / 2);

        const lineGeometry = new LineGeometry();
        lineGeometry.fromEdgesGeometry(new THREE.EdgesGeometry(geometry));

        const matLine = new LineMaterial({
            color: new THREE.Color("#ccc"),
            linewidth: 0.2,
            worldUnits: true,
            dashed: false,
            alphaToCoverage: true
        });

        super(container);

        this.cursor = new Line2(lineGeometry, matLine);
        this.cursor.computeLineDistances();
        this.cursor.scale.set( 1, 1, 1 );
        this.cursor.position.set(Lanes.HIT_RADIUS - 7, 0, 0);
        
        container.add(this.cursor);

        this.setUpdates(true);
        this.setId(NodeID.Cursor);
    }

    public update(deltaTime: number) {
        this.angle = expSmooth(this.angle, this.targetAngle, 30, deltaTime);
        this.value!.rotation.z = this.angle;
    }
}