import type { GameMap } from "../../Map";
import { GameNode } from "../types";
import * as THREE from "three";
import { BaseNote } from "./BaseNote";

export class Notes extends GameNode {
    constructor(private map: GameMap | null) {
        const container = new THREE.Object3D();
        container.position.y = -0.5;
        super(container);
        
        this.callDeferred(() => this.regenerateNotes());
    }

    public setMap(map: GameMap | null) {
        this.map = map;
        this.regenerateNotes();
    }

    update(_deltaTime: number): void {
        
    }

    regenerateNotes() {
        this.clear();

        if(!this.map) return;
        
        if(!this.context?.song) return;

        // for(const note of this.map.notes) {
        for(let i = 0; i < this.map.notes.length; i++) {
            const note = this.map.notes[i];
            this.add(new BaseNote(note, this.context.song.bpm));
        }
    }
}