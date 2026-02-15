import { FULL_LANES } from "./constants";
import { Cursor } from "./Cursor";
import { LaneVisualizer } from "./LaneVisualizer";
import { GameNode } from "./types";
import * as THREE from "three";

export class Lanes extends GameNode {
    public static readonly HIT_RADIUS = 50;

    constructor() {
        const outlineCircle = new THREE.TorusGeometry(Lanes.HIT_RADIUS, 0.1, 2, 64);
        outlineCircle.rotateX(-Math.PI / 2);
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: "#7777aa"
        });
        const outline = new THREE.Mesh(outlineCircle, outlineMaterial);
        outline.position.set(0, -30, 0);

        super(outline);

        this.add(
            new Cursor()
        );
        this.addLanes();
    }

    private addLanes() {
        for(let i = 0; i < FULL_LANES; i++) {
            const visualizer = new LaneVisualizer(i);
            visualizer.value!.rotation.y = (2 * Math.PI * i) / FULL_LANES;
            this.add(visualizer);
        }
    }
}