import { songs } from "..";
import { type Scene } from "./Scene";
import * as THREE from "three/webgpu";

export class GameScene implements Scene {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private mesh: THREE.Mesh;
    private renderer: THREE.WebGPURenderer;
    
    private gameCanvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    private uiCanvas = document.getElementById("uiCanvas") as HTMLCanvasElement;
    private ui = this.uiCanvas.getContext("2d") as CanvasRenderingContext2D;

    private screenWidth = window.innerWidth;
    private screenHeight = window.innerHeight;
    private aspect = this.screenWidth / this.screenHeight;

    constructor() {
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

        this.renderer = new THREE.WebGPURenderer({
            antialias: true,
            canvas: this.gameCanvas
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.screenWidth, this.screenHeight);
        this.renderer.setAnimationLoop(this.animate.bind(this));

        window.addEventListener('resize', this.resize.bind(this));
    }

    private resize() {
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.aspect = this.screenWidth / this.screenHeight;

        this.renderer.setSize(this.screenWidth, this.screenHeight);

        this.camera.aspect = this.aspect;
        this.camera.updateProjectionMatrix();
    }


    public show(): void {
        
    }

    public hide(): void {
        
    }

    private animate() {
        this.renderScene();
        this.drawUi();
    }

    private renderScene() {
        const r = Date.now() * 0.0005;

        this.mesh.position.x = 700 * Math.cos(r);
        this.mesh.position.y = 700 * Math.sin(r);
        this.mesh.position.z = 3000 + 700 * Math.sin(r);

        this.renderer.render(this.scene, this.camera);
    }

    private drawUi() {
        for(const song of songs) {
            this.ui.drawImage(song.cover, 10, 10, 256, 256);
        }
    }
}