import type { GameMap } from "../../Map";
import { GameNode, NodeID } from "../types";
import * as THREE from "three";
import { BaseNote } from "./BaseNote";
import type { GameScene } from "../Game";
import { Timer } from "../Timer";

export class Notes extends GameNode {
    private timer!: Timer;
    
    constructor(private map: GameMap | null) {
        const container = new THREE.Object3D();
        container.position.y = 0.5;
        super(container);
        
        this.callDeferred(() => this.regenerateNotes());
    }

    public setMap(map: GameMap | null) {
        this.map = map;
        this.regenerateNotes();
    }

    init(_context: GameScene): void {
        this.timer = this.root.get<Timer>(NodeID.Timer)!;
        this.timer.jumpedBackward.connect(() => {
            this.regenerateNotes();
        });
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
            if(note.endTime * this.context.song.bpm / 60 < this.timer.getElapsed()) {
                continue;
            }
            this.add(new BaseNote(note, this.context.song.bpm));
        }
    }
}