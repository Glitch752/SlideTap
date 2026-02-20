import { MapNoteLayer } from "../Map";
import { Cursor } from "./Cursor";
import type { GameScene } from "./Game";
import { GameNode, NodeID } from "./types";

/**
 * An input layer represents a set of keys that control one type of note.  
 * There are two primary (titular...) interactions we track:
 * - "Sliding": moving between adjacent keys, creating movement - "sliding" on the keyboard "slides" the cursor between lanes.
 * - "Tapping": quickly pressing two or three keys at once to hit one, two, or three notes at once.
 */
class InputLayer {
    private lastKeyBitmask: number = 0;

    /** Positive numbers are countdowns while pressed; negative numbers count up after release. */
    private keyPressCountdown: number[] = [];
    private static readonly TAP_PRESS_DURATION_LIMIT = 0.2;
    private static readonly TAP_ADJACENT_LENIENCY = 0.05;
    private static readonly MIN_TAP_SIZE = 2;
    private static readonly MAX_TAP_SIZE = 3;

    constructor(private keys: string[], private layer: MapNoteLayer) {}

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
        const keyBitmask = this.getKeyBitmask(keysHeld);

        const pressed  = keyBitmask & ~this.lastKeyBitmask;
        const released = ~keyBitmask & this.lastKeyBitmask;

        // Tap logic
        for(const key of this.enumerate(pressed)) {
            this.keyPressCountdown[key] = InputLayer.TAP_PRESS_DURATION_LIMIT;
        }
        for(const key of this.enumerate(released)) {
            if(this.keyPressCountdown[key] > 0) {
                // Tap candidate
                this.keyPressCountdown[key] = -InputLayer.TAP_ADJACENT_LENIENCY;
            }
        }

        let tapped = false;
        for(let i = 0; i < this.keyPressCountdown.length; i++) {
            if(this.keyPressCountdown[i] > 0) {
                this.keyPressCountdown[i] -= deltaTime;
                if(this.keyPressCountdown[i] <= 0) {
                    this.keyPressCountdown[i] = 0;
                }
            } else if(this.keyPressCountdown[i] < 0) {
                this.keyPressCountdown[i] += deltaTime;
                if(this.keyPressCountdown[i] >= 0) {
                    this.keyPressCountdown[i] = 0;
                    // Check how many adjacent keys were also tapped (negative countdowns)
                    // If any adjacent keys were just pressed (positive countdown), cancel the tap
                    let tapSize = 1;
                    for(let j = i - 1; j >= 0; j--) {
                        if(this.keyPressCountdown[j] < 0) tapSize++;
                        else if(this.keyPressCountdown[j] > 0) {
                            tapSize = 0;
                            break;
                        }
                        else break;
                        this.keyPressCountdown[j] = 0;
                    }
                    if(tapSize === 0) continue; // Invalid tap due to intervening key press
                    for(let j = i + 1; j < this.keys.length; j++) {
                        if(this.keyPressCountdown[j] < 0) tapSize++;
                        else if(this.keyPressCountdown[j] > 0) {
                            tapSize = 0;
                            break;
                        }
                        else break;
                        this.keyPressCountdown[j] = 0;
                    }

                    if(tapSize >= InputLayer.MIN_TAP_SIZE && tapSize <= InputLayer.MAX_TAP_SIZE) {
                        // Valid tap!
                        context.tree.get<Cursor>(NodeID.Cursor)!.tap(tapSize, this.layer);
                        tapped = true;
                    }
                }
            }
        }

        // Pressed keys in either direction of a previously-held key create movement
        const pressedLeft  = pressed & this.lastKeyBitmask << 1;
        const pressedRight = pressed & this.lastKeyBitmask >> 1;
        
        const movement = this.count(pressedRight) - this.count(pressedLeft);

        if(movement !== 0 && !tapped) {
            context.tree.get<Cursor>(NodeID.Cursor)!.slide(movement, this.layer);
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