import { GameNode } from "./types";

export class Cursor extends GameNode {
    constructor() {
        super()

        this.setUpdates(true);
    }
}