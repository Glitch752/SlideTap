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

export class GameScene implements Scene {
    public component = Game;

    public song: Song;
    public map: GameMap = null as any;

    public scene: THREE.Scene;
    public tree: NodeTree<THREE.Object3D, GameScene> = new NodeTree(this as GameScene, true);

    private startTime: number = 0;
    public get elapsed(): number {
        return Date.now() - this.startTime;
    }
    
    public init(): void {
        this.startTime = Date.now();
        connectParenting(this.tree, this.scene);

        this.tree.addChildren(
            // Logic
            new Input(),

            // Rendering
            new Lighting(),
            new Platforms(),
            new Skybox(),

            new Lanes(),

            // Renderer must be last so we update before drawing
            new Renderer()
        );
    }

    public static async load(song: Song, mapIndex: number): Promise<GameScene> {
        const scene = new GameScene(song, mapIndex);
        await scene.loadMap();
        return scene;
    }

    private async loadMap(): Promise<void> {
        this.map = await this.song.getMap(this.mapIndex);
    }

    protected constructor(song: Song, public mapIndex: number) {
        this.song = song;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("#060d16");
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
