import { GameNode } from "./types";

class InputLayer {
    constructor(private keys: string[]) {}

    public update(deltaTime: number) {

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

    private top = new InputLayer(this.keymap.top);
    private bottom = new InputLayer(this.keymap.bottom);

    private keysHeld: Set<string> = new Set();

    constructor() {
        super(null);

        this.setUpdates(true);
    }

    update(deltaTime: number): void {
        this.top.update(deltaTime);
        this.bottom.update(deltaTime);
    }

    onKeyDown(event: KeyboardEvent): void {
        this.keysHeld.add(event.key);
    }

    onKeyUp(event: KeyboardEvent): void {
        this.keysHeld.delete(event.key);
    }
}