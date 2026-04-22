import { MapNoteType, type GameMap } from "../../Map";
import { GameNode, NodeID } from "../types";
import * as THREE from "three";
import { BaseNote } from "./BaseNote";
import type { GameScene } from "../Game";
import { Timer } from "../Timer";
import { DamageNote, HoldNote, TapNote } from "./NoteTypes";
import type { Cursor } from "../Cursor";

export class Notes extends GameNode {
    private timer!: Timer;

    private static noteTypeMap = {
        [MapNoteType.Tap]: TapNote,
        [MapNoteType.Damage]: DamageNote,
        [MapNoteType.Hold]: HoldNote
    } as const;
    
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

        const cursor = this.root.get<Cursor>(NodeID.Cursor);
        cursor?.tapped.connect((lane, layer) => {
            // Dispatch to notes in range
            for(const note of this.children) (note as BaseNote).handleCursorTap();
        });
    }

    update(_deltaTime: number): void {
        
    }

    regenerateNotes() {
        this.clear();

        if(!this.map) return;
        if(!this.context?.song) return;

        const game = this.context;
        game.totalNotes = this.map.notes.length;
        game.hitNotes = 0;
        game.combo = 0;
        game.maxCombo = 0;
        game.failed = false;
        game.finished = false;
        game.health = 100;
        game.score = 0;

        for(let i = 0; i < this.map.notes.length; i++) {
            const note = this.map.notes[i];
            if(note.endTime * this.context.song.bpm / 60 < this.timer.getElapsed()) {
                continue;
            }
            this.add(new (Notes.noteTypeMap[note.type])(note, this.context.song.bpm));
        }
    }
}