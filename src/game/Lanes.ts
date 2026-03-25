import type { GameMap } from "../Map";
import { FULL_LANES } from "./constants";
import { Cursor } from "./Cursor";
import { LaneVisualizer } from "./LaneVisualizer";
import { Notes } from "./notes/Notes";
import { GameNode } from "./types";
import * as THREE from "three";

export class Lanes extends GameNode {
    public static readonly HIT_RADIUS = 50;
    private notes: Notes;

    constructor(private map: GameMap | null) {
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
        this.addVisualizers();

        this.add(this.notes = new Notes(this.map));
    }

    private addVisualizers() {
        for(let i = 0; i < FULL_LANES; i++) {
            const visualizer = new LaneVisualizer(i);
            this.add(visualizer);
        }
    }

    public setMap(map: GameMap | null) {
        this.map = map;
        this.notes.setMap(this.map);
    }
}