import { MapNoteType } from "../Map";
import { Cursor } from "./Cursor";
import type { GameScene } from "./Game";
import { GameNode, NodeID } from "./types";

class InputLayer {
    private lastKeyBitmask: number = 0;

    constructor(private keys: string[], private type: MapNoteType) {}

    private getKeyBitmask(keysHeld: Set<string>): number {
        let bitmask = 0;
        this.keys.forEach((key, i) => {
            if(keysHeld.has(key.toLowerCase())) {
                bitmask |= 1 << i;
            }
        });
        return bitmask;
    }

    private check(bitmask: number, index: number): boolean {
        return (bitmask & (1 << index)) !== 0;
    }
    private count(bitmask: number): number {
        let count = 0;
        while(bitmask) {
            count += bitmask & 1;
            bitmask >>= 1;
        }
        return count;
    }

    public update(deltaTime: number, keysHeld: Set<string>, context: GameScene) {
        const keyBitmask = this.getKeyBitmask(keysHeld);

        const pressed = keyBitmask & ~this.lastKeyBitmask;
        const released = ~keyBitmask & this.lastKeyBitmask;

        // Pressed keys in either direction of a previously-held key create movement
        const pressedLeft = pressed >> 1 & this.lastKeyBitmask;
        const pressedRight = pressed << 1 & this.lastKeyBitmask;

        const movement = this.count(pressedRight) - this.count(pressedLeft);

        if(movement !== 0) {
            context.tree.get<Cursor>(NodeID.Cursor)!.move(movement, this.type);
        }

        this.lastKeyBitmask = keyBitmask;
    }
}

export class Input extends GameNode {
    // TODO: Add configuration support so we support other keyboard layouts
    private keymap: {
        top: string[],
        bottom: string[]
    } = {
        top: "WERTYUIO".split(""),
        bottom: "SDFGHJKL".split("")
    };

    private top = new InputLayer(this.keymap.top, MapNoteType.Background);
    private bottom = new InputLayer(this.keymap.bottom, MapNoteType.Primary);

    private keysHeld: Set<string> = new Set();

    constructor() {
        super(null);

        this.setUpdates(true);
        this.setId(NodeID.Input);
    }

    update(deltaTime: number): void {
        this.top.update(deltaTime, this.keysHeld, this.context!);
        this.bottom.update(deltaTime, this.keysHeld, this.context!);
    }

    onKeyDown(event: KeyboardEvent): void {
        this.keysHeld.add(event.key.toLowerCase());
    }

    onKeyUp(event: KeyboardEvent): void {
        this.keysHeld.delete(event.key.toLowerCase());
    }
}