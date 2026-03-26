import { getNoteColor, type MapNote } from "../../Map";
import { lerp } from "../../utils/math";
import { FULL_LANES } from "../constants";
import { Lanes } from "../Lanes";
import type { Timer } from "../Timer";
import { Tween } from "../Tween";
import { GameNode, NodeID } from "../types";
import * as THREE from "three";

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
    private material: THREE.MeshBasicMaterial;

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

        const material = this.material = new THREE.MeshBasicMaterial({
            color: getNoteColor(note.type, note.layer),
            side: THREE.FrontSide,
            opacity: 0.8,
            transparent: true
        });

        // Custom shader for the uv to create a gradient going inward with consistent thickness
        material.onBeforeCompile = (shader) => {
            // idk wtf i'm doing i just want this to work
            shader.defines = {
                ...shader.defines,
                // Turn on uvs
                USE_UV: "",
                UV_HEIGHT: (note.endTime - note.startTime).toFixed(5),
                UV_TOP_WIDTH: (note.end.width).toFixed(5),
                UV_BOTTOM_WIDTH: (note.start.width).toFixed(5)
            };
            shader.fragmentShader = `uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
    
    // Custom code
    // Fade inward in both x and y to create a constant thickness fade
    float width = UV_BOTTOM_WIDTH + (UV_TOP_WIDTH - UV_BOTTOM_WIDTH) * (vUv.y / UV_HEIGHT);
    
    float fadeThickness = 0.4;
    
    float xFade = smoothstep(0.0, fadeThickness, vUv.x) * (1.0 - smoothstep(width - fadeThickness, width, vUv.x));
    // float yFade = smoothstep(0.0, fadeThickness, vUv.y) * (1.0 - smoothstep(UV_HEIGHT - fadeThickness, UV_HEIGHT, vUv.y));
    // float fade = min(xFade, yFade);
    // diffuseColor.a *= fade;
    diffuseColor = vec4(xFade, xFade, 1.0, diffuseColor.a);
    
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`;
        };


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