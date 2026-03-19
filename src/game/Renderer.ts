import { CameraController } from "./CameraController";
import type { GameScene } from "./Game";
import { GameNode } from "./types";
import * as THREE from "three";
import { FlyControls } from "three/examples/jsm/Addons.js";

export class Renderer extends GameNode {
    private static readonly USE_CAMERA_CONTROLS: boolean = false;
    private controls: FlyControls | null = null;

    private gameCanvas: HTMLCanvasElement | null = null;
    private uiCanvas: HTMLCanvasElement | null = null;
    private ui: CanvasRenderingContext2D | null = null;

    private renderer: THREE.WebGLRenderer | null = null;
    
    private screenWidth = window.innerWidth;
    private screenHeight = window.innerHeight;
    private aspect = this.screenWidth / this.screenHeight;
    
    public camera: THREE.PerspectiveCamera | null = null;

    constructor() {
        super();

        this.add(new CameraController());
    }

    init(game: GameScene): void {
        this.camera = new THREE.PerspectiveCamera(80, this.aspect, 1, 12000);
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
        this.renderer.setAnimationLoop(game.animate.bind(game));

        // Use ResizeObserver to size viewport to the canvas element
        const resizeObserver = new ResizeObserver(() => this.resize());
        resizeObserver.observe(this.gameCanvas);

        // initial resize to match canvas size
        this.resize();

        if(Renderer.USE_CAMERA_CONTROLS) {
            this.controls = new FlyControls(this.camera, this.gameCanvas);
            this.controls.movementSpeed = 100;
            this.controls.rollSpeed = Math.PI / 6;
            this.controls.dragToLook = true;
        }
    }

    private resize() {
        if(!this.camera || !this.gameCanvas) return;

        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(1, this.gameCanvas.clientWidth);
        const height = Math.max(1, this.gameCanvas.clientHeight);

        this.screenWidth = width;
        this.screenHeight = height;
        this.aspect = width / height;

        if(this.renderer) {
            this.renderer.setPixelRatio(dpr);
            // let three manage backing buffer via setPixelRatio + setSize (do not update style)
            this.renderer.setSize(width, height, false);

            this.update(0);
        }

        this.camera.aspect = this.aspect;
        this.camera.updateProjectionMatrix();

        if(this.uiCanvas && this.ui) {
            // scale the 2D canvas for crisp drawing on high DPI
            this.uiCanvas.style.width = `${width}px`;
            this.uiCanvas.style.height = `${height}px`;
            this.uiCanvas.width = Math.round(width * dpr);
            this.uiCanvas.height = Math.round(height * dpr);
            this.ui.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
    }

    update(deltaTime: number): void {
        if(!this.camera) return;
        
        if(this.controls) {
            this.controls.update(deltaTime);
            // Remove roll from camera
            this.camera.up.set(0, 1, 0);
            const target = new THREE.Vector3();
            this.camera.getWorldDirection(target);
            target.add(this.camera.position);
            this.camera.lookAt(target);
        }

        if(this.renderer) this.renderer.render(this.context!.scene, this.camera);
        this.drawUi();
    }

    private debugTextValue: any = null;

    private drawUi() {
        if(!this.ui) return;

        this.ui.clearRect(0, 0, this.screenWidth, this.screenHeight);
        // this.ui.drawImage(this.context!.song.cover, 10, 10, 256, 256);
        
        if(this.debugTextValue !== null) {
            this.ui.font = "20px Arial";
            this.ui.fillStyle = "white";
            this.ui.textBaseline = "top";
            this.ui.fillText(this.debugTextValue, 10, 10);
        }
    }

    public debugText(value: any) {
        if(value instanceof THREE.Vector3) {
            value = `(${value.x.toFixed(2)}, ${value.y.toFixed(2)}, ${value.z.toFixed(2)})`;
        }
        if(typeof value === "number") {
            value = value.toFixed(3);
        }
        this.debugTextValue = value;
    }
}