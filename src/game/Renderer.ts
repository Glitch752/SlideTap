import type { GameScene } from "./Game";
import { GameNode, NodeID } from "./types";
import * as THREE from "three";
import { FlyControls } from "three/examples/jsm/Addons.js";

export class Renderer extends GameNode {
    private static readonly USE_CAMERA_CONTROLS: boolean = true;
    private controls: FlyControls | null = null;

    private gameCanvas: HTMLCanvasElement | null = null;
    private uiCanvas: HTMLCanvasElement | null = null;
    private ui: CanvasRenderingContext2D | null = null;

    private renderer: THREE.WebGLRenderer | null = null;
    
    private screenWidth = window.innerWidth;
    private screenHeight = window.innerHeight;
    private aspect = this.screenWidth / this.screenHeight;
    
    private camera: THREE.PerspectiveCamera | null = null;

    constructor() {
        super();
        this.setId(NodeID.Renderer);
        this.setUpdates(true);
    }

    init(game: GameScene): void {
        this.camera = new THREE.PerspectiveCamera(80, this.aspect, 1, 10000);
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(new THREE.Vector3(0, 0, 1));
        game.scene.add(this.camera);

        this.gameCanvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        this.uiCanvas = document.getElementById("uiCanvas") as HTMLCanvasElement;
        this.ui = this.uiCanvas.getContext("2d");

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this.gameCanvas
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.screenWidth, this.screenHeight);
        this.renderer.setAnimationLoop(game.animate.bind(game));

        window.addEventListener('resize', this.resize.bind(this));

        if(Renderer.USE_CAMERA_CONTROLS) {
            this.controls = new FlyControls(this.camera, this.gameCanvas);
            this.controls.movementSpeed = 100;
            this.controls.rollSpeed = Math.PI / 6;
            this.controls.dragToLook = true;
        }
    }

    private resize() {
        if(!this.camera) return;

        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.aspect = this.screenWidth / this.screenHeight;

        if(this.renderer) this.renderer.setSize(this.screenWidth, this.screenHeight);

        this.camera.aspect = this.aspect;
        this.camera.updateProjectionMatrix();
    }

    update(deltaTime: number): void {
        if(!this.camera) return;
        
        if(this.controls) {
            this.controls.update(deltaTime);
        }

        if(this.renderer) this.renderer.render(this.context!.scene, this.camera);
        this.drawUi();
    }

    private drawUi() {
        if(!this.ui) return;

        this.ui.clearRect(0, 0, this.screenWidth, this.screenHeight);
        this.ui.drawImage(this.context!.song.cover, 10, 10, 256, 256);
    }
}