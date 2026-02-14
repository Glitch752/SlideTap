import type { GameMap } from "../Map";
import type { Song } from "../Song";
import { type Scene } from "../scenes/Scene";
import * as THREE from "three";
import Game from "../scenes/game/Game.svelte";
import { NodeTree } from "../lib/miniNodeTree";
import { Renderer } from "./Renderer";

export class GameScene implements Scene {
    public component = Game;

    public song: Song;
    public map: GameMap = null as any;

    public scene: THREE.Scene;
    public tree: NodeTree<THREE.Object3D, GameScene> = new NodeTree(this as GameScene);

    private startTime: number = 0;
    public get elapsed(): number {
        return Date.now() - this.startTime;
    }

    private mesh: THREE.Mesh;
    
    public init(): void {
        this.startTime = Date.now();

        this.tree.addChildren(
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

    private constructor(song: Song, public mapIndex: number) {
        this.song = song;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("#060d16");

        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(100, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
        );
        this.scene.add(this.mesh);
    }

    private lastTime: number = 0;
    public animate(time: DOMHighResTimeStamp) {
        if(this.lastTime === 0) this.lastTime = time - (1000 / 60);
        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        const r = Date.now() * 0.0005;

        this.mesh.position.x = 700 * Math.cos(r);
        this.mesh.position.y = 700 * Math.sin(r);
        this.mesh.position.z = 3000 + 700 * Math.sin(r);

        this.tree.updateRecursive(deltaTime);
    }
}
