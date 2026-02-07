import type { GameMap } from "../../Map";
import type { Song } from "../../Song";
import { type Scene } from "../Scene";
import * as THREE from "three/webgpu";
import Game from "./Game.svelte";

export class GameScene implements Scene {
    public component = Game;

    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private mesh: THREE.Mesh;
    // private renderer: THREE.WebGPURenderer;
    
    private gameCanvas: HTMLCanvasElement | null = null;
    private uiCanvas: HTMLCanvasElement | null = null;
    private ui: CanvasRenderingContext2D | null = null;

    private screenWidth = window.innerWidth;
    private screenHeight = window.innerHeight;
    private aspect = this.screenWidth / this.screenHeight;

    private map: GameMap = null as any;

    private startTime: number = 0;
    private get elapsed(): number {
        return Date.now() - this.startTime;
    }

    public static async load(song: Song, mapIndex: number): Promise<GameScene> {
        const scene = new GameScene(song, mapIndex);
        await scene.loadMap();
        return scene;
    }

    private async loadMap(): Promise<void> {
        this.map = await this.song.getMap(this.mapIndex);
    }

    private constructor(private song: Song, private mapIndex: number) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("#060d16");

        this.camera = new THREE.PerspectiveCamera(80, this.aspect, 1, 10000);
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(new THREE.Vector3(0, 0, 1));
        this.scene.add(this.camera);

        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(100, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
        );
        this.scene.add(this.mesh);

        // this.renderer = new THREE.WebGPURenderer({
        //     antialias: true,
        //     canvas: this.gameCanvas
        // });
        // this.renderer.setPixelRatio(window.devicePixelRatio);
        // this.renderer.setSize(this.screenWidth, this.screenHeight);
        // this.renderer.setAnimationLoop(this.animate.bind(this));

        window.addEventListener('resize', this.resize.bind(this));
    }

    private resize() {
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.aspect = this.screenWidth / this.screenHeight;

        // this.renderer.setSize(this.screenWidth, this.screenHeight);

        this.camera.aspect = this.aspect;
        this.camera.updateProjectionMatrix();
    }


    public show(): void {
        this.startTime = Date.now();
    }

    public hide(): void {
        
    }

    private lastTime: number = 0;
    private animate(time: DOMHighResTimeStamp) {
        if(this.lastTime === 0) this.lastTime = time - (1000 / 60);
        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.renderScene(deltaTime);
        this.drawUi();
    }

    private renderScene(deltaTime: number) {
        const r = Date.now() * 0.0005;

        this.mesh.position.x = 700 * Math.cos(r);
        this.mesh.position.y = 700 * Math.sin(r);
        this.mesh.position.z = 3000 + 700 * Math.sin(r);

        // this.renderer.render(this.scene, this.camera);
    }

    private drawUi() {
        // this.ui.drawImage(this.song.cover, 10, 10, 256, 256);
    }
}