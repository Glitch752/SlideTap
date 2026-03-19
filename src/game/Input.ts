import { MapNoteLayer } from "../Map";
import { Cursor } from "./Cursor";
import type { GameScene } from "./Game";
import { GameNode, NodeID } from "./types";

/**
 * An input layer represents a set of keys that control one type of note.  
 * There are two primary (titular...) interactions we track:
 * - "Sliding": moving between adjacent keys, creating movement - "sliding" on the keyboard "slides" the cursor between lanes.
 * - "Tapping": pressing three adjacent keys at once (within a short time window)
 */
class InputLayer {
    private lastKeyBitmask: number = 0;

    /** Positive numbers are countdowns while pressed */
    private keyPressCountdown: number[] = [];
    private keyPressOffsets: number[] = [];
    private static readonly TAP_PRESS_DURATION_LIMIT = 0.05;
    private static readonly TAP_KEYS = 3;

    constructor(private keys: string[], private layer: MapNoteLayer) {
        this.keyPressCountdown = new Array(this.keys.length).fill(0);
    }

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
    private enumerate(bitmask: number): number[] {
        const indices = [];
        for(let i = 0; i < this.keys.length; i++) {
            if(this.check(bitmask, i)) {
                indices.push(i);
            }
        }
        return indices;
    }

    public debugLog(bitmask: number): string {
        const keysState = this.keys.map((key, i) => `${this.check(bitmask, i) ? "[" : " "}${key}${this.check(bitmask, i) ? "]" : " "}`).join(" ");
        return `${this.layer === MapNoteLayer.Primary ? "Primary" : "Background"}: ${keysState}`;
    }

    public update(deltaTime: number, keysHeld: Set<string>, context: GameScene) {
        const cursor = context.tree.get<Cursor>(NodeID.Cursor)!;
        const keyBitmask = this.getKeyBitmask(keysHeld);

        const pressed  = keyBitmask & ~this.lastKeyBitmask;
        const released = ~keyBitmask & this.lastKeyBitmask;

        // Tap logic
        let tapped = false;
        for(let i = 0; i < this.keyPressCountdown.length; i++) {
            if(this.keyPressCountdown[i] > 0) {
                this.keyPressCountdown[i] = Math.max(0, this.keyPressCountdown[i] - deltaTime);
            }
        }

        for(const key of this.enumerate(pressed)) {
            this.keyPressCountdown[key] = InputLayer.TAP_PRESS_DURATION_LIMIT;
            this.keyPressOffsets[key] = 0;

            // Check if there are now TAP_KEYS adjacent keys within the tap window
            for(let start = 0; start <= this.keys.length - InputLayer.TAP_KEYS; start++) {
                let allTapped = true;
                for(let offset = 0; offset < InputLayer.TAP_KEYS; offset++) {
                    if(
                        this.keyPressCountdown[start + offset] <= 0 ||
                        this.keyPressCountdown[start + offset] > InputLayer.TAP_PRESS_DURATION_LIMIT
                    ) {
                        allTapped = false;
                        break;
                    }
                }
                if(allTapped) {
                    cursor.tap(this.layer);

                    // Slide back to the original based on the offsets of the tapped keys
                    // (which show how much we've slid since the tap started)
                    let totalOffset = 0;
                    for(let offset = 0; offset < InputLayer.TAP_KEYS; offset++) {
                        totalOffset += this.keyPressOffsets[start + offset];
                    }
                    cursor.slide(-totalOffset, this.layer);
                    
                    tapped = true;
                    break;
                }
            }
        }
        for(const key of this.enumerate(released)) {
            this.keyPressCountdown[key] = 0;
        }

        // Pressed keys in either direction of a previously-held key create movement
        const pressedLeft  = pressed & this.lastKeyBitmask << 1;
        const pressedRight = pressed & this.lastKeyBitmask >> 1;

        // Add all the left/right presses to keyPressOffsets
        for(const key of this.enumerate(pressedLeft)) this.keyPressOffsets[key] -= 1;
        for(const key of this.enumerate(pressedRight)) this.keyPressOffsets[key] += 1;
        
        const movement = this.count(pressedRight) - this.count(pressedLeft);

        if(movement !== 0 && !tapped) {
            cursor.slide(movement, this.layer);
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

    private top = new InputLayer(this.keymap.top, MapNoteLayer.Background);
    private bottom = new InputLayer(this.keymap.bottom, MapNoteLayer.Primary);

    private keysHeld: Set<string> = new Set();

    constructor() {
        super(null);
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