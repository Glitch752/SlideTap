import { GameScene } from "../game/Game";
import Editor from "./editor/Editor.svelte";

export class EditorScene extends GameScene {
    public component = Editor;

    constructor() {
        super(null as any, 0);
    }
}