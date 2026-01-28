import './index.scss';
import * as THREE from 'three/webgpu';

let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

const gameCanvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const uiCanvas = document.getElementById("uiCanvas") as HTMLCanvasElement;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let mesh: THREE.Mesh;
let renderer: THREE.WebGPURenderer;

(document.getElementById("settings") as HTMLDialogElement).show();

init();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#060d16");

    camera = new THREE.PerspectiveCamera(80, aspect, 1, 10000);
    camera.position.set(0, 0, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 1));
    scene.add(camera);

    mesh = new THREE.Mesh(
        new THREE.SphereGeometry(100, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
    );
    scene.add(mesh);

    renderer = new THREE.WebGPURenderer({
        antialias: true,
        canvas: gameCanvas
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.setAnimationLoop(animate);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    camera.aspect = aspect;
    camera.updateProjectionMatrix();
}


function animate() {
    render();
}

function render() {
    const r = Date.now() * 0.0005;

    mesh.position.x = 700 * Math.cos(r);
    mesh.position.y = 700 * Math.sin(r);
    mesh.position.z = 3000 + 700 * Math.sin(r);

    renderer.render(scene, camera);
}