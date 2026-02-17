import { GameNode, NodeID } from "./types";
import * as THREE from 'three';
import { expSmooth } from '../lib/timing';
import { Lanes } from "./Lanes";
import { Line2, LineGeometry, LineMaterial } from "three/examples/jsm/Addons.js";
import { FULL_LANES } from "./constants";
import { MapNoteType } from "../Map";

export class Cursor extends GameNode {
    /** In radians; doesn't wrap so we can smooth it. */
    public angle: number = 0;
    /** In radians; doesn't wrap. */
    public secondaryOffsetAngle: number = 0;

    /** In radians; the target angle. Doesn't wrap for smoothing. */
    public targetAngle: number = 0;
    /** In radians */
    public targetSecondaryOffsetAngle: number = 0;

    private cursorMesh: Line2;
    private secondaryCursorMesh: Line2;
    private container: THREE.Object3D;
    private secondaryContainer: THREE.Object3D;

    public getCursorPositions(primaryTarget: THREE.Vector3, secondaryTarget: THREE.Vector3) {
        this.cursorMesh.getWorldPosition(primaryTarget);
        this.secondaryCursorMesh.getWorldPosition(secondaryTarget);
    }

    constructor() {
        const container = new THREE.Object3D();
        const secondaryContainer = new THREE.Object3D();
        container.add(secondaryContainer);

        // Cone pointing cursor
        const geometry = new THREE.ConeGeometry(1.5, 4.0, 16);
        geometry.rotateZ(-Math.PI / 2);

        const lineGeometry = new LineGeometry();
        lineGeometry.fromEdgesGeometry(new THREE.EdgesGeometry(geometry));

        super(container);
        this.container = container;
        this.secondaryContainer = secondaryContainer;

        function createCursorMesh(color: string) {
            const matLine = new LineMaterial({
                color: new THREE.Color(color),
                linewidth: 0.2,
                worldUnits: true,
                dashed: false,
                alphaToCoverage: true
            });
            
            const mesh = new Line2(lineGeometry, matLine);
            mesh.computeLineDistances();
            mesh.position.set(Lanes.HIT_RADIUS - 7, 0, 0);
            return mesh;
        }

        this.cursorMesh = createCursorMesh("#ccc");
        this.secondaryCursorMesh = createCursorMesh("#fcc");
        this.secondaryCursorMesh.position.y = 2.0;
        
        container.add(this.cursorMesh);
        secondaryContainer.add(this.secondaryCursorMesh);

        this.setUpdates(true);
        this.setId(NodeID.Cursor);
    }

    public update(deltaTime: number) {
        this.angle = expSmooth(this.angle, this.targetAngle, 20, deltaTime);
        this.container.rotation.y = this.angle;
        
        this.secondaryOffsetAngle = expSmooth(this.secondaryOffsetAngle, this.targetSecondaryOffsetAngle, 20, deltaTime);
        this.secondaryContainer.rotation.y = this.secondaryOffsetAngle;
    }

    public move(laneDelta: number, type: MapNoteType) {
        const angle = 2 * Math.PI / FULL_LANES * laneDelta;
        if(type === MapNoteType.Background) {
            this.targetSecondaryOffsetAngle += angle;
        } else {
            this.targetAngle += angle;
        }
    }
}