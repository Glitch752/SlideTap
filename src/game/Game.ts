import type { GameMap } from "../Map";
import type { Song } from "../Song";
import { type Scene } from "../scenes/Scene";
import * as THREE from "three";
import Game from "../scenes/game/Game.svelte";
import { connectParenting, NodeTree } from "../lib/miniNodeTree";
import { Renderer } from "./Renderer";
import { Skybox } from "./environment/Skybox";
import { Platforms } from "./environment/Platforms";
import { Lighting } from "./environment/Lighting";
import { Lanes } from "./Lanes";
import { Input } from "./Input";
import { NodeID } from "./types";
import { Timer } from "./Timer";

export class GameScene implements Scene {
    public component = Game;

    public song: Song | null;
    public map: GameMap | null = null;

    public scene: THREE.Scene;
    public tree: NodeTree<THREE.Object3D, GameScene> = new NodeTree(this as GameScene, true);
    
    public init(): void {
        connectParenting(this.tree, this.scene);

        this.tree.addChildren(
            // Logic
            new Timer().setId(NodeID.Timer),
            new Input().setId(NodeID.Input),

            // Rendering
            new Lighting(),
            new Platforms(),
            new Skybox(),

            new Lanes(this.map).setId(NodeID.Lanes),

            // Renderer must be last so we update before drawing
            new Renderer().setId(NodeID.Renderer)
        );

        if(!this.controlledByEditor) {
            // Begin playback
            const timer = this.tree.get<Timer>(NodeID.Timer)!;
            timer.startPlayback(this.song);
            timer.done.connect(() => {
                console.log("Level finished!");
                // TODO: Finish game, show results, wtv
            });
        }

        // @ts-expect-error
        window["tree"] = this.tree; // for debugging
    }

    private async loadMap(): Promise<void> {
        if(this.mapIndex < 0 || this.mapIndex >= (this.song?.maps.length ?? 0)) {
            console.warn("Invalid map index, not loading map");
            this.tree.get<Lanes>(NodeID.Lanes)?.setMap(null);
            return;
        }

        this.map = (await this.song?.getMap(this.mapIndex)) ?? null;
        this.tree.get<Lanes>(NodeID.Lanes)?.setMap(this.map);
        console.log("Map loaded:", this.map);
    }

    public static async load(song: Song, mapIndex: number): Promise<GameScene> {
        const scene = new GameScene(song, mapIndex);
        await scene.loadMap();
        return scene;
    }

    constructor(song: Song | null, public mapIndex: number, public controlledByEditor: boolean = false) {
        this.song = song;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("#060d16");
    }

    public setSong(song: Song, mapIndex: number) {
        this.song = song;
        this.mapIndex = mapIndex;
        this.loadMap();
    }

    private lastTime: number = 0;
    public animate(time: DOMHighResTimeStamp) {
        if(this.lastTime === 0) this.lastTime = time - (1000 / 60);
        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.tree.updateRecursive(deltaTime);
    }

    onKeyDown(event: KeyboardEvent): void {
        this.tree.get<Input>(NodeID.Input)!.onKeyDown(event);
    }
    onKeyUp(event: KeyboardEvent): void {
        this.tree.get<Input>(NodeID.Input)!.onKeyUp(event);
    }
}
