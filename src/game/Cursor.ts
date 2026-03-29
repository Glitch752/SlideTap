import { GameNode, NodeID } from "./types";
import * as THREE from 'three';
import { expSmooth } from '../lib/timing';
import { Lanes } from "./Lanes";
import { Line2, LineGeometry, LineMaterial } from "three/examples/jsm/Addons.js";
import { FULL_LANES } from "./constants";
import { MapNoteLayer } from "../Map";
import type { Renderer } from "./Renderer";
import { Signal } from "../lib/miniNodeTree";
import { wrappingMod } from "../utils/math";
import type { GameScene } from "./Game";

export class Cursor extends GameNode {
    /** In radians; the target angle. Doesn't wrap for smoothing. */
    public targetAngle: number = 2 * Math.PI / FULL_LANES * 0.5;
    /** In radians */
    public targetSecondaryOffsetAngle: number = 0;

    /** In radians; doesn't wrap so we can smooth it. */
    public angle: number = this.targetAngle;
    /** In radians; doesn't wrap. */
    public secondaryOffsetAngle: number = this.targetSecondaryOffsetAngle;

    public get lane() {
        return wrappingMod(Math.floor(this.targetAngle / (2 * Math.PI) * FULL_LANES), FULL_LANES);
    }
    public get secondaryLane() {
        return wrappingMod(Math.floor((this.targetAngle + this.targetSecondaryOffsetAngle) / (2 * Math.PI) * FULL_LANES), FULL_LANES);
    }

    private cursorMesh: Line2;
    private secondaryCursorMesh: Line2;
    private container: THREE.Object3D;
    private secondaryContainer: THREE.Object3D;

    /** Signal<[lane]> */
    public tapped: Signal<[number, MapNoteLayer]> = new Signal();

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
        this.secondaryContainer.position.y = 2.0;
        
        container.add(this.cursorMesh);
        secondaryContainer.add(this.secondaryCursorMesh);

        this.setId(NodeID.Cursor);
    }

    public init(context: GameScene): void {
        // Set the cursor position to the center of the first note
        if(context.map && context.map.notes.length > 0) {
            const firstNote = context.map.notes[0];
            const lane = Math.round(firstNote.start.start + firstNote.start.width / 2);
            this.targetAngle = (lane + 0.5) / FULL_LANES * 2 * Math.PI;
        }
        this.angle = this.targetAngle;
    }

    public update(deltaTime: number) {
        this.angle = expSmooth(this.angle, this.targetAngle, 20, deltaTime);
        this.container.rotation.y = this.angle;
        
        this.secondaryOffsetAngle = expSmooth(this.secondaryOffsetAngle, this.targetSecondaryOffsetAngle, 20, deltaTime);
        this.secondaryContainer.rotation.y = this.secondaryOffsetAngle;
    }

    public slide(laneDelta: number, type: MapNoteLayer) {
        const angle = 2 * Math.PI / FULL_LANES * laneDelta;
        if(type === MapNoteLayer.Background) {
            this.targetSecondaryOffsetAngle += angle;
        } else {
            this.targetAngle += angle;
        }
    }

    public tap(type: MapNoteLayer) {
        // this.context!.tree.get<Renderer>(NodeID.Renderer)!
        //     .debugText(`Tap ${type === MapNoteLayer.Background ? "BG" : "Primary"} ${Date.now()}`);
        this.tapped(type === MapNoteLayer.Background ? this.secondaryLane : this.lane, type);
    }
}