import { getNoteColor, type MapNote } from "../../Map";
import { lerp } from "../../utils/math";
import { FULL_LANES } from "../constants";
import { Lanes } from "../Lanes";
import type { Timer } from "../Timer";
import { Tween } from "../Tween";
import { GameNode, NodeID } from "../types";
import * as THREE from "three";
import noteFragment from "./noteFragment.frag?raw";
import noteVertex from "./noteVertex.vert?raw";

export class BaseNote extends GameNode {
    private beatToDistance(beat: number, elapsed: number) {
        const time = (beat / this.bpm) * 60 - elapsed;
        return time * 150 + Lanes.HIT_RADIUS;
    }
    private laneToAngle(lane: number) {
        return lane * Math.PI * 2 / FULL_LANES;
    }
    private polarToCart(theta: number, r: number): [number, number] {
        return [
            Math.cos(theta) * r,
            Math.sin(theta) * r
        ];
    }

    private constructVertices(elapsed: number): Float32Array {
        const note = this.note;
        
        const closeStart = this.laneToAngle(note.start.start);
        const closeEnd = this.laneToAngle(note.start.start + note.start.width);
        const farStart = this.laneToAngle(note.end.start);
        const farEnd = this.laneToAngle(note.end.start + note.end.width);
        const closeDist = Math.max(0, this.beatToDistance(note.startTime, elapsed));
        const farDist = Math.max(0, this.beatToDistance(note.endTime, elapsed));

        // Construct quads
        const vertices = [];
        for(let i = 0; i < this.quads; i++) {
            const t = i / (this.quads - 1);
            const innerTheta = lerp(closeStart, closeEnd, t);
            const innerR = closeDist;
            const outerTheta = lerp(farStart, farEnd, t);
            const outerR = farDist;

            const [innerX, innerY] = this.polarToCart(innerTheta, innerR);
            const [outerX, outerY] = this.polarToCart(outerTheta, outerR);

            vertices.push(innerX, 0, innerY);
            vertices.push(outerX, 0, outerY);
        }

        // // @ts-expect-error
        // if(!window["__debugVertices"]) {
        //     // @ts-expect-error
        //     window["__debugVertices"] = true;
        //     const canvas = document.createElement("canvas");
        //     canvas.width = 512;
        //     canvas.height = 512;
        //     const ctx = canvas.getContext("2d")!;
        //     ctx.fillStyle = "black";
        //     ctx.fillRect(0, 0, canvas.width, canvas.height);
        //     ctx.fillStyle = "red";
        //     for(let i = 0; i < vertices.length; i += 3) {
        //         const x = vertices[i] * 0.5;
        //         const y = vertices[i + 2] * 0.5;
        //         ctx.beginPath();
        //         console.log(x, y);
        //         ctx.arc(x + 256, y + 256, 5, 0, Math.PI * 2);
        //         ctx.fill();
        //     }
        //     canvas.style.zIndex = "10000";
        //     document.body.appendChild(canvas);
        // }
        
        return new Float32Array(vertices);
    }

    private vertices: THREE.Float32BufferAttribute;
    private quads: number;
    private material: THREE.ShaderMaterial;

    constructor(private note: MapNote, private bpm: number) {
        super(null);

        const quads = this.quads = 4 + Math.ceil(
            Math.max(note.start.width, note.end.width)
        ) * 2;

        const geometry = new THREE.BufferGeometry();

        const index = [];
        // Construct quads between each point on the inner and outer arc
        // The arc vertices are laid out as [bottom, top, bottom, top, ...]
        for(let i = 0; i < quads * 2 - 2; i += 2) {
            index.push(i, i + 2, i + 1);
            index.push(i + 1, i + 2, i + 3);
        }
        geometry.setIndex(index);

        this.vertices = new THREE.Float32BufferAttribute(
            new Float32Array(quads * 2 * 3), 3
        );
        this.vertices.setUsage(THREE.DynamicDrawUsage);
        this.vertices.needsUpdate = true;
        geometry.setAttribute("position", this.vertices);
        
        const uv = [];
        for(let i = 0; i < quads; i++) {
            const t = i / (quads - 1);
            const innerWidth = note.start.width * t;
            const outerWidth = note.end.width * t;
            uv.push(innerWidth, 0);
            uv.push(outerWidth, note.endTime - note.startTime);
        }
        geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));

        this.callDeferred(() => this.update(0));

        const material = this.material = new THREE.ShaderMaterial({
            side: THREE.FrontSide,
            opacity: 0.8,
            transparent: true,
            uniforms: {
                diffuse: { value: new THREE.Color(getNoteColor(note.type, note.layer)) },
                uv_height: { value: note.endTime - note.startTime },
                uv_top_width: { value: note.end.width },
                uv_bottom_width: { value: note.start.width }
            },
            vertexShader: noteVertex,
            fragmentShader: noteFragment
        });

        const mesh = new THREE.Mesh(geometry, material);
        // Turn off culling since it will be wrong
        mesh.frustumCulled = false;

        this.value = mesh;
    }

    update(_deltaTime: number): void {
        const elapsed = this.context?.tree.get<Timer>(NodeID.Timer)?.getElapsed() ?? 0;
        this.vertices.set(this.constructVertices(elapsed));
        this.vertices.needsUpdate = true;

        if(this.note.endTime / this.bpm * 60 < elapsed) {
            // this.removeFromParent();
            const tween = new Tween(this.material, "opacity", 0, 0.1);
            tween.complete.connect(() => this.removeFromParent());
            this.add(tween);
        }
    }
}