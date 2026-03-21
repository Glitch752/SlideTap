import { MapNoteLayer } from "../Map";
import { Settings, type LayerKeymap } from "../Settings";
import { Cursor } from "./Cursor";
import type { GameScene } from "./Game";
import { GameNode, NodeID } from "./types";

/**
 * An input layer represents a set of keys that control one type of note.  
 * There are two primary (titular...) interactions we track:
 * - "Sliding": moving between adjacent keys, creating movement - "sliding" on the keyboard "slides" the cursor between lanes.
 * - "Tapping": pressing multiple adjacent keys at once (within a short time window)
 */
class InputLayer {
    private lastSlideBitmask: number = 0;
    private previousTapHeldKeys: Set<string> = new Set();
        
    constructor(private keymap: LayerKeymap, private layer: MapNoteLayer) {
    }

    private getKeyBitmask(keysHeld: Set<string>): number {
        let bitmask = 0;
        this.keymap.slideKeys.forEach((key, i) => {
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
        for(let i = 0; i < this.keymap.slideKeys.length; i++) {
            if(this.check(bitmask, i)) {
                indices.push(i);
            }
        }
        return indices;
    }

    public debugLog(bitmask: number): string {
        const keysState = this.keymap.slideKeys.map((key, i) => `${this.check(bitmask, i) ? "[" : " "}${key}${this.check(bitmask, i) ? "]" : " "}`).join(" ");
        return `${this.layer === MapNoteLayer.Primary ? "Primary" : "Background"}: ${keysState}`;
    }

    public update(_deltaTime: number, keysHeld: Set<string>, context: GameScene) {
        const cursor = context.tree.get<Cursor>(NodeID.Cursor)!;

        // Slide
        const slideBitmask = this.getKeyBitmask(keysHeld);

        const pressed  = slideBitmask & ~this.lastSlideBitmask;

        // Pressed keys in either direction of a previously-held key create movement
        const pressedLeft  = pressed & (this.lastSlideBitmask << 1);
        const pressedRight = pressed & (this.lastSlideBitmask >> 1);

        const movement = this.count(pressedRight) - this.count(pressedLeft);

        if(movement !== 0) {
            cursor.slide(movement, this.layer);
        }

        this.lastSlideBitmask = slideBitmask;

        // Tap
        const tapHeldKeys = new Set<string>();
        this.keymap.tapKeys.forEach(key => {
            if(keysHeld.has(key.toLowerCase())) {
                tapHeldKeys.add(key.toLowerCase());
            }
        });

        // console.log(tapHeldKeys);

        const newlyTappedKeys = [...tapHeldKeys].filter(key => !this.previousTapHeldKeys.has(key));
        if(newlyTappedKeys.length > 0) {
            cursor.tap(this.layer);
        }

        this.previousTapHeldKeys = tapHeldKeys;
    }
}

export class Input extends GameNode {
    private bgLayer = new InputLayer(Settings.keymap.bg, MapNoteLayer.Background);
    private fgLayer = new InputLayer(Settings.keymap.fg, MapNoteLayer.Primary);

    private keysHeld: Set<string> = new Set();

    constructor() {
        super(null);
    }

    update(deltaTime: number): void {
        this.bgLayer.update(deltaTime, this.keysHeld, this.context!);
        this.fgLayer.update(deltaTime, this.keysHeld, this.context!);
    }

    onKeyDown(event: KeyboardEvent): void {
        this.keysHeld.add(event.key.toLowerCase());
        console.log(event.code);

        // If in any maps, prevent default
        for(const layer of [Settings.keymap.bg, Settings.keymap.fg]) {
            if(layer.slideKeys.some(key => key.toLowerCase() === event.key.toLowerCase()) ||
               layer.tapKeys.some(key => key.toLowerCase() === event.key.toLowerCase())) {
                event.preventDefault();
                break;
            }
        }
    }

    onKeyUp(event: KeyboardEvent): void {
        this.keysHeld.delete(event.key.toLowerCase());
    }
}